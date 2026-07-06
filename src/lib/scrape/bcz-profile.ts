/**
 * BetterCallZaal unified profile aggregator.
 *
 * Composes the three BCZ scrapers - site (bcz-site), X timeline (x-timeline),
 * and Farcaster history (bcz-history) - into one call. Uses Promise.allSettled
 * so a single failing source does NOT sink the others, and every failure is
 * recorded in `errors` rather than silently dropped.
 *
 * The three sub-scrapers are injectable so the composition (partial-failure
 * handling, error collection) can be unit tested without network.
 */

import { type BczHistory, scrapeFarcasterHistoryByUsername } from './bcz-history';
import { type BczSite, scrapeBczSite } from './bcz-site';
import { scrapeXUserTimeline, type XTimeline } from './x-timeline';

const DEFAULT_HANDLE = 'bettercallzaal';

export interface BczProfile {
  handle: string;
  site: BczSite | null;
  xTimeline: XTimeline | null;
  farcaster: BczHistory | null;
  /** Sources that failed, with the reason. Empty when all succeeded. */
  errors: Array<{ source: 'site' | 'x-timeline' | 'farcaster'; error: string }>;
}

export interface BczProfileOptions {
  handle?: string;
  /** Neynar API key - required for the Farcaster source; omit to skip it. */
  neynarApiKey?: string;
  maxFarcasterPages?: number;
  // Injectable sub-scrapers (tests pass fakes; default to the real ones).
  siteScraper?: () => Promise<BczSite>;
  timelineScraper?: (handle: string) => Promise<XTimeline>;
  farcasterScraper?: (handle: string, apiKey: string) => Promise<BczHistory>;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'unknown error';
}

/**
 * Scrape every BetterCallZaal surface in parallel. Never throws - a failed
 * source yields null plus an entry in `errors`. The Farcaster source is skipped
 * (null, no error) when no Neynar key is available.
 */
export async function scrapeBettercallzaalProfile(
  opts: BczProfileOptions = {},
): Promise<BczProfile> {
  const handle = (opts.handle ?? DEFAULT_HANDLE).trim().replace(/^@/, '');
  const site = opts.siteScraper ?? (() => scrapeBczSite());
  const timeline = opts.timelineScraper ?? ((h: string) => scrapeXUserTimeline(h));
  const farcaster =
    opts.farcasterScraper ??
    ((h: string, key: string) =>
      scrapeFarcasterHistoryByUsername(h, { apiKey: key, maxPages: opts.maxFarcasterPages }));

  const apiKey = opts.neynarApiKey;
  const errors: BczProfile['errors'] = [];

  const [siteRes, timelineRes, farcasterRes] = await Promise.allSettled([
    site(),
    timeline(handle),
    apiKey ? farcaster(handle, apiKey) : Promise.resolve(null),
  ]);

  let siteData: BczSite | null = null;
  if (siteRes.status === 'fulfilled') siteData = siteRes.value;
  else errors.push({ source: 'site', error: errMessage(siteRes.reason) });

  let timelineData: XTimeline | null = null;
  if (timelineRes.status === 'fulfilled') timelineData = timelineRes.value;
  else errors.push({ source: 'x-timeline', error: errMessage(timelineRes.reason) });

  let farcasterData: BczHistory | null = null;
  if (farcasterRes.status === 'fulfilled') farcasterData = farcasterRes.value;
  else errors.push({ source: 'farcaster', error: errMessage(farcasterRes.reason) });

  return { handle, site: siteData, xTimeline: timelineData, farcaster: farcasterData, errors };
}
