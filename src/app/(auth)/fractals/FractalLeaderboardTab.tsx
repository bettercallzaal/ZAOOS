'use client';

import { useState, useEffect, useMemo } from 'react';

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
  eventRespect: number;
  hostingRespect: number;
  bonusRespect: number;
}

type SortKey = 'totalRespect' | 'fractalRespect' | 'onchainOG' | 'fractalCount';

interface Props {
  currentFid: number;
}

export function FractalLeaderboardTab({ currentFid }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('totalRespect');

  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        const seen = new Map<string, LeaderboardEntry>();
        for (const e of d.leaderboard ?? []) {
          const existing = seen.get(e.name);
          if (!existing || e.totalRespect > existing.totalRespect) {
            seen.set(e.name, e);
          }
        }
        setEntries([...seen.values()]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = entries.filter(e => e.totalRespect > 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.wallet?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    return list.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, search, sortBy]);

  const totalRespect = entries.reduce((s, e) => s + e.totalRespect, 0);
  const totalMembers = entries.filter(e => e.totalRespect > 0).length;

  // Find current user in the full sorted list (not filtered by search)
  const me = useMemo(() => {
    const sorted = [...entries]
      .filter(e => e.totalRespect > 0)
      .sort((a, b) => b.totalRespect - a.totalRespect);
    const idx = sorted.findIndex(e => e.fid === currentFid);
    if (idx === -1) return null;
    return { ...sorted[idx], rank: idx + 1, totalMembers: sorted.length };
  }, [entries, currentFid]);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'totalRespect', label: 'Total' },
    { key: 'fractalRespect', label: 'Fractal' },
    { key: 'onchainOG', label: 'On-Chain' },
    { key: 'fractalCount', label: 'Sessions' },
  ];

  // Percentile (top X%)
  const percentile = me ? Math.round((me.rank / me.totalMembers) * 100) : 0;

  return (
    <div className="pt-2 space-y-3">
      {/* My Stats Card */}
      {me && (
        <div className="bg-gradient-to-br from-[#f5a623]/10 to-[#0d1b2a] rounded-xl border border-[#f5a623]/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#f5a623] font-medium uppercase tracking-wider">Your Stats</p>
              <p className="text-lg font-bold text-white">{me.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#f5a623]">#{me.rank}</p>
              <p className="text-[10px] text-gray-500">of {me.totalMembers}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-[#0a1628]/60 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{me.totalRespect.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Total R</p>
            </div>
            <div className="bg-[#0a1628]/60 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{me.fractalCount}</p>
              <p className="text-[10px] text-gray-500">Sessions</p>
            </div>
            <div className="bg-[#0a1628]/60 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{me.fractalRespect.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Fractal R</p>
            </div>
            <div className="bg-[#0a1628]/60 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{me.onchainOG.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">On-Chain</p>
            </div>
          </div>

          {/* Respect breakdown bar */}
          <div className="h-2 bg-[#0a1628] rounded-full overflow-hidden flex">
            {me.fractalRespect > 0 && (
              <div
                className="bg-[#f5a623] h-full"
                style={{ width: `${(me.fractalRespect / Math.max(me.totalRespect, 1)) * 100}%` }}
              />
            )}
            {me.eventRespect > 0 && (
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${(me.eventRespect / Math.max(me.totalRespect, 1)) * 100}%` }}
              />
            )}
            {(me.hostingRespect + me.bonusRespect) > 0 && (
              <div
                className="bg-purple-500 h-full"
                style={{ width: `${((me.hostingRespect + me.bonusRespect) / Math.max(me.totalRespect, 1)) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-600">
            <span>Top {percentile}% of members</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />Fractal</span>
              {me.eventRespect > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Events</span>}
              {(me.hostingRespect + me.bonusRespect) > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Host/Bonus</span>}
            </span>
          </div>
        </div>
      )}

      {/* Community Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">{totalMembers}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Members</p>
        </div>
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">{totalRespect.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Respect</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or wallet..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
      />

      {/* Sort */}
      <div className="flex gap-1">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
              sortBy === opt.key
                ? 'bg-[#f5a623]/20 text-[#f5a623]'
                : 'bg-[#0d1b2a] text-gray-500 hover:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="flex items-center gap-2 px-3 text-[10px] text-gray-600 uppercase tracking-wider">
        <span className="w-7">#</span>
        <span className="flex-1">Name</span>
        <span className="w-16 text-right">Fractal</span>
        <span className="w-16 text-right">OG</span>
        <span className="w-14 text-right">Total</span>
      </div>

      {/* Entries */}
      <div className="space-y-1">
        {filtered.map((entry) => {
          const isMe = entry.fid === currentFid;
          return (
            <div
              key={entry.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isMe ? 'bg-[#f5a623]/10 border border-[#f5a623]/20' : 'bg-[#0d1b2a]'
              }`}
            >
              <span className="w-7 text-xs text-gray-500 text-center">
                {entry.rank <= 3
                  ? ['1st', '2nd', '3rd'][entry.rank - 1]
                  : `#${entry.rank}`
                }
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {entry.name}
                  {isMe && <span className="ml-1 text-[10px] text-[#f5a623]">you</span>}
                </p>
                <p className="text-[10px] text-gray-600">
                  {entry.fractalCount || 0} sessions
                  {entry.hostingRespect > 0 && ` / ${entry.hostingRespect} hosting`}
                  {entry.bonusRespect > 0 && ` / ${entry.bonusRespect} bonus`}
                </p>
              </div>
              <div className="w-16 text-right">
                <p className="text-xs font-mono text-[#f5a623]">{entry.fractalRespect}</p>
              </div>
              <div className="w-16 text-right">
                <p className="text-xs font-mono text-gray-400">{entry.onchainOG}</p>
              </div>
              <div className="w-14 text-right">
                <p className="text-xs font-mono font-bold text-white">{entry.totalRespect}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          {search ? 'No members match your search.' : 'No respect data yet.'}
        </p>
      )}

      <p className="text-[10px] text-gray-600 text-center">
        Showing {filtered.length} of {totalMembers} members. Respect = Fractal + Events + Hosting + Bonus.
      </p>
    </div>
  );
}
