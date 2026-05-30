---
topic: agents
type: audit + architecture-decision
status: research-complete
last-validated: 2026-05-29
original-query: "Audit everything - ZOE, the cowork bot, the cowork dashboard. Where are we at, what can we use?"
tier: DEEP
related-docs: [288, 289, 669, 692, 717, 754, 759, 761, 762, 763, 765, 766]
---

# 770 - ZOE / Cowork Bot / Cowork Dashboard - Systems Audit + Consolidation Map

> **Goal:** A single ground-truth audit of the three live ZAO agent/app systems - ZOE (concierge), the cowork bot (tracker agent), the cowork dashboard (Kanban web) - covering current state, what works, gaps, and a concrete reuse + consolidation map. Answers "where are we at, what can we use."

## Executive summary

Three systems, all LIVE:

| System | Location | Deploy | Maturity | One-line |
|--------|----------|--------|----------|----------|
| ZOE | `ZAO OS V1/bot/src/zoe` | VPS `zaal@31.97.148.88`, systemd `zoe-bot`, @zaoclaw_bot | Most ambitious, least proven | Telegram concierge + cron scheduler + multi-agent dispatch + Farcaster caster |
| Cowork bot | `ZAOcowork/agent` | VPS `root@187.77.3.104`, systemd `zaocoworking-bot` | Shipped, solid | Telegram tracker agent over the Supabase `tasks` table |
| Cowork dashboard | `ZAOcowork` (Next.js) | Vercel `thezao.xyz` | Most polished | Kanban web UI over the same Supabase `tasks` table |

Headline findings:
1. **Two bots, one shape.** ZOE and the cowork bot independently re-implement the same four primitives: Letta-style memory blocks, claude-max CLI dispatch, Bonfire fire-and-forget spool, grammy polling + approval. Large duplication, ripe for a shared core.
2. **The Supabase `tasks` table (project `etwvzrmlxeobinrlytza`) is the de-facto spine** - cowork bot + dashboard both read/write it. ZOE does NOT; it keeps its own `tasks.json`. Unifying ZOE onto that table is the single highest-leverage move.
3. **Dashboard is the strongest product** (clean, no TODOs, steady ship cadence). Cowork bot is solid but untested. ZOE is the widest surface with the thinnest verification (untested concierge/scheduler/caster, relay never fired E2E).

---

## System 1 - ZOE (concierge bot)

Repo: `ZAO OS V1/bot/src/zoe`. Entry `index.ts` (grammy polling as @zaoclaw_bot). Reasoning via Claude Code CLI subprocess.

### Architecture (modules)
- `index.ts` - entry; Telegram polling, routes DM/group/command; loads memory, recovers pending approvals, starts scheduler, attaches caster.
- `concierge.ts:67` - one user turn: Claude CLI with memory blocks as context, parses JSON task/quest/relay ops from reply.
- `memory.ts` - 4-block memory: persona.md (git-tracked voice), human.md (daily facts), recent/<chat_id>.json (history), tasks.json (queue), learnings/<worker>.md (runtime-only).
- `decompose.ts:62` - goal -> DecompositionPlan (subtasks, deps, approval gates). Doc 759 Gap 1.
- `dispatch.ts:36` - executes approved plan in dependency waves (Promise.allSettled), routes to workers/Hermes, records telemetry, honors approval gates. Gap 2.
- `workers.ts:61` - per-worker runner for 8 agent types, tool lockdown, critic integration, cost caps.
- `scheduler.ts` - cron: morning brief 09:00 UTC, evening reflection 01:00 UTC, hourly nudge, weekly learn 18:00 UTC Sun, posts. Devz-tip = Phase 4 stub.
- `caster/index.ts` - Farcaster pipeline: draftCast (OpenRouter) -> Klearu PRE gate -> Telegram approval -> publishCast. Doc 761 Phase 2.
- `farcaster/{write,signer,x402,read-node,event-stream}.ts` - Ed25519 sign + write-hub submit, Hypersnap read node, EIP-3009 USDC pay headers. Event-stream gated on FARCASTER_NODE_GRPC + CASTER_ENABLED=1.
- `reflexion.ts` / `learn.ts` - evening reflection patches + weekly learning aggregation (runtime-only, never rewrites git). Gaps 4/5.
- `recall.ts` / `relay.ts` - Bonfire bridge (write episodes, read w/ fallback) + cross-bot fire-forget relay (PR 727).
- `approvals.ts` - PendingApproval state machine, TTL, restart recovery.
- `critics/{research,comms,task-result}-critic.ts` - pluggable quality gates. Gap 3.
- `safety/klearu.ts` - subprocess text/image classifier, fail-closed default.
- `exec/ffx.ts` - FFX serverless STUB, throws unless FFX_VERIFY_OK=1.
- `agents/{registry,ranker,guards,decay,newsletter,orchestrate}.ts` - Farcaster multi-agent registry/ranking/rate-limiting (Phase 3, dormant).

### State - boot path
- ALWAYS LIVE: Telegram polling, memory load, approval recovery, scheduler (brief/reflection/nudge/learn/posts), caster approval callback, Bonfire mirror per turn.
- FLAG-GATED: caster event stream (CASTER_ENABLED=1 + FARCASTER_NODE_GRPC), Klearu (KLEARU_TEXT_CMD), FFX (FFX_VERIFY_OK=1).
- DORMANT: Phase 3 multi-agent registry (built, not in boot path), devz-tip cron stub.

### Works
Concierge DMs, morning/evening loop, hourly nudges, per-group gating (/zg), plan decompose + dispatch with critics + cost caps, caster draft->safety->approval->publish, memory persistence, Bonfire mirroring, cross-bot relay emit, weekly learn cycle, posts scheduler.

### Gaps / risks
- Cross-bot relay has NEVER fired E2E (see doc handoff session-2026-05-29-zoe-phase2-bonfire-relay-smoke).
- `agents/orchestrate.ts` imported but never called - multi-agent orchestration not actually live.
- FFX unverified (private beta), throws by default.
- Bonfire reads empty until admin labeling (doc 680).
- Zero integration tests (unit tests only - see below). No coverage for concierge turn, scheduler, caster publish, Bonfire.
- decompose.ts IS wired into dispatch but the concierge trigger path should be re-confirmed.

### Tests
`__tests__/`: agents, approvals, decompose, dispatch, learn, reflexion, sidequests. Meaningful unit tests on pure logic / data structures. No API/integration coverage. 11/11 agents tests pass.

---

## System 2 - Cowork bot (tracker agent)

Repo: `ZAOcowork/agent` (~4500 LOC, no tests). Entry `src/index.ts` (grammy). Runtime Node 22 + tsx. Deploy VPS systemd `zaocoworking-bot`, America/New_York TZ. v2.5.

### What it is
Telegram concierge for the cowork action tracker. Reads/writes the unified Supabase `tasks` table (doc 692). Hermes pattern: per-message LLM subprocess (default claude-max). Proactive DMs via node-cron.

### Architecture (modules)
- `index.ts` - entry, grammy init, handler dispatch, 4096-char msg splitting.
- `commands.ts` (~1050 LOC) - /start /mine /list /add /wip /blocked /done /assign /daily /setdue /setnote /setprio. Owner resolution Supabase > GitHub team.json > env.
- `actions-store.ts` - Supabase wrapper: fetchActions/mutateActions, maps `tasks` rows to legacy ActionItem, UUID<->Owner enum.
- `memory.ts` - 5-block Letta prompt (persona/human/working/tasks/actions) -> appendSystemPrompt.
- `scheduler.ts` - cron: morning digest 06:00 ET, eod 17:00 ET, stale alert 09:00 ET, 4h nudge 8a-10p ET (Phase J). Sentinel files for idempotency.
- `extraction.ts` - suggest-then-confirm: parse ```json-suggest, surface, execute on affirmative; supports bulk arrays + auto-confirm.
- `users.ts` - per-user prefs (provider/model, BYOK keys, notify opt-out, quiet_until) at `~/.zaocoworking/users/<id>.json`.
- `llm/{index,claude-max,claude-api,openai,minimax}.ts` - 4-provider dispatcher behind callLLM(). claude-max = local CLI subprocess, dontAsk, tools disallowed.
- `roster.ts` / `supabase-roster.ts` - team.json (octokit, 5min TTL) + Supabase team_members (canonical post-713).
- `notifications.ts` - per-channel opt-out DM dispatcher.
- `transcripts.ts` - append-only jsonl archive + 20-turn ring buffer.
- `teams/{bonfire,spool,types}.ts` - Bonfire episodes (doc 669) via jsonl spool + retry.
- `juke-commands.ts` - /juke creates ZAO Live audio space via ZAOOS `/api/juke/space`.
- `brands.ts` - parse/validate brand hashtags.

### State
Live v2.5. Recent: PR #33 Phase J /quiet + 4h nudges (2026-05-28). Steady velocity, no P1.
WIP: Hermes v3 (bot opens PRs) deferred; BYOK encryption-at-rest; RLS not enforced.

### Integrations
Telegram (grammy, allowlists), Supabase (`etwvzrmlxeobinrlytza` tasks + team_members), GitHub (octokit roster), 4 LLM providers (claude-max default $0, +api/openai/minimax BYOK), Bonfires.ai (episodes, BONFIRE_ENABLED gate), ZAOOS Juke. Keys in `agent/.env` (chmod 600) + per-user json.

### Gaps
No RLS enforced, no rate limiting, no health endpoint, BYOK unencrypted (chmod 600 only), zero tests, no outbound webhooks on task change.

---

## System 3 - Cowork dashboard (Kanban web)

Repo: `ZAOcowork` Next.js 15 + React 19 + Tailwind v3. Vercel `thezao.xyz`. Most mature, clean (no TODO/FIXME).

### What it is
Unified ops task tracker. TODO/WIP/BLOCKED/DONE Kanban. Six Sigma DMAIC, service classes, aging/cycle-time SLA, priority, due dates, approval flows. Owner badges, brand filter pills, per-column quick-add, TaskRoom edit modal.

### Architecture
- Routes `src/app/`: `page.tsx` (1231 LOC Kanban + public landing), `login`, `chat` (MiniMax board-aware), `admin/*` (users/brands/projects/triage/proposals/cleanup/feed), `todo/[id]` permalink, `api/{chat,digest,forecast,github/webhook,proposals}`.
- Components: `Board.tsx` (1676 LOC), `TaskRoom.tsx` (916 LOC), `TodoPanel.tsx`, `Chat`, `FocusWidget`, `ForecastWidget`, `SlaGridChip`, `NavBar`, `NotificationBell`, `BulkActionBar`, 10 admin panels.
- Data: `src/lib/data.ts` (Supabase service-role read/write, normalizeItem), `src/app/actions.ts` (1231 LOC server actions, requireSession auth), `src/lib/auth.ts` (password + HMAC httpOnly cookie, lead/worker roles).

### Data model (the spine)
Supabase `etwvzrmlxeobinrlytza`, `db/schema.sql` greenfield. Tables: `team_members`, `circles`, `circle_members`, `tasks` (uuid id, project, kind, title, status todo|in_progress|blocked|done, owner_id, created_by, category, priority, phase DMAIC, due, notes, completed_*, legacy_id, legacy_source, brands[], service_class, archived_at). `legacy_source` taxonomy enables multi-writer dedup: `cowork-actions.json` | `meeting:<slug>-<date>` | `pr-auto:<pr>` | `research-doc:<doc>` | `inbox:<msg>`.

### State
Live. Latest PR #33 (focus-widget brand-scope). Shipped phases: 1 (GitHub+HMAC), 2 (Supabase migrate), 2.5 (brands), F (Kanban best-practices doc 763), H (permalinks), I (projects doc 765), J (focus widget + 4h nudge). In flight: `ws/add-tyler-user`.

### Gaps
No realtime (stale reads across users), webhook secret validation unconfirmed, no saved views/subtasks/file-attach/metrics page/email notifications/keyboard-shortcuts/drag-drop (BACKLOG Phases 5-6).

---

## Cross-cutting finding: duplication

ZOE and the cowork bot independently build the same four primitives:

| Primitive | ZOE | Cowork bot | Note |
|-----------|-----|-----------|------|
| Memory blocks (Letta) | `memory.ts` (4-block) | `memory.ts` (5-block) | Same pattern, divergent block sets |
| LLM dispatch | claude-max CLI only | `llm/` 4-provider + BYOK | Cowork is richer |
| Bonfire spool | `recall.ts` / `relay.ts` | `teams/spool.ts` | Cowork retry queue more robust |
| Telegram + approval | grammy + approvals.ts | grammy + extraction.ts | Both suggest/confirm |

Two codebases, one shape. A shared `@zao/agent-core` package (memory, llm-dispatch, bonfire-spool, tg-approval) would cut maintenance in half and let each bot specialize.

---

## Reuse map (what we can use)

**Take from cowork bot (battle-tested):**
- `llm/` 4-provider dispatcher + per-user BYOK -> port to ZOE (ZOE is claude-max only).
- `extraction.ts` suggest-then-confirm + bulk paste -> safer mutations everywhere.
- `teams/spool.ts` Bonfire retry queue -> replace ZOE's lighter relay.

**Take from ZOE (richer orchestration):**
- `dispatch.ts` dependency-wave executor + approval gates -> cowork bot has no orchestration.
- `workers.ts` 8-worker pluggable runner + tool lockdown + cost caps.
- `critics/` quality-gate framework.
- `caster/` + `farcaster/` (signer/write/x402) -> the only Farcaster implementation.
- `reflexion.ts` / `learn.ts` self-improvement loop.

**Take from dashboard (UI + data):**
- `Board.tsx`, `TaskRoom.tsx`, `FocusWidget`, `ForecastWidget` -> extractable Kanban kit.
- Supabase `tasks` schema + `legacy_source` multi-writer dedup -> the shared backbone.
- HMAC cookie auth + `"use server"` mutation boundary.

---

## Biggest opportunity: unify ZOE onto the shared tasks table

The Supabase `tasks` table already serves the cowork bot + dashboard. ZOE keeps a SEPARATE `tasks.json`. Wiring ZOE's task queue onto the shared table makes ZOE the reasoning brain over the same board the team already sees in the dashboard and edits via the cowork bot. ZOE's `legacy_source` would be e.g. `zoe:<chat>-<ts>`. This is the cleanest path from "three disconnected systems" to "one tracker, three surfaces (web / cowork bot / ZOE)."

---

## Gaps / risks roll-up
- ZOE: relay unproven E2E; orchestrate.ts dead; FFX stub; no integration tests.
- Cowork bot: no RLS, no rate limit, no health check, BYOK plaintext, zero tests.
- Dashboard: no realtime, webhook secret unvalidated.
- Shared: Bonfire reads dark until admin labeling (doc 680).

## Recommended next actions
1. Decide the consolidation thesis: extract `@zao/agent-core` (memory + llm + bonfire-spool + tg-approval) shared by both bots. (architecture decision)
2. Wire ZOE onto the Supabase `tasks` table (retire ZOE's `tasks.json`), `legacy_source = zoe:*`. (highest leverage)
3. Close ZOE Phase 2: fire the relay smoke test E2E (separate handoff bundle has the steps).
4. Add a minimal test harness to the cowork bot (currently zero) before Hermes v3 PR-opening lands.
5. Enforce Supabase RLS (doc 692 follow-up) now that three writers hit the table.

---

## Sources
Internal codebase audit, 2026-05-29, three parallel read-only agent passes over: `ZAO OS V1/bot/src/zoe`, `ZAOcowork/agent`, `ZAOcowork` (web). Cross-referenced docs 669/692/717/754/759/761/762/763/765/766. Note: `cowork/` repo is DEPRECATED (moved to ZAODEVZ 2026-05-29); `thezao-tracker` is a stale clone of ZAOcowork.
