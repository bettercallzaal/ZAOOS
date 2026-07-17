// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { PORTALS, getPortalById } from '../destinations';

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const VALID_IDS = ['music', 'social', 'build', 'earn', 'govern', 'vip'] as const;

// ---------------------------------------------------------------------------
// PORTALS constant
// ---------------------------------------------------------------------------

describe('PORTALS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PORTALS)).toBe(true);
    expect(PORTALS.length).toBeGreaterThan(0);
  });

  it('has exactly 6 portals', () => {
    expect(PORTALS).toHaveLength(6);
  });

  it('includes all expected portal IDs', () => {
    const ids = PORTALS.map((p) => p.id);
    for (const id of VALID_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('every portal has required fields: id, title, subtitle, icon, glowColor, locked, destinations', () => {
    for (const portal of PORTALS) {
      expect(typeof portal.id).toBe('string');
      expect(typeof portal.title).toBe('string');
      expect(typeof portal.subtitle).toBe('string');
      expect(typeof portal.icon).toBe('string');
      expect(typeof portal.glowColor).toBe('string');
      expect(typeof portal.locked).toBe('boolean');
      expect(Array.isArray(portal.destinations)).toBe(true);
    }
  });

  it('every portal glowColor is a hex color string', () => {
    for (const portal of PORTALS) {
      expect(portal.glowColor).toMatch(HEX_COLOR);
    }
  });

  it('every portal has at least one destination', () => {
    for (const portal of PORTALS) {
      expect(portal.destinations.length).toBeGreaterThan(0);
    }
  });

  it('every destination has name, url, description, and external fields', () => {
    for (const portal of PORTALS) {
      for (const dest of portal.destinations) {
        expect(typeof dest.name).toBe('string');
        expect(typeof dest.url).toBe('string');
        expect(typeof dest.description).toBe('string');
        expect(typeof dest.external).toBe('boolean');
      }
    }
  });

  it('all portal IDs are unique', () => {
    const ids = PORTALS.map((p) => p.id);
    expect(new Set(ids).size).toBe(PORTALS.length);
  });
});

// ---------------------------------------------------------------------------
// Lock state
// ---------------------------------------------------------------------------

describe('PORTALS lock state', () => {
  it('vip portal is locked', () => {
    const vip = PORTALS.find((p) => p.id === 'vip');
    expect(vip?.locked).toBe(true);
  });

  it('vip portal has gateType "allowlist"', () => {
    const vip = PORTALS.find((p) => p.id === 'vip');
    expect(vip?.gateType).toBe('allowlist');
  });

  it('all non-vip portals are unlocked', () => {
    for (const portal of PORTALS.filter((p) => p.id !== 'vip')) {
      expect(portal.locked).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Spot content checks
// ---------------------------------------------------------------------------

describe('PORTALS spot content', () => {
  it('music portal includes a WaveWarZ destination', () => {
    const music = PORTALS.find((p) => p.id === 'music');
    const names = music?.destinations.map((d) => d.name) ?? [];
    expect(names.some((n) => n.toLowerCase().includes('wavewarz'))).toBe(true);
  });

  it('earn portal includes an Empire Builder destination', () => {
    const earn = PORTALS.find((p) => p.id === 'earn');
    const names = earn?.destinations.map((d) => d.name) ?? [];
    expect(names.some((n) => n.toLowerCase().includes('empire'))).toBe(true);
  });

  it('govern portal includes a ZOUNZ destination', () => {
    const govern = PORTALS.find((p) => p.id === 'govern');
    const names = govern?.destinations.map((d) => d.name) ?? [];
    expect(names.some((n) => n.toLowerCase().includes('zounz'))).toBe(true);
  });

  it('vip portal includes an internal (external: false) destination', () => {
    const vip = PORTALS.find((p) => p.id === 'vip');
    const hasInternal = vip?.destinations.some((d) => d.external === false) ?? false;
    expect(hasInternal).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPortalById
// ---------------------------------------------------------------------------

describe('getPortalById', () => {
  it('returns the music portal by id', () => {
    const result = getPortalById('music');
    expect(result?.id).toBe('music');
  });

  it('returns the vip portal by id', () => {
    const result = getPortalById('vip');
    expect(result?.id).toBe('vip');
    expect(result?.locked).toBe(true);
  });

  it('returns undefined for an unknown id', () => {
    expect(getPortalById('nonexistent')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getPortalById('')).toBeUndefined();
  });

  it('can retrieve every portal by its id', () => {
    for (const id of VALID_IDS) {
      expect(getPortalById(id)?.id).toBe(id);
    }
  });
});
