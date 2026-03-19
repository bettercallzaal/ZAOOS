import { describe, it, expect } from 'vitest';
import { HAT_IDS, PROJECT_HAT_IDS, HAT_LABELS, formatHatId, TREE_ID, HATS_CHAIN_ID } from '@/lib/hats/constants';

describe('Hats constants', () => {
  it('has correct tree ID and chain', () => {
    expect(TREE_ID).toBe(226);
    expect(HATS_CHAIN_ID).toBe(10);
  });

  it('generates unique hat IDs for each role', () => {
    const ids = Object.values(HAT_IDS);
    const unique = new Set(ids.map(String));
    expect(unique.size).toBe(ids.length);
  });

  it('generates unique project hat IDs', () => {
    const ids = Object.values(PROJECT_HAT_IDS);
    const unique = new Set(ids.map(String));
    expect(unique.size).toBe(ids.length);
  });

  it('topHat has tree domain 226 in upper bits', () => {
    const hex = formatHatId(HAT_IDS.topHat);
    // Tree 226 = 0xe2, should be in the upper 32 bits
    expect(hex).toMatch(/^0x000000e2/);
  });

  it('configurator is a child of topHat', () => {
    const topHex = formatHatId(HAT_IDS.topHat);
    const confHex = formatHatId(HAT_IDS.configurator);
    // Both share the same tree domain prefix
    expect(confHex.slice(0, 12)).toBe(topHex.slice(0, 12));
    // Configurator has non-zero bits at level 1 position
    expect(confHex).not.toBe(topHex);
  });

  it('has labels for all main hat IDs', () => {
    for (const [key, id] of Object.entries(HAT_IDS)) {
      expect(HAT_LABELS[id.toString()]).toBeDefined();
      expect(HAT_LABELS[id.toString()]).not.toBe('');
    }
  });

  it('formatHatId produces 66-char hex string', () => {
    const hex = formatHatId(HAT_IDS.topHat);
    expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
    expect(hex.length).toBe(66);
  });

  it('formatHatId handles zero', () => {
    const hex = formatHatId(BigInt(0));
    expect(hex).toBe('0x' + '0'.repeat(64));
  });
});
