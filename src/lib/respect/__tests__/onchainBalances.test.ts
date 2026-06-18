// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseEther } from 'viem';
import { readMemberBalances } from '../onchainBalances';

describe('readMemberBalances', () => {
  it('reads OG (18 decimals) and ZOR (integer) when both succeed', () => {
    const r = readMemberBalances(
      { status: 'success', result: parseEther('123.5') },
      { status: 'success', result: 7n },
    );
    expect(r.complete).toBe(true);
    expect(r.onchainOg).toBeCloseTo(123.5, 6);
    expect(r.onchainZor).toBe(7);
    expect(r.failed).toEqual([]);
  });

  it('treats a real zero balance as complete (both reads succeeded)', () => {
    const r = readMemberBalances(
      { status: 'success', result: 0n },
      { status: 'success', result: 0n },
    );
    expect(r.complete).toBe(true);
    expect(r.onchainOg).toBe(0);
    expect(r.onchainZor).toBe(0);
  });

  it('flags incomplete when the OG read fails (so the caller skips the write)', () => {
    const r = readMemberBalances({ status: 'failure' }, { status: 'success', result: 3n });
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['og']);
  });

  it('flags incomplete when the ZOR read fails', () => {
    const r = readMemberBalances({ status: 'success', result: parseEther('1') }, { status: 'failure' });
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['zor']);
  });

  it('flags both failed', () => {
    const r = readMemberBalances({ status: 'failure' }, { status: 'failure' });
    expect(r.complete).toBe(false);
    expect(r.failed).toEqual(['og', 'zor']);
  });
});
