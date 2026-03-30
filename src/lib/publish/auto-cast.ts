/**
 * Auto-cast helper — fire-and-forget Farcaster posts to /zao channel
 * via the @thezao official account.
 *
 * Silently no-ops if ZAO_OFFICIAL_SIGNER_UUID or ZAO_OFFICIAL_NEYNAR_API_KEY
 * are not set, so callers never need to guard against missing config.
 */

import { postCast } from '@/lib/farcaster/neynar';

const CHANNEL = 'zao';
const MAX_CAST_LENGTH = 320;

/**
 * Post a cast to the /zao channel from the @thezao official account.
 *
 * @param text     Cast body (truncated to 320 chars if longer)
 * @param embedUrl Optional URL to embed (Farcaster will unfurl it)
 * @returns        Cast hash string on success, or null on failure / missing config
 */
export async function autoCastToZao(
  text: string,
  embedUrl?: string,
): Promise<string | null> {
  const signerUuid = process.env.ZAO_OFFICIAL_SIGNER_UUID;
  const apiKey = process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;

  if (!signerUuid || !apiKey) {
    return null;
  }

  try {
    // Truncate to Farcaster's character limit
    const safeText =
      text.length > MAX_CAST_LENGTH
        ? text.slice(0, MAX_CAST_LENGTH - 1) + '\u2026'
        : text;

    const embedUrls = embedUrl ? [embedUrl] : undefined;

    const result = await postCast(
      signerUuid,
      safeText,
      CHANNEL,
      undefined,
      undefined,
      embedUrls,
      undefined,
      apiKey,
    );

    const hash = result?.cast?.hash ?? null;
    if (hash) {
      console.info(`[auto-cast] Posted to /zao: ${safeText.slice(0, 60)}...`);
    }
    return hash;
  } catch (err) {
    console.error('[auto-cast] Failed to post to /zao:', err);
    return null;
  }
}
