import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getNotifications, markNotificationsSeen } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const data = await getNotifications(session.fid, cursor, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('Farcaster notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  try {
    await markNotificationsSeen(session.signerUuid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Mark notifications seen error:', err);
    return NextResponse.json({ error: 'Failed to mark notifications seen' }, { status: 500 });
  }
}
