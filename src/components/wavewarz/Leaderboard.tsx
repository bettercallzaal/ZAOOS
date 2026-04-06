'use client';

import { useState, useEffect, useCallback } from 'react';

interface WaveWarZArtist {
  solana_wallet: string;
  name: string;
  battles_count: number;
  wins: number;
  losses: number;
  total_volume_sol: number;
  career_earnings_sol: number;
  spotlight_tier: string | null;
  zao_fid: number | null;
  updated_at: string;
}

type SortMode = 'wins' | 'volume';

function getSpotlightTier(artist: WaveWarZArtist): string | null {
  if (artist.wins >= 25) return 'battle_legend';
  if (artist.wins >= 10) return 'battle_veteran';
  if (artist.wins >= 3) return 'rising_star';
  return artist.spotlight_tier ?? null;
}

function SpotlightBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;

  const config: Record<string, { label: string; className: string }> = {
    rising_star: {
      label: 'Rising Star',
      className: 'bg-green-500/10 text-green-400 border border-green-500/20',
    },
    battle_veteran: {
      label: 'Battle Veteran',
      className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    battle_legend: {
      label: 'Battle Legend',
      className: 'bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20',
    },
  };

  const badge = config[tier];
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function ZAOBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 ml-1">
      ZAO
    </span>
  );
}

function RankNumber({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold text-sm">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-700/20 text-orange-400 font-bold text-sm">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-gray-500 font-medium text-sm">
      {rank}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 bg-[#0d1b2a] rounded-xl border border-white/[0.08]" />
      ))}
    </div>
  );
}

function WinRate({ wins, battles }: { wins: number; battles: number }) {
  if (battles === 0) return <span className="text-gray-500">—</span>;
  const pct = Math.round((wins / battles) * 100);
  const color =
    pct >= 70
      ? 'text-green-400'
      : pct >= 50
      ? 'text-[#f5a623]'
      : 'text-red-400';
  return <span className={color}>{pct}%</span>;
}

// Mobile card layout for a single artist row
function ArtistCard({ artist, rank }: { artist: WaveWarZArtist; rank: number }) {
  const tier = getSpotlightTier(artist);
  return (
    <div className="p-3 bg-[#0d1b2a] rounded-xl border border-white/[0.08] flex gap-3 items-start">
      <div className="flex-shrink-0 pt-0.5">
        <RankNumber rank={rank} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{artist.name || 'Unknown'}</span>
          {artist.zao_fid && <ZAOBadge />}
        </div>
        {tier && (
          <div className="mt-1">
            <SpotlightBadge tier={tier} />
          </div>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-500">W / L</p>
            <p className="text-white font-medium">
              {artist.wins} / {artist.losses}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Win%</p>
            <p className="font-medium">
              <WinRate wins={artist.wins} battles={artist.battles_count} />
            </p>
          </div>
          <div>
            <p className="text-gray-500">Volume</p>
            <p className="text-white font-medium">{artist.total_volume_sol.toFixed(2)} SOL</p>
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Career: <span className="text-gray-300">{artist.career_earnings_sol.toFixed(2)} SOL</span>
        </div>
      </div>
    </div>
  );
}

export default function WaveWarZLeaderboard() {
  const [artists, setArtists] = useState<WaveWarZArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('wins');

  const fetchArtists = useCallback(async (sort: SortMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wavewarz/artists?sort=${sort}&limit=50`);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data: WaveWarZArtist[] = await res.json();
      setArtists(data);
    } catch {
      setError('Could not load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists(sortMode);
  }, [fetchArtists, sortMode]);

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSortMode('wins')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            sortMode === 'wins'
              ? 'bg-[#f5a623] text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          By Wins
        </button>
        <button
          onClick={() => setSortMode('volume')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            sortMode === 'volume'
              ? 'bg-[#f5a623] text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          By Volume
        </button>
      </div>

      {loading && <LoadingSkeleton />}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && artists.length === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm">
          No battle data yet. Sync WaveWarZ to populate the leaderboard.
        </div>
      )}

      {!loading && !error && artists.length > 0 && (
        <>
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-2">
            {artists.map((artist, idx) => (
              <ArtistCard key={artist.solana_wallet} artist={artist} rank={idx + 1} />
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left pb-3 pr-4 w-10">#</th>
                  <th className="text-left pb-3 pr-4">Artist</th>
                  <th className="text-right pb-3 pr-4">W</th>
                  <th className="text-right pb-3 pr-4">L</th>
                  <th className="text-right pb-3 pr-4">Win%</th>
                  <th className="hidden sm:table-cell text-right pb-3 pr-4">Volume (SOL)</th>
                  <th className="hidden md:table-cell text-right pb-3 pr-4">Earnings (SOL)</th>
                  <th className="hidden lg:table-cell text-left pb-3">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {artists.map((artist, idx) => {
                  const rank = idx + 1;
                  const tier = getSpotlightTier(artist);
                  return (
                    <tr
                      key={artist.solana_wallet}
                      className="hover:bg-[#0d1b2a]/60 transition-colors group"
                    >
                      <td className="py-3 pr-4">
                        <RankNumber rank={rank} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium">
                            {artist.name || 'Unknown'}
                          </span>
                          {artist.zao_fid && <ZAOBadge />}
                          <span className="hidden lg:inline">
                            <SpotlightBadge tier={tier} />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-green-400 font-medium">
                        {artist.wins}
                      </td>
                      <td className="py-3 pr-4 text-right text-red-400 font-medium">
                        {artist.losses}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        <WinRate wins={artist.wins} battles={artist.battles_count} />
                      </td>
                      <td className="hidden sm:table-cell py-3 pr-4 text-right text-gray-300">
                        {artist.total_volume_sol.toFixed(2)}
                      </td>
                      <td className="hidden md:table-cell py-3 pr-4 text-right text-gray-300">
                        {artist.career_earnings_sol.toFixed(2)}
                      </td>
                      <td className="hidden lg:table-cell py-3">
                        <SpotlightBadge tier={tier} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
