import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveSession } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { communityConfig } from '@/../community.config';

const appClient = createAppClient({
  ethereum: viemConnector(),
});

// In-memory nonce store with expiry (5 min TTL, max 10k entries)
const NONCE_TTL = 5 * 60 * 1000;
const MAX_NONCES = 10_000;
const nonceStore = new Map<string, number>(); // nonce → created timestamp

function pruneNonces() {
  const now = Date.now();
  for (const [n, ts] of nonceStore) {
    if (now - ts > NONCE_TTL) nonceStore.delete(n);
  }
}

/**
 * GET — Generate a nonce for SIWF
 */
export async function GET() {
  pruneNonces();
  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore.set(nonce, Date.now());
  return NextResponse.json({ nonce });
}

/**
 * POST — Verify SIWF signature + check allowlist + create session
 */
const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  nonce: z.string().min(1),
  domain: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, signature, nonce, domain } = parsed.data;

    // Validate server-issued nonce (one-time use, 5 min TTL)
    const nonceTimestamp = nonceStore.get(nonce);
    if (!nonceTimestamp || Date.now() - nonceTimestamp > NONCE_TTL) {
      nonceStore.delete(nonce);
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }
    nonceStore.delete(nonce); // One-time use — prevents replay

    // Verify SIWF signature
    const result = await appClient.verifySignInMessage({
      message,
      signature: signature as `0x${string}`,
      nonce,
      domain,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const fid = result.fid;

    // Get user profile from Neynar
    const user = await getUserByFid(fid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check allowlist by FID and all addresses
    const custodyAddress = user.custody_address;
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const allAddresses = [custodyAddress, ...verifiedAddresses];

    let gateResult = await checkAllowlist(fid);
    if (!gateResult.allowed) {
      for (const addr of allAddresses) {
        if (!addr) continue;
        gateResult = await checkAllowlist(undefined, addr);
        if (gateResult.allowed) break;
      }
    }

    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Create session — store wallet address from Farcaster profile for consistency
    const primaryWallet = user.custody_address || verifiedAddresses[0] || '';
    await saveSession({
      fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      walletAddress: primaryWallet || undefined,
      authMethod: 'farcaster',
      signerUuid: null,
    });

    // Upsert user record — atomic to prevent race conditions on concurrent logins
    try {
      const wallet = (primaryWallet || '').toLowerCase();
      if (wallet) {
        // Check for existing user THEN upsert — single read avoids the old
        // separate-query race where concurrent logins could both see null
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('last_login_at')
          .eq('primary_wallet', wallet)
          .maybeSingle();

        const isFirstLogin = !existingUser?.last_login_at;

        await supabaseAdmin.from('users').upsert(
          {
            primary_wallet: wallet,
            fid,
            username: user.username,
            display_name: user.display_name,
            pfp_url: user.pfp_url,
            custody_address: custodyAddress,
            verified_addresses: verifiedAddresses,
            bio: user.profile?.bio?.text || null,
            role: 'member',
            last_login_at: new Date().toISOString(),
          },
          { onConflict: 'primary_wallet', ignoreDuplicates: false }
        );

        // Notify admins on first-time member login (fire and forget)
        if (isFirstLogin) {
          const adminFids = communityConfig.adminFids || [];
          if (adminFids.length > 0) {
            createInAppNotification({
              recipientFids: [...adminFids],
              type: 'member',
              title: 'New member joined ZAO OS',
              body: `${user.display_name || user.username || 'A new user'} logged in for the first time`,
              href: '/admin',
              actorFid: fid,
              actorDisplayName: user.display_name,
              actorPfpUrl: user.pfp_url,
            }).catch((err) => console.error('[notify]', err));
          }
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to upsert user record:', err);
    }

    return NextResponse.json({
      success: true,
      redirect: '/chat',
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
