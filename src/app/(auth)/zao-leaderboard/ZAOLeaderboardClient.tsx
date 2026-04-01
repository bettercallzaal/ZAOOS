'use client';

import Link from 'next/link';

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

interface Props {
  entries: LeaderboardEntry[];
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ZAOLeaderboardClient({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No leaderboard data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry) => {
        const isTop3 = entry.rank <= 3;
        if (isTop3) return null; // Top 3 shown in podium above

        return (
          <Link
            key={entry.wallet || entry.rank}
            href={entry.fid ? `/members/${entry.username}` : '#'}
            className="flex items-center gap-3 bg-[#0d1b2a] rounded-xl px-3 py-2.5 border border-gray-800 hover:border-[#f5a623]/30 transition-colors group"
          >
            {/* Rank */}
            <div className="w-7 flex-shrink-0 text-center">
              <span className="text-sm font-medium text-gray-500">
                {entry.rank}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              {entry.pfp_url ? (
                 
                <img
                  src={entry.pfp_url}
                  alt={entry.name}
                  className="w-8 h-8 rounded-full object-cover bg-[#1a2a3a]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a2a3a] flex items-center justify-center text-xs text-gray-500">
                  {(entry.name[0] || '?').toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + Respect */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-[#f5a623] transition-colors truncate">
                {entry.name}
              </p>
              <p className="text-[10px] text-gray-600">
                {entry.fractalCount > 0 ? `${entry.fractalCount} sessions • ` : ''}
                {entry.onchainOG > 0 ? `OG: ${formatNumber(entry.onchainOG)} • ` : ''}
                {entry.eventRespect > 0 ? `Events: ${formatNumber(entry.eventRespect)}` : ''}
              </p>
            </div>

            {/* Total Respect */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-bold text-[#f5a623]">
                {entry.totalRespect.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-600">Respect</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
