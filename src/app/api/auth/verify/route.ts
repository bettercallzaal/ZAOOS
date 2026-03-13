import { NextRequest, NextResponse } from 'next/server';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveSession } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';

const appClient = createAppClient({
  ethereum: viemConnector(),
});

export async function POST(req: NextRequest) {
  try {
    const { message, signature, nonce, domain } = await req.json();

    if (!message || !signature || !nonce || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify SIWF signature
    const result = await appClient.verifySignInMessage({
      message,
      signature,
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

    // Check allowlist by FID and custody address
    const custodyAddress = user.custody_address;
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const allAddresses = [custodyAddress, ...verifiedAddresses];

    let gateResult = await checkAllowlist(fid);
    if (!gateResult.allowed) {
      // Try each address
      for (const addr of allAddresses) {
        gateResult = await checkAllowlist(undefined, addr);
        if (gateResult.allowed) {
          // Update allowlist entry with FID for faster future lookups
          break;
        }
      }
    }

    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Create session
    await saveSession({
      fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
    });

    return NextResponse.json({
      success: true,
      redirect: '/chat',
      user: {
        fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
      },
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
