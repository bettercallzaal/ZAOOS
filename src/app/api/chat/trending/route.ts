import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getTrendingFeed } from '@/lib/farcaster/neynar';
import { Cast } from '@/types';
import { logger } from '@/lib/logger';

const SOPHA_API = 'https://www.sopha.social/api/feed';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  time_window: z.enum(['1h', '6h', '12h', '24h']).default('24h'),
  cursor: z.string().optional(),
});

// In-memory cache (5-minute TTL)
let cachedData: { casts: TrendingCast[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

interface TrendingCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curatorInfo?: { fid: number; username: string; display_name: string; pfp_url: string };
  _source?: 'sopha' | 'neynar';
}

function rawToCast(c: Record<string, unknown>, source: 'sopha' | 'neynar'): TrendingCast {
  const author = c.author as Record<string, unknown> | undefined;
  const reactions = c.reactions as Record<string, unknown> | undefined;
  const replies = c.replies as Record<string, unknown> | undefined;

  return {
    hash: c.hash as string,
    author: {
      fid: (author?.fid as number) || 0,
      username: (author?.username as string) || '',
      display_name: (author?.display_name as string) || '',
      pfp_url: (author?.pfp_url as string) || '',
    },
    text: (c.text as string) || '',
    timestamp: (c.timestamp as string) || '',
    replies: { count: (replies?.count as number) || 0 },
    reactions: {
      likes_count: (reactions?.likes_count as number) || 0,
      recasts_count: (reactions?.recasts_count as number) || 0,
      likes: (reactions?.likes as { fid: number }[]) || [],
      recasts: (reactions?.recasts as { fid: number }[]) || [],
    },
    parent_hash: (c.parent_hash as string) || null,
    embeds: (c.embeds as Cast['embeds']) || [],
    _qualityScore: (c._qualityScore as number) || undefined,
    _category: (c._category as string) || undefined,
    _title: (c._title as string) || undefined,
    _summary: (c._summary as string) || undefined,
    _curatorInfo: (c._curatorInfo as TrendingCast['_curatorInfo']) || undefined,
    _source: source,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = {
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    time_window: req.nextUrl.searchParams.get('time_window') ?? undefined,
    cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { limit, time_window } = parsed.data;

  try {
    const now = Date.now();
    if (cachedData && (now - cachedData.fetchedAt) < CACHE_TTL) {
      return NextResponse.json(
        { casts: cachedData.casts.slice(0, limit), source: 'mixed' },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
      );
    }

    // Fetch both sources in parallel
    const [sophaResult, neynarResult] = await Promise.allSettled([
      fetch(SOPHA_API, { headers: { 'Accept': 'application/json' } }).then(r => r.ok ? r.json() : null),
      getTrendingFeed(30, time_window),
    ]);

    const allCasts: TrendingCast[] = [];
    const seenHashes = new Set<string>();

    // Add Sopha curated casts first (they have quality scores + editorial metadata)
    if (sophaResult.status === 'fulfilled' && sophaResult.value?.casts) {
      // Sort Sopha casts by date (newest first) instead of their default quality sort
      const sophaCasts = (sophaResult.value.casts as Record<string, unknown>[])
        .map(c => rawToCast(c, 'sopha'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Only include Sopha casts from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const cast of sophaCasts) {
        if (new Date(cast.timestamp) >= thirtyDaysAgo && !seenHashes.has(cast.hash)) {
          seenHashes.add(cast.hash);
          allCasts.push(cast);
        }
      }
    }

    // Add Neynar trending casts (always recent, high engagement)
    if (neynarResult.status === 'fulfilled' && neynarResult.value?.casts) {
      const neynarCasts = (neynarResult.value.casts as Record<string, unknown>[])
        .map(c => rawToCast(c, 'neynar'))
        .filter(c => c.reactions.likes_count >= 5 || c.reactions.recasts_count >= 2);

      for (const cast of neynarCasts) {
        if (!seenHashes.has(cast.hash)) {
          seenHashes.add(cast.hash);
          allCasts.push(cast);
        }
      }
    }

    // Sort all by timestamp (newest first)
    allCasts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Cache
    cachedData = { casts: allCasts, fetchedAt: now };

    return NextResponse.json(
      { casts: allCasts.slice(0, limit), source: 'mixed' },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (error) {
    logger.error('[trending] error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
