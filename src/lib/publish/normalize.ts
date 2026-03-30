/**
 * Content normalization for cross-platform publishing.
 * Transforms Farcaster cast content into platform-specific formats.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedContent {
  text: string;
  images: string[];
  embeds: string[];
  attribution: string;
  castHash: string;
  castUrl: string;
}

export interface NormalizeInput {
  text: string;
  castHash: string;
  embedUrls?: string[];
  imageUrls?: string[];
  channel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function castUrl(hash: string): string {
  return `https://warpcast.com/~/conversations/${hash}`;
}

/**
 * Truncate text to `maxLen`, breaking at the last space before the limit
 * so words are never split mid-way.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
}

// ---------------------------------------------------------------------------
// Platform normalizers
// ---------------------------------------------------------------------------

/**
 * Lens — full text, no character limit.
 * Appends "Posted via ZAO OS" attribution footer.
 */
export function normalizeForLens(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'Posted via ZAO OS';
  const text = `${input.text}\n\n${attribution}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * Bluesky — 300-char limit.
 * Reserves room for "via ZAO OS" attribution when needed.
 */
export function normalizeForBluesky(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'via ZAO OS';
  const footer = `\n\n${attribution}`;

  // 300 total, minus footer length
  const maxTextLen = 300 - footer.length;
  const truncatedText = truncate(input.text, maxTextLen);
  const text = `${truncatedText}${footer}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * X/Twitter — 280-char limit.
 * Reserves 23 chars for a t.co-wrapped cast URL + 1 space separator.
 */
export function normalizeForX(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const TCO_LENGTH = 23;
  // Space before URL
  const maxTextLen = 280 - TCO_LENGTH - 1;
  const truncatedText = truncate(input.text, maxTextLen);
  const text = `${truncatedText} ${url}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution: url,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * Telegram — 4096-char limit.
 * Appends "via ZAO OS" attribution. Keeps plain text (MarkdownV2 escaping
 * is handled by the publish module).
 */
export function normalizeForTelegram(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'via ZAO OS';
  const footer = `\n\n${attribution}\n${url}`;

  const maxTextLen = 4096 - footer.length;
  const truncatedText = truncate(input.text, maxTextLen);
  const text = `${truncatedText}${footer}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * Discord — 2000-char text limit for webhook messages.
 * Keeps text concise; images/embeds are handled separately via rich embeds.
 */
export function normalizeForDiscord(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'Posted via ZAO OS';
  const footer = `\n\n${attribution}`;

  // Reserve room for footer within the 2000 char limit
  const maxTextLen = 2000 - footer.length;
  const truncatedText = truncate(input.text, maxTextLen);
  const text = `${truncatedText}${footer}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * Threads — 500-char limit, conversational tone.
 * No hashtags. Appends "via ZAO OS" attribution with cast link.
 */
export function normalizeForThreads(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'via ZAO OS';
  const footer = `\n\n${attribution}\n${url}`;

  const maxTextLen = 500 - footer.length;
  // Strip hashtags for conversational tone
  const cleaned = input.text.replace(/#\w+/g, '').replace(/\s{2,}/g, ' ').trim();
  const truncatedText = truncate(cleaned, maxTextLen);
  const text = `${truncatedText}${footer}`;

  return {
    text,
    images: input.imageUrls ?? [],
    embeds: input.embedUrls ?? [],
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}

/**
 * Hive — full markdown, no character limit.
 * Converts images to markdown `![]()` syntax, embeds to `[]()` links,
 * and appends a footer with the original cast link.
 */
export function normalizeForHive(input: NormalizeInput): NormalizedContent {
  const url = castUrl(input.castHash);
  const attribution = 'Originally posted on Farcaster via ZAO OS';

  const parts: string[] = [input.text];

  // Convert images to markdown
  const images = input.imageUrls ?? [];
  if (images.length > 0) {
    parts.push(''); // blank line
    for (const img of images) {
      parts.push(`![](${img})`);
    }
  }

  // Convert embeds to markdown links
  const embeds = input.embedUrls ?? [];
  if (embeds.length > 0) {
    parts.push(''); // blank line
    for (const embed of embeds) {
      parts.push(`[${embed}](${embed})`);
    }
  }

  // Footer
  parts.push('');
  parts.push('---');
  parts.push(`*${attribution}*`);
  parts.push(`[View original cast](${url})`);

  const text = parts.join('\n');

  return {
    text,
    images,
    embeds,
    attribution,
    castHash: input.castHash,
    castUrl: url,
  };
}
