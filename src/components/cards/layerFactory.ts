import { EXPORT_SIZES } from '@/lib/cards/export-sizes';
import { DEFAULT_FONT_ID } from '@/lib/cards/fonts';
import {
  IMAGE_DATA_URL,
  type ImageLayer,
  MAX_IMAGE_DATA_URL_LENGTH,
  type TextLayer,
  type ZaoStatsLayer,
} from '@/lib/cards/schema';

// New layers for the editor, placed inside the card in card pixels.

const CARD = EXPORT_SIZES.card;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
// localStorage holds about 5 MB per site, and base64 adds a third, so one image stays small.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newTextLayer(color: string): TextLayer {
  return {
    id: newId('text'),
    type: 'text',
    x: 60,
    y: 420,
    rotation: 0,
    visible: true,
    text: 'Your text',
    fontId: DEFAULT_FONT_ID,
    fontSize: 40,
    color,
    align: 'left',
    strokeWidth: 0,
    shadow: false,
  };
}

export function newStatsLayer(): ZaoStatsLayer {
  return {
    id: newId('stats'),
    type: 'zao-stats',
    x: 60,
    y: CARD.height - 420,
    rotation: 0,
    visible: true,
    festival: '',
    genre: '',
    city: '',
    moment: '',
  };
}

/** An image layer sized to fit the card's art window, keeping its aspect ratio. */
export function newImageLayer(
  src: string,
  naturalWidth: number,
  naturalHeight: number,
): ImageLayer {
  const maxWidth = CARD.width - 120;
  const maxHeight = 640;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  const width = Math.max(10, Math.round(naturalWidth * scale));
  const height = Math.max(10, Math.round(naturalHeight * scale));
  return {
    id: newId('image'),
    type: 'image',
    x: Math.round((CARD.width - width) / 2),
    y: 170,
    rotation: 0,
    visible: true,
    src,
    width,
    height,
  };
}

export type ImageFileCheck = { ok: true } | { ok: false; error: string };

export function checkImageFile(file: { type: string; size: number }): ImageFileCheck {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'Use a PNG, JPG or WebP image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Images must be 2 MB or smaller.' };
  return { ok: true };
}

export function isAllowedImageDataUrl(dataUrl: string): boolean {
  return dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH && IMAGE_DATA_URL.test(dataUrl);
}
