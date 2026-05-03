import { db } from '../supabase';
import type { HermesRun, HermesStatus } from './types';

export async function createRun(input: {
  triggered_by_telegram_id: number;
  triggered_in_chat_id: number;
  issue_text: string;
}): Promise<HermesRun> {
  const { data, error } = await db()
    .from('hermes_runs')
    .insert({
      triggered_by_telegram_id: input.triggered_by_telegram_id,
      triggered_in_chat_id: input.triggered_in_chat_id,
      issue_text: input.issue_text,
      status: 'pending' satisfies HermesStatus,
    })
    .select('*')
    .single();
  if (error) throw new Error(`createRun failed: ${error.message}`);
  return data as HermesRun;
}

export async function updateRun(id: string, patch: Partial<HermesRun>): Promise<void> {
  const { error } = await db().from('hermes_runs').update(patch).eq('id', id);
  if (error) throw new Error(`updateRun failed: ${error.message}`);
}

export async function getRun(id: string): Promise<HermesRun | null> {
  const { data, error } = await db().from('hermes_runs').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`getRun failed: ${error.message}`);
  return (data as HermesRun) ?? null;
}

export async function listOpenRuns(limit = 20): Promise<HermesRun[]> {
  const { data, error } = await db()
    .from('hermes_runs')
    .select('*')
    .in('status', ['pending', 'fixing', 'critiquing'])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listOpenRuns failed: ${error.message}`);
  return (data as HermesRun[]) ?? [];
}

/**
 * How many Hermes runs has this telegram_id triggered since UTC midnight?
 * Used by /zsedit to enforce per-member daily caps. Counts every run regardless
 * of final status (so a failed/escalated run still counts toward the cap -
 * spend was incurred either way).
 */
export async function countRunsByTelegramIdToday(telegramId: number): Promise<number> {
  const todayUtcStart = new Date();
  todayUtcStart.setUTCHours(0, 0, 0, 0);
  const { count, error } = await db()
    .from('hermes_runs')
    .select('id', { count: 'exact', head: true })
    .eq('triggered_by_telegram_id', telegramId)
    .gte('created_at', todayUtcStart.toISOString());
  if (error) throw new Error(`countRunsByTelegramIdToday failed: ${error.message}`);
  return count ?? 0;
}
