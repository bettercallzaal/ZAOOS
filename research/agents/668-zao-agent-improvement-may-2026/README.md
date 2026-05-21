---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
original-query: How do we make our bots better? What are the top 10 agent stack improvements for ZAO in May 2026? (reconstructed)
related-docs: 601, 650, 661, 663, 665
tier: DISPATCH
---

# 668 — ZAO Agent + Bot Improvement (May 2026 Hub)

> **Goal:** /zao-research DEEP dispatch on "how do we make our bots better." Triggered by ZOE's own session export flagging her 8-turn memory window + the gap of 4 missing projects + Ryan (Joshua.eth, Bonfires founder) building "compiled new ZOE" with persistent memory via Bonfires. Four sub-agents dispatched. Three stalled (668a, b, d) at the 10-min watchdog and were finished inline from existing context (Doc 661a / 663e / 665 / ZOE's own export). 668c completed independently.

## Top 10 Findings (Cross-Doc Consensus)

| # | Finding | Severity | Cited by | Action |
|---|---|---|---|---|
| 1 | **ZOE's 8-turn ring buffer is the highest-leverage agent gap** — anything older is gone forever, per her own export | P0 | 668b + ZOE's export | Phase 1 (append-only log) ships this week; Phase 2 (Bonfires kEngram) ships post-Ryan-SDK |
| 2 | **ZAOcoworkingBot ↔ ZABAL bonfire pipe is the concrete shippable build** — Zaal has API key + bonfire is live + 4-hour scope | P0 | 668d | Ship Phase 1 this sprint (subprocess CLI), upgrade to native SDK when Ryan drops |
| 3 | **Hermes runs every task on Opus 4.7** despite Doc 541 spec'ing tiered Sonnet/Opus routing — 30-40% cost left on table | P0 | 668c | Implement model tiering in Hermes; 3-4 days work |
| 4 | **Zero eval harness across the agent stack.** Manual escalation rate ~89% per 668c. | P0 | 668c | Wire Langfuse + Inspect AI; 5-6 days |
| 5 | **4 projects ZOE has zero context on** (Infanity, SongJam, Ansuz, Recoup) — soul fork risk | P0 | ZOE export + clipboard.html | Resolved 2026-05-18 (clipboard 3-block update + GC reply) |
| 6 | **No persistent agent memory layer** at the ecosystem level — every bot rolls its own | P1 | 668c + 668b | Bonfires IS the answer (Doc 665), just need integration patches |
| 7 | **Hermes loses decision context after 3 attempts** — restart kills the trace | P1 | 668c | Event log per attempt; semantic index over research docs |
| 8 | **Agent-to-agent protocol is ad-hoc** (ZOE → Hermes → ZAOcoworkingBot routing is hand-wired) | P2 | 668c | A2A adoption threshold = 10+ agents; ZAO at 5; wait |
| 9 | **MCP server adoption gap** — ZAO has Context7 + grep.app + a few others. No bonfires-MCP, no internal MCP for `brands.json`. | P2 | 668c + Doc 665 | Bonfires MCP will likely ship with Ryan's SDK; brands.json MCP is a 1-day side project |
| 10 | **Observability is print-statement-grade** across all bots | P2 | 668c | Wire OpenTelemetry-for-LLMs OR Langfuse for tracing; pair with eval harness |

## The 4 Sub-Docs

| # | Dimension | Status | File |
|---|---|---|---|
| 668a | Current ZAO bot inventory + health (7-axis score per bot) | Sub-agent stalled, file was written to wrong path then moved; 268 lines | [668a/](./668a-current-bot-inventory-health/) |
| 668b | ZOE memory upgrade paths (Letta/8-turn → Bonfires) | Sub-agent stalled; rewritten inline | [668b/](./668b-zoe-memory-upgrade/) |
| 668c | Industry agent best practices 2026 (MCP / evals / tools / memory / observability / anti-hallucination / A2A) | Completed independently; 500 lines, 18 sources | [668c/](./668c-industry-best-practices-2026/) |
| 668d | ZAOcoworkingBot ↔ ZABAL Bonfires integration spec (event taxonomy + file plan + rollout phases) | Sub-agent stalled; written inline from Doc 665 + Doc 650 + Zaal's DM context | [668d/](./668d-zaocoworking-bonfires-integration/) |

## Convergence Pattern

Three findings appear in 3+ sub-docs (highest-confidence):

1. **Persistent memory is the load-bearing missing piece.** 668b (ZOE specifically) + 668c (industry best practice) + 668d (the actual integration). ZOE without persistent memory = blanks past 8 turns. ZAOcoworkingBot writing to bonfire = the durable layer. Bonfires-as-substrate solves the gap.

2. **Bonfires is the right shape for ZAO's situation.** 668b + 668c + 668d + Doc 665 all converge here. ZAO already has the API key + live bonfire. Ryan is shipping "compiled new ZOE" on top of it. Building the ZAOcoworkingBot pipe NOW (Phase 1 = subprocess CLI) front-loads the value before the SDK drops.

3. **Observability + evals are zero across the stack.** 668a (manual scoring per axis) + 668c (industry comparison) both flag this. Without evals you cannot iterate on agent quality — every change is a guess.

## Unified Action Plan (P0 / P1 / P2)

### P0 — Ship This Week

| Action | Source doc(s) | Effort |
|---|---|---|
| Update ZOE's `human.md` with the 4 project clarifications (Infanity / Ansuz / Recoup / SongJam) — clipboard.html generated | 668b + ZOE export | 15 min (Zaal copies blocks, fires) |
| Ship Phase 1 of ZAOcoworking ↔ Bonfires (subprocess CLI, ~80 LoC) | 668d | 3-4 hours |
| Implement Hermes model tiering (Sonnet default, Opus on hard, Haiku quick) per Doc 541 | 668c | 3-4 days |
| Append-only log for ZOE (Phase 1 of memory upgrade): write each turn to `~/.zao/zoe/archive/<chat>-<yyyy-mm>.jsonl` alongside the ring buffer | 668b | 1 file, ~30 LoC |

### P1 — Ship Next Sprint

| Action | Source doc(s) | Effort |
|---|---|---|
| Wire Langfuse for cost tracking + Inspect AI for multi-turn evals across ZOE + Hermes | 668c | 5-6 days |
| ZAOcoworking ↔ Bonfires Phase 2 (read-back: ZOE queries bonfire for `/mine`, `/list`, `/team`) | 668d | 1-2 days after Phase 1 lands |
| Hermes event log per attempt + semantic index over research docs | 668c | 7-8 days |

### P2 — Background

| Action | Source doc(s) | Effort |
|---|---|---|
| Build a brands.json MCP server (Doc 666 manifest → agents read directly) | 668c + Doc 666 | 1 day |
| Bonfires MCP wrapper (when Ryan ships SDK; until then iframe + CLI) | Doc 665 + 668c | Wait on Ryan |
| OpenTelemetry-for-LLMs spans on every agent turn | 668c | 3-5 days |
| Cross-bot KG (Phase 3 of Bonfires integration — Magnetiq, AttaBotty, ZAOstockTeamBot all pipe to ZABAL bonfire) | 668d | Wait on Phase 2 success |

## Methodology + Honest Failure Note

Dispatched 4 sub-agents at 5:30am ET. 668c completed (500 lines, 18 sources, independent industry research). **Three sub-agents (668a, 668b, 668d) all hit the 10-min watchdog stall** with the message "Agent stalled: no progress for 600s." Pattern was: each agent did the reading + analysis phase (filled their working context) but stalled before writing the final report. 668a was furthest along — wrote 268 lines before stalling, but to the wrong path (`research/agents/668a-...` instead of `research/agents/668-.../668a-...`).

I (the parent) finished 668b + 668d inline from existing context (Doc 661a / 663e / 665 / Doc 650 / ZOE's own session export). 668a was recovered (moved to correct path) since the sub-agent had written most of it before stalling.

This isn't unique to today — earlier in this session the codebase audit (Doc 661) had 0 stalls across 8 agents. The agent-improvement audit's 75% stall rate suggests something about either (a) the recursive nature of "agents researching agents" (lots of context to load), (b) the timing of the dispatch (late session, larger conversation context), or (c) a transient harness issue. Worth flagging to Hermes / the harness operator if it recurs.

## Cross-References

- [Doc 601](../../601-agent-stack-cleanup-decision/) — primary surfaces baseline
- [Doc 650](../../650-cowork-zaodevz-imanagent/) — ZAOcoworkingBot spec
- [Doc 661](../../../dev-workflows/661-zaoos-codebase-audit-may-2026/) — Doc 661a is the prior bot audit
- [Doc 663](../../../dev-workflows/663-zao-research-meta-audit-2026-05-17/) — Doc 663e covered bots from a different angle
- [Doc 665](../../665-bonfires-deep-dive-zao-integration/) — Bonfires architecture
- `project_bonfires_zao_integration.md` — chat with Ryan, ZABAL bonfire status
- `project_hermes_canonical.md` — Hermes is the canonical agent framework, no openclaw
- ZOE's session export (in this session's conversation history) — primary source for memory state findings

## Sources

Per sub-doc Sources sections. Methodology: 4 parallel general-purpose sub-agents, /zao-research v2.2 STANDARD tier each. 3 stalls handled by inline write from parent context. No source code modified during research. The Phase 1 ZAOcoworking ↔ Bonfires patch is a separate PR (not included here).
