// The curated font list for the card builder. A font goes in only after its licence
// file has been read (doc 2690: google/fonts says "always read the license for every
// font"). Each entry records where and when that was checked.

export interface CardFont {
  id: string;
  family: string;
  licence: 'OFL-1.1';
  licenceSource: string;
  checked: string;
  /** The CSS variable next/font sets with the real (hashed) family name. */
  cssVariable: string;
}

export const CARD_FONTS: readonly CardFont[] = [
  {
    // Already loaded by the app through next/font (src/app/layout.tsx).
    id: 'inter',
    family: 'Inter',
    licence: 'OFL-1.1',
    licenceSource: 'https://github.com/rsms/inter/blob/master/LICENSE.txt',
    checked: '2026-10-20',
    cssVariable: '--font-inter',
  },
];

export const DEFAULT_FONT_ID = 'inter';

export function getCardFont(id: string): CardFont | undefined {
  return CARD_FONTS.find((f) => f.id === id);
}

/**
 * The family string canvas text must use. next/font renames families, so the
 * plain name would draw in a fallback font. Falls back to the plain name plus
 * sans-serif when the variable is not set.
 */
export function resolveFontFamily(font: CardFont, cssValue: string): string {
  const value = cssValue.trim();
  return value || `${font.family}, sans-serif`;
}
