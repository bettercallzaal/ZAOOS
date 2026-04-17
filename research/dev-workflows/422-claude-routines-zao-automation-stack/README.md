# 422 — Claude Routines: ZAO Automation Stack

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Adopt Anthropic's Claude Code Routines (launched 2026-04-14) as ZAO's autonomous scheduler. Replace/augment cron-based workflows. Source: @hooeem guide (Apr 16 2026, 120.4K views) + official docs.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Adopt Claude Routines | **YES — use for every daily ZAO automation** — launched 2026-04-14, runs on Anthropic cloud, no server, no laptop dependency. Already validated by @hooeem (120.4K views) and Anthropic eng. |
| Plan tier | **USE Max (15 routines/day)** — Pro (5/day) is too tight for ZAO's stack (morning briefing, nightly processing, newsletter, socials, research digest, fractal updates, ZAO Stock ops, WaveWarZ digest, ZABAL swarm reports, inbox processing — already 10+ daily). Team (25/day) only if adding teammates. |
| Routines repo | **CREATE `zao-routines` — dedicated lean GitHub repo** (NOT a folder in ZAO OS monorepo). Whole repo is cloned on every run; keep it small. |
| Launcher prompt pattern | **USE short launchers that delegate to skill files** — keep UI prompts ≤ 10 lines, complexity lives in `/skills/*.md` in the routines repo. |
| Memory model | **USE delta + cumulative hybrid** — `/memory/{name}-latest.json` for delta, `/memory/{name}-log.json` for history. Match ZAO "build in public" (history matters) + ZOE "what changed since yesterday". |
| Env vars | **MIGRATE secrets from `.env` to routines UI cloud env vars** — `.env` is git-ignored and NOT cloned into the container. |
| Network access | **SWITCH to "full network" for routines that hit Neynar, Base RPC, Audius, Arweave, Paragraph, Firefly** — default "trusted" only reaches Anthropic-vetted domains. |
| Branch guardrail | **KEEP `claude/` prefix restriction on** — do NOT enable "allow unrestricted branch pushes." Routines open PRs from `claude/<routine>` branches, human merges. |
| Connectors | **ATTACH only what each routine needs** — default behavior attaches ALL your connected MCPs, which is a blast-radius footgun. Remove Gmail from social-posting routines, remove Linear from newsletter, etc. |
| GitHub events trigger | **USE for PR review + issue triage on ZAO OS + related repos** — wire Anthropic-reviewer routines into ws/ branch PRs once trusted. |
| API trigger pattern | **EXPOSE a per-routine HTTPS endpoint** for: webhook from Telegram (ZOE chat), webhook from Farcaster cast events (via Neynar), webhook from Paperclip VPS alerts, webhook from POIDH bounty fills. API triggers do NOT count against daily cap until fired. |
| Migration order | **MIGRATE in this sequence** (Week 1 → Week 3): 1) `/morning`, 2) `/inbox`, 3) `/newsletter`, 4) `/socials`, 5) ZOE nightly processing, 6) WaveWarZ digest, 7) ZABAL swarm reports, 8) research-digest, 9) fractal-weekly, 10) ZAO Stock 2026-10-03 countdown. |
| Skip | **DO NOT migrate live-interactive skills** (`/worksession`, `/ship`, `/qa`, `/review`, `/guard`, `/freeze`) — they're tools for active Claude Code sessions, not autonomous runs. |

---

## What Claude Routines Is (2026-04-14 launch)

| Dimension | Detail |
|-----------|--------|
| Launch date | **2026-04-14** (research preview) |
| Plans | Pro, Max, Team, Enterprise (Claude Code on web enabled) |
| Daily run caps | **Pro 5/day · Max 15/day · Team 25/day · Enterprise 25/day** |
| Overage | Metered overage available from settings > billing |
| Runs on | Anthropic cloud, fresh stateless container per run |
| State persistence | **Only via GitHub repo** (committed back after each run) |
| Min interval | 1 hour (can't run every 5 min) |
| Triggers | Schedule (natural language or cron) · API (HTTPS + bearer token) · GitHub events |
| GitHub events | New PR, code push, new issue, PR review requested, issue comment |
| Default branch policy | Can push only to `claude/*` branches |
| Network | "Trusted" default (Anthropic-vetted domains) → switch to "full" or custom allowlist |
| Connectors | All your MCPs attached by default → prune per routine |
| Setup UI | `claude.ai/code/routines`, or Claude Desktop → New Task → Remote Task, or CLI `/schedule` (schedule-only) |
| Cost | Included with subscription — no extra compute billing |
| Token budget | Drawn from your subscription quota — routines compete with interactive use |

---

## Execution Cycle (on every run)

```
trigger fires
  ↓
Anthropic spins fresh cloud container
  ↓
clones connected GitHub repo
  ↓
reads CLAUDE.md + specified skill files
  ↓
executes task (APIs, connectors, file writes)
  ↓
commits outputs to GitHub
  ↓
container destroyed — nothing persists
```

Implication: every routine MUST write output to the repo (or a connector) or the work evaporates.

---

## Comparison — ZAO's Automation Options

| Option | Cost | State | Triggers | Good for | Verdict |
|--------|------|-------|----------|----------|---------|
| **Claude Routines** | Included in sub | GitHub repo | schedule + API + GH events | Intelligent long-running Claude workflows | **PRIMARY** |
| Vercel cron | Free (low tier) | Supabase | schedule | Fast deterministic tasks | Keep for sub-hour cadence (ZABAL swarm polls) |
| GitHub Actions | Free (pub) / metered | GH artifacts | schedule + GH events | CI/CD tasks | Keep for tests + deploy |
| Paperclip VPS (31.97.148.88) | Hostinger KVM 2 | Docker volumes | any | Long-running agents (OpenClaw, ZOE) | Keep for persistent services |
| VPS 2 (64.225.53.24) | DigitalOcean 2GB | FS | any | ZAAL ASSISTANT personal productivity | Keep (personal) |
| BullMQ / Redis jobs | Compute + Redis | Redis | queue | Fan-out work from ZAO OS API | Keep for inline job queue |

Claude Routines slots in as **"intelligent scheduled Claude with memory"**. It doesn't replace Vercel cron (cadence/ms latency) or the VPS agents (persistent state).

---

## The Launcher Prompt Pattern (ZAO conventions)

Short UI prompt delegates to a skill file. Example for `/morning` briefing:

```markdown
run the skill at `/skills/morning-briefing.md`.

context:
- read all API keys from environment variables (never from .env)
- today's date: system clock
- write output to `/outputs/morning/YYYY-MM-DD.md`
- on any failure, write `/outputs/errors/YYYY-MM-DD-morning-error.md` and post to Telegram chat ZOE_ALERTS

do not proceed if the skill file is missing. if missing, alert Telegram and stop.
```

---

## ZAO Routines Repo Structure (proposal)

```
zao-routines/
├── CLAUDE.md                       ← ZAO brand voice, rules, routing
├── skills/
│   ├── morning-briefing.md         ← daily 7am UTC → Telegram + Notion
│   ├── nightly-processing.md       ← 03:00 UTC → research digest + memory update
│   ├── newsletter-year-zabal.md    ← 11:00 UTC → Paragraph draft + HTML preview
│   ├── socials-firefly.md          ← post-approval API trigger → Firefly X+FC
│   ├── zao-stock-countdown.md      ← daily → 2026-10-03 countdown graphic
│   ├── wavewarz-digest.md          ← weekly Sun 18:00 UTC → battle recap
│   ├── zabal-swarm-report.md       ← 6h cadence? (no — use Vercel cron; Routines for 24h summary only)
│   ├── fractal-weekly.md           ← Mondays 21:00 UTC (post-fractal) → summary
│   ├── research-digest.md          ← weekly Fri → new research docs recap
│   └── inbox-processor.md          ← 09:00 UTC → zoe-zao@agentmail.to triage
├── outputs/
│   ├── morning/ · newsletter/ · socials/ · research/ · errors/
├── memory/
│   ├── morning-latest.json · newsletter-topics-log.json · zabal-snapshot.json
│   ├── wavewarz-history.json · fractal-participants.json
└── templates/
    └── brand-voice.md · hashtags.md · signatures.md
```

---

## ZAO Ecosystem Integration

### Skills already in ZAO ecosystem (`~/.claude/skills/`)

Already built: `autoresearch`, `zao-research`, `bcz-research`, `bandz-research`, `browse`, `careful`, `clipboard`, `codex`, `design-*`, `freeze`, `graphify`, `gstack`, `guard`, `investigate`, `office-hours`, `plan-*`, `qa*`, `retro`, `review`, `ship`, `socials`, `setup-browser-cookies`.

**Migration split:**

| Keep as interactive-only | Fork into routine skill | Build new routine skill |
|--------------------------|-------------------------|-------------------------|
| `/worksession` | `/zao-research` → nightly digest | `/morning` |
| `/ship` | `/socials` → API-triggered | `/newsletter` |
| `/qa`, `/qa-only`, `/review` | `/autoresearch` → scheduled goal loops | `/inbox` |
| `/guard`, `/freeze`, `/unfreeze` | `/retro` → weekly Sunday | `/wavewarz-digest` |
| `/design-review`, `/browse` | `/investigate` → GH-event on `bug` label | `/zao-stock-countdown` |
| `/codex`, `/office-hours` | — | `/fractal-weekly` |

### ZAO OS hooks

- `src/app/api/webhooks/routines/` — new endpoint set to receive routine outputs (drafts, approvals)
- `src/lib/telegram/` — outbound to ZOE Telegram chat
- `src/lib/publish/broadcast.ts` — consume socials routine output for Firefly + Farcaster + LinkedIn fan-out
- `src/lib/agents/` — wire ZOE to fire API triggers on routines (ZOE says "summarize today" → POST to routine)
- `community.config.ts` — routine-specific config flags
- `scripts/` — bootstrap script to seed `zao-routines` repo

### Cross-project

- **ZAO OS**: primary host for routine outputs (Notion pages, Supabase logs, Telegram posts)
- **COC Concertz**: promoter daily briefing + show reminder routines
- **FISHBOWLZ partner (Juke)**: show-recap + audio-room analytics routines
- **BetterCallZaal**: portfolio auto-update + mini-app stat digest
- **ZAAL ASSISTANT (VPS 2)**: keep for personal productivity — do NOT migrate to Routines (routines expose to team surface)

---

## Specific Routines to Ship (Week 1 build order)

| # | Routine | Trigger | Source data | Output surface | Value |
|---|---------|---------|-------------|----------------|-------|
| 1 | `morning-briefing` | schedule: daily 07:00 America/New_York (11:00 UTC during DST) | Supabase, Farcaster via Neynar, GH recent commits, weather, calendar | Telegram to Zaal + Notion page | Replaces manual `/morning` skill |
| 2 | `inbox-processor` | schedule: daily 09:00 NY | zoe-zao@agentmail.to | Categorize + Telegram summary + Notion queue | Replaces manual `/inbox` |
| 3 | `newsletter-zabal` | schedule: daily 10:00 NY | yesterday's activity + memory of topics covered | Paragraph draft + HTML preview + clipboard URL | Replaces manual `/newsletter` for draft step |
| 4 | `socials-firefly` | API trigger (fired from ZAO OS after newsletter publish) | Newsletter URL + copy | Firefly post (FC+X), LinkedIn, clipboard GC pastes | Replaces manual `/socials` |
| 5 | `nightly-processing` | schedule: daily 03:00 UTC | Full day activity | Delta memory update + overnight digest in Telegram morning | ZOE's passive intelligence |

---

## Pitfalls from the @hooeem guide (don't repeat)

- **`.env` won't work in the cloud container** — use routines UI env vars + explicit skill instruction "read from env, not .env".
- **`trusted` network blocks custom domains** — switch to `full` before shipping routines that hit Base RPC or Neynar.
- **Connectors default to ALL attached** — prune per routine. A newsletter routine shouldn't have Gmail send permission.
- **Huge repo kills context window** — keep the routines repo lean. That's why it's NOT the ZAO OS monorepo.
- **Routines run AS YOU** with your perms — minimum-privilege connectors + read-only API keys where possible.
- **Routines can't ask clarifying questions** — every skill must be self-contained. "Vague in = vague out" is absolute.
- **Min interval 1 hour** — for sub-hour cadence (ZABAL agent polls, RTMP health), keep Vercel cron / VPS workers.
- **Daily cap = schedule cap only** — API-triggered runs don't count unless fired, so design event-driven flows for high-frequency needs.
- **UTC by default** — convert all "7am NY" in the schedule setting yourself.
- **Silent fails** — every routine MUST have a failure protocol writing to Telegram/Slack.

---

## Sources

- [@hooeem X thread — "HOW TO AUTOMATE YOUR LIFE (full course)", Apr 16 2026, 120.4K views](https://x.com/hooeem)
- [Claude Code Routines official docs](https://code.claude.com/docs/en/routines)
- [SiliconAngle — Anthropic's Claude Code gets automated routines and a desktop makeover (Apr 14 2026)](https://siliconangle.com/2026/04/14/anthropics-claude-code-gets-automated-routines-desktop-makeover/)
- [VentureBeat — We tested Claude Code Routines: enterprise takeaways](https://venturebeat.com/orchestration/we-tested-anthropics-redesigned-claude-code-desktop-app-and-routines-heres-what-enterprises-should-know)
- [9to5Mac — Anthropic adds repeatable routines feature](https://9to5mac.com/2026/04/14/anthropic-adds-repeatable-routines-feature-to-claude-code-heres-how-it-works/)
- [Companion — doc 154 Skills & Commands Master Reference](../154-skills-commands-master-reference/README.md)
- [Companion — doc 409 Claude Skills: Anthropic engineers guide](../409-claude-skills-anthropic-engineers-guide/README.md)
- [Companion — doc 408 Claude Code 1M context session management](../408-claude-code-1m-context-session-management/README.md)
- [Companion — doc 302 AI content engine automation patterns](../302-ai-content-engine-automation-patterns/README.md)
- [Companion — doc 245 ZOE upgrade autonomous workflow 2026](../../agents/245-zoe-upgrade-autonomous-workflow-2026/README.md)
- [Companion — doc 345 ZABAL agent swarm master blueprint](../../agents/345-zabal-agent-swarm-master-blueprint/README.md)
