// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cardLayerSchema } from '@/lib/cards/schema';
import {
  checkImageFile,
  isAllowedImageDataUrl,
  MAX_IMAGE_BYTES,
  newImageLayer,
  newStatsLayer,
  newTextLayer,
} from '../layerFactory';

describe('checkImageFile', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp'])('accepts %s under the size cap', (type) => {
    expect(checkImageFile({ type, size: 1000 })).toEqual({ ok: true });
  });

  it.each(['image/svg+xml', 'image/gif', 'text/html', ''])('refuses %s', (type) => {
    expect(checkImageFile({ type, size: 1000 }).ok).toBe(false);
  });

  it('refuses a file over 2 MB', () => {
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }).ok).toBe(false);
  });
});

describe('isAllowedImageDataUrl', () => {
  it('accepts a PNG data URL and refuses an SVG one', () => {
    expect(isAllowedImageDataUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isAllowedImageDataUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
  });
});

describe('new layers', () => {
  it('scales a large image down to the art window, keeping its ratio, centred', () => {
    const layer = newImageLayer('data:image/png;base64,AAAA', 3000, 2000);
    expect(layer.width).toBe(630);
    expect(layer.height).toBe(420);
    expect(layer.x).toBe(60);
  });

  it('never scales a small image up', () => {
    const layer = newImageLayer('data:image/png;base64,AAAA', 200, 100);
    expect(layer.width).toBe(200);
    expect(layer.height).toBe(100);
  });

  it('makes layers that pass the draft schema, with unique ids', () => {
    const layers = [
      newImageLayer('data:image/png;base64,AAAA', 100, 100),
      newTextLayer('#ffffff'),
      newStatsLayer(),
    ];
    for (const layer of layers) expect(cardLayerSchema.safeParse(layer).success).toBe(true);
    expect(new Set(layers.map((l) => l.id)).size).toBe(3);
  });
});
