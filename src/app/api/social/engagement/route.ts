import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import {
  getEngagementScores,
  getPersonalizedScores,
} from '@/lib/openrank/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/social/engagement?fids=123,456,789
 *
 * Returns global + personalized OpenRank engagement scores for the given FIDs.
 * Personalized scores are relative to the current authenticated user.
 * Response is cached for 1 hour via Cache-Control.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fidsParam = request.nextUrl.searchParams.get('fids');
    if (!fidsParam || fidsParam.trim() === '') {
      return NextResponse.json(
        { error: 'Missing required query parameter: fids' },
        { status: 400 }
      );
    }

    // Validate: every value must parse to a positive integer
    const parts = fidsParam.split(',').map((s) => s.trim());
    const fids: number[] = [];
    for (const part of parts) {
      const n = Number(part);
      if (!Number.isInteger(n) || n <= 0) {
        return NextResponse.json(
          { error: `Invalid FID: ${part}` },
          { status: 400 }
        );
      }
      fids.push(n);
    }

    if (fids.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 FIDs per request' },
        { status: 400 }
      );
    }

    // Fetch global and personalized scores in parallel
    const [globalScores, personalizedScores] = await Promise.allSettled([
      getEngagementScores(fids),
      getPersonalizedScores(session.fid, fids),
    ]);

    const globalMap =
      globalScores.status === 'fulfilled' ? globalScores.value : new Map();
    const personalizedMap =
      personalizedScores.status === 'fulfilled'
        ? personalizedScores.value
        : new Map();

    // Merge into a single object keyed by FID
    const scores: Record<string, { global: number; personalized: number }> = {};
    for (const fid of fids) {
      scores[String(fid)] = {
        global: globalMap.get(fid) ?? 0,
        personalized: personalizedMap.get(fid) ?? 0,
      };
    }

    const response = NextResponse.json({ scores });
    // Cache for 1 hour, allow stale for 5 min while revalidating
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=300'
    );
    return response;
  } catch (err) {
    logger.error('Engagement scores error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch engagement scores' },
      { status: 500 }
    );
  }
}
