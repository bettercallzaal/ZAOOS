import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@farcaster/quick-auth';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { saveSession } from '@/lib/auth/session';

const quickAuthClient = createClient();

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = await quickAuthClient.verifyJwt({
      token,
      domain: 'zaoos.com',
    });

    const fid = Number(payload.sub);

    // Get user profile from Neynar
    const neynarUser = await getUserByFid(fid);

    // Check allowlist
    const gate = await checkAllowlist(fid);
    let hasAccess = gate.allowed;

    // If not found by FID, check by wallet addresses
    if (!hasAccess && neynarUser?.verified_addresses?.eth_addresses) {
      for (const addr of neynarUser.verified_addresses.eth_addresses) {
        const walletCheck = await checkAllowlist(undefined, addr);
        if (walletCheck.allowed) {
          hasAccess = true;
          break;
        }
      }
    }

    // If allowed, create a session
    if (hasAccess) {
      await saveSession({
        fid,
        username: neynarUser?.username || '',
        displayName: neynarUser?.display_name || '',
        pfpUrl: neynarUser?.pfp_url || '',
      });
    }

    return NextResponse.json({
      fid,
      hasAccess,
      username: neynarUser?.username || '',
      displayName: neynarUser?.display_name || '',
      pfpUrl: neynarUser?.pfp_url || '',
    });
  } catch (error) {
    console.error('Mini app auth error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
