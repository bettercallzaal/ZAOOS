import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const updateSchema = z.object({
  trackName: z.string().min(1).max(300),
  artistName: z.string().min(1).max(300),
  artworkUrl: z.string().url().max(1000).optional(),
  platform: z.string().min(1).max(50),
  position: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  url: z.string().max(1000).optional(),
  isPlaying: z.boolean(),
});

/**
 * POST — authenticated users push their now-playing state.
 * Upserts into overlay_now_playing so the public GET endpoint can read it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { trackName, artistName, artworkUrl, platform, position, duration, url, isPlaying } =
      parsed.data;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('overlay_now_playing').upsert(
      {
        fid: session.fid,
        track_name: trackName,
        artist_name: artistName,
        artwork_url: artworkUrl || null,
        platform,
        position: position ?? 0,
        duration: duration ?? 0,
        track_url: url || null,
        is_playing: isPlaying,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fid' },
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Overlay now-playing update error:', error);
    return NextResponse.json({ error: 'Failed to update now playing' }, { status: 500 });
  }
}
