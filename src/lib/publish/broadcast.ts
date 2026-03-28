/**
 * Broadcast helper — publish to Telegram + Discord in one call.
 *
 * This is the go-to convenience function for sending notifications
 * to external channels. Uses Promise.allSettled so one failure
 * never blocks the other, and only attempts each platform when
 * the required env var is set.
 */

import { publishToTelegram } from '@/lib/publish/telegram';
import { publishToDiscord, buildZaoEmbed } from '@/lib/publish/discord';

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
 * - Only attempts Telegram if TELEGRAM_BOT_TOKEN is set.
 * - Only attempts Discord if DISCORD_WEBHOOK_URL is set.
 * - Never throws — returns results for both platforms.
 */
export async function broadcastToChannels(
  options: BroadcastOptions,
): Promise<BroadcastResult> {
  const hasTelegram = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasDiscord = !!process.env.DISCORD_WEBHOOK_URL;

  const telegramPromise = hasTelegram
    ? publishToTelegram({
        text: options.text,
        imageUrl: options.imageUrl,
        parseMode: 'HTML',
        disablePreview: false,
      })
    : Promise.resolve({ success: false, error: 'Telegram not configured' });

  const discordPromise = hasDiscord
    ? publishToDiscord({
        text: options.text,
        embeds: options.title
          ? [
              buildZaoEmbed({
                title: options.title,
                description: options.text,
                imageUrl: options.imageUrl,
              }),
            ]
          : undefined,
      })
    : Promise.resolve({ success: false, error: 'Discord not configured' });

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
