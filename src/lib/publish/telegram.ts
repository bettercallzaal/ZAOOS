/**
 * Telegram channel/group publishing client.
 *
 * Uses the Telegram Bot API via native fetch — no SDK required.
 * Ported from the ZABALNewsletterBot multi-platform distribution patterns
 * (Telegram group chat: friendly, direct, crew-style notes).
 *
 * Admin-only — the calling route must enforce access control.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_MESSAGE_LENGTH = 4096;
const MAX_CAPTION_LENGTH = 1024;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TelegramPublishInput {
  /** Message text. Supports Telegram MarkdownV2 formatting. */
  text: string;
  /** Optional image URL — switches from sendMessage to sendPhoto. */
  imageUrl?: string;
  /** Override the default TELEGRAM_CHAT_ID for this message. */
  chatId?: string;
  /** Parse mode: 'MarkdownV2' (default) or 'HTML'. */
  parseMode?: 'MarkdownV2' | 'HTML';
  /** Disable link previews in the message. */
  disablePreview?: boolean;
}

export interface TelegramPublishResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve bot token and chat ID from env vars.
 * Returns null if either is missing.
 */
function getConfig(chatIdOverride?: string): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = chatIdOverride || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return null;
  return { token, chatId };
}

/**
 * Truncate text to a maximum length, breaking at the last space
 * so words are never split mid-way.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
}

/**
 * Escape special characters for Telegram MarkdownV2 parse mode.
 * See: https://core.telegram.org/bots/api#markdownv2-style
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish a message to a Telegram chat/channel via the Bot API.
 *
 * - Text-only messages use `sendMessage` (up to 4096 chars).
 * - When `imageUrl` is provided, uses `sendPhoto` with the text as caption
 *   (up to 1024 chars for captions).
 * - Returns a consistent result object — never throws.
 */
export async function publishToTelegram(
  content: TelegramPublishInput,
): Promise<TelegramPublishResult> {
  const config = getConfig(content.chatId);
  if (!config) {
    return {
      success: false,
      error: 'Telegram not configured — missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
    };
  }

  const { token, chatId } = config;
  const parseMode = content.parseMode ?? 'MarkdownV2';

  try {
    // Decide endpoint: sendPhoto if image provided, otherwise sendMessage
    if (content.imageUrl) {
      return await sendPhoto(token, chatId, content, parseMode);
    }
    return await sendMessage(token, chatId, content, parseMode);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Telegram publish failed',
    };
  }
}

// ---------------------------------------------------------------------------
// Internal API calls
// ---------------------------------------------------------------------------

async function sendMessage(
  token: string,
  chatId: string,
  content: TelegramPublishInput,
  parseMode: string,
): Promise<TelegramPublishResult> {
  const text = truncate(content.text, MAX_MESSAGE_LENGTH);

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: content.disablePreview ?? false,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    return {
      success: false,
      error: `Telegram API error: ${data.description ?? res.statusText}`,
    };
  }

  return {
    success: true,
    messageId: data.result?.message_id,
  };
}

async function sendPhoto(
  token: string,
  chatId: string,
  content: TelegramPublishInput,
  parseMode: string,
): Promise<TelegramPublishResult> {
  // Captions are limited to 1024 chars
  const caption = truncate(content.text, MAX_CAPTION_LENGTH);

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: content.imageUrl,
      caption,
      parse_mode: parseMode,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    return {
      success: false,
      error: `Telegram API error: ${data.description ?? res.statusText}`,
    };
  }

  return {
    success: true,
    messageId: data.result?.message_id,
  };
}
