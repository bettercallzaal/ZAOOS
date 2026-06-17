---
topic: business
type: audit
status: research-complete
last-validated: 2026-06-17
related-docs: 759, 799, 839, 842, 856, 862, 722
original-query: "analayze our stuff here in this terminal and make guessues at weakneses in the brand and help me identifiy them through the zoe bot also how is the building the agent builder going can i ask zoe to do something and it will spawn an agent"
tier: DISPATCH
---

# 868 — Brand Weakness Audit + ZOE Agent-Builder Status

> **Goal:** Two answers in one pass. (1) The concrete brand weaknesses, ranked, grounded in our own docs - and how ZOE surfaces them. (2) Straight answer: can you ask ZOE to do something and it spawns an agent right now? Yes, but only one way.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Fix the front door FIRST: one canonical entry URL, kill/redirect thezao.com (dead), put it in every bio | 3 competing entry points (doc 722) is the #1 acquisition leak - newcomers literally do not know where to go |
| 2 | Lead with "The ZAO" everywhere external; demote ZABAL to the internal-toolstack role | ZABAL is eclipsing the umbrella brand in outbound (doc 839) - the single biggest identity erosion |
| 3 | Lock ONE canonical pitch and make ZOE a broken record of it | "decentralized impact network, music first" exists (doc 799) but is not repeating; team hears different stories |
| 4 | To spawn an agent from ZOE today, prefix the message with `plan:` - then approve y/n | The decompose-approve-dispatch pipeline is fully wired; plain DMs do NOT spawn agents |
| 5 | Wire `shouldDecompose()` so multi-step asks auto-spawn without the `plan:` prefix | The heuristic exists in code but is never called - this is the one change that makes ZOE feel like an agent-builder |
| 6 | Use ZOE to surface this audit: it pushes ONE brand-weakness per day with a fix, not a wall | Matches Zaal's less/clear/simple preference; turns a static doc into a daily nudge |

## Part 1 - Brand Weaknesses (ranked by damage)

All 8 are grounded in our own research. None are subjective.

| # | Weakness | Evidence | Why it hurts |
|---|----------|----------|--------------|
| 1 | **Three competing entry points, no clear "where do I go"** - zaoos.com (gated), zaoos.com/zabal (hub), bettercallzaal.com/nexus, thezao.com (dead) | Doc 722 sec 9; Fellenz doc 839: "you've arrived and it's just like, where do I go?" | Motivated people can't find where to plug in. Acquisition leak before onboarding even starts. |
| 2 | **ZABAL eclipsing The ZAO in external comms** | Doc 839 headline; Fellenz: "you're not saying The ZAO anymore, you're saying ZABAL, you're losing the brand" | Outsiders think ZABAL (internal tooling) is the thing. Partners read The ZAO as a sub-brand. |
| 3 | **ZAO acronym not locked** - "Zeal. Alignment. Ownership." is only a candidate | memory `project_zao_brand_canon`; treat as "working unpacking", never official | "What does ZAO stand for?" wavers. Feels like an experiment, not a thing. |
| 4 | **Canonical pitch exists but is not repeating** - team doesn't share the one-liner | Doc 799: "pick the ONE message and be a broken record"; Tim's test never run on the team | No narrative coherence. Iman, ThyRev, COC each hear a different emphasis. |
| 5 | **Bot/Telegram overhead repels non-technical newcomers** | Doc 839 ch 6: agent output "interferes with quick communication", content "lost in it" | Only crypto-native people parse the Telegram. Musicians overwhelmed -> leave. Reinforces "ZAO is a tech project." |
| 6 | **No shared org chart; partnership boundaries unclear** | Doc 842 (built to fix this) not yet shared; COC's status as peer-vs-subproject ambiguous | Partners don't trust the structure. Volunteers don't know who to ask. Slower decisions. |
| 7 | **Dead canonical domain (thezao.com) still in bios** | Doc 722 sec 8: "DEAD - no deployed version, replaced by zaoos.com/zabal"; bio update not done | Click bio -> dead site -> "project abandoned." Worst first-impression signal in web3. |
| 8 | **ZABAL Games scope muddle** - outsider hackathon vs internal ops, one surface | Doc 839 ch 2; doc 842 tries to cleave outward-vs-inward | An outside builder can't tell if Games is for them or for ZAO ops. Messaging collision. |

Cross-cutting signal: CLAUDE.md's Brand & Name Glossary exists because so many names get mis-spelled/mis-capitalized (WaveWarZ, ZABAL, The ZAO, COC Concertz). A brand needing a 14-row correction table is itself a coherence tell.

## Part 2 - Agent-Builder Status: can you ask ZOE and it spawns an agent?

**Short answer: Yes - but only if you prefix with `plan:` and approve. A plain DM does not spawn anything.**

### What works end-to-end (tested)
- **Decompose -> approve -> dispatch.** `plan: research the ZAOstock sponsors and draft a one-pager` triggers `handlePlanCommand()` (index.ts:846) -> `decomposeGoal()` (decompose.ts:375) -> renders a plan -> you reply "y" -> `runApprovedPlan()` (index.ts:1055) -> `dispatchPlan()` (dispatch.ts:238) spawns workers in dependency waves with budget caps + approval gates. Fully wired, covered by dispatch.test.ts.
- **8 worker specs all exist** as files in `bot/src/zoe/.claude/agents/` (research-worker, code-reviewer, comms-drafter, task-dispatcher, data-runner, brief-writer, recap-agent, watcher-agent), each run via `callClaudeCli` with a per-worker tool allowlist (workers.ts:310), graded by critics with a revision pass.
- **Hermes** code-fix dispatched separately via `dispatchHermesRun()` (dispatch.ts:184).

### What is stubbed or missing (the gap to the "GATEWAY spawns agents" vision)
1. **Inline spawning from a normal DM is NOT implemented.** Concierge adds `Task`/`Agent` to allowedTools (concierge.ts:120) but the Node layer (`splitReplyAndOps`, concierge.ts:162) never captures or waits on a Task result. So "research X for me" with no prefix = ZOE answers inline, no agent.
2. **Auto-decompose heuristic exists but is never called.** `shouldDecompose()` (decompose.ts:315) can detect a multi-step goal, but nothing in index.ts invokes it - `decomposeGoal()` only fires from the explicit `plan:` command. **This is the single highest-leverage fix:** call `shouldDecompose()` on substantive DMs so multi-step asks auto-route to the approve-dispatch flow.
3. **`escalate` Sonnet->Opus fallback is spec-only** - persona mentions it (memory.ts), `splitReplyAndOps` does not act on it.

### So, in practice today
- `research the sponsor landscape` -> inline answer, no agent.
- `plan: research the sponsor landscape and draft a one-pager` -> plan -> y -> agents spawn and run. This is the agent-builder, and it works.

## How ZOE surfaces this (the "through the ZOE bot" ask)

ZOE pushes ONE item/day from Part 1 as a proactive nudge: the weakness + the one fix + a yes/no ("want me to draft the bio update?"). Not a wall. This rides the existing proactive tick (doc 796) - add a `brand-audit` CandidateKind seeded from this doc's table. The new extractor layer (doc 862) will also start capturing brand decisions Zaal makes in chat, so the audit stays live instead of going stale.

## Also See

- [Doc 839](../../events/839-fellenz-brand-org-strategy/) - Fellenz brand/org critique (source of weaknesses 1,2,5,6,8)
- [Doc 842](../842-zao-org-chart-brand-hierarchy/) - org chart + brand hierarchy
- [Doc 799](../799-broken-record-leadership-repetition/) - canonical pitch + rule of 7
- [Doc 759](../../agents/759-agent-best-practices-and-zoe-orchestrator-gap/) - GATEWAY + 8-worker lock
- [Doc 862](../../agents/862-zoe-multiagent-fanout-bonfire/) - extraction fan-out (keeps the audit live)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick the ONE canonical entry URL + redirect/kill thezao.com + update all bios | @Zaal | Decision + PR | This week |
| Audit external surfaces: lead with "The ZAO", demote ZABAL to toolstack | @Zaal | PR | This week |
| Wire `shouldDecompose()` into the DM path so multi-step asks auto-spawn agents | @Zaal | Claude Code | Next ZOE build |
| Add `brand-audit` CandidateKind to the proactive tick (one nudge/day from Part 1) | @Zaal | Claude Code | Next ZOE build |
| Run Tim's test: ask 3 team members "what does Zaal repeat constantly?" | @Zaal | Task | This week |

## Sources

- research/events/839-fellenz-brand-org-strategy/README.md - Fellenz critique [FULL, local]
- research/business/842-zao-org-chart-brand-hierarchy/README.md - org chart [FULL, local]
- research/community/856-zao101-content-expansion/README.md - onboarding [FULL, local]
- Doc 722 (ZAO web presence inventory) - 3-entry-point + dead-domain findings [FULL, local]
- Doc 799 (canonical pitch) - broken-record + rule-of-7 [FULL, local]
- memory `project_zao_brand_canon` - acronym-not-locked [FULL, local]
- Codebase: bot/src/zoe/{concierge.ts:120, decompose.ts:315/375, dispatch.ts:184/238, index.ts:846/1055, workers.ts:310}, bot/src/zoe/.claude/agents/*.md [FULL, local]
