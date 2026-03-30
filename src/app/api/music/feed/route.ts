import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import type { TrackType } from '@/types/music';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

const querySchema = z.object({
  channel: z.string().default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type FeedTrack = {
  castHash: string;
  authorFid: number;
  authorUsername: string;
  authorPfp: string;
  castText: string;
  musicUrl: string;
  platform: TrackType;
  timestamp: string;
};

type NeynarCast = {
  hash: string;
  author: { fid: number; username: string; pfp_url: string };
  text: string;
  timestamp: string;
  embeds?: Array<{ url?: string }>;
};

function neynarHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': ENV.NEYNAR_API_KEY,
  };
}

/** Extract the first music URL from a cast's embeds + text */
function extractMusicUrl(cast: NeynarCast): { url: string; platform: TrackType } | null {
  // Check embeds first (more reliable)
  if (cast.embeds) {
    for (const embed of cast.embeds) {
      if (embed.url) {
        const platform = isMusicUrl(embed.url);
        if (platform) return { url: embed.url, platform };
      }
    }
  }
  // Fallback: scan cast text for URLs
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = cast.text.match(urlRegex) || [];
  for (const url of urls) {
    const platform = isMusicUrl(url);
    if (platform) return { url, platform };
  }
  return null;
}

/** Search Neynar for casts containing music platform domains */
async function searchMusicCasts(
  limit: number,
  cursor?: string,
): Promise<{ casts: NeynarCast[]; nextCursor?: string }> {
  const domains = [
    'audius.co',
    'sound.xyz',
    'spotify.com/track',
    'soundcloud.com',
    'music.youtube.com',
    'bandcamp.com/track',
  ];

  // Neynar search: query multiple domains with OR-like behavior
  // Search for the most common music domain first, merge results
  const results = await Promise.allSettled(
    domains.slice(0, 3).map(async (domain) => {
      const params = new URLSearchParams({
        q: domain,
        limit: String(Math.ceil(limit / 2)),
      });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${NEYNAR_BASE}/cast/search?${params}`, {
        headers: neynarHeaders(),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { casts: [], next: undefined };
      const data = await res.json();
      return {
        casts: (data.result?.casts || []) as NeynarCast[],
        next: data.result?.next?.cursor as string | undefined,
      };
    }),
  );

  const allCasts: NeynarCast[] = [];
  let nextCursor: string | undefined;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      allCasts.push(...r.value.casts);
      if (r.value.next) nextCursor = r.value.next;
    }
  }

  // Deduplicate by hash
  const seen = new Set<string>();
  const unique = allCasts.filter((c) => {
    if (seen.has(c.hash)) return false;
    seen.add(c.hash);
    return true;
  });

  // Sort by timestamp descending
  unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { casts: unique.slice(0, limit), nextCursor };
}

/** Fetch channel feed and filter for music casts */
async function getChannelMusicCasts(
  channelId: string,
  limit: number,
  cursor?: string,
): Promise<{ casts: NeynarCast[]; nextCursor?: string }> {
  const params = new URLSearchParams({
    channel_ids: channelId,
    limit: String(Math.min(limit * 3, 100)), // Over-fetch to filter
    with_recasts: 'false',
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`${NEYNAR_BASE}/feed/channels?${params}`, {
    headers: neynarHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar feed error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const casts = (data.casts || []) as NeynarCast[];
  return {
    casts,
    nextCursor: data.next?.cursor as string | undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { channel, limit, cursor } = parsed.data;

  try {
    let casts: NeynarCast[];
    let nextCursor: string | undefined;

    if (channel === 'all') {
      const result = await searchMusicCasts(limit, cursor);
      casts = result.casts;
      nextCursor = result.nextCursor;
    } else {
      const result = await getChannelMusicCasts(channel, limit, cursor);
      casts = result.casts;
      nextCursor = result.nextCursor;
    }

    // Filter for casts with music URLs and transform
    const tracks: FeedTrack[] = [];
    for (const cast of casts) {
      const music = extractMusicUrl(cast);
      if (!music) continue;
      tracks.push({
        castHash: cast.hash,
        authorFid: cast.author.fid,
        authorUsername: cast.author.username,
        authorPfp: cast.author.pfp_url,
        castText: cast.text,
        musicUrl: music.url,
        platform: music.platform,
        timestamp: cast.timestamp,
      });
      if (tracks.length >= limit) break;
    }

    return NextResponse.json(
      { tracks, nextCursor: nextCursor || null },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      },
    );
  } catch (err) {
    logger.error('[music/feed] error:', err);
    return NextResponse.json({ error: 'Failed to fetch music feed' }, { status: 500 });
  }
}
