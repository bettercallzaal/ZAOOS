'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------- Types ----------

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
  fractalRespect: number;
  fractalCount: number;
  onchainOG: number;
  onchainZOR: number;
  firstRespectAt: string | null;
  eventRespect: number;
  hostingRespect: number;
  bonusRespect: number;
  hostingCount: number;
}

interface LeaderboardStats {
  totalMembers: number;
  totalRespect: number;
  totalOG: number;
  totalZOR: number;
  holdersWithRespect: number;
}

interface FractalHistoryEntry {
  session_date: string | null;
  session_name: string | null;
  scoring_era: string | null;
  rank: number | null;
  score: number;
}

interface MemberDetail {
  member: {
    name: string;
    wallet_address: string;
    fid: number | null;
    total_respect: number;
    fractal_respect: number;
    event_respect: number;
    hosting_respect: number;
    bonus_respect: number;
    onchain_og: number;
    onchain_zor: number;
    first_respect_at: string | null;
    fractal_count: number;
    hosting_count: number;
  };
  fractalHistory: FractalHistoryEntry[];
}

// ---------- Component ----------

export function RespectLeaderboard({ currentFid }: { currentFid: number }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Member detail state
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // Fetch leaderboard
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/respect/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setStats(data.stats || null);
        setCurrentWallet(data.currentWallet || null);
      } catch {
        setError('Failed to load respect data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch member detail when a member is selected
  const handleMemberClick = useCallback(async (wallet: string) => {
    if (selectedWallet === wallet) {
      // Toggle off
      setSelectedWallet(null);
      setMemberDetail(null);
      return;
    }

    setSelectedWallet(wallet);
    setMemberDetail(null);
    setMemberLoading(true);

    try {
      const res = await fetch(`/api/respect/member?wallet=${encodeURIComponent(wallet)}`);
      if (!res.ok) throw new Error('Failed to fetch member');
      const data = await res.json();
      setMemberDetail(data);
    } catch {
      setMemberDetail(null);
    } finally {
      setMemberLoading(false);
    }
  }, [selectedWallet]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm mt-3">Loading respect data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const myEntry = leaderboard.find((e) =>
    (e.fid && e.fid === currentFid) ||
    (e.wallet && currentWallet && e.wallet.toLowerCase() === currentWallet.toLowerCase())
  );

  return (
    <>
      {/* Your Respect card */}
      {myEntry && (
        <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#f5a623] uppercase tracking-wider">Your Respect</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{myEntry.totalRespect.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {myEntry.fractalRespect > 0 && `${myEntry.fractalRespect.toLocaleString()} fractal`}
                {myEntry.fractalRespect > 0 && myEntry.onchainOG > 0 && ' + '}
                {myEntry.onchainOG > 0 && `${myEntry.onchainOG.toLocaleString()} OG`}
                {(myEntry.fractalRespect > 0 || myEntry.onchainOG > 0) && myEntry.onchainZOR > 0 && ' + '}
                {myEntry.onchainZOR > 0 && `${myEntry.onchainZOR.toLocaleString()} ZOR`}
                {myEntry.totalRespect === 0 && 'No respect earned yet'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[#f5a623]">#{myEntry.rank}</p>
              <p className="text-xs text-gray-400">of {stats?.totalMembers ?? 0}</p>
            </div>
          </div>
          {myEntry.fractalCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {myEntry.fractalCount} fractal{myEntry.fractalCount !== 1 ? 's' : ''} attended
              {myEntry.firstRespectAt && ` \u00B7 since ${myEntry.firstRespectAt}`}
            </p>
          )}
        </div>
      )}

      {/* No wallet linked notice */}
      {!myEntry && (
        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] text-center">
          <p className="text-sm text-gray-400">
            Your wallet isn&apos;t linked yet. Ask an admin to add your FID to the allowlist to see your Respect here.
          </p>
        </div>
      )}

      {/* Community Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
            <p className="text-xl font-bold text-white">{stats.totalMembers}</p>
            <p className="text-xs text-gray-500 mt-1">Members</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
            <p className="text-xl font-bold text-white">{stats.totalRespect.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total Respect</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
            <p className="text-xl font-bold text-white">{stats.holdersWithRespect}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Leaderboard</p>
          {leaderboard.map((entry) => {
            const isMe = entry.fid === currentFid;
            const isSelected = selectedWallet === entry.wallet;
            return (
              <div key={entry.wallet || entry.name}>
                <button
                  type="button"
                  onClick={() => entry.wallet && handleMemberClick(entry.wallet)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-[#f5a623]/15 border-[#f5a623]/40'
                      : isMe
                        ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                        : entry.rank <= 3
                          ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                          : 'bg-[#0d1b2a] border-white/[0.08]'
                  } ${entry.wallet ? 'cursor-pointer hover:bg-[#f5a623]/10' : 'cursor-default'}`}
                >
                  <span className="text-lg font-bold w-8 text-center flex-shrink-0">
                    {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                        {entry.name}{isMe && ' (you)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {entry.fractalCount > 0 && (
                        <span>{entry.fractalCount} fractal{entry.fractalCount !== 1 ? 's' : ''}</span>
                      )}
                      {entry.firstRespectAt && (
                        <span className="text-[10px] text-gray-600">since {entry.firstRespectAt}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                      {entry.totalRespect.toLocaleString()}
                    </p>
                    <div className="text-[10px] text-gray-500 space-x-1">
                      {entry.fractalRespect > 0 && <span>{entry.fractalRespect.toLocaleString()} frac</span>}
                      {entry.onchainOG > 0 && <span>{entry.onchainOG.toLocaleString()} OG</span>}
                      {entry.onchainZOR > 0 && <span>{entry.onchainZOR.toLocaleString()} ZOR</span>}
                    </div>
                  </div>
                </button>

                {/* Member detail panel */}
                {isSelected && (
                  <div className="mt-1 mx-2 rounded-lg bg-[#0d1b2a] border border-white/[0.08] p-4 space-y-3">
                    {memberLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-xs mt-2">Loading history...</p>
                      </div>
                    ) : memberDetail ? (
                      <>
                        {/* Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                            <p className="text-gray-500">Fractal</p>
                            <p className="text-white font-medium">{memberDetail.member.fractal_respect.toLocaleString()}</p>
                          </div>
                          <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                            <p className="text-gray-500">On-chain OG</p>
                            <p className="text-white font-medium">{memberDetail.member.onchain_og.toLocaleString()}</p>
                          </div>
                          <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                            <p className="text-gray-500">On-chain ZOR</p>
                            <p className="text-white font-medium">{memberDetail.member.onchain_zor.toLocaleString()}</p>
                          </div>
                          <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                            <p className="text-gray-500">Fractals</p>
                            <p className="text-white font-medium">{memberDetail.member.fractal_count}</p>
                          </div>
                          {memberDetail.member.hosting_count > 0 && (
                            <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                              <p className="text-gray-500">Hosted</p>
                              <p className="text-white font-medium">{memberDetail.member.hosting_count}</p>
                            </div>
                          )}
                          {memberDetail.member.first_respect_at && (
                            <div className="bg-[#0a1628] rounded-lg p-2 border border-white/[0.08]">
                              <p className="text-gray-500">First Respect</p>
                              <p className="text-white font-medium">{memberDetail.member.first_respect_at}</p>
                            </div>
                          )}
                        </div>

                        {/* Fractal history */}
                        {memberDetail.fractalHistory.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fractal History</p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {memberDetail.fractalHistory.map((fh, i) => (
                                <div
                                  key={`${fh.session_date}-${i}`}
                                  className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-[#0a1628] border border-white/[0.08]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-gray-500 flex-shrink-0">
                                      {fh.session_date ?? 'Unknown'}
                                    </span>
                                    {fh.session_name && (
                                      <span className="text-gray-400 truncate">{fh.session_name}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {fh.rank && (
                                      <span className="text-gray-500">Rank {fh.rank}</span>
                                    )}
                                    <span className="text-[#f5a623] font-medium">+{fh.score}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {memberDetail.fractalHistory.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-2">No fractal history recorded yet.</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">Could not load member details.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No respect data found.</p>
        </div>
      )}
    </>
  );
}
