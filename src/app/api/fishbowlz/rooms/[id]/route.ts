import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';
import { checkGatingEligibility } from '@/lib/fc-identity';
import { castRoomEnded } from '@/lib/fishbowlz/castRoom';
import { generateTranscriptSummary } from '@/lib/fishbowlz/summarize';
import { logger } from '@/lib/logger';

// --- Zod schemas for PATCH body validation ---

const JoinSpeakerSchema = z.object({
  action: z.literal('join_speaker'),
  fid: z.number(),
  username: z.string().max(50),
  address: z.string().optional(),
});

const LeaveSpeakerSchema = z.object({
  action: z.literal('leave_speaker'),
  fid: z.number(),
});

const JoinListenerSchema = z.object({
  action: z.literal('join_listener'),
  fid: z.number(),
  username: z.string().max(50),
});

const LeaveListenerSchema = z.object({
  action: z.literal('leave_listener'),
  fid: z.number(),
});

const KickSpeakerSchema = z.object({
  action: z.literal('kick_speaker'),
  targetFid: z.number(),
});

const RotateInSchema = z.object({
  action: z.literal('rotate_in'),
  listenerFid: z.number(),
  listenerUsername: z.string().max(50),
});

const ApproveHandSchema = z.object({
  action: z.literal('approve_hand'),
  targetFid: z.number(),
});

const HeartbeatSchema = z.object({
  action: z.literal('heartbeat'),
  fid: z.number(),
});

const RaiseHandSchema = z.object({
  action: z.literal('raise_hand'),
  fid: z.number(),
  username: z.string().max(50),
});

const StartRoomSchema = z.object({
  action: z.literal('start_room'),
  username: z.string().max(50).optional(),
});

const EndRoomSchema = z.object({
  action: z.literal('end_room'),
});

const UpdateRoomSchema = z.object({
  action: z.literal('update_room'),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  state: z.string().optional(),
});

const PatchBodySchema = z.discriminatedUnion('action', [
  JoinSpeakerSchema, LeaveSpeakerSchema, JoinListenerSchema, LeaveListenerSchema,
  KickSpeakerSchema, RotateInSchema, ApproveHandSchema, HeartbeatSchema,
  RaiseHandSchema, StartRoomSchema, EndRoomSchema, UpdateRoomSchema,
]);

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const validatedBody = parsed.data;

  try {
    if (validatedBody.action === 'join_speaker') {
      const { fid, username, address } = validatedBody;
      // Verify the requester is acting as themselves
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Check FC gating if enabled (need room data for gating check)
      if (address) {
        const room = await supabaseAdmin.from('fishbowl_rooms').select('gating_enabled, min_quality_score').eq('id', id).single();
        if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

        if (room.data.gating_enabled) {
          const eligibility = await checkGatingEligibility(address as `0x${string}`, room.data.min_quality_score);
          if (!eligibility.eligible) {
            return NextResponse.json({
              error: 'Gated room - FC quality score too low',
              reason: eligibility.reason,
              score: eligibility.score?.toString(),
              fid: eligibility.fid,
            }, { status: 403 });
          }
        }
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_join_speaker', {
        p_room_id: id,
        p_fid: fid,
        p_username: username,
        p_address: address || null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'leave_speaker') {
      const { fid } = validatedBody;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_leave_speaker', {
        p_room_id: id,
        p_fid: fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'leave_listener') {
      const { fid } = validatedBody;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_leave_listener', {
        p_room_id: id,
        p_fid: fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'join_listener') {
      const { fid, username } = validatedBody;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_join_listener', {
        p_room_id: id,
        p_fid: fid,
        p_username: username,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'rotate_in') {
      const { listenerFid, listenerUsername } = validatedBody;
      if (listenerFid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_rotate_speaker', {
        p_room_id: id,
        p_new_fid: listenerFid,
        p_new_username: listenerUsername,
        p_old_fid: 0, // RPC determines oldest speaker to rotate out
        p_host_fid: session.fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'kick_speaker') {
      const { targetFid } = validatedBody;

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_kick_speaker', {
        p_room_id: id,
        p_speaker_fid: targetFid,
        p_host_fid: session.fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'raise_hand') {
      const { fid, username } = validatedBody;
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

    if (validatedBody.action === 'approve_hand') {
      const { targetFid } = validatedBody;

      // Look up the username from hand_raises for the RPC call
      const room = await supabaseAdmin.from('fishbowl_rooms').select('hand_raises').eq('id', id).single();
      if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      const raises: FishbowlSpeaker[] = parseJsonb(room.data.hand_raises, []);
      const approved = raises.find((r) => r.fid === targetFid);
      if (!approved) return NextResponse.json({ error: 'Hand raise not found' }, { status: 404 });

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_approve_hand', {
        p_room_id: id,
        p_fid: targetFid,
        p_username: approved.username,
        p_host_fid: session.fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'start_room') {
      const roomCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid, state').eq('id', id).single();
      if (!roomCheck.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (roomCheck.data.host_fid !== session.fid) {
        return NextResponse.json({ error: 'Only the host can start the room' }, { status: 403 });
      }
      if (roomCheck.data.state !== 'scheduled') {
        return NextResponse.json({ error: 'Room is not scheduled' }, { status: 409 });
      }

      const now = new Date().toISOString();
      await supabaseAdmin.from('fishbowl_rooms').update({
        state: 'active',
        current_speakers: [{ fid: session.fid, username: validatedBody.username || 'host', joinedAt: now, lastSeen: now }],
        last_active_at: now,
      }).eq('id', id);

      await supabaseAdmin.rpc('log_fishbowl_event', {
        p_event_type: 'room.started',
        p_event_data: JSON.stringify({ roomId: id, startedBy: session.fid }),
        p_room_id: id,
        p_session_id: null,
        p_actor_fid: session.fid,
        p_actor_type: 'human',
      });

      return NextResponse.json({ success: true, state: 'active' });
    }

    if (validatedBody.action === 'end_room') {
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

      // Generate AI summary (fire-and-forget — don't block the response)
      (async () => {
        try {
          const { data: transcripts } = await supabaseAdmin
            .from('fishbowl_transcripts')
            .select('speaker_name, speaker_role, text, started_at')
            .eq('room_id', id)
            .order('started_at', { ascending: true })
            .limit(200);

          if (transcripts && transcripts.length > 0) {
            const roomData = await supabaseAdmin.from('fishbowl_rooms').select('title').eq('id', id).single();
            const summary = await generateTranscriptSummary(roomData.data?.title || 'Fishbowl', transcripts);
            if (summary) {
              await supabaseAdmin.from('fishbowl_rooms').update({
                ai_summary: summary,
                ai_summary_generated_at: new Date().toISOString(),
              }).eq('id', id);
            }
          }
        } catch (err) {
          logger.error('Failed to generate transcript summary:', err);
        }
      })();

      return NextResponse.json({ success: true, state: 'ended' });
    }

    if (validatedBody.action === 'heartbeat') {
      const { fid } = validatedBody;
      if (fid !== session.fid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: rpcResult, error } = await supabaseAdmin.rpc('fishbowl_heartbeat', {
        p_room_id: id,
        p_fid: fid,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });

      return NextResponse.json({ success: true, ...rpcResult });
    }

    if (validatedBody.action === 'update_room') {
      // Only hosts can update room metadata
      const roomCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid').eq('id', id).single();
      if (!roomCheck.data || roomCheck.data.host_fid !== session.fid) {
        return NextResponse.json({ error: 'Only the host can update room settings' }, { status: 403 });
      }

      const updates: Record<string, unknown> = { last_active_at: new Date().toISOString() };
      if (validatedBody.title) updates.title = validatedBody.title;
      if (validatedBody.description !== undefined) updates.description = validatedBody.description;
      if (validatedBody.state) updates.state = validatedBody.state;

      const { data: updated, error } = await supabaseAdmin
        .from('fishbowl_rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
