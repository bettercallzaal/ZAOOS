---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: "Map the live runtime state - every bot, agent, cron, VPS, deploy target as of 2026-05-23. 5 canonical surfaces, killed components, VPS topology, scheduled jobs, external deps, health/observability."
---

# 722h - ZAO Runtime State Audit (as of 2026-05-23)

Complete map of active bots, agents, scheduled services, VPS topology, and external dependencies. Reference for operator troubleshooting and new-agent deployments.

---

## Executive Summary

**Five canonical surfaces live on two VPS instances:**

1. **ZOE** (@zaoclaw_bot) - Hermes-brain concierge, Zaal + team DM capture/recall
2. **Hermes** (@zoe_hermes_bot) - Autonomous PR fixer, coder+critic+auto-PR pipeline
3. **ZAO Devz** (@zaodevz_bot) - Group dispatch router + hourly learning tip (Phase 3: fold into Hermes)
4. **Bonfire** (@zabal_bonfire) - Knowledge graph DM bot, external service at bonfires.ai (Genesis tier, wallet-gated)
5. **ZAOstock bot** (@ZAOstockTeamBot) - Festival team coordination (graduating to own repo)

**Decommissioned 2026-05-04 (locked, do not resurrect):**
- openclaw container + 7-agent squad (ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER)
- Composio AO orchestrator
- 10-bot branded fleet
- FISHBOWLZ audio rooms
- ZOE v2 / Agent Zero migration

**New team bots (not yet live, pending Zaal 3-Q approval, doc 644):**
- Magnetiq (@zao_magnetiq_bot) - Research assistant for Tyler collab
- AttaBotty (@z_attabotty_bot) - Stream production + VOD review

---

## VPS Topology

### VPS 1: Hostinger KVM 2 @ 31.97.148.88

**Owner:** Zaal  
**Specs:** 31GB RAM, 8 cores, 500GB SSD  
**Access:** SSH as user `zaal` (key at ~/.ssh/id_rsa)  
**Services running:**
- bot/src/zoe/ (ZOE concierge, Telegram polling)
- bot/src/hermes/ (Hermes PR fixer, webhook listener)
- bot/src/devz/ (ZAO Devz dispatcher, hourly cron)
- bot/src/teams/ (Magnetiq + AttaBotty when approved)
- bot/ root (ZAOstock Team Bot, systemd service)
- Ollama at localhost:11434 (llama3.1:8b, 4.9GB, classify-only)

**Service management:**
- Systemd user units at `~/.config/systemd/user/*.service`
- Monitored via `systemctl --user status <service>` + `journalctl --user -u <service>`
- All bots use node/tsx entry points, restart on failure

### Iman's VPS @ 187.77.3.104

**Owner:** Iman (cowork-zaodevz lead, imanagent runner)  
**Specs:** Unknown from audit (internal to Iman's setup)  
**Services running:**
- @ZAOcoworkingBot (Hermes-pattern concierge for cowork tracker)
- /meeting transcription skill (SSH from Zaal's Mac via /meeting skill)
- Bonfire /bonfire skill (SSH from Zaal's Mac via /bonfire skill)

**Note:** This VPS is NOT under Zaal's direct control. SSH access is mediated through skill bridges from Mac terminal.

**NO VPS 2 exists.** Memory doc `project_no_vps2` confirms VPS 1 is the only production box. Historical references to "VPS 2" are obsolete.

---

## Five Canonical Surfaces (Live State)

### 1. ZOE (@zaoclaw_bot)

**Purpose:** Concierge for task capture, research, brief/reflect, recall, decision logging.

**Location:** bot/src/zoe/ on VPS 1  
**Tech Stack:**
- Runtime: Node.js + grammy (Telegram polling) + Claude Code CLI subprocess
- Memory: Hermes-style 4-block pattern at `~/.zao/zoe/` (blocks.json, recent.jsonl, facts.md, history.jsonl)
- Auth: Claude Code Max plan OAuth (~/.claude/auth.json), NOT API key
- Recall backend: BONFIRE_API_KEY + BONFIRE_ID for optional graph bridge

**Entry point:**
```bash
pnpm tsx src/zoe/index.ts
# OR via systemd user unit (when added)
systemctl --user start zoe-bot
```

**Configuration:**
- `ZOE_BOT_TOKEN` or `TELEGRAM_BOT_TOKEN` - Telegram bot token from @BotFather
- `ZAAL_TELEGRAM_ID` - Allowlist Zaal's DM scope
- `BONFIRE_API_KEY` - Optional, for DM relay to @zabal_bonfire
- `BONFIRE_ID` - Optional, graph recall
- `BONFIRE_API_URL` - Default: https://tnt-v2.api.bonfires.ai

**Scheduled jobs (bot/src/zoe/scheduler.ts):**
- **Morning brief:** 6:00am EST → calls concierge, posts to Zaal DM
- **Evening reflection:** 9:00pm EST → "what shipped today?" prompt, captures to blocks
- **Hourly nudge:** Every hour on :00 → learning tip or task reminder (to ZAO Devz General topic)

**Memory blocks** (persistent, per-chat scope):
- `blocks.json` - 4-block Letta-style (identity/context/goals/constraints)
- `recent.jsonl` - rolling 50 recent turns per chat
- `facts.md` - extracted knowledge (per-group or private)
- `history.jsonl` - full audit trail

**Capabilities:**
- /task <text> - add to Supabase tasks table
- /capture <text> - INGEST FACT to memory blocks
- /research <topic> - Claude-powered web/file research
- /brief - morning briefing
- /reflect - evening reflection prompt
- /recall <query> - graph search (if BONFIRE_API_KEY set)
- Group routing via allowlist + mode (silent/mention/all)

**Status:** LIVE (2026-05-05, Hermes-brain swap complete). Openclaw brain killed. systemd unit not yet wired (currently manual start or via /vps skill).

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/`

---

### 2. Hermes (@zoe_hermes_bot)

**Purpose:** Autonomous code-fix PR pipeline. Coder writes, critic reviews, auto-opens PR.

**Location:** bot/src/hermes/ on VPS 1  
**Tech Stack:**
- Runtime: Node.js + grammy + Claude Code CLI subprocess + git
- Auth: Claude Code Max plan OAuth (~/.claude/auth.json)
- Model routing: Opus (coder) + Sonnet (critic) via cost routing in claude-cli.ts
- Repository target: zaoos (default) or others (bettercallzaal, zaostock)

**Trigger paths:**
1. GitHub PR webhook → Hermes REST listener → runFixerCycle
2. Telegram /SHIP FIX command (via ZAO Devz bot relay) → Hermes codebase

**Workflow (bot/src/hermes/runner.ts):**
1. Coder reads issue + recent git state, generates fix
2. Critic reviews, scores 0-100, suggests refinements
3. If score >= threshold (HERMES_PASS_THRESHOLD default ~70): open PR
4. If score < threshold: retry (max HERMES_DEFAULT_MAX_ATTEMPTS, default 3)
5. Auto-push to `fix/<issue-id>` branch, open PR with phase summary

**Cost guards:**
- Daily notional cap: $20 USD (HERMES_FLEET_DAILY_USD_CAP, in-memory counter, resets UTC midnight)
- Notional cost: Opus input/output tokens priced at API rates (actual cost is $0 under Max plan)
- Fleet-wide guard: if daily spend would exceed cap, new /SHIP FIX dispatches are paused + reason returned

**Configuration:**
- `HERMES_FLEET_DAILY_USD_CAP` - Daily spend ceiling, default $20
- `HERMES_DEFAULT_MAX_ATTEMPTS` - Retry attempts, default 3
- `HERMES_PASS_THRESHOLD` - Critic score threshold, default 70

**Database (Supabase):**
- `hermes_runs` table: tracks every dispatch (run_id, status, cost, files_changed, etc.)

**Status:** LIVE (2026-04-25, doc 461). Deployed as systemd user unit on VPS 1. Webhook + Telegram relay paths both working.

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/hermes/`

---

### 3. ZAO Devz (@zaodevz_bot)

**Purpose:** Group dispatcher for /SHIP FIX relay + hourly learning tips.

**Location:** bot/src/devz/ on VPS 1  
**Tech Stack:**
- Runtime: Node.js + grammy
- Single group: ZAO Devz team topic
- Commands: /SHIP FIX relay → Hermes, /context, /clear

**Capabilities:**
- /SHIP FIX <issue> - relay to Hermes dispatcher, get run_id back
- /context - dump recent Devz chat state
- /clear - reset context (admin only)
- Hourly tip - scheduled cron posts learning tip to General

**Configuration:**
- `ZAODEVZ_BOT_TOKEN` - Telegram token
- `ZAODEVZ_CHAT_ID` - Group chat ID (hardcoded in config)
- `ZAODEVZ_ALLOWED_IDS` - Allowlist comma-separated Telegram user IDs

**Status:** LIVE (2026-05-04, doc 601). Phase 3 plan (doc 601) calls for folding /SHIP FIX into Hermes webhook only + making Devz a one-way notifier. NOT YET EXECUTED.

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/devz/`

---

### 4. Bonfire (@zabal_bonfire)

**Purpose:** Knowledge graph DM bot for capture, recall, task scheduling, multi-agent access.

**Location:** External service at bonfires.ai (Genesis tier, wallet-gated)  
**Owner:** Joshua.eth (Bonfires.ai co-founder)  
**Access model:**
- Zaal holds ZABAL bonfire wallet signature (tnt-v2.api.bonfires.ai)
- Graph has 1100+ nodes, 15 personality traits, hierarchical ERC-8004 structure
- DM bot available to Zaal 24/7
- Team members + agents can read graph via API (pending BONFIRE_API_KEY + BONFIRE_ID provision)

**API endpoint:** `https://tnt-v2.api.bonfires.ai` (used by ZOE recall.ts)

**Configuration** (for agents to access):
- `BONFIRE_API_KEY` - Issued by Joshua.eth (currently pending)
- `BONFIRE_ID` - ZABAL bonfire ID (format: 0x<address>-<bonfire-id>)
- `BONFIRE_AGENT_ID` - For newsletter agent (bot/src/zoe/agents/newsletter.ts)

**Scheduled tasks:** Bonfire's platform UI allows scheduling reminders, digests, daily prompts.

**Known issues (doc 581):**
- 8 open questions parked (API key timeline, ERC-8004 alignment, OWL export, graph wipe, MCP server ETA)
- Trial tier expires 2026-05-29 without paid API key
- Fallback if Bonfire unavailable: LightRAG self-host (doc 568)

**Status:** LIVE + external. Graph working, recall verified 2026-05-03. API bridge to ZOE pending BONFIRE_API_KEY.

**Stored at:** https://app.bonfires.ai/dashboard (Zaal's wallet)

---

### 5. ZAOstock bot (@ZAOstockTeamBot)

**Purpose:** Festival team coordination, task tracking, standup digests.

**Location:** bot/ (root) on VPS 1  
**Tech Stack:**
- Runtime: Node.js + grammy + Supabase
- Group: ZAOstock Team private Telegram chat
- Systemd unit: zaostock-bot.service

**Entry point:**
```bash
cd ~/zaostock-bot && npm start
# OR
systemctl --user start zaostock-bot
```

**Configuration:**
- `ZAOSTOCK_BOT_TOKEN` (or `TELEGRAM_BOT_TOKEN`) - Telegram token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-side only)
- `BOT_ADMIN_TELEGRAM_IDS` - Admin allowlist (Zaal, ZAOstock team leads)

**Commands:**
- /status - team status summary
- /mytodos - personal task list
- /gemba - go-see report
- /note <text> - capture note to Supabase
- /standup - morning standup collection

**Database tables:**
- `zaostock_tasks` - task tracking
- `zaostock_messages` - chat history
- `zaostock_events` - event timeline

**Systemd service:** `~/.config/systemd/user/zaostock-bot.service` (manages restart/logging)

**Status:** LIVE (2026-05-06, graduation prep). Graduating to own repo Wed 2026-04-29 or later. Standalone DB + domain pending.

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/` (root)

---

## New Team Bots (Pending Approval)

### Magnetiq (@zao_magnetiq_bot)

**Purpose:** Research assistant for Zaal + Tyler (Magnetiq co-design).

**Status:** Scaffolded (bot/src/magnetiq/) pending 3 Zaal answers (doc 644 §Unresolved Questions):
1. Auto-summarize after N messages or on-demand?
2. VOD notes storage (Supabase + Google Doc export)?
3. Team bot registry needed?

**Deployment:** VPS 1, systemd service (when approved)

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/teams/magnetiq/`

### AttaBotty (@z_attabotty_bot)

**Purpose:** Stream production assistant (NotebookLM transcripts + playbook).

**Status:** Scaffolded (bot/src/attabotty/) pending same 3 answers.

**Deployment:** VPS 1, systemd service (when approved)

**Stored at:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/teams/attabotty/`

---

## Scheduled Jobs & Cron Timings

### ZOE Scheduler (bot/src/zoe/scheduler.ts)

- **6:00am EST** - Morning brief (runConciergeTurn, posts to Zaal DM)
- **9:00pm EST** - Evening reflection (prompt: "what shipped?", capture to blocks)
- **Every hour** - Hourly nudge (learning tip or task reminder)

**Implementation:** node-cron library within ZOE process, NOT systemd timers.

**Fallback:** Python cron at `~/zoe-learning-pings/run.sh` (deprecated, replaced by scheduler.ts in Phase 4 of doc 601).

### Hermes (No scheduled jobs)

Hermes is event-driven (GitHub webhook + /SHIP FIX command). No standing cron.

### ZAOstock bot (No scheduled jobs in codebase)

Digest logic lives in `bot/src/digest.ts` but not actively scheduled.

### Bonfire (Via Bonfires.ai UI)

- Scheduled reminders, daily prompts, task follow-ups configured per Zaal's setup
- All dates/times stored in bonfire KG

---

## External Services & Dependencies

| Service | Purpose | Endpoint | Auth | Where stored | Status |
|---------|---------|----------|------|--------------|--------|
| **Bonfires.ai** | KG recall + task scheduling | https://tnt-v2.api.bonfires.ai | BONFIRE_API_KEY | Pending Joshua.eth | Pending API key |
| **Telegram Bot API** | Bot polling + message send | Telegram's servers | TELEGRAM_BOT_TOKEN | bot/.env (chmod 600) | Live |
| **Supabase Postgres** | Task/message storage | SUPABASE_URL | SUPABASE_SERVICE_ROLE_KEY | bot/.env | Live |
| **Claude Code API** | LLM calls (via Max plan) | Claude Code CLI subprocess | ~/.claude/auth.json | User's Mac | Live (Max plan auth) |
| **Anthropic (optional)** | Direct API calls (not used) | api.anthropic.com | ANTHROPIC_API_KEY | Not deployed | Not in use |
| **GitHub API** | PR webhooks + commit reads | api.github.com | GitHub token (in Git config) | User's Mac | Live |
| **Ollama** | Local LLM (classify only) | localhost:11434 | None (internal) | VPS 1 | Live (llama3.1:8b) |

**Key principle:** All bot `.env` files are server-side only, never committed, never pushed. Secret values injected at service start only.

---

## Decommissioned & Killed (2026-05-04 onward)

**Do NOT resurrect these. If a need emerges, write a research doc + get Zaal approval.**

| Item | Killed when | Why | Fallback |
|------|-------------|-----|----------|
| **openclaw container** | Phase 2 (2026-05-04) | Minimax brain weak, no message.send tool | ZOE Hermes-brain swap complete |
| **ZOEY sub-agent** | Decommissioned with openclaw | Never used, config-only | n/a |
| **WALLET sub-agent** | Decommissioned with openclaw | Never used, config-only | VAULT/BANKER/DEALER in src/lib/agents/ |
| **Composio AO** | Phase 5 (2026-05-04) | Paused 3+ wks, pile of containers | No replacement (was experimental) |
| **10-bot fleet** | Permanent defer | "brand bots" idea never built, aspirational | Bonfire multi-agent personalities |
| **FISHBOWLZ** | Paused 2026-04-16, killed 2026-05-04 | Juke partnership chosen instead | Juke Farcaster audio client |
| **ZOE v2 redesign** | Skipped (doc 601) | Bonfire eats this role | Bonfire DM bot + ZOE Hermes-brain |
| **Bot-to-bot bridge** | Passive ingest only (no autonomy) | Proved too early, requires MCP | Zaal as orchestrator until Bonfire SDK |

---

## Health & Observability

### Logging

- **ZOE:** journalctl --user -u zoe-bot
- **Hermes:** journalctl --user -u hermes-bot
- **ZAO Devz:** journalctl --user -u zaodevz-bot
- **ZAOstock:** journalctl --user -u zaostock-bot
- **Team bots:** journalctl --user -u zao-team-bots

**Log retention:** Systemd journal (default ~2 weeks of history)

### Database tables for observability

- **hermes_runs** - Every /SHIP FIX dispatch, final status, token usage, cost estimate
- **bot_messages** - DM/group message audit trail (per-bot)
- **bot_errors** - Exceptions logged to Supabase (when bot-side error handling wires this)

### Heartbeat patterns

**From doc 601 § SOUL.md / HEARTBEAT.md pattern:**
- Each bot lists "when to speak" vs "when silent"
- No 24/7 monitoring wired yet (manual journalctl checks)
- Proposed: alerting on 3 consecutive failed Telegram API calls

**Proposed (not live):**
- POST /healthz endpoint per service (returns 200 if bot responding to Telegram)
- Cron health-check: curl each /healthz every 5min, alert if 3 consecutive 5xx
- Bonfire API bridge monitor: track last successful graph query

---

## File Paths (Complete Inventory)

**Bot source code:**
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/` - root (package.json, systemd units)
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/` - ZOE concierge
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/hermes/` - Hermes PR fixer
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/devz/` - ZAO Devz dispatcher
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/teams/` - Magnetiq + AttaBotty (pending)
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/systemd/` - systemd units

**Systemd units (on VPS 1 at ~/.config/systemd/user/):**
- `zoe-bot.service` - ZOE (not yet wired, currently manual start via /vps)
- `hermes-bot.service` - Hermes (active)
- `zaodevz-bot.service` - ZAO Devz (active)
- `zao-team-bots.service` - Magnetiq + AttaBotty (pending approval)
- `zaostock-bot.service` - ZAOstock Team Bot (active)

**Env files (on VPS 1, chmod 600, never committed):**
- `~/zoe-bot/.env` - ZOE token + Bonfire keys
- `~/hermes-bot/.env` - Hermes token (if separate)
- `~/zaostock-bot/.env` - ZAOstock token + Supabase keys
- `~/zao-team-bots/.env` - Magnetiq + AttaBotty tokens + allowlists

**Memory blocks (on VPS 1, runtime state):**
- `~/.zao/zoe/` - ZOE's 4-block Hermes memory

**Deployed code (synced from local):**
All bot code rsync'd from `~/Documents/ZAO OS V1/bot/src/` to VPS 1 `~/` during deploy (not git-cloned).

---

## Deployment & Secrets Hygiene

### Deployment pattern (per doc 644)

```bash
# Local: test everything
pnpm build
pnpm typecheck
pnpm test

# Push to VPS
rsync -av --delete --exclude=node_modules --exclude=.env bot/src/<bot>/ zaal@31.97.148.88:~/<bot>-bot/

# On VPS: verify + restart
ssh zaal@31.97.148.88 'systemctl --user status <bot>-bot && journalctl --user -u <bot>-bot -n 10'
```

### Secrets hygiene checklist (per secret-hygiene.md)

Before any bot commit/push:
1. No `.env` file in staged diff (assert via `.gitignore`)
2. No `TELEGRAM_BOT_TOKEN=<value>` or private key in diff
3. No 64-char hex string (grep regex `[0-9a-fA-F]{64}`)
4. No GitHub PAT or Anthropic key patterns

After deploy, audit HEAD:
- `git grep -E '[0-9a-fA-F]{64}'` (private keys)
- `git grep -E 'ghp_[A-Za-z0-9]{36}'` (GitHub PAT)
- `git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}'` (Anthropic key)

---

## Operator Quick-Start

### Check all services

```bash
ssh zaal@31.97.148.88

# List running user units
systemctl --user list-units --state=running

# Check specific bot
systemctl --user status zoe-bot
journalctl --user -u zoe-bot -n 30 --no-pager
```

### Restart a bot

```bash
systemctl --user restart zoe-bot
```

### View recent ZOE decisions

```bash
cat ~/.zao/zoe/blocks.json | jq '.constraints'  # latest constraints block
tail -20 ~/.zao/zoe/recent.jsonl | jq '.text'  # last 20 turns
```

### Bonfire API test

```bash
curl -s -X GET "https://tnt-v2.api.bonfires.ai/search" \
  -H "Authorization: Bearer $BONFIRE_API_KEY" \
  -d '{"bonfire_id":"<BONFIRE_ID>","search_string":"recent decisions"}'
```

### Hermes dispatch test

```bash
# Via Devz Telegram (manual)
/SHIP FIX "add feature X to route Y"

# Via GitHub webhook (automatic when PR created with /ship commit message)
# Check status
curl -s https://zaoos.com/api/hermes/runs/<run_id> | jq '.status'
```

---

## Related docs

- **Doc 601:** Agent stack cleanup decision, Option D (Hermes-as-ZOE-brain)
- **Doc 644:** ZAO agent stack canon + team bot template (locked patterns)
- **Doc 581:** Bonfire bot hygiene (8 open questions)
- **Doc 590:** Bonfire power-user playbook (daily use)
- **Doc 461:** Fix-PR pipeline live (Hermes launch)
- **Doc 568:** Bonfire fallback (LightRAG self-host)
- **Memory project_hermes_canonical:** Locked 2026-05-05
- **Memory project_no_vps2:** Confirms single-box topology

---

**Last updated:** 2026-05-23  
**Status:** Ready for reference and troubleshooting  
**Next audit:** 2026-06-23 (monthly cadence)
