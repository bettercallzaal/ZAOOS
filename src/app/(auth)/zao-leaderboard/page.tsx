import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/db/supabase';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import ZAOILeaderboardClient from './ZAOLeaderboardClient';

export const metadata: Metadata = {
  title: 'ZAO Leaderboard | ZAO OS',
  description: 'See who is leading the Respect rankings in the ZAO community.',
};

export const revalidate = 300;

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  username: string | null;
  pfp_url: string | null;
  totalRespect: number;
  fractalRespect: number;
  fractalCount: number;
  onchainOG: number;
  onchainZOR: number;
  eventRespect: number;
  zid: string | null;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Fetch respect data
    const { data: respectData } = await supabaseAdmin
      .from('respect_members')
      .select('fid, wallet_address, total_respect, fractal_count, fractal_respect, event_respect, onchain_og, onchain_zor')
      .order('total_respect', { ascending: false })
      .limit(50);

    if (!respectData || respectData.length === 0) return [];

    // Fetch user profiles for names/avatars
    const fids = respectData.map(r => r.fid).filter(Boolean) as number[];
    const profileMap: Record<number, { username: string | null; pfp_url: string | null; zid: string | null }> = {};

    if (fids.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('fid, username, display_name, pfp_url, zid')
        .in('fid', fids);

      for (const u of users || []) {
        if (u.fid) {
          profileMap[u.fid] = {
            username: u.display_name || u.username,
            pfp_url: u.pfp_url,
            zid: u.zid,
          };
        }
      }
    }

    return respectData.map((r, i) => {
      const profile = r.fid ? profileMap[r.fid] : null;
      return {
        rank: i + 1,
        name: profile?.username || `Fid ${r.fid}` || r.wallet_address?.slice(0, 8) || 'Unknown',
        wallet: r.wallet_address || '',
        fid: r.fid,
        username: profile?.username || null,
        pfp_url: profile?.pfp_url || null,
        zid: profile?.zid || null,
        totalRespect: Number(r.total_respect) || 0,
        fractalRespect: Number(r.fractal_respect) || 0,
        fractalCount: r.fractal_count || 0,
        onchainOG: Number(r.onchain_og) || 0,
        onchainZOR: Number(r.onchain_zor) || 0,
        eventRespect: Number(r.event_respect) || 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function ZAOLeaderboardPage() {
  const entries = await fetchLeaderboard();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader
        title="ZAO Leaderboard"
        subtitle="Respect rankings"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-6 px-2">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full bg-[#1a2a3a] border-2 border-gray-600 overflow-hidden flex items-center justify-center text-lg text-gray-400">
                {entries[1].pfp_url ? (
                   
                  <img src={entries[1].pfp_url} alt={entries[1].name} className="w-full h-full object-cover" />
                ) : (
                  (entries[1].name[0] || '?').toUpperCase()
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium truncate max-w-[70px] text-center">{entries[1].name}</p>
              <p className="text-sm text-gray-500">{entries[1].totalRespect.toLocaleString()}</p>
              <div className="w-16 h-16 bg-[#1a2a3a] border border-gray-700 rounded-xl flex items-center justify-center text-2xl">
                🥈
              </div>
            </div>

            {/* 1st */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full bg-[#1a2a3a] border-2 border-[#f5a623] overflow-hidden flex items-center justify-center text-2xl text-[#f5a623]">
                {entries[0].pfp_url ? (
                   
                  <img src={entries[0].pfp_url} alt={entries[0].name} className="w-full h-full object-cover" />
                ) : (
                  (entries[0].name[0] || '?').toUpperCase()
                )}
              </div>
              <p className="text-xs text-white font-semibold truncate max-w-[80px] text-center">{entries[0].name}</p>
              <p className="text-base text-[#f5a623] font-bold">{entries[0].totalRespect.toLocaleString()}</p>
              <div className="w-20 h-20 bg-gradient-to-b from-[#f5a623]/20 to-[#f5a623]/5 border border-[#f5a623]/40 rounded-xl flex items-center justify-center text-3xl">
                🥇
              </div>
            </div>

            {/* 3rd */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full bg-[#1a2a3a] border-2 border-amber-700 overflow-hidden flex items-center justify-center text-lg text-amber-700">
                {entries[2].pfp_url ? (
                   
                  <img src={entries[2].pfp_url} alt={entries[2].name} className="w-full h-full object-cover" />
                ) : (
                  (entries[2].name[0] || '?').toUpperCase()
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium truncate max-w-[70px] text-center">{entries[2].name}</p>
              <p className="text-sm text-gray-500">{entries[2].totalRespect.toLocaleString()}</p>
              <div className="w-16 h-16 bg-[#1a2a3a] border border-gray-700 rounded-xl flex items-center justify-center text-2xl">
                🥉
              </div>
            </div>
          </div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
            All Rankings
          </p>
          <ZAOILeaderboardClient entries={entries} />
        </div>

        {/* Link to full respect page */}
        <div className="mt-6 text-center">
          <Link
            href="/respect"
            className="text-xs text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
          >
            View full Fractal Respect breakdown →
          </Link>
        </div>
      </div>
    </div>
  );
}
