// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CARD_FONTS, DEFAULT_FONT_ID, getCardFont } from '../fonts';
import { COLOURWAYS, DEFAULT_COLOURWAY_ID, FRAMES, getColourway, getFrame } from '../frames';
import { createBlankDraft } from '../schema';

describe('frames and colourways', () => {
  it('the blank draft points at a frame and colourway that exist and match', () => {
    const draft = createBlankDraft(0);
    const colourway = getColourway(draft.colourwayId);
    expect(getFrame(draft.frameId)).toBeDefined();
    expect(draft.colourwayId).toBe(DEFAULT_COLOURWAY_ID);
    expect(colourway?.background).toBe(draft.background);
    expect(colourway?.border).toBe(draft.borderColor);
  });

  it('every colourway colour is #RRGGBB and ids are unique', () => {
    for (const c of COLOURWAYS) {
      for (const colour of [c.background, c.border, c.text])
        expect(colour).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    expect(new Set(COLOURWAYS.map((c) => c.id)).size).toBe(COLOURWAYS.length);
    expect(new Set(FRAMES.map((f) => f.id)).size).toBe(FRAMES.length);
  });

  it('returns undefined for an unknown id', () => {
    expect(getFrame('nope')).toBeUndefined();
    expect(getColourway('nope')).toBeUndefined();
  });
});

describe('fonts', () => {
  it('every font records its licence source and check date', () => {
    for (const f of CARD_FONTS) {
      expect(f.licenceSource).toMatch(/^https:\/\//);
      expect(f.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(getCardFont(DEFAULT_FONT_ID)?.family).toBe('Inter');
    expect(getCardFont('nope')).toBeUndefined();
  });
});
