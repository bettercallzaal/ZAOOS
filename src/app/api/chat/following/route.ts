import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { neynarCastToCast } from '@/lib/farcaster/cast-mapper';
import { followingFeedEnabled } from '@/lib/farcaster/following-feed-flag';
import { getFollowingFeed } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

/**
 * GET /api/chat/following - the signed-in member's Farcaster home feed:
 * casts from the accounts they follow, with their own mutes and blocks applied.
 * 404 while the flag is off (see following-feed-flag.ts).
 */

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  cursor: z
    .string()
    .max(512)
    .regex(/^[A-Za-z0-9_\-=+/.]+$/)
    .optional(),
});

const feedResponseSchema = z
  .object({
    casts: z.array(z.record(z.string(), z.unknown())),
    next: z.object({ cursor: z.string().nullable().optional() }).nullable().optional(),
  })
  .passthrough();

export async function GET(req: NextRequest) {
  if (!followingFeedEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.fid) {
    // Wallet-only sessions have no Farcaster account, so there is no follow graph.
    return NextResponse.json(
      { error: 'Sign in with Farcaster to see your following feed' },
      { status: 400 },
    );
  }

  const parsed = querySchema.safeParse({
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const raw: unknown = await getFollowingFeed(session.fid, parsed.data.cursor, parsed.data.limit);
    const feed = feedResponseSchema.safeParse(raw);
    if (!feed.success) {
      logger.error('[following] unexpected Neynar response shape');
      return NextResponse.json({ error: 'Failed to load following feed' }, { status: 502 });
    }
    return NextResponse.json({
      casts: feed.data.casts.map(neynarCastToCast),
      nextCursor: feed.data.next?.cursor ?? null,
    });
  } catch (error: unknown) {
    logger.error('[following] error:', error);
    return NextResponse.json({ error: 'Failed to load following feed' }, { status: 502 });
  }
}
