import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { Cast } from '@/types';

const SOPHA_API = 'https://www.sopha.social/api/feed';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  cursor: z.string().optional(),
});

// In-memory cache (5-minute TTL)
let cachedData: { casts: SophaCast[]; cursor: string | null; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

interface SophaCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curatorInfo?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

function sophaCastToOurCast(c: Record<string, unknown>): SophaCast {
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
    // Sopha curation metadata
    _qualityScore: (c._qualityScore as number) || undefined,
    _category: (c._category as string) || undefined,
    _title: (c._title as string) || undefined,
    _summary: (c._summary as string) || undefined,
    _curatorInfo: (c._curatorInfo as SophaCast['_curatorInfo']) || undefined,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = {
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { limit, cursor } = parsed.data;

  try {
    // Use cache if fresh and no cursor (first page only)
    const now = Date.now();
    if (!cursor && cachedData && (now - cachedData.fetchedAt) < CACHE_TTL) {
      const sliced = cachedData.casts.slice(0, limit);
      return NextResponse.json(
        { casts: sliced, cursor: cachedData.cursor, source: 'sopha' },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
      );
    }

    // Fetch from Sopha's curated feed API
    const url = new URL(SOPHA_API);
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('[trending] Sopha API error:', res.status);
      return NextResponse.json({ error: 'Sopha API unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const rawCasts: Record<string, unknown>[] = data.casts || [];
    const nextCursor: string | null = data.next?.cursor || null;

    // Convert with curation metadata preserved
    const casts = rawCasts.map(sophaCastToOurCast);

    // Cache first-page results
    if (!cursor) {
      cachedData = { casts, cursor: nextCursor, fetchedAt: now };
    }

    const result = casts.slice(0, limit);

    return NextResponse.json(
      { casts: result, cursor: nextCursor, source: 'sopha' },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('[trending] Sopha fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch curated feed' }, { status: 500 });
  }
}
