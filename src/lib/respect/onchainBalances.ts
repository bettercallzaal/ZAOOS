/**
 * On-chain Respect balance interpretation for the member sync.
 *
 * The respect sync reads each member's OG (ERC-20) and ZOR (ERC-1155) balance
 * via a viem multicall and writes the result to respect_members. The previous
 * inline code did:
 *   const ogRaw = ogResult.status === 'success' ? ... : BigInt(0);
 * so a FAILED read became 0 and was WRITTEN to the DB - silently zeroing a
 * member's cached Respect on any transient RPC failure, corrupting the
 * leaderboard and governance weights.
 *
 * This helper keeps the same decimals (OG via formatEther, ZOR integer) but
 * reports whether both reads succeeded, so the caller can SKIP writing a
 * member whose read failed (preserving their existing value) instead of
 * overwriting it with 0.
 */

import { formatEther } from 'viem';
import type { BalanceCallResult } from './voteWeight';

export interface MemberBalances {
  /** True only when BOTH the OG and ZOR reads succeeded. */
  complete: boolean;
  /** OG balance (ERC-20, 18 decimals). 0 if its read failed. */
  onchainOg: number;
  /** ZOR balance (ERC-1155 integer). 0 if its read failed. */
  onchainZor: number;
  /** Which reads failed, for logging. */
  failed: Array<'og' | 'zor'>;
}

/**
 * Interpret a member's OG + ZOR multicall results. When `complete` is false the
 * caller MUST NOT write the (partial) values - skip the member so their existing
 * cached balance is preserved.
 */
export function readMemberBalances(og: BalanceCallResult, zor: BalanceCallResult): MemberBalances {
  const failed: Array<'og' | 'zor'> = [];

  let onchainOg = 0;
  if (og.status === 'success') {
    onchainOg = Number(formatEther(og.result as bigint));
  } else {
    failed.push('og');
  }

  let onchainZor = 0;
  if (zor.status === 'success') {
    onchainZor = Number(zor.result as bigint);
  } else {
    failed.push('zor');
  }

  return { complete: failed.length === 0, onchainOg, onchainZor, failed };
}
