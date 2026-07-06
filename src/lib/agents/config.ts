import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import type { AgentConfig, AgentName } from './types';

export async function getAgentConfig(name: AgentName): Promise<AgentConfig | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('agent_config').select('*').eq('name', name).single();

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

/**
 * Sum of today's agent spend. By default counts only completed ('success')
 * spend; pass includePending=true to also count 'pending' reservations (used by
 * claimBudget so concurrent runs see each other's in-flight claims).
 */
export async function getDailySpend(name: AgentName, includePending = false): Promise<number> {
  const db = getSupabaseAdmin();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const statuses = includePending ? ['success', 'pending'] : ['success'];
  const { data, error } = await db
    .from('agent_events')
    .select('usd_value')
    .eq('agent_name', name)
    .in('status', statuses)
    .gte('created_at', todayStart.toISOString());

  // A failed read must NOT be reported as $0 spent - that would let claimBudget
  // wave a trade through during a DB blip. Surface it so the caller fails closed.
  if (error) {
    logger.error(`[${name}] getDailySpend query failed: ${error.message}`);
    throw new Error(`getDailySpend failed: ${error.message}`);
  }
  if (!data) return 0;
  return data.reduce((sum, e) => sum + (e.usd_value || 0), 0);
}

/**
 * Claim budget for a trade by reserving a 'pending' event, then verifying no
 * concurrent run pushed the committed+pending total over the cap.
 *
 * The previous version had a read-then-insert race: two concurrent cron runs
 * could both read the same `spent`, both pass the check, and both insert -
 * double-spending the daily budget. A fully atomic fix needs a DB-side
 * check-and-insert (RPC + row lock, which is a schema change requiring sign-off).
 * Until then we use an insert-then-verify compensating pattern: insert our
 * pending reservation first, then re-read the total INCLUDING pending. If the
 * total (which now reflects every concurrent claim) exceeds the cap, we roll our
 * own reservation back and bail. This collapses the race window from "the whole
 * network round-trip" to "two near-simultaneous verifies", and over-claims fail
 * closed rather than open.
 */
export async function claimBudget(
  name: AgentName,
  tradeUsd: number,
  maxDailySpend: number,
): Promise<boolean> {
  const db = getSupabaseAdmin();

  // Fast pre-check on committed + pending spend to avoid pointless inserts.
  // If the spend read fails, fail CLOSED (deny the trade) rather than assume $0.
  let preSpent: number;
  try {
    preSpent = await getDailySpend(name, true);
  } catch (err) {
    logger.error(
      `[${name}] Budget pre-check read failed; denying trade: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
  if (preSpent + tradeUsd > maxDailySpend) return false;

  // Reserve the slot, capturing the row id so we can roll it back if needed.
  const { data: reserved, error } = await db
    .from('agent_events')
    .insert({ agent_name: name, action: 'buy_zabal', usd_value: tradeUsd, status: 'pending' })
    .select('id')
    .single();

  if (error || !reserved) {
    logger.error(`[${name}] Failed to claim budget: ${error?.message ?? 'no row returned'}`);
    return false;
  }

  // Re-verify: total now includes our reservation AND any concurrent claim.
  // If the re-read fails we can't prove we're under cap - roll back and deny.
  let committed: number;
  try {
    committed = await getDailySpend(name, true);
  } catch (err) {
    logger.error(
      `[${name}] Budget re-verify read failed; rolling back reservation ${reserved.id}: ${err instanceof Error ? err.message : String(err)}`,
    );
    await db.from('agent_events').delete().eq('id', reserved.id);
    return false;
  }
  if (committed > maxDailySpend) {
    // A concurrent run also claimed; we lost the race. Roll our reservation back.
    const { error: delErr } = await db.from('agent_events').delete().eq('id', reserved.id);
    if (delErr) {
      logger.error(
        `[${name}] Budget over-claim AND rollback failed for reservation ${reserved.id}: ${delErr.message}`,
      );
    }
    return false;
  }

  return true;
}
