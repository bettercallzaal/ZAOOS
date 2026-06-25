---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 601, 734, 759, 836, 888, 890
original-query: "build out our agent interface and ecosystem so ZOE can monitor and report back on the whole codebase and ecosystem; research agents, look through all our repos and more"
tier: DEEP
---

# 899 - ZOE Agent-Fleet Architecture Audit

> **Goal:** One source of truth for the ZAO agent fleet as of 2026-06-25 - what exists in code (verified, not from docs), what is reusable, what to kill, how it maps onto a ZOE-as-hub model, and the honest path forward. Captures a multi-agent research sweep run 2026-06-24/25.

## Headline (verified against live code + VPS, not docs)

**The ZOE orchestrator is already built, tested, and deployed.** The doc-759 "5 gaps" are shipped, not stubbed. This was verified by reading the actual files and git log, after a corpus-mining subagent wrongly reported the gaps at 3-20% (it trusted dated research docs). Treat this as the corrected, current truth.

Evidence (`bot/src/zoe/`): `decompose.ts` (434L, Gap 1), `dispatch.ts` (355L) + `workers.ts` (419L) + 8 worker defs in `.claude/agents/` (Gap 2), `critics/` research+comms+task-result (Gap 3), `reflexion.ts` (366L, Gap 4), `learn.ts` (325L, Gap 5), plus `approvals.ts` (the propose->y/n->execute state machine = the autonomy gate) and `call-budget.ts`, and 21 test files. Git log shows each gap's feat commit + doc-770 security hardening. VPS (31.97.148.88) is on current `main`, 0 commits behind, `zoe-bot` active.

**Implication:** "ZOE isn't working how I want" is NOT a build problem and NOT a deploy problem. The real gaps are experience/wiring (below).

## The live fleet (verified running)

| Surface | What | Where | Pattern |
|---------|------|-------|---------|
| ZOE (`@zaoclaw_bot`) | Orchestrator/concierge: decompose -> dispatch -> critic -> reflexion -> learn | VPS `zoe-bot` | Claude CLI (Max plan, ~$0 marginal) |
| Hermes | Autonomous coder+critic+auto-PR, 3-attempt, $5/$1 caps | VPS (`bot/src/hermes`) | Claude CLI subprocess |
| ZAO Devz (`@zaodevz_bot`) | Group dispatch + narrates Hermes loop | VPS `zao-devz-stack` | Claude CLI |
| ZAOstock (`@ZAOstockTeamBot`) | Festival team coordination (graduating) | VPS `zaostock-bot` | Hermes pattern |
| ZAOcoworking (`@ZAOcoworkingBot`) | Coworking action tracker (Iman owns) | VPS `cowork-agent` | concierge |
| farscout | Autonomous Farcaster research scraper (read-only) | VPS `farscout` | research+verify |
| ZOL (`@zolbot`, FID 3338501) | Farcaster music/art scout; approval-gated replies | Pi (ansuz) | OpenRouter + Bonfire, [[project_zol_farcaster_agent]] |
| VAULT/BANKER/DEALER | In-app autonomous trading (separate product) | app `src/lib/agents/` | daily loop, atomic budget claim |

## Reusable specialists (standalone repos)

- **hermes-orchestrator** (MIT) - the wiring layer: Router -> Autonomy Gate -> Runner -> Supervisor -> Learner + BonfireMemory. (Version reported inconsistently across subagents - v0.2 vs v0.5; VERIFY before depending on it. Note: `bot/src/zoe` already has its own in-repo orchestrator, so the external package may be redundant.)
- **farscout** - research+verify feeder.
- **zaocowork** - multi-perspective dispatch (spawns N Claude CLI per dimension, aggregates).
- **ZAOscout** - keyless scraping (X, Farcaster, timelines).
- **zaoscribe / ZAOsribeBOT** - capture pipeline (Discord audio -> extract -> tracker), code-complete, awaiting deploy.

## Killed - do NOT revive (doc 601, 2026-05-04)

openclaw 7-agent squad (ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER), the 10-bot branded fleet, Composio AO, ZOE v2 / Agent Zero, multi-agent debate, autonomous bot-to-bot bridge. Cause of death in every case: model quality, API billing, or ops sprawl. Lesson: "building 2 bots to coordinate 2 bots is the smell."

## Legacy cleanup (from the repo sweep)

- **8 fractalbots collapse to 1** (`fractalbotapril2026` canonical; mar/feb/dec/nov/v1old + V2/V3 are dated snapshots).
- Archive/delete the dead ElizaOS era (`eliza1`, `Agent2`, `ZAIV1/2`) + newsletter bots (`Newsletterbot1`, `newsletter-bot-1`, `zabalnewsletter`).
- ~15 repos can go. Keep `zabalbot` (aggregation reference), `WARZAI`/`uvrintrobot` (separate domains).

## External best-practice (2026) - validation

Independent web research converged on the SAME shape ZAO already runs: **orchestrator + 3-4 specialists, cap ~5, Letta memory, cost caps, start monolithic and specialize only on a measured bottleneck.** Add an agent only when a task repeats 3+/week, parallelizes, gives 3-5x, and the handoff is deterministic; if a specialist costs >10% of the hub it's vanity. Surface: Telegram + buttons (web chats get abandoned). NOTE: the external scan's specific stats (e.g. "40+ bots", per-task $ costs) and one repo citation (it conflated Nous Research's `hermes-agent` with ZAO's `hermes-orchestrator`) are UNVERIFIED - directional only. It also priced a fleet at $150-250/mo assuming API billing; ZAO's Max-plan CLI pattern is ~$0 marginal, so ignore that.

## The real gaps (why ZOE feels unfinished despite being built)

1. **Experience/surface.** Zaal wants a persistent Claude brain he tmux's into and converses with; the live thing is a turn-based Telegram concierge.
2. **The ZOL -> ZOE chain is not wired.** ZOL pings Zaal directly, not via ZOE. The one genuinely-unbuilt piece of the hub vision.
3. **Bonfire memory is dormant** - blocked on an admin "labeling" step (recurs in every research stream). No working shared memory until flipped. Write path works; recall returns empty.
4. **Discoverability.** Casual messages may not route through decompose/dispatch, so the orchestrator behavior is never seen.

## New this session: ecosystem-monitor (PR #969)

`scripts/ecosystem-monitor/` - read-only census of the code estate (95 repos: 25 active, 40 stale, 3 archived; 39 open items) + live fleet health (UP/DOWN vs expected). Sibling to `scripts/estate-audit` (infra/billing). Daily Telegram digest staged but not activated (no-autonomous-loop rule). This is the first concrete piece of "ZOE monitors + reports on the whole ecosystem."

## "A bot per codebase" - the guardrail

Zaal wants brand/codebase bots (WaveWarZ, COC Concertz, ZAO Festivals). The safe model: **many faces, ONE brain (Hermes pattern), ONE shared memory (Bonfire), audience-gated** - NOT separate brains/configs/monitors (that is the killed 10-bot fleet). A brand earns a bot when it has people to serve. New bot still needs a doc per CLAUDE.md.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review/merge ecosystem-monitor PR #969 | @Zaal | PR merge | When reviewed |
| Wire the ZOL -> ZOE chain (the one missing hub build) | @Zaal/ZOE | Build | Next ZOE session |
| Unblock Bonfire labeling -> shared memory for all agents | @Zaal + Bonfire admin | Unblock | High value |
| Stand up the persistent tmux "talk to the brain" surface | @Zaal | Build | Per the ZOE-interface design |
| Verify hermes-orchestrator version + decide adopt vs in-repo | @Zaal | Decision | Before depending on it |
| Set ZOE autonomy-tier thresholds (tune existing `approvals.ts`) | @Zaal | Config | Before scaling autonomy |
| Legacy repo cleanup (8 fractalbots->1, kill dead ElizaOS/newsletter) | @Zaal | Cleanup | Low-pri |

## Sources

- **[FULL - first-hand code reads]** `bot/src/zoe/{decompose,dispatch,workers,reflexion,learn,approvals,call-budget}.ts`, `bot/src/zoe/critics/`, `bot/src/zoe/.claude/agents/`, `bot/src/zoe/__tests__/` (21 files), `bot/src/hermes/*`, `src/lib/agents/*` - verified 2026-06-25.
- **[FULL - first-hand]** VPS `git rev-parse`/`systemctl --user` state: on `main`, 0 behind, fleet 5/5 running.
- **[FULL]** GitHub API repo census across bettercallzaal + ZAODEVZ (95 repos).
- **[PARTIAL - subagent synthesis]** internal corpus mine (doc 601/734/759 reconstruction - WRONG on gap status, corrected here), legacy-repo + standalone-repo inventories.
- **[PARTIAL - unverified, directional]** external 2026 solo-operator fleet research (stats + one repo citation unverified).
- **[FULL - doc]** [Doc 601](../601-agent-stack-cleanup-decision/), [Doc 759 ZOE orchestrator], [Doc 734 hermes-orchestrator], [[project_zoe_orchestrator_locked]].
