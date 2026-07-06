/**
 * BetterCallZaal Farcaster post-history scraper.
 *
 * Neynar's `/feed/user/casts` (and the repo's getUserCasts) returns at most one
 * page. To get the FULL post history you must follow the `next.cursor` until it
 * is empty. This module provides a pure, testable cursor paginator plus a thin
 * Neynar adapter, with Zod-validated, normalized output.
 *
 * The core `paginateCasts` takes an injectable page fetcher so it can be unit
 * tested without network or an API key.
 *
 * Usage:
 *   const history = await scrapeBczFarcasterHistory(fid, { apiKey });
 *   console.log(history.total, history.casts[0].text);
 */

import { z } from 'zod';
import { isRetryableHttpError, withRetry } from './retry';

/** A single Farcaster cast in a Neynar feed page (subset we read). */
const RawCastSchema = z
  .object({
    hash: z.string(),
    text: z.string().optional(),
    timestamp: z.string().optional(),
    reactions: z
      .object({ likes_count: z.number().optional(), recasts_count: z.number().optional() })
      .partial()
      .passthrough()
      .optional(),
    replies: z.object({ count: z.number().optional() }).partial().passthrough().optional(),
  })
  .passthrough();

export interface NormalizedCast {
  hash: string;
  text: string;
  timestamp: string | null;
  likes: number;
  recasts: number;
  replies: number;
}

export interface CastPage {
  casts: unknown[];
  nextCursor: string | null;
}

export interface BczHistory {
  fid: number;
  total: number;
  casts: NormalizedCast[];
  /** True when pagination stopped at maxPages rather than exhausting history. */
  truncated: boolean;
}

export class BczScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BczScrapeError';
  }
}

/** A function that fetches one page of casts given a cursor (null for the first page). */
export type FetchCastPage = (cursor: string | null) => Promise<CastPage>;

function normalizeCast(raw: unknown): NormalizedCast | null {
  const parsed = RawCastSchema.safeParse(raw);
  if (!parsed.success) return null;
  const c = parsed.data;
  return {
    hash: c.hash,
    text: (c.text ?? '').trim(),
    timestamp: c.timestamp ?? null,
    likes: c.reactions?.likes_count ?? 0,
    recasts: c.reactions?.recasts_count ?? 0,
    replies: c.replies?.count ?? 0,
  };
}

/**
 * Follow cursors through every page, deduping by hash, until the cursor is empty
 * or maxPages is reached. Pure - the page fetcher is injected.
 */
export async function paginateCasts(
  fetchPage: FetchCastPage,
  opts: { maxPages?: number } = {},
): Promise<{ casts: NormalizedCast[]; truncated: boolean }> {
  const maxPages = opts.maxPages ?? 50;
  const seen = new Set<string>();
  const casts: NormalizedCast[] = [];
  let cursor: string | null = null;
  let page = 0;

  while (page < maxPages) {
    const result: CastPage = await fetchPage(cursor);
    for (const raw of result.casts) {
      const n = normalizeCast(raw);
      if (n && !seen.has(n.hash)) {
        seen.add(n.hash);
        casts.push(n);
      }
    }
    page += 1;
    if (!result.nextCursor) {
      return { casts, truncated: false };
    }
    cursor = result.nextCursor;
  }
  // Hit the page cap with a cursor still pending.
  return { casts, truncated: true };
}

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

/**
 * Resolve a Farcaster username (e.g. "bettercallzaal") to its fid via Neynar.
 * Returns null when the username does not exist. Throws BczScrapeError on a
 * transport/HTTP failure (after retry) so the caller can distinguish "no such
 * user" from "lookup failed".
 */
export async function resolveFarcasterFid(
  username: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  const handle = username.trim().replace(/^@/, '');
  if (!handle) return null;
  return withRetry(
    async () => {
      const res = await fetchImpl(
        `${NEYNAR_BASE}/user/by_username?username=${encodeURIComponent(handle)}`,
        {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new BczScrapeError(`Neynar username lookup error ${res.status} for ${handle}`);
      }
      const data = (await res.json()) as { user?: { fid?: number } };
      return typeof data.user?.fid === 'number' ? data.user.fid : null;
    },
    { shouldRetry: isRetryableHttpError },
  );
}

/** Build a Neynar-backed page fetcher for a fid. Injectable fetch for tests. */
export function neynarCastPageFetcher(
  fid: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): FetchCastPage {
  return (cursor: string | null): Promise<CastPage> =>
    withRetry(
      async () => {
        const params = new URLSearchParams({ fid: String(fid), limit: '100' });
        if (cursor) params.set('cursor', cursor);
        const res = await fetchImpl(`${NEYNAR_BASE}/feed/user/casts?${params}`, {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          throw new BczScrapeError(`Neynar casts error ${res.status} for fid ${fid}`);
        }
        const data = (await res.json()) as { casts?: unknown[]; next?: { cursor?: string | null } };
        return { casts: data.casts ?? [], nextCursor: data.next?.cursor ?? null };
      },
      { shouldRetry: isRetryableHttpError },
    );
}

/**
 * Scrape the full Farcaster post history for a fid (BetterCallZaal by default
 * resolves elsewhere). Pass a custom `fetchPage` in tests; otherwise provide an
 * `apiKey` to use Neynar.
 */
export async function scrapeBczFarcasterHistory(
  fid: number,
  opts: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    fetchPage?: FetchCastPage;
    maxPages?: number;
  } = {},
): Promise<BczHistory> {
  if (!Number.isInteger(fid) || fid <= 0) {
    throw new BczScrapeError(`Invalid fid: ${fid}`);
  }
  const fetchPage =
    opts.fetchPage ??
    (opts.apiKey ? neynarCastPageFetcher(fid, opts.apiKey, opts.fetchImpl) : null);
  if (!fetchPage) {
    throw new BczScrapeError(
      'scrapeBczFarcasterHistory requires either opts.fetchPage or opts.apiKey',
    );
  }
  const { casts, truncated } = await paginateCasts(fetchPage, { maxPages: opts.maxPages });
  return { fid, total: casts.length, casts, truncated };
}

/**
 * Resolve a Farcaster username to a fid and scrape its full post history in one
 * call (e.g. scrapeFarcasterHistoryByUsername('bettercallzaal', { apiKey })).
 * Throws BczScrapeError when the username cannot be resolved.
 */
export async function scrapeFarcasterHistoryByUsername(
  username: string,
  opts: { apiKey: string; fetchImpl?: typeof fetch; maxPages?: number },
): Promise<BczHistory> {
  const fid = await resolveFarcasterFid(username, opts.apiKey, opts.fetchImpl);
  if (fid === null) {
    throw new BczScrapeError(`Could not resolve Farcaster username: ${username}`);
  }
  return scrapeBczFarcasterHistory(fid, {
    apiKey: opts.apiKey,
    fetchImpl: opts.fetchImpl,
    maxPages: opts.maxPages,
  });
}
