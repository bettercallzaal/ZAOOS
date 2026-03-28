import { supabaseAdmin } from '@/lib/db/supabase';

export interface BroadcastTarget {
  id: string;
  user_fid: number;
  platform: 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'kick' | 'custom';
  name: string;
  rtmp_url: string;
  stream_key: string;
  provider: 'direct' | 'livepeer' | 'restream';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserTargets(fid: number): Promise<BroadcastTarget[]> {
  const { data, error } = await supabaseAdmin
    .from('broadcast_targets')
    .select('*')
    .eq('user_fid', fid)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch targets: ${error.message}`);
  return data || [];
}

export async function createTarget(data: {
  userFid: number;
  platform: string;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  provider?: string;
}): Promise<BroadcastTarget> {
  const { data: target, error } = await supabaseAdmin
    .from('broadcast_targets')
    .insert({
      user_fid: data.userFid,
      platform: data.platform,
      name: data.name,
      rtmp_url: data.rtmpUrl,
      stream_key: data.streamKey,
      provider: data.provider || 'direct',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create target: ${error.message}`);
  return target;
}

export async function deleteTarget(id: string, fid: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('broadcast_targets')
    .delete()
    .eq('id', id)
    .eq('user_fid', fid);

  if (error) throw new Error(`Failed to delete target: ${error.message}`);
}

export async function updateTarget(id: string, fid: number, data: {
  name?: string;
  rtmpUrl?: string;
  streamKey?: string;
}): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name) update.name = data.name;
  if (data.rtmpUrl) update.rtmp_url = data.rtmpUrl;
  if (data.streamKey) update.stream_key = data.streamKey;

  const { error } = await supabaseAdmin
    .from('broadcast_targets')
    .update(update)
    .eq('id', id)
    .eq('user_fid', fid);

  if (error) throw new Error(`Failed to update target: ${error.message}`);
}
