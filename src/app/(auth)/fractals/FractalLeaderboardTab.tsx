'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
  fractalRespect: number;
  fractalCount: number;
  onchainZOR: number;
}

interface Props {
  currentFid: number;
}

export function FractalLeaderboardTab({ currentFid }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        const sorted = [...(d.leaderboard ?? [])]
          .filter((e: LeaderboardEntry) => e.fractalRespect > 0)
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.fractalRespect - a.fractalRespect)
          .map((e: LeaderboardEntry, idx: number) => ({ ...e, rank: idx + 1 }));
        setEntries(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No fractal respect earned yet.</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">{entries.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Participants</p>
        </div>
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">
            {entries.reduce((sum, e) => sum + e.fractalRespect, 0)}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Fractal R</p>
        </div>
      </div>

      <div className="space-y-1">
        {entries.map((entry) => {
          const isMe = entry.fid === currentFid;
          return (
            <div
              key={entry.rank.toString()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isMe ? 'bg-[#f5a623]/10 border border-[#f5a623]/20' : 'bg-[#0d1b2a] hover:bg-[#0d1b2a]/80'
              }`}
            >
              <span className="w-7 text-center text-xs font-bold text-gray-500">#{entry.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {entry.name}
                  {isMe && <span className="ml-1 text-[10px] text-[#f5a623]">you</span>}
                </p>
                <p className="text-[10px] text-gray-500">{entry.fractalCount} sessions</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-[#f5a623]">{entry.fractalRespect}</p>
                <p className="text-[10px] text-gray-600">fractal R</p>
              </div>
              {entry.onchainZOR > 0 && (
                <div className="text-right ml-2">
                  <p className="text-xs font-mono text-gray-400">{entry.onchainZOR}</p>
                  <p className="text-[10px] text-gray-600">ZOR</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center mt-4">
        Fractal Respect earned through peer-ranked breakout sessions.
      </p>
    </div>
  );
}
