import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SONGJAM_LEADERBOARD_BASE = 'https://songjamspace-leaderboard.logesh-063.workers.dev';

const QuerySchema = z.object({
  projectId: z.string().default('bettercallzaal_s2'),
  timeframe: z.enum(['all', 'daily', 'weekly']).default('all'),
});

// Cache for 60 seconds
let cache: { key: string; data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      projectId: url.searchParams.get('projectId') || undefined,
      timeframe: url.searchParams.get('timeframe') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const { projectId, timeframe } = parsed.data;
    const suffix = timeframe === 'all' ? '' : `_${timeframe}`;
    const endpoint = `${SONGJAM_LEADERBOARD_BASE}/${projectId}${suffix}`;
    const cacheKey = endpoint;

    // Check cache
    if (cache && cache.key === cacheKey && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const res = await fetch(endpoint);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 502 });
    }

    const data = await res.json();
    cache = { key: cacheKey, data, ts: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Songjam leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
