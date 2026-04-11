import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { AgentConfig, AgentName } from './types';

export async function getAgentConfig(name: AgentName): Promise<AgentConfig | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('agent_config')
    .select('*')
    .eq('name', name)
    .single();

  if (error || !data) return null;
  return data as AgentConfig;
}

export async function getDailySpend(name: AgentName): Promise<number> {
  const db = getSupabaseAdmin();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data } = await db
    .from('agent_events')
    .select('usd_value')
    .eq('agent_name', name)
    .eq('status', 'success')
    .gte('created_at', todayStart.toISOString());

  if (!data) return 0;
  return data.reduce((sum, e) => sum + (e.usd_value || 0), 0);
}
