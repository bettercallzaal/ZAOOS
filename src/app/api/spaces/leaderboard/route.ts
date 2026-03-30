import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getLeaderboard } from '@/lib/spaces/sessionsDb';
import { logger } from '@/lib/logger';

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
        { status: 400 }
      );
    }

    const { period, limit } = parsed.data;
    const leaderboard = await getLeaderboard(period, limit);

    const totalCommunityMinutes = leaderboard.reduce(
      (sum, entry) => sum + entry.totalMinutes,
      0
    );

    return NextResponse.json({
      leaderboard,
      period,
      totalCommunityMinutes,
    });
  } catch (error) {
    logger.error('[spaces/leaderboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
