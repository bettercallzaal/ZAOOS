---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 601, 888, 973, 978
original-query: "Research the ZAO assistant + todo workflow we built this session and what more we can do with it - one Supabase tracker as source of truth -> 3 doors (Claude/ZOE/board), auto-tagging, delegation lanes, research-grind loop, clipboards, top-3 surfacing. Research external best practices and produce a prioritized improvement backlog."
tier: STANDARD
---

# 983 - The ZAO assistant + todo workflow: what we built, what to build next

> **Goal:** We built a real personal-assistant workflow this session (one tracker, three doors, auto-tagging, delegation lanes, a research-grind loop). This doc grounds it against 2026 best practice and hands back a prioritized backlog of what to build next - so the system keeps up with how Zaal actually works (many parallel agent threads, scarce human judgment).

## Recommendations (build in this order)

| # | Build | Why | Effort | Value |
|---|-------|-----|--------|-------|
| 1 | **Owner-axis on tasks** (`me` / `agent` / `review` / `blocked`) | The #1 finding: with parallel agents the bottleneck is judgment, not execution. The board shows status but not "what needs YOU vs what an agent can take." | MED | HIGH |
| 2 | **Weekly review routine** (ZOE cron, Sunday) | GTD's "reflect" step catches the silent failure - a task with no next action or no date. We have 52 undated tasks right now; nothing surfaces the stale ones. | LOW | HIGH |
| 3 | **ZOE morning briefing pulls top-3 + "decisions waiting on you"** | ZOE already has a Morning Briefing routine; wire the tracker's top-3 + review-queue into it so the surfacing is automatic, not hand-run. | LOW | HIGH |
| 4 | **Auto-tag on creation** (classifier at the write path) | We batch-tagged 54 items once; new tasks land untagged. Classify brand/theme/work-type when any door creates a task. | MED | MED |
| 5 | **Auto-route `research-queue` -> research loop** | 4 items are tagged `delegated_to=research-queue` but nothing picks them up. A scheduled grind should drain that lane into docs (like 974-980). | MED | MED |
| 6 | **Theme filter chip in the board UI** | The auto-tagger writes `metadata.themes` (web3/ai/music...) but the board can't filter on it yet. Small UI change closes the loop. | LOW | MED |
| 7 | **HITL checkpoint classes on actions** (trivial / reversible / irreversible) | Formalize what the assistant already does ad-hoc: soft-archive = reversible (auto-OK), PR-merge-to-live = irreversible (gate on Zaal). | MED | MED |

## What we built (grounded in the system)

**One source of truth -> three doors.** Every task lives in the Supabase cowork tracker (`tasks` table, project `etwvzrmlxeobinrlytza`). Three interaction surfaces read/write it:
1. **Claude terminal** (this session) - creates, tags, archives, drafts via REST.
2. **ZOE Telegram** (`@zaoclaw_bot`) - notifications + capture; has live routines (Morning Briefing, Lunch Ping, Nightly Processor).
3. **The board app** (`ZAODEVZ/ZAOcowork`, thezao.xyz) - `getActions()` in `src/lib/data.ts` loads the board; `TaskRoom.tsx` is the rich detail (status, priority, due, comments, dependencies); `Board.tsx` has filters + saved views. As of this session (PR #118) personal items fold into `/board` + `/my-work`.

**Auto-tagging.** A keyword classifier tagged all 54 active items with **brand** (`brands[]`, filterable now), **work-type** (`category`, the board's canonical enum), and **theme** (`metadata.themes`: web3/ai/music/events/growth/governance/research).

**Delegation lanes.** Items route off the active list via `metadata.delegated_to`: a dedicated **fractal build terminal** (4 items), the **ZOL agent** (1), a **research queue** (4). Plus a `bucket=later` lane (4 items) and the archive.

**The research-grind loop.** A self-paced loop shipped **7 docs (974-980)** in this session, one per tick, each: reserve number -> write -> secret-scan -> PR -> tracker update -> ZOE ping. Human-out-of-the-loop for the research, human-in-the-loop for the merge.

## What 2026 best practice says (external)

The strongest, most consistent finding across six sources: **the constraint has moved from execution to judgment.** GTD assumed one human, one task, serial attention; with parallel agents "the next action is deciding which thread gets your judgment next" (Jay Schulman). The to-do list splits into three lanes GTD never had: **threads in flight**, **decisions waiting on you**, **outputs to review**. The review queue is "the new inbox, and it fills faster than the old one ever did."

Concrete patterns worth adopting:

- **Next-action-owner axis** (Personal Task Assistant, dev.to): tasks carry both `status` AND an owner (`me` / `agent` / `unassigned`), and the value is the *filtered queue* - "what do I do / what can the agent do / what's ready for review / what's blocked / what's overdue." Their agent-queue endpoint returns a summary: `{active, overdue, due_soon, agent_ready, human_input, review, blocked}`.
- **HITL checkpoint classes** (Knowlee): the agent classifies its own actions as **trivial** (auto-approve, log only), **reversible** (approve in batches, async, even after the fact), or **irreversible** (approve synchronously, before acting). "Review the irreversible class carefully, the reversible class quickly, the trivial class never."
- **LLM-as-GTD-maintainer with review cadences** (stakiran gist): the human captures/decides/executes; the LLM owns the *maintenance* - sorting, retagging, and running **daily / weekly / monthly / yearly reviews**. The weekly review's job is to catch "the project with no next action - the silent failure that rots the whole system."
- **One bounded step per agent + run record** (cloudbuddyapps): each agent owns one repeatable move (classify/extract/draft/route), sensitive actions stay gated, and every run logs what it saw/did/who reviewed.
- **Classifier router** (simaba/agent-orchestration): a classifier agent routes tasks to the right specialist by declared capability - the pattern behind our auto-tagger + delegation lanes.

## Gap analysis (our system vs the patterns)

| Pattern | Do we have it? | Gap |
|---------|---------------|-----|
| Single source of truth | YES - the tracker | none |
| Multi-door capture | YES - Claude/ZOE/board | none |
| Auto-classification | PARTIAL - batch only | not on the write path (Rec #4) |
| Delegation lanes | YES - `delegated_to` | no auto-pickup for the research lane (Rec #5) |
| **Owner-axis (me/agent/review)** | **NO** - only status + owner_id | **the biggest gap (Rec #1)** |
| **Review cadence** | **NO** | 52 undated tasks, nothing surfaces stale (Rec #2) |
| Top-3 / decisions-waiting surfacing | PARTIAL - hand-run | not wired into ZOE's routine (Rec #3) |
| HITL checkpoint classes | INFORMAL | not encoded (Rec #7) |
| Run record / audit trail | PARTIAL - task notes | good enough for now |

## Also See

- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the 5-surface cleanup this workflow sits on top of.
- [Doc 888](../../agents/888-zoe-improvements-reliability-memory-routing/) - ZOE reliability/routing (the door that would run Rec #2 and #3).
- [Doc 978](../../business/978-zao-numbers-framing/) - the numbers-framing doc (velocity metrics would extend it).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a `next_owner` field (me/agent/review/blocked) to the tracker + surface it as a board lane and a `/my-work` split | @Zaal | PR | 2026-07-20 |
| Ship a ZOE weekly-review cron (Sunday AM): list undated P1s, tasks with no next action, stalled >14d, and ask Zaal to date/re-scope each | @Zaal | Bot task | 2026-07-20 |
| Wire the tracker top-3 + "decisions waiting on you" into ZOE's existing Morning Briefing routine | @Zaal | Bot task | 2026-07-13 |
| Add a classifier call to the task write-path so new tasks auto-tag brand/theme/work-type on creation | @Zaal | PR | 2026-07-27 |
| Add a board filter chip for `metadata.themes` so web3/ai/music are filterable in the UI | @Zaal | PR | 2026-07-27 |
| Schedule a research-grind loop to drain `delegated_to=research-queue` into ZAOOS docs (like 974-980) | @Zaal | Loop | 2026-07-13 |

## Sources

- [FULL] [Managing AI Agents: Beyond GTD's Single-Task Framework - Jay Schulman](https://jayschulman.com/blog/managing-ai-agents-beyond-gtds-single-task-framework) (2026-05-14) - the execution-to-judgment shift; the three new lanes; the four-question test.
- [FULL] [Agentic Workforce Management Frameworks 2026 - Knowlee](https://www.knowlee.ai/blog/agentic-workforce-management-frameworks-2026) (2026-04-30) - the six patterns; HITL trivial/reversible/irreversible checkpoint classes.
- [FULL] [Stop Figuring Out What to Delegate to AI - dev.to (Personal Task Assistant)](https://dev.to/j3d1_fm/stop-figuring-out-what-to-delegate-to-ai-2ngc) (2026-06-05) - the next-action-owner axis (me/agent/unassigned) + agent-queue summary endpoint. Community source.
- [FULL] [GTD with an LLM as maintainer - stakiran gist](https://gist.github.com/stakiran/e083530ca04c2466657b2314b50fb715) - capture/clarify/organize/reflect/engage with the LLM owning maintenance + the four review cadences. Community source.
- [FULL] [Agent Queues: How AI Turns Backlogs Into Systems - CloudBuddy](https://cloudbuddyapps.com/blog/agent-queues-backlogs-systems/) (2026-06-16) - one bounded step per agent, review lane in the workflow, run record.
- [FULL] [Managing 5+ AI Agents Without Chaos - Ivern AI](https://ivern.ai/blog/ai-task-management-best-practices-multiple-agents) (2026-05-01) - single task queue, specialized assignment, tiered review, weekly quality audit (sample 10-20%).
- [FULL] [simaba/agent-orchestration](https://github.com/simaba/agent-orchestration) (2026-03-29) - classifier-router + delegation pattern catalog. Community source.
- [FULL] Our system: `src/lib/data.ts` (getActions), `src/components/TaskRoom.tsx`, `src/components/Board.tsx` in ZAODEVZ/ZAOcowork; the Supabase `tasks` table. Read 2026-07-06.
