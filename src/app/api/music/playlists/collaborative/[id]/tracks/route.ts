import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

const addTrackSchema = z.object({
  song_url: z.string().url().max(500),
  song_title: z.string().max(200).optional(),
  song_artist: z.string().max(200).optional(),
  song_artwork_url: z.string().url().max(500).optional(),
  song_platform: z.string().max(50).optional(),
  song_stream_url: z.string().max(500).optional(),
});

const removeTrackSchema = z.object({
  track_id: z.string().uuid(),
});

// POST — add a track to a collaborative playlist (contributors only)
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = addTrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Check membership
    const { data: member } = await supabaseAdmin
      .from('playlist_members')
      .select('role')
      .eq('playlist_id', id)
      .eq('fid', session.fid)
      .single();

    if (!member || member.role === 'viewer') {
      return NextResponse.json({ error: 'You must be a contributor to add tracks' }, { status: 403 });
    }

    // Get current max position
    const { data: lastTrack } = await supabaseAdmin
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastTrack?.position ?? -1) + 1;

    const { data: track, error } = await supabaseAdmin
      .from('playlist_tracks')
      .insert({
        playlist_id: id,
        song_url: parsed.data.song_url,
        song_title: parsed.data.song_title || null,
        song_artist: parsed.data.song_artist || null,
        song_artwork_url: parsed.data.song_artwork_url || null,
        song_platform: parsed.data.song_platform || null,
        song_stream_url: parsed.data.song_stream_url || null,
        added_by_fid: session.fid,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Track already in playlist' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ track }, { status: 201 });
  } catch (err) {
    logger.error('[collaborative-tracks] POST error:', err);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

// DELETE — remove a track (owner or the person who added it)
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = removeTrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Fetch track and playlist to check permissions
    const [trackRes, playlistRes] = await Promise.allSettled([
      supabaseAdmin
        .from('playlist_tracks')
        .select('added_by_fid')
        .eq('id', parsed.data.track_id)
        .eq('playlist_id', id)
        .single(),
      supabaseAdmin
        .from('playlists')
        .select('created_by_fid')
        .eq('id', id)
        .single(),
    ]);

    const track = trackRes.status === 'fulfilled' ? trackRes.value.data : null;
    const playlist = playlistRes.status === 'fulfilled' ? playlistRes.value.data : null;

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const isOwner = playlist?.created_by_fid === session.fid;
    const isAdder = track.added_by_fid === session.fid;

    if (!isOwner && !isAdder) {
      return NextResponse.json({ error: 'Only the playlist owner or the person who added the track can remove it' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('playlist_tracks')
      .delete()
      .eq('id', parsed.data.track_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[collaborative-tracks] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
