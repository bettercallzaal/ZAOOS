import { sendToken } from './wallet';
import { logAgentEvent } from './events';
import { TOKENS, BURN_ADDRESS, BURN_PCT, type AgentName } from './types';
import { logger } from '@/lib/logger';

export async function burnZabal(
  agentName: AgentName,
  totalAmount: bigint
): Promise<string | null> {
  const burnAmount = (totalAmount * BigInt(Math.floor(BURN_PCT * 10000))) / BigInt(10000);
  if (burnAmount === BigInt(0)) return null;
  if (totalAmount <= BigInt(0)) {
    logger.warn(`[${agentName}] Burn skipped: no ZABAL to burn (amount=${totalAmount})`);
    return null;
  }

  try {
    const hash = await sendToken(agentName, TOKENS.ZABAL, BURN_ADDRESS, burnAmount);
    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      token_in: 'ZABAL',
      token_out: 'BURN',
      amount_in: Number(burnAmount) / 1e18,
      usd_value: 0,
      tx_hash: hash,
      status: 'success',
    });
    logger.info(`[${agentName}] Burned ${burnAmount} ZABAL (1%)`);
    return hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      token_in: 'ZABAL',
      token_out: 'BURN',
      amount_in: Number(burnAmount) / 1e18,
      usd_value: 0,
      status: 'failed',
      error_message: msg,
    });
    logger.error(`[${agentName}] Burn failed: ${msg}`);
    return null;
  }
}
