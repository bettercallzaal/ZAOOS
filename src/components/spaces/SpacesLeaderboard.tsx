'use client';

import { useEffect, useState } from 'react';

/**
 * Spaces leaderboard — surfaces /api/spaces/leaderboard (previously orphaned).
 * Ranks members by total minutes spent in Spaces (Stream + Juke + 100ms rooms)
 * over a selectable period.
 */

interface LeaderboardRow {
  fid: number;
  totalMinutes: number;
  sessionCount: number;
  favoriteRoom: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

type Period = 'week' | 'month' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];

const RANK = ['🥇', '🥈', '🥉'];

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function SpacesLeaderboard() {
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/spaces/leaderboard?period=${period}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setRows(Array.isArray(d.leaderboard) ? d.leaderboard : []);
        setTotalMinutes(d.totalCommunityMinutes ?? 0);
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Leaderboard
        </h2>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#0d1b2a] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p.id ? 'bg-[#f5a623] text-[#0a1628]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {totalMinutes > 0 && (
        <p className="text-xs text-gray-500">
          {formatMinutes(totalMinutes)} of community time logged{' '}
          {period === 'all' ? 'all time' : `this ${period}`}.
        </p>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading leaderboard…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1b2a] py-10 text-center text-sm text-gray-500">
          No time logged yet. Join a room — your minutes show up here.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, i) => {
            const name = row.displayName || row.username || `FID ${row.fid}`;
            return (
              <li
                key={row.fid}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-3 py-2.5"
              >
                <span className="w-6 flex-shrink-0 text-center text-sm font-bold text-gray-400">
                  {RANK[i] ?? i + 1}
                </span>
                {row.pfpUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.pfpUrl}
                    alt=""
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] text-sm font-semibold text-white">
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {row.sessionCount} session{row.sessionCount === 1 ? '' : 's'}
                    {row.favoriteRoom ? ` · ${row.favoriteRoom}` : ''}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold text-[#f5a623]">
                  {formatMinutes(row.totalMinutes)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
