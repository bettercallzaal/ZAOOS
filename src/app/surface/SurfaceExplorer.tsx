'use client';

import { useMemo, useState } from 'react';
import type { RouteEntry } from '@/lib/surface-map';

// THE SAFETY RULE OF THIS PAGE, in one line: only GET is callable.
//
// A tap-to-test console over 300+ routes is a loaded gun if it can fire POST or
// DELETE. So mutating methods are DISPLAYED (you need to know they exist) but
// never callable from here - there is no code path in this file that issues a
// non-GET request. Testing a mutation stays a deliberate act in a terminal or in
// the feature's own UI, where the payload is written on purpose.
//
// GET is not automatically harmless either, so nothing fires on load or on
// filter - only on an explicit per-route tap.

interface Props {
  routes: RouteEntry[];
  generatedAt: string;
}

interface Result {
  status: number | null;
  ms: number;
  body: string;
  error?: string;
}

const AUTH_STYLES: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-300 border-red-500/30',
  session: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  cron: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  signed: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  token: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  public: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

// A route is testable from here only if it serves GET and needs no [param].
function isTestable(r: RouteEntry): boolean {
  return r.methods.includes('GET') && !r.dynamic;
}

function statusTone(status: number | null): string {
  if (status === null) return 'text-gray-400';
  if (status < 300) return 'text-green-400';
  if (status < 400) return 'text-amber-400';
  // 401/403 on a guarded route is the guard WORKING, not a failure.
  if (status === 401 || status === 403) return 'text-blue-300';
  return 'text-red-400';
}

export default function SurfaceExplorer({ routes, generatedAt }: Props) {
  const [query, setQuery] = useState('');
  const [authFilter, setAuthFilter] = useState<string>('all');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [pending, setPending] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byAuth: Record<string, number> = {};
    for (const r of routes) byAuth[r.auth] = (byAuth[r.auth] || 0) + 1;
    return byAuth;
  }, [routes]);

  const reviewCount = useMemo(() => routes.filter((r) => r.review).length, [routes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((r) => {
      if (reviewOnly && !r.review) return false;
      if (authFilter !== 'all' && r.auth !== authFilter) return false;
      if (!q) return true;
      return r.path.toLowerCase().includes(q) || r.what.toLowerCase().includes(q);
    });
  }, [routes, query, authFilter, reviewOnly]);

  async function test(r: RouteEntry) {
    if (!isTestable(r)) return; // belt and braces - the button is also disabled
    setPending(r.path);
    const started = performance.now();
    try {
      const res = await fetch(r.path, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const text = await res.text();
      setResults((prev) => ({
        ...prev,
        [r.path]: {
          status: res.status,
          ms: Math.round(performance.now() - started),
          body: text.slice(0, 1200),
        },
      }));
    } catch (error: unknown) {
      setResults((prev) => ({
        ...prev,
        [r.path]: {
          status: null,
          ms: Math.round(performance.now() - started),
          body: '',
          error: error instanceof Error ? error.message : 'request failed',
        },
      }));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] px-4 py-6 text-gray-100 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-[#f5a623] sm:text-3xl">Surface</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Every API route in ZAOOS, generated from the source on {generatedAt}. Search before you
          build - if a route already covers it, extend that route instead of adding another.
        </p>

        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Only GET routes are callable here. Anything that writes is listed so you know it exists,
          but this page will not fire it - run those deliberately, with a payload you wrote on
          purpose.
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 300+ routes - try publish, members, tasks"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-base text-gray-100 placeholder:text-gray-500 focus:border-[#f5a623] focus:outline-none"
          />
          <select
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-base text-gray-100 focus:border-[#f5a623] focus:outline-none"
          >
            <option value="all">all auth ({routes.length})</option>
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([auth, n]) => (
                <option key={auth} value={auth}>
                  {auth} ({n})
                </option>
              ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setReviewOnly((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              reviewOnly
                ? 'border-red-500/50 bg-red-500/20 text-red-200'
                : 'border-white/10 bg-white/5 text-gray-300'
            }`}
          >
            Needs review ({reviewCount})
          </button>
          <p className="text-xs text-gray-500">
            Showing {filtered.length} of {routes.length}. A 401 on a guarded route is the guard
            working, not a failure.
          </p>
        </div>

        {reviewOnly && (
          <p className="mt-3 max-w-2xl text-sm text-gray-400">
            These have no auth guard yet hold a service-role key, which bypasses row-level security.
            That is the shape of the anonymous board leak (#2829), so each one wants a human read.
            Some are deliberately public - flagged is not the same as broken.
          </p>
        )}
      </header>

      <ul className="mx-auto mt-5 max-w-5xl space-y-2">
        {filtered.map((r) => {
          const result = results[r.path];
          const testable = isTestable(r);
          return (
            <li
              key={r.path}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <code className="block break-all font-mono text-sm text-gray-100">{r.path}</code>
                  {r.what && <p className="mt-1 text-sm text-gray-400">{r.what}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-xs ${AUTH_STYLES[r.auth] || AUTH_STYLES.public}`}
                    >
                      {r.auth}
                    </span>
                    {r.methods.map((m) => (
                      <span
                        key={m}
                        className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                          m === 'GET'
                            ? 'bg-white/10 text-gray-300'
                            : 'bg-white/5 text-gray-500 line-through'
                        }`}
                        title={
                          m === 'GET' ? 'callable here' : 'mutating - not callable from this page'
                        }
                      >
                        {m}
                      </span>
                    ))}
                    {r.dynamic && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-gray-500">
                        needs a param
                      </span>
                    )}
                    {r.serviceRole && (
                      <span
                        className="rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-300"
                        title="Holds a service-role key - queries bypass row-level security"
                      >
                        service-role
                      </span>
                    )}
                    {r.rateLimited && (
                      <span
                        className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-gray-400"
                        title="Rate-limited. Slows enumeration; does not authorize anyone."
                      >
                        rate-limited
                      </span>
                    )}
                    {r.review && (
                      <span
                        className="rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-xs text-red-300"
                        title="No auth guard, but holds an RLS-bypassing key. Read this handler."
                      >
                        review
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => test(r)}
                  disabled={!testable || pending === r.path}
                  title={
                    testable
                      ? 'Send a GET and show the response'
                      : r.dynamic
                        ? 'Dynamic route - fill the [param] and call it yourself'
                        : 'No GET handler - nothing safe to call from here'
                  }
                  className="shrink-0 rounded-lg border border-[#f5a623]/40 bg-[#f5a623]/10 px-4 py-2 text-sm font-medium text-[#f5a623] transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-gray-600 sm:ml-4"
                >
                  {pending === r.path ? 'calling...' : 'Test GET'}
                </button>
              </div>

              {result && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-mono font-semibold ${statusTone(result.status)}`}>
                      {result.status ?? 'no response'}
                    </span>
                    <span className="text-gray-500">{result.ms}ms</span>
                  </div>
                  {result.error && <p className="mt-1 text-sm text-red-400">{result.error}</p>}
                  {result.body && (
                    <pre className="mt-2 max-h-56 overflow-auto rounded bg-black/40 p-2 font-mono text-xs text-gray-300">
                      {result.body}
                    </pre>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="mx-auto mt-8 max-w-5xl text-center text-gray-500">
          Nothing matches. That is worth knowing too - it may be the thing to build.
        </p>
      )}
    </div>
  );
}
