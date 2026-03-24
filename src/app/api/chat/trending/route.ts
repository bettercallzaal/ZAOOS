import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getTrendingFeed } from '@/lib/farcaster/neynar';
import { Cast } from '@/types';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  time_window: z.enum(['1h', '6h', '12h', '24h']).default('24h'),
  cursor: z.string().optional(),
});

// Minimum engagement thresholds
const MIN_LIKES = 5;
const MIN_RECASTS = 2;

// In-memory cache for trending casts (5-minute TTL)
let cachedData: { casts: Cast[]; cursor: string | null; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function neynarCastToOurCast(c: Record<string, unknown>): Cast {
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
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { limit, time_window, cursor } = parsed.data;

  try {
    // Use cache if fresh and no cursor (first page only)
    const now = Date.now();
    if (!cursor && cachedData && (now - cachedData.fetchedAt) < CACHE_TTL) {
      const sliced = cachedData.casts.slice(0, limit);
      return NextResponse.json(
        { casts: sliced, cursor: cachedData.cursor },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        },
      );
    }

    // Fetch more than requested to account for filtering
    const fetchLimit = Math.min(limit * 2, 50);
    const feed = await getTrendingFeed(fetchLimit, time_window, cursor);
    const rawCasts: Record<string, unknown>[] = feed.casts || [];
    const nextCursor: string | null = feed.next?.cursor || null;

    // Convert and filter for minimum engagement
    const allCasts = rawCasts.map(neynarCastToOurCast);
    const filtered = allCasts.filter(
      (c) => c.reactions.likes_count >= MIN_LIKES || c.reactions.recasts_count >= MIN_RECASTS,
    );

    // Cache first-page results
    if (!cursor) {
      cachedData = { casts: filtered, cursor: nextCursor, fetchedAt: now };
    }

    const result = filtered.slice(0, limit);

    return NextResponse.json(
      { casts: result, cursor: nextCursor },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error('[trending] error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending casts' }, { status: 500 });
  }
}
