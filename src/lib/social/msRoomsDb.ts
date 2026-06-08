import { supabaseAdmin } from '@/lib/db/supabase';
import type { TokenGateConfig } from '@/lib/spaces/tokenGate';

/** A host-curated quick link / agenda item pinned to a room. */
export interface PinnedLink {
  label: string;
  url: string;
}

export interface MSRoom {
  id: string;
  title: string;
  host_fid: number;
  host_name: string;
  room_id_100ms: string | null;
  state: 'active' | 'ended';
  settings: Record<string, unknown>;
  pinned_links: PinnedLink[];
  speakers: unknown[];
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}

export interface SpeakerRequest {
  id: string;
  room_id: string;
  requester_fid: number;
  requester_name: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

/** True when a room runs in stage mode (host speaks, listeners raise hand). */
export function isStageRoom(room: Pick<MSRoom, 'settings'>): boolean {
  return room.settings?.room_type === 'stage';
}

export async function createMSRoom(data: {
  title: string;
  hostFid: number;
  hostName: string;
  roomId100ms?: string;
  gateConfig?: TokenGateConfig | null;
  roomType?: 'stage' | 'video';
}): Promise<MSRoom> {
  // Token gate + room_type live in the `settings` jsonb column (no dedicated
  // column / migration). Read back via room.settings.*. The gate is enforced
  // client-side at /spaces/hms/[id]; room_type drives stage mode.
  const settings: Record<string, unknown> = {};
  if (data.gateConfig) settings.gate_config = data.gateConfig;
  if (data.roomType) settings.room_type = data.roomType;

  const { data: room, error } = await supabaseAdmin
    .from('ms_rooms')
    .insert({
      title: data.title,
      host_fid: data.hostFid,
      host_name: data.hostName,
      room_id_100ms: data.roomId100ms || null,
      state: 'active',
      settings,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create ms_room: ${error.message}`);
  return room;
}

export async function getActiveMSRooms(): Promise<MSRoom[]> {
  const { data, error } = await supabaseAdmin
    .from('ms_rooms')
    .select('*')
    .eq('state', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch ms_rooms: ${error.message}`);
  return data || [];
}

export async function getMSRoomById(id: string): Promise<MSRoom | null> {
  const { data, error } = await supabaseAdmin
    .from('ms_rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

/** Look up the active room for a resolved 100ms room id (used by the webhook). */
export async function getMSRoomByHmsRoomId(roomId100ms: string): Promise<MSRoom | null> {
  const { data, error } = await supabaseAdmin
    .from('ms_rooms')
    .select('*')
    .eq('room_id_100ms', roomId100ms)
    .eq('state', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Store a recording URL on a room (in the settings jsonb — no dedicated column). */
export async function setMSRoomRecording(id: string, url: string): Promise<void> {
  const room = await getMSRoomById(id);
  if (!room) return;
  const settings = { ...(room.settings ?? {}), recording_url: url };
  await supabaseAdmin.from('ms_rooms').update({ settings }).eq('id', id);
}

/** Persist the resolved 100ms room id on first join (only when not already set,
 * so a re-resolution never clobbers a good value). Lets later joins skip the
 * list/create round-trip and keeps stage-auth reads fast. */
export async function setMSRoom100msId(id: string, roomId100ms: string): Promise<void> {
  await supabaseAdmin
    .from('ms_rooms')
    .update({ room_id_100ms: roomId100ms })
    .eq('id', id)
    .is('room_id_100ms', null);
}

/** Replace a room's pinned links (host-curated quick links / agenda). */
export async function setMSRoomPinnedLinks(id: string, links: PinnedLink[]): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ms_rooms')
    .update({ pinned_links: links })
    .eq('id', id);
  if (error) throw new Error(`Failed to update pinned links: ${error.message}`);
}

/** Cache the live participant count (best-effort, sourced from the 100ms API). */
export async function setMSRoomParticipantCount(id: string, count: number): Promise<void> {
  await supabaseAdmin.from('ms_rooms').update({ participant_count: count }).eq('id', id);
}

/** fid -> display name for a room's approved speakers (from speaker_requests),
 * so the host's "on stage" panel can show names rather than bare FIDs. */
export async function getApprovedSpeakerNames(roomId: string): Promise<Record<number, string>> {
  const { data } = await supabaseAdmin
    .from('speaker_requests')
    .select('requester_fid, requester_name')
    .eq('room_id', roomId)
    .eq('status', 'approved');
  const map: Record<number, string> = {};
  for (const r of data ?? []) {
    if (typeof r.requester_fid === 'number') {
      map[r.requester_fid] = r.requester_name || `fid-${r.requester_fid}`;
    }
  }
  return map;
}

export async function endMSRoom(id: string): Promise<void> {
  await supabaseAdmin
    .from('ms_rooms')
    .update({ state: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id);

  await supabaseAdmin
    .from('speaker_requests')
    .delete()
    .eq('room_id', id);
}

/** Approved speaker FIDs for a room (the host is always implicitly a speaker). */
export function getRoomSpeakerFids(room: Pick<MSRoom, 'speakers'>): number[] {
  return Array.isArray(room.speakers)
    ? room.speakers.filter((s): s is number => typeof s === 'number')
    : [];
}

/** Add a FID to a room's approved-speakers list (idempotent). */
export async function addMSRoomSpeaker(roomId: string, fid: number): Promise<void> {
  const room = await getMSRoomById(roomId);
  if (!room) throw new Error('Room not found');
  const speakers = getRoomSpeakerFids(room);
  if (speakers.includes(fid)) return;
  const { error } = await supabaseAdmin
    .from('ms_rooms')
    .update({ speakers: [...speakers, fid] })
    .eq('id', roomId);
  if (error) throw new Error(`Failed to add speaker: ${error.message}`);
}

/** Remove a FID from a room's approved-speakers list. */
export async function removeMSRoomSpeaker(roomId: string, fid: number): Promise<void> {
  const room = await getMSRoomById(roomId);
  if (!room) throw new Error('Room not found');
  const speakers = getRoomSpeakerFids(room).filter((f) => f !== fid);
  const { error } = await supabaseAdmin
    .from('ms_rooms')
    .update({ speakers })
    .eq('id', roomId);
  if (error) throw new Error(`Failed to remove speaker: ${error.message}`);
}

/** Listener raises their hand. Replaces any prior request from the same FID so
 * a re-raise after a deny starts fresh as pending. */
export async function createSpeakerRequest(
  roomId: string,
  fid: number,
  name: string,
): Promise<SpeakerRequest> {
  await supabaseAdmin
    .from('speaker_requests')
    .delete()
    .eq('room_id', roomId)
    .eq('requester_fid', fid);

  const { data, error } = await supabaseAdmin
    .from('speaker_requests')
    .insert({ room_id: roomId, requester_fid: fid, requester_name: name, status: 'pending' })
    .select()
    .single();
  if (error) throw new Error(`Failed to create speaker request: ${error.message}`);
  return data;
}

export async function getSpeakerRequests(
  roomId: string,
  status?: SpeakerRequest['status'],
): Promise<SpeakerRequest[]> {
  let query = supabaseAdmin.from('speaker_requests').select('*').eq('room_id', roomId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch speaker requests: ${error.message}`);
  return data || [];
}

export async function setSpeakerRequestStatus(
  roomId: string,
  fid: number,
  status: SpeakerRequest['status'],
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('speaker_requests')
    .update({ status })
    .eq('room_id', roomId)
    .eq('requester_fid', fid);
  if (error) throw new Error(`Failed to update speaker request: ${error.message}`);
}
