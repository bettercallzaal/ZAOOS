/**
 * Hats Protocol client — read-only, server-side only.
 *
 * Uses @hatsprotocol/sdk-v1-core with a viem public client on Optimism.
 * All hat reads go through this singleton — never expose in browser bundle.
 */

import { HatsClient } from '@hatsprotocol/sdk-v1-core';
import type { PublicClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';
import { HATS_CHAIN_ID } from './constants';

let _client: HatsClient | null = null;

/** Get the singleton HatsClient (read-only, Optimism) */
export function getHatsClient(): HatsClient {
  if (!_client) {
    const publicClient = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io'),
    });

    _client = new HatsClient({
      chainId: HATS_CHAIN_ID,
      publicClient: publicClient as unknown as PublicClient,
    });
  }
  return _client;
}

/**
 * Check if a wallet address wears a specific hat.
 * Returns true if the address is an active wearer.
 */
export async function isWearerOfHat(
  walletAddress: `0x${string}`,
  hatId: bigint
): Promise<boolean> {
  const client = getHatsClient();
  return client.isWearerOfHat({
    wearer: walletAddress,
    hatId,
  });
}

/**
 * Get all hat IDs worn by a wallet address from a list of hat IDs.
 * Returns the subset of hatIds that the address currently wears.
 */
export async function getWornHats(
  walletAddress: `0x${string}`,
  hatIds: bigint[]
): Promise<bigint[]> {
  const client = getHatsClient();
  const results = await Promise.allSettled(
    hatIds.map((hatId) =>
      client.isWearerOfHat({ wearer: walletAddress, hatId })
    )
  );
  return hatIds.filter(
    (_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<boolean>).value
  );
}
