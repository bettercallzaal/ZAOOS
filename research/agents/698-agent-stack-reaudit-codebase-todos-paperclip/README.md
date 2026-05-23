---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 601, 653, 661, 668, 672, 693, 694
original-query: "Re-research all agents, audit all our codebases, suggest next fixes as todos, with the plan to restart Paperclip."
tier: DISPATCH
---

# 698 - Agent Stack Re-Audit + Codebase Audit + Next-Fix Todos + Paperclip Restart Plan

> **Goal:** Current-state audit of every ZAO agent and codebase, a prioritized next-fix todo list, and a documented plan for the proposed Paperclip restart.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | KILL the `paperclipai.service` crash loop on VPS 1 first - `systemctl --user disable --now paperclipai.service` | It has restarted 107,478 times (every ~10s for weeks), burning CPU + log volume and masking other systemd faults. Dead infra, zero traffic. |
| 2 | FIX cowork-zaodevz's 6 live bugs this week - it blocks ZAOcoworkingBot's production rollout | Doc 672 found `/team` broken, a self-notification loop, and a message-eating handler. Iman's bot serves the real team; these are P0. |
| 3 | DO NOT restart Paperclip without Zaal's explicit written reverse of the 2026-05-04 lock | Restarting Paperclip reverses Doc 601 + the CLAUDE.md decommission + the Hermes-canonical lock. The plan is in this doc; the greenlight is Zaal's call (see Paperclip section). |
| 4 | HARDEN ZAOcoworkingBot before onboarding more users - non-root user + secret scan + LLM op-schema validation | It runs as `root` on Iman's VPS with no pre-commit secret scan. A token leak today = full VPS compromise. |
| 5 | The ZAOOS typecheck "28 errors" are mostly worktree pollution, not core breakage - clean the worktrees, re-run | `worktrees/reresearch-wave1-0521/` + `.claude/worktrees/agent-*` leak into the root typecheck. Core app builds; the noise hides real signal. |

## Agent Stack: Current State (2026-05-21)

| Agent | Surface | Runs on | Status | Issue |
|-------|---------|---------|--------|-------|
| ZOE | @zaoclaw_bot | VPS 1, systemd | HEALTHY | Claude-brain (Hermes pattern), 3-layer memory, ~69MB RAM |
| Hermes | @zoe_hermes_bot | VPS 1, systemd | HEALTHY | Coder + critic + auto-PR; works, rarely triggered |
| ZAOstock bot | @ZAOstockTeamBot | VPS 1, systemd | HEALTHY | Still on MiniMax brain; graduates with the spinout |
| ZAO Devz | @zaodevz_bot | VPS 1 unit | DEAD ZOMBIE | Inactive since 2026-05-15 but unit still `enabled` - reboot resurrects it. Folded into Hermes per Doc 601. |
| ZAOcoworkingBot | Iman's VPS (187.77.3.104) | systemd as root | LIVE, AT RISK | v2.12+, 6 open bugs (Doc 672), runs as root, no secret scan |
| Bonfire | @zabal_bonfire | bonfires.ai SaaS | LIVE | Knowledge-graph memory layer for ZOE recall |
| VAULT / BANKER / DEALER | (none) | Vercel cron | UNVERIFIED | 3 trading agents; code present; last-run status unconfirmed |
| Paperclip | paperclip.zaoos.com | VPS 1 systemd | CRASH LOOP | 107,478 restarts; `npx paperclipai run` fails doctor check; serves no traffic |

## Codebase Audit: ZAOOS

- **Build:** 389/389 tests pass. Typecheck reports ~28 errors - but most trace to in-repo worktrees (`worktrees/reresearch-wave1-0521/`, `.claude/worktrees/agent-*`) and archived scripts, not the core app. Biome lint is blocked by 3 nested `biome.json` files in those same worktrees.
- **Dead weight:** `duodo-snap/` + `nouns-snap/` (~268MB, no active commits); FISHBOWLZ code still in `src/app/fishbowlz`, `src/components/fishbowlz`, `src/lib/fishbowlz`, `src/app/api/fishbowlz/` despite the 2026-05-04 kill.
- **Rule violations:** 4 API routes lack Zod validation (`notifications`, `proposals`, `ens`, `community-issues`); `users/[fid]/followers/route.ts:32` uses `any[]`; 2 stray `console.log`s.

## Codebase Audit: Ecosystem Repos

| Repo | State | Issue |
|------|-------|-------|
| ZAOOS | ACTIVE | 38 open issues, mostly Empire Builder; 4 Phase-3 items blocked |
| cowork-zaodevz | ACTIVE, BUGGY | 6 real bugs (Doc 672) - P0, blocks ZAOcoworkingBot rollout |
| zaostock | ACTIVE | On track for Oct 3 spinout |
| zlank | ACTIVE | PostCSS moderate CVE (issue #62) blocks the dependency-scan gate |
| bcz-yapz | GRADUATED | Healthy, independent since 2026-05-06 |
| wwbase (WaveWarZ) | STALE | No activity since 2026-05-15; needs a technical co-founder |
| fishbowlz | PAUSED | Killed 2026-05-04 (Juke partnership instead) |

## Next-Fix Todos (Prioritized)

### P0 - this week

| # | Todo | Where |
|---|------|-------|
| T1 | Disable the Paperclip crash loop: `systemctl --user disable --now paperclipai.service` | VPS 1 |
| T2 | Fix cowork-zaodevz `/team` command (never displays chats, 3 redundant Octokit calls) | cowork-zaodevz |
| T3 | Fix cowork-zaodevz self-notification loop (compares display names vs tg_id) | cowork-zaodevz |
| T4 | Fix cowork-zaodevz pending-suggestion handler eating unrelated messages | cowork-zaodevz |
| T5 | Formally decommission ZAO Devz zombie unit: `systemctl --user disable zao-devz-stack` | VPS 1 |
| T6 | Fix or migrate the 4 Vercel crons returning 401 (CRON_SECRET drift) | ZAOOS + VPS |

### P1 - next sprint

| # | Todo | Where |
|---|------|-------|
| T7 | Harden ZAOcoworkingBot: run as non-root user, add pre-commit secret scan, add LLM op-schema validation | Iman's VPS |
| T8 | Delete the in-repo worktrees + nested `biome.json` files; re-run typecheck + lint clean | ZAOOS |
| T9 | Delete the FISHBOWLZ code (5 dirs + skill) - killed 2026-05-04 | ZAOOS |
| T10 | Delete `duodo-snap/` + `nouns-snap/` (268MB, defunct) after confirming no pending work | ZAOOS |
| T11 | Add Zod validation to `notifications`, `proposals`, `ens`, `community-issues` routes | ZAOOS |
| T12 | Upgrade zlank build toolchain to clear the PostCSS CVE | zlank |

### P2 - cleanup backlog

| # | Todo | Where |
|---|------|-------|
| T13 | Delete the 5 zombie ZAOstock digest crons + the openclaw-referencing `nightly-research.sh` / `pixel-startup.sh` | VPS 1 |
| T14 | Fix `users/[fid]/followers/route.ts:32` `any[]` + 2 stray `console.log`s | ZAOOS |
| T15 | Triage ZAOOS Empire Builder issues - separate the 4 blocked Phase-3 items from ready-to-ship | ZAOOS |
| T16 | Decide wwbase (WaveWarZ): restart co-founder outreach or archive | wwbase |

## Paperclip Restart Plan

**This section is a PROPOSAL. Restarting Paperclip reverses a locked decision (Doc 601, 2026-05-04 + CLAUDE.md decommission + Hermes-canonical lock). It needs Zaal's explicit written reverse - exactly the way FISHBOWLZ was reversed on 2026-05-17 (Doc 662). This doc is the required research-doc step; it does not greenlight anything.**

### What Paperclip was

An open-source agent-orchestration framework (MIT, ~36.7K stars). ZAO ran it on VPS 1 via `paperclipai.service`, exposed at paperclip.zaoos.com through the Cloudflare named tunnel `zao-agents`. It was Layer 2 of the openclaw-era 3-layer stack (OpenClaw orchestrator -> Paperclip task/org-chart layer -> ElizaOS social layer): org-chart task management, agent personas (CEO/Researcher/Community Manager via SOUL.md), atomic task checkout, heartbeat cycles, per-agent budgets (~$7/mo self-hosted).

### Why it was killed

Doc 601 (2026-05-04) collapsed the stack from 12+ systems to 5. The OpenClaw brain (MiniMax M2.7) was too weak and brittle; the supervisor-worker hierarchy was replaced by the Hermes pattern (Claude Code CLI subprocess, Max-plan auth, no API billing, no external orchestrator). Paperclip's supervisor (OpenClaw) is dead.

### Restart todo plan

| Step | Action |
|------|--------|
| P1 | Resolve the crash loop first (T1) - clean slate before any restart |
| P2 | Reinstall on VPS 1: `npx paperclipai onboard --yes` (regenerates `~/.paperclip/` config + embedded Postgres) |
| P3 | Create the ZAO company in the Paperclip dashboard (tunnel port ~3100) |
| P4 | Register 3-4 worker agents - CEO, Researcher, Community Manager (SOUL.md files still exist in `/agents/*/`) |
| P5 | Wire Supabase MCP for agent task queues + logging (new tables: agent_logs, agent_tasks, agent_memory) |
| P6 | Wire Neynar API for Farcaster reads (keys already configured) |
| P7 | Decide the supervision model - OpenClaw is dead; either build a new supervisor or run agents autonomous within budget caps |
| P8 | Add a systemd user unit for auto-start; seed issues for agents to pick up; test heartbeat cycles |

### The decision Zaal must make

Restarting Paperclip trades the Doc 601 simplification (12 -> 5 systems) back for a multi-agent orchestration layer. Before P2, Zaal must answer:

1. **What need changed?** What does Paperclip do that ZOE + Hermes + Bonfire cannot?
2. **Why Paperclip, not Hermes-native?** The Hermes pattern needs zero external infra and is proven. Bonfire can already host multiple agent personas.
3. **Who supervises?** OpenClaw is gone. New supervisor, or autonomous-within-budget?
4. **Is this a full reverse of Doc 601, or a scoped pilot?** A scoped pilot (one Paperclip agent, time-boxed) is lower-risk than reinstating the whole layer.

## Sources

- [Doc 601](../601-agent-stack-cleanup-decision/) - the 2026-05-04 stack-collapse decision being reversed
- [Doc 653](../../dev-workflows/653-cron-bots-audit-may2026/) - VPS cron + crash-loop audit
- [Doc 668](../668-zaocoworking-bot-audit/) + [Doc 672](../672-zaocoworking-bot-audit-postv213/) - ZAOcoworkingBot audits
- [Doc 661](../661-zaoos-codebase-audit-may-2026/) - prior ZAOOS codebase audit
- ZAOOS `bot/src/` (ZOE, Hermes, devz), `.claude/rules/` - read 2026-05-21
- `gh repo list bettercallzaal` + `songchaindao` - ecosystem repo state 2026-05-21
- All sources [FULL] except VAULT/BANKER/DEALER last-run status [PARTIAL - cron logs not inspected]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Execute P0 todos T1-T6 | @Zaal | Fix | This week |
| Decide: greenlight, scope-pilot, or decline the Paperclip restart | @Zaal | Decision | Before any P2 step |
| If greenlit, write the explicit Doc 601 reverse (like Doc 662 did for FISHBOWLZ) | @Zaal | Doc | Before restart |
| Hand T2-T4 (cowork-zaodevz bugs) to Iman or Hermes fix-PR pipeline | @Zaal | Dispatch | This week |
| Run the P1 cleanup todos T8-T12 as one ZAOOS PR | @Claude | PR | Next session |
