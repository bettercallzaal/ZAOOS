// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { creditLine, UNKNOWN_CREDIT, validateCredits } from '../credits';

describe('validateCredits', () => {
  it('fills a blank photographer and frame designer with Unknown', () => {
    const result = validateCredits({
      artist: 'Test Artist',
      photographer: '',
      frameDesigner: '  ',
    });
    expect(result).toEqual({
      ok: true,
      credits: {
        artist: 'Test Artist',
        photographer: UNKNOWN_CREDIT,
        frameDesigner: UNKNOWN_CREDIT,
      },
    });
  });

  it('keeps named credits as given, trimmed', () => {
    const result = validateCredits({ artist: ' A ', photographer: 'B', frameDesigner: 'C' });
    expect(result.ok && result.credits).toEqual({
      artist: 'A',
      photographer: 'B',
      frameDesigner: 'C',
    });
  });

  it.each([
    ['a blank artist', { artist: '  ', photographer: '', frameDesigner: '' }],
    ['a missing artist', { photographer: '', frameDesigner: '' }],
    ['not an object', 'Test Artist'],
    ['null', null],
  ])('refuses %s', (_label, input) => {
    expect(validateCredits(input).ok).toBe(false);
  });
});

describe('creditLine', () => {
  it('names all three credits', () => {
    expect(creditLine({ artist: 'A', photographer: UNKNOWN_CREDIT, frameDesigner: 'C' })).toBe(
      'Artist: A | Photo: Unknown | Frame: C',
    );
  });
});
