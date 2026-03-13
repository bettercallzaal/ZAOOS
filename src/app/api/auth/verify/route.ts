import { NextRequest, NextResponse } from 'next/server';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveSession } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';

export async function POST(req: NextRequest) {
  try {
    const { fid, username, displayName, pfpUrl, signerUuid } = await req.json();

    if (!fid) {
      return NextResponse.json({ error: 'Missing FID' }, { status: 400 });
    }

    // Verify user exists on Farcaster via Neynar
    const user = await getUserByFid(fid);
    if (!user) {
      return NextResponse.json({ error: 'User not found on Farcaster' }, { status: 404 });
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

    // Create session with signer from SIWN
    await saveSession({
      fid,
      username: username || user.username,
      displayName: displayName || user.display_name,
      pfpUrl: pfpUrl || user.pfp_url,
      signerUuid: signerUuid || null,
    });

    return NextResponse.json({
      success: true,
      redirect: '/chat',
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
