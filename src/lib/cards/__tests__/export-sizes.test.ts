// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cardPlacement, EXPORT_SIZES, fitAndPad } from '../export-sizes';

describe('EXPORT_SIZES', () => {
  it('uses the 2.5:3.5 card, 3:2 share and 4:5 NFT ratios', () => {
    expect(EXPORT_SIZES.card.width / EXPORT_SIZES.card.height).toBeCloseTo(2.5 / 3.5);
    expect(EXPORT_SIZES.share.width / EXPORT_SIZES.share.height).toBeCloseTo(3 / 2);
    expect(EXPORT_SIZES.nft.width / EXPORT_SIZES.nft.height).toBeCloseTo(4 / 5);
  });

  it('keeps the NFT image inside EIP-721 suggested widths (320 to 1080)', () => {
    expect(EXPORT_SIZES.nft.width).toBeGreaterThanOrEqual(320);
    expect(EXPORT_SIZES.nft.width).toBeLessThanOrEqual(1080);
  });
});

describe('fitAndPad', () => {
  it('pads the card onto the 4:5 NFT canvas without cropping', () => {
    expect(cardPlacement('nft')).toEqual({ x: 58, y: 0, width: 964, height: 1350 });
  });

  it('pads the card onto the 3:2 share canvas', () => {
    expect(cardPlacement('share')).toEqual({ x: 315, y: 0, width: 571, height: 800 });
  });

  it('places the card at full size on its own canvas', () => {
    expect(cardPlacement('card')).toEqual({ x: 0, y: 0, width: 750, height: 1050 });
  });

  it('pads top and bottom when the inner box is wider', () => {
    expect(fitAndPad({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({
      x: 0,
      y: 25,
      width: 100,
      height: 50,
    });
  });

  it('throws on a zero or negative size', () => {
    expect(() => fitAndPad({ width: 0, height: 10 }, { width: 10, height: 10 })).toThrow();
    expect(() => fitAndPad({ width: 10, height: 10 }, { width: 10, height: -1 })).toThrow();
  });
});
