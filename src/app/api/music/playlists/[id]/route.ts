import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/music/playlists/[id] — get playlist with tracks
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { data: playlist, error: playlistErr } = await supabaseAdmin
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();

    if (playlistErr || !playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const { data: tracks, error: tracksErr } = await supabaseAdmin
      .from('playlist_tracks')
      .select('position, added_at, songs(*)')
      .eq('playlist_id', id)
      .order('position', { ascending: true });

    if (tracksErr) throw tracksErr;

    const songs = (tracks || []).map((t) => ({
      ...t.songs,
      position: t.position,
      added_at: t.added_at,
    }));

    return NextResponse.json({ playlist, tracks: songs });
  } catch (err) {
    console.error('[playlists] get failed:', err);
    return NextResponse.json({ error: 'Failed to load playlist' }, { status: 500 });
  }
}
