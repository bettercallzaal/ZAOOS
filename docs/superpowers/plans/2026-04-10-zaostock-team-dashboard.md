# ZAO Stock Team Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-gated team dashboard at `/stock/team` where the ZAO Stock crew can track goals, todos, and roles - plus clean up the public `/stock` page.

**Architecture:** Separate iron-session cookie for stock team auth (doesn't interfere with main app auth). Three Supabase tables (team members, goals, todos). Server components for the page shell, client components for interactive pieces. All API routes under `/api/stock/team/`.

**Tech Stack:** Next.js App Router, iron-session, Supabase (direct queries), Zod, bcrypt (via Web Crypto API - no new deps), Tailwind CSS v4

---

## File Structure

**Create:**
- `supabase/migrations/20260410_stock_team_dashboard.sql` - 3 tables + seed data
- `src/lib/auth/stock-team-session.ts` - iron-session config for stock team
- `src/app/api/stock/team/login/route.ts` - POST login
- `src/app/api/stock/team/logout/route.ts` - POST logout
- `src/app/api/stock/team/members/route.ts` - GET members
- `src/app/api/stock/team/goals/route.ts` - GET + PATCH goals
- `src/app/api/stock/team/todos/route.ts` - GET + POST + PATCH todos
- `src/app/stock/team/page.tsx` - server component, checks session, shows login or dashboard
- `src/app/stock/team/LoginForm.tsx` - client component, password form
- `src/app/stock/team/Dashboard.tsx` - client component, main dashboard
- `src/app/stock/team/GoalsBoard.tsx` - client component, goals status board
- `src/app/stock/team/TodoList.tsx` - client component, todo list with CRUD
- `src/app/stock/team/TeamRoles.tsx` - client component, team + roles display
- `scripts/seed-stock-team.ts` - seed team members with passwords

**Modify:**
- `src/app/stock/page.tsx` - remove artist placeholder grid

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260410_stock_team_dashboard.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Stock Team Dashboard tables
-- 3 tables: team members, goals, todos

-- Team members (password auth, not Farcaster)
CREATE TABLE IF NOT EXISTS stock_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals / milestones with status tracking
CREATE TABLE IF NOT EXISTS stock_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tbd' CHECK (status IN ('locked', 'wip', 'tbd')),
  details TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('venue', 'funding', 'artists', 'production', 'logistics', 'marketing', 'general')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todos with ownership and notes
CREATE TABLE IF NOT EXISTS stock_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed goals from the confirmed planning docs
INSERT INTO stock_goals (title, status, details, category, sort_order) VALUES
  ('Date confirmed', 'locked', 'October 3, 2026', 'venue', 1),
  ('Official status', 'locked', 'Part of Art of Ellsworth: Maine Craft Weekend (9th annual, statewide promo)', 'venue', 2),
  ('Venue', 'wip', 'Franklin Street Parklet, rented from Heart of Ellsworth', 'venue', 3),
  ('Weather backup', 'tbd', 'Wallace Events tent rental - not yet contacted', 'logistics', 4),
  ('Steve Peer', 'tbd', 'Local music anchor (37 years in Ellsworth, 430 house concerts) - not yet pitched for co-curation', 'artists', 5),
  ('Funding path', 'tbd', 'New Media Commons / Fractured Atlas 501c3 fiscal sponsorship. Tax-deductible donations. Need to identify specific grant/sponsor targets.', 'funding', 6),
  ('Budget', 'tbd', 'Goal $25K, minimum viable $5K. No money committed yet.', 'funding', 7),
  ('Sound / PA vendor', 'tbd', 'Need local Ellsworth/Bangor vendor. No quotes yet.', 'production', 8),
  ('Contracts', 'tbd', 'Team member agreements - need to define what these look like.', 'logistics', 9),
  ('Local sponsor list', 'tbd', '10-20 businesses in Ellsworth + Bangor area to approach.', 'funding', 10),
  ('Press', 'wip', 'Connection at Ellsworth American (local newspaper).', 'marketing', 11);

-- Enable RLS
ALTER TABLE stock_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_todos ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (all access is server-side via API routes)
CREATE POLICY "Service role full access" ON stock_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_todos FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Run the migration against Supabase**

Run: `npx supabase db push` or apply via Supabase dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260410_stock_team_dashboard.sql
git commit -m "feat(stock): add team dashboard database tables + seed goals"
```

---

### Task 2: Seed Script for Team Members

**Files:**
- Create: `scripts/seed-stock-team.ts`

- [ ] **Step 1: Write the seed script**

This script hashes passwords using Node's built-in crypto (scrypt) and inserts team members. Zaal runs it once and shares passwords via DM.

```typescript
import { createClient } from '@supabase/supabase-js';
import { scryptSync, randomBytes } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars. Run with: npx tsx scripts/seed-stock-team.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const TEAM = [
  { name: 'Zaal', role: 'Curation / Community / Local Logistics', scope: 'Artist lineup, promo, venue, permits, Heart of Ellsworth relationship', password: 'CHANGE_ME_1' },
  { name: 'FailOften', role: 'Technical Build / Funding Structure', scope: 'Installations, visuals, production tech, grant/sponsor paths via NMC/ENTERACT', password: 'CHANGE_ME_2' },
  { name: 'AttaBotty', role: 'Production / Sponsorships / Event-Day Ops', scope: 'On-site production, staging, sound coordination, sponsor outreach', password: 'CHANGE_ME_3' },
  { name: 'DaNici', role: 'TBD', scope: '', password: 'CHANGE_ME_4' },
  { name: 'Hurric4n3Ike', role: 'Live Entertainment', scope: 'WaveWarZ, live performances, DJ sets', password: 'CHANGE_ME_5' },
  { name: 'DCoop', role: 'ZAOVille (DMV)', scope: 'DMV coordination, separate team/venue/artists', password: 'CHANGE_ME_6' },
];

async function seed() {
  console.log('Seeding stock team members...\n');
  console.log('=== SAVE THESE PASSWORDS - SHARE VIA DM ===\n');

  for (const member of TEAM) {
    // Generate a random password if still placeholder
    const password = member.password.startsWith('CHANGE_ME')
      ? randomBytes(4).toString('hex') // 8-char hex password
      : member.password;

    const password_hash = hashPassword(password);

    const { error } = await supabase
      .from('stock_team_members')
      .upsert({ name: member.name, password_hash, role: member.role, scope: member.scope }, { onConflict: 'name' });

    if (error) {
      console.error(`Failed to seed ${member.name}:`, error.message);
    } else {
      console.log(`${member.name}: ${password}`);
    }
  }

  console.log('\n=== DONE ===');
}

seed();
```

- [ ] **Step 2: Run the seed script**

Run: `npx tsx scripts/seed-stock-team.ts`

Save the printed passwords - share them with each team member via DM.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-stock-team.ts
git commit -m "feat(stock): add team member seed script"
```

---

### Task 3: Stock Team Session Auth

**Files:**
- Create: `src/lib/auth/stock-team-session.ts`

- [ ] **Step 1: Write the session module**

```typescript
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { ENV } from '@/lib/env';

export interface StockTeamPayload {
  memberId?: string;
  memberName?: string;
}

const stockTeamSessionOptions = {
  password: ENV.SESSION_SECRET,
  cookieName: 'stock_team_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function getStockTeamSession(): Promise<IronSession<StockTeamPayload>> {
  const cookieStore = await cookies();
  return getIronSession<StockTeamPayload>(cookieStore, stockTeamSessionOptions);
}

export async function getStockTeamMember(): Promise<{ memberId: string; memberName: string } | null> {
  const session = await getStockTeamSession();
  if (!session.memberId || !session.memberName) return null;
  return { memberId: session.memberId, memberName: session.memberName };
}

export async function saveStockTeamSession(memberId: string, memberName: string) {
  const session = await getStockTeamSession();
  session.memberId = memberId;
  session.memberName = memberName;
  await session.save();
}

export async function clearStockTeamSession() {
  const session = await getStockTeamSession();
  session.destroy();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/stock-team-session.ts
git commit -m "feat(stock): add stock team session auth module"
```

---

### Task 4: Login + Logout API Routes

**Files:**
- Create: `src/app/api/stock/team/login/route.ts`
- Create: `src/app/api/stock/team/logout/route.ts`

- [ ] **Step 1: Write the login route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scryptSync } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { saveStockTeamSession } from '@/lib/auth/stock-team-session';

const loginSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const result = scryptSync(password, salt, 64).toString('hex');
  return result === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Name and password required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: member, error } = await supabase
      .from('stock_team_members')
      .select('id, name, password_hash')
      .ilike('name', parsed.data.name)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!verifyPassword(parsed.data.password, member.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await saveStockTeamSession(member.id, member.name);
    return NextResponse.json({ success: true, name: member.name });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the logout route**

```typescript
import { NextResponse } from 'next/server';
import { clearStockTeamSession } from '@/lib/auth/stock-team-session';

export async function POST() {
  await clearStockTeamSession();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stock/team/login/route.ts src/app/api/stock/team/logout/route.ts
git commit -m "feat(stock): add team login/logout API routes"
```

---

### Task 5: Members, Goals, Todos API Routes

**Files:**
- Create: `src/app/api/stock/team/members/route.ts`
- Create: `src/app/api/stock/team/goals/route.ts`
- Create: `src/app/api/stock/team/todos/route.ts`

- [ ] **Step 1: Write the members route**

```typescript
import { NextResponse } from 'next/server';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_team_members')
    .select('id, name, role, scope')
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  return NextResponse.json({ members: data });
}
```

- [ ] **Step 2: Write the goals route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_goals')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 });
  return NextResponse.json({ goals: data });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['locked', 'wip', 'tbd']).optional(),
  details: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('stock_goals').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Write the todos route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = request.nextUrl.searchParams.get('owner');
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('stock_todos')
    .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
    .order('status')
    .order('created_at', { ascending: false });

  if (owner) {
    query = query.eq('owner_id', owner);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load todos' }, { status: 500 });

  return NextResponse.json({ todos: data });
}

const createSchema = z.object({
  title: z.string().min(1).max(500),
  owner_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_todos')
    .insert({
      title: parsed.data.title,
      owner_id: parsed.data.owner_id || null,
      created_by: member.memberId,
    })
    .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  return NextResponse.json({ todo: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  notes: z.string().max(2000).optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('stock_todos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stock/team/members/route.ts src/app/api/stock/team/goals/route.ts src/app/api/stock/team/todos/route.ts
git commit -m "feat(stock): add team members, goals, todos API routes"
```

---

### Task 6: Login Form Component

**Files:**
- Create: `src/app/stock/team/LoginForm.tsx`

- [ ] **Step 1: Write the login form**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/stock/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">ZAO Stock Team</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to access the dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/LoginForm.tsx
git commit -m "feat(stock): add team login form component"
```

---

### Task 7: Goals Board Component

**Files:**
- Create: `src/app/stock/team/GoalsBoard.tsx`

- [ ] **Step 1: Write the goals board**

```tsx
'use client';

import { useState } from 'react';

interface Goal {
  id: string;
  title: string;
  status: 'locked' | 'wip' | 'tbd';
  details: string;
  category: string;
  sort_order: number;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  locked: { label: 'LOCKED', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  wip: { label: 'WIP', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  tbd: { label: 'TBD', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Venue',
  funding: 'Funding',
  artists: 'Artists',
  production: 'Production',
  logistics: 'Logistics',
  marketing: 'Marketing',
  general: 'General',
};

export function GoalsBoard({ goals: initialGoals }: { goals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState('');

  async function updateGoal(id: string, updates: Partial<Pick<Goal, 'status' | 'details'>>) {
    const res = await fetch('/api/stock/team/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditDetails(goal.details);
  }

  function saveEdit(id: string) {
    updateGoal(id, { details: editDetails });
    setEditingId(null);
  }

  // Group by category
  const grouped = goals.reduce<Record<string, Goal[]>>((acc, g) => {
    (acc[g.category] ||= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Status Board</h2>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
            {CATEGORY_LABELS[cat] || cat}
          </h3>
          <div className="space-y-2">
            {items.map((goal) => {
              const style = STATUS_STYLES[goal.status];
              return (
                <div key={goal.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{goal.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      {editingId === goal.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={editDetails}
                            onChange={(e) => setEditDetails(e.target.value)}
                            className="flex-1 bg-[#0a1628] border border-white/[0.1] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#f5a623]/50"
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(goal.id)}
                            autoFocus
                          />
                          <button onClick={() => saveEdit(goal.id)} className="text-xs text-[#f5a623] font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-gray-400 cursor-pointer hover:text-gray-300"
                          onClick={() => startEdit(goal)}
                          title="Click to edit"
                        >
                          {goal.details || 'Click to add details...'}
                        </p>
                      )}
                    </div>
                    <select
                      value={goal.status}
                      onChange={(e) => updateGoal(goal.id, { status: e.target.value as Goal['status'] })}
                      className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
                    >
                      <option value="locked">Locked</option>
                      <option value="wip">WIP</option>
                      <option value="tbd">TBD</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/GoalsBoard.tsx
git commit -m "feat(stock): add goals board component"
```

---

### Task 8: Todo List Component

**Files:**
- Create: `src/app/stock/team/TodoList.tsx`

- [ ] **Step 1: Write the todo list**

```tsx
'use client';

import { useState } from 'react';

interface Member { id: string; name: string; }
interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes: string;
  owner: Member | null;
  creator: Member | null;
  created_at: string;
}

const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 };

export function TodoList({ todos: initialTodos, members, currentMemberId }: {
  todos: Todo[];
  members: Member[];
  currentMemberId: string;
}) {
  const [todos, setTodos] = useState(() =>
    [...initialTodos].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  );
  const [filter, setFilter] = useState<'all' | 'mine' | string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesVal, setEditNotesVal] = useState('');

  const filtered = todos.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'mine') return t.owner?.id === currentMemberId;
    return t.owner?.id === filter;
  });

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch('/api/stock/team/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), owner_id: newOwner || null }),
    });
    if (res.ok) {
      const { todo } = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setNewTitle('');
      setNewOwner('');
    }
  }

  async function updateTodo(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
          .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      );
    }
  }

  function cycleStatus(todo: Todo) {
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' } as const;
    updateTodo(todo.id, { status: next[todo.status] });
  }

  const statusIcon = { todo: '', in_progress: '~', done: '\u2713' };
  const statusColor = {
    todo: 'border-gray-600',
    in_progress: 'border-amber-500 bg-amber-500/10',
    done: 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Todos</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="mine">Mine</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Create new */}
      <form onSubmit={createTodo} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a todo..."
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <select
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors">
          Add
        </button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((todo) => (
          <div key={todo.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => cycleStatus(todo)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${statusColor[todo.status]}`}
                title={`Status: ${todo.status}. Click to cycle.`}
              >
                {statusIcon[todo.status]}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${todo.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {todo.owner && (
                    <span className="text-[10px] font-medium text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                      {todo.owner.name}
                    </span>
                  )}
                  <button
                    onClick={() => { setEditNotesId(editNotesId === todo.id ? null : todo.id); setEditNotesVal(todo.notes || ''); }}
                    className="text-[10px] text-gray-500 hover:text-gray-400"
                  >
                    {todo.notes ? 'notes' : '+ note'}
                  </button>
                </div>
                {editNotesId === todo.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={editNotesVal}
                      onChange={(e) => setEditNotesVal(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 bg-[#0a1628] border border-white/[0.1] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#f5a623]/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') { updateTodo(todo.id, { notes: editNotesVal }); setEditNotesId(null); } }}
                      autoFocus
                    />
                    <button onClick={() => { updateTodo(todo.id, { notes: editNotesVal }); setEditNotesId(null); }} className="text-xs text-[#f5a623]">Save</button>
                  </div>
                )}
                {editNotesId !== todo.id && todo.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{todo.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No todos yet</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/TodoList.tsx
git commit -m "feat(stock): add todo list component with CRUD"
```

---

### Task 9: Team Roles Component

**Files:**
- Create: `src/app/stock/team/TeamRoles.tsx`

- [ ] **Step 1: Write the team roles component**

```tsx
'use client';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
}

export function TeamRoles({ members }: { members: Member[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Team</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-[#f5a623]">{m.name}</span>
              <span className="text-xs text-gray-400">{m.role}</span>
            </div>
            {m.scope && <p className="text-xs text-gray-500 mt-1">{m.scope}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/TeamRoles.tsx
git commit -m "feat(stock): add team roles component"
```

---

### Task 10: Dashboard Wrapper Component

**Files:**
- Create: `src/app/stock/team/Dashboard.tsx`

- [ ] **Step 1: Write the dashboard wrapper**

```tsx
'use client';

import { GoalsBoard } from './GoalsBoard';
import { TodoList } from './TodoList';
import { TeamRoles } from './TeamRoles';
import { useRouter } from 'next/navigation';

interface Props {
  memberName: string;
  memberId: string;
  goals: Array<{ id: string; title: string; status: 'locked' | 'wip' | 'tbd'; details: string; category: string; sort_order: number }>;
  todos: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; notes: string; owner: { id: string; name: string } | null; creator: { id: string; name: string } | null; created_at: string }>;
  members: Array<{ id: string; name: string; role: string; scope: string }>;
}

export function Dashboard({ memberName, memberId, goals, todos, members }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/stock/team/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">ZAO Stock Team</h1>
            <p className="text-xs text-gray-400">October 3, 2026 - Ellsworth, ME</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#f5a623] font-medium">{memberName}</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-16">
        <GoalsBoard goals={goals} />
        <hr className="border-white/[0.06]" />
        <TodoList todos={todos} members={members.map((m) => ({ id: m.id, name: m.name }))} currentMemberId={memberId} />
        <hr className="border-white/[0.06]" />
        <TeamRoles members={members} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/Dashboard.tsx
git commit -m "feat(stock): add dashboard wrapper component"
```

---

### Task 11: Team Page (Server Component)

**Files:**
- Create: `src/app/stock/team/page.tsx`

- [ ] **Step 1: Write the page**

This is the server component that checks auth and loads data.

```tsx
import { Metadata } from 'next';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { LoginForm } from './LoginForm';
import { Dashboard } from './Dashboard';

export const metadata: Metadata = {
  title: 'ZAO Stock Team Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StockTeamPage() {
  const member = await getStockTeamMember();

  if (!member) {
    return <LoginForm />;
  }

  const supabase = getSupabaseAdmin();

  const [goalsRes, todosRes, membersRes] = await Promise.allSettled([
    supabase.from('stock_goals').select('*').order('sort_order'),
    supabase
      .from('stock_todos')
      .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
      .order('status')
      .order('created_at', { ascending: false }),
    supabase.from('stock_team_members').select('id, name, role, scope').order('created_at'),
  ]);

  const goals = goalsRes.status === 'fulfilled' ? goalsRes.value.data || [] : [];
  const todos = todosRes.status === 'fulfilled' ? todosRes.value.data || [] : [];
  const members = membersRes.status === 'fulfilled' ? membersRes.value.data || [] : [];

  return (
    <Dashboard
      memberName={member.memberName}
      memberId={member.memberId}
      goals={goals}
      todos={todos}
      members={members}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/team/page.tsx
git commit -m "feat(stock): add team dashboard page with auth gate"
```

---

### Task 12: Update Public Stock Page

**Files:**
- Modify: `src/app/stock/page.tsx:112-133`

- [ ] **Step 1: Remove the artist placeholder grid**

Remove lines 112-133 (the Lineup section with the 6 placeholder cards and the "10 artists" text):

```tsx
        {/* Lineup */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Lineup</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 flex flex-col items-center justify-center aspect-square"
              >
                <div className="w-12 h-12 rounded-full bg-[#1a2a3a] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center">
            10 artists performing equal sets &middot; DJs between sets &middot; Full lineup TBA
          </p>
        </section>
```

Replace with a simpler lineup teaser:

```tsx
        {/* Lineup */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Lineup</p>
          <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-5 text-center">
            <p className="text-sm text-gray-300">Full lineup coming soon</p>
            <p className="text-xs text-gray-500 mt-1">Artists performing equal sets with DJs between</p>
          </div>
        </section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/stock/page.tsx
git commit -m "feat(stock): simplify lineup section on public page"
```

---

### Task 13: Test, Verify, Push

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Fix any errors.

- [ ] **Step 2: Run build**

Run: `npm run build`

Fix any type errors.

- [ ] **Step 3: Manual verification**

1. Visit `/stock` - confirm lineup section is simplified, everything else works
2. Visit `/stock/team` - confirm login form appears
3. Run seed script, login with a team member password
4. Confirm dashboard loads with goals, todos, team roles
5. Create a todo, check it off, add a note
6. Update a goal's status and details

- [ ] **Step 4: Commit any fixes**

- [ ] **Step 5: Push and create PR**

```bash
git push -u origin ws/zaostock-agenda-0410-1415
```

Then create PR to main.
