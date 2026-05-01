'use client';

import { useEffect, useState } from 'react';

interface SnapshotResponse {
  success: boolean;
  data?: {
    empire: {
      name?: string;
      token_symbol?: string;
      farcaster_name?: string;
      rank?: number;
      total_distributed?: string | number;
      total_burned?: string | number;
    } | null;
    topLeaderboard: {
      entries: Array<{
        address: string;
        rank: number;
        farcaster_username?: string | null;
        points?: number;
        score?: number;
        totalRewards?: number;
      }>;
    } | null;
    totals: {
      lifetimeDistributedUsd: number;
      lifetimeBurned: number;
      distributionCount: number;
      burnCount: number;
    };
  };
  error?: string;
}

function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTokens(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function EmpireZabalHero() {
  const [data, setData] = useState<SnapshotResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/empire-builder/snapshot')
      .then((r) => r.json() as Promise<SnapshotResponse>)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error ?? 'snapshot_unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) setError('network_error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#f5a623]/10 to-[#0d1b2a] rounded-2xl border border-[#f5a623]/20 p-5 mb-4 animate-pulse">
        <div className="h-3 bg-white/5 rounded w-32 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#0d1b2a]/60 rounded-xl p-3">
              <div className="h-5 bg-white/5 rounded w-16 mb-2" />
              <div className="h-2.5 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { totals, topLeaderboard, empire } = data;
  const topThree = topLeaderboard?.entries.slice(0, 3) ?? [];

  return (
    <div className="bg-gradient-to-br from-[#f5a623]/10 via-[#0d1b2a] to-[#0d1b2a] rounded-2xl border border-[#f5a623]/20 p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-medium">
            ZABAL Empire - Live
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {empire?.name ?? '$ZABAL'} on Empire Builder V3
            {empire?.rank ? ` - rank #${empire.rank}` : ''}
          </p>
        </div>
        <a
          href="https://www.empirebuilder.world/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] transition-colors whitespace-nowrap"
        >
          Open Empire &rarr;
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#0a1628] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-lg font-bold text-white">{formatUsd(totals.lifetimeDistributedUsd)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Lifetime distributed</p>
        </div>
        <div className="bg-[#0a1628] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-lg font-bold text-white">{formatTokens(totals.lifetimeBurned)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">$ZABAL burned</p>
        </div>
        <div className="bg-[#0a1628] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-lg font-bold text-white">{topLeaderboard?.entries.length ?? 0}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Holders ranked</p>
        </div>
      </div>

      {topThree.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top holders</p>
          {topThree.map((entry) => (
            <div
              key={entry.address}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a1628] border border-white/[0.04]"
            >
              <span className="text-xs font-bold text-[#f5a623] w-5">#{entry.rank}</span>
              <p className="flex-1 text-xs text-white truncate">
                {entry.farcaster_username
                  ? `@${entry.farcaster_username}`
                  : shortAddress(entry.address)}
              </p>
              <p className="text-xs text-gray-400">
                {entry.points
                  ? entry.points.toLocaleString()
                  : entry.score?.toLocaleString() ?? '-'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
