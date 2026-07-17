// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  INTELLIGENCE_BASE,
  RESPECT_THRESHOLD,
  SPOTLIGHT_TIERS,
  WAVEWARZ_WALLETS,
} from '../constants';

// ---------------------------------------------------------------------------
// SPOTLIGHT_TIERS
// ---------------------------------------------------------------------------
describe('SPOTLIGHT_TIERS', () => {
  it('has exactly 3 tiers', () => {
    expect(SPOTLIGHT_TIERS).toHaveLength(3);
  });

  it('each entry has tier, label, and minWins', () => {
    for (const entry of SPOTLIGHT_TIERS) {
      expect(entry).toHaveProperty('tier');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('minWins');
      expect(typeof entry.tier).toBe('string');
      expect(typeof entry.label).toBe('string');
      expect(typeof entry.minWins).toBe('number');
    }
  });

  it('contains the expected tier identifiers', () => {
    const tierIds = SPOTLIGHT_TIERS.map((t) => t.tier);
    expect(tierIds).toContain('rising_star');
    expect(tierIds).toContain('veteran');
    expect(tierIds).toContain('legend');
  });

  it('minWins values are in strictly ascending order', () => {
    for (let i = 1; i < SPOTLIGHT_TIERS.length; i++) {
      expect(SPOTLIGHT_TIERS[i].minWins).toBeGreaterThan(SPOTLIGHT_TIERS[i - 1].minWins);
    }
  });

  it('rising_star has minWins of 3', () => {
    const tier = SPOTLIGHT_TIERS.find((t) => t.tier === 'rising_star');
    expect(tier?.minWins).toBe(3);
  });

  it('veteran has minWins of 10', () => {
    const tier = SPOTLIGHT_TIERS.find((t) => t.tier === 'veteran');
    expect(tier?.minWins).toBe(10);
  });

  it('legend has minWins of 25', () => {
    const tier = SPOTLIGHT_TIERS.find((t) => t.tier === 'legend');
    expect(tier?.minWins).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// RESPECT_THRESHOLD
// ---------------------------------------------------------------------------
describe('RESPECT_THRESHOLD', () => {
  it('is a number greater than 0', () => {
    expect(typeof RESPECT_THRESHOLD).toBe('number');
    expect(RESPECT_THRESHOLD).toBeGreaterThan(0);
  });

  it('is 1000', () => {
    expect(RESPECT_THRESHOLD).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// INTELLIGENCE_BASE
// ---------------------------------------------------------------------------
describe('INTELLIGENCE_BASE', () => {
  it('is a string starting with https://', () => {
    expect(typeof INTELLIGENCE_BASE).toBe('string');
    expect(INTELLIGENCE_BASE.startsWith('https://')).toBe(true);
  });

  it('is a valid URL', () => {
    expect(() => new URL(INTELLIGENCE_BASE)).not.toThrow();
  });

  it('points to the wavewarz intelligence host', () => {
    expect(INTELLIGENCE_BASE).toBe('https://wavewarz-intelligence.vercel.app');
  });
});

// ---------------------------------------------------------------------------
// WAVEWARZ_WALLETS
// ---------------------------------------------------------------------------
describe('WAVEWARZ_WALLETS', () => {
  it('has exactly 43 entries', () => {
    expect(WAVEWARZ_WALLETS).toHaveLength(43);
  });

  it('every entry has a non-empty wallet string', () => {
    for (const entry of WAVEWARZ_WALLETS) {
      expect(typeof entry.wallet).toBe('string');
      expect(entry.wallet.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty name string', () => {
    for (const entry of WAVEWARZ_WALLETS) {
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it('every entry has exactly { wallet, name } shape', () => {
    for (const entry of WAVEWARZ_WALLETS) {
      expect(Object.keys(entry).sort()).toEqual(['name', 'wallet']);
    }
  });
});
