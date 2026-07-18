# Board -> Assignment Bridge Specification

## Overview

This spec describes HOW task rows on the cowork board (public.tasks) transition into agent assignments (agent_runs). This is the "glue" between the human plane (Telegram + UI) and the machine execution plane (agents).

**SCOPE:** This spec describes the DATA FLOW and MECHANISM. It does NOT build the live workflow in n8n - that's a gated step (Zaal approves after this PR).

## Mechanism: Two Options (Pick One)

### Option A: Supabase Edge Function (Recommended for Speed + No External Deps)

When a task row status changes to "ready-for-agent" (via Telegram button or UI):

1. **Trigger:** `public.tasks` INSERT/UPDATE with status = 'ready-for-agent'
2. **Supabase Edge Function:** Fires automatically (Supabase webhook on UPDATE)
3. **Function Logic:**
   - Read the task row (id, title, description, assignee field, visibility)
   - Build an AssignmentEnvelope from the task + default context
   - Insert a NEW row into agent_runs with status='queued', assignment_id=UUID, idempotency_key=hash(task_id+title)
   - Post a summary to Telegram #zaostock-agents group: "Assignment 123 queued for @zol, objective: [task title]"
4. **Return:** `{ success: true, agent_runs_id: "..." }` or `{ error: "reason" }`

**Pros:** Fast, no external API, Supabase handles retry logic.
**Cons:** Limited context (what if you need to fetch from Notion later? Edge functions would need to hit external APIs).

### Option B: n8n Workflow (Existing Pattern in ZAOOS, More Flexible)

When a task row status changes to "ready-for-agent":

1. **Trigger:** n8n poll of Supabase (scheduled, e.g., every 2 minutes) OR Supabase webhook URL pointing to n8n
2. **n8n Workflow:**
   - **Step 1:** Fetch tasks with status='ready-for-agent' AND not yet processed
   - **Step 2:** For each task, build an AssignmentEnvelope using "Build Envelope" HTTP step (calls a helper API or does it inline)
   - **Step 3:** INSERT into agent_runs via Supabase SQL API (or a simple INSERT webhook)
   - **Step 4:** UPDATE public.tasks status to "in-progress" + set field "assignment_id" to the new agent_runs.id
   - **Step 5:** Post to Telegram via ZOE API or webhook
   - **Step 6:** Mark as processed (optional: set a flag on the task)
3. **Idempotency:** Use n8n's built-in "Continue if already exists" or check idempotency_key before inserting

**Pros:** Flexible, can add context fetches (e.g., from docs, external APIs), matches existing n8n patterns in ZAOOS.
**Cons:** External dependency (n8n must be running), higher latency.

## Existing n8n Workflows (Reference)

ZAOOS has existing workflows for similar patterns - reference these when wiring the bridge:

- **Doc 1002:** Notion -> Supabase sync (polling pattern)
- **Doc 1003:** Discord event -> task creation (webhook pattern)
- **Doc 1005:** Telegram -> Supabase action trigger (webhook pattern)

These workflows show:
- How to authenticate with Supabase (API key + URL)
- How to handle retry logic
- How to post back to Telegram (ZOE bot token or webhook)

Use the same patterns for the board -> assignment bridge.

## Data Shape: Task -> AssignmentEnvelope Mapping

When a task transitions to "ready-for-agent", map its fields to AssignmentEnvelope:

| Task Field | Envelope Field | Notes |
|-----------|----------------|-------|
| id | taskId | Reference only (not a foreign key) |
| title | objective | What work is being done |
| description | contextReferences[0] | Add as a code_snippet reference |
| assignee (the "which agent" field) | suggestedAgent | Routing hint (not binding) |
| visibility | visibility | Keep team/private/public |
| labels/tags | requiredCapabilities | If task is tagged 'needs:farcaster', add to array |
| linked research docs (if any) | contextReferences | Add as 'doc' references |
| created_at | (ignore) | Agent system will set created_at |
| owner/created_by | requestedBy | Who asked for this work |

## Gated Steps (Zaal Must Do These)

1. **Choose mechanism** (Edge Function or n8n) - update this spec with the choice
2. **Create Supabase edge function OR n8n workflow** - after migration applied
3. **Wire secrets:**
   - If Edge Function: Supabase will have the database connection already (built-in)
   - If n8n: Create n8n secret (Supabase API key + URL, Telegram bot token for posts)
4. **Test the bridge:** Create a task, set status to "ready-for-agent", verify:
   - agent_runs row is created
   - status=queued
   - Telegram message posted to #zaostock-agents
5. **Start ZOE routing logic** (next phase, doc 1411) - once the bridge is live, ZOE picks up queued rows

## Failure Handling

### Retry Strategy

- If the INSERT into agent_runs FAILS (e.g., idempotency_key collision): do NOT retry the assignment create, but DO update the task status back to "backlog" and post an error to Telegram
- If the Telegram post FAILS: log it, do NOT fail the whole bridge (silent failure is acceptable here - the work still started)
- If the task row is missing by the time the bridge runs: skip silently (task may have been deleted)

### Edge Cases

- **Duplicate assignments:** If the same task ID is processed twice (e.g., two n8n runs), the idempotency_key will catch it (unique constraint). The second run will error - handle gracefully (log, do not crash).
- **Task status reverts:** If a task goes back to "backlog" after being "ready-for-agent", the corresponding agent_runs row stays in "queued" (do NOT delete or cancel it automatically - let Zaal decide via Telegram).
- **Large batch:** If many tasks transition at once (e.g., Zaal marks 10 tasks ready), the bridge should queue them all (may take a minute to route if n8n polls every 2 min, but that's OK).

## Deployment Order

1. **Migrate:** Apply `scripts/1410-agent-control-plane.sql` (creates agent_runs + receipts)
2. **Bridge:** Wire the edge function OR n8n workflow
3. **Test:** Create a task, transition it, watch agent_runs row appear
4. **Routing:** Implement ZOE routing (doc 1411) - picks up queued rows, assigns agents
5. **First real run:** A task completes its full loop (human -> assignment -> agent executes -> result posted back)

## Monitoring + Debugging

- **Query:** Check if agent_runs is filling up: `SELECT COUNT(*) FROM agent_runs WHERE status='queued'`
- **Logs:** If n8n, check n8n execution history (shows which tasks were processed, any errors)
- **Telegram:** Look for status posts in #zaostock-agents to confirm assignments are being created
- **Stalls:** If agent_runs rows pile up in 'queued' status, the routing layer (ZOE) is not running or not assigning. Check ZOE logs (next phase).

## Next Phase: Doc 1411

Once this bridge is live and working, the next phase (doc 1411) implements:
- ZOE routing logic: picks up queued agent_runs, assigns_agent based on capability match
- Agent claim + execute: agent receives assignment from agent_runs, starts work
- Result posting: agent updates agent_runs status, posts to Telegram + board

This bridge (doc 1410) is just the first half - getting work INTO the execution plane. The routing + execution is next.
