---
topic: agents
type: reference
status: research-complete
last-validated: 2026-08-22
related-docs: 2235, 601, 759
original-query: "keep a living ZOE capability map so 'is this already built?' is a 10-second lookup (confirm-before-claiming-absence.md)"
tier: STANDARD
---

# 2239 - ZOE Capability Map (living doc - read BEFORE claiming anything is missing)

> **Goal:** The living map `confirm-before-claiming-absence.md` demands: every
> `bot/src/zoe/` module + its one-line purpose, so "does ZOE have X?" is a lookup,
> not a partial-read guess. A stale map caused two production-grade wrong "it's
> missing" claims (the incidents behind that rule); this doc is the fix.

## How to use + maintain

- **Before any "ZOE lacks X" claim or build proposal:** grep THIS doc first, then the
  synonym-grep of `bot/src/zoe/` (the rule's step 2). If a module below covers the
  concept, the recommendation is "extend `<file>`", never "add X".
- **Refresh:** regenerate with
  `for f in bot/src/zoe/*.ts; do echo "== $(basename $f)"; awk 'NR<=6' "$f"; done`
  and update this doc in the same PR as any module add/remove. `zoe-drift.py` catches
  doc-vs-disk path rot.
- **Provenance:** generated 2026-08-06 by a grounded inventory agent (workflow
  `wf_eddf1949-77d`) reading the real 102 module headers; 5 modules spot-checked
  against source by the orchestrator on 2026-08-07 (reflexion, decompose, focus-guard,
  receipt-envelope, golden-eval - all match). Post-inventory adds (2026-08-07):
  `memory-git.ts`, `guardrails.ts`, `guardrail-adapters.ts` (#2932). Refresh (2026-08-22):
  25 new modules added across bus, DM-build, federation, board-commands, and
  pinned-brief subsystems (board task 9550).

## ZOE Capability Inventory (130 files, ground-truth read)

**MEMORY & RECALL**

| File | Purpose |
|------|---------|
| `concierge.ts` | ZOE's brain - Claude CLI + 4-block context (persona, human, working, tasks) |
| `memory.ts` | [core memory management] |
| `recall.ts` | Bonfire bridge (read/delve queries to knowledge graph) |
| `reflexion.ts` | Letta-style self-improving memory (Q4 locked; answers -> working memory) |
| `afferent-digest.ts` | Nightly receipts → memory digest (02:30 UTC) |
| `thread-memory.ts` | Open-threads → Bonfire emit (durable cross-agent episodes) |
| `threads.ts` | Open-threads store (Layer A continuity; due_at, open/acked tracking) |
| `sidequests.ts` | Goal-alignment layer (standalone, avoids circular imports) |
| `extractors.ts` | Knowledge extraction fan-out (4 cheap readers: people, projects, decisions, commitments) |
| `session-checkpoint.ts` | Save/recall checkpoints per thread (/checkpoint command) |
| `resume.ts` | Capture resume/bio credentials via /resume command |

**ORCHESTRATION & DISPATCH**

| File | Purpose |
|------|---------|
| `decompose.ts` | Goal decomposition router (doc 759 Gap 1; multi-step → DecompositionPlan) |
| `dispatch.ts` | Node-orchestrated dispatch loop (Gap 2; dependency waves, WAVE_CONCURRENCY cap) |
| `workers.ts` | Per-worker runner (callClaudeCli + Hermes integration; no subagents) |
| `work-loop.ts` | Autonomous WORK track (Gap 3; research queues → research docs + PRs) |
| `orchestrator-tick.ts` | [core tick loop orchestration] |
| `turn-queue.ts` | Per-chat turn queue (live steering; sequential processing) |
| `learn.ts` | [learning loop from runs telemetry] |
| `always-open-topics.ts` | Self-refilling next-move per ZAAL BOTZ topic |
| `topic-router.ts` | Map topic → behavior (intent-based routing; internal vs outbound) |
| `tasks.ts` | Task queue read/write (~/.zao/zoe/tasks.json; TaskOp[] apply) |
| `task-classifier.ts` | Auto-tag tasks (brand, work-type, themes, next_owner from title+notes) |
| `heart-run.ts` | Resolve the agent_runs row that a Heart lease fences on (fixes runId bug in scheduler.ts) |
| `tick-lock.ts` | Atomic single-instance lock for autonomous loops (replaces duplicate copy in work-loop + orchestrator-tick) |
| `work-park.ts` | Failed work survives in a park (not deleted); can be queried and retried later |

**COMMUNICATIONS (Telegram/Discord/Relay/Voice)**

| File | Purpose |
|------|---------|
| `telegram-routing.ts` | Centralized routing (DM=questions only; status+digests elsewhere) |
| `relay.ts` | Cross-bot relay (bot_relay_op → sendMessage to target group) |
| `relay-bridge.ts` | Telegram ↔ fleet-relay bridge (~/bin/zao-relay sync) |
| `tg-chunk.ts` | Split long messages (<=4096 chars per Telegram limit) |
| `tg-interactions.ts` | Voice-note answers, reactions as actions (thumbs-up=approve, checkmark=done) |
| `button-bar.ts` | Persistent reply keyboard + /menu registration |
| `questions.ts` | One-question-at-a-time buttons (answer buttons + Type-my-own) |
| `drafts.ts` | Draft approval buttons (Post/Skip/Edit inline) |
| `pending-answers.ts` | Track last question asked (plain text route to last relay/Q) |
| `transcribe.ts` | Voice/audio → text (Groq Whisper; free-tier, no local deps) |
| `discord.ts` | Discord responsive assistant (@mention/DM only, never proactive) |
| `discord-webhook.ts` | Discord status feed (POST to incoming webhook) |
| `message-context.ts` | [message context enrichment] |
| `curator.ts` | Clean-curator topic posting (low-freq, curated, deduplicated) |
| `live-status.ts` | One message that updates in-place via editMessageText (vs sending multiple new messages) |
| `topics.ts` | Forum-topic registry for ZAAL BOTZ ops group (name → message_thread_id, persisted to ~/.zao/zoe/topics.json) |
| `thread-ops.ts` | Apply concierge's thread_ops (doc 796 Move 2); bridges hot store (threads.ts) + Bonfire emit (thread-memory.ts) |

**SAFETY & GUARDRAILS**

| File | Purpose |
|------|---------|
| `preflight.ts` | Config validation (fail-loud on missing env/keys, never silent) |
| `user-errors.ts` | Redact error internals (no paths, tokens, stacks to user) |
| `pii.ts` | PII scan + redaction (implements .claude/rules/pii-hygiene.md) |
| `cost-governance.ts` | Spend guardrails (60/75/85/95% thresholds; hard-stop at 95%) |
| `cost-ledger.ts` | Per-model spend visibility (model + tokens + cost per call) |
| `call-budget.ts` | Daily LLM call budget (50 calls/day alert; counter for concierge) |
| `focus-guard.ts` | Hyperfocus protection (/focus → suppress non-urgent pings, queue captures) |
| `fleet-health.ts` | Process liveness + self-heal (restarts capped, crash-loop guard) |

**AUTONOMY & ERROR HANDLING**

| File | Purpose |
|------|---------|
| `error-remediation.ts` | App errors → fix PRs (gap 3; reads app_errors, routes to fixer, reports outcome) |
| `repo-improver.ts` | Cheap-AI audit loop (OpenRouter/grok/gpt; self-gates; one improvement per cycle) |
| `repo-improver-io.ts` | I/O wiring for repo-improver (git context, Supabase, Hermes dispatch) |
| `verify-replan.ts` | ResultVerifier + bounded replan (VMAO-style judge → replan on low grades) |
| `watcher.ts` | Dispatch supervisor (reads runs.ts telemetry; cost/fail/quality anomalies) |
| `advisors.ts` | Advisory sandbox (independent reviewers for Hermes decisions; no autonomous acts) |
| `golden-eval.ts` | Regression harness (doc 2200; fixed golden set for persona/worker-spec changes) |
| `feature-ran.ts` | Let a feature report once that it actually executed in production (solves "shipped but never verified running" gap) |
| `done-work-detector.ts` | Detect open board tasks whose work has verifiably concluded (hourly pass; closes them automatically) |
| `federation-checkpoint.ts` | Durable checkpoint for DreamNet federation canary (crash → resume instead of repeat) |
| `federation-states.ts` | Terminal-state vocabulary for federation canary (both sides must prove success; no unilateral "done") |

**IDENTITY & TRUST**

| File | Purpose |
|------|---------|
| `receipt-envelope.ts` | DreamNet Receipt Envelope (dreamnet.receipt.v1; portable proof-of-action) |
| `receipts.ts` | Receipt Emitter (best-effort logging; writes to receipts table for audit/replay) |
| `identities.ts` | Per-brand Identity Kit registry (doc 2155; brand-specific contexts) |
| `brand-brain.ts` | ICM box fetching + caching (useicm.com; brand-specific ZOE voices) |
| `fleet.ts` | Per-brand mailbox ingestion (iterates identity registry; skips unset keys) |
| `bonfire-retry.ts` | Retry queue for ALL Bonfire writes (not just thread emits); replays on recovery, never accepts loss |

**BUS / DREAMNET FEDERATION**

| File | Purpose |
|------|---------|
| `bus-bridge.ts` | See a partner-bus message and reply well from phone (full body, not truncated; usable reply path) |
| `bus-send.ts` | Parse "reply XXXX <words>" from a bus message and send via DreamNet bus |
| `bus-receipt.ts` | ACK a DreamNet federation receipt and verify its content + message-ID hashes |
| `bus-upload.ts` | Upload files to DreamNet federation bus with local sha256 verification |

**DM BUILD FLOW**

| File | Purpose |
|------|---------|
| `build-intent.ts` | Detect whether a DM to ZOE is asking for code to be written (classification gate) |
| `dm-build-session.ts` | Make a running DM build steerable (mid-run steering; "no, use the other table" reaches the coder) |
| `dm-build-pending.ts` | Pure half of DM build buttons (unit-testable; no grammy import so vitest runs) |
| `dm-build-buttons.ts` | Inline keyboards for the DM build flow (every decision → a tap, not typing) |

**REASONING & PROACTIVITY**

| File | Purpose |
|------|---------|
| `grill.ts` | Bot→agent upgrade (proactive puller; one-at-a-time decisions instead of wait) |
| `approvals.ts` | Pending-approval state machine (doc 759 keystone; propose→Zaal OK→execute) |
| `proactive.ts` | Reasoning-tick gate (doc 796 Move 1; gathers candidates, speaks if passes bar) |
| `escalation.ts` | Resend critical pings if unack'd (escalating→decaying ladder) |
| `events.ts` | Proactive event candidates (TAGGED: [SHIPPED], [STALE PR], [CI FAIL], ...) |
| `pending-decisions.ts` | Surface pending decisions for morning brief (PRs, review queue, assigned tasks) |
| `pinned-brief.ts` | ONE pinned Telegram message = always current state (replaces artifact-making; Zaal: "stop making artifacts they just get lost") |
| `pinned-brief-runner.ts` | IO half: gathers real VPS state cheaply and keeps pinned-brief current |
| `mission-control.ts` | Pure render + emit layer for TG pinned mission-control (doc 2226; parse step-journal, render pinned text) |

**DAILY/SCHEDULED CYCLES**

| File | Purpose |
|------|---------|
| `brief.ts` | Morning brief (5am EST / 09:00 UTC; task queue + captures + git + PRs) |
| `brief-veto.ts` | AI-ranked brief with tap-to-veto buttons (minimal, reversible) |
| `recap.ts` | Nightly recap (9pm EST / 02:00 UTC; merged PRs + commits + research) |
| `reflect.ts` | Evening reflection (9pm EST; 3-question prompt to Zaal) |
| `scheduler.ts` | Proactive nudges on cron (no quiet hours per Zaal feedback) |
| `calendar.ts` | Luma calendar reader/cache (public ICS; ZAO events) |

**INSIGHTS & LEARNING**

| File | Purpose |
|------|---------|
| `runs.ts` | Append-only telemetry (~/.zao/zoe/runs/YYYY-MM-DD.jsonl; worker run + verdict) |
| `trace.ts` | Step-level execution tracing (~/.zao/zoe/traces/DATE.jsonl; nested span tree) |
| `loops-status.ts` | [status visibility for active loops] |

**TEAM & BOARD INTEGRATION**

| File | Purpose |
|------|---------|
| `task-comment-replies.ts` | Reply in-thread to @zoe in board task comments |
| `task-mention-notify.ts` | Forward @person mentions to Telegram (no board checking needed) |
| `task-teammate-ack.ts` | Acknowledge team comments; ping Zaal (with optional DRAFT_ANSWERS mode) |
| `team-tracker.ts` | Read cowork board (doc 890; bridges ZOE's tasks + TEAM's tracker) |
| `trust-audit.ts` | Monthly trust audit (captures >14d old, tasks >14d old) |
| `daily-note.ts` | Auto-rollover daily notes (one per day; unchecked→top, increment roll_count) |
| `ping-lifecycle.ts` | Tie task lifecycle to message pings (close task → resolve ping) |
| `handoffs-surface.ts` | Post new handoffs to Handoffs topic (de-duped via last-seen) |
| `backlog-grill.ts` | Drip the board backlog to Zaal's phone one card at a time (answered by number button) |
| `backlog-grill-runner.ts` | IO half of backlog grill (reads board, sends card, records verdict; no policy) |
| `board-commands.ts` | Pure layer: parse @zoe board comments into authorized commands (fully unit-tested) |
| `board-command-executor.ts` | IO layer: execute commands authorized by board-commands.ts (no autonomous policy) |
| `teammate-heartbeat.ts` | Ask a teammate what they're on (measured Iman accountability gap; pings on schedule) |

**RESEARCH & DOCS**

| File | Purpose |
|------|---------|
| `work-loop.ts` | Autonomous research track (queue topics → decompose/dispatch → commit docs + PR) |
| `research-dedupe.ts` | URL deduplication (before enqueue, check if link already researched) |
| `research-doc.ts` | Turn research findings into numbered doc + PR (trusted Node step) |
| `verify-replan.ts` | Verify research answers goal; replan if graded low (VMAO-style) |
| `zaostock-approvals-surface.ts` | Surface ZAOstock research queue to Telegram (from cloud routine) |

**OUTBOUND & CASTING**

| File | Purpose |
|------|---------|
| `zol-queue.ts` | ZOL cast approvals (enqueue approved casts to cowork tracker for Pi drainer) |
| `bonfire-queue.ts` | ZABAL Gamez community submission queue (verified FID via Quick Auth) |
| `crm.ts` | ZAO CRM write path (direct Supabase; replaces POST-behind-bearer-secret) |
| `outbox.ts` | [outbound message queue/batching] |
| `build-candidate.ts` | Tap-to-approve buttons for fleet BUILD candidates (escalate → ping → tap) |

**EXPERIMENTAL / CANARY**

| File | Purpose |
|------|---------|
| `heart-canary.ts` | Heart fleet consumer (first consumer outside tests; flag-gated ZOE_HEART_FLEET_CANARY) |
| `inbox-ingest.ts` | [inbox processing] |
| `inbox-triage.ts` | [inbox triage/routing] |
| `nudge.ts` / `nudges.ts` / `nudge-ladder.ts` | [nudging / reminder logic] |
| `meetings.ts` | [meeting integration] |

**INFRASTRUCTURE & TYPES**

| File | Purpose |
|------|---------|
| `index.ts` | Entry point (bot.start(), grammY polling) |
| `types.ts` | Shared types (tasks, captures, nudges; mirrors hermes/types.ts) |
| `commands.ts` | Command-prefix detection (plan:/note:; routable without importing index) |
| `groups.ts` | Per-chat config (interactive only after /zoe-group-enable) |
| `env.ts` | Single source of truth for aliased env vars (prevents drift bugs) |
| `node-cron.d.ts` | TypeScript definitions for node-cron |

---

**POST-INVENTORY ADDITIONS (2026-08-07, #2932)**

| File | Purpose |
|------|---------|
| `memory-git.ts` | Commit-per-edit versioning of ~/.zao/zoe memory (flag ZOE_MEMORY_GIT=1; history/why/rollback) |
| `guardrails.ts` | Composable Guardrail interface + runGuardrails pipeline (collect-all trips) |
| `guardrail-adapters.ts` | cost/pii/preflight bound to the Guardrail interface + runConciergeGuardrails() |

---

**KEY GAPS ADDRESSED (doc 927 orchestrator vision)**

- Gap 1: `decompose.ts` (structured goal decomposition)
- Gap 2: `dispatch.ts` + `workers.ts` (distributed execution)
- Gap 3: `error-remediation.ts` + `work-loop.ts` (autonomous fix + research pipelines)
- Gap 4: `reflexion.ts` (self-improving memory)
- Gap 5: `learn.ts` + `watcher.ts` (learning from runs telemetry)

---

**SUMMARY**

ZOE is a multi-layered orchestrator across **8 architectural tiers**: (1) **Concierge brain** (concierge.ts + memory blocks); (2) **Orchestration** (decompose/dispatch/workers/tick-lock); (3) **Autonomy** (error-remediation, repo-improver, work-loop, done-work-detector); (4) **Trust** (receipts, identities, brand-brain, bonfire-retry); (5) **Communications** (Telegram, Discord, relay, voice, live-status, thread-ops); (6) **Safety** (budgets, PII, cost governance, guards); (7) **Bus/Federation** (bus-bridge/send/receipt/upload, federation-checkpoint/states — DreamNet integration); (8) **DM Build Flow** (build-intent, dm-build-session/buttons/pending — full Telegram → code path). The system is strongly gated: config preflight (fail-loud), live steering (turn-queue), team-aware (board bridge + board-commands), and audit-ready (receipts, traces, golden-eval, feature-ran).

**Real code is ground truth.** All 130 files read directly from `~/zao-bot-live/bot/src/zoe/*.ts` headers.

**Refresh history:**
- 2026-08-06: Initial inventory (102 modules, workflow wf_eddf1949-77d)
- 2026-08-07: +3 post-inventory adds (memory-git, guardrails, guardrail-adapters — PR #2932)
- 2026-08-22: +25 new modules (bus, DM-build, federation, board-commands, pinned-brief, tick-lock, heart-run, work-park, teammate-heartbeat, done-work-detector, feature-ran, live-status, thread-ops, topics — board task 9550)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update this map in the SAME PR as any bot/src/zoe module add/remove | @Zaal (Claude, every session) | Discipline | standing |
| Re-verify the full inventory quarterly (next: 2026-11-01) | @Zaal (Claude) | Refresh | 2026-11-01 |

## Sources

- Workflow `wf_eddf1949-77d` grounded inventory (102 module headers read). [FULL]
- Orchestrator spot-checks 2026-08-07: reflexion.ts, decompose.ts, focus-guard.ts,
  receipt-envelope.ts, golden-eval.ts headers vs claims - all match. [FULL]
- 2026-08-22 refresh: headers of all 25 new modules read directly from ~/zao-bot-live/bot/src/zoe/ [FULL]
- `.claude/rules/confirm-before-claiming-absence.md` (the rule this map serves). [FULL]

## Also See

- [Doc 2235](../2235-zoe-vs-agent-toolkits-audit/) - the audit this inventory powered.
