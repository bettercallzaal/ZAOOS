// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildCardMetadata } from '../metadata';
import { type CardDraft, createBlankDraft } from '../schema';

const madeAt = new Date('2026-10-20T12:00:00Z');

function draft(overrides: Partial<CardDraft> = {}): CardDraft {
  return {
    ...createBlankDraft(0),
    name: 'Test Artist',
    titleLine: 'ZAO-PALOOZA 2024',
    bio: 'Live at the ZAO.',
    credits: { artist: 'Test Artist', photographer: '', frameDesigner: 'The artist' },
    layers: [
      {
        id: 's',
        type: 'zao-stats',
        x: 0,
        y: 0,
        rotation: 0,
        visible: true,
        festival: 'ZAO-PALOOZA',
        year: 2024,
        genre: 'Hip hop',
        city: '',
        moment: '',
      },
    ],
    ...overrides,
  };
}

describe('buildCardMetadata', () => {
  it('writes EIP-721 fields and OpenSea attributes', () => {
    const result = buildCardMetadata(draft(), { imageUri: 'ipfs://cid/card.png', madeAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const m = result.metadata;
    expect(m.name).toBe('Test Artist');
    expect(m.description).toBe('ZAO-PALOOZA 2024\n\nLive at the ZAO.');
    expect(m.image).toBe('ipfs://cid/card.png');
    expect(m.background_color).toBe('0a1628');
    expect(m).not.toHaveProperty('external_url');
    expect(m.attributes).toEqual([
      { trait_type: 'Artist', value: 'Test Artist' },
      { trait_type: 'Edition', value: 'ZAO-PALOOZA' },
      { trait_type: 'Festival year', value: 2024, display_type: 'number' },
      { trait_type: 'Genre', value: 'Hip hop' },
      { trait_type: 'Photographer', value: 'Unknown' },
      { trait_type: 'Frame designer', value: 'The artist' },
      { trait_type: 'Card made', value: 1792497600, display_type: 'date' },
    ]);
  });

  it('keeps the year a number, so OpenSea does not read it as a string', () => {
    const result = buildCardMetadata(draft(), { imageUri: 'x', madeAt });
    const year =
      result.ok && result.metadata.attributes.find((a) => a.trait_type === 'Festival year');
    expect(year && typeof year.value).toBe('number');
  });

  it('includes external_url only when given', () => {
    const result = buildCardMetadata(draft(), {
      imageUri: 'x',
      externalUrl: 'https://zao.cards',
      madeAt,
    });
    expect(result.ok && result.metadata.external_url).toBe('https://zao.cards');
  });

  it('still names photographer and frame designer when there is no stat block', () => {
    const result = buildCardMetadata(draft({ layers: [] }), { imageUri: 'x', madeAt });
    expect(result.ok && result.metadata.attributes.map((a) => a.trait_type)).toEqual([
      'Artist',
      'Photographer',
      'Frame designer',
      'Card made',
    ]);
  });

  it.each([
    ['no card name', draft({ name: '  ' }), 'x', madeAt],
    [
      'no artist credit',
      draft({ credits: { artist: '', photographer: '', frameDesigner: '' } }),
      'x',
      madeAt,
    ],
    ['no image URI', draft(), ' ', madeAt],
    ['an invalid date', draft(), 'x', new Date('nope')],
  ])('refuses a card with %s', (_label, d, imageUri, date) => {
    expect(buildCardMetadata(d, { imageUri, madeAt: date }).ok).toBe(false);
  });
});
