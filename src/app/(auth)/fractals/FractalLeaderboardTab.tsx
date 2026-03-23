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
        // Deduplicate by name (keep highest total)
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

  return (
    <div className="pt-2 space-y-3">
      {/* Stats */}
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
        className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
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
