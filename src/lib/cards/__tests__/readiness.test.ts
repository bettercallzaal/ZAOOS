// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getCardFont, resolveFontFamily } from '../fonts';
import { exportReadiness } from '../readiness';
import { type CardDraft, createBlankDraft } from '../schema';

function draft(overrides: Partial<CardDraft> = {}): CardDraft {
  return {
    ...createBlankDraft(0),
    name: 'Card',
    credits: { artist: 'Test Artist', photographer: '', frameDesigner: '' },
    ...overrides,
  };
}

describe('exportReadiness', () => {
  it('allows everything once named, credited and approved', () => {
    expect(exportReadiness(draft({ approved: true }))).toEqual({
      canExportImages: true,
      canExportBundle: true,
      missing: [],
    });
  });

  it('allows images but locks the bundle until the artist approves', () => {
    const r = exportReadiness(draft());
    expect(r.canExportImages).toBe(true);
    expect(r.canExportBundle).toBe(false);
    expect(r.missing).toEqual(['your approval of the card and its credits']);
  });

  it('blocks all exports without the artist credit, even when approved', () => {
    const r = exportReadiness(
      draft({ approved: true, credits: { artist: ' ', photographer: '', frameDesigner: '' } }),
    );
    expect(r.canExportImages).toBe(false);
    expect(r.canExportBundle).toBe(false);
    expect(r.missing).toContain('the artist credit');
  });

  it('blocks all exports without a card name', () => {
    const r = exportReadiness(draft({ name: '', approved: true }));
    expect(r.canExportImages).toBe(false);
    expect(r.missing).toEqual(['a card name']);
  });
});

describe('resolveFontFamily', () => {
  const inter = getCardFont('inter');

  it('uses the next/font family from the CSS variable', () => {
    if (!inter) throw new Error('inter missing');
    expect(resolveFontFamily(inter, " '__Inter_abc', '__Inter_Fallback_abc' ")).toBe(
      "'__Inter_abc', '__Inter_Fallback_abc'",
    );
  });

  it('falls back to the plain family when the variable is empty', () => {
    if (!inter) throw new Error('inter missing');
    expect(resolveFontFamily(inter, '')).toBe('Inter, sans-serif');
  });
});
