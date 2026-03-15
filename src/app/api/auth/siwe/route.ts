import { NextRequest, NextResponse } from 'next/server';
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveWalletSession } from '@/lib/auth/session';
import { getUserByAddress } from '@/lib/farcaster/neynar';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * GET — Generate a nonce for SIWE
 */
export async function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  return NextResponse.json({ nonce });
}

/**
 * POST — Verify SIWE signature + check allowlist + create session
 */
export async function POST(req: NextRequest) {
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
