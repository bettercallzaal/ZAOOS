import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { followUser, unfollowUser } from '@/lib/farcaster/neynar';

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const { targetFid } = await request.json();
  if (!targetFid || typeof targetFid !== 'number') {
    return NextResponse.json({ error: 'Invalid target FID' }, { status: 400 });
  }

  try {
    await followUser(session.signerUuid, [targetFid]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const { targetFid } = await request.json();
  if (!targetFid || typeof targetFid !== 'number') {
    return NextResponse.json({ error: 'Invalid target FID' }, { status: 400 });
  }

  try {
    await unfollowUser(session.signerUuid, [targetFid]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unfollow error:', err);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }
}
