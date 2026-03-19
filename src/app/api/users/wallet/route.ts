import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';

export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserByFid(session.fid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
      custodyAddress: user.custody_address ?? null,
    });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
