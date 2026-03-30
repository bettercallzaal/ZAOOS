import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { querySongs, upsertSong } from '@/lib/music/library';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  search: z.string().max(200).optional(),
  platform: z.string().max(20).optional(),
  sort: z.enum(['recent', 'popular', 'played']).optional(),
  filter: z.enum(['recent', 'liked']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/music/library — browse/search the song library
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // If filter=recent, force sort by last_played_at
    const queryParams = { ...parsed.data };
    if (queryParams.filter === 'recent') {
      queryParams.sort = 'played';
    }
    const result = await querySongs(queryParams);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } });
  } catch (err) {
    logger.error('[library] query failed:', err);
    return NextResponse.json({ error: 'Failed to load library' }, { status: 500 });
  }
}

const addSchema = z.object({
  url: z.string().url().max(500),
});

/**
 * POST /api/music/library — add a song by URL (resolves metadata automatically)
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { url } = parsed.data;
    const platform = isMusicUrl(url);
    if (!platform) {
      return NextResponse.json({ error: 'Not a recognized music URL' }, { status: 400 });
    }

    // Resolve metadata
    let meta: Record<string, unknown> = {};
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';
      const metaRes = await fetch(`${baseUrl}/api/music/metadata?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (metaRes.ok) meta = await metaRes.json();
    } catch { /* proceed without metadata */ }

    const result = await upsertSong({
      url,
      platform,
      title: (meta.trackName as string) || 'Untitled',
      artist: meta.artistName as string,
      artworkUrl: meta.artworkUrl as string,
      streamUrl: meta.streamUrl as string,
      duration: meta.duration ? Math.floor((meta.duration as number) / 1000) : 0,
      submittedByFid: session.fid,
      source: 'manual',
    });

    return NextResponse.json({ song: result, isNew: result.isNew });
  } catch (err) {
    logger.error('[library] add failed:', err);
    return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
  }
}
