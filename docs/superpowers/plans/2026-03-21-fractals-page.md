# Fractals Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/fractals` page as the primary governance hub for ZAO OS, with tabs for Sessions, Leaderboard, Proposals, and About — integrating existing fractal session data with a link to ORDAO proposals on frapps.xyz.

**Architecture:** New `/fractals` route as a server page with a tabbed client component. Sessions and leaderboard tabs consume existing Supabase data via new/existing API routes. Proposals tab reads from the ornode off-chain API (no orclient SDK needed for Phase 1) and links out to `of.frapps.xyz`. Nav updated to surface Fractals as the primary governance entry point.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Supabase (existing tables), `fetch` for ornode API reads, viem (existing) for on-chain balance display.

---

## File Map

**Create:**
- `src/app/(auth)/fractals/page.tsx` — server component, auth check, renders client shell
- `src/app/(auth)/fractals/FractalsClient.tsx` — client component with tab state
- `src/app/(auth)/fractals/SessionsTab.tsx` — fractal session history list
- `src/app/(auth)/fractals/FractalLeaderboardTab.tsx` — fractal-sorted leaderboard
- `src/app/(auth)/fractals/ProposalsTab.tsx` — ORDAO proposals via ornode + link to frapps
- `src/app/(auth)/fractals/AboutTab.tsx` — explainer, Fibonacci table, frapps link
- `src/app/api/fractals/sessions/route.ts` — GET: list sessions + scores from Supabase
- `src/app/api/fractals/proposals/route.ts` — GET: fetch proposals from ornode API

**Modify:**
- `src/components/navigation/BottomNav.tsx` — add `/fractals` to Governance matchPaths + update href
- `src/app/(auth)/respect/page.tsx` — add a "View Full Fractals Hub" link back to /fractals

---

## Task 1: Sessions API Route

**Files:**
- Create: `src/app/api/fractals/sessions/route.ts`

Returns paginated fractal sessions with their scores from the existing `fractal_sessions` and `fractal_scores` tables.

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/fractals/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
  }
  const { limit, offset } = parsed.data;

  try {
    const { data: sessions, error, count } = await supabaseAdmin
      .from('fractal_sessions')
      .select(`
        id,
        session_date,
        name,
        host_name,
        scoring_era,
        participant_count,
        notes,
        created_at,
        fractal_scores (
          id,
          member_name,
          wallet_address,
          rank,
          score
        )
      `, { count: 'exact' })
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ sessions: sessions ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('Fractal sessions error:', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route starts up without error**

Run: `npm run dev` — check for TypeScript errors in terminal output.
Expected: No compile errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/fractals/sessions/route.ts
git commit -m "feat(fractals): add GET /api/fractals/sessions route"
```

---

## Task 2: Proposals API Route

**Files:**
- Create: `src/app/api/fractals/proposals/route.ts`

Fetches ORDAO proposals from the ornode off-chain API. Gracefully returns empty if ornode is unreachable.

- [ ] **Step 1: Create the proposals route**

```typescript
// src/app/api/fractals/proposals/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

const ORNODE_URL = 'https://ornode2.frapps.xyz';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${ORNODE_URL}/proposals?limit=20`, {
      next: { revalidate: 60 }, // cache 60s
    });

    if (!res.ok) {
      // ornode may be down — return empty gracefully
      return NextResponse.json({ proposals: [], total: 0, source: 'unavailable' });
    }

    const data = await res.json();
    // ornode returns array or { proposals: [] }
    const proposals = Array.isArray(data) ? data : (data.proposals ?? []);

    return NextResponse.json({ proposals, total: proposals.length, source: 'ornode' });
  } catch {
    // Non-critical: proposals tab will show "view on frapps.xyz" fallback
    return NextResponse.json({ proposals: [], total: 0, source: 'unavailable' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/fractals/proposals/route.ts
git commit -m "feat(fractals): add GET /api/fractals/proposals route (ornode proxy)"
```

---

## Task 3: Page Shell + Tab Layout

**Files:**
- Create: `src/app/(auth)/fractals/page.tsx`
- Create: `src/app/(auth)/fractals/FractalsClient.tsx`

The server page checks auth and renders the client shell. The client shell owns tab state.

- [ ] **Step 1: Create the server page**

```typescript
// src/app/(auth)/fractals/page.tsx
import { getSessionData } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { FractalsClient } from './FractalsClient';

export const metadata = { title: 'Fractals — ZAO OS' };

export default async function FractalsPage() {
  const session = await getSessionData();
  if (!session) redirect('/');
  const { fid, isAdmin } = session;

  return <FractalsClient currentFid={fid ?? 0} isAdmin={isAdmin ?? false} />;
}
```

- [ ] **Step 2: Create the client shell with tabs**

```typescript
// src/app/(auth)/fractals/FractalsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SessionsTab } from './SessionsTab';
import { FractalLeaderboardTab } from './FractalLeaderboardTab';
import { ProposalsTab } from './ProposalsTab';
import { AboutTab } from './AboutTab';

type Tab = 'sessions' | 'leaderboard' | 'proposals' | 'about';

interface Props {
  currentFid: number;
  isAdmin: boolean;
}

export function FractalsClient({ currentFid, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <Link href="/chat" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="font-semibold text-sm text-white">Fractal Governance</h2>
          <p className="text-[10px] text-gray-500">ZAO Respect Game</p>
        </div>
        <a
          href="https://zao.frapps.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] transition-colors border border-[#f5a623]/20 rounded px-2 py-1"
        >
          frapps.xyz
        </a>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-800 bg-[#0d1b2a]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'sessions' && <SessionsTab isAdmin={isAdmin} />}
        {activeTab === 'leaderboard' && <FractalLeaderboardTab currentFid={currentFid} />}
        {activeTab === 'proposals' && <ProposalsTab />}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/fractals/page.tsx src/app/(auth)/fractals/FractalsClient.tsx
git commit -m "feat(fractals): add /fractals page shell with tab layout"
```

---

## Task 4: Sessions Tab

**Files:**
- Create: `src/app/(auth)/fractals/SessionsTab.tsx`

Fetches sessions from `/api/fractals/sessions` and renders them as an accordion list. Each session expands to show participant rankings.

- [ ] **Step 1: Create SessionsTab**

```typescript
// src/app/(auth)/fractals/SessionsTab.tsx
'use client';

import { useState, useEffect } from 'react';

interface FractalScore {
  id: string;
  member_name: string;
  wallet_address: string | null;
  rank: number;
  score: number;
}

interface FractalSession {
  id: string;
  session_date: string;
  name: string;
  host_name: string | null;
  scoring_era: string;
  participant_count: number;
  notes: string | null;
  fractal_scores: FractalScore[];
}

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-gray-400', 'text-gray-500', 'text-gray-600'];
const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

interface Props {
  isAdmin: boolean;
}

export function SessionsTab({ isAdmin }: Props) {
  const [sessions, setSessions] = useState<FractalSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fractals/sessions?limit=20')
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🌀</p>
        <p className="text-gray-400 text-sm">No fractal sessions recorded yet.</p>
        {isAdmin && (
          <p className="text-xs text-gray-600 mt-2">Admins can record sessions via the admin panel.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {/* Stats bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">{total}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sessions</p>
        </div>
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">
            {sessions.reduce((sum, s) => sum + s.participant_count, 0)}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Participations</p>
        </div>
      </div>

      {/* Session list */}
      {sessions.map((session) => {
        const isExpanded = expanded === session.id;
        const sorted = [...session.fractal_scores].sort((a, b) => a.rank - b.rank);

        return (
          <div key={session.id} className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : session.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {session.host_name && ` · Host: ${session.host_name}`}
                  {' · '}
                  <span className="text-[#f5a623]/70">{session.scoring_era} era</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{session.participant_count} members</span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && sorted.length > 0 && (
              <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                {sorted.map((score) => (
                  <div key={score.id} className="flex items-center gap-3">
                    <span className={`w-8 text-xs font-bold ${RANK_COLORS[score.rank - 1] ?? 'text-gray-500'}`}>
                      {RANK_LABELS[score.rank - 1] ?? `#${score.rank}`}
                    </span>
                    <span className="flex-1 text-sm text-gray-200 truncate">{score.member_name}</span>
                    <span className="text-xs font-mono text-[#f5a623]">{score.score} R</span>
                  </div>
                ))}
                {session.notes && (
                  <p className="text-xs text-gray-600 pt-1 border-t border-gray-800 mt-2">{session.notes}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/fractals/SessionsTab.tsx
git commit -m "feat(fractals): add SessionsTab with accordion session history"
```

---

## Task 5: Fractal Leaderboard Tab

**Files:**
- Create: `src/app/(auth)/fractals/FractalLeaderboardTab.tsx`

Reuses the existing `/api/respect/leaderboard` data, sorted by `fractalRespect` descending, showing fractal-specific columns.

- [ ] **Step 1: Create FractalLeaderboardTab**

```typescript
// src/app/(auth)/fractals/FractalLeaderboardTab.tsx
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
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-gray-400 text-sm">No fractal respect earned yet.</p>
      </div>
    );
  }

  const MEDAL = ['🥇', '🥈', '🥉'];

  return (
    <div className="pt-2">
      {/* Stats */}
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

      {/* Table */}
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
              <span className="w-7 text-center text-sm">
                {MEDAL[entry.rank - 1] ?? <span className="text-xs text-gray-500">#{entry.rank}</span>}
              </span>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/fractals/FractalLeaderboardTab.tsx
git commit -m "feat(fractals): add FractalLeaderboardTab sorted by fractal Respect"
```

---

## Task 6: Proposals Tab

**Files:**
- Create: `src/app/(auth)/fractals/ProposalsTab.tsx`

Shows ORDAO proposals from ornode (if available). Always shows a prominent link to `of.frapps.xyz` for full interaction. Gracefully handles ornode being unavailable.

- [ ] **Step 1: Create ProposalsTab**

```typescript
// src/app/(auth)/fractals/ProposalsTab.tsx
'use client';

import { useState, useEffect } from 'react';

interface Proposal {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  proposer?: string;
  createTime?: number;
  voteCount?: number;
}

export function ProposalsTab() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [source, setSource] = useState<'ornode' | 'unavailable' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fractals/proposals')
      .then((r) => r.json())
      .then((d) => {
        setProposals(d.proposals ?? []);
        setSource(d.source);
      })
      .catch(() => setSource('unavailable'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    executed: 'text-blue-400 bg-blue-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
  };

  return (
    <div className="pt-2 space-y-4">
      {/* Primary link to ORDAO UI */}
      <a
        href="https://of.frapps.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-xl px-4 py-3 hover:bg-[#f5a623]/20 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-[#f5a623]">ORDAO Governance</p>
          <p className="text-xs text-gray-400">Create proposals, vote, view results</p>
        </div>
        <svg className="w-5 h-5 text-[#f5a623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* OREC contract info */}
      <div className="bg-[#0d1b2a] rounded-xl p-3 space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">On-Chain Contracts (Optimism)</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">OREC</span>
          <a
            href="https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
          >
            0xcB05...e532
          </a>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">ZOR (Respect1155)</span>
          <a
            href="https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
          >
            0x9885...45c
          </a>
        </div>
      </div>

      {/* Proposals from ornode */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && source === 'unavailable' && (
        <div className="text-center py-6 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-500 text-sm">Proposal data unavailable right now.</p>
          <p className="text-xs text-gray-600 mt-1">View proposals directly on ORDAO above.</p>
        </div>
      )}

      {!loading && source === 'ornode' && proposals.length === 0 && (
        <div className="text-center py-6 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-400 text-sm">No active proposals.</p>
          <p className="text-xs text-gray-600 mt-1">Create one on ORDAO above.</p>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Recent Proposals</p>
          {proposals.map((p) => {
            const statusKey = (p.status ?? '').toLowerCase();
            const colorClass = STATUS_COLORS[statusKey] ?? 'text-gray-400 bg-gray-400/10';
            return (
              <div key={p.id} className="bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white flex-1 line-clamp-2">
                    {p.title || p.description || `Proposal ${p.id}`}
                  </p>
                  {p.status && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                      {p.status}
                    </span>
                  )}
                </div>
                {p.createTime && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(p.createTime * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/fractals/ProposalsTab.tsx
git commit -m "feat(fractals): add ProposalsTab with ornode proxy + ORDAO deep link"
```

---

## Task 7: About Tab

**Files:**
- Create: `src/app/(auth)/fractals/AboutTab.tsx`

Static content: what the Respect Game is, Fibonacci scoring table, links to frapps and resources.

- [ ] **Step 1: Create AboutTab**

```typescript
// src/app/(auth)/fractals/AboutTab.tsx
'use client';

export function AboutTab() {
  const FIBONACCI = [
    { rank: '1st', x1: 55, x2: 110 },
    { rank: '2nd', x1: 34, x2: 68 },
    { rank: '3rd', x1: 21, x2: 42 },
    { rank: '4th', x1: 13, x2: 26 },
    { rank: '5th', x1: 8, x2: 16 },
    { rank: '6th', x1: 5, x2: 10 },
  ];

  const LINKS = [
    { label: 'zao.frapps.xyz', href: 'https://zao.frapps.xyz', desc: 'ZAO fractal app' },
    { label: 'of.frapps.xyz', href: 'https://of.frapps.xyz', desc: 'ORDAO governance UI' },
    { label: 'Optimystics', href: 'https://optimystics.io', desc: 'Fractal governance toolkit' },
    { label: 'ORDAO Docs', href: 'https://optimystics.io/ordao', desc: 'How ORDAO works' },
    { label: 'The Respect Game', href: 'https://optimystics.io/introducing-the-respect-game', desc: 'Learn the fundamentals' },
  ];

  return (
    <div className="pt-2 space-y-6">
      {/* What is it */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">What is the Respect Game?</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          ZAO runs weekly fractal governance sessions where members split into groups of 3-6. Each person
          shares recent contributions for ~4 minutes. The group then ranks contributions by consensus (2/3+
          agreement required). Rankings earn Respect tokens on Optimism — permanently on-chain.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Respect is non-transferable. It reflects real community contribution over time, and gates
          governance rights via ORDAO.
        </p>
      </div>

      {/* Fibonacci table */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Fibonacci Scoring</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left pb-2">Rank</th>
              <th className="text-right pb-2">1x Era</th>
              <th className="text-right pb-2">2x Era</th>
            </tr>
          </thead>
          <tbody>
            {FIBONACCI.map((row) => (
              <tr key={row.rank} className="border-b border-gray-800/50">
                <td className="py-1.5 text-gray-300">{row.rank}</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x1} R</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x2} R</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-3">
          Scores follow Fibonacci sequence — each rank earns ~60% more than the next (Weber Law).
          ZAO is currently in the 2x era.
        </p>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Resources</p>
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
          >
            <div>
              <p className="text-sm text-white">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/fractals/AboutTab.tsx
git commit -m "feat(fractals): add AboutTab with Fibonacci table and resource links"
```

---

## Task 8: Update Navigation

**Files:**
- Modify: `src/components/navigation/BottomNav.tsx`

Update the Governance tab to link to `/fractals` as the primary destination. Keep `/governance` and `/respect` in matchPaths so those routes still highlight this tab.

- [ ] **Step 1: Update Governance tab in TABS array**

In `src/components/navigation/BottomNav.tsx`, find the entire governance object (including icon — IMPORTANT: you must include the full object with icon in the replacement or the `as const` typed array will fail to compile):

```typescript
  {
    id: 'governance',
    label: 'Governance',
    href: '/governance',
    matchPaths: ['/governance', '/respect'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
```

Replace with (only `label`, `href`, and `matchPaths` change — `id` and `icon` are preserved exactly):

```typescript
  {
    id: 'governance',
    label: 'Fractals',
    href: '/fractals',
    matchPaths: ['/fractals', '/governance', '/respect'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
```

- [ ] **Step 2: Verify the nav change compiles**

Run: `npm run build 2>&1 | tail -20`
Expected: No errors related to BottomNav.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/BottomNav.tsx
git commit -m "feat(fractals): update nav tab to Fractals as primary governance entry"
```

---

## Task 9: Link from Respect Page

**Files:**
- Modify: `src/app/(auth)/respect/page.tsx`

Add a subtle "Fractals Hub" link at the top of the respect page for discoverability.

- [ ] **Step 1: Add link to /fractals**

In `src/app/(auth)/respect/page.tsx`, find:

```typescript
        <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
      </header>
```

Replace with (adds a `flex-1` spacer after `<h2>` to push the new link to the right edge, since `<h2>` was previously the last flex child):

```typescript
        <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
        <div className="flex-1" />
        <Link href="/fractals" className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] transition-colors">
          Fractals Hub
        </Link>
      </header>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/respect/page.tsx
git commit -m "feat(fractals): add Fractals Hub link from respect page"
```

---

## Task 10: Build Check + Final Commit

- [ ] **Step 1: Run full build**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm run build 2>&1 | head -100
```

Expected: `✓ Compiled successfully` with no TypeScript errors. NOTE: Use `head -100` not `tail` — TypeScript errors appear early in build output, not at the end.

- [ ] **Step 2: Fix any type errors**

Common issues:
- Missing `'use client'` on any component using hooks → add at top
- `session.isAdmin` might be `undefined` → use `session.isAdmin ?? false`
- `line-clamp-2` Tailwind class — verify it's available in v4 (use `overflow-hidden` + `max-h` if not)

- [ ] **Step 3: Run lint**

```bash
npm run lint 2>&1 | grep -E "Error|Warning" | head -20
```

Fix any lint errors before final commit.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(fractals): complete /fractals page — sessions, leaderboard, proposals, about tabs"
```

---

## Testing Checklist

After build passes, verify manually:

- [ ] `/fractals` loads without error (not logged in → redirects to `/`)
- [ ] Sessions tab shows sessions or empty state
- [ ] Sessions accordion expands to show participant rankings
- [ ] Leaderboard tab shows members sorted by fractal Respect
- [ ] Proposals tab shows ORDAO link card + contract addresses
- [ ] About tab shows Fibonacci table and links
- [ ] Nav "Fractals" tab highlights when on `/fractals`, `/governance`, or `/respect`
- [ ] `frapps.xyz` button in header opens external link
- [ ] Mobile layout looks correct at 375px width (stack gracefully)
- [ ] No console errors

---

## Out of Scope (Phase 2)

- orclient SDK for on-chain proposal creation/voting (requires wallet sig flow)
- Fractal session scheduling calendar
- Breakout room UI (fork Fractalgram)
- Weekly Respect decay job
- Tier badges (Newcomer / Member / Elder)
