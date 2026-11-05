import type Konva from 'konva';
import { EXPORT_SIZES, type ExportKind, fitAndPad } from '@/lib/cards/export-sizes';

// Browser-side export for the card builder. The stage draws the card in card pixels
// (750x1050) scaled to the screen; exports re-render it at full size, then pad it onto
// the 3:2 share or 4:5 NFT canvas. Nothing leaves the browser.

/**
 * Waits until each family can draw. Canvas text does not wait for web fonts, so an
 * export taken before the font loads silently uses a fallback face.
 */
export async function ensureFontsLoaded(families: string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.allSettled(
    families.flatMap((family) => [
      document.fonts.load(`400 32px ${family}`),
      document.fonts.load(`700 32px ${family}`),
    ]),
  );
  await document.fonts.ready;
}

/** The card at full export size, from a stage drawn at any display scale. */
export function renderCardCanvas(stage: Konva.Stage): HTMLCanvasElement {
  const pixelRatio = EXPORT_SIZES.card.width / stage.width();
  // Selection handles are editor chrome, never part of the card.
  const transformers = stage.find('Transformer').filter((node) => node.visible());
  for (const node of transformers) node.hide();
  try {
    return stage.toCanvas({ pixelRatio });
  } finally {
    for (const node of transformers) node.show();
  }
}

/** A PNG data URL for one export kind. `padColor` fills the space around the card. */
export function renderExport(stage: Konva.Stage, kind: ExportKind, padColor: string): string {
  const card = renderCardCanvas(stage);
  if (kind === 'card') return card.toDataURL('image/png');

  const outer = EXPORT_SIZES[kind];
  const canvas = document.createElement('canvas');
  canvas.width = outer.width;
  canvas.height = outer.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.fillStyle = padColor;
  ctx.fillRect(0, 0, outer.width, outer.height);
  const rect = fitAndPad(EXPORT_SIZES.card, outer);
  ctx.drawImage(card, rect.x, rect.y, rect.width, rect.height);
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function downloadJson(value: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  // Revoking in the same tick can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
