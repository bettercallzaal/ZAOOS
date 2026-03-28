'use client';

import { useState, useEffect } from 'react';

interface SongjamEntry {
  username: string;
  name: string;
  totalPoints: number;
  userId: string;
  tlPoints?: number;
  farcasterPoints?: number;
  songjamSpacePoints?: number;
  empireMultiplier?: number;
  zabalBalance?: string;
  connectedWalletAddress?: string;
  stakingMultiplier?: number;
  stakedBalance?: string;
  pointsWithoutMultiplier?: number;
}

type Timeframe = 'all' | 'daily' | 'weekly';

export function SongjamLeaderboard() {
  const [entries, setEntries] = useState<SongjamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/songjam/leaderboard?timeframe=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [timeframe]);

  const totalPoints = entries.reduce((sum, e) => sum + e.totalPoints, 0);

  return (
    <div>
      {/* Timeframe tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'weekly', 'daily'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-[#1a2a3a] text-gray-400 hover:text-white'
            }`}
          >
            {tf === 'all' ? 'All Time' : tf === 'weekly' ? '7 Day' : '24 Hour'}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Participants</div>
          <div className="text-white text-xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Points</div>
          <div className="text-white text-xl font-bold">{Math.round(totalPoints).toLocaleString()}</div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Leader</div>
          <div className="text-[#f5a623] text-xl font-bold truncate">{entries[0]?.name || '—'}</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#0d1b2a] rounded-xl h-16 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No leaderboard data available</div>
      ) : (
        <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0d1b2a] border-b border-gray-800">
                <tr>
                  <th className="text-left text-gray-500 text-xs uppercase px-4 py-3 w-12">#</th>
                  <th className="text-left text-gray-500 text-xs uppercase px-4 py-3">Singer</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Points</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3 hidden sm:table-cell">FC Points</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3 hidden sm:table-cell">Space Pts</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3 hidden md:table-cell">Multiplier</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const share = totalPoints > 0 ? (entry.totalPoints / totalPoints) * 100 : 0;
                  return (
                    <tr key={entry.userId} className="border-b border-gray-800/50 hover:bg-[#1a2a3a]/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{entry.name}</div>
                        <div className="text-gray-500 text-xs">@{entry.username}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono">
                        {Math.round(entry.totalPoints).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono hidden sm:table-cell">
                        {entry.farcasterPoints?.toFixed(1) || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono hidden sm:table-cell">
                        {entry.songjamSpacePoints?.toLocaleString() || '—'}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {entry.empireMultiplier ? (
                          <span className="text-[#f5a623] font-mono">{entry.empireMultiplier}x</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[#f5a623] font-mono">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center mt-4 text-gray-600 text-xs">
        Powered by Songjam — data from songjamspace-leaderboard
      </div>
    </div>
  );
}
