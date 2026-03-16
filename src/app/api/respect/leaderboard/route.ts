import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { fetchLeaderboard } from '@/lib/respect/leaderboard';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leaderboard, stats } = await fetchLeaderboard();

    // Remove internal fields (ogPct, zorPct) from public response
    const publicLeaderboard = leaderboard.map(({ ogPct, zorPct, ...rest }) => rest);

    return NextResponse.json({ leaderboard: publicLeaderboard, stats, currentFid: session.fid });
  } catch (err) {
    console.error('Respect leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load respect data' }, { status: 500 });
  }
}
