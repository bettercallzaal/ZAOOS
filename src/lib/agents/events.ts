import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import type { AgentName, AgentAction } from './types';

export async function logAgentEvent(params: {
  agent_name: AgentName;
  action: AgentAction;
  token_in?: string;
  token_out?: string;
  amount_in?: number;
  amount_out?: number;
  usd_value?: number;
  tx_hash?: string;
  content_id?: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
}) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('agent_events').insert(params);
  if (error) {
    logger.error(`[${params.agent_name}] Failed to log event: ${error.message}`);
  }
}

export async function getRecentEvents(name: AgentName, limit = 20) {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('agent_events')
    .select('*')
    .eq('agent_name', name)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
