// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { curationWeight } from '../curationWeight';

describe('curationWeight', () => {
  it('returns 1 for 0 Respect (minimum weight)', () => {
    expect(curationWeight(0)).toBe(1);
  });

  it('returns 1 for negative scores (clamped to minimum)', () => {
    expect(curationWeight(-100)).toBe(1);
  });

  it('returns log2(respect + 1) for positive scores', () => {
    // 1 Respect → log2(2) = 1.0 (minimum clamp does not apply)
    expect(curationWeight(1)).toBeCloseTo(1.0, 5);
    // 3 Respect → log2(4) = 2.0
    expect(curationWeight(3)).toBeCloseTo(2.0, 5);
    // 7 Respect → log2(8) = 3.0
    expect(curationWeight(7)).toBeCloseTo(3.0, 5);
    // 15 Respect → log2(16) = 4.0
    expect(curationWeight(15)).toBeCloseTo(4.0, 5);
  });

  it('returns ~8.97 for 500 Respect and ~9.97 for 1000 Respect', () => {
    expect(curationWeight(500)).toBeCloseTo(Math.log2(501), 3); // ~8.97
    expect(curationWeight(1000)).toBeCloseTo(Math.log2(1001), 3); // ~9.97
  });

  it('weight increases monotonically with Respect', () => {
    const scores = [0, 10, 100, 500, 1000, 5000];
    for (let i = 1; i < scores.length; i++) {
      expect(curationWeight(scores[i])).toBeGreaterThan(curationWeight(scores[i - 1]));
    }
  });

  it('minimum weight is always 1 (log2(1) = 0 is clamped)', () => {
    // 0 Respect: log2(0+1) = 0 → clamped to 1
    expect(curationWeight(0)).toBe(1);
  });
});
