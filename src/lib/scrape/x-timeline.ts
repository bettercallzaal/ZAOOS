/**
 * X (Twitter) user-timeline scraper - no login, no API key.
 *
 * The Twitter syndication "timeline-profile" embed returns a user's recent
 * tweets as a __NEXT_DATA__ JSON blob:
 *   https://syndication.twitter.com/srv/timeline-profile/screen-name/<handle>
 * -> props.pageProps.timeline.entries[].content.tweet
 *
 * This is the no-login maximum: the endpoint returns roughly the latest 100
 * tweets, NOT the full lifetime history (X gates older tweets behind login).
 * For per-tweet article bodies use x-fetch.ts; for full Farcaster history use
 * bcz-history.ts.
 */

import { z } from 'zod';

const TIMELINE_BASE = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/';

export interface XTimelineTweet {
  id: string;
  text: string;
  createdAt: string | null;
  likes: number;
  replies: number;
  retweets: number;
  quotes: number;
  lang: string | null;
  permalink: string | null;
}

export interface XTimeline {
  handle: string;
  total: number;
  tweets: XTimelineTweet[];
}

export class XTimelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XTimelineError';
  }
}

const RawTweetSchema = z
  .object({
    id_str: z.string(),
    full_text: z.string().optional(),
    text: z.string().optional(),
    created_at: z.string().optional(),
    favorite_count: z.number().optional(),
    reply_count: z.number().optional(),
    retweet_count: z.number().optional(),
    quote_count: z.number().optional(),
    lang: z.string().optional(),
    permalink: z.string().optional(),
  })
  .passthrough();

function normalize(raw: z.infer<typeof RawTweetSchema>): XTimelineTweet {
  return {
    id: raw.id_str,
    text: (raw.full_text ?? raw.text ?? '').trim(),
    createdAt: raw.created_at ?? null,
    likes: raw.favorite_count ?? 0,
    replies: raw.reply_count ?? 0,
    retweets: raw.retweet_count ?? 0,
    quotes: raw.quote_count ?? 0,
    lang: raw.lang ?? null,
    permalink: raw.permalink ?? null,
  };
}

/**
 * Parse the timeline-profile HTML into normalized tweets. Pure - reads the
 * __NEXT_DATA__ blob and walks props.pageProps.timeline.entries. Skips any entry
 * that fails validation. Returns [] when the blob is missing or malformed.
 */
export function parseXTimelineHtml(html: string): XTimelineTweet[] {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return [];
  }
  const entries = (data as { props?: { pageProps?: { timeline?: { entries?: unknown[] } } } })
    ?.props?.pageProps?.timeline?.entries;
  if (!Array.isArray(entries)) return [];

  const tweets: XTimelineTweet[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const tweet = (entry as { content?: { tweet?: unknown } })?.content?.tweet;
    const parsed = RawTweetSchema.safeParse(tweet);
    if (parsed.success && !seen.has(parsed.data.id_str)) {
      seen.add(parsed.data.id_str);
      tweets.push(normalize(parsed.data));
    }
  }
  return tweets;
}

/**
 * Scrape a user's recent X timeline (no login). Returns up to ~100 latest
 * tweets. Throws XTimelineError on an empty handle or an HTTP failure.
 */
export async function scrapeXUserTimeline(
  handle: string,
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<XTimeline> {
  const clean = handle.trim().replace(/^@/, '');
  if (!clean) throw new XTimelineError('empty handle');
  const fetchImpl = opts.fetchImpl ?? fetch;

  const res = await fetchImpl(`${TIMELINE_BASE}${encodeURIComponent(clean)}`, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; ZAO Scraper/1.0)',
    },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  });
  if (!res.ok) {
    throw new XTimelineError(`timeline for @${clean} returned HTTP ${res.status}`);
  }
  const html = await res.text();
  const tweets = parseXTimelineHtml(html);
  return { handle: clean, total: tweets.length, tweets };
}
