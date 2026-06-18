import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import {
  scrapeContent,
  scrapeWaveWarzBattles,
  scrapeBczFarcasterHistory,
} from '@/lib/scrape';
import { cacheScrape, type ScrapeCacheSource } from '@/lib/scrape/persist';
import { scrapeArtistStats } from '@/lib/wavewarz/scraper';

/**
 * GET /api/scrape - unified no-login scrape endpoint (session-gated).
 *
 * Exactly one target must be supplied:
 *   ?url=<x tweet/article url or id>      -> full tweet / X Article body (FxTwitter)
 *   ?wavewarzArtist=<solana wallet>       -> artist battle stats
 *   ?wavewarzBattles=1[&maxPages=N]       -> battle history (paginated)
 *   ?farcasterFid=<fid>[&maxPages=N]      -> full Farcaster post history (Neynar)
 *
 * No arbitrary-host fetching: the X path only ever calls api.fxtwitter.com /
 * syndication for a parsed tweet id, and the others hit fixed known hosts.
 */
const QuerySchema = z
  .object({
    url: z.string().min(1).optional(),
    wavewarzArtist: z.string().min(1).optional(),
    wavewarzBattles: z.string().optional(),
    farcasterFid: z.coerce.number().int().positive().optional(),
    maxPages: z.coerce.number().int().positive().max(500).optional(),
    cache: z.string().optional(),
  })
  .refine(
    (q) => Boolean(q.url || q.wavewarzArtist || q.wavewarzBattles || q.farcasterFid),
    { message: 'one of url, wavewarzArtist, wavewarzBattles, farcasterFid is required' },
  );

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  const q = parsed.data;
  const wantCache = Boolean(q.cache);

  // Best-effort persistence (only when ?cache=1 and the scrape_cache table
  // exists). Never fails the request; returns whether the write succeeded.
  const persist = async (source: ScrapeCacheSource, key: string, data: unknown): Promise<boolean> => {
    if (!wantCache) return false;
    const r = await cacheScrape(source, key, data);
    return r.ok;
  };

  try {
    if (q.url) {
      const result = await scrapeContent(q.url);
      if (result.source !== 'x') {
        return NextResponse.json({ error: result.reason }, { status: 422 });
      }
      const cached = await persist('x', result.data.id, result.data);
      return NextResponse.json({ source: 'x', cached, data: result.data });
    }

    if (q.wavewarzArtist) {
      const stats = await scrapeArtistStats(q.wavewarzArtist);
      if (!stats) {
        return NextResponse.json({ error: 'artist stats unavailable' }, { status: 404 });
      }
      const cached = await persist('wavewarz-artist', q.wavewarzArtist, stats);
      return NextResponse.json({ source: 'wavewarz-artist', cached, data: stats });
    }

    if (q.wavewarzBattles) {
      const result = await scrapeWaveWarzBattles({ maxPages: q.maxPages });
      const cached = await persist('wavewarz-battles', 'all', result);
      return NextResponse.json({ source: 'wavewarz-battles', cached, ...result });
    }

    if (q.farcasterFid) {
      const apiKey = process.env.NEYNAR_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
      }
      const history = await scrapeBczFarcasterHistory(q.farcasterFid, {
        apiKey,
        maxPages: q.maxPages,
      });
      const cached = await persist('farcaster', String(q.farcasterFid), history);
      return NextResponse.json({ source: 'farcaster', cached, ...history });
    }

    return NextResponse.json({ error: 'no target supplied' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[api/scrape] failed: ${message}`);
    return NextResponse.json({ error: 'scrape failed', message }, { status: 502 });
  }
}
