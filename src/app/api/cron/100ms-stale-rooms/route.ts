import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sweepStale100msRooms } from '@/lib/social/sweep100msRooms';

/**
 * GET /api/cron/100ms-stale-rooms
 *
 * Manual / on-demand trigger for the 100ms ghost-room sweep. The sweep also runs
 * daily from /api/cron/juke-stale-rooms (the shared "stale rooms" cron) — this
 * route is NOT scheduled in vercel.json because the project's cron budget is
 * full and a 5th cron fails the deploy. Kept so the sweep can be invoked
 * directly (with the cron secret) for testing or a manual cleanup.
 *
 * Auth: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sweepStale100msRooms();
    return NextResponse.json({ ok: true, ...result, ended_ids: result.endedIds });
  } catch (err) {
    logger.error('[cron/100ms-stale-rooms] sweep failed', err);
    return NextResponse.json({ ok: false, error: 'Sweep failed' }, { status: 500 });
  }
}
