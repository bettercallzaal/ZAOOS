import { supabaseAdmin } from '@/lib/db/supabase';

export type AudioProvider = 'stream' | '100ms';

export interface Room {
  id: string;
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string;
  host_username: string;
  host_pfp: string | null;
  stream_call_id: string;
  state: 'live' | 'ended';
  created_at: string;
  ended_at: string | null;
  participant_count: number;
  room_type: 'voice_channel' | 'stage';
  persistent: boolean;
  channel_id: string | null;
  theme: string;
  thumbnail_url: string | null;
  layout_preference: 'content-first' | 'speakers-first';
  last_active_at: string;
  recording_url: string | null;
  gate_config: Record<string, unknown> | null;
  /** Audio provider — defaults to 'stream' if not set */
  provider?: AudioProvider;
}

export async function createRoom(data: {
  title: string;
  description?: string;
  hostFid: number;
  hostName: string;
  hostUsername: string;
  hostPfp?: string;
  streamCallId: string;
  roomType?: 'voice_channel' | 'stage';
  theme?: string;
  layoutPreference?: 'content-first' | 'speakers-first';
  gateConfig?: { type: string; contractAddress: string; chainId: number; minBalance?: string; tokenId?: string };
  provider?: AudioProvider;
}): Promise<Room> {
  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .insert({
      title: data.title,
      description: data.description || null,
      host_fid: data.hostFid,
      host_name: data.hostName,
      host_username: data.hostUsername,
      host_pfp: data.hostPfp || null,
      stream_call_id: data.streamCallId,
      state: 'live',
      participant_count: 1,
      room_type: data.roomType || 'stage',
      theme: data.theme || 'default',
      layout_preference: data.layoutPreference || 'content-first',
      gate_config: data.gateConfig || null,
      provider: data.provider || 'stream',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create room: ${error.message}`);
  return room;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getLiveRooms(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('state', 'live')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch rooms: ${error.message}`);
  return data || [];
}

export async function endRoom(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('rooms')
    .update({ state: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to end room: ${error.message}`);
}

export async function incrementParticipants(id: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('increment_participant_count', { room_id: id });
  if (error) throw new Error(`Failed to increment participants: ${error.message}`);
}

export async function decrementParticipants(id: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('decrement_participant_count', { room_id: id });
  if (error) throw new Error(`Failed to decrement participants: ${error.message}`);
}

export async function getVoiceChannels(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('persistent', true)
    .eq('room_type', 'voice_channel')
    .order('title');
  if (error) throw new Error(`Failed to fetch voice channels: ${error.message}`);
  return data ?? [];
}

export async function getLiveStages(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('room_type', 'stage')
    .eq('state', 'live')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch live stages: ${error.message}`);
  return data ?? [];
}

export async function updateLastActive(roomId: string): Promise<void> {
  await supabaseAdmin
    .from('rooms')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', roomId);
}

export async function updateLayoutPreference(roomId: string, layout: 'content-first' | 'speakers-first'): Promise<void> {
  await supabaseAdmin
    .from('rooms')
    .update({ layout_preference: layout })
    .eq('id', roomId);
}

export async function updateRoom(id: string, data: {
  title?: string;
  description?: string;
  theme?: string;
  thumbnail_url?: string;
}): Promise<Room> {
  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.theme !== undefined) updates.theme = data.theme;
  if (data.thumbnail_url !== undefined) updates.thumbnail_url = data.thumbnail_url;

  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update room: ${error.message}`);
  return room;
}

export async function updateRecording(roomId: string, url: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('rooms')
    .update({ recording_url: url })
    .eq('id', roomId);

  if (error) throw new Error(`Failed to update recording: ${error.message}`);
}

export async function getPastRooms(days: number = 7): Promise<Room[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('state', 'ended')
    .eq('room_type', 'stage')
    .gte('ended_at', since)
    .order('ended_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch past rooms: ${error.message}`);
  return data ?? [];
}
