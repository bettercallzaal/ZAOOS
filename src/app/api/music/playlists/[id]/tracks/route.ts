import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { addToPlaylist } from '@/lib/music/library';
import { supabaseAdmin } from '@/lib/db/supabase';

const addSchema = z.object({ songId: z.string().uuid() });

/**
 * POST /api/music/playlists/[id]/tracks — add a song to a playlist
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await addToPlaylist(id, parsed.data.songId, session.fid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[playlists] add track failed:', err);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

const removeSchema = z.object({ songId: z.string().uuid() });

/**
 * DELETE /api/music/playlists/[id]/tracks — remove a song from a playlist
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', id)
      .eq('song_id', parsed.data.songId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[playlists] remove track failed:', err);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
