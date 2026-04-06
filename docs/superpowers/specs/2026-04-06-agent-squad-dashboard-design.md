# Agent Squad Dashboard — Design Spec

> **Date:** 2026-04-06
> **Status:** Approved
> **Goal:** Real-time visibility into ZAO's 7-agent squad via Supabase-backed admin dashboard + Telegram pings

## Problem

Agent results are scattered across workspace files on the VPS. Checking status requires manual SSH + cat for each agent. No notifications when agents finish, fail, or need approval. No historical view of what the squad has accomplished.

## Solution

Three components:
1. **`agent_events` Supabase table** — single source of truth for all agent activity
2. **Admin dashboard at `/admin/agents`** — three-tab visual display (Squad Circle, Pipeline Flow, War Room)
3. **Telegram pings from ZOE** — real-time notifications for completions, failures, blocks, and approvals

## Data Layer

### `agent_events` table

```sql
CREATE TABLE agent_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    text NOT NULL,
  event_type    text NOT NULL,
  summary       text,
  payload       jsonb DEFAULT '{}',
  dispatched_by text,
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Index for dashboard queries
CREATE INDEX idx_agent_events_agent_name ON agent_events(agent_name);
CREATE INDEX idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON agent_events(created_at DESC);

-- Index for Telegram ping query (un-notified events)
CREATE INDEX idx_agent_events_unnotified ON agent_events(notified_at) WHERE notified_at IS NULL;

-- RLS: admin read, service role write
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agent events"
  ON agent_events FOR SELECT
  USING (true);  -- admin check happens at API route level

CREATE POLICY "Service role can insert"
  ON agent_events FOR INSERT
  WITH CHECK (true);  -- service role only, from VPS
```

### Event types

| event_type | When | Telegram ping? |
|---|---|---|
| `task_started` | Agent picks up work | No |
| `task_completed` | Agent finishes successfully | Yes |
| `task_failed` | Agent errors out | Yes |
| `blocked` | Agent waiting on external dependency | Yes |
| `approval_needed` | Needs Zaal's yes/no (CASTER drafts) | Yes |
| `heartbeat` | Alive check, status in payload | No |

### Payload schema (by event type)

**task_started / task_completed:**
```json
{
  "task": "ERC-8004 revenue research",
  "result_file": "results/2026-04-06-erc8004-revenue-research.md",
  "result_preview": "Registration costs $0.003, revenue potential $600-3K/mo",
  "duration_ms": 180000
}
```

**task_failed:**
```json
{
  "task": "FISHBOWLZ repo build",
  "error": "SSH connection dropped",
  "will_retry": true
}
```

**approval_needed:**
```json
{
  "task": "bootcamp post draft",
  "draft": "Survived the agentic bootcamp this week...",
  "action_required": "Reply YES to post, NO to revise"
}
```

**blocked:**
```json
{
  "task": "ERC-8004 registration",
  "blocker": "Needs 0.01 ETH on Base",
  "current_state": "Balance: $2 USDC"
}
```

**heartbeat:**
```json
{
  "status": "idle",
  "last_task": "ERC-8004 research",
  "last_task_at": "2026-04-06T09:45:00Z"
}
```

## VPS Integration — Agent Logging

Each agent gets a `log_event` shell function that curls Supabase REST API directly. Added to each agent's workspace as a shared script.

### `/home/node/openclaw-workspace/scripts/log-event.sh`

```bash
#!/bin/bash
# Usage: log_event <agent_name> <event_type> <summary> [payload_json]
log_event() {
  local agent="$1"
  local event_type="$2"
  local summary="$3"
  local payload="${4:-{}}"
  
  curl -s -X POST "${SUPABASE_URL}/rest/v1/agent_events" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"agent_name\": \"${agent}\",
      \"event_type\": \"${event_type}\",
      \"summary\": \"${summary}\",
      \"payload\": ${payload}
    }"
}
```

Agents call this at the start and end of every task:
```bash
source /home/node/openclaw-workspace/scripts/log-event.sh
log_event "scout" "task_started" "ERC-8004 revenue research"
# ... do work ...
log_event "scout" "task_completed" "ERC-8004 research complete" '{"result_preview": "..."}'
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already in VPS `.env`.

## Dashboard — `/admin/agents`

### API Route: `/api/admin/agents/status/route.ts`

```
GET /api/admin/agents/status
Query params:
  - view: 'squad' | 'pipeline' | 'feed' (default: 'squad')
  - agent: filter by agent name (optional)
  - event_type: filter by type (optional)
  - limit: number of events (default: 50, max: 200)
  - since: ISO timestamp for events after (optional)

Response (squad view):
{
  agents: [
    {
      name: "scout",
      emoji: "🔭",
      status: "idle",           // derived from latest event
      current_task: null,
      last_event: { ... },
      events_24h: 3
    },
    ...
  ]
}

Response (feed view):
{
  events: [
    {
      id, agent_name, event_type, summary, payload, created_at
    },
    ...
  ]
}
```

Session + admin FID check required.

### Tab 1: Squad Circle (default)

- ZOE at center, 6 agents orbiting in a responsive circle layout
- Each agent rendered as a card:
  - Emoji + name
  - Status dot: green (active), gold (approval needed), red (errored), gray (idle)
  - One-line current status
  - Last result preview (truncated to ~80 chars)
- Lines from ZOE to each agent; line pulses/glows when task in progress
- Click agent card → expands to show last 10 events for that agent
- Built with `@xyflow/react` for the node graph
- Mobile: vertical list of agent cards, tappable to expand

### Agent colors (consistent across all views)

| Agent | Color | Emoji |
|---|---|---|
| ZOE | coral `#FF6B6B` | 🦞 |
| ZOEY | electric blue `#4ECDC4` | ⚡ |
| BUILDER | amber `#F59E0B` | 🔨 |
| SCOUT | purple `#8B5CF6` | 🔭 |
| WALLET | green `#10B981` | 💰 |
| FISHBOWLZ | cyan `#06B6D4` | 🐟 |
| CASTER | pink `#EC4899` | 📢 |

### Tab 2: Pipeline Flow

- Horizontal flow showing task chains through agents
- Each step = a node (done ✅ / active 🔄 / pending ⏳)
- Example: `SCOUT researched → WALLET registered → CASTER drafted → Zaal approved → CASTER posted`
- Built from `dispatched_by` field — connecting outputs to inputs
- Filter by date range or search by task name
- Mobile: vertical stepper layout

### Tab 3: War Room

- Full reverse-chronological feed of all agent events
- Each row: timestamp | agent emoji+color badge | event type pill | summary
- Expandable rows show full payload
- Filter bar: agent dropdown, event type dropdown, date range
- Auto-refreshes every 30 seconds (polling)
- Mobile: same layout, works naturally as vertical feed

### Component structure

```
src/components/admin/agents/
├── AgentDashboard.tsx          — tab container, data fetching, polling
├── SquadCircle.tsx             — ReactFlow node graph + agent cards
├── AgentCard.tsx               — individual agent status card
├── PipelineFlow.tsx            — horizontal task chain view
├── WarRoomFeed.tsx             — chronological event feed
├── AgentEventRow.tsx           — single event row (expandable)
└── AgentFilters.tsx            — shared filter controls
```

### Page

```
src/app/(auth)/admin/agents/page.tsx  — server component, admin gate
```

## Telegram Pings

ZOE's heartbeat cron (bump from 60m to 15m) queries for un-notified events:

```sql
SELECT * FROM agent_events
WHERE notified_at IS NULL
AND event_type IN ('task_completed', 'task_failed', 'blocked', 'approval_needed')
ORDER BY created_at ASC
```

For each event, ZOE sends a formatted Telegram message via the existing @zaoclaw_bot, then updates `notified_at`:

```sql
UPDATE agent_events SET notified_at = now() WHERE id = '<event_id>'
```

### Message formats

**task_completed:**
```
✅ SCOUT finished: ERC-8004 revenue research
→ Registration costs $0.003, revenue potential $600-3K/mo
```

**task_failed:**
```
❌ BUILDER failed: FISHBOWLZ repo build
→ SSH connection dropped. Re-dispatching.
```

**approval_needed:**
```
🟡 CASTER needs approval: bootcamp post draft
→ "Survived the agentic bootcamp this week..."
Reply YES to post, NO to revise.
```

**blocked:**
```
⚠️ WALLET blocked: ERC-8004 registration
→ Needs 0.01 ETH on Base. Current balance: $2 USDC.
```

**Daily digest (morning cron, 8am EST):**
```
📋 Squad Daily — Apr 6

SCOUT: 1 task ✅
CASTER: 1 draft waiting approval 🟡
BUILDER: 1 failed, re-dispatched ⚡
WALLET: idle
ZOEY: 1 task ✅
FISHBOWLZ: blocked (HMS template)

Dashboard: zaoos.com/admin/agents
```

## Scope Boundaries — NOT Building

- No real-time websockets — polling every 30s
- No agent-to-agent chat UI — communication via task dispatch only
- No cost/token tracking — add later from Minimax billing
- No dispatching from dashboard — read-only; dispatch from Telegram or terminal
- No auth beyond existing admin FID check
- No new Supabase migrations tooling — run SQL directly

## Dependencies

- `@xyflow/react` — node graph for Squad Circle view
- `recharts` — optional, for sparklines if we add metrics later
- Existing: Supabase, Tailwind, admin auth, @zaoclaw_bot

## Success Criteria

1. All 7 agents log events to Supabase on task start/complete/fail
2. Dashboard shows live status within 30s of an event
3. Telegram pings arrive within 15 minutes of task completion
4. You can see what the whole squad did today in one glance
