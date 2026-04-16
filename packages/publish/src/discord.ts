/**
 * Discord webhook publishing client.
 *
 * Uses the Discord Webhook API via native fetch — no SDK required.
 * Ported from the ZABALNewsletterBot multi-platform distribution patterns
 * (Discord group chat: casual, community tone, relaxed).
 *
 * Admin-only — the calling route must enforce access control.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONTENT_LENGTH = 2000;
const MAX_EMBED_DESCRIPTION_LENGTH = 4096;
const MAX_EMBEDS_PER_MESSAGE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: { text: string; icon_url?: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
}

export interface DiscordPublishInput {
  /** Message text content (max 2000 chars). */
  text: string;
  /** Rich embed objects for structured content. */
  embeds?: DiscordEmbed[];
  /** Override the default DISCORD_WEBHOOK_URL for this message. */
  webhookUrl?: string;
  /** Bot username override shown on the message. */
  username?: string;
  /** Bot avatar URL override. */
  avatarUrl?: string;
}

export interface DiscordPublishResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve webhook URL from input override or env var.
 * Returns null if neither is available.
 */
function getWebhookUrl(override?: string): string | null {
  return override || process.env.DISCORD_WEBHOOK_URL || null;
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
 * Enforce character limits on embed descriptions.
 */
function sanitizeEmbeds(embeds: DiscordEmbed[]): DiscordEmbed[] {
  return embeds.slice(0, MAX_EMBEDS_PER_MESSAGE).map((embed) => ({
    ...embed,
    description: embed.description
      ? truncate(embed.description, MAX_EMBED_DESCRIPTION_LENGTH)
      : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish a message to Discord via webhook.
 *
 * - Supports plain text (up to 2000 chars) and/or rich embeds.
 * - Uses `?wait=true` to get the created message ID back.
 * - Returns a consistent result object — never throws.
 */
export async function publishToDiscord(
  content: DiscordPublishInput,
): Promise<DiscordPublishResult> {
  const webhookUrl = getWebhookUrl(content.webhookUrl);
  if (!webhookUrl) {
    return {
      success: false,
      error: 'Discord not configured — missing DISCORD_WEBHOOK_URL',
    };
  }

  try {
    const text = truncate(content.text, MAX_CONTENT_LENGTH);
    const embeds = content.embeds ? sanitizeEmbeds(content.embeds) : undefined;

    const payload: Record<string, unknown> = {
      content: text,
    };

    if (embeds && embeds.length > 0) {
      payload.embeds = embeds;
    }

    if (content.username) {
      payload.username = content.username;
    }

    if (content.avatarUrl) {
      payload.avatar_url = content.avatarUrl;
    }

    // Append ?wait=true to get the message object back (includes ID)
    const url = webhookUrl.includes('?')
      ? `${webhookUrl}&wait=true`
      : `${webhookUrl}?wait=true`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Discord returns 204 No Content on success without ?wait,
    // and 200 with message body when ?wait=true
    if (!res.ok) {
      const errorBody = await res.text();
      // Parse Discord error if possible, but never expose the webhook URL
      let errorMessage = `Discord API error (${res.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.message) {
          errorMessage = `Discord API error: ${parsed.message}`;
        }
      } catch {
        // Use the generic status-based message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse the response to get message ID
    let messageId: string | undefined;
    try {
      const data = await res.json();
      messageId = data.id;
    } catch {
      // 204 or empty body — still a success, just no ID
    }

    return {
      success: true,
      messageId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Discord publish failed',
    };
  }
}

// ---------------------------------------------------------------------------
// Convenience: build a ZAO-branded embed
// ---------------------------------------------------------------------------

/** ZAO gold accent color as Discord integer (0xf5a623). */
const ZAO_GOLD = 0xf5a623;

/**
 * Build a ZAO-branded Discord embed from simple inputs.
 * Uses the project's gold accent color and standard footer.
 */
export function buildZaoEmbed(opts: {
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  footerText?: string;
}): DiscordEmbed {
  return {
    title: opts.title,
    description: truncate(opts.description, MAX_EMBED_DESCRIPTION_LENGTH),
    url: opts.url,
    color: ZAO_GOLD,
    image: opts.imageUrl ? { url: opts.imageUrl } : undefined,
    footer: { text: opts.footerText ?? 'Posted via ZAO OS' },
    timestamp: new Date().toISOString(),
  };
}
