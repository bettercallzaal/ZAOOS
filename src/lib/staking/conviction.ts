// src/lib/staking/conviction.ts
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { ZABAL_STAKING_CONTRACT, STAKING_ABI } from './contract';

const client = createPublicClient({ chain: base, transport: http() });

export interface ConvictionEntry {
  address: string;
  conviction: string;
  staked: string;
  stakedFormatted: string;
  convictionFormatted: string;
}

/**
 * Get conviction for a list of wallet addresses.
 * Used by the staking leaderboard.
 */
export async function getConvictionBatch(addresses: string[]): Promise<ConvictionEntry[]> {
  if (!ZABAL_STAKING_CONTRACT) return [];

  const results = await Promise.allSettled(
    addresses.map(async (addr) => {
      const [conviction, staked] = await Promise.all([
        client.readContract({
          address: ZABAL_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'getConviction',
          args: [addr as `0x${string}`],
        }),
        client.readContract({
          address: ZABAL_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'totalStaked',
          args: [addr as `0x${string}`],
        }),
      ]);
      return {
        address: addr,
        conviction: conviction.toString(),
        staked: staked.toString(),
        stakedFormatted: formatUnits(staked, 18).split('.')[0],
        convictionFormatted: (Number(conviction) / 1e30).toFixed(1) + 'T',
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ConvictionEntry> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((e) => e.staked !== '0')
    .sort((a, b) => Number(BigInt(b.conviction) - BigInt(a.conviction)));
}
