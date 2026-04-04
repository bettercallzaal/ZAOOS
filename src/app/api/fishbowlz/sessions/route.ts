import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

const CreateSessionSchema = z.object({
  roomId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreateSessionSchema.parse(body);

    // Check room exists and is active
    const { data: room, error: roomError } = await supabaseAdmin
      .from('fishbowl_rooms')
      .select('id, state, total_sessions')
      .eq('id', data.roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (room.state !== 'active') {
      return NextResponse.json({ error: 'Room is not active' }, { status: 409 });
    }

    // Create session
    const { data: session, error } = await supabaseAdmin
      .from('fishbowl_sessions')
      .insert({
        room_id: data.roomId,
        state: 'live',
        speakers: JSON.stringify([]),
        listener_count_snapshots: JSON.stringify([]),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update room total_sessions and last_active_at
    await supabaseAdmin
      .from('fishbowl_rooms')
      .update({
        total_sessions: room.total_sessions + 1,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', data.roomId);

    await supabaseAdmin.rpc('log_fishbowl_event', {
      p_event_type: 'session.started',
      p_event_data: JSON.stringify({ roomId: data.roomId, sessionId: session.id }),
      p_room_id: data.roomId,
      p_session_id: session.id,
      p_actor_fid: null,
      p_actor_type: null,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  const { data: sessions, error } = await supabaseAdmin
    .from('fishbowl_sessions')
    .select('*')
    .eq('room_id', roomId)
    .order('started_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions });
}
