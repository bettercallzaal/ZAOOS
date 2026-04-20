### 460 — ZAO Agentic Stack: End-to-End Design

> **Status:** Research complete
> **Date:** 2026-04-20
> **Goal:** Map every agent across every ZAO machine, define dispatch hierarchy + source-of-truth + handoff flows, identify top 5 gaps + top 3 duplications, ship a week/month/quarter adoption plan.
> **Builds on:** docs 234, 236, 412, 415, 422, 441, 442, 448, 459

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Stack hierarchy** | USE 4-layer model: **Edge** (Claude Code on dev machines) → **Concierge** (ZOE on VPS 1, dispatcher) → **Specialists** (ZOEY/WALLET/ROLO + in-app VAULT/BANKER/DEALER) → **Cloud routines** (Claude Routines on Anthropic infra). Each layer has clear ownership. |
| **Dispatch entry point** | USE Telegram-to-ZOE as default human entry. Claude Code direct only when Zaal is already at a keyboard editing code. ZOE forwards code tasks to coding agent (Conductor or Composio AO). |
| **Source of truth** | USE 3-store split: **(a)** ZAO OS git repo for code/research/ADRs/agent configs, **(b)** Supabase for runtime data (agent_events, casts, profiles, audit_log), **(c)** ZOE workspace markdown (SOUL/MEMORY/HEARTBEAT/TASKS) for ZOE-only state. **Eliminate** per-machine auto-memory drift (see Gap #2). |
| **Cross-machine sync** | USE git-as-sync for code+research+ADRs (already true). USE Supabase as source-of-truth for agent state. ADD a syncing layer for auto-memory: nightly rsync from each machine's `~/.claude/projects/.../memory/` into a private `zao-memory` git repo. |
| **Composio AO vs Conductor.build** | USE **Composio AO on VPS 1** (not BCZ local) for delegated coding. Replaces "open another Claude Code terminal manually." Conductor.build = Mac-only, doesn't help Windows home rig. AO is platform-agnostic + already piloted at BCZ (doc 415). |
| **Claude Routines for cron** | MIGRATE all VPS cron jobs to Claude Routines per doc 422. Routines run on Anthropic cloud, survive VPS reboots, observable via dashboard. Keep VPS cron only for VPS-local needs (auto-pull, Docker health). |
| **VAULT/BANKER/DEALER (in-app trading agents)** | KEEP in `src/lib/agents/` running on Vercel cron + Next.js routes. They need wallet signer + Supabase RLS access — NOT delegatable to ZOE. Hard isolation. |
| **VPS 2 ZAAL ASSISTANT scope** | CANCEL or DEFER. Today's ZOE on VPS 1 covers personal productivity. Adding a second VPS doubles surface area for ~0 capability gain. Revive only if VPS 1 ZOE saturates. |
| **Windows home rig parity** | ADD `~/.bashrc` `zsesh` equivalent (alias block already drafted). ADD per-machine `~/.claude/projects/` directory pointer to a synced location. |
| **Agent-to-agent comms** | USE Composio AO message bus where possible. Fall back to Telegram bot for human-readable handoffs. AVOID ad-hoc HTTP calls between agents — too brittle. |

---

## Stack Diagram

```
                  HUMAN ENTRY POINTS
              (Zaal speaks to ZAO stack)
        ┌──────────────┬─────────────────────┐
        │              │                     │
        v              v                     v
   ┌─────────┐    ┌─────────┐         ┌──────────┐
   │ Browser │    │Telegram │         │ Terminal │
   │ /Phone  │    │ DM      │         │ Claude   │
   │ ZAO OS  │    │ @zaoclaw│         │ Code +   │
   │ web app │    │  bot    │         │ Windsurf │
   └────┬────┘    └────┬────┘         └─────┬────┘
        │              │                     │
        │      Layer 1: EDGE (Code authoring + browse)
        │      ───────────────────────────────────────
        │              │                     │
        │              v                     v
        │      ┌──────────────────────────────────┐
        │      │    Claude Code Sessions           │
        │      │  Mac work rig + Win home rig      │
        │      │  - zsesh worktrees                │
        │      │  - ECC plugin (continuous-learning│
        │      │    -v2, gateguard, hookify, etc.) │
        │      │  - 30+ ZAO custom skills          │
        │      └──────────────┬───────────────────┘
        │                     │ git push (PRs to main)
        │                     v
        │           ┌──────────────────┐
        │           │  GitHub repo     │
        │           │  bettercallzaal/ │
        │           │  ZAOOS           │  <── single SOURCE OF TRUTH
        │           │  (code, research,│       for code + docs + research
        │           │   ADRs, evals)   │
        │           └────┬─────────┬───┘
        │                │         │
        │     PR webhook │         │ git pull (every 15 min)
        │                v         v
        v          Vercel       VPS 1 (Hostinger)
   ┌──────────┐   build/deploy  ─────────────────
   │ Vercel   │   ┌─────────┐  Layer 2: CONCIERGE
   │ web app  │   │  Web    │  ─────────────────
   │ Next.js  │<──│  prod   │  ┌──────────────────┐
   └────┬─────┘   └─────────┘  │  ZOE (dispatcher)│
        │                      │  - SOUL.md /     │
        │ Layer 3a:            │    AGENTS.md /   │
        │ IN-APP AGENTS        │    MEMORY.md /   │
        │ ─────────────────    │    TASKS.md      │
        │ ┌──────────────┐     │  - Telegram bot  │
        │ │ src/lib/     │     │  - 30-min        │
        │ │ agents/      │     │    learning ping │
        │ │ - VAULT      │     │    (deployed     │
        │ │ - BANKER     │     │    2026-04-20,   │
        │ │ - DEALER     │     │    awaits keys)  │
        │ │ run on cron  │     └────┬──────┬──────┘
        │ │ on Vercel    │          │      │
        │ │ + Supabase   │          │      │ openclaw dispatch
        │ │ writes       │          │      v
        │ └──────────────┘          │  Layer 3b: SPECIALISTS
        │                           │  ────────────────────
        │                           │  ┌─────┐ ┌─────────┐ ┌─────┐
        │                           │  │ZOEY │ │ WALLET  │ │ROLO │
        │                           │  │     │ │         │ │     │
        │                           │  │ exec│ │on-chain │ │CRM/ │
        │                           │  │tasks│ │ ops     │ │roldx│
        │                           │  └──┬──┘ └────┬────┘ └──┬──┘
        │                           │     │         │         │
        │                           │     v         v         v
        │  ┌────────────────────────┴──────────────────────────┐
        │  │   SHARED INFRA (used by every agent)             │
        │  │  - Supabase (runtime data + agent_events log)     │
        │  │  - Neynar (Farcaster API)                          │
        │  │  - Base chain (ZABAL/staking/swaps)                │
        │  │  - Privy/Wagmi (wallet signers)                    │
        │  │  - openclaw config (channels, MCP, env)            │
        │  └────────────────────────────────────────────────────┘
        │
        │  Layer 4: CLOUD ROUTINES (Anthropic infra)
        │  ────────────────────────────────────────
        │  ┌──────────────────────────────────┐
        │  │  Claude Routines (Max tier 15/d) │
        │  │  - morning brief                  │
        │  │  - nightly memory consolidation   │
        │  │  - newsletter digest              │
        │  │  - WaveWarZ digest                │
        │  │  - ZABAL swarm report             │
        │  │  - inbox processing               │
        │  │  - per-area delta-summary         │
        │  │  Each: own GitHub state repo      │
        │  │  zao-routines, opens PRs to main  │
        │  └──────────────────────────────────┘
        │
        v  Composio AO (delegated coding work)
   ┌───────────────────────────────────────┐
   │  Composio Agent Orchestrator          │
   │  - Currently piloted on BCZ local     │
   │  - PROPOSED: move to VPS 1            │
   │  - Picks up GitHub issues / Slack     │
   │    asks, opens PRs from claude/<task> │
   │  - Delegates to spawned Claude Code   │
   │    instances in worktrees             │
   └───────────────────────────────────────┘
```

---

## Per-Agent Role + Machine Table

| Agent | Layer | Machine | Runtime | Talks to | Reads | Writes | Triggered by |
|-------|-------|---------|---------|----------|-------|--------|--------------|
| **Claude Code (Zaal)** | Edge | Mac work, Win home | Anthropic cloud via CLI | Zaal directly + git/gh CLI | repo, ECC plugin, MCPs | repo (via PRs), `~/.claude/` config | Zaal opens terminal |
| **Claude Code subagents** | Edge | Same as parent | Inherits parent | Parent agent | Same as parent (via tool grants) | Same | Parent dispatches via Agent tool |
| **VAULT** | In-app | Vercel function | Next.js cron route | Supabase, 0x API, Privy wallet | `agent_config`, `agent_events`, ETH price | `agent_events` (status), Base txs | Vercel cron 1x/day |
| **BANKER** | In-app | Vercel function | Next.js cron route | Same as VAULT + Telegram | Same | Same | Vercel cron 1x/day |
| **DEALER** | In-app | Vercel function | Next.js cron route | Same as BANKER | Same | Same | Vercel cron 1x/day |
| **ZOE** | Concierge | VPS 1 Docker container | OpenClaw + Minimax M2.7 | Telegram, GitHub gh CLI, all VPS tools | `/home/node/openclaw-workspace/{SOUL,AGENTS,MEMORY,TASKS,HEARTBEAT}.md`, ZAOOS clone | Same workspace + dispatches to ZOEY/WALLET/ROLO | Telegram DM, cron heartbeat |
| **ZOEY** | Specialist | VPS 1 Docker container | OpenClaw + Minimax M2.7 | ZOE (only) | `/home/node/openclaw-workspace/zoey/` | Same + results | ZOE dispatch via `openclaw agent` |
| **WALLET** | Specialist | VPS 1 Docker container | OpenClaw + Minimax M2.7 | ZOE (only) | `/home/node/openclaw-workspace/zao-wallet/` | Same + tx logs | ZOE dispatch |
| **ROLO** | Specialist | VPS 1 Docker container | OpenClaw + Minimax M2.7 | ZOE | Pixel office state, contact data | Rolodex updates | ZOE dispatch |
| **ZOE learning pings** | Cron | VPS 1 host (zaal user) | Python + Claude Haiku via API | Telegram, Anthropic | `/home/zaal/zao-os/research/`, `/home/zaal/zao-os/docs/adr/` | `~/.cache/zoe-learning-pings/sent.json` | crontab `*/30 * * * *` (gated 9am-9pm ET) |
| **Composio AO** | Cloud-ish | BCZ local (PILOT) → propose VPS 1 | tmux runtime + AO plugins | GitHub, OpenClaw notifier | GitHub issues/PRs, Slack | Branches `claude/<task>`, PRs to main | GitHub issue/PR comment, Slack |
| **Claude Routines** | Cloud | Anthropic infra | sandboxed cloud container | GitHub (`zao-routines` repo), trusted/full-network APIs | `zao-routines` repo state, prior memory deltas | PRs to `zao-routines` | Anthropic-managed schedule (cron in UI) |

---

## Dispatch Decision Tree

When Zaal has a task, this is "where to send it":

```
Is it a coding task with files to edit?
├── YES, and Zaal is already at a keyboard
│   → Claude Code (zsesh new worktree)
├── YES, but Zaal is mobile or wants to delegate
│   → Telegram → ZOE → ZOE creates GitHub issue → Composio AO picks up
│       (issue must include `auto-pickup` label)
├── NO, it's a "tell me / look up" question
│   → Telegram → ZOE → ZOE answers from MEMORY.md or web search
├── NO, it's a "ship this content" task (newsletter, social)
│   → Claude Code with /newsletter or /socials skills
│       OR Claude Routine if recurring (daily/weekly)
├── NO, it's "run this trade / on-chain action"
│   → Already automated via VAULT/BANKER/DEALER (don't intervene)
│       For one-off: Telegram → ZOE → WALLET dispatch
├── NO, it's a "schedule this" task
│   → Claude Routine (preferred, cloud-native)
│       OR cron on VPS 1 if VPS-local need
└── NO, it's "research this topic"
    → Claude Code /zao-research
        Or for daily sweep: ZOE 30-min learning ping (passive)
```

---

## Source-of-Truth Map

| State type | Source of truth | Mirrored to | Notes |
|-----------|-----------------|-------------|-------|
| Code | `bettercallzaal/ZAOOS` GitHub main branch | All dev machines via `git pull`, VPS 1 via cron | Existing |
| Research docs | Same — `research/` in repo | Synced everywhere | Existing |
| ADRs | `docs/adr/` in repo | — | NEW (added 2026-04-20) |
| Project memory | `.claude/memory.md` in repo | — | NEW (added 2026-04-20) |
| Agent configs | `community.config.ts` + `src/lib/agents/config.ts` | — | Existing |
| Runtime agent state | Supabase `agent_config`, `agent_events`, `audit_log` | — | Existing |
| ZOE persistent context | `/home/node/openclaw-workspace/{SOUL,AGENTS,MEMORY,TASKS,HEARTBEAT}.md` | (none yet — should mirror to git) | **GAP** |
| Per-agent specialist context | `/home/node/openclaw-workspace/{zoey,zao-wallet}/{SOUL,AGENTS}.md` | — | Same gap |
| User auto-memory | `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` (per-machine) | — | **GAP — drifts across Mac/Windows** |
| ECC instinct store | `~/.claude/projects/.../instincts/` (per-machine) | — | Same gap |
| Routines memory | Per-routine: `zao-routines/memory/<name>-{latest,log}.json` | — | Future (doc 422 plan) |
| Composio AO state | tmux session + GitHub PR comments | — | Pilot stage |

---

## Handoff Flows (4 Real Examples)

### Flow 1: Zaal codes a feature on Mac

```
1. Zaal opens Mac terminal
2. zsesh new-feature                 # spawn isolated worktree + Claude Code
3. Claude Code (with continuous-learning-v2 hooks) edits files
4. Zaal: "ship"  → /ship skill runs typecheck + tests + push + PR
5. PR merged → Vercel deploys
6. ZOE git auto-pull cron picks up change in 15 min
7. ZOE updates MEMORY.md with merge note ("PR #N: <title>")
8. (proposed) Claude Routine "nightly consolidation" summarizes day's PRs
```

### Flow 2: Zaal is mobile, wants to delegate a refactor

```
1. Zaal: Telegram → ZOE: "refactor src/components/spaces/SpaceCard to use Tailwind v4"
2. ZOE opens GitHub issue with task + label `auto-pickup`
3. Composio AO (running on VPS 1, watching label) picks up issue
4. AO spawns Claude Code worktree on VPS 1 OR triggers a Claude Routine
5. AO opens PR from claude/refactor-spacecard branch
6. ZOE notifies Zaal via Telegram with PR link
7. Zaal reviews + merges
```

### Flow 3: VAULT executes daily trade

```
1. Vercel cron fires src/app/api/agents/vault/route.ts at 09:00 UTC
2. runner.ts: getAgentConfig(VAULT) → claimBudget atomic
3. runner.ts: maybeAutoStake (logs add_lp event if executes)
4. runner.ts: executeSwap → burnZabal (logs burn separately now per ADR-002)
5. logAgentEvent: writes status='success' to Supabase agent_events
6. postTradeUpdate → Farcaster cast via Neynar
7. Admin dashboard at /admin/agents reads agent_events, displays
8. (proposed) ZOE Telegram alert if status='failed'
```

### Flow 4: Random tip arrives in Zaal's Telegram

```
1. crontab on VPS 1 host fires /home/zaal/zoe-learning-pings/run.sh at HH:00 or HH:30
2. run.sh sources env, git pull /home/zaal/zao-os
3. random_tip.py picks random doc from research/ + docs/adr/, excluding last 7 days
4. Calls Anthropic Claude Haiku 4.5 API for 1-tip extraction
5. POST to Telegram bot API with chat_id 1447437687
6. State file updated with sent doc path
7. Zaal sees [ZOE TIP] in Telegram, may act on it or ignore
```

---

## Top 5 Gaps (Ranked by Impact)

### Gap 1 — Cross-machine memory drift (HIGH)
**Problem:** `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` lives on each machine separately. Mac work rig has 50+ feedback memos; Windows home rig has 0. ECC instinct store (now active via continuous-learning-v2) will diverge same way.

**Fix:** Create private `zao-memory` git repo. Each machine's `~/.claude/projects/.../memory/` is a clone. Nightly `git commit + push` from cron, `git pull` on session start. Use `.gitignore` to exclude session-ephemeral files.

**Effort:** 4/10. Difficulty: setup once, runs forever.

### Gap 2 — ZOE workspace not in git (HIGH)
**Problem:** `/home/node/openclaw-workspace/{SOUL,AGENTS,MEMORY,TASKS,HEARTBEAT}.md` is the canonical ZOE state. Lives only in the Docker volume. If container rebuilds (image upgrade, disk failure), ZOE loses identity.

**Fix:** Mirror workspace to a private `zoe-workspace` repo. Cron job inside container: nightly `git commit + push`. On container start, `git pull` if mounted volume is empty.

**Effort:** 3/10. Pattern from doc 234 §4 (memory persistence).

### Gap 3 — Composio AO not connected to ZOE (HIGH)
**Problem:** Composio AO pilot is at BCZ local (doc 415). ZOE on VPS 1 has no visibility into AO state. Tasks dispatched via Telegram to ZOE can't flow into AO's queue. Two parallel automation universes.

**Fix:**
1. Move AO instance from BCZ local → VPS 1 (same Docker host as ZOE).
2. Add ZOE → AO bridge: ZOE creates GitHub issue with `auto-pickup` label, AO watches the label.
3. AO PR creation → notifies ZOE → ZOE Telegrams Zaal.

**Effort:** 5/10. Most complex of the 5 — needs config wiring + label conventions.

### Gap 4 — Windows home rig parity (MEDIUM)
**Problem:** Home Claude found `zsesh: command not found`. Mac aliases don't transfer. Auto-memory dir doesn't exist on Windows either. Home box can do code work but loses everything ECC instinct + memory have learned on Mac.

**Fix:** (a) bash equivalent of `zsesh` block in `~/.bashrc` (already drafted in earlier session), (b) clone `zao-memory` repo (Gap 1), (c) install ECC plugin on home box if not already, (d) set Windows path conventions in `.claude/memory.md`.

**Effort:** 2/10. Mostly copy-paste once Gap 1 lands.

### Gap 5 — VAULT/BANKER/DEALER alerting on failure (MEDIUM)
**Problem:** Per ADR-002 + PR #232, agent failures now log `CRITICAL audit-trail drop` events. But nothing alerts Zaal in real time when an agent fails. Zaal might not see a stuck agent for days.

**Fix:** Add Supabase Postgres trigger on `agent_events` insert WHERE status = 'failed' → call ZOE webhook → ZOE Telegram alert. Or simpler: Vercel function checks for failures every 6 hours, alerts via ZOE.

**Effort:** 3/10. Webhook + ZOE Telegram template.

---

## Top 3 Duplications

### Dup 1 — Memory: project `.claude/memory.md` vs user auto-memory vs ZOE MEMORY.md
Three memory stores, partial overlap, no single source.

**Consolidate:** Treat each as a layer:
- `.claude/memory.md` (repo) — *project-architectural truth*. Read by every agent on every machine.
- `~/.claude/projects/.../memory/` (per-user) — *user preferences + cross-project feedback*. Sync via Gap 1 fix.
- ZOE `MEMORY.md` (workspace) — *concierge-specific runtime context*. Sync via Gap 2 fix.

After Gaps 1+2: 3 stores, all backed by git, no drift.

### Dup 2 — Cron schedules across VPS + Vercel + (planned) Routines
- VPS host crontab (auto-pull, ZOE pings, archive sessions, patch AO plugin)
- VPS container cron (ZOE pulse, ZOEY FC scan, community voice)
- Vercel cron (VAULT/BANKER/DEALER agent runs)
- Planned: Claude Routines (morning brief, newsletter, etc.)

**Consolidate:** Move every schedule that DOESN'T require local file/process access to Claude Routines per doc 422. Keep only:
- VPS host crontab: auto-pull (only because it's a `git pull` on local clone), Docker health checks
- Vercel cron: VAULT/BANKER/DEALER (need wallet signer + Supabase service-role)

Move to Routines: morning brief, nightly consolidation, newsletter digest, FC scan, community voice, ZABAL swarm report, inbox processing.

### Dup 3 — Skill ecosystem overlaps
ECC plugin: 183 skills, ~20 active. Superpowers: 12 skills. Caveman: 5 skills. ZAO custom: 30+ skills. gstack: 20+ skills. autoresearch: 8 skills.

**Consolidate:** Run quarterly `/skill-stocktake` (per doc 442 first run = 24 distinct skills, 83% healthy). Specifically:
- Drop ECC duplicates of ZAO skills: `everything-claude-code:tdd-workflow` (have superpowers TDD), `everything-claude-code:e2e-testing` (have gstack), `everything-claude-code:content-engine` (have /socials).
- Drop ECC framework-specific skills (Django/Spring/Laravel/etc) — already in skillOverrides.
- Verify skillOverrides actually filtered (gap from doc 459).

---

## Adoption Plan

### This Week (2026-04-21 → 2026-04-25)
| # | Task | Owner | Difficulty |
|---|------|-------|------------|
| 1 | Activate ZOE learning pings (paste keys + uncomment cron) — 5 min from PR #236 | Zaal | 1/10 |
| 2 | Add `zsesh` bash alias to Windows home rig `~/.bashrc` | Zaal | 1/10 |
| 3 | Verify ECC plugin loaded on home rig + run `/harness-audit` (expect 29/29) | Zaal/Claude | 1/10 |
| 4 | Prune skillOverrides duplicates after seeing which format bit | Claude session | 2/10 |
| 5 | Open `zao-memory` private repo + clone on Mac, init from current state | Zaal | 3/10 |
| 6 | Open `zoe-workspace` private repo + wire git push from VPS 1 container | Zaal/Claude pair via /vps | 4/10 |

### This Month (April 21 → May 20)
| # | Task | Difficulty |
|---|------|------------|
| 7 | Move Composio AO from BCZ local → VPS 1 + wire to ZOE via GitHub issue label | 6/10 |
| 8 | Create `zao-routines` repo per doc 422; migrate morning brief + nightly consolidation as first 2 routines | 5/10 |
| 9 | Wire VAULT/BANKER/DEALER failure alerts → ZOE Telegram | 3/10 |
| 10 | Sync auto-memory dirs across machines via `zao-memory` repo (cron) | 3/10 |
| 11 | Run `/skill-stocktake full` after 1 month of CL-v2 instinct accumulation; act on retire/merge verdicts | 3/10 |
| 12 | Decide CANCEL vs DEFER on VPS 2 ZAAL ASSISTANT | 1/10 |

### This Quarter (April 21 → July 20)
| # | Task | Difficulty |
|---|------|------------|
| 13 | All 10+ daily ZAO automations migrated to Claude Routines (doc 422 inventory) | 7/10 |
| 14 | First production-pulled real eval fixture per agent (VAULT/BANKER/DEALER/ZOE) — replace doc 441 scaffolds | 5/10 |
| 15 | Quarterly silent-failure hunt (ADR-002 follow-up) — re-run doc 457 hunter agent on whatever's new | 2/10 |
| 16 | Dead-letter queue for `CRITICAL audit-trail drop` (Redis or pg_cron); upgrade events.ts from log → durable | 6/10 |
| 17 | ZOE pings v2: include instinct store as source (after Gap 1 syncs cross-machine), boost weighted by recent git activity | 4/10 |
| 18 | Public agent-stack diagram on website (build-in-public win) | 3/10 |

---

## Comparison of Options (orchestration tier)

| Option | Where it runs | What it orchestrates | Cost | When to use | Verdict |
|--------|---------------|----------------------|------|-------------|---------|
| Manual `/worksession` + `zsesh` | Local dev machine | One Claude Code session per task | $0 | Default for all interactive code work | **KEEP** |
| Conductor.build | Mac local | Multiple parallel Claude Code in worktrees | Free | When 3+ simultaneous PRs from one rig | OPTIONAL — Mac-only limits utility |
| Composio AO | Anywhere with Docker | Multi-agent fleet, GitHub-driven | Free + LLM | Delegated work (ZOE → AO → Claude Code) | **ADOPT on VPS 1** (move from BCZ) |
| Claude Routines | Anthropic cloud | Scheduled cloud Claude runs | $20/mo Max included | All scheduled work that doesn't need local FS | **ADOPT for cron migration** |
| Replicas.dev | Replicas cloud | Background agents from GitHub/Slack | Paid SaaS | When AO doesn't suffice | SKIP for now (AO covers) |
| OpenClaw (current ZOE) | VPS 1 | ZOE/ZOEY/WALLET/ROLO concierge stack | $5/mo VPS + $15/mo Minimax | Persistent agent that needs to live 24/7 | **KEEP — irreplaceable** |
| AO Agents (Arweave) | Decentralized | On-chain compute | Variable | Compliance-critical decentralization | SKIP (doc 412 — too early) |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Machines in stack | 4 (Mac work, Windows home, VPS 1 Hostinger, BCZ local) — VPS 2 cancelled |
| Active agents | 8 (ZOE, ZOEY, WALLET, ROLO, VAULT, BANKER, DEALER + ZOE pings cron) |
| ECC plugin skills installed | 183 (target ~20 after skillOverrides verifies) |
| ZAO custom skills | 30+ |
| Research docs library | 240+ (now 460+) |
| ADRs shipped | 2 (more to come) |
| Per-machine memory stores | 3 currently (will be 1 logical store via Gap 1) |
| Cron schedules across stack | ~12 (will reduce to ~4 after Routines migration) |
| Average daily Telegram pings (after activation) | 24 (12 hours × 2/hour, 9am-9pm ET) |
| Agent failure visibility today | Logs only (no alerts) — Gap 5 fixes |
| Wrong-branch incidents this week | 2 (zero target after Gap 4 + doc 459 adoption) |

---

## ZAO Ecosystem Integration

Files / paths impacted:
- `/Users/zaalpanthaki/Documents/ZAO OS V1/src/lib/agents/` — VAULT/BANKER/DEALER home, no change
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md` — add stack-overview pointer
- `~/.claude/projects/.../memory/` — target for Gap 1 sync
- `/home/node/openclaw-workspace/` (VPS 1) — target for Gap 2 sync
- `~/.zshrc` (Mac) + `~/.bashrc` (Windows home) — `zsesh` parity
- `/home/zaal/zoe-learning-pings/` (VPS 1) — already deployed, awaits keys
- New repos to create: `zao-memory` (private), `zoe-workspace` (private), `zao-routines` (per doc 422)

---

## Sources

- [OpenClaw GitHub](https://github.com/anthropics/openclaw) (Doc 234 cites 339K stars, MIT)
- [Conductor.build](https://conductor.build) (YC S24, $2.8M)
- [ComposioHQ/agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator) (6.3K stars, MIT)
- [Anthropic Claude Routines launch (2026-04-14)](https://docs.claude.com/claude/routines)
- [@hooeem Claude Routines guide](https://x.com/hooeem) (120.4K views, 2026-04-16)
- ZAO docs 234, 236, 412, 415, 422, 441, 442, 448, 459 (in this library)

---

## Next Action

Pick from "This Week" list. My pick for first move:
- **#1 Activate ZOE learning pings** (5 min, immediate visible payoff today)
- **#2 Add `zsesh` to Windows home rig** (1 min, fixes home box parity)

Both unlock daily compounding value. After that: #5 + #6 (open `zao-memory` + `zoe-workspace` repos) sets up the sync infrastructure that everything else needs.
