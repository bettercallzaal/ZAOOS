import { z } from 'zod';

// Card builder draft model (plan: docs/superpowers/plans/2026-10-20-zao-card-builder-v1.md,
// spec: research doc 2690). A draft read back from browser storage is untrusted, so every
// shape here is a Zod schema and the TypeScript types are inferred from it.

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a #RRGGBB colour');
const shortText = (max: number) => z.string().trim().max(max);

// Images stay in the browser (nothing is uploaded in v1), so a layer may only hold an
// inline data URL of an allowed type, never a remote URL the editor would fetch.
export const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;

const layerBase = {
  id: z.string().min(1).max(64),
  x: z.number().finite(),
  y: z.number().finite(),
  rotation: z.number().finite().min(-360).max(360),
  visible: z.boolean(),
};

export const imageLayerSchema = z.object({
  ...layerBase,
  type: z.literal('image'),
  src: z
    .string()
    .max(MAX_IMAGE_DATA_URL_LENGTH)
    .regex(IMAGE_DATA_URL, 'expected a PNG, JPEG or WebP data URL'),
  width: z.number().finite().positive().max(10_000),
  height: z.number().finite().positive().max(10_000),
});

export const textLayerSchema = z.object({
  ...layerBase,
  type: z.literal('text'),
  text: shortText(280),
  fontId: z.string().min(1).max(64),
  fontSize: z.number().finite().min(6).max(200),
  color: hexColor,
  align: z.enum(['left', 'center', 'right']),
  strokeColor: hexColor.optional(),
  strokeWidth: z.number().finite().min(0).max(20),
  shadow: z.boolean(),
});

export const zaoStatsLayerSchema = z.object({
  ...layerBase,
  type: z.literal('zao-stats'),
  festival: shortText(80),
  year: z.number().int().min(2000).max(2100).optional(),
  genre: shortText(80),
  city: shortText(80),
  moment: shortText(160),
});

export const cardLayerSchema = z.discriminatedUnion('type', [
  imageLayerSchema,
  textLayerSchema,
  zaoStatsLayerSchema,
]);

export const cardCreditsSchema = z.object({
  artist: shortText(80).min(1, 'the artist credit is required'),
  photographer: shortText(80),
  frameDesigner: shortText(80),
});

export const cardDraftSchema = z.object({
  version: z.literal(1),
  name: shortText(80),
  titleLine: shortText(80),
  bio: shortText(160),
  artistFid: z.number().int().positive().nullable(),
  frameId: z.string().min(1).max(64),
  colourwayId: z.string().min(1).max(64),
  background: hexColor,
  borderColor: hexColor,
  borderWidth: z.number().finite().min(0).max(60),
  cornerRadius: z.number().finite().min(0).max(120),
  // A label only. It never sets supply or price (doc 2690, rule 4).
  rarityLabel: shortText(40),
  credits: z.object({
    artist: shortText(80),
    photographer: shortText(80),
    frameDesigner: shortText(80),
  }),
  layers: z.array(cardLayerSchema).max(50),
  approved: z.boolean(),
  updatedAt: z.number().int().nonnegative(),
});

export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type ZaoStatsLayer = z.infer<typeof zaoStatsLayerSchema>;
export type CardLayer = z.infer<typeof cardLayerSchema>;
export type CardCredits = z.infer<typeof cardCreditsSchema>;
export type CardDraft = z.infer<typeof cardDraftSchema>;

/** A new blank card in the default ZAO navy and gold colourway. */
export function createBlankDraft(now: number = Date.now()): CardDraft {
  return {
    version: 1,
    name: '',
    titleLine: '',
    bio: '',
    artistFid: null,
    frameId: 'blank',
    colourwayId: 'zao-navy-gold',
    background: '#0a1628',
    borderColor: '#f5a623',
    borderWidth: 16,
    cornerRadius: 24,
    rarityLabel: '',
    credits: { artist: '', photographer: '', frameDesigner: '' },
    layers: [],
    approved: false,
    updatedAt: now,
  };
}
