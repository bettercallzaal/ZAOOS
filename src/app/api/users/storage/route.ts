import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getStorageUsage } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getStorageUsage(session.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('Storage usage fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch storage usage' }, { status: 500 });
  }
}
