import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Query respect_members table, sorted by total_respect descending
    const { data: members, error: membersErr } = await supabaseAdmin
      .from('respect_members')
      .select('*')
      .order('total_respect', { ascending: false });

    if (membersErr) throw membersErr;

    const leaderboard = (members || []).map((m, idx) => ({
      rank: idx + 1,
      name: m.name,
      wallet: m.wallet_address ?? '',
      fid: m.fid ? Number(m.fid) : null,
      totalRespect: Number(m.total_respect),
      fractalRespect: Number(m.fractal_respect),
      fractalCount: m.fractal_count ?? 0,
      onchainOG: Number(m.onchain_og),
      onchainZOR: Number(m.onchain_zor),
      firstRespectAt: m.first_respect_at ?? null,
      eventRespect: Number(m.event_respect),
      hostingRespect: Number(m.hosting_respect),
      bonusRespect: Number(m.bonus_respect),
      hostingCount: m.hosting_count ?? 0,
    }));

    const stats = {
      totalMembers: leaderboard.length,
      totalRespect: leaderboard.reduce((sum, e) => sum + e.totalRespect, 0),
      totalOG: leaderboard.reduce((sum, e) => sum + e.onchainOG, 0),
      totalZOR: leaderboard.reduce((sum, e) => sum + e.onchainZOR, 0),
      holdersWithRespect: leaderboard.filter((e) => e.totalRespect > 0).length,
    };

    return NextResponse.json({ leaderboard, stats, currentFid: session.fid });
  } catch (err) {
    console.error('Respect leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load respect data' }, { status: 500 });
  }
}
