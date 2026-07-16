import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { searchFrames } from '@/lib/farcaster/neynar';
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
    // Defensively clamp: a non-numeric/negative limit falls back to the default
    // 20 (not NaN/negative passed downstream to Neynar), capped at 50.
    const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
    const limit = Math.min(Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : rawLimit, 50);
    const data = await searchFrames(parsed.data.q, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[miniapp/search] GET error:', err);
    return NextResponse.json({ error: 'Failed to search mini apps' }, { status: 500 });
  }
}
