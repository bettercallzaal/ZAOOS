import { supabaseAdmin } from '@/lib/db/supabase';

export interface MSRoom {
  id: string;
  title: string;
  host_fid: number;
  host_name: string;
  room_id_100ms: string | null;
  state: 'active' | 'ended';
  settings: Record<string, unknown>;
  pinned_links: unknown[];
  speakers: unknown[];
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}

export async function createMSRoom(data: {
  title: string;
  hostFid: number;
  hostName: string;
  roomId100ms?: string;
}): Promise<MSRoom> {
  const { data: room, error } = await supabaseAdmin
    .from('ms_rooms')
    .insert({
      title: data.title,
      host_fid: data.hostFid,
      host_name: data.hostName,
      room_id_100ms: data.roomId100ms || null,
      state: 'active',
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
