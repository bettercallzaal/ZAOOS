// Export sizes for the card builder (doc 2690, section 8).
// - card: 2.5:3.5, the printed trading card ratio.
// - share: 3:2, which Farcaster embeds require.
// - nft: 4:5 at 1080 wide, inside EIP-721's suggested 320-1080 px and 1.91:1 to 4:5 range.
// A card is narrower than 3:2 and 4:5, so it is scaled to fit and padded, never cropped.

export type ExportKind = 'card' | 'share' | 'nft';

export interface Size {
  width: number;
  height: number;
}

export interface PlacedRect extends Size {
  x: number;
  y: number;
}

export const EXPORT_SIZES: Readonly<Record<ExportKind, Size>> = {
  card: { width: 750, height: 1050 },
  share: { width: 1200, height: 800 },
  nft: { width: 1080, height: 1350 },
};

/** Where `inner` lands when scaled to fit inside `outer` and centred. */
export function fitAndPad(inner: Size, outer: Size): PlacedRect {
  if (inner.width <= 0 || inner.height <= 0 || outer.width <= 0 || outer.height <= 0) {
    throw new Error('fitAndPad: sizes must be positive');
  }
  const scale = Math.min(outer.width / inner.width, outer.height / inner.height);
  const width = Math.round(inner.width * scale);
  const height = Math.round(inner.height * scale);
  return {
    x: Math.round((outer.width - width) / 2),
    y: Math.round((outer.height - height) / 2),
    width,
    height,
  };
}

/** The card's placement on an export canvas of the given kind. */
export function cardPlacement(kind: ExportKind): PlacedRect {
  return fitAndPad(EXPORT_SIZES.card, EXPORT_SIZES[kind]);
}
