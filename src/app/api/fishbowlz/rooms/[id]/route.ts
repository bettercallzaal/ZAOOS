import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';
import { checkGatingEligibility } from '@/lib/fc-identity';

interface FishbowlSpeaker {
  fid: number;
  username: string;
  joinedAt: string;
  lastSeen?: string;
}

const STALE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

function pruneStaleUsers(users: FishbowlSpeaker[]): FishbowlSpeaker[] {
  const cutoff = Date.now() - STALE_TIMEOUT_MS;
  return users.filter((u) => {
    const seen = u.lastSeen ? new Date(u.lastSeen).getTime() : new Date(u.joinedAt).getTime();
    return seen > cutoff;
  });
}

/** Parse JSONB that might come back as a string from Supabase */
function parseJsonb<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return (value as T) ?? fallback;
}

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

  // Prune stale users on read for active rooms
  if (room.state === 'active') {
    const speakers: FishbowlSpeaker[] = parseJsonb(room.current_speakers, []);
    const listeners: FishbowlSpeaker[] = parseJsonb(room.current_listeners, []);
    const prunedSpeakers = pruneStaleUsers(speakers);
    const prunedListeners = pruneStaleUsers(listeners);

    const speakersChanged = prunedSpeakers.length !== speakers.length;
    const listenersChanged = prunedListeners.length !== listeners.length;

    if (speakersChanged || listenersChanged) {
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: prunedSpeakers,
        current_listeners: prunedListeners,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      return NextResponse.json({
        ...room,
        current_speakers: prunedSpeakers,
        current_listeners: prunedListeners,
      });
    }
  }

  return NextResponse.json(room);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action, ...data } = body;

  try {
    if (action === 'join_speaker') {
      const { fid, username, address } = data;
      // Verify the requester is acting as themselves
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, current_listeners, hot_seat_count, gating_enabled, min_quality_score').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      // Check FC gating if enabled
      if (room.data.gating_enabled && address) {
        const eligibility = await checkGatingEligibility(address, room.data.min_quality_score);
        if (!eligibility.eligible) {
          return NextResponse.json({
            error: 'Gated room — FC quality score too low',
            reason: eligibility.reason,
            score: eligibility.score?.toString(),
            fid: eligibility.fid,
          }, { status: 403 });
        }
      }

      const speakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);

      // Prevent duplicate join
      if (speakers.some((s) => s.fid === fid)) {
        return NextResponse.json({ success: true, speakers });
      }

      if (speakers.length >= room.data.hot_seat_count) {
        return NextResponse.json({ error: 'Hot seat is full' }, { status: 409 });
      }

      // Remove from listeners if they were listening
      const listeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);
      const updatedListeners = listeners.filter((l) => l.fid !== fid);

      const newSpeakers = [...speakers, { fid, username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: newSpeakers,
        current_listeners: updatedListeners,
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
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const rawSpeakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);
      const speakers = rawSpeakers.filter((s) => s.fid !== fid);
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

    if (action === 'leave_listener') {
      const { fid } = data;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_listeners').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const rawListeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);
      const listeners = rawListeners.filter((l) => l.fid !== fid);
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_listeners: listeners,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'listener.left',
        p_event_data: JSON.stringify({ roomId: id, fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, listeners });
    }

    if (action === 'join_listener') {
      const { fid, username } = data;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_listeners').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const listeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);

      // Prevent duplicate join
      if (listeners.some((l) => l.fid === fid)) {
        return NextResponse.json({ success: true, listeners });
      }

      const newListeners = [...listeners, { fid, username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
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
      const { listenerFid, listenerUsername } = data;
      if (listenerFid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, current_listeners, hot_seat_count, rotation_enabled').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (!room.data.rotation_enabled) {
        return NextResponse.json({ error: 'Rotation is disabled for this room' }, { status: 409 });
      }

      const speakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);
      const rawListeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);
      const listeners = rawListeners.filter((l) => l.fid !== listenerFid);

      if (speakers.length >= room.data.hot_seat_count) {
        // Rotate out the first (longest-seated) speaker → move them to listeners
        const rotatedOut = speakers.shift()!;
        listeners.push({ fid: rotatedOut.fid, username: rotatedOut.username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() });

        await supabaseAdmin.rpc('log_fishbowl_event', {
          p_event_type: 'speaker.rotated_out',
          p_event_data: JSON.stringify({ roomId: id, fid: rotatedOut.fid, username: rotatedOut.username }),
          p_room_id: id,
          p_session_id: null,
          p_actor_fid: rotatedOut.fid,
          p_actor_type: 'human',
        });
      }

      speakers.push({ fid: listenerFid, username: listenerUsername, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() });

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

    if (action === 'end_room') {
      // Only the host can end the room
      const hostCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid').eq('id', id).single();
      if (!hostCheck.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (hostCheck.data.host_fid !== session.fid) {
        return NextResponse.json({ error: 'Only the host can end the room' }, { status: 403 });
      }

      const now = new Date().toISOString();
      await supabaseAdmin.from('fishbowl_rooms').update({
        state: 'ended',
        current_speakers: [],
        current_listeners: [],
        ended_at: now,
        last_active_at: now,
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'room.ended',
        p_event_data: JSON.stringify({ roomId: id, endedBy: session.fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: session.fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, state: 'ended' });
    }

    if (action === 'heartbeat') {
      const { fid } = data;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, current_listeners').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const now = new Date().toISOString();
      let speakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);
      let listeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);

      // Update lastSeen for the requesting user (wherever they are)
      speakers = speakers.map((s) => s.fid === fid ? { ...s, lastSeen: now } : s);
      listeners = listeners.map((l) => l.fid === fid ? { ...l, lastSeen: now } : l);

      // Prune stale users
      const prunedSpeakers = pruneStaleUsers(speakers);
      const prunedListeners = pruneStaleUsers(listeners);

      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: prunedSpeakers,
        current_listeners: prunedListeners,
        last_active_at: now,
      }).eq('id', id);

      return NextResponse.json({ success: true, speakers: prunedSpeakers, listeners: prunedListeners });
    }

    // Generic update — only hosts can update room metadata
    const roomCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid').eq('id', id).single();
    if (!roomCheck.data || roomCheck.data.host_fid !== session.fid) {
      return NextResponse.json({ error: 'Only the host can update room settings' }, { status: 403 });
    }

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
