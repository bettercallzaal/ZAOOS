// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { BASE_CHAIN_ID, BURN_ADDRESS, BURN_PCT, TOKENS, ZABAL_STAKING_CONTRACT } from '../types';

// Valid Ethereum address: 0x followed by exactly 40 hex chars
const ETH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

describe('TOKENS', () => {
  it('has exactly 4 token addresses', () => {
    expect(Object.keys(TOKENS)).toHaveLength(4);
  });

  it('includes ZABAL, SANG, WETH, USDC keys', () => {
    expect(Object.keys(TOKENS)).toEqual(expect.arrayContaining(['ZABAL', 'SANG', 'WETH', 'USDC']));
  });

  it('ZABAL is a valid Ethereum address', () => {
    expect(TOKENS.ZABAL).toMatch(ETH_ADDRESS);
  });

  it('SANG is a valid Ethereum address', () => {
    expect(TOKENS.SANG).toMatch(ETH_ADDRESS);
  });

  it('WETH is the canonical Base WETH address', () => {
    expect(TOKENS.WETH).toBe('0x4200000000000000000000000000000000000006');
  });

  it('USDC is the canonical Base USDC address', () => {
    expect(TOKENS.USDC).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  });

  it('all token addresses are distinct', () => {
    const addrs = Object.values(TOKENS).map((a) => a.toLowerCase());
    expect(new Set(addrs).size).toBe(addrs.length);
  });
});

describe('BASE_CHAIN_ID', () => {
  it('is 8453 (Base mainnet)', () => {
    expect(BASE_CHAIN_ID).toBe(8453);
  });
});

describe('BURN_ADDRESS', () => {
  it('is the canonical dead address', () => {
    expect(BURN_ADDRESS).toBe('0x000000000000000000000000000000000000dEaD');
  });

  it('is a valid Ethereum address', () => {
    expect(BURN_ADDRESS).toMatch(ETH_ADDRESS);
  });
});

describe('BURN_PCT', () => {
  it('is 0.01 (1%)', () => {
    expect(BURN_PCT).toBe(0.01);
  });

  it('is a positive finite number', () => {
    expect(Number.isFinite(BURN_PCT)).toBe(true);
    expect(BURN_PCT).toBeGreaterThan(0);
    expect(BURN_PCT).toBeLessThan(1);
  });
});

describe('ZABAL_STAKING_CONTRACT', () => {
  it('is a string (env var or empty fallback)', () => {
    expect(typeof ZABAL_STAKING_CONTRACT).toBe('string');
  });
});
