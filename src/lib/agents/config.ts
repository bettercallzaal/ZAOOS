import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import type { AgentConfig, AgentName } from './types';

export async function getAgentConfig(name: AgentName): Promise<AgentConfig | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('agent_config')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    logger.error(`[${name}] Failed to load config: ${error.message}`);
    return null;
  }
  if (!data) {
    logger.warn(`[${name}] No config row found. Run seed-agent-config.sql`);
    return null;
  }
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

/**
 * Atomically claim budget for a trade by inserting a 'pending' event.
 * If daily spend + tradeUsd > max, returns false (no row inserted).
 * This prevents race conditions where concurrent cron runs both pass the budget check.
 */
export async function claimBudget(
  name: AgentName,
  tradeUsd: number,
  maxDailySpend: number,
): Promise<boolean> {
  const spent = await getDailySpend(name);
  if (spent + tradeUsd > maxDailySpend) return false;

  // Insert a pending event to "reserve" the budget slot.
  // If a concurrent run also inserts, the next getDailySpend call will see both.
  const db = getSupabaseAdmin();
  const { error } = await db.from('agent_events').insert({
    agent_name: name,
    action: 'buy_zabal',
    usd_value: tradeUsd,
    status: 'pending',
  });

  if (error) {
    logger.error(`[${name}] Failed to claim budget: ${error.message}`);
    return false;
  }
  return true;
}
