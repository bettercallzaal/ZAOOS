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

/** Options for {@link jukeEmbedUrl}. */
export interface JukeEmbedOptions {
  /**
   * When `true`, append `?audio=off` so the embed renders a passive,
   * second-screen view: same metadata + participants but no audio connection.
   * Use this when the listener is already in the Juke iOS app on their phone
   * and the laptop should not double-broadcast (Juke PR 2026-05-23, item #6).
   */
  audioOff?: boolean;
  /**
   * Partner-SSO JWT minted via /api/juke/partner-token (Juke 2026-05-23
   * Partner SSO Bridge). When present, the iframe adopts the session
   * client-side, strips ?token= from the URL via history.replaceState, and
   * renders as already-authenticated — no SIWF QR for the visitor. Token is
   * single-use-per-mount + short-TTL (5min default); refetch on every embed.
   */
  partnerToken?: string;
}

/**
 * Build the Juke embed URL for a space.
 *
 * @throws if `spaceId` is not a valid Juke space id — callers must validate
 *         with {@link isValidJukeSpaceId} (and 404) before reaching here.
 */
export function jukeEmbedUrl(spaceId: string, options: JukeEmbedOptions = {}): string {
  if (!isValidJukeSpaceId(spaceId)) {
    throw new Error('Invalid Juke space id');
  }
  const base = `${JUKE_EMBED_ORIGIN}/embed/${encodeURIComponent(spaceId)}`;
  const params = new URLSearchParams();
  if (options.audioOff) params.set('audio', 'off');
  if (options.partnerToken) params.set('token', options.partnerToken);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Canonical Juke space page URL for a given id (the share/permalink URL). */
export function jukeSpaceUrl(spaceId: string): string {
  if (!isValidJukeSpaceId(spaceId)) throw new Error('Invalid Juke space id');
  return `${JUKE_EMBED_ORIGIN}/space/${encodeURIComponent(spaceId)}`;
}

/**
 * Juke's per-space OG image. Returned by the Juke landing app and safe to use
 * as `og:image` / `twitter:image` for our `/live/{id}` route - Juke renders a
 * branded card for the space (PR 2026-05-23, item #10).
 */
export function jukeSpaceOgImageUrl(spaceId: string): string {
  if (!isValidJukeSpaceId(spaceId)) throw new Error('Invalid Juke space id');
  return `${JUKE_EMBED_ORIGIN}/space/${encodeURIComponent(spaceId)}/opengraph-image`;
}

/**
 * Native-app deeplink for "Open in Juke" CTAs on desktop and Farcaster
 * miniapps. Apple universal-link form so it resolves on both web and iOS.
 */
export function jukeAppDeeplinkUrl(spaceId: string): string {
  if (!isValidJukeSpaceId(spaceId)) throw new Error('Invalid Juke space id');
  return `${JUKE_EMBED_ORIGIN}/space/${encodeURIComponent(spaceId)}?open=app`;
}

/**
 * Extract a Juke space id from free-form user input — either a raw id or a
 * juke.audio link in any shape (`/embed/{id}`, `/space/{id}`, `/{id}`, ...).
 * The last path segment is taken as the id. Returns `null` when the input is
 * not a Juke link or does not end in a valid id, so callers can show an
 * inline error rather than routing to a dead space.
 */
export function parseJukeSpaceId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare id pasted directly.
  if (isValidJukeSpaceId(trimmed)) return trimmed;

  // Otherwise treat it as a URL; tolerate a missing protocol.
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.hostname !== 'juke.audio' && url.hostname !== 'www.juke.audio') {
    return null;
  }

  const lastSegment = url.pathname.split('/').filter(Boolean).at(-1);
  return lastSegment && isValidJukeSpaceId(lastSegment) ? lastSegment : null;
}
