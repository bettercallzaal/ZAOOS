import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/music/artists?artist=... — get aggregated data for an artist
 */
export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist');
  if (!artist || !artist.trim()) {
    return NextResponse.json({ error: 'Missing artist parameter' }, { status: 400 });
  }

  try {
    // Query songs where artist matches (case-insensitive partial match)
    const { data: songs, error } = await supabaseAdmin
      .from('songs')
      .select('id, url, title, artist, artwork_url, stream_url, platform, duration, play_count, created_at')
      .ilike('artist', `%${artist.trim()}%`)
      .order('play_count', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!songs || songs.length === 0) {
      return NextResponse.json({
        artist: artist.trim(),
        trackCount: 0,
        totalPlays: 0,
        totalLikes: 0,
        tracks: [],
      });
    }

    // Aggregate stats
    const trackCount = songs.length;
    const totalPlays = songs.reduce((sum, s) => sum + (s.play_count || 0), 0);

    // Get total likes across all songs by this artist
    const songIds = songs.map((s) => s.id);
    const { count: totalLikes } = await supabaseAdmin
      .from('user_song_likes')
      .select('*', { count: 'exact', head: true })
      .in('song_id', songIds);

    // Return top 10 tracks
    const topTracks = songs.slice(0, 10).map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      artist: s.artist,
      artworkUrl: s.artwork_url,
      streamUrl: s.stream_url,
      platform: s.platform,
      duration: s.duration,
      playCount: s.play_count,
      createdAt: s.created_at,
    }));

    return NextResponse.json({
      artist: artist.trim(),
      trackCount,
      totalPlays,
      totalLikes: totalLikes || 0,
      tracks: topTracks,
    });
  } catch (err) {
    console.error('[artists] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch artist data' }, { status: 500 });
  }
}
