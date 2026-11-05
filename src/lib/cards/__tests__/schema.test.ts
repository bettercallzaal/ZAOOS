// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cardDraftSchema, cardLayerSchema, createBlankDraft } from '../schema';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('createBlankDraft', () => {
  it('passes its own schema with the ZAO navy and gold defaults', () => {
    const draft = createBlankDraft(1000);
    expect(cardDraftSchema.safeParse(draft).success).toBe(true);
    expect(draft.background).toBe('#0a1628');
    expect(draft.borderColor).toBe('#f5a623');
    expect(draft.approved).toBe(false);
    expect(draft.updatedAt).toBe(1000);
  });
});

describe('cardLayerSchema', () => {
  const base = { id: 'a', x: 0, y: 0, rotation: 0, visible: true };

  it('accepts an inline PNG, JPEG or WebP image', () => {
    for (const type of ['png', 'jpeg', 'webp']) {
      const src = `data:image/${type};base64,AAAA`;
      expect(
        cardLayerSchema.safeParse({ ...base, type: 'image', src, width: 10, height: 10 }).success,
      ).toBe(true);
    }
  });

  it.each([
    ['a remote URL', 'https://example.com/a.png'],
    ['an SVG data URL', 'data:image/svg+xml;base64,AAAA'],
    ['a javascript URL', 'javascript:alert(1)'],
  ])('rejects %s as an image source', (_label, src) => {
    expect(
      cardLayerSchema.safeParse({ ...base, type: 'image', src, width: 10, height: 10 }).success,
    ).toBe(false);
  });

  it('rejects an unknown layer type', () => {
    expect(cardLayerSchema.safeParse({ ...base, type: 'ai-art' }).success).toBe(false);
  });

  it('rejects a text colour that is not #RRGGBB', () => {
    const text = {
      ...base,
      type: 'text',
      text: 'hi',
      fontId: 'inter',
      fontSize: 24,
      color: 'red',
      align: 'left',
      strokeWidth: 0,
      shadow: false,
    };
    expect(cardLayerSchema.safeParse(text).success).toBe(false);
    expect(cardLayerSchema.safeParse({ ...text, color: '#ffffff' }).success).toBe(true);
  });

  it('accepts a ZAO stat block and rejects an out-of-range year', () => {
    const stats = {
      ...base,
      type: 'zao-stats',
      festival: 'ZAO-PALOOZA',
      year: 2024,
      genre: '',
      city: '',
      moment: '',
    };
    expect(cardLayerSchema.safeParse(stats).success).toBe(true);
    expect(cardLayerSchema.safeParse({ ...stats, year: 1999 }).success).toBe(false);
  });

  it('keeps a valid image layer inside a draft', () => {
    const draft = {
      ...createBlankDraft(0),
      layers: [{ ...base, type: 'image', src: PNG, width: 5, height: 5 }],
    };
    expect(cardDraftSchema.safeParse(draft).success).toBe(true);
  });
});
