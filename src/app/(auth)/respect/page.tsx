'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RespectEntry {
  rank: number;
  name: string;
  wallet: string;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
}

interface RespectData {
  leaderboard: RespectEntry[];
  stats: {
    totalMembers: number;
    totalOG: number;
    totalZOR: number;
  };
}

export default function RespectPage() {
  const [data, setData] = useState<RespectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <Link href="/chat" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-2xl font-bold text-[#f5a623]">{data.stats.totalMembers}</p>
              <p className="text-xs text-gray-400 mt-1">Members</p>
            </div>
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-2xl font-bold text-[#f5a623]">{data.stats.totalOG.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">OG Respect</p>
            </div>
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-2xl font-bold text-[#f5a623]">{data.stats.totalZOR.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">ZOR Respect</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading onchain data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : data && data.leaderboard.length > 0 ? (
          <div className="space-y-2">
            {data.leaderboard.map((entry) => (
              <div
                key={entry.wallet}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  entry.rank <= 3
                    ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                    : 'bg-[#0d1b2a] border-gray-800'
                }`}
              >
                <span className="text-lg font-bold w-8 text-center">
                  {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#f5a623]">{entry.totalRespect.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {entry.ogRespect > 0 && `${entry.ogRespect.toLocaleString()} OG`}
                    {entry.ogRespect > 0 && entry.zorRespect > 0 && ' + '}
                    {entry.zorRespect > 0 && `${entry.zorRespect.toLocaleString()} ZOR`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No respect data found.</p>
          </div>
        )}

        {/* Footer info */}
        <p className="text-xs text-gray-600 text-center">
          Live onchain data from Optimism. Refreshes every 5 minutes.
        </p>
      </div>
    </div>
  );
}
