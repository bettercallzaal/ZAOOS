import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getTrendingTopics } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10', 10), 25);
    const data = await getTrendingTopics(limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[trending-topics] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch trending topics' }, { status: 500 });
  }
}
