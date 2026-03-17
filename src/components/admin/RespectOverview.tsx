'use client';

import { useState, useEffect } from 'react';

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

// ---------- Helpers ----------

const shortAddr = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-';

// ---------- Component ----------

export function RespectOverview() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/respect/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setStats(data.stats || null);
      } catch {
        setError('Failed to load respect data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
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

  // Derived stats
  const totalFractalSessions = leaderboard.reduce((sum, e) => sum + e.fractalCount, 0);
  const membersWithOnchain = leaderboard.filter((e) => e.onchainOG > 0 || e.onchainZOR > 0).length;

  // Filter
  const filtered = leaderboard.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.wallet?.toLowerCase().includes(q) ||
      String(e.fid).includes(q)
    );
  });

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{stats?.holdersWithRespect ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Members with Respect</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#f5a623]">{totalFractalSessions}</p>
          <p className="text-xs text-gray-400 mt-1">Fractal Sessions Recorded</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{stats?.totalRespect.toLocaleString() ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Total Respect Distributed</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{membersWithOnchain}</p>
          <p className="text-xs text-gray-400 mt-1">On-chain Balances</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, wallet, or FID..."
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Respect Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#1a2a3a] rounded-xl py-8 text-center text-gray-500">
          {search ? 'No members match your search' : 'No respect data yet'}
        </div>
      ) : (
        <div className="bg-[#1a2a3a] rounded-xl border border-gray-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">#</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">Wallet</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">Total</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">Fractal</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">OG</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">ZOR</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">Fractals</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">First Respect</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.wallet || entry.name}
                    className={`border-b border-gray-800/30 ${
                      entry.rank <= 3 ? 'bg-[#f5a623]/5' : 'hover:bg-white/5'
                    } transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-bold ${entry.rank <= 3 ? 'text-[#f5a623]' : 'text-gray-400'}`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-white font-medium">{entry.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-400 font-mono text-xs">{shortAddr(entry.wallet)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-white font-bold">{entry.totalRespect.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-gray-300">{entry.fractalRespect > 0 ? entry.fractalRespect.toLocaleString() : '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-gray-300">{entry.onchainOG > 0 ? entry.onchainOG.toLocaleString() : '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-gray-300">{entry.onchainZOR > 0 ? entry.onchainZOR.toLocaleString() : '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-gray-300">{entry.fractalCount > 0 ? entry.fractalCount : '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-500 text-xs">{entry.firstRespectAt ?? '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
