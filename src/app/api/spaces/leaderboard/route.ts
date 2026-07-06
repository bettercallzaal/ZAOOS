import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUsersByFids } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';
import { getLeaderboard } from '@/lib/spaces/sessionsDb';

interface NeynarUser {
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
}

const querySchema = z.object({
  period: z.enum(['week', 'month', 'all']).default('week'),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) : 20;
      return isNaN(n) ? 20 : Math.min(Math.max(n, 1), 100);
    }),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { period, limit } = parsed.data;
    const leaderboard = await getLeaderboard(period, limit);

    // Enrich FIDs with Farcaster profiles so the UI shows names + avatars, not
    // bare FIDs. Fault-tolerant: a Neynar failure falls back to FID-only rows.
    let enriched: Array<
      (typeof leaderboard)[number] & {
        username: string | null;
        displayName: string | null;
        pfpUrl: string | null;
      }
    > = leaderboard.map((e) => ({ ...e, username: null, displayName: null, pfpUrl: null }));
    try {
      const users: NeynarUser[] = await getUsersByFids(leaderboard.map((e) => e.fid));
      const byFid = new Map(users.map((u) => [u.fid, u]));
      enriched = leaderboard.map((e) => {
        const u = byFid.get(e.fid);
        return {
          ...e,
          username: u?.username ?? null,
          displayName: u?.display_name ?? null,
          pfpUrl: u?.pfp_url ?? null,
        };
      });
    } catch (err) {
      logger.error('[spaces/leaderboard] profile enrich failed', err);
    }

    const totalCommunityMinutes = leaderboard.reduce((sum, entry) => sum + entry.totalMinutes, 0);

    return NextResponse.json({
      leaderboard: enriched,
      period,
      totalCommunityMinutes,
    });
  } catch (error) {
    logger.error('[spaces/leaderboard] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
