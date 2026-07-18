---
topic: agents/dreamloops
type: DESIGN
status: ready
created: 2026-07-17
board-task: 23503d58
related-docs: 1085, 1086, 1091, 1115
owner: Zaal
deadline: 2026-08-15
---

# 1319 — DreamLoops x ZAOcowork: Capsule Dispatch + Cost Caps

> **Context (from doc 1115, move 3):** DreamLoops is proven on ZOL. The next graft target is ZAOcowork — adding stateful AI capsules for task intelligence: auto-suggestions, cost-capped LLM calls, and state that carries across re-runs. This doc is the design spec.
>
> **Decision:** Use DreamLoops capsule dispatch inside the ZAOcowork Next.js app's API routes to run AI actions (summarize, suggest, auto-tag) with hard cost caps per capsule and state stored in the existing Supabase `tasks` table (no new infra).

---

## What "DreamLoops onto zaocowork" Means

The ZAOcowork board (thezao.xyz) is a Next.js app with Supabase backend. Today, any AI action on the board (task suggestions, auto-summary) is either:
- Not built at all
- A raw one-off Claude API call with no cost control and no memory of prior runs

DreamLoops grafts **bounded agent capsules** onto the board: each AI action is a small loop with declared:
- **Input:** what task/context it reads
- **Budget cap:** max tokens per run (hard ceiling via Anthropic `max_tokens`)
- **State:** what it writes back to Supabase so re-runs can pick up where they left off
- **Human gate:** optional Telegram approval before the action takes effect

This is NOT a ZOE refactor. ZOE stays monolithic. This is a set of NEW capabilities in the ZAOcowork Next.js layer only.

---

## Three Capsules to Build (Priority Order)

### Capsule 1: Task-Auto-Summary (High ROI, Low Effort)

**Trigger:** New task created in Supabase `tasks` table (via webhook or API route)
**Action:** Summarize the task title + notes into a 2-line brief (for ZOE morning digest)
**Cost cap:** 500 tokens per run (well under $0.01 per task)
**State:** Write summary to `tasks.ai_summary` column (new nullable text column)
**Gate:** No gate — automatic

**API route:** `POST /api/tasks/[id]/summarize`
```typescript
// budget-capped call
const { text } = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 500,
  messages: [{ role: 'user', content: `Summarize this task in 2 lines:\n${task.title}\n${task.notes}` }]
});
await supabase.from('tasks').update({ ai_summary: text }).eq('id', task.id);
```

---

### Capsule 2: Related-Docs Suggester (Medium ROI, Medium Effort)

**Trigger:** Task title changes (PATCH to notes that includes research keywords)
**Action:** Search ZAOOS research/agents/README.md and business/README.md for relevant docs, return top 3
**Cost cap:** 1,000 tokens per run
**State:** Write doc list to `tasks.ai_related_docs` (JSONB array, e.g. `["1311", "1272"]`)
**Gate:** Results are SUGGESTIONS shown in the board UI — Zaal clicks to approve/ignore

**Matching approach (no vector search needed):**
1. Extract keywords from task title (Claude Haiku, 200-token call)
2. Grep ZAOOS README files for keyword matches (file-based, free)
3. Return top 3 by keyword overlap score

---

### Capsule 3: Task-Staleness Detector (Medium ROI, Low Effort)

**Trigger:** ZOE morning brief cron (daily 8AM)
**Action:** Scan `in_progress` tasks older than 7 days. For each, emit a Telegram alert if no notes update in last 3 days.
**Cost cap:** No LLM call — pure SQL + threshold logic
**State:** `tasks.last_ai_ping` timestamp — prevents same task from being pinged more than once per 48h

**Why DreamLoops for this:** Even without an LLM call, this is a DreamLoops-style capsule because it has bounded inputs, state, and a Telegram gate (ZOE surfaces "3 stale tasks" with a checkmark to mark done).

---

## Architecture (All 3 Capsules)

```
ZAOcowork API route (Next.js)
    │
    ▼
1. Read task from Supabase
2. Check budget gate: has ai_summary already run this week? Skip if yes.
3. Call Anthropic with max_tokens cap
4. Write result back to Supabase (ai_summary / ai_related_docs / last_ai_ping)
5. (Optional) POST to ZOE Telegram: "ai suggestion ready: [task name] — approve?"
```

No new infrastructure. Uses the existing:
- Supabase project (add 3 nullable columns to `tasks` table)
- Anthropic API key (already in ZAOcowork env)
- ZOE's existing Telegram webhook for approvals

---

## Supabase Schema Changes

```sql
-- Add to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_related_docs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_ai_ping TIMESTAMPTZ;
```

Migration file: `supabase/migrations/20260717000000_add_ai_capsule_columns.sql`

---

## Cost Caps Summary

| Capsule | Model | Max Tokens/Run | Max Cost/Run | Runs/Day |
|---------|-------|----------------|--------------|----------|
| Auto-summary | claude-haiku-4-5 | 500 | ~$0.0001 | 20-50 (new tasks) |
| Related-docs | claude-haiku-4-5 | 1,000 | ~$0.0002 | 5-15 (keyword matches) |
| Staleness detector | N/A | 0 | $0 | 1 (daily cron) |
| **Total/day** | | | **~$0.005–0.015** | |

Daily AI spend is capped at ~$0.015/day = ~$0.45/month. Well within acceptable.

---

## What State Carry-Over Prevents

Without state:
- Auto-summary runs every time the task is viewed → burns $0.001 × 500 views = $0.50/task
- Related-docs suggester re-runs on every edit → burns API on minor typo fixes

With state:
- `ai_summary` is set once, re-used for all subsequent views
- `ai_related_docs` refreshes only when `notes` length changes by >50 chars
- `last_ai_ping` prevents staleness pings from becoming noise

---

## PR Plan

| PR | Repo | What |
|----|------|------|
| 1 | ZAOcowork | Supabase migration + 3 nullable columns |
| 2 | ZAOcowork | `/api/tasks/[id]/summarize` route (Capsule 1) |
| 3 | ZAOcowork | Related-docs suggester (Capsule 2) — keyword grep, no vector DB |
| 4 | ZAOcowork | Staleness detector (Capsule 3) — SQL threshold, no LLM |
| 5 | ZAOcowork | Board UI: show `ai_summary` in task cards, `ai_related_docs` as chip list |

PRs are small and independent. Start with PR 1+2 to prove the pattern, then ship 3-5.

---

## What This Unlocks

- **Morning brief gets smarter:** ZOE pulls `ai_summary` from task instead of truncating `notes`
- **Research docs get surfaced:** Zaal can see "related: doc 1311, doc 1312" on ZABAL tasks without leaving the board
- **Stale task noise reduced:** ZOE only pings about the 3 most stale tasks, not all 40 in_progress rows

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1085 | DreamLoops architecture (capsule pattern, state backend) |
| doc 1086 | Cross-ecosystem verdict: DO NOT refactor ZOE, new agents + new capsules only |
| doc 1091 | Expanded capsule catalog — task-intelligence capsule idea in §4 |
| doc 1115 | Repo estate audit, Move 3: wire DreamLoops into zaocowork |
