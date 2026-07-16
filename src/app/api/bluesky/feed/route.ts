import { type NextRequest, NextResponse } from 'next/server';
import { getFeedSkeleton } from '@/lib/bluesky/feed';
import { logger } from '@/lib/logger';

/**
 * GET — Bluesky Feed Generator endpoint
 * Called by Bluesky's AppView to render the "ZAO Music" custom feed.
 * This is a PUBLIC endpoint — no auth required (Bluesky needs to call it).
 *
 * Query: ?cursor=<iso-date>&limit=30
 * Returns: { feed: [{ post: "at://..." }], cursor?: "iso-date" }
 */
export async function GET(req: NextRequest) {
  try {
    // External endpoint (Bluesky AppView). Validate defensively but do NOT 400 -
    // clamp/ignore bad input so the feed keeps rendering. Ignore an over-long cursor.
    const rawCursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const cursor = rawCursor && rawCursor.length <= 200 ? rawCursor : undefined;
    // Defensively clamp: a non-numeric/negative limit must fall back to the
    // default 30 (not pass NaN/0 downstream into the DB .limit()), and cap at 100.
    const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
    const limit = Math.min(Number.isNaN(rawLimit) || rawLimit < 1 ? 30 : rawLimit, 100);

    const result = await getFeedSkeleton(cursor, limit);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err) {
    logger.error('[bluesky/feed] Error:', err);
    return NextResponse.json({ feed: [] }, { status: 500 });
  }
}
