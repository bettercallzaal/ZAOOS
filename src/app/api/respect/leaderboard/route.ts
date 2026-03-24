import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { fetchLeaderboard } from '@/lib/respect/leaderboard';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try DB first
    const { data: members } = await supabaseAdmin
      .from('respect_members')
      .select('*')
      .order('total_respect', { ascending: false });

    // If DB has data, use it
    if (members && members.length > 0) {
      const rawLeaderboard = members.map((m, idx) => ({
        rank: idx + 1,
        name: m.name,
        wallet: m.wallet_address ?? '',
        fid: m.fid ? Number(m.fid) : null,
        username: m.username ?? null,
        zid: m.zid ? Number(m.zid) : null,
        totalRespect: Number(m.total_respect),
        ogRespect: Number(m.onchain_og),
        zorRespect: Number(m.onchain_zor),
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

      const ogTotalSupply = rawLeaderboard.reduce((sum, e) => sum + e.ogRespect, 0);
      const zorTotalSupply = rawLeaderboard.reduce((sum, e) => sum + e.zorRespect, 0);

      const leaderboard = rawLeaderboard.map((e) => ({
        ...e,
        ogPct: ogTotalSupply > 0 ? Math.round((e.ogRespect / ogTotalSupply) * 1000) / 10 : 0,
        zorPct: zorTotalSupply > 0 ? Math.round((e.zorRespect / zorTotalSupply) * 1000) / 10 : 0,
      }));

      return NextResponse.json({
        leaderboard,
        stats: {
          totalMembers: leaderboard.length,
          totalRespect: leaderboard.reduce((sum, e) => sum + e.totalRespect, 0),
          totalOG: ogTotalSupply,
          totalZOR: zorTotalSupply,
          ogTotalSupply,
          zorTotalSupply,
          holdersWithRespect: leaderboard.filter((e) => e.totalRespect > 0).length,
        },
        currentFid: session.fid,
        currentWallet: session.walletAddress || null,
      }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' } });
    }

    // Fallback: read directly from on-chain
    const onchain = await fetchLeaderboard();
    const leaderboard = onchain.leaderboard.map((e) => ({
      rank: e.rank,
      name: e.name,
      wallet: e.wallet,
      fid: e.fid,
      username: e.username,
      zid: e.zid ?? null,
      totalRespect: e.totalRespect,
      ogRespect: e.ogRespect,
      zorRespect: e.zorRespect,
      ogPct: onchain.stats.ogTotalSupply > 0 ? Math.round((e.ogRespect / onchain.stats.ogTotalSupply) * 1000) / 10 : 0,
      zorPct: onchain.stats.zorTotalSupply > 0 ? Math.round((e.zorRespect / onchain.stats.zorTotalSupply) * 1000) / 10 : 0,
      fractalRespect: 0,
      fractalCount: 0,
      onchainOG: e.ogRespect,
      onchainZOR: e.zorRespect,
      firstRespectAt: e.firstTokenDate ?? null,
      eventRespect: 0,
      hostingRespect: 0,
      bonusRespect: 0,
      hostingCount: 0,
    }));

    return NextResponse.json({
      leaderboard,
      stats: onchain.stats,
      currentFid: session.fid,
      currentWallet: session.walletAddress || null,
    }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' } });
  } catch (err) {
    console.error('Respect leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load respect data' }, { status: 500 });
  }
}
