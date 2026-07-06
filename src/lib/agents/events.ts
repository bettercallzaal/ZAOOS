import { appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import type { AgentAction, AgentName } from './types';

export interface AgentEventParams {
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
}

// Dead-letter queue path. Configurable for durable hosts (the VPS where the bots
// run persistently); defaults to the OS temp dir for serverless/cron contexts.
const DLQ_PATH = process.env.AGENT_DLQ_PATH || join(tmpdir(), 'zao-agent-events-dlq.jsonl');
const MAX_INSERT_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Append a failed event to the filesystem dead-letter queue so it can be
 * replayed once Supabase recovers. Best-effort: if even the DLQ write fails we
 * have nothing left but the CRITICAL log line below.
 */
async function deadLetter(params: AgentEventParams, dbError: string): Promise<void> {
  const record = JSON.stringify({
    ...params,
    _dlq_at: new Date().toISOString(),
    _db_error: dbError,
  });
  try {
    await appendFile(DLQ_PATH, record + '\n', 'utf8');
  } catch (fsErr) {
    logger.error(
      `[${params.agent_name}] DLQ write ALSO failed at ${DLQ_PATH}: ` +
        `${fsErr instanceof Error ? fsErr.message : String(fsErr)}`,
    );
  }
}

/**
 * Persist an agent event with retry + dead-letter fallback.
 *
 * Returns true if the row landed in Supabase, false if it was dead-lettered or
 * dropped. Callers inside outer catch blocks can ignore the return (we never
 * throw, to avoid cascading into an unhandled rejection), but the boolean lets
 * callers that care detect a persistence failure.
 */
export async function logAgentEvent(params: AgentEventParams): Promise<boolean> {
  const db = getSupabaseAdmin();
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
    const { error } = await db.from('agent_events').insert(params);
    if (!error) return true;
    lastError = error.message;
    if (attempt < MAX_INSERT_ATTEMPTS) await sleep(150 * attempt); // 150ms, 300ms backoff
  }

  // Persisted failure: write to the dead-letter queue for later replay, and emit
  // a CRITICAL log line so external scrapers / Sentry can alert on the drop.
  await deadLetter(params, lastError);
  logger.error(
    `[${params.agent_name}] CRITICAL audit-trail drop after ${MAX_INSERT_ATTEMPTS} attempts; ` +
      `dead-lettered to ${DLQ_PATH}. action=${params.action} status=${params.status} ` +
      `tx_hash=${params.tx_hash ?? '<none>'} db_error="${lastError}"`,
  );
  return false;
}
