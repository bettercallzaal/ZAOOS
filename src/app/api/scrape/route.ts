import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import {
  scrapeContent,
  scrapeWaveWarzBattles,
  scrapeBczFarcasterHistory,
} from '@/lib/scrape';
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

  try {
    if (q.url) {
      const result = await scrapeContent(q.url);
      if (result.source !== 'x') {
        return NextResponse.json({ error: result.reason }, { status: 422 });
      }
      return NextResponse.json({ source: 'x', data: result.data });
    }

    if (q.wavewarzArtist) {
      const stats = await scrapeArtistStats(q.wavewarzArtist);
      if (!stats) {
        return NextResponse.json({ error: 'artist stats unavailable' }, { status: 404 });
      }
      return NextResponse.json({ source: 'wavewarz-artist', data: stats });
    }

    if (q.wavewarzBattles) {
      const result = await scrapeWaveWarzBattles({ maxPages: q.maxPages });
      return NextResponse.json({ source: 'wavewarz-battles', ...result });
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
      return NextResponse.json({ source: 'farcaster', ...history });
    }

    return NextResponse.json({ error: 'no target supplied' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[api/scrape] failed: ${message}`);
    return NextResponse.json({ error: 'scrape failed', message }, { status: 502 });
  }
}
