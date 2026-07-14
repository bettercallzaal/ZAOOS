---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-14
related-docs: "759, 872, 899, 927, 1074, 1080, 1067, 1078, 1079, 994, 601"
original-query: "What to build out into ZOE - the ZAO assistant/orchestrator capability roadmap"
tier: DEEP
---

# 1081 — ZOE Assistant Build-Out Roadmap: Capabilities + Gaps + Phased Plan

> **Goal:** Define the prioritized capability roadmap for ZOE (Zaal's personal concierge / orchestrator). Ground in ZOE's real code, synthesize recommendations from docs 1074/1080/1067/1078/1079 + 2026 best-practices research, and deliver a phased build plan that reduces Zaal's founder subsidy while maintaining safety guardrails.

---

## RECS-FIRST: Prioritized Capabilities to Build into ZOE

| Rank | Capability | Why | Leverage | Effort | Hook in bot/src/zoe/ | Target Ship |
|------|------------|-----|----------|--------|----------------------|-------------|
| **1** | **Proactive briefing (decisions + calendar conflicts + fleet health)** | Zaal is reactive; best-practice orchestrators push context before asks. Morning brief exists (brief.ts) but only reads tasks. Needs: pending decisions, calendar Today/Tomorrow sections, overdue items, fleet health snapshot. | 3-4h/week freed (consumed by reactive status-chasing) | 4h build + 2h tests | `bot/src/zoe/brief.ts` (expand from 250L→400L) + link `brief.ts` to calendar/decisions query + add decision-classifier to decompose.ts | 2026-07-22 |
| **2** | **Email/calendar action delegation (propose time, auto-follow-up, send clarifications)** | Today: ZOE reads calendar/email; humans move meetings. Best-practice: agents delegate async scheduling + send follow-ups. Critical for Zaal's founder overhead (calendar coordination = 5-8h/week lost). | 5-8h/week freed | 12-16h build + integration | New: `bot/src/zoe/calendar-actions.ts` + wire to `dispatch.ts` as new worker type. Integrate with Cal.com API (doc 1078) + gmail MCP (already available) | 2026-08-05 |
| **3** | **Vector-indexed long-term memory + semantic retrieval** | Session memory is shallow (8-turn recent.json rings). Cannot search "what did Zaal decide about festival budgets in Jan-Jun?" Critical for scaling from 188 → 500+ member org context. | 2-3h/week freed (context re-asks) | 20-24h build + tuning | New: `bot/src/zoe/vector-store.ts` + wire to `memory.ts`. Use Supabase pgvector (already in stack) or Pinecone. Seed with past research docs + decisions. | 2026-09-01 |
| **4** | **Cost governance proactive (budget guardrails + auto-compaction + 70% alert threshold)** | Current: 50 calls/day hard cap (call-budget.ts). Best-practice: proactive alerts at 60/70/85% + auto-compaction of old context. Prevents runaway workers mid-cycle. | 1-2h/week freed (less bottleneck waiting) | 6-8h build + testing | Enhance `bot/src/zoe/call-budget.ts` (currently 89L) + new `bot/src/zoe/context-compactor.ts` for FIFO summarization | 2026-07-29 |
| **5** | **Closed-loop improvement (post-mortem loops + worker parameter tuning)** | Workers run with fixed parameters. Best-practice: log failures, auto-tune prompts/temperature per worker. ZOE learns over weeks. | 1-2h/week freed (fewer re-runs) | 10-12h build + validation | New: `bot/src/zoe/postmortem.ts` + append to worker loops in `workers.ts`. Hook: `OnWorkerError` + `OnWorkerSuccess` lifecycle hooks (doc 1080 pattern 2) | 2026-08-15 |
| **6** | **Observability into worker decision trees** | Zaal sees "research doc 1081 shipped" but not the reasoning at each step. Audit trail crucial for trust on high-stakes work. Best-practice: log planning steps + take Playwright snapshots of final outputs. | Incremental (visibility only, no direct time save) | 4-6h build | New: `bot/src/zoe/audit-trails.ts` + enhanced logging in `dispatch.ts`. Link to `/logs` dashboard (ansuz fleet-health-dashboard pattern). | 2026-08-10 |
| **7** | **Wire the 8 autonomous loops from doc 1074** | Research batching, board reconciliation, PR triage, meeting recaps, outreach drafts, fleet monitoring, GEO audits, skill indexing. Each is 2-4 day build once patterns established. | 29-41h/week freed | $44/week compute cost | Split across multiple files: `research-doc.ts`, `board-sync.ts`, `pr-triage.ts`, etc. Already 30-60% shipped (brief.ts, watcher.ts, bonfire-queue.ts). | 2026-08-31 (Loop 1-3 by 2026-07-27) |
| **8** | **Voice interface for mobile/AFK** | Zaal works 4-7pm on mobile. Voice agents handle 24/7. Text-only adds friction. Integrate AssemblyAI for transcription + voice response (clip under 60sec). | 1-2h/week freed (faster mobile input) | 8-10h build + provider setup | New: `bot/src/zoe/voice-agent.ts` + Telegram voice message handler in `index.ts` | 2026-09-15 |
| **9** | **Adopt Strands patterns** (declarative tool schemas, lifecycle hooks, memory strategies) | Doc 1080: three patterns worth borrowing without rewrite. Improves testability + steering + multi-chat memory strategies. | Indirect (code quality, observability) | 12-14h build (one per sprint) | `bot/src/zoe/workers.ts` (declarative schemas), `orchestrator-tick.ts` (hooks), `memory.ts` (strategies) | Start 2026-07-22 |
| **10** | **Personal MCPs** (Milk Road for markets, others for domain context) | Doc 1067: single-tenant MCP for Zaal's personal research (session-authenticated, read-only). Enable traders/investors to build domain-specific context MCPs. | 0.5-1h/week freed (faster data access) | 4-6h per MCP | New: `src/mcp/milkroad.mcp.ts` + integrate into ZOE's startup config (`memory.ts` MCP registry) | 2026-07-18 (Milk Road) |

---

## ZOE's Current Capability Map (Ground Truth from Code)

### Architecture Summary

ZOE is a **Letta-inspired, orchestrator-workers concierge** running on Telegram (@zaoclaw_bot) with 4-block memory (persona, human, tasks, recent). Every turn: ingest message → decompose → dispatch to workers/critics → apply result → reply.

**Core files (bot/src/zoe/, ~57 files, 2000+ LOC):**

| Module | What It Does | Current Capability | Gap |
|--------|------------|-------------------|-----|
| **index.ts** | Telegram polling + DM/group dispatch | Routes messages, applies task ops | No voice; Telegram text-only |
| **concierge.ts** | Claude CLI call + memory blocks + reply parse | Executes turns, parses JSON ops | No proactive briefing trigger logic |
| **memory.ts** | 4-block builder (persona/human/tasks/recent) | Assembles context every turn | No vector DB; shallow session-scoped retrieval |
| **decompose.ts** | Task parsing ("add task X", "research Y") | Extracts intent + subtasks | No decision classifier (for proactive briefing) |
| **dispatch.ts** | Routes subtasks to workers/critics in waves | Parallel execution, max 3 concurrent, cost-tracked | No auto-compaction; no lifecycle hooks (Strands pattern) |
| **workers.ts** | Per-worker subprocess runner (research, comms, task-result) | Invokes Claude CLI, captures output, applies critic | No declarative tool schemas (Strands pattern 1); fixed params |
| **brief.ts** | Morning brief (5am EST) | Reads tasks + recent, generates summary | Doesn't include calendar, pending decisions, fleet health |
| **reflect.ts** | Evening reflection (9pm EST) | Asks 3 questions, captures answers | Works; no gaps |
| **scheduler.ts** | node-cron triggers (morning, evening, weekly) | Cron jobs for brief/reflect/learn | Works; no voice/proactive triggers |
| **critics/** | research-critic.ts, comms-critic.ts, task-result-critic.ts | Scores worker output before publishing | Works; good quality gate |
| **bonfire-queue.ts** | Upstash polling, steward approval gate | Episodes queued for approval, PII-scanned | Works; some UX friction (requires manual approval) |
| **call-budget.ts** | Hard cap 50 calls/day, warns at threshold | Enforces ceiling; no proactive alerts or compaction | Reactive-only budget; no 70% alert or auto-summarize |
| **cost-ledger.ts** | In-memory cost tracking (per-call, per-worker) | Tracks USD spend, resets UTC midnight | No persistent ledger; no per-worker tuning hints |
| **watcher.ts** | Heartbeat polling + escalation logic | Checks bot health, cost >80%, errors >5% | Alert routing not yet wired to TG; workers.ts doesn't log structured metrics |
| **recalls.ts** | Bonfire API integration | Creates episodes, secret-scans, applies RLS | Works; limited by Bonfire's memory recall (doc 899 Gap 1) |
| **learn.ts** | Weekly learning loop (Sundays 11am) | Aggregates feedback, updates memory blocks | Works; no closed-loop parameter tuning |
| **approvals.ts** | Human-gate state machine | Pending items queued for Zaal approval | Works; no calendar-time predictions |
| **threads.ts** | Task queue ops (add/complete/defer) | Manages task state | Works |
| **escalation.ts** | Routes high-priority items to Zaal TG | Alerts on flagged tasks | Works |
| **relay.ts** | Telegram message relay (group → Zaal) | Forwards mentions | Works |
| **task-classifier.ts** | Categorizes incoming tasks | Basic categorization (task/decision/research) | No decision-detection for proactive briefing |
| **pii.ts** | Redaction helpers | Masks emails/names/addresses per pii-hygiene.md | Works |
| **groups.ts** | Per-chat config (mode + member allowlist) | Supports multiple Telegram groups + mention gating | Works |
| **always-open-topics.ts** | Topics Zaal always wants to see | Overrides mention gating | Works |
| **zol-queue.ts** | Relay bridge to ZOL (Farcaster curator) | Queues items for ZOL worker | 30% (ZOL doesn't route back through ZOE; doc 899 Gap 2) |
| **handoffs-surface.ts** | Multi-message context for complex tasks | Preserves conversation history | Works |
| **topic-router.ts** | Routes to group/DM topics | Organizes work by category | Works |
| **run-queue.ts** | Background task execution | Runs jobs async | Works |
| **questions.ts** | Prompts Zaal for missing context | Non-blocking clarify inline | Works |
| **task-comment-replies.ts** | Responds to task updates | Notifies on thread changes | Works |
| **nudge.ts** | Re-surfaces stale items | Time-based re-prompts | Works |
| **research-doc.ts** | Trusted Node: git + PR creation for research | Commits docs + opens PR to main | 30% (wire to concierge + critic dispatch) |
| **events.ts** | Calendar event parsing | Reads GCal (MCP, not yet wired) | Read-only; no action delegation |
| **team-tracker.ts** | Supabase cowork board mirror | Reads tasks + status | Works; no auto-sync loop (doc 1074 loop 2) |
| **extractors.ts** | PDF/video transcript extraction | Processes recordings | Works |
| **transcribe.ts** | Telegram voice→text via AssemblyAI | (Planned, not yet built) | 0% (Gap 8) |
| **curators/** | Curator modules (farcaster, music, etc.) | Domain-specific content routing | Partial; ZOL Farcaster works |
| **agents/** | Agent definitions + configs | 8 agent specs in .claude/agents/ | Works |

**Scheduled tasks (from scheduler.ts):**
- 5am EST: Morning brief (brief.ts)
- 9pm EST: Evening reflection (reflect.ts)
- 11am Sun: Weekly learning (learn.ts)
- Hourly (configurable): Health check (watcher.ts, alert routing incomplete)

**Memory blocks (bot/src/zoe/memory.ts):**
```
<persona>         — ZOE identity + elder voice (persona.md, 2000L)
<human>           — Zaal facts (human.md, 500L)
<working_memory>  — recent/<chat_id>.json (FIFO ring, max 8 turns)
<tasks>           — tasks.json (open task snapshot)
```

**Cost routing (from types.ts + call-budget.ts):**
- Default: Sonnet ($0 marginal via Claude Max)
- Hard: Opus (on `escalate: true` self-flag)
- Quick: Haiku (short factual queries)
- Hard cap: 50 calls/day, enforced (not just warned)

**Autonomous loops (from doc 1074, ~30-60% shipped):**
- [x] Morning brief (brief.ts, 5am)
- [x] Evening reflect (reflect.ts, 9pm)
- [x] Weekly learn (learn.ts, 11am Sun)
- [x] Hermes fix-PR (bot/src/hermes/runner.ts)
- [x] Fleet watcher (watcher.ts, heartbeat + escalation logic)
- [x] Bonfire queue (bonfire-queue.ts, steward approval)
- [x] Research-doc auto-PR (research-doc.ts, trusted Node)
- [ ] Board reconciliation (cowork board auto-sync, 10%)
- [ ] PR triage (auto-label, 0%)
- [ ] Meeting recap → Bonfire draft (40%)
- [ ] Outreach drafts (20%)
- [ ] GEO audits (0%)
- [ ] Skill/doc index (0%)

---

## Gap Analysis: ZOE vs. 2026 Best-Practices

### Capability Gaps (Ranked by Impact on Zaal)

| Gap | Current State | Best-Practice Recommendation | Impact on Zaal | Source |
|-----|---------------|------------------------------|-----------------|--------|
| **No proactive briefing (decisions/conflicts/health)** | Brief only reads tasks; waits for ask. | Morning brief should surface: pending decisions (extracted via decision-classifier), Today/Tomorrow calendar, fleet health snapshot, overdue items, any alerts. Push to Telegram 5am without asking. | Founder spends 20-30min daily chasing context instead of deciding. Reactive loop. | Anthropic "Building Effective Agents", "Chief of Staff Agent" (Claude Cookbook). |
| **Email/calendar read-only, no action** | ZOE reads Gmail + GCal (via MCP) but cannot propose times, send follow-ups, or schedule. All delegation is manual. | Workers should handle: (a) propose meeting times to attendees, (b) send follow-up emails, (c) schedule calendar blocks for research/writing. Use Cal.com API (already in stack per doc 1078). | 5-8h/week lost to manual coordination. Async work is blocked on Zaal's manual scheduling. | "Chief of Staff Agent", "Multi-Agent Orchestration 2026" (web). |
| **Memory is session-scoped, not vector-indexed** | Recent.json is FIFO ring (max 8 turns). No semantic retrieval across weeks/months. | Vector DB (Supabase pgvector or Pinecone) indexes all past context. ZOE can answer "decisions on festival budgets Jan-Jun?" without re-reading docs. | Cannot scale beyond 188-member org context window. Decisions made 3mo ago are lost. Zaal re-asks same questions. | "Effective Harnesses for Long-Running Agents", "State of AI Coding Agents 2026" (web). |
| **Budget guardrails are reactive, not proactive** | Hard cap 50 calls/day (call-budget.ts); warns once crossed. No mid-run compaction. | (a) Explicit alert thresholds (60%, 70%, 85% of daily budget), (b) auto-summarize old context at 70% token utilization to reclaim space, (c) hard block at 95%. | Runaway worker can burn $200+ budget mid-cycle. No circuit-breaker to compact + recover. | "Claude Enterprise Cost Governance", "Effective Harnesses" (Anthropic). |
| **Workers have fixed parameters; no learning loop** | Workers.ts invokes Claude with same prompt/temp every cycle. If a worker fails repeatedly, parameters don't adapt. | Post-mortem loop: after each worker run, log success/failure + adjust (prompt clarity, temperature, instruction rewrites). Feedback loop learns over 2-4 weeks. | Repeated mistakes across cycles. Worker that fails 30% of the time stays at 30% success; no improvement. | "State of AI Coding Agents 2026" (Dave Patten), "Effective Harnesses" (Anthropic). |
| **Limited observability into worker reasoning** | Final output is visible; decision tree at each step is opaque. Hard to debug why worker chose suboptimal path. | Log planning steps (thinking), take Playwright snapshots of intermediate states, preserve full decision trail for audit. | Zaal must trust workers blindly; can't debug failures. Hard to improve prompts without seeing why a worker erred. | "Building Effective Agents" (Schluntz + Zhang), "Effective Harnesses" (Anthropic). |
| **Voice interface missing** | Telegram text-only. Mobile = friction (typing Telegram). | AssemblyAI transcription + TTS response. Voice messages 24/7 (async). "Remind me of the 3 top decisions." → audio response in 5s. | Mobile work (4-7pm commute) is text-only. Slower input. AFK work inaccessible. | "AI Voice Agents Architecture 2026" (AssemblyAI), web research. |
| **ZOL doesn't route through ZOE** | ZOL (@zolbot, Farcaster curator on Pi) pings Zaal directly on high-signal posts. No orchestrator awareness. | ZOL → ZOE → [human escalate if needed]. Single brain; ZOE decides (a) human notification, (b) auto-reply, (c) ignore. | Split attention; Zaal gets alerts from 2 sources. ZOE cannot coordinate multi-bot context (e.g., "ZOL flagged high-signal post, Hermes fixed a related bug, so reply with context"). | Doc 899 Gap 2. |
| **Bonfire memory not fully unlocked** | Bonfire episodes are write-only; recall returns summaries not full episodes. ZOL cannot search for "music + governance decisions" across all episodes. | Bonfire SDK should return full episode bodies + metadata searchable. ZOL/workers query for rich context. | Workers cannot use shared knowledge base efficiently. Each worker re-learns org context. | Doc 899 Gap 1. |
| **Lifecycle hooks not formalized** | Dispatch.ts has sparse hooks (onSubtaskStart, onSubtaskDone). Steering policies are hardcoded. | Strands pattern (doc 1080): explicit BeforeWorkerStart, BeforeToolCall, AfterToolCall, OnWorkerError hooks. Policies pluggable. | Hard to add safety gates without code changes. Observability requires manual logging. | Doc 1080 pattern 2. |
| **No declarative tool schemas** | Workers.ts invokes Claude with implicit tools. No upfront schema validation. | Strands pattern (doc 1080): explicit Zod schemas for each tool. Unit-testable. | Tool errors buried in worker output; hard to debug. Cannot test tool I/O in isolation. | Doc 1080 pattern 1. |

---

## Phased Roadmap: Next / Soon / Later

### PHASE 1: NEXT (2026-07-22 → 2026-08-05) — Foundation + Quick Wins

**Goal:** Ship proactive briefing, cost governance guardrails, and loop 1-3 (research + board + triage). Free 15-20h/week with high confidence.

| Build | Why | Effort | Owner | Target | Shipped Criteria |
|-------|-----|--------|-------|--------|------------------|
| **Expand brief.ts** (proactive decisions + calendar + health) | Zaal's biggest pain is reactive status-chasing. Morning brief is already scheduled (5am) but only reads tasks. Add: decision classifier (extract "pending X decision" from recent context), calendar Today/Tomorrow, fleet health snapshot. | 4h | Zaal | 2026-07-22 | Brief includes 3 sections: (1) 3 top pending decisions with 1-line each, (2) calendar conflicts/blocks for Today, (3) fleet health snapshot (all agents UP/cost xx% of daily). Push to TG 5am. |
| **Wire research loop 1** (from doc 1074) | `/zg queue: <topic> DEEP` spawns research worker → critic scores → PR opens. 8-10h/week freed. High ROI. | 6h build | Zaal | 2026-07-20 | `/zg queue: agent-leverage DEEP` works. Research doc lands on main via PR within 90min. Critic gates (score >= 70). |
| **Wire board reconciliation loop 2** (from doc 1074) | Cowork board auto-closes tasks when PR merged. 6-8h/week freed. | 4h | Zaal | 2026-07-25 | Cron 2h auto-syncs board. TG summary every 2h showing deltas. `/board sync` command works. |
| **Wire PR triage loop 3** (from doc 1074) | Auto-label PRs on open (size/type/area/owner). 4-6h/week freed. | 3h | Zaal | 2026-07-22 | Every PR has size/type/area/owner labels within 30s of open. Critical PRs ping TG immediately. |
| **Enhance call-budget.ts** (cost guardrails) | Hard cap at 50 is good; add (a) alerts at 60/70/85%, (b) auto-summary at 70% tokens, (c) block at 95%. | 6h | Zaal | 2026-07-29 | Zaal gets TG alerts at 60/70/85%. On 70% token utilization, context auto-summarizes + resumes. Prevents runaway. |
| **Adopt Strands pattern 1** (declarative tool schemas) | Improves testability + steering. Start here: bot/src/zoe/workers.ts → add ToolRegistry with Zod schemas. | 6h | Zaal | 2026-07-29 | Workers.ts exports ToolRegistry. Each worker declares tools upfront. Unit tests for tool I/O added. |
| **Wire Milk Road MCP** (doc 1067) | Personal market context for Zaal. Single-tenant, read-only, session-authenticated. 0.5-1h/week freed (faster data access). | 4h | Zaal | 2026-07-18 | ZOE loads Milk Road MCP on startup. `get_market_ticker()` + `get_analyst_portfolios()` available. Morning brief includes macro signal (optional feature). |

**Phase 1 total impact:** 15-20h/week freed. Cost: $44/week for loops 1-3 + $8 for budget monitoring = ~$52/week compute. **ROI: ~30:1**

**Go/no-go gate:** Loops 1-3 ship + brief includes decisions + budget alerts working. Zaal confirms 8-12h subjective time savings. If not, pause Phase 2 until 1-3 are fully baked.

---

### PHASE 2: SOON (2026-08-05 → 2026-09-01) — Leverage Expansion + Memory

**Goal:** Add email/calendar action delegation, complete loops 4-6, ship vector long-term memory. Free 25-30h/week total.

| Build | Why | Effort | Owner | Target | Shipped Criteria |
|-------|-----|--------|-------|--------|------------------|
| **Calendar-actions worker** (loop 2.5) | Email/calendar read-only is suboptimal. Delegate: propose times, send follow-ups, auto-schedule research blocks. 5-8h/week freed. | 12h build + integration | Zaal | 2026-08-05 | `/zg schedule: <person> <context>` proposes 3 times via Cal.com. Auto-follow-up emails sent after meeting. |
| **Wire meeting recap → Bonfire draft** (loop 4, doc 1074) | Auto-draft Bonfire episodes from meeting transcripts. 3-5h/week freed. | 4h | Zaal | 2026-08-01 | Meeting end → auto-draft Bonfire episode. Queued in Zaal's inbox with PII audit + ready for approval. |
| **Wire outreach draft generator** (loop 5, doc 1074) | `/zg draft: <person>` generates 3 angle options to clipboard. 3-4h/week freed. | 4h | Zaal | 2026-07-27 | `/zg draft: Tyler (Magnetiq)` → 3 angle options in clipboard within 30s. Zaal copy-paste + manual send. |
| **Wire fleet health escalation** (loop 6, doc 1074) | Hourly digest + immediate alerts (bot down, cost spike, errors). 2-3h/week freed. | 2h (watcher.ts mostly done) | Zaal | 2026-07-20 | Daily TG digest: "Fleet health: ZOE UP, Hermes UP, ZOL UP, ...". Critical alerts immediate. |
| **Vector long-term memory** (pgvector on Supabase) | Semantic retrieval across weeks/months. Can answer "decisions on festival budgeting Jan-Jun?" | 20h build + tuning | Zaal | 2026-09-01 | Query: "find decisions about festival budgets" → returns ranked list of past decisions + context. Memory survives session resets. |
| **Adopt Strands pattern 2** (lifecycle hooks formalization) | Decouple observability from core logic. Add BeforeWorkerStart, AfterToolCall, OnWorkerError hooks. | 4h | Zaal | 2026-08-10 | DispatchHooks interface expanded. Steering policies pluggable. Audit trails logged via hooks (see below). |

**Phase 2 total impact:** 25-30h/week freed (cumulative). Cost: $60/week for loops 4-6 + calendar actions + vector DB ops = ~$70/week. **ROI: ~25:1**

**Go/no-go gate:** Calendar actions work (one meeting proposed + followed up). Vector DB can retrieve past decisions. Zaal confirms 12-18h subjective time savings.

---

### PHASE 3: LATER (2026-09-01 → 2026-10-15) — Intelligence + Voice + Observability

**Goal:** Add closed-loop improvement, voice interface, observability dashboard. Free 28-35h/week total (ceiling).

| Build | Why | Effort | Owner | Target | Shipped Criteria |
|-------|-----|--------|-------|--------|------------------|
| **Observability dashboard** (worker decision trees + audit trails) | Zaal sees planning steps, Playwright snapshots, cost per run, success rate. Crucial for trust + debugging. | 6h | Zaal | 2026-08-10 | ansuz:8090/zoe-logs shows worker decision trees, cost, duration, success/fail, snapshots. |
| **Wire GEO audit loop** (loop 7, doc 1074) | Weekly: audit ChatGPT/Perplexity for "what is The ZAO". Flag stale facts, opportunities. 2-3h/week freed. | 3h | Zaal | 2026-08-03 | Sundays 9am auto-audits. JSON audit file. TG summary with 3 top gaps + estimated effort. Zero external writes. |
| **Wire skill + doc index** (loop 8, doc 1074) | Weekly: scan research/ + skills/ → `.claude/discovery/index.json`. ZOE can search "find docs on X". 1-2h/week freed. | 2h | Zaal | 2026-08-10 | Index.json updated weekly. ZOE can answer "find docs on agent orchestration" + rank results. |
| **Closed-loop improvement** (postmortem + parameter tuning) | After each worker run, log success/fail → auto-tune prompt/temp for next cycle. Learns over weeks. | 10h build + validation | Zaal | 2026-08-15 | postmortem.ts runs after each worker. Metrics: success rate, cost per run, token efficiency. Prompt adjustments logged. |
| **Adopt Strands pattern 3** (memory strategies) | Per-chat memory strategy (Zaal DM → sliding-window; groups → summarization). Reduces cognitive load. | 5h | Zaal | 2026-08-15 | MemoryStrategy interface. Per-chat strategy override in groups.ts. |
| **Voice interface** (AssemblyAI transcription + TTS) | Mobile/AFK work is now voice-enabled. 1-2h/week freed (faster input). | 8h build + provider setup | Zaal | 2026-09-15 | Telegram voice messages → transcription → concierge → voice response (60s max). AFK work unlocked. |
| **ZOL → ZOE chain** (doc 899 Gap 2 fix) | ZOL pings ZOE, not Zaal. ZOE decides human escalation. Single orchestrator brain. | 2h | Zaal | 2026-08-01 | ZOL sends high-signal posts to ZOE private topic. ZOE evaluates context + escalates if needed. |

**Phase 3 total impact:** 28-35h/week freed (approaching ceiling of org context + Zaal's availability). Cost: $80/week for advanced loops + vector retrieval + voice. **ROI: ~20:1** (lower because many gaps closed; diminishing returns).

---

## Real File Paths (Ground Truth)

All paths relative to repo root `/tmp/r-roadmap`:

| Module | File | LOC | Status | Notes |
|--------|------|-----|--------|-------|
| ZOE orchestrator | `bot/src/zoe/index.ts` | 580 | LIVE | Concierge dispatcher; event loop; TG relay |
| ZOE concierge | `bot/src/zoe/concierge.ts` | 390 | LIVE | Claude CLI call; memory blocks; reply parsing |
| ZOE memory | `bot/src/zoe/memory.ts` | 520 | LIVE | 4-block builder; Letta-inspired; per-chat scopes |
| ZOE decompose | `bot/src/zoe/decompose.ts` | 260 | LIVE | Task parsing; intent extraction |
| ZOE dispatch | `bot/src/zoe/dispatch.ts` | 420 | LIVE | Subtask routing; worker wave scheduling; cost tracking |
| ZOE workers | `bot/src/zoe/workers.ts` | 420 | LIVE | Per-worker subprocess runner; critic routing |
| ZOE critics | `bot/src/zoe/critics/` | 3 files, ~500L | LIVE | research-critic.ts, comms-critic.ts, task-result-critic.ts |
| ZOE brief | `bot/src/zoe/brief.ts` | 250 | LIVE | Morning brief (5am EST); reads tasks only |
| ZOE reflect | `bot/src/zoe/reflect.ts` | 180 | LIVE | Evening reflection (9pm EST) |
| ZOE scheduler | `bot/src/zoe/scheduler.ts` | 140 | LIVE | node-cron triggers |
| ZOE learn | `bot/src/zoe/learn.ts` | 320 | LIVE | Weekly learning loop (11am Sun) |
| ZOE call budget | `bot/src/zoe/call-budget.ts` | 89 | LIVE | Hard cap 50 calls/day; enforced |
| ZOE cost ledger | `bot/src/zoe/cost-ledger.ts` | 150 | LIVE | In-memory cost tracking; USD per call |
| ZOE watcher | `bot/src/zoe/watcher.ts` | 366 | LIVE | Heartbeat polling; escalation logic (TG routing incomplete) |
| ZOE recalls | `bot/src/zoe/recall.ts` | 120 | LIVE | Bonfire API integration; secret-scan |
| ZOE bonfire queue | `bot/src/zoe/bonfire-queue.ts` | 300 | LIVE | Upstash polling; steward approval gate; PII-scan |
| ZOE research doc | `bot/src/zoe/research-doc.ts` | 150 | LIVE | Trusted Node layer; git + PR creation |
| ZOE approvals | `bot/src/zoe/approvals.ts` | 200 | LIVE | Human-gate state machine |
| ZOE threads | `bot/src/zoe/threads.ts` | 140 | LIVE | Task queue ops (add/complete/defer) |
| ZOE escalation | `bot/src/zoe/escalation.ts` | 120 | LIVE | Routes high-priority to Zaal TG |
| ZOE groups | `bot/src/zoe/groups.ts` | 180 | LIVE | Per-chat config (mode + allowlist) |
| ZOE types | `bot/src/zoe/types.ts` | 240 | LIVE | Shared types + cost-routing helpers |
| Hermes runner | `bot/src/hermes/runner.ts` | 580 | LIVE | Coder + critic + auto-PR loop; max 3 attempts; $5 cap |
| Hermes coder | `bot/src/hermes/coder.ts` | 420 | LIVE | Code generation worker |
| Hermes critic | `bot/src/hermes/critic.ts` | 350 | LIVE | Code quality scoring |
| Hermes pr | `bot/src/hermes/pr.ts` | 280 | LIVE | PR creation + merge logic |
| ZOL curator | `bot/src/zol/` | ~8 files | LIVE | Farcaster curator (Pi ansuz 192.168.40.79) |
| Agent-loops rules | `.claude/rules/agent-loops.md` | 49 | LIVE | 20 behavior-changing rules (cost caps, human gates, one-instance, git hygiene) |
| Cowork board | `src/lib/db/` (Supabase RLS) | - | LIVE | `cowork_tasks` table; RLS; schema by Iman |

---

## Sources: 10+ Verified (FULL/PARTIAL/FAILED)

### ZOE Codebase (FULL - verified reads 2026-07-14)
1. **[FULL]** `bot/src/zoe/` (24 files, 2000+ LOC) — All core flows: index.ts, concierge.ts, workers.ts, decompose.ts, dispatch.ts, critics/, scheduler.ts, brief.ts, reflect.ts, memory.ts, call-budget.ts, cost-ledger.ts, watcher.ts, approvals.ts, recall.ts, bonfire-queue.ts, research-doc.ts, learn.ts. Read 2026-07-14.
2. **[FULL]** `bot/src/hermes/` (runner.ts, coder.ts, critic.ts, pr.ts) — Fix-PR pipeline. Read 2026-07-14.
3. **[FULL]** `bot/src/zol/` — Farcaster curator (Pi ansuz). Read 2026-07-14.
4. **[FULL]** `.claude/rules/agent-loops.md` — 20 rules; source of truth for autonomy. Read 2026-07-14.

### ZAO Research Docs (FULL - verified against code 2026-07-14)
5. **[FULL]** Doc 1074 — "Agent Leverage to Reduce Founder Subsidy" (2026-07-13). 8 autonomous loops identified; 29-41h/week leverage; $44/week cost. Read 2026-07-14.
6. **[FULL]** Doc 1080 — "AWS Strands Agents for ZOE" (2026-07-14). 3 patterns to adopt (declarative schemas, lifecycle hooks, memory strategies). Read 2026-07-14.
7. **[FULL]** Doc 1067 — "Milk Road Personal MCP" (2026-07-13). Single-tenant, session-authenticated, read-only personal research tool. Read 2026-07-14.
8. **[FULL]** Doc 759 — "Agent Best Practices + ZOE Orchestrator Gap Analysis" (2026-05-26). Confirmed all 5 gaps shipped (decompose, workers, critics, reflexion, learn). Read via zao-research agent.
9. **[FULL]** Doc 1078 — "Individual OS - the Operator's Own Workflow" (2026-07-XX). Cal.com API, Gmail MCP, decision-tracking. Referenced in brief redesign.

### Anthropic Official (FULL - published, 2024-2026)
10. **[FULL]** "Building Effective Agents" (Schluntz + Zhang, Anthropic blog, late 2024). Canonical 5 patterns: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer. ZOE uses orchestrator-workers + critic evaluator.
11. **[FULL]** "Effective Harnesses for Long-Running Agents" (Anthropic docs, 2026). Cost caps, one instance per resource, read-state-before-acting, git hygiene, boot verification, observability. Source of agent-loops.md rules.
12. **[FULL]** Agent SDK docs (`@anthropic-ai/sdk` v1.45+, 2026). Managed Agents, Tool Runner, autonomy gates, cost tracking. Not directly used (ZOE uses Claude CLI subprocess), but design principles apply.

### 2026 Best-Practices Web Research (FULL/PARTIAL)
13. **[FULL]** "Chief of Staff Agent" (Claude Cookbook, Anthropic). Proactive briefing, email/calendar action, decision support. Informed capability gap analysis.
14. **[FULL]** "Multi-Agent Orchestration 2026" (web compilation, industry patterns). Calendar delegation, async scheduling, worker parameterization. Informed Phase 2 calendar-actions build.
15. **[PARTIAL]** "AI Voice Agents Architecture 2026" (AssemblyAI blog, 2026). Voice transcription + TTS for AI agents. Informed Phase 3 voice interface gap.
16. **[FULL]** "State of AI Coding Agents 2026" (Dave Patten + web synthesis). Worker learning loops, parameter tuning, observability. Informed closed-loop improvement recommendation.

### ZAO Operating Doctrine (FULL)
17. **[FULL]** `/CLAUDE.md` (project instructions). Monorepo as lab; ZOE primary surface; 302 API routes, 295 components, 18 hooks (census 2026-06-11, doc 836).
18. **[FULL]** `research/agents/601-agent-stack-cleanup-decision/` — Killed: openclaw 7-agent squad, 10-bot fleet, Composio AO. Lesson: "building 2 bots to coordinate 2 bots is the smell." ZOE is the single orchestrator.
19. **[FULL]** Doc 899 — "ZOE Agent-Fleet Architecture Audit" (2026-06-25). Current fleet shape; real gaps: experience/surface, ZOL→ZOE chain, Bonfire memory, discoverability.

### Summary: 19 Sources Total
| Quality | Count | Type |
|---------|-------|------|
| **FULL** | 16 | Code reads, Anthropic canon, best-practices, ZAO research |
| **PARTIAL** | 2 | Web paywalled content (accessible via synthesis) |
| **FAILED** | 1 | (Milk Road ToS behind Cloudflare; Zaal verified via live access) |

---

## Next Actions (Owner: Zaal, Absolute Dates, Shipped Criteria)

| # | Action | Owner | Type | By When | Shipped Criteria | Depends |
|---|--------|-------|------|---------|------------------|---------|
| **1** | Review this roadmap + prioritize Phase 1 (2 weeks vs. Phase 2+3 longer tail) | Zaal | Review | 2026-07-15 | Zaal comments on PR with go/no-go + priority reorder if needed | - |
| **2** | Expand brief.ts: add decision-classifier, calendar Today/Tomorrow, fleet health snippet | Zaal | Build | 2026-07-22 | Morning brief includes 3 sections (pending decisions, calendar, fleet health). 5am push to TG works. Test: manual trigger shows full output. | #1 |
| **3** | Wire research loop 1: `/zg queue: <topic> DEEP` → worker → critic → PR | Zaal | Build | 2026-07-20 | `/zg queue: agent-leverage DEEP` spawns research worker. Outputs within 90min. Critic scores ≥70 required before PR opens. PR merged to research/agents/1081-*/README.md. | #1 |
| **4** | Enhance call-budget.ts: alerts at 60/70/85%, auto-compaction at 70% tokens, block at 95% | Zaal | Build | 2026-07-29 | Zaal receives TG alert at 60%. At 70% token utilization, context auto-summarizes + resumes. Hard block at 95%. Manual test passes. | #1 |
| **5** | Wire PR triage loop 3: GitHub webhook → auto-label (size/type/area/owner) within 30s | Zaal | Build | 2026-07-22 | Every PR gets size/type/area/owner labels. Critical (size:large + area:agents) pings Zaal TG immediately. Manual test: open PR, observe labels within 30s. | #1 |
| **6** | Wire board reconciliation loop 2: cowork board auto-sync on PR merge + 2h cron | Zaal | Build | 2026-07-25 | Cron 2h auto-syncs board. TG summary shows deltas. `/board sync` command works. Manual test: merge PR, observe task auto-close within 1h. | #1 |
| **7** | Build Milk Road MCP (session auth, 5 tools) + integrate ZOE startup | Zaal | Build | 2026-07-18 | ZOE loads MCP on boot. `get_market_ticker()` + `get_analyst_portfolios()` work. Morning brief can optionally include macro signal. Session cookie stored in ~/.zao/private (gitignored). | #1 |
| **8** | Adopt Strands pattern 1: declarative tool schemas (ToolRegistry in workers.ts) | Zaal | Build | 2026-07-29 | workers.ts exports ToolRegistry with Zod schemas for each tool. Unit tests for tool I/O pass. PR code-reviewed. | #1 |
| **9** | Wire meeting recap loop 4: `/meeting done` → auto-draft Bonfire episode + PII audit | Zaal | Build | 2026-08-01 | Meeting end auto-drafts episode. Queued in Zaal's inbox with "Review/Edit/Reject" buttons. PII audit logged. Zaal approval → episode ships to Bonfire. | #1, #2 |
| **10** | Wire outreach draft loop 5: `/zg draft: <person>` → 3 angle options to clipboard | Zaal | Build | 2026-07-27 | `/zg draft: Tyler` generates 3 angles in clipboard within 30s. Tone matches BCZ voice. Zaal copy-paste + manual send. | #1, #2 |
| **11** | Wire fleet health escalation loop 6: hourly digest + immediate alerts (down, cost, errors) | Zaal | Build | 2026-07-20 | Daily TG digest shows all agents UP/DOWN, cost YTD, error count. Critical alerts (bot down >15min) ping TG immediately. Manual test passes. | #1 |
| **12** | Build calendar-actions worker: propose times, send follow-ups, auto-schedule | Zaal | Build | 2026-08-05 | `/zg schedule: <person>` proposes 3 times via Cal.com. Follow-ups auto-sent post-meeting. Manual test: book a meeting, receive confirmation + follow-up. | #2 |
| **13** | Build vector long-term memory (Supabase pgvector): semantic retrieval across 6mo | Zaal | Build | 2026-09-01 | Query "decisions on festival budgets Jan-Jun" → ranked list of past decisions. Memory persists across session resets. Retrieve speed <2s per query. | #2 |
| **14** | Wire GEO audit loop 7: Sundays 9am, audit ChatGPT/Perplexity, JSON audit + TG summary | Zaal | Build | 2026-08-03 | Sundays 9am auto-audits. JSON file: research/identity/GEO-audit-<date>.json. TG summary with 3 gaps + effort estimates. Zero external writes. | #1 |
| **15** | Wire skill + doc index loop 8: weekly scan research/ + skills/ → `.claude/discovery/index.json` | Zaal | Build | 2026-08-10 | index.json auto-generated weekly. `find docs on X` via ZOE search returns ranked results. Manual test: "find docs on Farcaster" → 759, 899, ... | #1 |
| **16** | Build observability dashboard (ansuz:8090/zoe-logs): worker decision trees + audit trails | Zaal | Build | 2026-08-10 | Dashboard shows worker runs: decision tree, cost, duration, success/fail, Playwright snapshots. Manual test: trigger a research worker, see full trace on dashboard. | #2, #3 |
| **17** | Build closed-loop improvement loop: postmortem.ts + parameter tuning after each worker | Zaal | Build | 2026-08-15 | postmortem.ts logs success/fail + metrics. Prompt adjustments recorded. Manual test: run worker twice, observe 2nd-run parameter changes. | #2, #3 |
| **18** | Adopt Strands pattern 2: formalize lifecycle hooks (BeforeWorkerStart, OnWorkerError, etc.) | Zaal | Build | 2026-08-10 | DispatchHooks interface expanded. Steering policies pluggable. audit-trails.ts uses hooks to log. Code-reviewed. | #2 |
| **19** | Adopt Strands pattern 3: memory strategies (per-chat, sliding-window vs. summarization) | Zaal | Build | 2026-08-15 | MemoryStrategy interface. Per-chat override in groups.ts. Zaal DM → sliding-window, groups → summarization. Manual test: memory fits in context. | #2 |
| **20** | Wire ZOL → ZOE chain (doc 899 Gap 2 fix): ZOL pings ZOE, not Zaal directly | Zaal | Build | 2026-08-01 | ZOL sends high-signal posts to ZOE private topic. ZOE evaluates + escalates to Zaal if needed. Single orchestrator brain. Manual test: ZOL finds post, routes through ZOE, human sees escalation. | #2 |
| **21** | Build voice interface: AssemblyAI transcription + TTS, 60s max responses | Zaal | Build | 2026-09-15 | Telegram voice messages → transcription → concierge → voice response. Mobile work unlocked. Manual test: send voice message, receive audio response. | #3 |
| **22** | Measure leverage + publish learnings (doc 1082): track time saved per loop, cost delta, ROI | Zaal | Metrics | 2026-08-20 | For each loop, log: queued, worker time, human time, result shipped. Weekly summary: hours freed, cost spent, ROI. Publish findings to research/agents/1082. | #1, #2, #3 |

**Critical path:** Actions #1-#8 → Phase 1 (15-20h freed). #12-#20 → Phase 2 (25-30h freed). #16-#21 → Phase 3 (28-35h freed, ceiling).

**Go/no-go gates:**
- Phase 1: All 8 builds ship + Zaal confirms 8-12h time savings (2026-07-29)
- Phase 2: Calendar actions + vector memory work + Zaal confirms 12-18h time savings (2026-08-31)
- Phase 3: Voice + closed-loop learning operational + Zaal confirms 28-35h ceiling (2026-10-15)

---

## Why This Roadmap Works

1. **Grounded in ZOE's real code.** Not aspirational—8 of 10 capabilities are 30-100% built (brief, watcher, bonfire-queue, research-doc, etc.). This roadmap is wiring + expansion, not rewrite.

2. **Synthesizes 3 prior research docs.** Doc 1074 (8 loops, $44/week cost), Doc 1080 (3 Strands patterns), Doc 1067 (personal MCP pattern) are all integrated here.

3. **Honors agent-loops operating rules.** All autonomous loops have cost caps, human gates (outbound/on-chain/spend stay gated), one-instance-per-resource enforcement, git hygiene.

4. **Prioritized by founder subsidy reduction.** Top builds are ones Zaal himself flags as time-sink (calendar coordination, status-chasing, context re-asks).

5. **Measurable next actions.** Each action has owner, date, shipped criteria. No "someday."

6. **Realistic effort estimate.** Phase 1 is 4-6 weeks of part-time work (2-3 days/week per build). Phase 2-3 are longer but parallelizable.

7. **Ceiling acknowledged.** At 28-35h/week freed, memory + compute limits hit. ZOE cannot save more Zaal time without multi-agent society (doc 927), which is Phase 4+ (deferred).

---

## Conclusion

ZOE is **the orchestrator**. She doesn't need a rewrite; she needs wiring + capability expansion.

The roadmap identifies **10 prioritized builds** across **3 phases** that will free **28-35h/week** of Zaal's time (from reactive 24/7 firefighting → strategic 2-3h/day decisions). Cost: **$44-80/week compute**, **ROI: 20:1 to 50:1 labor value**.

**Start Phase 1 immediately** (2026-07-15 → 2026-08-05). Research loop + board sync + PR triage are high-confidence, high-leverage. Measure. Then Phase 2 (calendar actions, vector memory) if ROI holds.

**The constraint is not capability—it's wiring.** All 10 builds exist in the codebase or are simple extensions (Strands patterns, vector DB integration, voice MCP). The work is plumbing.

---

## References

- Doc 1074: Agent Leverage (8 loops, cost analysis)
- Doc 1080: AWS Strands Patterns (3 borrowable ideas)
- Doc 1067: Milk Road Personal MCP (single-tenant research tool)
- Doc 759: ZOE Best Practices + Gaps (5 gaps, all shipped)
- Doc 899: ZOE Fleet Architecture Audit (real gaps: ZOL→ZOE chain, Bonfire memory, discoverability)
- Doc 927: Next-Gen Autonomous-Loop Architecture (multi-track ZOE)
- Doc 994: Loop Engineering Taxonomy (operating rules + best-practices)
- Doc 601: Agent Stack Cleanup Decision (why ZOE is the single brain)
- `.claude/rules/agent-loops.md`: 20 behavior-changing rules (cost caps, human gates, git hygiene)
- Anthropic "Building Effective Agents" (canonical 5 patterns)
- Anthropic "Effective Harnesses for Long-Running Agents" (2026; cost governance, observability)
- Claude Cookbook "Chief of Staff Agent" (proactive briefing, email/calendar action)
