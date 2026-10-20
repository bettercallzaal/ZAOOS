// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  aggregateBuyers,
  blockChunks,
  estimateStartBlock,
  type PurchaseLog,
  rawToUsdc,
  usdcToRaw,
  WAVEZ_DEPLOY_BLOCK,
} from '../lib/wavez-buyers';

const A = '0x00000000000000000000000000000000000000aA' as const;
const B = '0x00000000000000000000000000000000000000bb' as const;

function log(
  buyer: `0x${string}`,
  usdc: string,
  block: number,
  tx: string,
  logIndex = 0,
): PurchaseLog {
  return {
    buyer,
    amount: usdcToRaw(usdc),
    blockNumber: BigInt(block),
    transactionHash: tx as `0x${string}`,
    logIndex,
  };
}

describe('usdc conversion', () => {
  it.each([
    ['1', 1_000_000n],
    ['0.5', 500_000n],
    ['1000.000001', 1_000_000_001n],
  ])('%s USDC is %s raw and back', (usdc, raw) => {
    expect(usdcToRaw(usdc)).toBe(raw);
    expect(rawToUsdc(raw)).toBe(usdc);
  });

  it.each(['-1', '1.0000001', 'abc', ''])('refuses %s', (usdc) => {
    expect(() => usdcToRaw(usdc)).toThrow();
  });
});

describe('aggregateBuyers', () => {
  it('sums per buyer, case-insensitively, and keeps those at or over the minimum', () => {
    const result = aggregateBuyers(
      [
        log(A, '0.5', 10, '0x1'),
        log(A.toLowerCase() as `0x${string}`, '0.5', 12, '0x2'),
        log(B, '0.99', 11, '0x3'),
      ],
      usdcToRaw('1'),
    );
    expect(result).toEqual([
      {
        buyer: A.toLowerCase(),
        totalUsdc: '1',
        totalRaw: 1_000_000n,
        buys: 2,
        firstBlock: 10n,
        lastBlock: 12n,
      },
    ]);
  });

  it('counts a purchase seen twice only once', () => {
    const dup = log(A, '1', 10, '0x1', 3);
    expect(aggregateBuyers([dup, { ...dup }], 0n)[0].buys).toBe(1);
  });

  it('keeps two purchases in one transaction when their log index differs', () => {
    const result = aggregateBuyers([log(A, '1', 10, '0x1', 0), log(A, '1', 10, '0x1', 1)], 0n);
    expect(result[0].totalUsdc).toBe('2');
  });

  it('orders by first purchase block', () => {
    const result = aggregateBuyers([log(B, '1', 20, '0x1'), log(A, '1', 5, '0x2')], 0n);
    expect(result.map((r) => r.firstBlock)).toEqual([5n, 20n]);
  });

  it('returns an empty list for no purchases', () => {
    expect(aggregateBuyers([], usdcToRaw('1'))).toEqual([]);
  });
});

describe('blockChunks', () => {
  it('covers the range exactly, with a short last chunk', () => {
    expect(blockChunks(0n, 10n, 4n)).toEqual([
      [0n, 3n],
      [4n, 7n],
      [8n, 10n],
    ]);
  });

  it('returns one chunk for a single block and refuses a zero size', () => {
    expect(blockChunks(5n, 5n, 100n)).toEqual([[5n, 5n]]);
    expect(() => blockChunks(0n, 1n, 0n)).toThrow();
  });
});

describe('estimateStartBlock', () => {
  const now = Date.parse('2026-10-20T16:00:00Z');
  const latest = 60_000_000n;

  it('starts a margin before a song created an hour ago', () => {
    // 3600 s * 1.2 + 3600 s = 7920 s, / 2 s per block = 3960 blocks back.
    expect(estimateStartBlock(latest, '2026-10-20T15:00:00Z', now)).toBe(latest - 3_960n);
  });

  it('falls back to the deploy block without a usable date', () => {
    expect(estimateStartBlock(latest, undefined, now)).toBe(WAVEZ_DEPLOY_BLOCK);
    expect(estimateStartBlock(latest, 'not a date', now)).toBe(WAVEZ_DEPLOY_BLOCK);
  });

  it('falls back to the deploy block for a date in the future', () => {
    expect(estimateStartBlock(latest, '2027-01-01T00:00:00Z', now)).toBe(WAVEZ_DEPLOY_BLOCK);
  });

  it('never starts before the deploy block', () => {
    expect(estimateStartBlock(latest, '2020-01-01T00:00:00Z', now)).toBe(WAVEZ_DEPLOY_BLOCK);
  });
});
