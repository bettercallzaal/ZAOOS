import { supabaseAdmin } from '@/lib/db/supabase';

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
  layout_preference: 'content-first' | 'speakers-first';
  last_active_at: string;
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
  const { data } = await supabaseAdmin.from('rooms').select('participant_count').eq('id', id).single();
  if (data) {
    await supabaseAdmin.from('rooms').update({ participant_count: data.participant_count + 1 }).eq('id', id);
  }
}

export async function decrementParticipants(id: string): Promise<void> {
  const { data } = await supabaseAdmin.from('rooms').select('participant_count').eq('id', id).single();
  if (data && data.participant_count > 0) {
    await supabaseAdmin.from('rooms').update({ participant_count: data.participant_count - 1 }).eq('id', id);
  }
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
