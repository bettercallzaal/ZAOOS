// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EQ_PRESETS, FREQUENCIES } from '../equalizer';

// ---------------------------------------------------------------------------
// EQ_PRESETS
// ---------------------------------------------------------------------------

describe('EQ_PRESETS', () => {
  it('has exactly 6 presets', () => {
    expect(Object.keys(EQ_PRESETS)).toHaveLength(6);
  });

  it('includes Flat, Bass Boost, Treble Boost, Vocal, Rock, Lo-Fi', () => {
    const names = Object.keys(EQ_PRESETS);
    expect(names).toContain('Flat');
    expect(names).toContain('Bass Boost');
    expect(names).toContain('Treble Boost');
    expect(names).toContain('Vocal');
    expect(names).toContain('Rock');
    expect(names).toContain('Lo-Fi');
  });

  it('every preset has exactly 5 band gain values', () => {
    for (const [name, gains] of Object.entries(EQ_PRESETS)) {
      expect(gains, name).toHaveLength(5);
    }
  });

  it('all gain values are finite numbers', () => {
    for (const [name, gains] of Object.entries(EQ_PRESETS)) {
      for (const g of gains) {
        expect(Number.isFinite(g), `${name} has non-finite gain`).toBe(true);
      }
    }
  });

  it('all gain values are within the clamped range [-12, 12]', () => {
    for (const [name, gains] of Object.entries(EQ_PRESETS)) {
      for (const g of gains) {
        expect(g, `${name} gain out of range`).toBeGreaterThanOrEqual(-12);
        expect(g, `${name} gain out of range`).toBeLessThanOrEqual(12);
      }
    }
  });

  it('Flat preset is all zeros', () => {
    expect(EQ_PRESETS['Flat']).toEqual([0, 0, 0, 0, 0]);
  });

  it('Bass Boost boosts low bands and leaves highs near zero', () => {
    const gains = EQ_PRESETS['Bass Boost'];
    expect(gains[0]).toBeGreaterThan(0); // 60 Hz boost
    expect(gains[1]).toBeGreaterThan(0); // 230 Hz boost
    expect(gains[4]).toBe(0);            // 14000 Hz unchanged
  });

  it('Treble Boost boosts high bands and leaves lows near zero', () => {
    const gains = EQ_PRESETS['Treble Boost'];
    expect(gains[0]).toBe(0);            // 60 Hz unchanged
    expect(gains[3]).toBeGreaterThan(0); // 3600 Hz boost
    expect(gains[4]).toBeGreaterThan(0); // 14000 Hz boost
  });
});

// ---------------------------------------------------------------------------
// FREQUENCIES
// ---------------------------------------------------------------------------

describe('FREQUENCIES', () => {
  it('has exactly 5 frequency bands', () => {
    expect(FREQUENCIES).toHaveLength(5);
  });

  it('bands are [60, 230, 910, 3600, 14000] Hz', () => {
    expect(FREQUENCIES).toEqual([60, 230, 910, 3600, 14000]);
  });

  it('all frequencies are positive integers', () => {
    for (const f of FREQUENCIES) {
      expect(Number.isInteger(f)).toBe(true);
      expect(f).toBeGreaterThan(0);
    }
  });

  it('frequencies are in ascending order', () => {
    for (let i = 1; i < FREQUENCIES.length; i++) {
      expect(FREQUENCIES[i]).toBeGreaterThan(FREQUENCIES[i - 1]);
    }
  });

  it('spans sub-bass (60 Hz) to near-ultrasonic (14000 Hz)', () => {
    expect(FREQUENCIES[0]).toBe(60);
    expect(FREQUENCIES[FREQUENCIES.length - 1]).toBe(14000);
  });
});
