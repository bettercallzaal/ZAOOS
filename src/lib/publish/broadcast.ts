/**
 * Broadcast helper — publish to Telegram + Discord in one call.
 *
 * This is the go-to convenience function for sending notifications
 * to external channels. Uses Promise.allSettled so one failure
 * never blocks the other, and only attempts each platform when
 * the required env var is set.
 */

import { buildZaoEmbed, publishToDiscord } from '@/lib/publish/discord';
import { escapeHtml, publishToTelegram } from '@/lib/publish/telegram';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BroadcastOptions {
  /** Message text (used for both Telegram and Discord). */
  text: string;
  /** Used for the Discord embed title. */
  title?: string;
  /** Used for Telegram photo and Discord embed image. */
  imageUrl?: string;
  /** Discord embed color hex string (default gold #f5a623). */
  color?: string;
  /** Farcaster cast hash — used to build a link to the cast. */
  castHash?: string;
  /** Direct URL to link to (overrides default ZAO OS link). */
  url?: string;
  /**
   * Which channels to attempt. Omitted (or an omitted key) means BOTH, which is
   * the historical behavior every existing caller relies on.
   *
   * This exists because "broadcast" is only the right default when the caller
   * genuinely wants every channel. /api/publish/compose lets an admin tick
   * Telegram and Discord independently, and calling this helper because EITHER
   * was ticked posted to BOTH — an irreversible send to a public channel nobody
   * selected, and one the response never mentioned.
   */
  channels?: { telegram?: boolean; discord?: boolean };
}

export interface BroadcastResult {
  telegram: { success: boolean; error?: string };
  discord: { success: boolean; error?: string };
}

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

/**
 * Publish a message to Telegram and Discord channels in parallel.
 *
 * - Only attempts a channel the caller selected (default: both).
 * - Only attempts Telegram if TELEGRAM_BOT_TOKEN is set.
 * - Only attempts Discord if DISCORD_WEBHOOK_URL is set.
 * - Never throws — returns results for both platforms.
 */
export async function broadcastToChannels(options: BroadcastOptions): Promise<BroadcastResult> {
  const wantsTelegram = options.channels?.telegram ?? true;
  const wantsDiscord = options.channels?.discord ?? true;
  const hasTelegram = wantsTelegram && !!process.env.TELEGRAM_BOT_TOKEN;
  const hasDiscord = wantsDiscord && !!process.env.DISCORD_WEBHOOK_URL;

  // Build links to append
  const farcasterLink = options.castHash
    ? `https://warpcast.com/~/conversations/${options.castHash}`
    : null;
  const pageUrl = options.url ?? 'https://zaoos.com';
  const linksSuffix = farcasterLink
    ? `\n\n🔗 View on Farcaster: ${farcasterLink}\n🌐 Join ZAO OS: ${pageUrl}`
    : `\n\n🌐 Join ZAO OS: ${pageUrl}`;
  const discordLinks = farcasterLink
    ? `\n\n[View on Farcaster](${farcasterLink}) · [Join ZAO OS](${pageUrl})`
    : `\n\n[Join ZAO OS](${pageUrl})`;

  // Telegram is sent with parse_mode HTML and every caller passes PLAIN text,
  // some of it user-supplied (a track title, an artist name). A raw `<` makes
  // the Bot API reject the whole message with 400 `can't parse entities`, so a
  // track called "Love <3" is announced nowhere at all. Only the caller's text
  // needs escaping — linksSuffix is ours and carries no markup.
  const telegramPromise = hasTelegram
    ? publishToTelegram({
        text: escapeHtml(options.text) + linksSuffix,
        imageUrl: options.imageUrl,
        parseMode: 'HTML',
        disablePreview: false,
      })
    : Promise.resolve({
        success: false,
        error: wantsTelegram ? 'Telegram not configured' : 'Telegram not selected',
      });

  const discordPromise = hasDiscord
    ? publishToDiscord({
        text: options.title ? '' : options.text,
        embeds: options.title
          ? [
              buildZaoEmbed({
                title: options.title,
                description: options.text + discordLinks,
                url: farcasterLink ?? pageUrl,
                imageUrl: options.imageUrl,
              }),
            ]
          : undefined,
      })
    : Promise.resolve({
        success: false,
        error: wantsDiscord ? 'Discord not configured' : 'Discord not selected',
      });

  const [telegramResult, discordResult] = await Promise.allSettled([
    telegramPromise,
    discordPromise,
  ]);

  return {
    telegram:
      telegramResult.status === 'fulfilled'
        ? { success: telegramResult.value.success, error: telegramResult.value.error }
        : { success: false, error: telegramResult.reason?.message ?? 'Telegram broadcast failed' },
    discord:
      discordResult.status === 'fulfilled'
        ? { success: discordResult.value.success, error: discordResult.value.error }
        : { success: false, error: discordResult.reason?.message ?? 'Discord broadcast failed' },
  };
}
