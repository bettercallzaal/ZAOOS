import { NextResponse } from 'next/server';
import { fetchActivePolls, fetchRecentPolls } from '@/lib/snapshot/client';

/**
 * GET /api/snapshot/polls
 *
 * Returns active + recent Snapshot polls for the ZAO space.
 * No auth required — this is public Snapshot data.
 */
export async function GET() {
  try {
    const [active, recent] = await Promise.allSettled([
      fetchActivePolls(),
      fetchRecentPolls(),
    ]);

    return NextResponse.json({
      active: active.status === 'fulfilled' ? active.value : [],
      recent: recent.status === 'fulfilled' ? recent.value : [],
    });
  } catch (err) {
    console.error('[snapshot/polls] Error fetching polls:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Snapshot polls' },
      { status: 500 }
    );
  }
}
