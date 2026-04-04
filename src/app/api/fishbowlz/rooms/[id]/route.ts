import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: room, error } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json(room);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, ...data } = body;

  try {
    if (action === 'join_speaker') {
      const { fid, username } = data;
      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, hot_seat_count').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const speakers = typeof room.data.current_speakers === 'string' ? JSON.parse(room.data.current_speakers) : (room.data.current_speakers || []);
      if (speakers.length >= room.data.hot_seat_count) {
        return NextResponse.json({ error: 'Hot seat is full' }, { status: 409 });
      }

      const newSpeakers = [...speakers, { fid, username, joinedAt: new Date().toISOString() }];
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: newSpeakers,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'speaker.joined',
        p_event_data: JSON.stringify({ roomId: id, fid, username }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, speakers: newSpeakers });
    }

    if (action === 'leave_speaker') {
      const { fid } = data;
      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const rawSpeakers = typeof room.data.current_speakers === 'string' ? JSON.parse(room.data.current_speakers) : (room.data.current_speakers || []);
      const speakers = rawSpeakers.filter((s: { fid: number }) => s.fid !== fid);
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: speakers,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'speaker.left',
        p_event_data: JSON.stringify({ roomId: id, fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, speakers });
    }

    if (action === 'join_listener') {
      const { fid, username } = data;
      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_listeners').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const listeners = typeof room.data.current_listeners === 'string' ? JSON.parse(room.data.current_listeners) : (room.data.current_listeners || []);
      const newListeners = [...listeners, { fid, username, joinedAt: new Date().toISOString() }];
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_listeners: newListeners,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'listener.joined',
        p_event_data: JSON.stringify({ roomId: id, fid, username }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, listeners: newListeners });
    }

    if (action === 'rotate_in') {
      // Listener rotates into hot seat
      const { listenerFid, listenerUsername } = data;
      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, current_listeners, hot_seat_count').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const speakers = typeof room.data.current_speakers === 'string' ? JSON.parse(room.data.current_speakers) : (room.data.current_speakers || []);
      const rawListeners = typeof room.data.current_listeners === 'string' ? JSON.parse(room.data.current_listeners) : (room.data.current_listeners || []);
      const listeners = rawListeners.filter((l: { fid: number }) => l.fid !== listenerFid);

      if (speakers.length >= room.data.hot_seat_count) {
        // Rotate out the first speaker
        speakers.shift();
      }

      speakers.push({ fid: listenerFid, username: listenerUsername, joinedAt: new Date().toISOString() });

      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: speakers,
        current_listeners: listeners,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'speaker.rotated_in',
        p_event_data: JSON.stringify({ roomId: id, fid: listenerFid, username: listenerUsername }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: listenerFid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, speakers, listeners });
    }

    // Generic update
    const updates: Record<string, unknown> = { last_active_at: new Date().toISOString() };
    if (data.title) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.state) updates.state = data.state;

    const { data: updated, error } = await supabaseAdmin
      .from('fishbowl_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
