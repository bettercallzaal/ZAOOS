---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "800, 801, 802, 650, 668, 679"
original-query: "can you audit this project and all the todos and also all the github stuff and /zao-research it all"
tier: STANDARD
---

# 816 - Cowork Control Plane + Project / Todo / GitHub Audit

> **Goal:** One-pass audit of the bot control plane just shipped (doc 800 Phases 1-4 + fleet board), plus the live state of the cowork task tracker, GitHub across both repos, and what is outstanding.

This is an internal-state audit. Sources are the cowork tracker DB (Supabase `etwvzrmlxeobinrlytza`), the GitHub REST API for both repos, and git history - all read directly and marked `[FULL]` below. No external web sources apply.

## Key Decisions / Recommendations (act on these)

| # | Recommendation | Why | Owner |
|---|---------------|-----|-------|
| 1 | TRIAGE the 180 `cowork-actions.json` todos - bulk-archive the stale ones | They are 77% of the 235 active todos and drown the 48 real meeting actions + 12 active items. Imported from the old flat actions.json, never curated. | Zaal/Iman |
| 2 | FINISH Hermes when the Vercel deploy cap resets - add `hermes=<tok>` to `COWORK_BOT_TOKENS`, restart `zao-devz-stack` | Only outstanding step of the fleet board work. zaodevz already heartbeats; hermes is staged + code-merged. | Zaal |
| 3 | RESOLVE the 2 open ZAOcowork PRs (#72 insights, #73 keyboard-ux) - review/merge or close | Only open PRs anywhere; both from this week's board polish. | Zaal |
| 4 | PRUNE merged branches - ZAOOS has 100 branches (69 `ws/`+`claude/`), ZAOcowork 52 | Heavy branch sprawl; nearly all are merged or abandoned `claude/*` runs. | Zaal |
| 5 | DO NOT rebuild Magnetiq/AttaBotty - dormant per doc 601 | Code is wired + dormant on purpose; no `zao-team-bots` unit, no Telegram tokens. | (decided) |
| 6 | OPTIONAL: enable `zao-fleet-agent` for UI start/stop - one-liner, staged + disabled | Control plane otherwise complete; pause/resume/restart/ask/run_task already work without it. | Zaal |

## Findings

### A. Control plane (doc 800) - shipped + live

All four phases plus the fleet board are merged and verified live.

- **Code merged:** cowork repo on `main` (Phase 1-4 + multi-expand UI, latest `5280a02`); ZAOOS via **PR #804** to `main` (Phase 1-4 client, `bot/src/fleet-agent/`, fleet wiring).
- **Runtime (live as of 2026-06-08):** `bot_heartbeats` = **3 bots up** (`zoe`, `zaodevz`, `zaostock`). `bot_events` = 7 rows. `bot_commands` = 3, all terminal (`ask=done`, `pause=done`, `resume=done`) from the verification run.
- **Verified behavior:** heartbeat meta enrichment (current_task/last_error/uptime), events feed, and the command queue end-to-end (an `ask` was claimed -> `runConciergeTurn` -> reply posted; `pause`/`resume` executed).
- **Outstanding:** Hermes (`hermes` identity) not yet on the board - needs `hermes` token added to Vercel `COWORK_BOT_TOKENS` + a `zao-devz-stack` restart (blocked on the Vercel daily deploy cap). Snapshot devz patch + token drop-in already staged on the box.

Key code paths: `bot/src/lib/cowork.ts` (heartbeat + events + command-queue client + `startHeartbeatAs`), `bot/src/fleet-agent/index.ts` (whitelisted `systemctl` supervisor, ships disabled), `bot/src/zoe/index.ts` (pause middleware + `ask`/`run_task` via `runConciergeTurn`). Cowork side: `src/app/api/v1/bots/*` (heartbeat, events, commands), `src/components/BotsBoard.tsx`, migrations `010`/`011`/`012`.

### B. Cowork task tracker - high volume, import-heavy

Supabase `public.tasks`, project `etwvzrmlxeobinrlytza`.

| Status | Count | Note |
|--------|-------|------|
| todo (active) | **235** | + 15 archived |
| in_progress | 6 | |
| blocked | 6 | |
| done | 170 | lifetime |

Active-todo breakdown by source: **`cowork-actions.json` = 180** (the bulk import of the old flat actions.json), `meeting` = 48 (meeting-extracted actions), `research-doc` = 6, `followup` = 1. Only **2** active todos are older than 30 days and **39** were created in the last 7 days - so this is a high-throughput, recently-loaded backlog, not stale rot. The actions.json 180 are the curation target.

**Active (in_progress / blocked) items - the real work-in-flight:**

- in_progress: "Port tracker into ZAO OS as native module"; "Walk BetterCallZaal.com 10-section verification checklist" (due 2026-06-08); "COC Concertz 6 post 1"; "fit Jose into what we are doing"; "rev make intro/outro for ZABAL Games workshops"; "Jose watch workshop video + feedback".
- blocked: "SongChainn Phase 2 (songs as smart contracts)"; "SongChainn WaveWarZ Africa battle zone"; "Deploy neko 24/7 music stream on the bots box (Leeward kickoff)" (due 2026-06-09); "Confirm ZABAL mentor-handbook specifics"; "zabalgames Notion CMS migration (Doc 760)"; "COC Rev recap caption approval".

All 12 active items trace to `cowork-actions.json` (none are bot/PR-generated), i.e. they are human-entered work, not automation cruft.

### C. GitHub state

| Repo | Open PRs | Branches | Recent |
|------|----------|----------|--------|
| bettercallzaal/ZAOOS | **0** | **100** (69 `ws/`+`claude/`) | merges #797-804 this week: #804 control plane, #797-803 Spaces/100ms A-V workstream |
| ZAODEVZ/ZAOcowork | **2** (#72 insights-cycle-wip, #73 keyboard-ux) | **52** | latest `main` = `5280a02` multi-expand UI; PRs #67-70 (RLS, db-backups, supabase-cli, restore-tests) merged |

Observations:
- ZAOOS has **zero** open PRs - everything is merged to `main`, including the control plane (#804). Healthy.
- ZAOcowork's 2 open PRs are both board-polish from this week and unrelated to the control plane; safe to review independently.
- **Branch sprawl** is the main hygiene issue: 100 + 52 branches, the vast majority merged `claude/*` agent runs or completed `ws/*` work. No functional risk, but noise.
- A teammate already renumbered a cowork RLS migration `011 -> 013` to avoid colliding with `bot_events`/`bot_commands` on main - confirms the control-plane migrations are recognized and there is no migration-number conflict.

### D. Infra notes (carried from prior sessions, still true)

- Cowork DDL must be pasted in the Supabase SQL editor: the `supabase-cowork` MCP is hard read-only, there is no exec RPC, and no DB password on the box. Migrations 010/011/012 went this way.
- The bots box (`zaal@31.97.148.88`) runs `zao-devz-stack` + `zaostock-bot` from an **untracked snapshot** `~/zaostock-bot` (not git); `zoe-bot` runs from the git clone `~/zao-os`. Snapshot edits are patched in place with `/tmp/*.bak` backups.
- Token-extraction gotcha: a drop-in line is `Environment=COWORK_BOT_TOKEN=tok_...`; extract with `sed -n 's/.*COWORK_BOT_TOKEN=//p'`, NOT `cut -d= -f2`.

## Also See

- [Doc 800](../800-cowork-bot-control-plane/) - control plane design + Phase 2-4 handoff
- [Doc 801](../801-zoe-cowork-systems-audit-consolidation/) - prior ZOE/cowork systems audit
- [Doc 650](../650-cowork-zaodevz-imanagent/) - cowork-zaodevz origin
- [Doc 668](../668-zaocoworking-bot-audit/) / [Doc 679](../679-coworking-agent-mentions-code-pipeline/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Bulk-triage the 180 `cowork-actions.json` todos (archive stale, keep live) | Zaal/Iman | Tracker | This week |
| Add `hermes` token to Vercel `COWORK_BOT_TOKENS` + restart `zao-devz-stack` | Zaal | Ops | After Vercel cap resets |
| Review/merge or close ZAOcowork PRs #72 + #73 | Zaal | PR | This week |
| Prune merged branches in ZAOOS (69) + ZAOcowork (30+) | Zaal | Git hygiene | Low priority |
| Decide the 6 blocked items - unblock or close (SongChainn x2, neko stream, mentor handbook, Notion CMS, COC caption) | Zaal | Tracker | Next standup |

## Sources

- [FULL] Cowork tracker DB - `public.tasks` (`etwvzrmlxeobinrlytza`), live SQL: status counts, source breakdown, active-item detail (read 2026-06-08).
- [FULL] Control-plane tables - `bot_heartbeats` (3 up), `bot_events` (7), `bot_commands` (3), live SQL (read 2026-06-08).
- [FULL] GitHub REST - `repos/bettercallzaal/ZAOOS/pulls,branches`, `repos/ZAODEVZ/ZAOcowork/pulls,branches` (read 2026-06-08).
- [FULL] git history - ZAOOS `main` (PR #804 merge), ZAOcowork `main` (`5280a02`).
- [FULL] Codebase - `bot/src/lib/cowork.ts`, `bot/src/fleet-agent/`, `bot/src/{zoe,devz,teams}/index.ts`, cowork `src/app/api/v1/bots/*`, migrations 010-012.
