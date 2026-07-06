// @vitest-environment node

import { parseEther } from 'viem';
import { describe, expect, it } from 'vitest';
import { computeRespectWeight } from '../voteWeight';

describe('computeRespectWeight', () => {
  it('sums OG (18 decimals) and ZOR (integer) when both reads succeed', () => {
    const og = { status: 'success' as const, result: parseEther('40') }; // 40 OG
    const zor = { status: 'success' as const, result: 26n }; // 26 ZOR
    const r = computeRespectWeight(og, zor);
    expect(r.weight).toBe(66);
    expect(r.complete).toBe(true);
    expect(r.failed).toEqual([]);
  });

  it('flags incomplete and lists og when the OG read fails', () => {
    const og = { status: 'failure' as const };
    const zor = { status: 'success' as const, result: 10n };
    const r = computeRespectWeight(og, zor);
    expect(r.weight).toBe(10); // only the successful read counts
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['og']);
  });

  it('flags incomplete and lists zor when the ZOR read fails', () => {
    const og = { status: 'success' as const, result: parseEther('5') };
    const zor = { status: 'failure' as const };
    const r = computeRespectWeight(og, zor);
    expect(r.weight).toBe(5);
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['zor']);
  });

  it('reports both failed and zero weight when both reads fail', () => {
    const r = computeRespectWeight({ status: 'failure' }, { status: 'failure' });
    expect(r.weight).toBe(0);
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['og', 'zor']);
  });

  it('rounds fractional OG balances', () => {
    const og = { status: 'success' as const, result: parseEther('1.6') };
    const zor = { status: 'success' as const, result: 0n };
    expect(computeRespectWeight(og, zor).weight).toBe(2);
  });
});
