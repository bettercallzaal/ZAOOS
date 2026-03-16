import { NextRequest, NextResponse } from 'next/server';
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

// In-memory nonce store with expiry (5 min TTL, max 10k entries)
const NONCE_TTL = 5 * 60 * 1000;
const MAX_NONCES = 10_000;
const nonceStore = new Map<string, number>(); // nonce → created timestamp

function pruneNonces() {
  if (nonceStore.size <= MAX_NONCES) return;
  const now = Date.now();
  for (const [n, ts] of nonceStore) {
    if (now - ts > NONCE_TTL) nonceStore.delete(n);
  }
}

/**
 * GET — Generate a nonce for SIWE
 */
export async function GET() {
  pruneNonces();
  const nonce = crypto.randomUUID().replace(/-/g, '');
  nonceStore.set(nonce, Date.now());
  return NextResponse.json({ nonce });
}

/**
 * POST — Verify SIWE signature + check allowlist + create session
 */
export async function POST(req: NextRequest) {
  pruneNonces();
  try {
    const { message, signature } = await req.json();

    if (!message || !signature) {
      return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
    }

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
    const nonceTs = nonceStore.get(nonce);
    if (!nonceTs || Date.now() - nonceTs > NONCE_TTL) {
      nonceStore.delete(nonce);
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }
    nonceStore.delete(nonce); // consume — prevents replay

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
      signature,
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
