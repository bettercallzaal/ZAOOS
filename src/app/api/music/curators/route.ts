import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/music/curators — top curators ranked by likes received on their submitted tracks
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all songs with their like counts, grouped by submitter
    // Step 1: Get like counts per song
    const { data: songs, error: songsError } = await supabaseAdmin
      .from('songs')
      .select('id, submitted_by_fid')
      .not('submitted_by_fid', 'is', null);

    if (songsError) throw songsError;
    if (!songs || songs.length === 0) {
      return NextResponse.json({ curators: [] });
    }

    // Step 2: Get like counts for all songs
    const { data: likes, error: likesError } = await supabaseAdmin
      .from('user_song_likes')
      .select('song_id');

    if (likesError) throw likesError;

    // Build a map: song_id -> like count
    const likesPerSong = new Map<string, number>();
    if (likes) {
      for (const like of likes) {
        const songId = like.song_id as string;
        likesPerSong.set(songId, (likesPerSong.get(songId) || 0) + 1);
      }
    }

    // Step 3: Aggregate by submitter FID
    const curatorMap = new Map<number, { totalLikes: number; trackCount: number }>();
    for (const song of songs) {
      const fid = song.submitted_by_fid as number;
      const songLikes = likesPerSong.get(song.id) || 0;
      const existing = curatorMap.get(fid) || { totalLikes: 0, trackCount: 0 };
      existing.totalLikes += songLikes;
      existing.trackCount += 1;
      curatorMap.set(fid, existing);
    }

    // Step 4: Sort by total likes DESC, take top 20
    const ranked = Array.from(curatorMap.entries())
      .filter(([, stats]) => stats.totalLikes > 0)
      .sort((a, b) => b[1].totalLikes - a[1].totalLikes)
      .slice(0, 20);

    if (ranked.length === 0) {
      return NextResponse.json({ curators: [] });
    }

    // Step 5: Fetch user details
    const fids = ranked.map(([fid]) => fid);
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('fid, username, display_name, pfp_url')
      .in('fid', fids);

    const userMap = new Map(
      (users || []).map((u: { fid: number; username: string; display_name: string | null; pfp_url: string | null }) => [u.fid, u]),
    );

    const curators = ranked.map(([fid, stats]) => {
      const user = userMap.get(fid);
      return {
        fid,
        username: user?.username || '',
        displayName: user?.display_name || null,
        pfpUrl: user?.pfp_url || null,
        totalLikes: stats.totalLikes,
        trackCount: stats.trackCount,
      };
    });

    return NextResponse.json({ curators });
  } catch (err) {
    console.error('[curators] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch curators' }, { status: 500 });
  }
}
