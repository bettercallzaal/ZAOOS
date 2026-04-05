import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';
import { checkGatingEligibility } from '@/lib/fc-identity';
import { castRoomEnded } from '@/lib/fishbowlz/castRoom';

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

  // Support lookup by UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const column = isUuid ? 'id' : 'slug';

  const { data: room, error } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('*')
    .eq(column, id)
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
  const { id: rawId } = await params;

  // Auth check
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve slug to UUID if needed
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  let id = rawId;
  if (!isUuid) {
    const { data: slugRoom } = await supabaseAdmin.from('fishbowl_rooms').select('id').eq('slug', rawId).single();
    if (!slugRoom) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    id = slugRoom.id;
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

    if (action === 'kick_speaker') {
      const { targetFid } = data;

      // Only hosts can kick
      const roomCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid, current_speakers, current_listeners').eq('id', id).single();
      if (!roomCheck.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (roomCheck.data.host_fid !== session.fid) {
        return NextResponse.json({ error: 'Only the host can kick speakers' }, { status: 403 });
      }

      const speakers: FishbowlSpeaker[] = parseJsonb(roomCheck.data.current_speakers, []);
      const listeners: FishbowlSpeaker[] = parseJsonb(roomCheck.data.current_listeners, []);

      const kicked = speakers.find((s) => s.fid === targetFid);
      if (!kicked) return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });

      const newSpeakers = speakers.filter((s) => s.fid !== targetFid);
      const newListeners = [...listeners, { fid: kicked.fid, username: kicked.username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];

      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: newSpeakers,
        current_listeners: newListeners,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'speaker.kicked',
        p_event_data: JSON.stringify({ roomId: id, targetFid, kickedBy: session.fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: session.fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, speakers: newSpeakers, listeners: newListeners });
    }

    if (action === 'raise_hand') {
      const { fid, username } = data;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const room = await supabaseAdmin.from('fishbowl_rooms').select('hand_raises, current_listeners').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const raises: FishbowlSpeaker[] = parseJsonb(room.data.hand_raises, []);

      // Toggle — raise if not raised, lower if already raised
      const alreadyRaised = raises.some((r) => r.fid === fid);
      const newRaises = alreadyRaised
        ? raises.filter((r) => r.fid !== fid)
        : [...raises, { fid, username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];

      await supabaseAdmin.from('fishbowl_rooms').update({
        hand_raises: newRaises,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      return NextResponse.json({ success: true, handRaises: newRaises, raised: !alreadyRaised });
    }

    if (action === 'approve_hand') {
      const { targetFid } = data;

      const room = await supabaseAdmin.from('fishbowl_rooms').select('host_fid, current_speakers, current_listeners, hand_raises, hot_seat_count').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (room.data.host_fid !== session.fid) {
        return NextResponse.json({ error: 'Only the host can approve hand raises' }, { status: 403 });
      }

      const speakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);
      const listeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);
      const raises: FishbowlSpeaker[] = parseJsonb(room.data.hand_raises, []);

      const approved = raises.find((r) => r.fid === targetFid);
      if (!approved) return NextResponse.json({ error: 'Hand raise not found' }, { status: 404 });

      if (speakers.length >= room.data.hot_seat_count) {
        return NextResponse.json({ error: 'Hot seat is full — kick someone first' }, { status: 409 });
      }

      const newSpeakers = [...speakers, { fid: approved.fid, username: approved.username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
      const newListeners = listeners.filter((l) => l.fid !== targetFid);
      const newRaises = raises.filter((r) => r.fid !== targetFid);

      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: newSpeakers,
        current_listeners: newListeners,
        hand_raises: newRaises,
        last_active_at: new Date().toISOString(),
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'speaker.approved',
        p_event_data: JSON.stringify({ roomId: id, targetFid, approvedBy: session.fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: targetFid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, speakers: newSpeakers, listeners: newListeners, handRaises: newRaises });
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

      // Cast to Farcaster (fire-and-forget)
      const [roomDetails, transcriptResult] = await Promise.allSettled([
        supabaseAdmin
          .from('fishbowl_rooms')
          .select('title, slug, host_username, total_speakers')
          .eq('id', id)
          .single(),
        supabaseAdmin
          .from('fishbowl_transcripts')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', id),
      ]);

      if (roomDetails.status === 'fulfilled' && roomDetails.value.data) {
        const transcriptCount =
          transcriptResult.status === 'fulfilled'
            ? (transcriptResult.value.count ?? 0)
            : 0;
        castRoomEnded(roomDetails.value.data, transcriptCount).catch(() => {});
      }

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
