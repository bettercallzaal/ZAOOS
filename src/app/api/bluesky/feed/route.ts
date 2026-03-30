import { NextRequest, NextResponse } from 'next/server';
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
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '30', 10),
      100,
    );

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
