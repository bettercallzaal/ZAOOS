/**
 * The membership gate: a member is anyone holding ZAO Respect.
 *
 * Zaal, 2026-10-17: "just anyone with zao respect". ZAOOS doc 2684 addendum.
 * Respect is two soulbound tokens on Optimism. A balance above zero of either
 * one, on any of the member's Ethereum addresses, is enough.
 *
 * Addresses come from ZAOOS `community.config.ts` (`respect.ogContract`,
 * `respect.zorContract`, `respect.zorTokenId`), checked live on 2026-10-17.
 *
 * A failed read is UNKNOWN, never "not a member". ZAOOS learned this in
 * `src/lib/respect/onchainBalances.ts`: a failed read once became 0 and
 * zeroed members' cached Respect.
 */

import { createPublicClient, http, parseAbi } from 'viem';
import { optimism } from 'viem/chains';

/** OG Respect, ERC-20 (18 decimals), Optimism. */
export const OG_RESPECT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as const;
/** ZOR Respect, ERC-1155, Optimism. */
export const ZOR_RESPECT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;
export const ZOR_TOKEN_ID = BigInt(0);

const ogAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const zorAbi = parseAbi(['function balanceOf(address, uint256) view returns (uint256)']);

export type RespectCheck =
  | { status: 'member'; address: `0x${string}` }
  | { status: 'not-member'; checked: number }
  | { status: 'unknown'; reason: string };

/** One multicall result, as viem returns it with `allowFailure: true`. */
export interface CallResult {
  status: 'success' | 'failure';
  result?: unknown;
}

/** The slice of a viem public client this module needs, so tests can fake it. */
export interface MulticallClient {
  multicall(args: {
    contracts: readonly unknown[];
    allowFailure: true;
  }): Promise<CallResult[]>;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function optimismClient(rpcUrl: string): MulticallClient {
  return createPublicClient({ chain: optimism, transport: http(rpcUrl) }) as unknown as MulticallClient;
}

/**
 * Check whether any of `addresses` holds OG or ZOR Respect.
 *
 * - Any address with a balance over zero: member (a positive read is safe to
 *   trust even if another address's read failed).
 * - Otherwise, any failed read: unknown.
 * - Otherwise: not a member.
 */
export async function checkRespect(
  addresses: readonly string[],
  client: MulticallClient,
): Promise<RespectCheck> {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))].filter((a) =>
    ADDRESS_RE.test(a),
  ) as `0x${string}`[];

  if (unique.length === 0) return { status: 'not-member', checked: 0 };

  const contracts = unique.flatMap((addr) => [
    { address: OG_RESPECT, abi: ogAbi, functionName: 'balanceOf', args: [addr] },
    { address: ZOR_RESPECT, abi: zorAbi, functionName: 'balanceOf', args: [addr, ZOR_TOKEN_ID] },
  ]);

  let results: CallResult[];
  try {
    results = await client.multicall({ contracts, allowFailure: true });
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : 'multicall failed';
    return { status: 'unknown', reason };
  }

  if (results.length !== contracts.length) {
    return { status: 'unknown', reason: `expected ${contracts.length} results, got ${results.length}` };
  }

  let anyFailed = false;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== 'success' || typeof r.result !== 'bigint') {
      anyFailed = true;
      continue;
    }
    if (r.result > BigInt(0)) {
      return { status: 'member', address: unique[Math.floor(i / 2)] };
    }
  }

  if (anyFailed) return { status: 'unknown', reason: 'one or more balance reads failed' };
  return { status: 'not-member', checked: unique.length };
}
