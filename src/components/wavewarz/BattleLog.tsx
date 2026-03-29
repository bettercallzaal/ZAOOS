'use client';

import { useState, useEffect, useCallback } from 'react';

interface Battle {
  battle_id: string;
  artist_a: string;
  artist_b: string;
  winner: string;
  winner_margin: number | null;
  volume_sol: number;
  settled_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div className="bg-[#0a1628] rounded-lg border border-gray-800 p-3 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-800 rounded w-1/2" />
        </div>
        <div className="h-4 w-6 bg-gray-700 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-700 rounded w-3/4 ml-auto" />
          <div className="h-3 bg-gray-800 rounded w-1/2 ml-auto" />
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="h-3 bg-gray-800 rounded w-20" />
        <div className="h-3 bg-gray-800 rounded w-16" />
      </div>
    </div>
  );
}

function BattleCard({ battle }: { battle: Battle }) {
  const aWon = battle.winner === battle.artist_a;
  const bWon = battle.winner === battle.artist_b;

  return (
    <div className="bg-[#0a1628] rounded-lg border border-gray-800 p-3">
      {/* Artists row */}
      <div className="flex items-center gap-2">
        {/* Artist A */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate ${aWon ? 'text-green-400' : 'text-gray-500'}`}
          >
            {battle.artist_a}
          </p>
          {aWon && (
            <p className="text-xs text-green-400/70 mt-0.5">Winner</p>
          )}
        </div>

        {/* VS divider */}
        <span className="text-xs font-bold text-[#f5a623] shrink-0 px-1">VS</span>

        {/* Artist B */}
        <div className="flex-1 min-w-0 text-right">
          <p
            className={`text-sm font-semibold truncate ${bWon ? 'text-green-400' : 'text-gray-500'}`}
          >
            {battle.artist_b}
          </p>
          {bWon && (
            <p className="text-xs text-green-400/70 mt-0.5">Winner</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {/* Volume */}
        <span className="text-purple-400 font-medium">
          ◎ {battle.volume_sol.toFixed(2)} SOL
        </span>

        {/* Margin + date */}
        <div className="flex items-center gap-2 text-gray-600">
          {battle.winner_margin != null && (
            <span className="text-gray-500">
              +{battle.winner_margin.toFixed(1)}%
            </span>
          )}
          <span>{timeAgo(battle.settled_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function BattleLog() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Debounce the search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBattles = useCallback(async (artist: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (artist.trim()) params.set('artist', artist.trim());
      const res = await fetch(`/api/wavewarz/battles?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch battles');
      const data: Battle[] = await res.json();
      setBattles(data);
    } catch {
      setError('Could not load battle log. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattles(debouncedSearch);
  }, [debouncedSearch, fetchBattles]);

  return (
    <div className="space-y-3">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h2 className="text-base font-semibold text-white flex-1">Battle Log</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artist…"
          className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-lg bg-[#0d1b2a] border border-gray-700 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#f5a623] transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Battle list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : battles.length === 0 ? (
          <div className="bg-[#0a1628] rounded-lg border border-gray-800 p-6 text-center">
            <p className="text-sm text-gray-500">No battles recorded yet</p>
          </div>
        ) : (
          battles.map((battle) => (
            <BattleCard key={battle.battle_id} battle={battle} />
          ))
        )}
      </div>
    </div>
  );
}
