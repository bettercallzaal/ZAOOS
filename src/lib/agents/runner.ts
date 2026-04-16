/**
 * Shared agent runner -- extracts common logic from vault/banker/dealer.
 * Each agent is 90% identical. This module holds the shared 90%.
 * Individual agents just pass their name and any custom overrides.
 */

import { getAgentConfig, getDailySpend } from './config';
import { logAgentEvent } from './events';
import { getSwapQuote, getZabalPrice } from './swap';
import { executeSwap } from './wallet';
import { burnZabal } from './burn';
import { postTradeUpdate } from './cast';
import { maybeAutoStake } from './autostake';
import { TOKENS, type AgentName, type AgentAction } from './types';
import { logger } from '@/lib/logger';

export interface AgentRunResult {
  action: AgentAction;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}

/**
 * Run the standard agent routine for any agent.
 * Checks config, budget, executes buy_zabal, burns, posts, auto-stakes.
 */
export async function runAgent(agentName: AgentName): Promise<AgentRunResult> {
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

  // Check daily budget
  const spent = await getDailySpend(agentName);
  if (spent >= config.max_daily_spend_usd) {
    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      status: 'failed',
      error_message: `Daily budget exceeded: $${spent.toFixed(2)} / $${config.max_daily_spend_usd}`,
    });
    return { action: 'buy_zabal', status: 'skipped', details: `Budget exceeded ($${spent.toFixed(2)})` };
  }

  // Trade amount with random noise ($0.30-$0.70)
  const baseAmount = 0.50;
  const noise = (Math.random() - 0.5) * 0.40;
  const tradeUsd = Math.min(baseAmount + noise, config.max_single_trade_usd);

  try {
    // Auto-stake check (14-day cycle)
    await maybeAutoStake(agentName);

    // Get price -- if API fails, skip trade entirely (no stale fallback)
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

    // Execute trade
    const ethAmount = Math.floor((tradeUsd / 2500) * 1e18);
    const quote = await getSwapQuote({
      sellToken: TOKENS.WETH,
      buyToken: TOKENS.ZABAL,
      sellAmount: String(ethAmount),
      takerAddress: config.wallet_address,
    });

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

    const details = `Bought ${quote.buyAmount} ZABAL for ~$${tradeUsd.toFixed(2)}`;
    await postTradeUpdate({ agentName, action: 'buy_zabal', details, txHash: hash });

    logger.info(`[${agentName}] buy_zabal: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} ZABAL`);
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
