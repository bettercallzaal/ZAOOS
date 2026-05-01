'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CircleMember {
  id: string;
  name: string;
}

interface Circle {
  id: string;
  slug: string;
  name: string;
  description: string;
  coordinator: { id: string; name: string } | null;
  coordinator_rotation_ends_at: string | null;
  members: CircleMember[];
  member_count: number;
  is_member: boolean;
  is_coordinator: boolean;
}

interface CirclesResponse {
  circles: Circle[];
  current_member_id: string | null;
}

export function CirclesView() {
  const [data, setData] = useState<CirclesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/stock/team/circles', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || 'Failed to load circles');
        return;
      }
      setData(j);
      setError(null);
    } catch {
      setError('Failed to load circles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (slug: string, isMember: boolean) => {
    setPending(slug);
    setError(null);
    try {
      const r = await fetch('/api/stock/team/circles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, action: isMember ? 'leave' : 'join' }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || 'Failed');
        return;
      }
      await load();
    } catch {
      setError('Network error');
    } finally {
      setPending(null);
    }
  };

  if (loading && !data) {
    return <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">Loading circles...</div>;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-300">
        {error || 'No circles available yet.'}
        <p className="mt-2 text-xs text-slate-500">If circles tables don&apos;t exist, run scripts/stock-circles-v1-migration.sql in Supabase.</p>
      </div>
    );
  }

  const isLoggedIn = data.current_member_id !== null;

  return (
    <div className="space-y-4">
      {!isLoggedIn && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          You&apos;re viewing as a guest. Sign in at <Link href="/stock/team" className="underline">/stock/team</Link> to join circles.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data.circles.map((c) => {
          const busy = pending === c.slug;
          return (
            <div
              key={c.id}
              className={`rounded-xl border bg-slate-900/40 p-5 transition ${
                c.is_member ? 'border-amber-500/40' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{c.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">/{c.slug}</p>
                </div>
                {isLoggedIn && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(c.slug, c.is_member)}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      c.is_member
                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                    } disabled:opacity-50`}
                  >
                    {busy ? '...' : c.is_member ? 'Leave' : 'Join'}
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{c.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
                  {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
                </span>
                {c.coordinator && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
                    coordinator: {c.coordinator.name}
                  </span>
                )}
                {c.is_coordinator && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">that&apos;s you</span>
                )}
              </div>
              {c.members.length > 0 && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                    See members ({c.member_count})
                  </summary>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {c.members.map((m) => (
                      <li
                        key={m.id}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${
                          m.id === c.coordinator?.id
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                            : 'border-white/10 bg-slate-800 text-slate-300'
                        }`}
                      >
                        {m.name}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Want to coordinate a circle? Tell Zaal in the ZAOstock Telegram group. No commitment, no rotation, no rules.
      </p>
    </div>
  );
}
