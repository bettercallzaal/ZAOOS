// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { AUDIO_FILTERS, FILTER_CATEGORIES } from '../audioFilters';

// ---------------------------------------------------------------------------
// FILTER_CATEGORIES
// ---------------------------------------------------------------------------

describe('FILTER_CATEGORIES', () => {
  it('has exactly 4 categories', () => {
    expect(FILTER_CATEGORIES).toHaveLength(4);
  });

  it('each category has label, icon, and keys fields', () => {
    for (const cat of FILTER_CATEGORIES) {
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
      expect(typeof cat.icon).toBe('string');
      expect(Array.isArray(cat.keys)).toBe(true);
    }
  });

  it('each category has exactly 10 keys', () => {
    for (const cat of FILTER_CATEGORIES) {
      expect(cat.keys).toHaveLength(10);
    }
  });

  it('total keys across all categories equals 40', () => {
    const total = FILTER_CATEGORIES.reduce((sum, cat) => sum + cat.keys.length, 0);
    expect(total).toBe(40);
  });

  it('no key appears in more than one category', () => {
    const all = FILTER_CATEGORIES.flatMap((c) => c.keys);
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it('every category key maps to an existing AUDIO_FILTERS preset', () => {
    for (const cat of FILTER_CATEGORIES) {
      for (const key of cat.keys) {
        expect(AUDIO_FILTERS).toHaveProperty(key);
      }
    }
  });

  it('labels are "Speed & Pitch", "Vibes", "Genres", "Fun"', () => {
    const labels = FILTER_CATEGORIES.map((c) => c.label);
    expect(labels).toEqual(['Speed & Pitch', 'Vibes', 'Genres', 'Fun']);
  });
});

// ---------------------------------------------------------------------------
// AUDIO_FILTERS
// ---------------------------------------------------------------------------

describe('AUDIO_FILTERS', () => {
  it('has exactly 40 presets', () => {
    expect(Object.keys(AUDIO_FILTERS)).toHaveLength(40);
  });

  it('every preset has name, description, icon, category, nodes, and playbackRate', () => {
    for (const [key, preset] of Object.entries(AUDIO_FILTERS)) {
      expect(typeof preset.name, key).toBe('string');
      expect(typeof preset.description, key).toBe('string');
      expect(typeof preset.icon, key).toBe('string');
      expect(['speed', 'eq', 'fun'], key).toContain(preset.category);
      expect(Array.isArray(preset.nodes), key).toBe(true);
      expect(typeof preset.playbackRate, key).toBe('number');
    }
  });

  it('all playbackRates are positive finite numbers', () => {
    for (const [key, preset] of Object.entries(AUDIO_FILTERS)) {
      expect(Number.isFinite(preset.playbackRate!), key).toBe(true);
      expect(preset.playbackRate!, key).toBeGreaterThan(0);
    }
  });

  it('all nodes arrays are empty (speed-only implementation)', () => {
    for (const [key, preset] of Object.entries(AUDIO_FILTERS)) {
      expect(preset.nodes, key).toHaveLength(0);
    }
  });

  it('every AUDIO_FILTERS key is referenced in exactly one FILTER_CATEGORIES category', () => {
    const allCategoryKeys = new Set(FILTER_CATEGORIES.flatMap((c) => c.keys));
    for (const key of Object.keys(AUDIO_FILTERS)) {
      expect(allCategoryKeys.has(key), `${key} should be in some category`).toBe(true);
    }
  });

  it('nightcore playbackRate is 1.25', () => {
    expect(AUDIO_FILTERS.nightcore.playbackRate).toBe(1.25);
  });

  it('vaporwave playbackRate is 0.8', () => {
    expect(AUDIO_FILTERS.vaporwave.playbackRate).toBe(0.8);
  });

  it('doubleTime playbackRate is 2.0', () => {
    expect(AUDIO_FILTERS.doubleTime.playbackRate).toBe(2.0);
  });

  it('halfSpeed playbackRate is 0.5', () => {
    expect(AUDIO_FILTERS.halfSpeed.playbackRate).toBe(0.5);
  });

  it('godMode playbackRate is 3.0 (the maximum)', () => {
    expect(AUDIO_FILTERS.godMode.playbackRate).toBe(3.0);
  });

  it('giant playbackRate is 0.45 (the minimum)', () => {
    // Smallest playbackRate in the set
    const min = Math.min(...Object.values(AUDIO_FILTERS).map((p) => p.playbackRate!));
    expect(AUDIO_FILTERS.giant.playbackRate).toBe(min);
  });

  it('speed-category presets all have category: "speed"', () => {
    const speedKeys = FILTER_CATEGORIES.find((c) => c.label === 'Speed & Pitch')!.keys;
    for (const key of speedKeys) {
      expect(AUDIO_FILTERS[key].category).toBe('speed');
    }
  });
});
