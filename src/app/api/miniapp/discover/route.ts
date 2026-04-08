import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getFrameCatalog, getRelevantFrames } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mode = req.nextUrl.searchParams.get('mode') || 'catalog';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;

    if (mode === 'relevant') {
      const data = await getRelevantFrames(session.fid, limit);
      return NextResponse.json(data);
    }

    const data = await getFrameCatalog(limit, cursor);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[miniapp/discover] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch mini apps' }, { status: 500 });
  }
}
