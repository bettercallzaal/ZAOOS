/**
 * Official @thezao casts to the /zao channel.
 *
 * Two functions, on purpose:
 *
 * - autoCastToZao: used by every EVENT-DRIVEN path (welcome, daily digest,
 *   Respect milestones, track of the day, playlists, go-live, Juke recaps,
 *   agent narration). Since Zaal's ruling (vault 2e556756, 20 Nov 2026) it
 *   does NOT post. It sends the text to Zaal as a ZOE Telegram draft and
 *   returns null, so no caller ever gets a cast hash from it again.
 *
 * - publishToZaoNow: the real post. Only for routes a human invokes on purpose
 *   (publish/compose, admin session or bearer, dryRun by default). Do not call
 *   it from an event, webhook or cron path.
 *
 * publishToZaoNow silently no-ops if ZAO_OFFICIAL_SIGNER_UUID or
 * ZAO_OFFICIAL_NEYNAR_API_KEY are not set.
 */

import { postCast } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';
import { checkAutoCastCap, recordOfficialCast } from './auto-cast-cap';
import { draftOfficialCast } from './official-draft';

const CHANNEL = 'zao';
const MAX_CAST_LENGTH = 320;

/**
 * Draft (not post) a /zao cast for Zaal's tap.
 *
 * @param text     The cast body that would have been posted
 * @param embedUrl Optional URL that would have been embedded
 * @returns        Always null: nothing is posted, so there is no cast hash
 */
export async function autoCastToZao(text: string, embedUrl?: string): Promise<string | null> {
  await draftOfficialCast({ text, embedUrl, target: 'Farcaster /zao as @thezao' });
  return null;
}

/**
 * Post a cast to the /zao channel from the @thezao official account, now.
 * Human-invoked routes only.
 *
 * @param text     Cast body (truncated to 320 chars if longer)
 * @param embedUrl Optional URL to embed (Farcaster will unfurl it)
 * @returns        Cast hash string on success, or null on failure / missing config
 */
export async function publishToZaoNow(text: string, embedUrl?: string): Promise<string | null> {
  const signerUuid = process.env.ZAO_OFFICIAL_SIGNER_UUID;
  const apiKey = process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;

  if (!signerUuid || !apiKey) {
    return null;
  }

  // Runaway guard, default OFF (see auto-cast-cap.ts). With the flag unset this
  // returns immediately and nothing changes.
  const cap = await checkAutoCastCap(CHANNEL);
  if (!cap.allowed) {
    return null;
  }

  try {
    // Truncate to Farcaster's character limit
    const safeText =
      text.length > MAX_CAST_LENGTH ? text.slice(0, MAX_CAST_LENGTH - 1) + '\u2026' : text;

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
      logger.info(`[auto-cast] Posted to /zao: ${safeText.slice(0, 60)}...`);
    }
    // With the cap on, count this post now instead of waiting for the webhook.
    if (cap.capped) {
      await recordOfficialCast(CHANNEL, { hash, text: safeText, embeds: result?.cast?.embeds });
    }
    return hash;
  } catch (err) {
    logger.error('[auto-cast] Failed to post to /zao:', err);
    return null;
  }
}
