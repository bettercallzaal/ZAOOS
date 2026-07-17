// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { KEYFRAMES, tokensFor, withAlpha } from '../brand';

// ---------------------------------------------------------------------------
// withAlpha
// ---------------------------------------------------------------------------

describe('withAlpha', () => {
  it('converts #rrggbb to rgba with full opacity', () => {
    expect(withAlpha('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('converts #ffffff to rgba with half opacity', () => {
    expect(withAlpha('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('converts #000000 to rgba with 0 opacity', () => {
    expect(withAlpha('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  it('converts #aabbcc correctly', () => {
    // aa=170, bb=187, cc=204
    expect(withAlpha('#aabbcc', 0.8)).toBe('rgba(170, 187, 204, 0.8)');
  });

  it('passes through input unchanged when not a 6-char hex', () => {
    expect(withAlpha('#abc', 0.5)).toBe('#abc');
  });

  it('passes through non-hex strings unchanged', () => {
    expect(withAlpha('red', 0.5)).toBe('red');
  });

  it('handles the ZAO gold accent color', () => {
    expect(withAlpha('#f5a623', 0.45)).toBe('rgba(245, 166, 35, 0.45)');
  });
});

// ---------------------------------------------------------------------------
// KEYFRAMES
// ---------------------------------------------------------------------------

describe('KEYFRAMES', () => {
  it('is a non-empty string', () => {
    expect(typeof KEYFRAMES).toBe('string');
    expect(KEYFRAMES.length).toBeGreaterThan(0);
  });

  it('defines the zg-fade-up animation', () => {
    expect(KEYFRAMES).toContain('zg-fade-up');
  });

  it('defines the zg-pulse animation', () => {
    expect(KEYFRAMES).toContain('zg-pulse');
  });

  it('includes reduced-motion media query', () => {
    expect(KEYFRAMES).toContain('prefers-reduced-motion');
  });
});

// ---------------------------------------------------------------------------
// tokensFor
// ---------------------------------------------------------------------------

describe('tokensFor', () => {
  const darkMediumCfg = { theme: 'dark' as const, size: 'medium' as const, accent: '#f5a623' };
  const lightSmallCfg = { theme: 'light' as const, size: 'small' as const, accent: '#5865F2' };
  const largeCfg = { theme: 'dark' as const, size: 'large' as const, accent: '#f5a623' };

  it('returns an object with all required token fields', () => {
    const t = tokensFor(darkMediumCfg);
    expect(typeof t.panelBg).toBe('string');
    expect(typeof t.panelBorder).toBe('string');
    expect(typeof t.titleColor).toBe('string');
    expect(typeof t.subtitleColor).toBe('string');
    expect(typeof t.accent).toBe('string');
    expect(typeof t.fontStack).toBe('string');
    expect(typeof t.scale).toBe('number');
  });

  it('scale is 1 for "medium" size', () => {
    expect(tokensFor(darkMediumCfg).scale).toBe(1);
  });

  it('scale is 0.82 for "small" size', () => {
    expect(tokensFor(lightSmallCfg).scale).toBe(0.82);
  });

  it('scale is 1.25 for "large" size', () => {
    expect(tokensFor(largeCfg).scale).toBe(1.25);
  });

  it('dark theme titleColor is white', () => {
    expect(tokensFor(darkMediumCfg).titleColor).toBe('#ffffff');
  });

  it('light theme titleColor is dark navy', () => {
    expect(tokensFor(lightSmallCfg).titleColor).toBe('#141e27');
  });

  it('accent passes through from config', () => {
    expect(tokensFor(darkMediumCfg).accent).toBe('#f5a623');
    expect(tokensFor(lightSmallCfg).accent).toBe('#5865F2');
  });
});
