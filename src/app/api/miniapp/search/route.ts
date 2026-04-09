import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { searchFrames } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ q: z.string().min(1).max(100) });

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse({ q: req.nextUrl.searchParams.get('q') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);
    const data = await searchFrames(parsed.data.q, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[miniapp/search] GET error:', err);
    return NextResponse.json({ error: 'Failed to search mini apps' }, { status: 500 });
  }
}
