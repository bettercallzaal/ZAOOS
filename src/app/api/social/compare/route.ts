import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

// Per-pair cache — 5 minute TTL
const compareCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const QuerySchema = z.object({
  targetFid: z.coerce.number().int().positive(),
});

/**
 * GET ?targetFid=123 — Compare your network with another user's
 * Returns shared followers, shared following, and top shared connections
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session || !session.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid targetFid', details: parsed.error.flatten() }, { status: 400 });
  }

  const { targetFid } = parsed.data;
  const myFid = session.fid;

  if (targetFid === myFid) {
    return NextResponse.json({ error: 'Cannot compare with yourself' }, { status: 400 });
  }

  // Check cache
  const cacheKey = `${myFid}:${targetFid}`;
  const cached = compareCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Fetch following lists for both users (paginate up to 400 each)
    const [myFollowing, theirFollowing] = await Promise.all([
      fetchAllFollowing(myFid, 400),
      fetchAllFollowing(targetFid, 400),
    ]);

    const myFollowingFids = new Set(myFollowing.map((u) => u.fid));
    const theirFollowingFids = new Set(theirFollowing.map((u) => u.fid));

    // Shared following (people you both follow)
    const sharedFollowingFids = [...myFollowingFids].filter((fid) => theirFollowingFids.has(fid));

    // Fetch followers for both (paginate up to 400 each)
    const [myFollowers, theirFollowers] = await Promise.all([
      fetchAllFollowers(myFid, 400),
      fetchAllFollowers(targetFid, 400),
    ]);

    const myFollowerFids = new Set(myFollowers.map((u) => u.fid));
    const theirFollowerFids = new Set(theirFollowers.map((u) => u.fid));

    // Shared followers (people who follow you both)
    const sharedFollowerFids = [...myFollowerFids].filter((fid) => theirFollowerFids.has(fid));

    // Get profile details for top shared connections (prefer shared following)
    const topSharedFids = sharedFollowingFids.slice(0, 10);
    let topShared: { fid: number; username: string; pfpUrl: string | null }[] = [];

    if (topSharedFids.length > 0) {
      const res = await fetch(
        `${NEYNAR_BASE}/user/bulk?fids=${topSharedFids.join(',')}`,
        { headers: { 'x-api-key': ENV.NEYNAR_API_KEY }, signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        topShared = (data.users || []).slice(0, 5).map((u: Record<string, unknown>) => ({
          fid: u.fid as number,
          username: u.username as string,
          pfpUrl: (u.pfp_url as string) || null,
        }));
      }
    }

    const responseData = {
      sharedFollowers: sharedFollowerFids.length,
      sharedFollowing: sharedFollowingFids.length,
      totalYours: myFollowerFids.size,
      totalTheirs: theirFollowerFids.size,
      totalYourFollowing: myFollowingFids.size,
      totalTheirFollowing: theirFollowingFids.size,
      topShared,
    };

    compareCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Evict old cache entries
    if (compareCache.size > 200) {
      const now = Date.now();
      for (const [key, val] of compareCache) {
        if (now - val.timestamp > CACHE_TTL) compareCache.delete(key);
      }
    }

    return NextResponse.json(responseData);
  } catch (err) {
    logger.error('Compare error:', err);
    return NextResponse.json({ error: 'Failed to compare networks' }, { status: 500 });
  }
}

/** Fetch following list with pagination up to maxCount */
async function fetchAllFollowing(fid: number, maxCount: number) {
  const users: { fid: number }[] = [];
  let cursor: string | undefined;
  const limit = 100;

  while (users.length < maxCount) {
    const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${NEYNAR_BASE}/following?${params}`, {
      headers: { 'x-api-key': ENV.NEYNAR_API_KEY },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) break;
    const data = await res.json();
    const batch = (data.users || []).map((u: Record<string, unknown>) => ({ fid: u.fid as number }));
    users.push(...batch);
    cursor = data.next?.cursor;
    if (!cursor || batch.length < limit) break;
  }

  return users;
}

/** Fetch followers list with pagination up to maxCount */
async function fetchAllFollowers(fid: number, maxCount: number) {
  const users: { fid: number }[] = [];
  let cursor: string | undefined;
  const limit = 100;

  while (users.length < maxCount) {
    const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${NEYNAR_BASE}/followers?${params}`, {
      headers: { 'x-api-key': ENV.NEYNAR_API_KEY },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) break;
    const data = await res.json();
    const batch = (data.users || []).map((r: Record<string, unknown>) => {
      const u = r.user || r;
      return { fid: (u as Record<string, unknown>).fid as number };
    });
    users.push(...batch);
    cursor = data.next?.cursor;
    if (!cursor || batch.length < limit) break;
  }

  return users;
}
