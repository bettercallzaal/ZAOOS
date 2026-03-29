import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// GET — single playlist with tracks + members
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const [playlistRes, tracksRes, membersRes, userVotesRes] = await Promise.allSettled([
      supabaseAdmin.from('playlists').select('*').eq('id', id).single(),
      supabaseAdmin
        .from('playlist_tracks')
        .select('*')
        .eq('playlist_id', id)
        .order('votes', { ascending: false })
        .order('position', { ascending: true }),
      supabaseAdmin.from('playlist_members').select('*').eq('playlist_id', id),
      supabaseAdmin
        .from('playlist_votes')
        .select('playlist_track_id, vote')
        .eq('fid', session.fid),
    ]);

    if (playlistRes.status === 'rejected' || playlistRes.value.error) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlist = playlistRes.value.data;
    const tracks = tracksRes.status === 'fulfilled' ? tracksRes.value.data || [] : [];
    const members = membersRes.status === 'fulfilled' ? membersRes.value.data || [] : [];

    // Build user vote map for tracks in this playlist
    const userVoteMap: Record<string, number> = {};
    if (userVotesRes.status === 'fulfilled' && userVotesRes.value.data) {
      const trackIds = new Set(tracks.map((t: { id: string }) => t.id));
      for (const v of userVotesRes.value.data) {
        if (trackIds.has(v.playlist_track_id)) {
          userVoteMap[v.playlist_track_id] = v.vote;
        }
      }
    }

    const tracksWithUserVote = tracks.map((t: { id: string }) => ({
      ...t,
      user_vote: userVoteMap[t.id] || 0,
    }));

    return NextResponse.json({
      playlist,
      tracks: tracksWithUserVote,
      members,
    });
  } catch (err) {
    console.error('[collaborative-playlist] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

// PATCH — update playlist (owner only)
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Check ownership
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('created_by_fid')
      .eq('id', id)
      .single();

    if (!playlist || playlist.created_by_fid !== session.fid) {
      return NextResponse.json({ error: 'Only the owner can update this playlist' }, { status: 403 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('playlists')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ playlist: updated });
  } catch (err) {
    console.error('[collaborative-playlist] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

// DELETE — delete playlist (owner only)
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('created_by_fid')
      .eq('id', id)
      .single();

    if (!playlist || playlist.created_by_fid !== session.fid) {
      return NextResponse.json({ error: 'Only the owner can delete this playlist' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('playlists').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[collaborative-playlist] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
