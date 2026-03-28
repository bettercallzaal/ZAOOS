import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getChannelRankings } from '@/lib/openrank/client';

const DEFAULT_CHANNEL = 'thezao';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * GET /api/social/trending?channel=thezao&limit=20
 *
 * Returns top-ranked users in a Farcaster channel via OpenRank.
 * Defaults to 'thezao' channel.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const channel =
      request.nextUrl.searchParams.get('channel')?.trim() || DEFAULT_CHANNEL;

    // Validate channel: alphanumeric + hyphens only
    if (!/^[a-zA-Z0-9_-]+$/.test(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel name' },
        { status: 400 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const n = Number(limitParam);
      if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
        return NextResponse.json(
          { error: `limit must be an integer between 1 and ${MAX_LIMIT}` },
          { status: 400 }
        );
      }
      limit = n;
    }

    const rankings = await getChannelRankings(channel, limit);

    const response = NextResponse.json({ rankings, channel });
    // Cache for 1 hour
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=300'
    );
    return response;
  } catch (err) {
    console.error('Trending rankings error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch trending rankings' },
      { status: 500 }
    );
  }
}
