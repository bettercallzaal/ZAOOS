// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { STAKING_ABI, ZABAL_STAKING_CONTRACT } from '../contract';

// ---------------------------------------------------------------------------
// ZABAL_STAKING_CONTRACT
// ---------------------------------------------------------------------------

describe('ZABAL_STAKING_CONTRACT', () => {
  it('is a string (env var or empty fallback)', () => {
    expect(typeof ZABAL_STAKING_CONTRACT).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// STAKING_ABI
// ---------------------------------------------------------------------------

describe('STAKING_ABI', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(STAKING_ABI)).toBe(true);
    expect(STAKING_ABI.length).toBeGreaterThan(0);
  });

  it('includes the stake function', () => {
    const names = STAKING_ABI.map((e) => e.name);
    expect(names).toContain('stake');
  });

  it('includes the unstake function', () => {
    const names = STAKING_ABI.map((e) => e.name);
    expect(names).toContain('unstake');
  });

  it('includes getConviction view function', () => {
    const names = STAKING_ABI.map((e) => e.name);
    expect(names).toContain('getConviction');
  });

  it('includes getActiveStakes view function', () => {
    const names = STAKING_ABI.map((e) => e.name);
    expect(names).toContain('getActiveStakes');
  });

  it('includes totalSupplyStaked view function', () => {
    const names = STAKING_ABI.map((e) => e.name);
    expect(names).toContain('totalSupplyStaked');
  });

  it('stake function is nonpayable', () => {
    const stakeEntry = STAKING_ABI.find((e) => e.name === 'stake');
    expect(stakeEntry?.stateMutability).toBe('nonpayable');
  });

  it('getConviction is a view function', () => {
    const entry = STAKING_ABI.find((e) => e.name === 'getConviction');
    expect(entry?.stateMutability).toBe('view');
  });

  it('every entry has a name, type, and stateMutability', () => {
    for (const entry of STAKING_ABI) {
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.stateMutability).toBe('string');
    }
  });
});
