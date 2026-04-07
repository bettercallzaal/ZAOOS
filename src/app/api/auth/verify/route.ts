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
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { logger } from '@/lib/logger';

const OPTIMISM_RPC_URL = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism-rpc.publicnode.com';

// Lazy-init: defer heavy viem/crypto setup to first request instead of module load.
// This prevents cold-start timeouts on Vercel Hobby (10s limit).
let _appClient: ReturnType<typeof createAppClient> | null = null;
function getAppClient() {
  if (!_appClient) {
    _appClient = createAppClient({
      ethereum: viemConnector({
        rpcUrl: OPTIMISM_RPC_URL,
      }),
    });
  }
  return _appClient;
}

const NONCE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * GET — Generate a nonce for SIWF
 * Stored in Supabase (persistent across serverless instances)
 */
export async function GET() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + NONCE_TTL).toISOString();

  await supabaseAdmin
    .from('auth_nonces')
    .insert({ nonce, expires_at: expiresAt });

  // Prune expired nonces (fire and forget)
  supabaseAdmin
    .from('auth_nonces')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .then(() => {}, () => {});

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

    // Validate nonce exists but don't delete yet — if the function times out during
    // SIWF verification, the nonce stays valid so the client can retry.
    const { data: nonceRow } = await supabaseAdmin
      .from('auth_nonces')
      .select('nonce')
      .eq('nonce', nonce)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!nonceRow) {
      return NextResponse.json({ error: 'Invalid or expired nonce. Please try signing in again.' }, { status: 400 });
    }

    // Verify SIWF signature
    let result;
    try {
      result = await getAppClient().verifySignInMessage({
        message,
        signature: signature as `0x${string}`,
        nonce,
        domain,
      });
    } catch (verifyError) {
      logger.error('[Auth] SIWF verification RPC/network error:', verifyError);
      return NextResponse.json(
        { error: 'Verification service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    if (result.isError || !result.success) {
      logger.warn('[Auth] SIWF signature verification failed:', result.error || 'unknown');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const fid = result.fid;
    if (!fid || typeof fid !== 'number') {
      logger.error('[Auth] SIWF verified but no FID returned:', { fid, success: result.success });
      return NextResponse.json({ error: 'Verification succeeded but no Farcaster ID found. Please try again.' }, { status: 502 });
    }

    // Consume nonce + fetch user + check allowlist by FID — all in parallel
    const [, userResult, gateByFidResult] = await Promise.allSettled([
      supabaseAdmin.from('auth_nonces').delete().eq('nonce', nonce),
      getUserByFid(fid),
      checkAllowlist(fid),
    ]);

    if (userResult.status === 'rejected') {
      logger.error('[Auth] Neynar getUserByFid failed for FID', fid, userResult.reason);
      return NextResponse.json(
        { error: 'Could not fetch your Farcaster profile. Please try again.' },
        { status: 502 }
      );
    }
    const user = userResult.value;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check allowlist — try FID result first, then fall back to address check
    const custodyAddress = user.custody_address;
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const allAddresses = [custodyAddress, ...verifiedAddresses];

    let gateResult = gateByFidResult.status === 'fulfilled' ? gateByFidResult.value : null;
    try {
      if (!gateResult?.allowed) {
        for (const addr of allAddresses) {
          if (!addr) continue;
          gateResult = await checkAllowlist(undefined, addr);
          if (gateResult.allowed) break;
        }
      }
    } catch (allowlistErr) {
      logger.error('[Auth] Allowlist check failed for FID', fid, allowlistErr);
      return NextResponse.json(
        { error: 'Could not verify membership. Please try again.' },
        { status: 502 }
      );
    }

    if (!gateResult?.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Create session — store wallet address from Farcaster profile for consistency
    const primaryWallet = user.custody_address || verifiedAddresses[0] || '';
    try {
      await saveSession({
        fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        walletAddress: primaryWallet || undefined,
        authMethod: 'farcaster',
        signerUuid: null,
      });
    } catch (sessionErr) {
      logger.error('[Auth] Failed to save session for FID', fid, sessionErr);
      return NextResponse.json(
        { error: 'Could not create session. Please try again.' },
        { status: 500 }
      );
    }

    // Upsert user record (fire and forget — don't block the login response)
    const wallet = (primaryWallet || '').toLowerCase();
    if (wallet) {
      (async () => {
        try {
          const { data: existingByFid } = await supabaseAdmin
            .from('users')
            .select('last_login_at')
            .eq('fid', fid)
            .maybeSingle();

          const { data: existingByWallet } = !existingByFid ? await supabaseAdmin
            .from('users')
            .select('last_login_at')
            .eq('primary_wallet', wallet)
            .maybeSingle() : { data: existingByFid };

          const existingUser = existingByFid || existingByWallet;
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
              }).catch((err) => logger.error('[notify]', err));
            }

            const handle = user.username ? `@${user.username}` : (user.display_name || 'a new member');
            autoCastToZao(
              `Welcome ${handle} to The ZAO! \u{1F3B6}`,
            ).catch((err) => logger.error('[welcome-cast]', err));
          }
        } catch (err) {
          logger.error('[Auth] Failed to upsert user record:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      redirect: '/home',
    });
  } catch (error) {
    logger.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
