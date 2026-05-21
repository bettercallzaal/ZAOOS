/**
 * Juke — Farcaster-native live audio (juke.audio, built by nickysap).
 *
 * Path A of the Juke integration: the hosted iframe embed. No API keys, no
 * server calls — `/embed/{spaceId}` renders Juke's full UI (anonymous listen,
 * SIWF participation, hand-raise, mic). See research doc 695.
 *
 * `frame-src` and the `microphone` Permissions-Policy in `src/middleware.ts`
 * must list `https://juke.audio` for the iframe to render and for speakers to
 * publish audio.
 */

/** Canonical Juke origin. The embed and all Juke surfaces live here. */
export const JUKE_EMBED_ORIGIN = 'https://juke.audio';

/**
 * A Juke space id arrives as an untrusted URL path segment and is then
 * interpolated into the embed `src`. Restrict it to URL-safe tokens so a
 * crafted segment cannot smuggle a query string, a second path, or a
 * different origin into the iframe. Length is bounded to reject absurd input.
 */
const SPACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** True when `value` is a structurally valid Juke space id. */
export function isValidJukeSpaceId(value: unknown): value is string {
  return typeof value === 'string' && SPACE_ID_PATTERN.test(value);
}

/**
 * Build the Juke embed URL for a space.
 *
 * @throws if `spaceId` is not a valid Juke space id — callers must validate
 *         with {@link isValidJukeSpaceId} (and 404) before reaching here.
 */
export function jukeEmbedUrl(spaceId: string): string {
  if (!isValidJukeSpaceId(spaceId)) {
    throw new Error('Invalid Juke space id');
  }
  return `${JUKE_EMBED_ORIGIN}/embed/${encodeURIComponent(spaceId)}`;
}
