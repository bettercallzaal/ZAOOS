import { validateCredits } from './credits';
import type { CardDraft, ZaoStatsLayer } from './schema';

// Token metadata for an approved card, so a card is ready to mint without re-entering
// anything. Fields: EIP-721 metadata schema (name, description, image) plus OpenSea's
// attributes, external_url and background_color (six hex characters, no leading #).
// The builder only writes this file. Minting is the ZAO wallet's, outside the builder.

export interface CardAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'date';
}

export interface CardMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  background_color: string;
  attributes: CardAttribute[];
}

export interface MetadataOptions {
  /** Where the NFT image will live. Storage is still Zaal's call (board card 10524). */
  imageUri: string;
  externalUrl?: string;
  madeAt: Date;
}

export type MetadataResult = { ok: true; metadata: CardMetadata } | { ok: false; error: string };

export function buildCardMetadata(draft: CardDraft, options: MetadataOptions): MetadataResult {
  if (!draft.name.trim()) return { ok: false, error: 'the card needs a name' };
  if (!options.imageUri.trim()) return { ok: false, error: 'imageUri is required' };
  if (Number.isNaN(options.madeAt.getTime()))
    return { ok: false, error: 'madeAt is not a valid date' };
  const credits = validateCredits(draft.credits);
  if (!credits.ok) return { ok: false, error: credits.error };

  const stats = draft.layers.find((l): l is ZaoStatsLayer => l.type === 'zao-stats');
  const attributes: CardAttribute[] = [{ trait_type: 'Artist', value: credits.credits.artist }];
  if (stats?.festival) attributes.push({ trait_type: 'Edition', value: stats.festival });
  if (stats?.year !== undefined) {
    attributes.push({ trait_type: 'Festival year', value: stats.year, display_type: 'number' });
  }
  if (stats?.genre) attributes.push({ trait_type: 'Genre', value: stats.genre });
  if (stats?.city) attributes.push({ trait_type: 'City', value: stats.city });
  attributes.push(
    { trait_type: 'Photographer', value: credits.credits.photographer },
    { trait_type: 'Frame designer', value: credits.credits.frameDesigner },
    {
      trait_type: 'Card made',
      value: Math.floor(options.madeAt.getTime() / 1000),
      display_type: 'date',
    },
  );

  const description = [draft.titleLine, draft.bio].filter((s) => s.trim()).join('\n\n');
  return {
    ok: true,
    metadata: {
      name: draft.name.trim(),
      description,
      image: options.imageUri,
      ...(options.externalUrl ? { external_url: options.externalUrl } : {}),
      background_color: draft.background.slice(1).toLowerCase(),
      attributes,
    },
  };
}
