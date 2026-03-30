import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

// POST — join a collaborative playlist as contributor
export async function POST(_req: Request, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    // Verify playlist exists and is collaborative
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('id, is_collaborative')
      .eq('id', id)
      .single();

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (!playlist.is_collaborative) {
      return NextResponse.json({ error: 'This playlist is not collaborative' }, { status: 403 });
    }

    // Upsert membership (idempotent)
    const { error } = await supabaseAdmin
      .from('playlist_members')
      .upsert(
        { playlist_id: id, fid: session.fid, role: 'contributor' },
        { onConflict: 'playlist_id,fid' },
      );

    if (error) throw error;

    return NextResponse.json({ success: true, role: 'contributor' });
  } catch (err) {
    logger.error('[collaborative-join] POST error:', err);
    return NextResponse.json({ error: 'Failed to join playlist' }, { status: 500 });
  }
}
