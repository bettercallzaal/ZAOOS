/**
 * Respect vote-weight computation.
 *
 * A proposal vote's weight is the voter's on-chain OG + ZOR Respect balance,
 * read via a viem multicall. The previous inline code did:
 *   const og = ogBalance.status === 'success' ? Number(formatEther(...)) : 0;
 * which silently turned a FAILED balance read into 0 - indistinguishable from a
 * real zero balance. A voter whose read failed would have their vote recorded
 * with an undercounted weight and no signal that anything went wrong.
 *
 * This helper keeps the same math but reports whether every read actually
 * succeeded, so the caller can refuse to record a vote with a corrupted weight.
 *
 * OG Respect is an ERC-20 (18 decimals -> formatEther). ZOR Respect is an
 * ERC-1155 integer balance (used as-is).
 */

import { formatEther } from 'viem';

export interface BalanceCallResult {
  status: 'success' | 'failure';
  result?: unknown;
}

export interface RespectWeight {
  /** Rounded sum of the balances that were read successfully. */
  weight: number;
  /** True only when BOTH the OG and ZOR reads succeeded. */
  complete: boolean;
  /** Which reads failed, for logging. */
  failed: Array<'og' | 'zor'>;
}

/**
 * Compute vote weight from the OG (ERC-20) and ZOR (ERC-1155) multicall results.
 * A failed read contributes 0 to the weight but is reported in `failed` and
 * flips `complete` to false so the caller can reject the vote and ask for a retry
 * instead of silently undercounting it.
 */
export function computeRespectWeight(og: BalanceCallResult, zor: BalanceCallResult): RespectWeight {
  const failed: Array<'og' | 'zor'> = [];

  let ogValue = 0;
  if (og.status === 'success') {
    ogValue = Number(formatEther(og.result as bigint));
  } else {
    failed.push('og');
  }

  let zorValue = 0;
  if (zor.status === 'success') {
    zorValue = Number(zor.result as bigint);
  } else {
    failed.push('zor');
  }

  return {
    weight: Math.round(ogValue + zorValue),
    complete: failed.length === 0,
    failed,
  };
}
