// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { curationWeight } from '../curationWeight';

// curationWeight(respect) = max(1, log2(respect + 1))
// Members with 0 Respect still have weight 1 (their votes count).

describe('curationWeight', () => {
  it('returns 1 for 0 respect (floor at 1)', () => {
    expect(curationWeight(0)).toBe(1);
  });

  it('returns 1 for 1 respect (log2(2)=1, exactly at the floor)', () => {
    expect(curationWeight(1)).toBe(1);
  });

  it('returns 2 for 3 respect (log2(4)=2)', () => {
    expect(curationWeight(3)).toBe(2);
  });

  it('returns 3 for 7 respect (log2(8)=3)', () => {
    expect(curationWeight(7)).toBe(3);
  });

  it('returns ~8.97 for 500 respect (log2(501))', () => {
    const result = curationWeight(500);
    expect(result).toBeGreaterThan(8.9);
    expect(result).toBeLessThan(9.1);
  });

  it('result is always >= 1 (floor enforced)', () => {
    for (const r of [0, 1, 2, 10, 100, 1000]) {
      expect(curationWeight(r)).toBeGreaterThanOrEqual(1);
    }
  });

  it('result increases monotonically with respect', () => {
    const weights = [0, 3, 7, 15, 100, 500].map(curationWeight);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThanOrEqual(weights[i - 1]);
    }
  });

  it('returns a finite number for a large respect score', () => {
    expect(Number.isFinite(curationWeight(100_000))).toBe(true);
  });
});
