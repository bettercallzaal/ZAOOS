# Agent Squad Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Supabase-backed agent squad dashboard with three views (Squad Circle, Pipeline Flow, War Room) at `/admin/agents`, plus Telegram pings from ZOE on task events.

**Architecture:** Agents on VPS write events to a Supabase `agent_events` table via a shared shell script. A new admin API route serves this data. The dashboard polls every 30s. ZOE's heartbeat cron queries un-notified events and sends Telegram pings.

**Tech Stack:** Next.js App Router, Supabase (JSONB), Tailwind CSS v4, `react-force-graph-2d` (already installed), existing admin auth pattern

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260406_agent_events.sql` | Create | agent_events table + indexes + RLS |
| `src/app/api/admin/agents/status/route.ts` | Create | API route serving agent status + event feed |
| `src/components/admin/agents/AgentDashboard.tsx` | Create | Tab container, polling, data fetching |
| `src/components/admin/agents/SquadCircle.tsx` | Create | ZOE-centered agent graph with status cards |
| `src/components/admin/agents/AgentCard.tsx` | Create | Individual agent status card |
| `src/components/admin/agents/PipelineFlow.tsx` | Create | Horizontal task chain view |
| `src/components/admin/agents/WarRoomFeed.tsx` | Create | Chronological event feed with filters |
| `src/components/admin/agents/AgentEventRow.tsx` | Create | Single expandable event row |
| `src/components/admin/agents/AgentFilters.tsx` | Create | Shared filter controls (agent, type, date) |
| `src/components/admin/agents/constants.ts` | Create | Agent colors, emojis, names, event type config |
| `src/app/(auth)/admin/AdminPanel.tsx` | Modify | Add 'agents' tab to tab groups |

---

### Task 1: Supabase Migration — `agent_events` Table

**Files:**
- Create: `supabase/migrations/20260406_agent_events.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Agent Events table for squad dashboard
CREATE TABLE IF NOT EXISTS agent_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    text NOT NULL,
  event_type    text NOT NULL,
  summary       text,
  payload       jsonb DEFAULT '{}',
  dispatched_by text,
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX idx_agent_events_agent_name ON agent_events(agent_name);
CREATE INDEX idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON agent_events(created_at DESC);
CREATE INDEX idx_agent_events_unnotified ON agent_events(notified_at) WHERE notified_at IS NULL;

-- RLS
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent events"
  ON agent_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert"
  ON agent_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update"
  ON agent_events FOR UPDATE
  USING (true);
```

- [ ] **Step 2: Run the migration on Supabase**

Run the SQL directly in Supabase dashboard SQL editor (or via CLI if configured). Verify:

```bash
# From the project root, check the table exists:
# Go to Supabase dashboard > SQL Editor > run:
# SELECT count(*) FROM agent_events;
# Expected: 0 rows, no error
```

- [ ] **Step 3: Insert a test event to verify**

Run in Supabase SQL editor:
```sql
INSERT INTO agent_events (agent_name, event_type, summary, payload)
VALUES ('zoe', 'heartbeat', 'Test event', '{"status": "test"}');

SELECT * FROM agent_events;
-- Expected: 1 row with the test event
-- Clean up:
DELETE FROM agent_events WHERE summary = 'Test event';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260406_agent_events.sql
git commit -m "feat: agent_events table for squad dashboard"
```

---

### Task 2: Agent Constants

**Files:**
- Create: `src/components/admin/agents/constants.ts`

- [ ] **Step 1: Create the constants file**

```typescript
export const AGENTS = [
  { name: 'zoe', label: 'ZOE', emoji: '🦞', color: '#FF6B6B', role: 'Orchestrator' },
  { name: 'zoey', label: 'ZOEY', emoji: '⚡', color: '#4ECDC4', role: 'Action Agent' },
  { name: 'builder', label: 'BUILDER', emoji: '🔨', color: '#F59E0B', role: 'Code' },
  { name: 'scout', label: 'SCOUT', emoji: '🔭', color: '#8B5CF6', role: 'Intel' },
  { name: 'wallet', label: 'WALLET', emoji: '💰', color: '#10B981', role: 'On-chain' },
  { name: 'fishbowlz', label: 'FISHBOWLZ', emoji: '🐟', color: '#06B6D4', role: 'Audio Rooms' },
  { name: 'caster', label: 'CASTER', emoji: '📢', color: '#EC4899', role: 'Social' },
] as const;

export type AgentName = (typeof AGENTS)[number]['name'];

export const EVENT_TYPES = {
  task_started: { label: 'Started', color: 'bg-blue-500/20 text-blue-400', icon: '▶' },
  task_completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400', icon: '✅' },
  task_failed: { label: 'Failed', color: 'bg-red-500/20 text-red-400', icon: '❌' },
  blocked: { label: 'Blocked', color: 'bg-yellow-500/20 text-yellow-400', icon: '⚠️' },
  approval_needed: { label: 'Needs Approval', color: 'bg-[#f5a623]/20 text-[#f5a623]', icon: '🟡' },
  heartbeat: { label: 'Heartbeat', color: 'bg-gray-500/20 text-gray-400', icon: '💓' },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export interface AgentEvent {
  id: string;
  agent_name: AgentName;
  event_type: EventType;
  summary: string | null;
  payload: Record<string, unknown>;
  dispatched_by: string | null;
  notified_at: string | null;
  created_at: string;
}

export interface AgentStatus {
  name: AgentName;
  label: string;
  emoji: string;
  color: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'approval_needed';
  current_task: string | null;
  last_event: AgentEvent | null;
  events_24h: number;
}

export function getAgent(name: string) {
  return AGENTS.find((a) => a.name === name);
}

export function getStatusDot(status: AgentStatus['status']): string {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'approval_needed': return 'bg-[#f5a623]';
    default: return 'bg-gray-500';
  }
}

export function deriveStatus(lastEvent: AgentEvent | null): AgentStatus['status'] {
  if (!lastEvent) return 'idle';
  switch (lastEvent.event_type) {
    case 'task_started': return 'active';
    case 'task_failed': return 'error';
    case 'blocked': return 'error';
    case 'approval_needed': return 'approval_needed';
    default: return 'idle';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/constants.ts
git commit -m "feat: agent dashboard constants — colors, types, helpers"
```

---

### Task 3: API Route — `/api/admin/agents/status`

**Files:**
- Create: `src/app/api/admin/agents/status/route.ts`

Reference: `src/app/api/admin/users/route.ts` for the auth pattern.

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AGENTS } from '@/components/admin/agents/constants';
import type { AgentEvent, AgentStatus } from '@/components/admin/agents/constants';
import { deriveStatus } from '@/components/admin/agents/constants';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'squad';
  const agentFilter = searchParams.get('agent');
  const typeFilter = searchParams.get('event_type');
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);
  const since = searchParams.get('since');

  try {
    if (view === 'squad') {
      // Get latest event per agent + 24h counts
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [latestResult, countsResult] = await Promise.all([
        // Latest event per agent (grab last 20 events, dedupe in JS)
        supabaseAdmin
          .from('agent_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        // 24h event counts
        supabaseAdmin
          .from('agent_events')
          .select('agent_name')
          .gte('created_at', dayAgo),
      ]);

      const latestEvents = (latestResult.data || []) as AgentEvent[];
      const countEvents = countsResult.data || [];

      // Build agent status list
      const agents: AgentStatus[] = AGENTS.map((agent) => {
        const agentEvents = latestEvents.filter((e) => e.agent_name === agent.name);
        const lastEvent = agentEvents[0] || null;
        const events24h = countEvents.filter((e) => e.agent_name === agent.name).length;

        return {
          ...agent,
          status: deriveStatus(lastEvent),
          current_task: lastEvent?.event_type === 'task_started' ? lastEvent.summary : null,
          last_event: lastEvent,
          events_24h: events24h,
        };
      });

      return NextResponse.json({ agents });
    }

    // Feed view (used by War Room and Pipeline)
    let query = supabaseAdmin
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentFilter) {
      query = query.eq('agent_name', agentFilter);
    }
    if (typeFilter) {
      query = query.eq('event_type', typeFilter);
    }
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Agent events query error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err) {
    console.error('Agent status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx tsc --noEmit 2>&1 | grep -i "agents/status" || echo "No type errors in route"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/agents/status/route.ts
git commit -m "feat: admin agents status API — squad view + event feed"
```

---

### Task 4: AgentCard Component

**Files:**
- Create: `src/components/admin/agents/AgentCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import type { AgentStatus, AgentEvent } from './constants';
import { getStatusDot, EVENT_TYPES } from './constants';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentCard({
  agent,
  recentEvents,
}: {
  agent: AgentStatus;
  recentEvents?: AgentEvent[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-white/10 bg-[#1a2a4a] p-4 cursor-pointer hover:border-white/20 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-2xl">{agent.emoji}</span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a2a4a] ${getStatusDot(agent.status)}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{agent.label}</h3>
            <span className="text-xs text-gray-500">{agent.role}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">
            {agent.current_task ||
              (agent.last_event
                ? `${agent.last_event.summary || 'No summary'} · ${timeAgo(agent.last_event.created_at)}`
                : 'No activity')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-gray-500">{agent.events_24h} events/24h</span>
        </div>
      </div>

      {expanded && recentEvents && recentEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          {recentEvents.slice(0, 10).map((event) => {
            const config = EVENT_TYPES[event.event_type] || EVENT_TYPES.heartbeat;
            return (
              <div key={event.id} className="flex items-start gap-2 text-xs">
                <span>{config.icon}</span>
                <span className="text-gray-400 shrink-0">{timeAgo(event.created_at)}</span>
                <span className="text-gray-300 truncate">{event.summary || event.event_type}</span>
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
git add src/components/admin/agents/AgentCard.tsx
git commit -m "feat: AgentCard component — status dot, summary, expandable history"
```

---

### Task 5: AgentFilters Component

**Files:**
- Create: `src/components/admin/agents/AgentFilters.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { AGENTS, EVENT_TYPES } from './constants';

export default function AgentFilters({
  agentFilter,
  typeFilter,
  onAgentChange,
  onTypeChange,
}: {
  agentFilter: string;
  typeFilter: string;
  onAgentChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={agentFilter}
        onChange={(e) => onAgentChange(e.target.value)}
        className="bg-[#1a2a4a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 min-h-[36px]"
      >
        <option value="">All agents</option>
        {AGENTS.map((a) => (
          <option key={a.name} value={a.name}>
            {a.emoji} {a.label}
          </option>
        ))}
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="bg-[#1a2a4a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 min-h-[36px]"
      >
        <option value="">All events</option>
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <option key={key} value={key}>
            {config.icon} {config.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/AgentFilters.tsx
git commit -m "feat: AgentFilters — agent and event type dropdowns"
```

---

### Task 6: AgentEventRow Component

**Files:**
- Create: `src/components/admin/agents/AgentEventRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import { EVENT_TYPES, getAgent } from './constants';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentEventRow({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false);
  const agent = getAgent(event.agent_name);
  const config = EVENT_TYPES[event.event_type] || EVENT_TYPES.heartbeat;

  return (
    <div
      className="border-b border-white/5 py-3 px-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm shrink-0 w-16 text-gray-500 text-xs">
          {timeAgo(event.created_at)}
        </span>
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: agent ? `${agent.color}20` : '#333' }}
        >
          {agent?.emoji || '?'}
        </span>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${config.color}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-300 truncate flex-1">
          {event.summary || event.event_type}
        </span>
      </div>

      {expanded && event.payload && Object.keys(event.payload).length > 0 && (
        <div className="mt-2 ml-[6.5rem] text-xs">
          <pre className="bg-black/20 rounded-lg p-3 overflow-x-auto text-gray-400 whitespace-pre-wrap">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/AgentEventRow.tsx
git commit -m "feat: AgentEventRow — expandable event row with payload"
```

---

### Task 7: SquadCircle View

**Files:**
- Create: `src/components/admin/agents/SquadCircle.tsx`

- [ ] **Step 1: Create the component**

Uses CSS positioning to place ZOE at center with agents in a circle. No external graph library needed for 7 static nodes.

```tsx
'use client';

import { AGENTS } from './constants';
import AgentCard from './AgentCard';
import type { AgentStatus, AgentEvent } from './constants';

export default function SquadCircle({
  agents,
  allEvents,
}: {
  agents: AgentStatus[];
  allEvents: AgentEvent[];
}) {
  const zoe = agents.find((a) => a.name === 'zoe');
  const others = agents.filter((a) => a.name !== 'zoe');

  return (
    <div>
      {/* Desktop: circular layout */}
      <div className="hidden md:block relative w-full max-w-3xl mx-auto" style={{ height: '600px' }}>
        {/* ZOE center */}
        {zoe && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56">
            <AgentCard
              agent={zoe}
              recentEvents={allEvents.filter((e) => e.agent_name === 'zoe')}
            />
          </div>
        )}

        {/* SVG lines from center to each agent */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {others.map((agent, i) => {
            const angle = (i * 360) / others.length - 90;
            const rad = (angle * Math.PI) / 180;
            const radius = 220;
            const cx = 50;
            const cy = 50;
            const x2 = cx + Math.cos(rad) * (radius / 6);
            const y2 = cy + Math.sin(rad) * (radius / 6);
            const isActive = agent.status === 'active';
            return (
              <line
                key={agent.name}
                x1={`${cx}%`}
                y1={`${cy}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={isActive ? agent.color : '#ffffff15'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* Orbiting agents */}
        {others.map((agent, i) => {
          const angle = (i * 360) / others.length - 90;
          const rad = (angle * Math.PI) / 180;
          const radius = 220;
          const x = 50 + Math.cos(rad) * (radius / 3.5);
          const y = 50 + Math.sin(rad) * (radius / 3.5);
          return (
            <div
              key={agent.name}
              className="absolute w-52"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
              }}
            >
              <AgentCard
                agent={agent}
                recentEvents={allEvents.filter((e) => e.agent_name === agent.name)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.name}
            agent={agent}
            recentEvents={allEvents.filter((e) => e.agent_name === agent.name)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/SquadCircle.tsx
git commit -m "feat: SquadCircle — ZOE-centered orbital layout with SVG connections"
```

---

### Task 8: WarRoomFeed View

**Files:**
- Create: `src/components/admin/agents/WarRoomFeed.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import AgentEventRow from './AgentEventRow';
import AgentFilters from './AgentFilters';

export default function WarRoomFeed({ events }: { events: AgentEvent[] }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = events.filter((e) => {
    if (agentFilter && e.agent_name !== agentFilter) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="px-4 py-3 border-b border-white/10">
        <AgentFilters
          agentFilter={agentFilter}
          typeFilter={typeFilter}
          onAgentChange={setAgentFilter}
          onTypeChange={setTypeFilter}
        />
      </div>

      <div className="divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No events yet. Agents will appear here when they start logging.
          </div>
        ) : (
          filtered.map((event) => (
            <AgentEventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/WarRoomFeed.tsx
git commit -m "feat: WarRoomFeed — filterable chronological event feed"
```

---

### Task 9: PipelineFlow View

**Files:**
- Create: `src/components/admin/agents/PipelineFlow.tsx`

- [ ] **Step 1: Create the component**

Groups events by `dispatched_by` chains to show task flow through agents.

```tsx
'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import { getAgent, EVENT_TYPES } from './constants';
import AgentFilters from './AgentFilters';

interface TaskChain {
  id: string;
  task: string;
  steps: AgentEvent[];
}

function buildChains(events: AgentEvent[]): TaskChain[] {
  // Group completed/started events by summary similarity
  const chains: Map<string, AgentEvent[]> = new Map();

  for (const event of events) {
    if (event.event_type === 'heartbeat') continue;
    const key = event.summary?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || event.id;
    const existing = chains.get(key) || [];
    existing.push(event);
    chains.set(key, existing);
  }

  return Array.from(chains.entries())
    .map(([key, steps]) => ({
      id: key,
      task: steps[0]?.summary || 'Unknown task',
      steps: steps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }))
    .filter((chain) => chain.steps.length > 0)
    .sort((a, b) => {
      const aTime = new Date(a.steps[a.steps.length - 1].created_at).getTime();
      const bTime = new Date(b.steps[b.steps.length - 1].created_at).getTime();
      return bTime - aTime;
    })
    .slice(0, 20);
}

export default function PipelineFlow({ events }: { events: AgentEvent[] }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = events.filter((e) => {
    if (agentFilter && e.agent_name !== agentFilter) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    return true;
  });

  const chains = buildChains(filtered);

  return (
    <div>
      <div className="px-4 py-3 border-b border-white/10">
        <AgentFilters
          agentFilter={agentFilter}
          typeFilter={typeFilter}
          onAgentChange={setAgentFilter}
          onTypeChange={setTypeFilter}
        />
      </div>

      <div className="p-4 space-y-4">
        {chains.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No task chains yet. Tasks will appear as agents work.
          </div>
        ) : (
          chains.map((chain) => (
            <div
              key={chain.id}
              className="rounded-xl border border-white/10 bg-[#1a2a4a] p-4"
            >
              <h3 className="text-sm font-semibold mb-3 text-gray-200 truncate">
                {chain.task}
              </h3>

              {/* Horizontal stepper (desktop) / vertical (mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                {chain.steps.map((step, i) => {
                  const agent = getAgent(step.agent_name);
                  const config = EVENT_TYPES[step.event_type] || EVENT_TYPES.heartbeat;
                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                        <span className="text-sm">{agent?.emoji}</span>
                        <div>
                          <span className="text-xs font-medium" style={{ color: agent?.color }}>
                            {agent?.label}
                          </span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      {i < chain.steps.length - 1 && (
                        <span className="text-gray-600 hidden sm:inline">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/PipelineFlow.tsx
git commit -m "feat: PipelineFlow — task chain visualization with horizontal stepper"
```

---

### Task 10: AgentDashboard Container

**Files:**
- Create: `src/components/admin/agents/AgentDashboard.tsx`

- [ ] **Step 1: Create the container component**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentStatus, AgentEvent } from './constants';
import SquadCircle from './SquadCircle';
import WarRoomFeed from './WarRoomFeed';
import PipelineFlow from './PipelineFlow';

type View = 'squad' | 'pipeline' | 'warroom';

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'squad', label: 'Squad', icon: '⭕' },
  { id: 'pipeline', label: 'Pipeline', icon: '➡️' },
  { id: 'warroom', label: 'War Room', icon: '📡' },
];

export default function AgentDashboard() {
  const [view, setView] = useState<View>('squad');
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [squadRes, feedRes] = await Promise.all([
        fetch('/api/admin/agents/status?view=squad'),
        fetch('/api/admin/agents/status?view=feed&limit=100'),
      ]);

      if (squadRes.ok) {
        const squadData = await squadRes.json();
        setAgents(squadData.agents);
      }
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setEvents(feedData.events);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* View tabs + last updated */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-black/20 rounded-lg p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v.id
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-1">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Active view */}
      <div className="rounded-xl border border-white/10 bg-[#0f1d35] overflow-hidden">
        {view === 'squad' && <SquadCircle agents={agents} allEvents={events} />}
        {view === 'pipeline' && <PipelineFlow events={events} />}
        {view === 'warroom' && <WarRoomFeed events={events} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/agents/AgentDashboard.tsx
git commit -m "feat: AgentDashboard — three-view container with 30s polling"
```

---

### Task 11: Integrate into AdminPanel

**Files:**
- Modify: `src/app/(auth)/admin/AdminPanel.tsx`

- [ ] **Step 1: Read the current AdminPanel**

Read `src/app/(auth)/admin/AdminPanel.tsx` to find the exact `type Tab`, `tabGroups`, dynamic imports, and conditional render pattern.

- [ ] **Step 2: Add the agents tab**

Add to the `type Tab` union:
```typescript
// Add 'agents' to the Tab type
type Tab = 'users' | 'zid' | ... | 'agents';
```

Add the dynamic import near the other imports:
```typescript
const AgentDashboard = dynamic(() => import('@/components/admin/agents/AgentDashboard'), { ssr: false });
```

Add to `tabGroups` — create a new group or add to an existing one:
```typescript
{ label: 'Agents', tabs: [{ id: 'agents' as Tab, label: '🤖 Squad' }] },
```

Add the conditional render with the other tab renders:
```typescript
{activeTab === 'agents' && <AgentDashboard />}
```

- [ ] **Step 3: Verify the AdminPanel compiles**

```bash
npx tsc --noEmit 2>&1 | grep -i "AdminPanel\|AgentDashboard" || echo "No type errors"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/admin/AdminPanel.tsx
git commit -m "feat: add agents Squad tab to AdminPanel"
```

---

### Task 12: VPS Log-Event Script

**Files:**
- Deploy to VPS: `/home/node/openclaw-workspace/scripts/log-event.sh`

This task is run via SSH, not local code.

- [ ] **Step 1: Create the log-event script on VPS**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "mkdir -p /home/node/openclaw-workspace/scripts && cat > /home/node/openclaw-workspace/scripts/log-event.sh << '"'"'SCRIPT'"'"'
#!/bin/bash
# Usage: source this file, then call log_event
# log_event <agent_name> <event_type> <summary> [payload_json]

log_event() {
  local agent=\"\$1\"
  local event_type=\"\$2\"
  local summary=\"\$3\"
  local payload=\"\${4:-\"{}\"}\"

  if [ -z \"\$SUPABASE_URL\" ] || [ -z \"\$SUPABASE_SERVICE_ROLE_KEY\" ]; then
    echo \"[log_event] ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set\" >&2
    return 1
  fi

  curl -s -o /dev/null -w \"%{http_code}\" -X POST \"\${SUPABASE_URL}/rest/v1/agent_events\" \
    -H \"apikey: \${SUPABASE_SERVICE_ROLE_KEY}\" \
    -H \"Authorization: Bearer \${SUPABASE_SERVICE_ROLE_KEY}\" \
    -H \"Content-Type: application/json\" \
    -H \"Prefer: return=minimal\" \
    -d \"{
      \\\"agent_name\\\": \\\"\${agent}\\\",
      \\\"event_type\\\": \\\"\${event_type}\\\",
      \\\"summary\\\": \\\"\${summary}\\\",
      \\\"payload\\\": \${payload}
    }\"
}
SCRIPT"'
```

- [ ] **Step 2: Verify the script exists and is readable**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/scripts/log-event.sh | head -5'
```

Expected: the shebang line and usage comment.

- [ ] **Step 3: Test by inserting a real event**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "source /home/node/openclaw-workspace/.env && source /home/node/openclaw-workspace/scripts/log-event.sh && log_event zoe heartbeat \"Dashboard integration test\" \"{\\\"status\\\": \\\"online\\\"}\" && echo OK"'
```

Expected output: `201OK` (201 = created, OK = echo)

- [ ] **Step 4: Verify event appears in Supabase**

Check Supabase dashboard or:
```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "source /home/node/openclaw-workspace/.env && curl -s \"\${SUPABASE_URL}/rest/v1/agent_events?order=created_at.desc&limit=1\" -H \"apikey: \${SUPABASE_SERVICE_ROLE_KEY}\" -H \"Authorization: Bearer \${SUPABASE_SERVICE_ROLE_KEY}\""'
```

Expected: JSON with the test heartbeat event.

---

### Task 13: Update ZOE's HEARTBEAT.md for Telegram Pings

**Files:**
- Modify on VPS: `/home/node/openclaw-workspace/HEARTBEAT.md`

- [ ] **Step 1: Read current HEARTBEAT.md**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/HEARTBEAT.md'
```

- [ ] **Step 2: Append Telegram ping protocol**

Add to HEARTBEAT.md via SSH — append a new section:

```markdown
## Telegram Ping Protocol (NEW)

On every heartbeat, check for un-notified agent events:

1. Source the .env file for Supabase credentials
2. Query: `SELECT * FROM agent_events WHERE notified_at IS NULL AND event_type IN ('task_completed', 'task_failed', 'blocked', 'approval_needed') ORDER BY created_at ASC`
3. For each event, send a Telegram message to Zaal:
   - task_completed: "✅ {AGENT} finished: {summary}\n→ {payload.result_preview}"
   - task_failed: "❌ {AGENT} failed: {summary}\n→ {payload.error}"
   - approval_needed: "🟡 {AGENT} needs approval: {summary}\n→ {payload.draft}\nReply YES to post, NO to revise."
   - blocked: "⚠️ {AGENT} blocked: {summary}\n→ {payload.blocker}"
4. After sending, update: `UPDATE agent_events SET notified_at = now() WHERE id = '{event_id}'`

### Daily Digest (8am EST)

Query last 24h events grouped by agent. Send summary:
```
📋 Squad Daily — {date}

{AGENT}: {count} tasks ✅ / ❌ / 🟡
...

Dashboard: zaoos.com/admin/agents
```
```

- [ ] **Step 3: Verify HEARTBEAT.md updated**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 tail -20 /home/node/openclaw-workspace/HEARTBEAT.md'
```

---

### Task 14: Final Verification

- [ ] **Step 1: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors related to agent dashboard files.

- [ ] **Step 2: Lint**

```bash
npx eslint src/components/admin/agents/ src/app/api/admin/agents/ --quiet
```

Expected: 0 errors.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Verify Supabase has test events**

Open the dashboard at `/admin` → click "Squad" tab → should show 7 agent cards (all gray/idle except ZOE with the test heartbeat).

- [ ] **Step 5: Manual smoke test**

- [ ] Navigate to `/admin` → Agents tab visible
- [ ] Squad Circle: 7 cards, ZOE center (desktop), vertical list (mobile)
- [ ] War Room: shows test heartbeat event, filters work
- [ ] Pipeline: empty state shows correctly
- [ ] Auto-refresh: wait 30s, verify "Updated" timestamp changes
- [ ] Click agent card → expands to show recent events
