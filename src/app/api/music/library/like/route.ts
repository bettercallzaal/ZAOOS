import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { upsertSong } from '@/lib/music/library';
import { isMusicUrl } from '@/lib/music/isMusicUrl';

const likeSchema = z.object({
  url: z.string().url().max(500),
});

/**
 * GET /api/music/library/like?url=... — check if the current user has liked a song
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Find the song by URL
    const { data: song } = await supabaseAdmin
      .from('songs')
      .select('id')
      .eq('url', url)
      .maybeSingle();

    if (!song) {
      return NextResponse.json({ liked: false, likeCount: 0, likers: [] });
    }

    // Check if user has liked it + get total count + get recent likers in parallel
    const [likeResult, countResult, likersResult] = await Promise.allSettled([
      supabaseAdmin
        .from('user_song_likes')
        .select('id')
        .eq('user_fid', session.fid)
        .eq('song_id', song.id)
        .maybeSingle(),
      supabaseAdmin
        .from('user_song_likes')
        .select('*', { count: 'exact', head: true })
        .eq('song_id', song.id),
      supabaseAdmin
        .from('user_song_likes')
        .select('user_fid')
        .eq('song_id', song.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const like = likeResult.status === 'fulfilled' ? likeResult.value.data : null;
    const count = countResult.status === 'fulfilled' ? countResult.value.count : 0;
    const likerRows = likersResult.status === 'fulfilled' ? likersResult.value.data : [];

    // Fetch user details for likers from the users table
    let likers: Array<{ fid: number; username: string; displayName: string | null }> = [];
    if (likerRows && likerRows.length > 0) {
      const fids = likerRows.map((r: { user_fid: number }) => r.user_fid);
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('fid, username, display_name')
        .in('fid', fids);

      if (users) {
        // Preserve the order from likerRows (most recent first)
        const userMap = new Map(users.map((u: { fid: number; username: string; display_name: string | null }) => [u.fid, u]));
        likers = fids
          .map((fid: number) => {
            const u = userMap.get(fid);
            return u
              ? { fid: u.fid, username: u.username || '', displayName: u.display_name }
              : { fid, username: '', displayName: null };
          })
          .filter((l: { fid: number; username: string; displayName: string | null }) => l.username);
      }
    }

    return NextResponse.json({ liked: !!like, likeCount: count || 0, likers });
  } catch (err) {
    console.error('[like] GET failed:', err);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}

/**
 * POST /api/music/library/like — toggle like on a song (upserts song to library first)
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = likeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { url } = parsed.data;

    // Upsert the song to the library first
    const platform = isMusicUrl(url) || 'audio';
    const { id: songId } = await upsertSong({
      url,
      platform,
      submittedByFid: session.fid,
      source: 'manual',
    });

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from('user_song_likes')
      .select('id')
      .eq('user_fid', session.fid)
      .eq('song_id', songId)
      .maybeSingle();

    let liked: boolean;

    if (existing) {
      // Unlike — remove the row
      await supabaseAdmin
        .from('user_song_likes')
        .delete()
        .eq('id', existing.id);
      liked = false;
    } else {
      // Like — insert new row
      await supabaseAdmin
        .from('user_song_likes')
        .insert({ user_fid: session.fid, song_id: songId });
      liked = true;
    }

    // Get updated like count
    const { count } = await supabaseAdmin
      .from('user_song_likes')
      .select('*', { count: 'exact', head: true })
      .eq('song_id', songId);

    return NextResponse.json({ liked, likeCount: count || 0 });
  } catch (err) {
    console.error('[like] POST failed:', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
