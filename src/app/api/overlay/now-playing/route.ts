import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  fid: z.coerce.number().int().positive(),
});

/**
 * Public GET endpoint for OBS overlays — no auth required.
 * Reads the user's now-playing status from the `overlay_now_playing` table.
 * Falls back to the track_of_the_day if nothing is actively playing.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const parsed = querySchema.safeParse({ fid: searchParams.get('fid') });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid fid parameter', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { fid } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Check overlay_now_playing table (updated by the client via upsert)
    const { data: nowPlaying } = await supabase
      .from('overlay_now_playing')
      .select('*')
      .eq('fid', fid)
      .single();

    // If we have a record and it was updated within the last 30 seconds, it's live
    if (nowPlaying?.track_name) {
      const updatedAt = new Date(nowPlaying.updated_at).getTime();
      const isLive = Date.now() - updatedAt < 30_000;

      if (isLive && nowPlaying.is_playing) {
        return NextResponse.json(
          {
            playing: true,
            trackName: nowPlaying.track_name,
            artistName: nowPlaying.artist_name,
            artworkUrl: nowPlaying.artwork_url,
            platform: nowPlaying.platform,
            position: nowPlaying.position ?? 0,
            duration: nowPlaying.duration ?? 0,
            url: nowPlaying.track_url,
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=2',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    }

    // Nothing playing
    return NextResponse.json(
      { playing: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=2',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    logger.error('Overlay now-playing GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
