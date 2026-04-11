/**
 * Agent Wallet Module -- Privy Agentic Wallets
 *
 * Uses Privy's TEE-secured server wallets instead of raw private keys.
 * Keys are generated inside a Trusted Execution Environment, split via
 * Shamir secret sharing, and never exposed in plaintext.
 *
 * Policies enforce spending limits, contract allowlists, and time windows
 * at signing time -- before any transaction executes.
 *
 * Required env vars:
 *   PRIVY_APP_ID       -- from privy.io dashboard
 *   PRIVY_APP_SECRET   -- from privy.io dashboard
 *   VAULT_WALLET_ID    -- Privy wallet ID for VAULT agent
 *   BANKER_WALLET_ID   -- Privy wallet ID for BANKER agent
 *   DEALER_WALLET_ID   -- Privy wallet ID for DEALER agent
 */

import { PrivyClient } from '@privy-io/node';
import type { AgentName } from './types';
import { logger } from '@/lib/logger';

const BASE_CAIP2 = 'eip155:8453'; // Base mainnet

let _privy: PrivyClient | null = null;

function getPrivy(): PrivyClient {
  if (!_privy) {
    const appId = process.env.PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be configured');
    }
    _privy = new PrivyClient({ appId, appSecret });
  }
  return _privy;
}

const WALLET_ID_MAP: Record<AgentName, string> = {
  VAULT: 'VAULT_WALLET_ID',
  BANKER: 'BANKER_WALLET_ID',
  DEALER: 'DEALER_WALLET_ID',
};

function getWalletId(agentName: AgentName): string {
  const envKey = WALLET_ID_MAP[agentName];
  const walletId = process.env[envKey];
  if (!walletId) throw new Error(`${envKey} not configured`);
  return walletId;
}

/**
 * Execute a swap transaction on Base using 0x quote data.
 * Privy signs the transaction in a TEE -- private key never leaves the enclave.
 * Policy engine enforces spending limits before signing.
 */
export async function executeSwap(
  agentName: AgentName,
  quoteData: { to: string; data: string; value: string; gas?: string }
): Promise<string> {
  const privy = getPrivy();
  const walletId = getWalletId(agentName);

  logger.info(`[${agentName}] Sending swap tx to ${quoteData.to} via Privy`);

  const response = await privy.wallets().ethereum().sendTransaction(walletId, {
    caip2: BASE_CAIP2,
    params: {
      transaction: {
        to: quoteData.to,
        data: quoteData.data,
        value: quoteData.value,
        chain_id: 8453,
      },
    },
  });

  logger.info(`[${agentName}] TX submitted: ${response.hash}`);
  return response.hash;
}

/**
 * Send ERC-20 tokens (for burns, tips, transfers).
 * Privy signs in TEE with policy checks.
 */
export async function sendToken(
  agentName: AgentName,
  tokenAddress: string,
  to: string,
  amount: bigint
): Promise<string> {
  const privy = getPrivy();
  const walletId = getWalletId(agentName);

  // ERC-20 transfer(address,uint256) selector: 0xa9059cbb
  const data = `0xa9059cbb${to.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`;

  logger.info(`[${agentName}] Token transfer to ${to} via Privy`);

  const response = await privy.wallets().ethereum().sendTransaction(walletId, {
    caip2: BASE_CAIP2,
    params: {
      transaction: {
        to: tokenAddress,
        data,
        value: '0x0',
        chain_id: 8453,
      },
    },
  });

  logger.info(`[${agentName}] Token transfer: ${response.hash}`);
  return response.hash;
}
