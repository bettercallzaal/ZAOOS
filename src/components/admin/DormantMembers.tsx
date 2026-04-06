'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DormantMember {
  id: string;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  lastActiveAt: string;
  daysSinceActive: number;
  totalRespect: number;
  fractalCount: number;
}

interface DormantResponse {
  dormant: DormantMember[];
  total: number;
  cutoffDays: number;
}

const DAY_OPTIONS = [30, 60, 90] as const;

export function DormantMembers() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<DormantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/dormant?days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json: DormantResponse = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError('Failed to load dormant members');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [days]);

  function daysBadgeClass(d: number): string {
    if (d > 90) return 'bg-red-500/20 text-red-400';
    if (d > 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-gray-700/50 text-gray-400';
  }

  return (
    <div className="space-y-4">
      {/* Header + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Dormant Members</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Members who haven&apos;t been active — highest respect first (most valuable to re-engage).
          </p>
        </div>
        <div className="flex gap-1.5">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDays(opt)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                days === opt
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-[#0d1f3c] text-gray-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-[#0d1f3c] border border-white/[0.08] rounded-lg p-3 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-700/50 rounded w-48" />
              </div>
              <div className="h-6 w-12 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-red-400 text-sm text-center py-8">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.dormant.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">
          No dormant members in the last {days} days.
        </p>
      )}

      {/* Member list */}
      {!loading && !error && data && data.dormant.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">{data.total} dormant member{data.total !== 1 ? 's' : ''}</p>
          {data.dormant.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 bg-[#0d1f3c] border border-white/[0.08] rounded-lg p-3 hover:border-white/[0.08] transition-colors"
            >
              {/* PFP */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 shrink-0 relative">
                {member.pfpUrl ? (
                  <Image
                    src={member.pfpUrl}
                    alt={member.displayName || member.username || ''}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                    {(member.displayName || member.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {member.displayName || member.username || 'Unknown'}
                  {member.username && (
                    <span className="text-gray-500 font-normal ml-1.5">@{member.username}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {member.fractalCount} fractal{member.fractalCount !== 1 ? 's' : ''}
                  {' \u00b7 '}
                  {member.totalRespect} respect
                  {' \u00b7 '}
                  last seen {member.daysSinceActive}d ago
                </div>
              </div>

              {/* Days badge */}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${daysBadgeClass(member.daysSinceActive)}`}
              >
                {member.daysSinceActive}d
              </span>

              {/* View link */}
              {member.username && (
                <a
                  href={`https://farcaster.xyz/${member.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#f5a623] hover:underline shrink-0"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
