import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import {
  scrapeContent,
  scrapeWaveWarzBattles,
  scrapeBczFarcasterHistory,
  scrapeXUserTimeline,
  scrapeFarcasterHistoryByUsername,
} from '@/lib/scrape';
import { cacheScrape, type ScrapeCacheSource } from '@/lib/scrape/persist';
import { scrapeArtistStats } from '@/lib/wavewarz/scraper';

/**
 * GET /api/scrape - unified no-login scrape endpoint (session-gated).
 *
 * Exactly one target must be supplied:
 *   ?url=<x tweet/article url or id>      -> full tweet / X Article body (FxTwitter)
 *   ?xUser=<handle>                       -> recent X timeline (~100 tweets, no login)
 *   ?wavewarzArtist=<solana wallet>       -> artist battle stats
 *   ?wavewarzBattles=1[&maxPages=N]       -> battle history (paginated)
 *   ?farcasterFid=<fid>[&maxPages=N]      -> full Farcaster post history (Neynar)
 *   ?farcasterUser=<username>[&maxPages=N] -> resolve username, then full history
 *
 * No arbitrary-host fetching: the X path only ever calls api.fxtwitter.com /
 * syndication for a parsed tweet id, and the others hit fixed known hosts.
 */
const QuerySchema = z
  .object({
    url: z.string().min(1).optional(),
    xUser: z.string().min(1).max(64).optional(),
    wavewarzArtist: z.string().min(1).optional(),
    wavewarzBattles: z.string().optional(),
    farcasterFid: z.coerce.number().int().positive().optional(),
    farcasterUser: z.string().min(1).max(64).optional(),
    maxPages: z.coerce.number().int().positive().max(500).optional(),
    cache: z.string().optional(),
  })
  .refine(
    (q) =>
      Boolean(
        q.url ||
          q.xUser ||
          q.wavewarzArtist ||
          q.wavewarzBattles ||
          q.farcasterFid ||
          q.farcasterUser,
      ),
    {
      message:
        'one of url, xUser, wavewarzArtist, wavewarzBattles, farcasterFid, farcasterUser is required',
    },
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

    if (q.xUser) {
      const timeline = await scrapeXUserTimeline(q.xUser);
      const cached = await persist('x', `timeline:${timeline.handle}`, timeline);
      return NextResponse.json({ source: 'x-timeline', cached, ...timeline });
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

    if (q.farcasterUser) {
      const apiKey = process.env.NEYNAR_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
      }
      const history = await scrapeFarcasterHistoryByUsername(q.farcasterUser, {
        apiKey,
        maxPages: q.maxPages,
      });
      const cached = await persist('farcaster', String(history.fid), history);
      return NextResponse.json({ source: 'farcaster', cached, username: q.farcasterUser, ...history });
    }

    return NextResponse.json({ error: 'no target supplied' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[api/scrape] failed: ${message}`);
    return NextResponse.json({ error: 'scrape failed', message }, { status: 502 });
  }
}
