/**
 * Shared agent runner -- extracts common logic from vault/banker/dealer.
 * Each agent is 90% identical. This module holds the shared 90%.
 * Individual agents just pass their name and any custom overrides.
 */

import { logger } from '@/lib/logger';
import { maybeAutoStake } from './autostake';
import { burnZabal } from './burn';
import { postTradeUpdate } from './cast';
import { claimBudget, getAgentConfig } from './config';
import { logAgentEvent } from './events';
import { getSwapQuote, getZabalPrice } from './swap';
import { type AgentAction, type AgentName, TOKENS } from './types';
import { executeSwap } from './wallet';
import { executeWithLease } from '@/lib/heart';

export interface AgentRunResult {
  action: AgentAction;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}

/** Fetch live ETH/USD price from 0x. Falls back to $2500 if API down. */
async function getEthPrice(): Promise<number> {
  try {
    const apiKey = process.env.ZX_API_KEY;
    if (!apiKey) return 2500;

    const res = await fetch(
      `https://api.0x.org/swap/v1/price?chainId=8453&sellToken=0x4200000000000000000000000000000000000006&buyToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&sellAmount=1000000000000000000`,
      { headers: { '0x-api-key': apiKey } },
    );
    if (!res.ok) {
      logger.warn('[getEthPrice] 0x API non-OK, using $2500 fallback');
      return 2500;
    }
    const data = await res.json();
    return parseFloat(data.price) || 2500;
  } catch (err) {
    logger.warn(
      `[getEthPrice] Failed, using $2500 fallback: ${err instanceof Error ? err.message : err}`,
    );
    return 2500;
  }
}

/** Retry a function once with delay */
async function withRetry<T>(fn: () => Promise<T>, delayMs = 5000): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    logger.warn(
      `Retrying after ${delayMs}ms: ${firstErr instanceof Error ? firstErr.message : firstErr}`,
    );
    await new Promise((r) => setTimeout(r, delayMs));
    return fn();
  }
}

/**
 * Run the standard agent routine for any agent.
 * Checks config, budget, balance, executes buy_zabal, burns, posts, auto-stakes.
 */
/**
 * Per-agent lease resource ids (stable UUIDs). Each agent is one resource, so
 * only one instance of an agent may run at a time when lease enforcement is on.
 */
const AGENT_RUN_IDS: Record<AgentName, string> = {
  VAULT: 'a11ceed0-0000-4000-8000-0000000000a1',
  BANKER: 'a11ceed0-0000-4000-8000-0000000000b2',
  DEALER: 'a11ceed0-0000-4000-8000-0000000000d3',
};

/**
 * runAgent - the entrypoint. Behind HEART_LEASE_ENFORCE=1 it acquires a Heart
 * lease first, so two instances (e.g. overlapping crons) cannot both trade the
 * same agent. When the flag is off, it is exactly runAgentUnguarded (zero change).
 * The pre-existing atomic budget claim still applies inside; this adds run-level
 * fencing on top. Requires the per-agent agent_runs rows to be seeded before
 * enabling; the recovery cron reclaims a lease if a process dies mid-run.
 */
export async function runAgent(agentName: AgentName): Promise<AgentRunResult> {
  if (process.env.HEART_LEASE_ENFORCE !== '1') return runAgentUnguarded(agentName);
  const owner = process.env.HOSTNAME || process.env.FLY_MACHINE_ID || 'agent-runner';
  const outcome = await executeWithLease(
    { runId: AGENT_RUN_IDS[agentName], owner, ttlSeconds: 180 },
    () => runAgentUnguarded(agentName),
  );
  if (outcome.ran) return outcome.result;
  return { action: 'report', status: 'skipped', details: `Heart lease held - ${agentName} is already running on another instance (${outcome.reason})` };
}

export async function runAgentUnguarded(agentName: AgentName): Promise<AgentRunResult> {
  const config = await getAgentConfig(agentName);
  if (!config) {
    return { action: 'report', status: 'failed', details: `No config found for ${agentName}` };
  }

  if (!config.trading_enabled) {
    return { action: 'report', status: 'skipped', details: 'Trading disabled' };
  }

  if (!config.wallet_address) {
    return { action: 'report', status: 'skipped', details: 'No wallet configured' };
  }

  // Get live ETH price for accurate trade sizing
  const ethPrice = await getEthPrice();
  if (ethPrice === 2500) {
    logger.warn(`[${agentName}] Using $2500 ETH fallback price - 0x API may be down`);
  }

  // Trade amount with random noise ($0.30-$0.70)
  const baseAmount = 0.5;
  const noise = (Math.random() - 0.5) * 0.4;
  const tradeUsd = Math.min(baseAmount + noise, config.max_single_trade_usd);

  // Atomic budget claim - prevents race condition with concurrent cron runs
  const budgetClaimed = await claimBudget(agentName, tradeUsd, config.max_daily_spend_usd);
  if (!budgetClaimed) {
    return { action: 'buy_zabal', status: 'skipped', details: 'Budget exceeded or claim failed' };
  }

  try {
    // Auto-stake check (14-day cycle)
    await maybeAutoStake(agentName);

    // Get ZABAL price -- skip trade if price API down
    let zabalPrice: number;
    try {
      zabalPrice = await getZabalPrice();
    } catch {
      logger.warn(`[${agentName}] Price API unavailable, skipping trade`);
      return { action: 'buy_zabal', status: 'skipped', details: 'Price API unavailable' };
    }

    if (zabalPrice > config.buy_price_ceiling) {
      await logAgentEvent({
        agent_name: agentName,
        action: 'buy_zabal',
        status: 'failed',
        error_message: `Price $${zabalPrice} above ceiling $${config.buy_price_ceiling}`,
      });
      return { action: 'buy_zabal', status: 'skipped', details: 'Price above ceiling' };
    }

    // Calculate ETH amount using live price (not hardcoded $2500)
    const ethAmount = Math.floor((tradeUsd / ethPrice) * 1e18);

    // Get swap quote with 1 retry
    const quote = await withRetry(() =>
      getSwapQuote({
        sellToken: TOKENS.WETH,
        buyToken: TOKENS.ZABAL,
        sellAmount: String(ethAmount),
        takerAddress: config.wallet_address,
      }),
    );

    const hash = await executeSwap(agentName, quote);
    await burnZabal(agentName, BigInt(quote.buyAmount));

    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      token_in: 'WETH',
      token_out: 'ZABAL',
      amount_in: ethAmount / 1e18,
      amount_out: parseFloat(quote.buyAmount) / 1e18,
      usd_value: tradeUsd,
      tx_hash: hash,
      status: 'success',
    });

    const details = `Bought ${quote.buyAmount} ZABAL for ~$${tradeUsd.toFixed(2)} (ETH@$${ethPrice.toFixed(0)})`;
    await postTradeUpdate({ agentName, action: 'buy_zabal', details, txHash: hash });

    logger.info(
      `[${agentName}] buy_zabal: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} ZABAL (ETH@$${ethPrice.toFixed(0)})`,
    );
    return { action: 'buy_zabal', status: 'success', details };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      status: 'failed',
      error_message: message,
    });
    logger.error(`[${agentName}] buy_zabal failed: ${message}`);
    return { action: 'buy_zabal', status: 'failed', details: message };
  }
}
