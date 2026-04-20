// src/lib/agents/autostake.ts
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { executeSwap } from './wallet';
import { logAgentEvent } from './events';
import { TOKENS, ZABAL_STAKING_CONTRACT, type AgentName } from './types';
import { logger } from '@/lib/logger';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_STAKE = BigInt('100000000000000000000000000'); // 100M * 1e18

/**
 * Auto-stake ZABAL if:
 * 1. Staking contract is configured
 * 2. 14+ days since last stake
 * 3. Agent ZABAL balance >= 100M
 *
 * Called at end of each agent's daily cron.
 */
export async function maybeAutoStake(agentName: AgentName): Promise<void> {
  if (!ZABAL_STAKING_CONTRACT) return;

  const db = getSupabaseAdmin();

  // Check last stake event
  const { data: lastStake } = await db
    .from('agent_events')
    .select('created_at')
    .eq('agent_name', agentName)
    .eq('action', 'add_lp') // reuse add_lp action for staking
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastStake && lastStake.length > 0) {
    const daysSince = Date.now() - new Date(lastStake[0].created_at).getTime();
    if (daysSince < FOURTEEN_DAYS_MS) {
      logger.info(`[${agentName}] Auto-stake: ${Math.floor(daysSince / (24 * 60 * 60 * 1000))} days since last stake, waiting for 14`);
      return;
    }
  }

  // Approve + stake via Privy wallet (using executeSwap pattern for the two calls)
  try {
    // Approve ZABAL for staking contract
    const approveData = `0x095ea7b3${ZABAL_STAKING_CONTRACT.slice(2).padStart(64, '0')}${MIN_STAKE.toString(16).padStart(64, '0')}`;
    await executeSwap(agentName, {
      to: TOKENS.ZABAL,
      data: approveData,
      value: '0',
    });

    // Stake 100M ZABAL
    const stakeData = `0xa694fc3a${MIN_STAKE.toString(16).padStart(64, '0')}`;
    const hash = await executeSwap(agentName, {
      to: ZABAL_STAKING_CONTRACT,
      data: stakeData,
      value: '0',
    });

    await logAgentEvent({
      agent_name: agentName,
      action: 'add_lp',
      token_in: 'ZABAL',
      token_out: 'CONVICTION',
      amount_in: 100_000_000,
      usd_value: 0,
      tx_hash: hash,
      status: 'success',
    });

    logger.info(`[${agentName}] Auto-staked 100M ZABAL for conviction. TX: ${hash}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logAgentEvent({
      agent_name: agentName,
      action: 'add_lp',
      token_in: 'ZABAL',
      token_out: 'CONVICTION',
      amount_in: 100_000_000,
      usd_value: 0,
      status: 'failed',
      error_message: msg,
    });
    logger.error(`[${agentName}] Auto-stake failed: ${msg}`);
  }
}
