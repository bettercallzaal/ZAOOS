import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  targetFid: z.coerce.number().int().positive(),
});

/**
 * GET /api/social/taste-match?targetFid=123
 * Compares current user's liked songs with target user's liked songs.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { targetFid } = parsed.data;
  if (targetFid === session.fid) {
    return NextResponse.json({
      matchPercent: 100,
      sharedTracks: [],
      totalYours: 0,
      totalTheirs: 0,
    });
  }

  try {
    // Fetch both users' liked song IDs in parallel
    const [myLikesRes, theirLikesRes] = await Promise.allSettled([
      supabaseAdmin
        .from('user_song_likes')
        .select('song_id')
        .eq('user_fid', session.fid),
      supabaseAdmin
        .from('user_song_likes')
        .select('song_id')
        .eq('user_fid', targetFid),
    ]);

    const myLikes =
      myLikesRes.status === 'fulfilled'
        ? (myLikesRes.value.data || []).map((r) => r.song_id as string)
        : [];
    const theirLikes =
      theirLikesRes.status === 'fulfilled'
        ? (theirLikesRes.value.data || []).map((r) => r.song_id as string)
        : [];

    const mySet = new Set(myLikes);
    const sharedIds = theirLikes.filter((id) => mySet.has(id));

    // Jaccard similarity: shared / union
    const unionSize = new Set([...myLikes, ...theirLikes]).size;
    const matchPercent =
      unionSize > 0 ? Math.round((sharedIds.length / unionSize) * 100) : 0;

    // Fetch track details for shared songs (limit 10)
    let sharedTracks: Array<{
      id: string;
      title: string;
      artist: string | null;
      url: string;
      artworkUrl: string | null;
    }> = [];

    if (sharedIds.length > 0) {
      const { data: songs } = await supabaseAdmin
        .from('songs')
        .select('id, title, artist, url, artwork_url')
        .in('id', sharedIds.slice(0, 10));

      sharedTracks = (songs || []).map((s) => ({
        id: s.id,
        title: s.title || 'Untitled',
        artist: s.artist || null,
        url: s.url,
        artworkUrl: s.artwork_url || null,
      }));
    }

    return NextResponse.json({
      matchPercent,
      sharedTracks,
      totalYours: myLikes.length,
      totalTheirs: theirLikes.length,
      sharedCount: sharedIds.length,
    });
  } catch (err) {
    logger.error('[taste-match] GET failed:', err);
    return NextResponse.json(
      { error: 'Failed to compute taste match' },
      { status: 500 },
    );
  }
}
