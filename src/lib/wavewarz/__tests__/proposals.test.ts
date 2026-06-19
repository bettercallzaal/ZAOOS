// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getNewSpotlightTier } from '../proposals';

// SPOTLIGHT_TIERS thresholds: rising_star >= 3, veteran >= 10, legend >= 25.
describe('getNewSpotlightTier', () => {
  it('returns null below the lowest threshold', () => {
    expect(getNewSpotlightTier(0, null)).toBeNull();
    expect(getNewSpotlightTier(2, null)).toBeNull();
  });

  it('promotes a new artist to the highest tier they qualify for', () => {
    expect(getNewSpotlightTier(3, null)).toBe('rising_star');
    expect(getNewSpotlightTier(9, null)).toBe('rising_star');
    expect(getNewSpotlightTier(10, null)).toBe('veteran');
    expect(getNewSpotlightTier(24, null)).toBe('veteran');
    expect(getNewSpotlightTier(25, null)).toBe('legend');
    expect(getNewSpotlightTier(1000, null)).toBe('legend');
  });

  it('promotes up one tier at a time as wins grow', () => {
    expect(getNewSpotlightTier(10, 'rising_star')).toBe('veteran');
    expect(getNewSpotlightTier(25, 'veteran')).toBe('legend');
  });

  it('can skip a tier when wins jump past two thresholds', () => {
    expect(getNewSpotlightTier(30, 'rising_star')).toBe('legend');
    expect(getNewSpotlightTier(100, null)).toBe('legend');
  });

  it('does not re-promote to the current tier or below', () => {
    expect(getNewSpotlightTier(9, 'rising_star')).toBeNull();
    expect(getNewSpotlightTier(20, 'veteran')).toBeNull();
    expect(getNewSpotlightTier(1000, 'legend')).toBeNull();
  });

  it('never demotes when wins drop below the current tier', () => {
    expect(getNewSpotlightTier(2, 'rising_star')).toBeNull();
    expect(getNewSpotlightTier(0, 'legend')).toBeNull();
  });

  it('treats an unknown current tier as no tier (promotes from scratch)', () => {
    expect(getNewSpotlightTier(10, 'nonexistent')).toBe('veteran');
  });
});
