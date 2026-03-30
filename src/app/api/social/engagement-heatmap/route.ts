import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const headers = () => ({ 'Content-Type': 'application/json', 'x-api-key': ENV.NEYNAR_API_KEY });

// In-memory cache — 1 hour TTL, keyed by FID
const cache = new Map<number, { data: number[][]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fid = session.fid;
    const cached = cache.get(fid);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ heatmap: cached.data });
    }

    // Fetch up to 50 followers
    const fRes = await fetch(`${NEYNAR_BASE}/followers?fid=${fid}&limit=50`, {
      headers: headers(), signal: AbortSignal.timeout(10000),
    });
    if (!fRes.ok) throw new Error(`Followers fetch failed: ${fRes.status}`);
    const fData = await fRes.json();
    const followerFids: number[] = (fData.users || []).map((u: { user: { fid: number } }) => u.user?.fid).filter(Boolean).slice(0, 50);

    // Fetch recent casts for each follower (batched, max 25 casts each)
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const batches = [];
    for (let i = 0; i < followerFids.length; i += 5) {
      batches.push(followerFids.slice(i, i + 5));
    }

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(async (followerFid) => {
          const res = await fetch(
            `${NEYNAR_BASE}/feed?feed_type=filter&filter_type=fids&fids=${followerFid}&limit=25`,
            { headers: headers(), signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return [];
          const data = await res.json();
          return (data.casts || []).map((c: { timestamp: string }) => c.timestamp);
        })
      );
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        for (const ts of r.value) {
          const d = new Date(ts);
          const day = (d.getUTCDay() + 6) % 7; // Mon=0, Sun=6
          heatmap[day][d.getUTCHours()]++;
        }
      }
    }

    cache.set(fid, { data: heatmap, ts: Date.now() });
    return NextResponse.json({ heatmap });
  } catch (err) {
    logger.error('Engagement heatmap error:', err);
    return NextResponse.json({ error: 'Failed to generate heatmap' }, { status: 500 });
  }
}
