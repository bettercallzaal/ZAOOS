import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getTrendingFeed } from '@/lib/farcaster/neynar';
import { fetchSophaFeed, SophaCast } from '@/lib/sopha/client';
import { Cast } from '@/types';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  time_window: z.enum(['1h', '6h', '12h', '24h']).default('24h'),
  cursor: z.string().optional(),
});

interface TrendingCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curators?: SophaCast['_curators'];
  _source?: 'sopha' | 'neynar';
}

// In-memory cache (5-minute TTL)
let cachedData: { casts: TrendingCast[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function neynarToCast(c: Record<string, unknown>): TrendingCast {
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
    _source: 'neynar',
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
    const [sophaCasts, neynarResult] = await Promise.allSettled([
      fetchSophaFeed(),
      getTrendingFeed(30, time_window),
    ]);

    const allCasts: TrendingCast[] = [];
    const seenHashes = new Set<string>();

    // Add Sopha curated casts first (they have quality scores + editorial metadata)
    if (sophaCasts.status === 'fulfilled' && sophaCasts.value) {
      for (const cast of sophaCasts.value) {
        if (!seenHashes.has(cast.hash)) {
          seenHashes.add(cast.hash);
          allCasts.push(cast);
        }
      }
    }

    // Add Neynar trending casts (always recent, high engagement)
    if (neynarResult.status === 'fulfilled' && neynarResult.value?.casts) {
      const neynarCasts = (neynarResult.value.casts as Record<string, unknown>[])
        .map(c => neynarToCast(c))
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
