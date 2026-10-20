import { type CardCredits, cardCreditsSchema } from './schema';

// Credits are mandatory and visible on every card (doc 2690, rule 3): artist,
// photographer and frame designer, with "Unknown" written out when not known.

export const UNKNOWN_CREDIT = 'Unknown';

export type CreditsResult = { ok: true; credits: CardCredits } | { ok: false; error: string };

/** Checks the credits and fills a blank photographer or designer with "Unknown". */
export function validateCredits(input: unknown): CreditsResult {
  const parsed = cardCreditsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'invalid credits' };
  }
  return {
    ok: true,
    credits: {
      artist: parsed.data.artist,
      photographer: parsed.data.photographer || UNKNOWN_CREDIT,
      frameDesigner: parsed.data.frameDesigner || UNKNOWN_CREDIT,
    },
  };
}

/** The credit text drawn on the card. Takes credits that passed validateCredits. */
export function creditLine(credits: CardCredits): string {
  return `Artist: ${credits.artist} | Photo: ${credits.photographer} | Frame: ${credits.frameDesigner}`;
}
