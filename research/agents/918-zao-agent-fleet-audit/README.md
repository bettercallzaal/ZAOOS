---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-29
related-docs: 601, 759, 888, 911
original-query: "all agent information and make fixes that are needed"
tier: DEEP
---

# 918 — ZAO agent fleet audit: intended vs live, gaps, fixes

> **Goal:** Map every agent in the ZAO fleet, compare intended (docs) vs live (VPS), and tag every needed fix SAFE vs RISKY.

## Key findings (live VPS check 2026-06-29, 31.97.148.88)

| Surface (intended) | Unit | Live state | Note |
|---|---|---|---|
| ZOE @zaoclaw_bot | zoe-bot.service | ACTIVE, 0 restarts, 0 err/1h | healthy, solo (409 dup fixed earlier today) |
| ZAO Devz @zaodevz_bot | zao-devz-stack.service | ACTIVE, clean | |
| Cowork @ZAOcoworkingBot | cowork-agent.service | ACTIVE, clean | migrated from Iman box |
| ZAOstock @ZAOstockTeamBot | zaostock-bot.service | ACTIVE, clean | |
| Hermes @zoe_hermes_bot | (none) | **NOT RUNNING - no unit installed** | doc lists it as a live Primary Surface; it is not on the box |
| Brand bots (Magnetiq/AttaBotty) | zao-team-bots.service | **INACTIVE/dead, unit not registered** | UnitFileState empty |
| Farscout (Farcaster scout) | farscout.service | ACTIVE, enabled | running but not in CLAUDE.md 5-surface list |

Disk 73% used / 27G free, load ~0. No resource pressure.

### Finding 1 - Hermes is documented-live but not running
CLAUDE.md Primary Surfaces + doc 601 list Hermes (@zoe_hermes_bot, coder+critic+auto-PR) as live. The VPS has no hermes unit (`systemctl --user list-unit-files | grep hermes` = none). Either it was never installed here or was removed. Doc/reality drift.

### Finding 2 - Unit-file drift (reproducibility gap)
5 units run live but only 3 (.service) were committed in bot/systemd/ (zao-fleet-agent, zao-team-bots, zaostock-bot). The actual running units (zoe-bot, zao-devz-stack, cowork-agent, farscout) + the timers (ecosystem-watch, fleet-claude-auth, fleet-heartbeat) were hand-installed, not version-controlled. This PR commits all live unit files (secret-scanned clean - EnvironmentFile refs only) so the fleet is reproducible.

### Finding 3 - ZOE orchestrator is 35% ready (doc 759)
The v2 vision (parallel dispatch + critic + watcher + fleet-coord) is mostly unbuilt:
- Gap 1 (15%): goal decomposition - cannot route to specialist agents. 
- Gap 2 (10%): Agent tool not in ZOE allowedTools (bot/src/zoe/concierge.ts ~line 73) - the unlock for multi-agent dispatch.
- Gap 3 (20%): no non-code critics (research/comms/task) - Hermes critic template exists to copy.
- Gap 4 (5%): no reflexion.ts memory auto-update.
- Gap 5 (3%): no learn.ts weekly failure-clustering.
- Explicit TODO: bot/src/zoe/scheduler.ts ~line 170 (Phase 4 tip generator).

### Decommissioned - do NOT build (doc 601 / CLAUDE.md)
OpenClaw container + 7-agent squad, Composio AO, FISHBOWLZ, 10-bot branded fleet, ZOE v2 redesign, bot-to-bot autonomy bridge.

## Fixes - tagged

SAFE (this PR, no live behavior change):
- Commit all live unit files to bot/systemd/ (reproducibility). DONE in this PR.
- This audit doc.

RISKY (need boot-verify + Zaal go - NOT auto-applied):
- Decide Hermes: reinstall its unit, or update docs to drop it from live surfaces. (doc/reality must reconcile.)
- zao-team-bots: restart + fix unit registration, or formally retire the brand bots.
- ZOE v2 gaps 1-5 (concierge allowedTools + critics + reflexion + learn) - this is the "build v2" track; each a boot-verified PR.
- scheduler.ts Phase 4 TODO.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this unit-file + doc PR | Zaal | PR | tonight |
| Decide Hermes: reinstall unit or drop from docs | Zaal | Decision | tomorrow |
| Decide team-bots: restart or retire | Zaal | Decision | tomorrow |
| Build ZOE v2 gaps 1-5 (boot-verified PRs) | Zaal+Claude | Build | the "build v2" track |

## Sources

- research/agents/601-agent-stack-cleanup-decision/README.md - FULL
- research/agents/759-agent-best-practices-and-zoe-orchestrator-gap/README.md - FULL
- research/agents/888-zoe-improvements-reliability-memory-routing/README.md - FULL
- bot/AGENTS.md, bot/src/zoe/{concierge,scheduler}.ts - FULL
- Live VPS systemctl/journalctl 2026-06-29 - FULL
