# Admin Dashboard Upgrades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 missing admin features: audit log viewer, onboarding funnel, dormant member alerts, bulk operations, CSV export, health snapshots, quick stats home card, notification broadcast.

**Architecture:** Each feature is an independent component added to AdminPanel.tsx tabs or the Member CRM page. New API routes follow the existing pattern: admin auth check, Zod validation, supabaseAdmin queries, NextResponse.json. All data already exists in Supabase — these are read/display features with minimal writes.

**Tech Stack:** Next.js 16 App Router, Supabase (supabaseAdmin), React 19, Tailwind CSS v4, Zod validation, Neynar API (for broadcast)

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `src/components/admin/AuditLog.tsx` | Audit log viewer tab |
| `src/components/admin/OnboardingFunnel.tsx` | Onboarding funnel visualization |
| `src/components/admin/DormantMembers.tsx` | Inactive member alerts + re-engage |
| `src/components/admin/QuickStats.tsx` | Glanceable pulse card for admin home |
| `src/components/admin/ExportButton.tsx` | CSV/JSON export dropdown |
| `src/app/api/admin/audit-log/route.ts` | GET audit log entries |
| `src/app/api/admin/onboarding-funnel/route.ts` | GET funnel stage counts |
| `src/app/api/admin/dormant/route.ts` | GET dormant members |
| `src/app/api/admin/quick-stats/route.ts` | GET pulse stats |
| `src/app/api/admin/export/route.ts` | GET CSV/JSON export |

### Modified Files
| File | Change |
|------|--------|
| `src/app/(auth)/admin/AdminPanel.tsx` | Add 4 new tabs (Audit, Funnel, Dormant, Stats), add QuickStats above tabs, add ExportButton to header |
| `src/components/admin/UsersTable.tsx` | Add multi-select checkboxes + bulk action bar |

---

## Task 1: Audit Log Viewer

**Files:**
- Create: `src/app/api/admin/audit-log/route.ts`
- Create: `src/components/admin/AuditLog.tsx`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/admin/audit-log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.string().optional(),
  actorFid: z.coerce.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
    action: searchParams.get('action') ?? undefined,
    actorFid: searchParams.get('actorFid') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const { limit, offset, action, actorFid } = parsed.data;

  try {
    let query = supabaseAdmin
      .from('security_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (actorFid) query = query.eq('actor_fid', actorFid);

    const { data, count, error } = await query;
    if (error) throw error;

    // Get distinct actions for filter dropdown
    const { data: actions } = await supabaseAdmin
      .from('security_audit_log')
      .select('action')
      .limit(100);
    const uniqueActions = [...new Set((actions || []).map(a => a.action))].sort();

    return NextResponse.json({ entries: data ?? [], total: count ?? 0, actions: uniqueActions });
  } catch (err) {
    console.error('Audit log error:', err);
    return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the AuditLog component**

```typescript
// src/components/admin/AuditLog.tsx
'use client';

import { useState, useEffect } from 'react';

interface AuditEntry {
  id: string;
  actor_fid: number;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (actionFilter) params.set('action', actionFilter);

    fetch(`/api/admin/audit-log?${params}`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries || []);
        setTotal(d.total || 0);
        if (d.actions) setActions(d.actions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-500/10 text-green-400',
    update: 'bg-blue-500/10 text-blue-400',
    delete: 'bg-red-500/10 text-red-400',
    login: 'bg-purple-500/10 text-purple-400',
  };

  const getColor = (action: string) => {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
      if (action.toLowerCase().includes(key)) return color;
    }
    return 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Filter + pagination */}
      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All actions ({total})</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">{total} entries</span>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs text-gray-400 disabled:opacity-30">Prev</button>
        <span className="text-xs text-gray-500">Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total} className="text-xs text-gray-400 disabled:opacity-30">Next</button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#0d1b2a] rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-1">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-2.5 bg-[#0d1b2a] rounded-lg border border-gray-800/50">
              <span className="text-[10px] text-gray-600 w-32 flex-shrink-0 tabular-nums pt-0.5">
                {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${getColor(entry.action)}`}>
                {entry.action}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-300">{entry.target_type}</span>
                {entry.target_id && <span className="text-[10px] text-gray-600 ml-1">#{entry.target_id}</span>}
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <p className="text-[10px] text-gray-600 truncate mt-0.5">{JSON.stringify(entry.details)}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-700 flex-shrink-0">FID {entry.actor_fid}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add Audit tab to AdminPanel**

In `src/app/(auth)/admin/AdminPanel.tsx`:
1. Add dynamic import: `const AuditLog = dynamic(() => import('@/components/admin/AuditLog').then(m => ({ default: m.AuditLog })), { ssr: false });`
2. Add to Tab type: `'audit'`
3. Add to tabs array: `{ id: 'audit', label: 'Audit Log', icon: '📋' }`
4. Add render: `{activeTab === 'audit' && <AuditLog />}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/audit-log/route.ts src/components/admin/AuditLog.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add audit log viewer to admin dashboard"
```

---

## Task 2: Quick Stats Home Card

**Files:**
- Create: `src/app/api/admin/quick-stats/route.ts`
- Create: `src/components/admin/QuickStats.tsx`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/admin/quick-stats/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [
      totalMembersR, activeMembersR, withFidR,
      totalSessionsR, recentSessionsR,
      totalRespectR, recentActionsR,
      dormant30R,
    ] = await Promise.all([
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).gt('fractal_count', 0),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).not('fid', 'is', null),
      supabaseAdmin.from('fractal_sessions').select('id', { count: 'exact' }),
      supabaseAdmin.from('fractal_sessions').select('id', { count: 'exact' }).gte('session_date', weekAgo.split('T')[0]),
      supabaseAdmin.from('respect_members').select('total_respect'),
      supabaseAdmin.from('security_audit_log').select('id', { count: 'exact' }).gte('created_at', weekAgo),
      supabaseAdmin.from('users').select('id', { count: 'exact' }).lt('last_active_at', monthAgo).eq('is_active', true),
    ]);

    const totalRespect = (totalRespectR.data || []).reduce((s, m) => s + Number(m.total_respect), 0);

    return NextResponse.json({
      totalMembers: totalMembersR.count || 0,
      activeMembers: activeMembersR.count || 0,
      withFid: withFidR.count || 0,
      totalSessions: totalSessionsR.count || 0,
      sessionsThisWeek: recentSessionsR.count || 0,
      totalRespect,
      adminActionsThisWeek: recentActionsR.count || 0,
      dormant30: dormant30R.count || 0,
    });
  } catch (err) {
    console.error('Quick stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the QuickStats component**

```typescript
// src/components/admin/QuickStats.tsx
'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  withFid: number;
  totalSessions: number;
  sessionsThisWeek: number;
  totalRespect: number;
  adminActionsThisWeek: number;
  dormant30: number;
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/quick-stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return null;

  const cards = [
    { label: 'Members', value: stats.totalMembers, sub: `${stats.activeMembers} active`, color: 'text-white' },
    { label: 'With FID', value: stats.withFid, sub: `${stats.totalMembers - stats.withFid} missing`, color: stats.withFid > stats.totalMembers / 2 ? 'text-green-400' : 'text-yellow-400' },
    { label: 'Sessions', value: stats.totalSessions, sub: `${stats.sessionsThisWeek} this week`, color: 'text-[#f5a623]' },
    { label: 'Total Respect', value: stats.totalRespect.toLocaleString(), sub: 'all sources', color: 'text-[#f5a623]' },
    { label: 'Dormant (30d)', value: stats.dormant30, sub: 'need re-engage', color: stats.dormant30 > 10 ? 'text-red-400' : 'text-gray-400' },
    { label: 'Admin Actions', value: stats.adminActionsThisWeek, sub: 'this week', color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
      {cards.map(c => (
        <div key={c.label} className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800/50">
          <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
          <p className="text-[10px] text-gray-600">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add QuickStats above tabs in AdminPanel**

In `AdminPanel.tsx`, import QuickStats and render it inside the `max-w-5xl` container, above the tab content:
```typescript
const QuickStats = dynamic(() => import('@/components/admin/QuickStats').then(m => ({ default: m.QuickStats })), { ssr: false });
// Then inside the component, before the tab content div:
<QuickStats />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/quick-stats/route.ts src/components/admin/QuickStats.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add quick stats pulse card to admin dashboard"
```

---

## Task 3: Onboarding Funnel

**Files:**
- Create: `src/app/api/admin/onboarding-funnel/route.ts`
- Create: `src/components/admin/OnboardingFunnel.tsx`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/admin/onboarding-funnel/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const [allowlistR, usersR, withFidR, withRespectR, activeR, respectMembersR] = await Promise.all([
      supabaseAdmin.from('allowlist').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('users').select('id', { count: 'exact' }).not('fid', 'is', null).eq('is_active', true),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).gt('total_respect', 0),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).gt('fractal_count', 0),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }),
    ]);

    const stages = [
      { stage: 'Allowlisted', count: allowlistR.count || 0, description: 'Invited to the community' },
      { stage: 'Wallet Connected', count: usersR.count || 0, description: 'Connected wallet + logged in' },
      { stage: 'FID Linked', count: withFidR.count || 0, description: 'Has Farcaster account' },
      { stage: 'In Respect DB', count: respectMembersR.count || 0, description: 'Appears in respect system' },
      { stage: 'Attended Fractal', count: activeR.count || 0, description: 'Attended at least 1 fractal' },
      { stage: 'Earned Respect', count: withRespectR.count || 0, description: 'Has respect > 0' },
    ];

    return NextResponse.json({ stages });
  } catch (err) {
    console.error('Onboarding funnel error:', err);
    return NextResponse.json({ error: 'Failed to load funnel' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the OnboardingFunnel component**

```typescript
// src/components/admin/OnboardingFunnel.tsx
'use client';

import { useState, useEffect } from 'react';

interface Stage {
  stage: string;
  count: number;
  description: string;
}

export function OnboardingFunnel() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/onboarding-funnel')
      .then(r => r.json())
      .then(d => setStages(d.stages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />)}</div>;

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Member journey from invite to active contributor. Drop-offs show where people get stuck.</p>

      <div className="space-y-2">
        {stages.map((stage, i) => {
          const prev = i > 0 ? stages[i - 1].count : stage.count;
          const dropoff = prev > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;
          const widthPct = (stage.count / maxCount) * 100;

          return (
            <div key={stage.stage}>
              {i > 0 && dropoff > 0 && (
                <div className="flex items-center gap-2 py-1 pl-4">
                  <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-[10px] text-red-400">-{dropoff}% ({prev - stage.count} dropped)</span>
                </div>
              )}
              <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{stage.stage}</p>
                    <p className="text-[10px] text-gray-600">{stage.description}</p>
                  </div>
                  <p className="text-xl font-bold text-[#f5a623]">{stage.count}</p>
                </div>
                <div className="h-2 bg-[#0a1628] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f5a623] rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add Funnel tab to AdminPanel**

Same pattern as Task 1 Step 3: dynamic import, add to type/tabs/render.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/onboarding-funnel/route.ts src/components/admin/OnboardingFunnel.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add onboarding funnel to admin dashboard"
```

---

## Task 4: Dormant Member Alerts

**Files:**
- Create: `src/app/api/admin/dormant/route.ts`
- Create: `src/components/admin/DormantMembers.tsx`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/admin/dormant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ days: searchParams.get('days') ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const cutoff = new Date(Date.now() - parsed.data.days * 86400000).toISOString();

  try {
    // Users who logged in before but haven't been active since cutoff
    const { data: dormant } = await supabaseAdmin
      .from('users')
      .select('id, fid, username, display_name, pfp_url, primary_wallet, last_active_at, last_login_at, respect_member_id')
      .eq('is_active', true)
      .not('last_active_at', 'is', null)
      .lt('last_active_at', cutoff)
      .order('last_active_at', { ascending: true })
      .limit(100);

    // Enrich with respect data
    const enriched = [];
    for (const u of dormant || []) {
      let respect = null;
      if (u.respect_member_id) {
        const { data: rm } = await supabaseAdmin
          .from('respect_members')
          .select('total_respect, fractal_count')
          .eq('id', u.respect_member_id)
          .single();
        respect = rm;
      }
      enriched.push({
        ...u,
        totalRespect: respect?.total_respect || 0,
        fractalCount: respect?.fractal_count || 0,
        daysSinceActive: Math.floor((Date.now() - new Date(u.last_active_at).getTime()) / 86400000),
      });
    }

    // Sort by respect (highest respect dormant members are most concerning)
    enriched.sort((a, b) => b.totalRespect - a.totalRespect);

    return NextResponse.json({
      dormant: enriched,
      total: enriched.length,
      cutoffDays: parsed.data.days,
    });
  } catch (err) {
    console.error('Dormant members error:', err);
    return NextResponse.json({ error: 'Failed to load dormant members' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the DormantMembers component**

```typescript
// src/components/admin/DormantMembers.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DormantUser {
  id: string;
  fid: number | null;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  last_active_at: string;
  totalRespect: number;
  fractalCount: number;
  daysSinceActive: number;
}

export function DormantMembers() {
  const [members, setMembers] = useState<DormantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dormant?days=${days}`)
      .then(r => r.json())
      .then(d => setMembers(d.dormant || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 flex-1">Members who haven&apos;t been active — highest respect first (most valuable to re-engage).</p>
        <div className="flex gap-1">
          {[30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                days === d ? 'bg-red-500/20 text-red-400' : 'bg-[#0d1b2a] text-gray-500 hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#0d1b2a] rounded-xl animate-pulse" />)}</div>
      ) : members.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No dormant members in the last {days} days.</p>
      ) : (
        <div className="space-y-1">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-[#0d1b2a] rounded-xl border border-gray-800/50">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {m.pfp_url ? (
                  <Image src={m.pfp_url} alt="" fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                    {(m.display_name || m.username || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{m.display_name || m.username || 'Unknown'}</p>
                <p className="text-[10px] text-gray-600">
                  {m.fractalCount} fractals · {m.totalRespect} respect · last seen {m.daysSinceActive}d ago
                </p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                m.daysSinceActive > 90 ? 'bg-red-500/10 text-red-400' :
                m.daysSinceActive > 60 ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {m.daysSinceActive}d
              </span>
              {m.username && (
                <a
                  href={`https://farcaster.xyz/${m.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-500/10"
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
```

- [ ] **Step 3: Add Dormant tab to AdminPanel** (same pattern)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/dormant/route.ts src/components/admin/DormantMembers.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add dormant member alerts to admin dashboard"
```

---

## Task 5: CSV/JSON Export

**Files:**
- Create: `src/app/api/admin/export/route.ts`
- Create: `src/components/admin/ExportButton.tsx`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  type: z.enum(['members', 'respect', 'sessions']),
  format: z.enum(['csv', 'json']).default('csv'),
});

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get('type'),
    format: searchParams.get('format') ?? 'csv',
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const { type, format } = parsed.data;

  try {
    let data: Record<string, unknown>[] = [];

    if (type === 'members') {
      const { data: members } = await supabaseAdmin
        .from('respect_members')
        .select('name, wallet_address, fid, total_respect, fractal_respect, fractal_count, onchain_og, onchain_zor, hosting_respect, bonus_respect, event_respect, first_respect_at')
        .order('total_respect', { ascending: false });
      data = members || [];
    } else if (type === 'respect') {
      const { data: scores } = await supabaseAdmin
        .from('fractal_scores')
        .select('member_name, wallet_address, rank, score, session_id, fractal_sessions(name, session_date)')
        .order('created_at', { ascending: false })
        .limit(5000);
      data = (scores || []).map(s => {
        const sess = Array.isArray(s.fractal_sessions) ? s.fractal_sessions[0] : s.fractal_sessions;
        return {
          member_name: s.member_name,
          wallet_address: s.wallet_address,
          rank: s.rank,
          score: s.score,
          session_name: (sess as Record<string, unknown>)?.name || '',
          session_date: (sess as Record<string, unknown>)?.session_date || '',
        };
      });
    } else if (type === 'sessions') {
      const { data: sessions } = await supabaseAdmin
        .from('fractal_sessions')
        .select('name, session_date, scoring_era, participant_count, notes')
        .order('session_date', { ascending: false });
      data = sessions || [];
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="zao-${type}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV
    if (data.length === 0) return new NextResponse('', { headers: { 'Content-Type': 'text/csv' } });
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="zao-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the ExportButton component**

```typescript
// src/components/admin/ExportButton.tsx
'use client';

import { useState } from 'react';

export function ExportButton() {
  const [open, setOpen] = useState(false);

  const doExport = (type: string, format: string) => {
    window.open(`/api/admin/export?type=${type}&format=${format}`, '_blank');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#0d1b2a] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px]">
            <p className="px-3 py-1 text-[10px] text-gray-600 uppercase">CSV</p>
            <button onClick={() => doExport('members', 'csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Members</button>
            <button onClick={() => doExport('respect', 'csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Fractal Scores</button>
            <button onClick={() => doExport('sessions', 'csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Sessions</button>
            <div className="border-t border-gray-800 my-1" />
            <p className="px-3 py-1 text-[10px] text-gray-600 uppercase">JSON</p>
            <button onClick={() => doExport('members', 'json')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Members</button>
            <button onClick={() => doExport('respect', 'json')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Fractal Scores</button>
            <button onClick={() => doExport('sessions', 'json')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">Sessions</button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add ExportButton to AdminPanel header** (next to ImportRespectButton)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/export/route.ts src/components/admin/ExportButton.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add CSV/JSON export to admin dashboard"
```

---

## Task 6: Bulk Operations on UsersTable

**Files:**
- Modify: `src/components/admin/UsersTable.tsx`

- [ ] **Step 1: Read current UsersTable.tsx** to understand the structure

- [ ] **Step 2: Add multi-select state and checkbox column**

Add to component state:
```typescript
const [selected, setSelected] = useState<Set<string>>(new Set());
const toggleSelect = (id: string) => setSelected(prev => {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
});
const toggleAll = () => setSelected(prev =>
  prev.size === filteredUsers.length ? new Set() : new Set(filteredUsers.map(u => u.id))
);
```

Add checkbox to each row and a "select all" in the header.

- [ ] **Step 3: Add bulk action bar**

When `selected.size > 0`, show a sticky bar at the bottom:
```tsx
{selected.size > 0 && (
  <div className="sticky bottom-0 bg-[#0d1b2a] border-t border-gray-700 p-3 flex items-center gap-3">
    <span className="text-xs text-gray-400">{selected.size} selected</span>
    <button onClick={() => bulkAction('member')} className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400">Set Role: Member</button>
    <button onClick={() => bulkAction('assign-zid')} className="text-xs px-3 py-1.5 rounded bg-[#f5a623]/10 text-[#f5a623]">Assign ZIDs</button>
    <button onClick={() => bulkAction('deactivate')} className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400">Deactivate</button>
    <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 ml-auto">Clear</button>
  </div>
)}
```

- [ ] **Step 4: Implement bulkAction function**

```typescript
const bulkAction = async (action: string) => {
  const ids = [...selected];
  if (action === 'deactivate' && !confirm(`Deactivate ${ids.length} users?`)) return;

  for (const id of ids) {
    if (action === 'member') {
      await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role: 'member' }) });
    } else if (action === 'assign-zid') {
      await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, assign_zid: true }) });
    } else if (action === 'deactivate') {
      await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    }
  }
  setSelected(new Set());
  // Refetch users list
};
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/UsersTable.tsx
git commit -m "feat: add bulk operations (multi-select) to admin users table"
```

---

## Task 7: Health Check Snapshots (Cron)

**Files:**
- Create: `src/app/api/cron/health-snapshot/route.ts`
- Modify: `vercel.json` (add cron entry)

- [ ] **Step 1: Create the cron route**

```typescript
// src/app/api/cron/health-snapshot/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Weekly cron: snapshot admin health stats for trend tracking.
 * Stores in a `health_snapshots` table (create if not exists via Supabase SQL editor).
 */
export async function GET() {
  try {
    const [totalR, activeR, withFidR, respectR, sessionsR] = await Promise.all([
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).gt('fractal_count', 0),
      supabaseAdmin.from('respect_members').select('id', { count: 'exact' }).not('fid', 'is', null),
      supabaseAdmin.from('respect_members').select('total_respect'),
      supabaseAdmin.from('fractal_sessions').select('id', { count: 'exact' }),
    ]);

    const totalRespect = (respectR.data || []).reduce((s, m) => s + Number(m.total_respect), 0);

    await supabaseAdmin.from('health_snapshots').insert({
      total_members: totalR.count || 0,
      active_members: activeR.count || 0,
      with_fid: withFidR.count || 0,
      total_sessions: sessionsR.count || 0,
      total_respect: totalRespect,
      snapshot_date: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Health snapshot error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add cron to vercel.json**

Add to the `crons` array:
```json
{
  "path": "/api/cron/health-snapshot",
  "schedule": "0 0 * * 0"
}
```
(Runs every Sunday at midnight UTC)

- [ ] **Step 3: Create the health_snapshots table**

Run this SQL in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  with_fid INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_respect DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_date ON health_snapshots(snapshot_date DESC);
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/health-snapshot/route.ts vercel.json
git commit -m "feat: add weekly health snapshot cron for trend tracking"
```

---

## Task 8: Notification Broadcast (Admin → Members via Farcaster)

**Files:**
- Create: `src/app/api/admin/broadcast/route.ts`
- Modify: `src/app/(auth)/admin/AdminPanel.tsx` (add simple broadcast UI inline in header or as a tab)

- [ ] **Step 1: Create the broadcast API route**

```typescript
// src/app/api/admin/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';

const castSchema = z.object({
  text: z.string().min(1).max(1024),
  channel: z.string().default('zao'),
});

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await req.json();
  const parsed = castSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const { text, channel } = parsed.data;
  const signerUuid = process.env.NEYNAR_SIGNER_UUID;
  if (!signerUuid) return NextResponse.json({ error: 'Signer not configured' }, { status: 500 });

  try {
    // Cast to channel via Neynar
    const res = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        api_key: process.env.NEYNAR_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text,
        channel_id: channel,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Broadcast cast failed:', err);
      return NextResponse.json({ error: 'Failed to cast' }, { status: 500 });
    }

    const data = await res.json();

    await logAuditEvent({
      actorFid: session.fid!,
      action: 'broadcast',
      targetType: 'channel',
      targetId: channel,
      details: { text: text.slice(0, 100), castHash: data.cast?.hash },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, hash: data.cast?.hash });
  } catch (err) {
    console.error('Broadcast error:', err);
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add broadcast button to AdminPanel header**

Add a simple "Broadcast" button next to the existing buttons in the header that opens a textarea modal. When submitted, POSTs to `/api/admin/broadcast`.

```typescript
// Add to AdminPanel state
const [broadcastOpen, setBroadcastOpen] = useState(false);
const [broadcastText, setBroadcastText] = useState('');
const [broadcasting, setBroadcasting] = useState(false);

// Add button in rightAction
<button onClick={() => setBroadcastOpen(true)} className="text-sm text-gray-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
  Broadcast
</button>

// Add modal at bottom of component
{broadcastOpen && (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="bg-[#0d1b2a] rounded-xl p-6 w-full max-w-md border border-gray-700">
      <h3 className="text-sm font-semibold text-white mb-3">Cast to /zao channel</h3>
      <textarea
        value={broadcastText}
        onChange={e => setBroadcastText(e.target.value)}
        placeholder="Write your announcement..."
        className="w-full bg-[#0a1628] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none h-32"
        maxLength={1024}
      />
      <p className="text-[10px] text-gray-600 mt-1">{broadcastText.length}/1024</p>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setBroadcastOpen(false)} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg">Cancel</button>
        <button
          onClick={async () => {
            setBroadcasting(true);
            await fetch('/api/admin/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: broadcastText }) });
            setBroadcasting(false);
            setBroadcastOpen(false);
            setBroadcastText('');
          }}
          disabled={broadcasting || !broadcastText.trim()}
          className="flex-1 py-2 text-sm text-black bg-[#f5a623] rounded-lg font-medium disabled:opacity-50"
        >
          {broadcasting ? 'Casting...' : 'Cast'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/broadcast/route.ts src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat: add broadcast cast to admin dashboard"
```

---

## Final: Wire All Tabs into AdminPanel

- [ ] **Step 1: Update AdminPanel.tsx with all new tabs and imports**

Final tab type should be:
```typescript
type Tab = 'users' | 'zid' | 'members' | 'import' | 'moderation' | 'respect' | 'polls' | 'discord' | 'engagement' | 'audit' | 'funnel' | 'dormant';
```

Final tabs array should add:
```typescript
{ id: 'audit', label: 'Audit', icon: '📋' },
{ id: 'funnel', label: 'Funnel', icon: '📈' },
{ id: 'dormant', label: 'Dormant', icon: '💤' },
```

QuickStats renders above the tabs. ExportButton goes in the header next to ImportRespectButton.

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete admin dashboard upgrades — 8 new features"
git push
```
