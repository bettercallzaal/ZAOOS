import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';

export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserByFid(session.fid);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
    custodyAddress: user.custody_address ?? null,
  });
}
