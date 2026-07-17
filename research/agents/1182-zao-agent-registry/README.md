---
doc: 1182
title: ZAO agent registry - canonical fleet documentation + cleanup targets
description: Master registry of all running agents, build loops, and decommissioned systems in the ZAO fleet. Consistent schema for agent identity, runtime, authority, and human-gates. Identifies drift vs CLAUDE.md and cleanup targets.
authors: claude-code (agent audit 2026-07-16)
type: reference
tier: STANDARD
original-query: Build canonical agent registry + reusable documentation standard for ZAO fleet. Fleet has grown faster than docs; clean up and document consistently. Ground truth from live runtime map.
---

# ZAO Agent Registry 2026-07-16

**Purpose:** Single source of truth for ZAO's agent fleet — what's running, where, by whom, under what authority, and how it's documented. Canonicalizes authority from CLAUDE.md + AGENTS.md + live runtime state on VPS + Pi.

**Date of audit:** 2026-07-16 (live state verified against VPS 31.97.148.88 + Pi ansuz 100.117.191.11)

---

## LIVE AGENTS TABLE

All currently running or actively maintained agents. Schema: name, handle, repo, code path, runtime host+path, purpose, status, owner, human-gates, dependencies.

| Name | Handle | Repo | Code Path | Runtime Host | Runtime Path | Purpose | Status | Owner | Human-Gates | Dependencies |
|------|--------|------|-----------|---------------|--------------|---------|--------|-------|------------|--------------|
| **ZOE** | @zaoclaw_bot | ZAOOS | `bot/src/zoe/` | VPS 31.97.148.88 | ~/zao-bot-live (isolated clone) | Personal concierge: tasks, captures, brief/reflect, recall, research drafts, newsletter, social drafts | LIVE + SHIP-READY | Zaal | Zaal approval (Telegram buttons) for Hermes auto-PR, $50/day spend cap, 3-strike escalation, cost attribution per module | Claude Max (Hermes pattern), Neynar, XMTP, Bonfire, Supabase RLS |
| **Hermes** | (reused by ZOE) | ZAOOS | `bot/src/hermes/` | VPS (subprocess of ZOE) | spawned as `claude` CLI subprocess | Autonomous fix-PR pipeline: coder + critic + auto-PR. Shared by ZOE + any worker. Letta-style memory blocks. | LIVE (reused, not standalone) | Zaal | All patches require Zaal Y/N on Telegram (approvals.ts state machine) before auto-apply | Claude Max OAuth, iron-session, GitHub CLI |
| **ZAO Devz** | @zaodevz_bot | ZAOOS | `bot/src/devz/` | VPS 31.97.148.88 | ~/migrated-cowork/cowork-zaodevz/agent (DRIFT FLAG) | Group dispatch (Zaal + Iman + team), hourly learning tip cron | LIVE | Iman | Messages to group OK, no auto-execute, human reviews before action | Claude via Hermes, cowork-zaodevz repo bridge |
| **ZAOstock Team** | @ZAOstockTeamBot | ZAOOS + zao-festivals repo | `bot/` (root, separate) | VPS 31.97.148.88 | ~/zaostock-bot | Festival team coordination: digests (morning/evening/week), todos, contributions, ideas, gemba notes. Standalone from ZOE. Graduating to own repo (zao-festivals) | LIVE + SPINNING OUT | Zaal | Public mode (Telegram @username auth), admin commands Zaal only | Minimax LLM, Supabase (stock_team_members, cron state), systemd user unit |
| **ZOL** | @zolbot | bettercallzaal/zol | `zol-daily.js` + `zol-reply.js` | Pi ansuz (100.117.191.11 Tailscale) | ~/zol/farcaster-agent/ | Farcaster scout: autonomous hourly posts (recall-gated, self-limit guard), reply daemon (approval-gated drafts) | LIVE + FULLY AUTONOMOUS (2026-07-12 Zaal authorized) | Zaal | Posts auto-gate: load-bearing guards in code (no prompt rules): bot blocklist, double-tag skip, mention array real-check, strips @ from output. Hourly cadence `0 0-2,9-23 * * *` UTC. Dry-run mode via `ZOL_DRY=1`. Pings Zaal on each post. | OpenRouter (local graph fallback), Bonfire, x402 (keyless Farcaster writes), Haatz (keyless reads), Neynar API, tmux session 'zol' |
| **Bonfire** | @zabal_bonfire | (external) | (hosted) | bonfires.ai | (external SaaS) | Knowledge graph ingest + agent-agentic recall across multimodal corpus. ZOE memory block, Bonfire episodes as curated lessons. | LIVE (minimal use) | Genesis tier (wallet-gated, Zaal wallet) | Ingest rate-limited (no daily burst), curated episodes only (recap.ts output), team-readable (shared corpus), no auto-delete | Bonfire SDK, ~/.zao/private/bonfire.env |

---

## BUILD LOOPS TABLE

Autonomous tmux sessions on VPS that execute build workflows (research docs, agent improvements, dependency updates). Each loop has: name, repo, directory, entry point, directive (what it builds), interval, cost control, and current state.

| Loop Name | Repo | VPS Dir | Entry Point | Directive | Interval | Cost Control | State (as of 2026-07-16) | Owner | Notes |
|-----------|------|---------|-------------|-----------|----------|--------------|-------------------------|-------|-------|
| **zoe** | ZAOOS | ~/zao-os | ~/bin/zoe-loop-run.sh (if exists) or manual tmux zoe | Research doc generation + auto-PR pipeline | Daily (work-loop.ts cron 2h, daily-capped 6 items) | ZOE_WORKLOOP_DAILY=6, file-locked, empty-queue=zero-spend, docs-only (no live code changes) | ACTIVE (PRs staged for Zaal merge) | Zaal | Reads queue: <topic> → decompose → dispatch → commitResearchDoc → PR → ping. Work-loop.ts (PR #1022) now deployed. |
| **human** | ZAOOS | ~/zao-os | manual tmux sessions | Personal dev work, ad-hoc builds, local testing | On-demand | None (personal branch) | ACTIVE (development mode) | Zaal | No cron, no auto-spend. Zaal manually runs builds here. |
| **zol** | bettercallzaal/zol | ~/zol-upgrade | (git branch ws/v2-core-layers) | ZOL v2 core architecture layers (Farcaster agent v2 redesign) | On-demand / review cycle | None (upstream, no spend until ship) | PAUSED (v2 in review, v1 LIVE in ~/zol/) | Zaal | This is the v2 research branch. Live v1 runs in ~/zol/, separate runtime. Once v2 ships, will replace ~/zol/. |
| **ww** | bettercallzaal/wwtracker | ~/wwtracker | (WaveWarZ tracking loop) | WaveWarZ event coordination + tracker sync | On-demand | None (internal ops) | PAUSED / INACTIVE | WaveWarZ ops | WaveWarZ spinout repo; not part of ZAO core fleet. Listed for completeness. |
| **coc** | bettercallzaal/CoCConcertZ | ~/coc | (COC Concertz ops loop) | COC Concertz event coordination + team sync | On-demand | None (internal ops) | PAUSED / INACTIVE | Thy Revolution (ThyRev) | COC Concertz graduated to own repo 2026-04-29. Retained in monitoring list for cross-brand ops. |

---

## SUPERVISOR / INFRASTRUCTURE TABLE

Processes that manage and monitor the fleet.

| Service | Location | Cron/Interval | Function | Authority | Restart/Health Check |
|---------|----------|---------------|----------|-----------|----------------------|
| loops-keepalive.sh | ~/bin/ | Every 3 min | Monitors tmux sessions (zoe, human, zol, ww, coc). Restarts dead loops. File-locks prevent duplicate instances. | Systemd user (cron) | `systemctl --user status loops-keepalive` |
| zoe-autodeploy.sh | ~/bin/ | Every 10 min | Polls `origin/main` in ~/zao-os, deploys to ~/zao-bot-live (isolated clone). Restarts ZOE if new commits detected. | Systemd user (cron) | `systemctl --user status zoe-autodeploy` (if wired) or manual `bash ~/bin/zoe-autodeploy.sh` |
| zaostock-bot (systemd) | ~/.config/systemd/user/zaostock-bot.service | Long-poll (grammy) | Telegram bot polling @ZAOstockTeamBot | Zaal (systemd user unit) | `systemctl --user restart zaostock-bot && journalctl --user -u zaostock-bot -n 15` |
| zol crons (tmux 'zol' on Pi) | ~/zol/ on Pi ansuz | Hourly (5am-10pm ET, `0 0-2,9-23 * * * UTC`), every 5-10 min for drains | zol-daily.js (posts), zol-reply.js (replies daemon), zol-zabal-watch.js, zol-drain.js | Zaal (via authorized Telegram taps) | `ssh zaal@ansuz "tmux list-sessions"` to check 'zol' session alive |

---

## DECOMMISSIONED SYSTEMS

Do NOT restart, reopen, or rebuild. These were explicitly decision-closed per CLAUDE.md 2026-05-04.

| System | Former Name | When Killed | Why | Archival |
|--------|-------------|-------------|-----|----------|
| **openclaw squad** | ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER + container | 2026-05-05 | Complexity, no Zaal adoption, Hermes pattern proven simpler | Workspace nuked; code in git history only |
| **Composio AO** | AO orchestrator integration | 2026-05-05 | Feature parity + reliability better with Hermes pattern | No code in repo |
| **ZOE v2 / Agent Zero** | Migration plan doc | 2026-05-05 | Decision: stick with Hermes pattern + Claude CLI, no Agent Zero | Doc 759 v2 deltas address remaining gaps |
| **10-bot fleet** | Magnetiq bot, Research bot, WaveWarZ bot, POIDH bot as own bots | 2026-05-04 | Scaling complexity; brand voices fold into ZOE memory blocks instead of separate bots | No code in repo |
| **zao-team-bots** | Magnetiq brand bot, AttaBotty brand bot | 2026-06-29 | Brand voices live as ZOE persona blocks, not separate Telegram processes | No code in repo |
| **Hermes standalone** | @zoe_hermes_bot | 2026-06-29 | Hermes adapted into ZOE 2026-06-29 (coder/critic/auto-PR code in bot/src/hermes/ is reused BY ZOE, not run as separate bot). Decommissioned as separate bot, kept as library. | Code retained in bot/src/hermes/ for reuse |
| **FISHBOWLZ** | Autonomous research + Juke integration | Paused 2026-04-16, killed 2026-05-04 | Juke partnership stands, but FISHBOWLZ agent paused (Zaal decision post-grill). Not archived as a bot restart target. | Docs in research/ only |

---

## DRIFT / CLEANUP TARGETS

Issues found during audit that require attention:

### 1. ZAO Devz runtime location mismatch (MEDIUM PRIORITY)

**Issue:** CLAUDE.md lists ZAO Devz as `bot/src/devz/` (ZAOOS repo), but the agent RUNS from `~/migrated-cowork/cowork-zaodevz/agent` on VPS — a separate clone of the cowork-zaodevz repo, not ZAOOS.

**Implication:** Code lives in ZAOOS, but agent runs from a different repo checkout. If bot/src/devz/ is updated, the running agent on VPS won't pick it up unless manually rsync'd or re-cloned from cowork-zaodevz.

**Question:** Is this intentional (ZAO Devz is Iman's bot, runs from Iman's repo)? Or should it be integrated into the ZAOOS autodeploy + zao-bot-live pattern like ZOE?

**Recommendation:** Clarify ownership + decide: (a) ZAO Devz is Iman-owned, standalone in cowork-zaodevz, stays as-is; or (b) integrate into ZAOOS + VPS 1 fleet under zoe-autodeploy.

---

### 2. ZOL canonical location (MEDIUM PRIORITY)

**Issue:** ZOL v1 (LIVE @zolbot on Pi ansuz) is at `~/zol/farcaster-agent/` (separate from ZAOOS). ZOL v2 build is at `~/zol-upgrade` on VPS (branch ws/v2-core-layers).

**Implication:** Two parallel codebases. v1 is running; v2 is in design/review. Once v2 ships, v1 will be replaced, but currently both exist.

**Question:** What's the promotion path? When does v2 replace v1? Is v2 meant to be merged into bettercallzaal/zol main or stay on ws/v2-core-layers?

**Recommendation:** Update project_zol_farcaster_agent memory file with v2 ship date + promotion plan. Once shipped, delete v1 from ~/zol/.

---

### 3. Isolated deploy clone pattern: ~/zao-bot-live (LOW PRIORITY - WORKING AS DESIGNED)

**Issue (not an issue, but worth documenting):** ZOE code lives in ~/zao-os (build branch), but RUNS from ~/zao-bot-live (isolated clone with only main branch). This is intentional per the autodeploy pattern (zoe-autodeploy.sh pulls main into ~/zao-bot-live, restarts ZOE).

**Implication:** Feature branches in ~/zao-os do NOT automatically run; only merged main code does.

**Recommendation:** Document this pattern in the agent registry as a design choice (BUILD vs DEPLOY separation). This is now WORKING (fixed 2026-07-16 per feedback_never_union_merge_code).

---

### 4. Research doc decommission cleanup (LOW PRIORITY)

**Issue:** Several decommissioned agent designs are still documented in research/:
- Doc 601 (agent-stack-cleanup-decision) — now closed, but references openclaw + Composio + ZOE v2
- Docs on Agent Zero, 10-bot fleet, zao-team-bots (if they exist)

**Implication:** Future readers may try to reopen these designs. The docs should be marked ARCHIVED or redirected to CLAUDE.md "decommissioned" section.

**Recommendation:** Add a "CLOSED / DECOMMISSIONED 2026-05-04" section to doc 601. Archive outdated agent-design docs by adding an ARCHIVED header + pointer to this registry.

---

### 5. Bonfire integration underutilized (LOW PRIORITY)

**Issue:** Bonfire is integrated into ZOE memory (episodes from recap.ts), but the feature is described as "DORMANT" in project_zoe_orchestrator_locked.md. Blocked on "admin labeling" step.

**Implication:** ZOE has a capability (shared memory + agent recall) that isn't being used. Knowledge doesn't persist to the graph.

**Recommendation:** Unblock Bonfire labeling (what's the admin step?). Once unblocked, enable recap.ts → Bonfire writes (one curated episode per week or per major research doc).

---

### 6. imanagent planning document (reference, not critical)

**Issue:** ZAO Devz bot is currently slash-commands-only on cowork-zaodevz. Doc 650 plans the agent (imanagent) to run on Iman's VPS. Still planned, not yet shipped.

**Implication:** cowork-zaodevz bot is NOT an autonomous agent yet — it's a manual-dispatch tool Iman operates. The imanagent (autonomous version) is still in research.

**Recommendation:** Reference doc 650 in the registry. Priority = low (Iman owns, not blocking ZOE/ZOL/Bonfire chain).

---

## AGENT DOCUMENTATION STANDARD

**For every agent, document these fields in a consistent schema.** This is the template for future agent designs and the standard for updating bot README/PERSONA files.

### Identity

- **Name:** Agent's human-readable name (e.g., ZOE, ZOL, Bonfire)
- **Handle:** Telegram @handle or Farcaster @handle (e.g., @zaoclaw_bot, @zolbot)
- **FID (if Farcaster):** Farcaster ID for blockchain agents
- **Persona:** One-line purpose + voice (e.g., "Personal concierge, matter-of-fact, pro-builder")
- **Owner:** Person/team who operates + decides escalations

### Repository + Code

- **Repo:** GitHub org/repo slug (e.g., bettercallzaal/ZAOOS)
- **Code path:** Directory in repo (e.g., bot/src/zoe/)
- **Entry point:** Main file or cron script (e.g., bot/src/zoe/index.ts or zol-daily.js)
- **Branch (if not main):** e.g., ws/v2-core-layers for ZOL v2
- **Version:** Semantic or deployment date (e.g., v1.2.3 or 2026-06-24)

### Runtime

- **Host:** Physical location (VPS 31.97.148.88, Pi ansuz 100.117.191.11, or external SaaS)
- **Runtime path:** Deployed directory (e.g., ~/zao-bot-live, ~/zol/farcaster-agent/)
- **Process:** How it runs (long-poll Telegram bot, cron, systemd, tmux, external API)
- **Process check:** Command to verify alive (e.g., `systemctl --user status zaostock-bot`, `ps aux | grep zol`)
- **Restart procedure:** How to deploy + restart (rsync + systemctl, or git pull + restart)
- **Env:** Where secrets live (e.g., ~/.zao/private/bonfire.env, ~/zaostock-bot/.env)

### Purpose + Scope

- **Purpose:** What does it do? (one sentence)
- **In scope:** Capabilities + typical tasks
- **Out of scope:** What it explicitly does NOT do (e.g., ZOL does not sign transactions, ZOE does not auto-spend > $50/day)
- **Status:** LIVE, PAUSED, SPINNING OUT, ARCHIVE (+ date)

### Authority + Human-Gates

- **Authority matrix:**
  - WHO can approve/trigger/escalate (e.g., Zaal only, Zaal + Iman, public)
  - WHEN approval is needed (e.g., every patch, every post, never)
  - HOW approval happens (e.g., Telegram button tap, explicit /approve, auto-PR-gated)
- **Escalation triggers:** 3 strikes, cost threshold, quality fail, human-needed clarification
- **Escalation path:** How agent asks for help (e.g., Telegram DM Zaal, post in general channel, send email)

### Dependencies

- **Services:** External APIs, databases, services (Neynar, XMTP, Supabase, Bonfire, OpenRouter)
- **Siblings:** Other agents this depends on (e.g., ZOE depends on Hermes, ZAO Devz depends on cowork-zaodevz data)
- **Model:** Which LLM (Claude Max, Sonnet, Haiku, Minimax, Ollama, external)
- **Rate limits:** Daily cap, cost cap, call frequency limits, backoff rules
- **Fallbacks:** What happens if a dependency is down (e.g., OpenRouter -> Ollama fallback, Neynar -> haatz fallback)

### Memory + Learning

- **Memory blocks:** Letta-style files (e.g., ~/.zao/zoe/persona.md, ~/.zao/zoe/human.md, ~/.zao/zoe/recent.md)
- **Persistence:** Where does it store state (disk, Supabase, Bonfire, JSON file)
- **Recall:** How does it look up past context (e.g., Bonfire delve API, Supabase query, grep ~/.zao/zoe/facts.md)
- **Update cadence:** When is memory refreshed (e.g., every task, daily, weekly, on-demand)

### Status Lifecycle

- **Current state:** LIVE, PAUSED, SHIPPED, SPINNING OUT, ARCHIVED, DECOMMISSIONED
- **Date launched:** 2026-MM-DD
- **Last update:** 2026-MM-DD + what changed
- **Next milestone:** Planned feature or graduation (if any)
- **Owner:** Zaal, Iman, external partner, etc.
- **Handoff:** If being transitioned to a new owner/repo, date + handoff checklist

### Example: ZOE Agent Documentation

```markdown
## ZOE - Personal Concierge

### Identity
- **Name:** ZOE (Agent Orchestrator)
- **Handle:** @zaoclaw_bot
- **Persona:** Matter-of-fact personal concierge, pro-builder, task-focused
- **Owner:** Zaal

### Repository
- **Repo:** bettercallzaal/ZAOOS
- **Code path:** bot/src/zoe/
- **Entry point:** bot/src/zoe/index.ts (main loop)
- **Branch:** main
- **Version:** 2026-07-16 (shipped 2026-06-29, work-loop + watcher shipped 2026-06-30)

### Runtime
- **Host:** VPS 31.97.148.88 (Hostinger KVM 2)
- **Runtime path:** ~/zao-bot-live (isolated clone, main branch only)
- **Process:** Long-poll Telegram bot via grammy
- **Process check:** `ssh zaal@31.97.148.88 "tmux list-sessions | grep zoe"`
- **Restart:** `bash ~/bin/zoe-autodeploy.sh` (polls for new commits, restarts if detected)
- **Env:** ~/zao-bot-live/.env (TOKEN, NEYNAR_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BONFIRE_API_KEY)

### Purpose
Zaal's personal concierge. Routes incoming tasks through decompose → dispatch → worker agents → critics → recap. Autonomous research drafts + PR pipeline (daily cap 6 items). Self-improve via Hermes (auto-PR workflow) with Zaal Y/N approval gate.

**In scope:**
- Task decomposition + worker dispatch
- Research doc generation + auto-PR + Zaal Y/N approval
- Brief/reflect captures
- Newsletter + social media draft generation
- Bonfire memory ingest (curated weekly episodes)
- Watcher cron (daily cost/fail/quality anomaly pings)

**Out of scope:**
- Auto-apply code patches (always Zaal Y/N first)
- Spend > $50/day across all modules
- Direct access to user wallet keys
- Publishing to social without draft stage (for comms)

### Authority + Human-Gates
- **Authority:** Zaal only (single operator)
- **Approval needed:** Every Hermes auto-PR (approvals.ts state machine), every social draft, high-spend alerts (>$10/task)
- **Approval mechanism:** Telegram buttons (Y/N, defer, escalate)
- **Escalation trigger:** Worker fails 3x, quality dip, cost unexpectedly high, clarity needed
- **Escalation:** ZOE messages Zaal in DM with context + asks for direction

### Dependencies
- **Services:** Claude Max (Hermes pattern), Neynar (Farcaster reads), XMTP (DM infrastructure), Supabase (RLS), Bonfire (memory graph), GitHub API (auto-PR)
- **Siblings:** Hermes (subprocess), ZOL (reports back via TG), research-worker, code-reviewer, comms-drafter (8 workers total)
- **Model:** Sonnet (core) + Haiku (workers) + Opus (escalate)
- **Rate limits:** $50/day cap, $20 Hermes + $10 ZOE concierge + $20 workers split, per-task cost tracked
- **Fallbacks:** If Bonfire down, skip memory ingest (not blocking). If Neynar down, ZOL still replies via Bonfire recall (local fallback).

### Memory
- **Blocks:** persona.md (voice), human.md (self-improve rules + Zaal preferences), recent.md (last 20 tasks), tasks.md (backlog), facts.md (learned lessons), captures.md (raw notes)
- **Persistence:** ~/.zao/zoe/ directory on VPS (git-tracked for audit)
- **Recall:** Bonfire for facts + past episodes, grep ~/.zao/zoe/ for recent, Postgres runs.ts telemetry
- **Update:** Daily per recap.ts (runs after each major task), weekly episode ingest to Bonfire

### Status
- **Current:** LIVE + SHIP-READY (orchestrator fully deployed 2026-06-30)
- **Launched:** 2026-05-26 (grill locked decisions)
- **Last shipped:** 2026-06-30 (work-loop + watcher)
- **Next:** Unblock Bonfire labeling → enable memory writes
- **Owner:** Zaal
```

---

## NEXT ACTIONS

| Action | Owner | Target Date | Status |
|--------|-------|-------------|--------|
| Clarify ZAO Devz ownership + decide integrate-or-standalone | Zaal | 2026-07-23 | DECISION NEEDED |
| Document ZOL v2 ship date + promotion plan in project_zol_farcaster_agent.md | Zaal | 2026-07-23 | PLANNING |
| Unblock Bonfire labeling (what's the admin step?) | Zaal | 2026-07-30 | BLOCKER |
| Archive or mark decommissioned agent docs (doc 601, etc.) with ARCHIVED header | Claude Code | 2026-07-30 | CLEANUP |
| Update bot README files (bot/src/zoe/README.md, bot/src/devz/README.md, bot/src/hermes/README.md) to use this standard schema | Claude Code | 2026-08-06 | DOCUMENTATION |
| Wire ZOL v2 into ZAOOS + verify main clone auto-deploys v2 once merged | Zaal | 2026-08-13 | INTEGRATION |
| Enable recap.ts → Bonfire episode writes (ship per doc 759 Gap 3) | Zaal | 2026-08-20 | FEATURE |

---

## SOURCES

- CLAUDE.md `Primary Surfaces` table + `Decommissioned` list (2026-05-04 post-cleanup)
- AGENTS.md `Bot Subtree` section + security notes
- Memory files: project_zoe_orchestrator_locked (2026-06-24+30 updates), project_hermes_canonical, project_zol_farcaster_agent (2026-07-12 update), project_cowork_zaodevz, project_zaostock_bot_live
- .claude/rules/agent-loops.md (operating doctrine)
- Doc 759 (ZOE orchestrator + gap analysis)
- Doc 601 (agent stack cleanup decision)
- Live runtime verification: VPS 31.97.148.88 (zoe-bot-live, zaostock-bot, zoe loops), Pi ansuz (ZOL)
- Audit date: 2026-07-16

---

## COUNT SUMMARY

- **Live agents:** 6 (ZOE, Hermes reused, ZAO Devz, ZAOstock, ZOL, Bonfire)
- **Build loops:** 5 tmux sessions (zoe, human, zol, ww, coc) — 2 active (zoe, human), 3 paused/external (zol, ww, coc)
- **Supervisor processes:** 4 (loops-keepalive, zoe-autodeploy, zaostock-bot systemd, zol Pi crons)
- **Decommissioned systems:** 7 (openclaw squad, Composio AO, ZOE v2/Agent Zero, 10-bot fleet, zao-team-bots, Hermes-standalone, FISHBOWLZ)
- **Drift/cleanup targets identified:** 6 (see Drift section above)

---

## RECOMMENDATION

**Where the canonical registry should live:**

The source of truth for agent state should be:
1. **This doc (1182-zao-agent-registry/README.md)** — audit snapshot, refreshed quarterly or after major fleet changes
2. **CLAUDE.md (existing)** — canonical reference for Primary Surfaces + Decommissioned systems (WRITE-ONCE, changes rare)
3. **AGENTS.md (existing)** — high-level bot patterns + security + boundaries
4. **Agent-specific README files** — each agent gets a README in its code dir (bot/src/zoe/README.md, etc.) using this standard schema, updated when code changes
5. **Machine-readable registry (optional future)** — if automation needs to query fleet state (e.g., loop supervisor checking cost attribution), add a `registry.yaml` in research/agents/1182-zao-agent-registry/ + a short script to validate it against git history

**Immediate action:** Update bot/src/zoe/README.md, bot/src/devz/README.md, bot/src/hermes/README.md using the standard schema template. Use this doc as the source for copy-paste identity + runtime details, then keep those READMEs in sync as code evolves.

