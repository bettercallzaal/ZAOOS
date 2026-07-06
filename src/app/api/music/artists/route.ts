import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const artistsQuerySchema = z.object({ artist: z.string().trim().min(1).max(120) });

/**
 * GET /api/music/artists?artist=... — get aggregated data for an artist
 */
export async function GET(req: NextRequest) {
  const parsed = artistsQuerySchema.safeParse({
    artist: req.nextUrl.searchParams.get('artist') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid artist parameter' }, { status: 400 });
  }
  const artist = parsed.data.artist;

  try {
    // Query songs where artist matches (case-insensitive partial match)
    const { data: songs, error } = await supabaseAdmin
      .from('songs')
      .select(
        'id, url, title, artist, artwork_url, stream_url, platform, duration, play_count, created_at',
      )
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
    logger.error('[artists] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch artist data' }, { status: 500 });
  }
}
