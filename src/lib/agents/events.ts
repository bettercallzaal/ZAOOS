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
    // Escalated visibility: CRITICAL prefix + structured payload so log scrapers can alert on
    // audit-trail drops. Still swallowing here because many callers live inside outer
    // catch blocks (runner.ts:149) — throwing would cascade into unhandled rejection.
    // TODO(doc-457): wire a dead-letter queue (Redis list or filesystem fallback) so we
    // don't permanently lose audit events when Supabase is down or RLS rejects an insert.
    logger.error(
      `[${params.agent_name}] CRITICAL audit-trail drop: failed to persist agent_events row. ` +
        `action=${params.action} status=${params.status} ` +
        `tx_hash=${params.tx_hash ?? '<none>'} db_error="${error.message}"`,
    );
  }
}
