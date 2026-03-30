import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const postSchema = z.object({
  roomId: z.string().uuid(),
  songUrl: z.string().url(),
  songTitle: z.string().max(200).optional(),
  songArtist: z.string().max(200).optional(),
  songArtwork: z.string().url().optional(),
});

const patchSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected', 'played']),
});

/**
 * GET — List song requests for a room
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('song_requests')
      .select('*')
      .eq('room_id', roomId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('GET /api/spaces/song-request error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error('GET /api/spaces/song-request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Submit a song request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { roomId, songUrl, songTitle, songArtist, songArtwork } = parsed.data;
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from('song_requests')
      .insert({
        room_id: roomId,
        requester_fid: session.fid,
        requester_name: session.displayName || session.username,
        song_url: songUrl,
        song_title: songTitle ?? null,
        song_artist: songArtist ?? null,
        song_artwork: songArtwork ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('POST /api/spaces/song-request error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err) {
    console.error('POST /api/spaces/song-request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH — Accept or reject a song request (host only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { requestId, status } = parsed.data;
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from('song_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/spaces/song-request error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err) {
    console.error('PATCH /api/spaces/song-request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
