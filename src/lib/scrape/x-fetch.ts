/**
 * X (Twitter) content fetcher - no login, no API key, no cookie.
 *
 * Tier 0: FxTwitter (api.fxtwitter.com) - returns plain tweets AND full X Article
 *         bodies (draft-js blocks). This is the only free source that returns the
 *         long-form article body. Verified live 2026-06-17 (research docs 822, 873).
 * Tier 1: Twitter syndication (cdn.syndication.twimg.com) - reliable for plain
 *         tweet text, but for X Articles returns only a ~200 char preview.
 *
 * This complements src/lib/jina/reader.ts: Jina returns the X page shell (no
 * article body); this module returns the structured tweet + full article body.
 *
 * Usage:
 *   const c = await fetchXContent('https://x.com/heynavtoor/status/2067194761446920264');
 *   if (c.isArticle) console.log(c.article?.title, c.article?.body);
 */

import { z } from 'zod';

const FXTWITTER_BASE = 'https://api.fxtwitter.com/status/';
const SYNDICATION_BASE = 'https://cdn.syndication.twimg.com/tweet-result';
const DEFAULT_TIMEOUT_MS = 12000;

/** Injectable fetch implementation (defaults to global fetch). Exists for testability. */
export type FetchImpl = typeof fetch;

export interface XFetchOptions {
  /** Override the fetch implementation (used in tests). */
  fetchImpl?: FetchImpl;
  /** Per-request timeout in milliseconds. Defaults to 12000. */
  timeoutMs?: number;
}

export interface XArticle {
  title: string;
  /** All non-empty text blocks joined with newlines. */
  body: string;
  /** Individual draft-js text blocks (empty array if only a preview was available). */
  blocks: string[];
  /** True when the full body could not be retrieved and only a preview is present. */
  partial: boolean;
}

export interface XContent {
  id: string;
  url: string;
  source: 'fxtwitter' | 'syndication';
  authorName: string;
  authorHandle: string;
  text: string;
  likes?: number;
  isArticle: boolean;
  article?: XArticle;
}

export class XFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XFetchError';
  }
}

/**
 * Extract the numeric tweet id from a tweet URL or a bare id.
 * Accepts x.com / twitter.com / mobile / fx / vx variants and `/status/<id>` paths.
 * Returns null when no plausible id is found.
 */
export function parseTweetId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Bare numeric id.
  if (/^\d{6,25}$/.test(trimmed)) return trimmed;

  // /status/<id> or /statuses/<id> in a URL.
  const statusMatch = trimmed.match(/status(?:es)?\/(\d{6,25})/);
  if (statusMatch) return statusMatch[1];

  return null;
}

// FxTwitter response shape (only the fields we read; passthrough keeps the rest).
const FxBlockSchema = z.object({ text: z.string().optional() }).passthrough();
const FxArticleSchema = z
  .object({
    title: z.string().optional(),
    preview_text: z.string().optional(),
    content: z.object({ blocks: z.array(FxBlockSchema).optional() }).partial().passthrough().optional(),
  })
  .passthrough();
const FxResponseSchema = z
  .object({
    code: z.number().optional(),
    tweet: z
      .object({
        id: z.string().optional(),
        text: z.string().optional(),
        likes: z.number().optional(),
        author: z
          .object({ name: z.string().optional(), screen_name: z.string().optional() })
          .passthrough()
          .optional(),
        article: FxArticleSchema.nullish(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// Twitter syndication response shape (subset).
const SyndicationSchema = z
  .object({
    text: z.string().optional(),
    favorite_count: z.number().optional(),
    user: z
      .object({ name: z.string().optional(), screen_name: z.string().optional() })
      .passthrough()
      .optional(),
    article: z
      .object({ title: z.string().optional(), preview_text: z.string().optional() })
      .passthrough()
      .nullish(),
  })
  .passthrough();

async function fetchJson(url: string, fetchImpl: FetchImpl, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ZAO Scraper/1.0)',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new XFetchError(`Request to ${new URL(url).host} returned ${res.status}`);
    }
    return (await res.json()) as unknown;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new XFetchError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildArticleFromFx(article: z.infer<typeof FxArticleSchema>): XArticle {
  const blocks = (article.content?.blocks ?? [])
    .map((b) => (b.text ?? '').trim())
    .filter((t) => t.length > 0);
  const hasBody = blocks.length > 0;
  return {
    title: (article.title ?? '').trim(),
    body: hasBody ? blocks.join('\n') : (article.preview_text ?? '').trim(),
    blocks,
    partial: !hasBody,
  };
}

async function tryFxTwitter(id: string, fetchImpl: FetchImpl, timeoutMs: number): Promise<XContent | null> {
  const raw = await fetchJson(`${FXTWITTER_BASE}${id}`, fetchImpl, timeoutMs);
  const parsed = FxResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.tweet) return null;
  const t = parsed.data.tweet;
  const article = t.article ? buildArticleFromFx(t.article) : undefined;
  return {
    id,
    url: `https://x.com/i/status/${id}`,
    source: 'fxtwitter',
    authorName: t.author?.name ?? '',
    authorHandle: t.author?.screen_name ?? '',
    text: t.text ?? '',
    likes: t.likes,
    isArticle: Boolean(article),
    article,
  };
}

async function trySyndication(id: string, fetchImpl: FetchImpl, timeoutMs: number): Promise<XContent | null> {
  const raw = await fetchJson(`${SYNDICATION_BASE}?id=${id}&token=4`, fetchImpl, timeoutMs);
  const parsed = SyndicationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;
  const article = d.article
    ? {
        title: (d.article.title ?? '').trim(),
        body: (d.article.preview_text ?? '').trim(),
        blocks: [],
        partial: true,
      }
    : undefined;
  return {
    id,
    url: `https://x.com/i/status/${id}`,
    source: 'syndication',
    authorName: d.user?.name ?? '',
    authorHandle: d.user?.screen_name ?? '',
    text: d.text ?? '',
    likes: d.favorite_count,
    isArticle: Boolean(article),
    article,
  };
}

/**
 * Fetch a tweet or X Article by URL or id. Tries FxTwitter first (full article
 * bodies), then falls back to the syndication endpoint (tweet text + article
 * preview only). Throws XFetchError when the id is invalid or every tier fails.
 */
export async function fetchXContent(input: string, opts: XFetchOptions = {}): Promise<XContent> {
  const id = parseTweetId(input);
  if (!id) {
    throw new XFetchError(`Could not parse a tweet id from "${input}"`);
  }
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let fxError: unknown;
  try {
    const fx = await tryFxTwitter(id, fetchImpl, timeoutMs);
    if (fx) return fx;
  } catch (error: unknown) {
    fxError = error;
  }

  try {
    const synd = await trySyndication(id, fetchImpl, timeoutMs);
    if (synd) return synd;
  } catch (error: unknown) {
    const fxMsg = fxError instanceof Error ? fxError.message : 'unknown';
    const sMsg = error instanceof Error ? error.message : 'unknown';
    throw new XFetchError(`All tiers failed for id ${id} (fxtwitter: ${fxMsg}; syndication: ${sMsg})`);
  }

  throw new XFetchError(`No content returned for id ${id} (tweet may be deleted or protected)`);
}
