import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveWalletSession } from '@/lib/auth/session';
import { getUserByAddress } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const NONCE_TTL = 5 * 60 * 1000;

/**
 * GET — Generate a nonce for SIWE
 * Stored in Supabase (persistent across serverless instances)
 */
export async function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + NONCE_TTL).toISOString();

  await supabaseAdmin
    .from('auth_nonces')
    .insert({ nonce, expires_at: expiresAt });

  supabaseAdmin
    .from('auth_nonces')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .then(() => {}, () => {});

  return NextResponse.json({ nonce });
}

/**
 * POST — Verify SIWE signature + check allowlist + create session
 */
const siweSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  pruneNonces();
  try {
    const body = await req.json();
    const parsed = siweSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, signature } = parsed.data;

    // Parse and validate the SIWE message
    const siweMessage = parseSiweMessage(message);
    if (!siweMessage.address) {
      return NextResponse.json({ error: 'Invalid SIWE message' }, { status: 400 });
    }

    // Validate and consume nonce (one-time use)
    const nonce = siweMessage.nonce;
    if (!nonce) {
      return NextResponse.json({ error: 'Missing nonce' }, { status: 400 });
    }
    const { data: nonceRow } = await supabaseAdmin
      .from('auth_nonces')
      .select('nonce, expires_at')
      .eq('nonce', nonce)
      .maybeSingle();

    if (!nonceRow || new Date(nonceRow.expires_at) < new Date()) {
      if (nonceRow) await supabaseAdmin.from('auth_nonces').delete().eq('nonce', nonce);
      return NextResponse.json({ error: 'Invalid or expired nonce. Please try again.' }, { status: 400 });
    }
    await supabaseAdmin.from('auth_nonces').delete().eq('nonce', nonce); // consume — prevents replay

    // Validate domain matches
    const expectedDomain = req.headers.get('host') || '';
    if (siweMessage.domain !== expectedDomain) {
      return NextResponse.json({ error: 'Domain mismatch' }, { status: 400 });
    }

    // Validate message hasn't expired
    const valid = validateSiweMessage({
      message: siweMessage,
    });
    if (!valid) {
      return NextResponse.json({ error: 'SIWE message expired or invalid' }, { status: 400 });
    }

    // Verify the signature (supports EOA + smart contract wallets via ERC-1271)
    const verified = await publicClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature: signature as `0x${string}`,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const walletAddress = siweMessage.address.toLowerCase();

    // Check allowlist by wallet address
    const gateResult = await checkAllowlist(undefined, walletAddress);
    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Try to resolve Farcaster identity from wallet address
    let fid: number | undefined;
    let username: string | undefined;
    let displayName: string | undefined;
    let pfpUrl: string | undefined;

    try {
      const fcUser = await getUserByAddress(walletAddress);
      if (fcUser) {
        fid = fcUser.fid;
        username = fcUser.username;
        displayName = fcUser.display_name;
        pfpUrl = fcUser.pfp_url;
      }
    } catch {
      // Non-critical: wallet user may not have Farcaster account
    }

    // Create session
    await saveWalletSession({
      walletAddress,
      fid,
      username,
      displayName,
      pfpUrl,
    });

    // Upsert user record — atomic to prevent race conditions on concurrent logins
    try {
      await supabaseAdmin.from('users').upsert(
        {
          primary_wallet: walletAddress,
          fid: fid || null,
          username: username || null,
          display_name: displayName || walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
          pfp_url: pfpUrl || null,
          role: fid ? 'member' : 'beta',
          last_login_at: new Date().toISOString(),
        },
        { onConflict: 'primary_wallet' }
      );
    } catch (err) {
      // Non-critical — session is still valid
      console.error('[Auth] Failed to upsert user record:', err);
    }

    return NextResponse.json({
      success: true,
      redirect: '/chat',
      hasFarcaster: !!fid,
    });
  } catch (error) {
    console.error('SIWE verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
