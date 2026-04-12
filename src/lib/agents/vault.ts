import { getAgentConfig, getDailySpend } from './config';
import { logAgentEvent } from './events';
import { getSwapQuote, getZabalPrice } from './swap';
import { executeSwap } from './wallet';
import { burnZabal } from './burn';
import { postTradeUpdate } from './cast';
import { maybeAutoStake } from './autostake';
import { TOKENS, VAULT_SCHEDULE, type AgentAction } from './types';
import { logger } from '@/lib/logger';

/**
 * VAULT agent daily routine.
 * Called by Vercel cron at 6 AM UTC.
 * Determines today's action, checks budget, executes.
 */
export async function runVault(): Promise<{
  action: AgentAction;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}> {
  const config = await getAgentConfig('VAULT');
  if (!config) {
    return { action: 'report', status: 'failed', details: 'No config found for VAULT' };
  }

  if (!config.trading_enabled) {
    return { action: 'report', status: 'skipped', details: 'Trading disabled' };
  }

  if (!config.wallet_address) {
    return { action: 'report', status: 'skipped', details: 'No wallet configured' };
  }

  // Determine today's action
  const dayOfWeek = new Date().getUTCDay();
  const action = VAULT_SCHEDULE[dayOfWeek] || 'report';

  // Check daily budget
  const spent = await getDailySpend('VAULT');
  if (spent >= config.max_daily_spend_usd) {
    await logAgentEvent({
      agent_name: 'VAULT',
      action,
      status: 'failed',
      error_message: `Daily budget exceeded: $${spent.toFixed(2)} / $${config.max_daily_spend_usd}`,
    });
    return { action, status: 'skipped', details: `Budget exceeded ($${spent.toFixed(2)})` };
  }

  // Add random noise to trade amount ($0.50 +/- $0.20)
  const baseAmount = 0.50;
  const noise = (Math.random() - 0.5) * 0.40;
  const tradeUsd = Math.min(baseAmount + noise, config.max_single_trade_usd);

  try {
    switch (action) {
      case 'buy_zabal': {
        const zabalPrice = await getZabalPrice();

        if (zabalPrice > config.buy_price_ceiling) {
          await logAgentEvent({
            agent_name: 'VAULT',
            action: 'buy_zabal',
            status: 'failed',
            error_message: `Price $${zabalPrice} above ceiling $${config.buy_price_ceiling}`,
          });
          return { action, status: 'skipped', details: 'Price above ceiling' };
        }

        const ethAmount = Math.floor((tradeUsd / 2500) * 1e18);
        const quote = await getSwapQuote({
          sellToken: TOKENS.WETH,
          buyToken: TOKENS.ZABAL,
          sellAmount: String(ethAmount),
          takerAddress: config.wallet_address,
        });

        const hash = await executeSwap('VAULT', quote);
        await burnZabal('VAULT', BigInt(quote.buyAmount));

        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_zabal',
          token_in: 'WETH',
          token_out: 'ZABAL',
          amount_in: ethAmount / 1e18,
          amount_out: parseFloat(quote.buyAmount) / 1e18,
          usd_value: tradeUsd,
          tx_hash: hash,
          status: 'success',
        });

        const buyZabalDetails = `Bought ${quote.buyAmount} ZABAL for ~$${tradeUsd.toFixed(2)}`;
        await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: buyZabalDetails, txHash: hash });

        logger.info(`[VAULT] buy_zabal: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} ZABAL`);
        return { action, status: 'success', details: buyZabalDetails };
      }

      case 'buy_sang': {
        const ethAmount = Math.floor((tradeUsd / 2500) * 1e18);
        const quote = await getSwapQuote({
          sellToken: TOKENS.WETH,
          buyToken: TOKENS.SANG,
          sellAmount: String(ethAmount),
          takerAddress: config.wallet_address,
        });

        const sangHash = await executeSwap('VAULT', quote);

        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_sang',
          token_in: 'WETH',
          token_out: 'SANG',
          amount_in: ethAmount / 1e18,
          amount_out: parseFloat(quote.buyAmount) / 1e18,
          usd_value: tradeUsd,
          tx_hash: sangHash,
          status: 'success',
        });

        const buySangDetails = `Bought ${quote.buyAmount} SANG for ~$${tradeUsd.toFixed(2)}`;
        await postTradeUpdate({ agentName: 'VAULT', action: 'buy_sang', details: buySangDetails, txHash: sangHash });

        logger.info(`[VAULT] buy_sang: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} SANG`);
        return { action, status: 'success', details: buySangDetails };
      }

      case 'buy_content': {
        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_content',
          usd_value: 0,
          status: 'success',
          error_message: 'Content purchases not yet wired (Phase 2)',
        });
        return { action, status: 'success', details: 'Content purchase placeholder (Phase 2)' };
      }

      case 'report': {
        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'report',
          status: 'success',
        });
        const reportDetails = 'Weekly report';
        await postTradeUpdate({ agentName: 'VAULT', action: 'report', details: reportDetails });
        return { action, status: 'success', details: reportDetails };
      }

      default: {
        return { action, status: 'skipped', details: `Unknown action: ${action}` };
      }
    }

    // Check auto-stake every run (will only execute if 14+ days since last)
    await maybeAutoStake('VAULT');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentEvent({
      agent_name: 'VAULT',
      action,
      status: 'failed',
      error_message: message,
    });
    logger.error(`[VAULT] ${action} failed:`, message);
    return { action, status: 'failed', details: message };
  }
}
