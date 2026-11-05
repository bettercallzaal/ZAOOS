import { validateCredits } from './credits';
import type { CardDraft } from './schema';

// What still stands between a draft and the export bundle. The builder refuses to
// export without the credit line (doc 2690, rule 3) and locks the bundle until the
// artist approves their own card (rule 2).

export interface ExportReadiness {
  /** Card, share and NFT images can be downloaded. */
  canExportImages: boolean;
  /** The approved bundle (images plus metadata JSON) can be downloaded. */
  canExportBundle: boolean;
  missing: string[];
}

export function exportReadiness(draft: CardDraft): ExportReadiness {
  const missing: string[] = [];
  if (!draft.name.trim()) missing.push('a card name');
  const credits = validateCredits(draft.credits);
  if (!credits.ok) missing.push('the artist credit');
  const canExportImages = missing.length === 0;
  if (!draft.approved) missing.push('your approval of the card and its credits');
  return { canExportImages, canExportBundle: canExportImages && draft.approved, missing };
}
