/**
 * ZAO scrape module - a single entry point for the no-login scrapers.
 *
 * Re-exports the per-source scrapers and provides a small dispatcher so callers
 * (ZOE, agents, API routes) can hand in any supported URL/id and get typed,
 * validated content back without knowing which scraper to call.
 *
 * Supported sources:
 *  - X / Twitter tweets and Articles  -> FxTwitter (full article bodies, no login)
 *  - WaveWarZ artist pages            -> flight-tree stats parser
 *  - WaveWarZ /battles history        -> paginated battle records
 *  - Farcaster post history (by fid)  -> Neynar cursor paginator
 */

export * from './x-fetch';
export * from './bcz-history';
export * from './wavewarz';
export * from './wavewarz-battles';

import { fetchXContent, parseTweetId, type XContent, type XFetchOptions } from './x-fetch';

export type ScrapeSource = 'x' | 'wavewarz-artist' | 'wavewarz-battles' | 'unknown';

/** Classify an input URL or id into a known scrape source. Pure. */
export function detectScrapeSource(input: string): ScrapeSource {
  if (!input || typeof input !== 'string') return 'unknown';
  const s = input.trim();

  // Bare tweet id or an x.com/twitter status url.
  if (parseTweetId(s)) return 'x';

  let host = '';
  let path = '';
  try {
    const u = new URL(s);
    host = u.hostname.toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    return 'unknown';
  }

  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  if (host.includes('wavewarz')) {
    if (path.startsWith('/battles')) return 'wavewarz-battles';
    if (path.startsWith('/artist/')) return 'wavewarz-artist';
  }
  return 'unknown';
}

export type ScrapeResult =
  | { source: 'x'; data: XContent }
  | { source: 'unsupported'; reason: string };

/**
 * Universal single-URL scrape. Currently resolves X tweets/Articles (the only
 * source that maps cleanly to a single fetch). WaveWarZ and Farcaster need their
 * dedicated paginating functions, exported above; this dispatcher points callers
 * at them rather than guessing a wallet or fid from a URL.
 */
export async function scrapeContent(input: string, opts: XFetchOptions = {}): Promise<ScrapeResult> {
  const source = detectScrapeSource(input);
  if (source === 'x') {
    return { source: 'x', data: await fetchXContent(input, opts) };
  }
  if (source === 'wavewarz-artist') {
    return { source: 'unsupported', reason: 'use scrapeArtistStats(wallet) for WaveWarZ artist pages' };
  }
  if (source === 'wavewarz-battles') {
    return { source: 'unsupported', reason: 'use scrapeWaveWarzBattles() for WaveWarZ battle history' };
  }
  return { source: 'unsupported', reason: `no scraper for input: ${input.slice(0, 80)}` };
}
