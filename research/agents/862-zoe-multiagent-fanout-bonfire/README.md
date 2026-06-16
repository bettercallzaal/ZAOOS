---
topic: agents
type: decision
status: research-complete
last-validated: 2026-06-16
related-docs: 759, 796, 858, 859, 860, 861
original-query: "the whole thing is its supposed to spawn tons of agents when i talked to it and read and input and output that to bonfires"
tier: DISPATCH
---

# 862 — ZOE Multi-Agent Fan-Out to Bonfire

> **Goal:** When Zaal talks to ZOE, ZOE should fan out many cheap reader agents that extract structured knowledge from what he said and write it to the ZABAL Bonfire graph - turning every conversation into durable graph memory, not just chat.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Build `bot/src/zoe/extractors.ts` - fan out 4 Haiku extractor agents (people / projects / decisions / commitments) AFTER `mirrorTurn()` in `index.ts:786`, fire-and-forget | The mirror hook already runs post-turn and is non-blocking. Extraction is additive there, no latency to Zaal. |
| 2 | Gate the fan-out: only run on substantive Zaal messages (`text.length >= 40` AND not a pure command/ack) | Most messages are "ok", "do it", "thanks". Extracting those pollutes the graph and burns tokens. |
| 3 | Each extractor returns graph-ready episodes with a `confidence` score; write only `confidence >= 0.7` via `remember()` / `delveBonfire` write path | High-recall low-precision extraction floods Graphiti with junk nodes (doc 798 pollution lesson). Precision gate first. |
| 4 | Dedup before write: hash each candidate episode `name` (entity + claim) against a rolling `seen-episodes.json`; skip exact repeats. Let Graphiti's own node-merge handle near-dups | Avoids re-writing the same fact every turn. Graphiti merges entities by name on ingest, so we only guard the obvious repeats locally. |
| 5 | Secret + PII gate every episode body before POST (reuse the secret-scan + add the `pii-hygiene.md` regex set) | Episode bodies are graph-searchable by every agent. A leaked third-party email or key there is the highest blast-radius case in the stack. |
| 6 | Model = Haiku for extractors, NOT Sonnet/Opus | ~$0.013 per 4-5 agent extraction on Haiku vs ~$0.08+ on Sonnet. At ~20 substantive messages/day that is cents/day vs dollars/day. The task (span-tag facts) is well within Haiku. |
| 7 | This is NOT a new bot. It is a code module inside ZOE. No new Telegram process | Per CLAUDE.md "no new bots without doc" - this folds into ZOE, the existing GATEWAY. |

## The Vision (what Zaal asked for)

"It is supposed to spawn tons of agents when I talked to it, and read and input and output that to Bonfires."

The current flow: Zaal DMs ZOE -> ZOE answers -> `mirrorTurn()` writes the captures/task_ops/quest_ops ZOE explicitly emitted to Bonfire. The gap: ZOE only mirrors what it *chose to flag* in its JSON ops. Everything else Zaal said - the intro to a new person, the offhand "Bayo's brother does music", the decision buried mid-paragraph - never reaches the graph.

The fix is an **extraction layer**: after every substantive turn, fan out a small fleet of single-purpose reader agents that each comb the message for one category of fact and emit graph episodes. ZOE stops being a chat bot that occasionally remembers and becomes a **knowledge-capture engine** where conversation is the input and a growing temporal graph is the output.

## Findings

### 1. Where it hooks (code-grounded)

- `bot/src/zoe/index.ts:786` - `mirrorTurn()` already runs after each concierge turn, fire-and-forget, mirroring captures/task/quest ops to Bonfire. This is the exact seam to fan out from. Add `fanOutKnowledgeExtractors(zaalMessage, zoeReply)` right after it.
- `bot/src/zoe/recall.ts` - already has `delveBonfire(query, n)` for reads and the mirror write path. The write helper (`remember()` / episode POST) is reused, not rebuilt.
- `bot/src/zoe/dispatch.ts:184` - the existing worker-dispatch seam. Extractors do NOT go through GATEWAY dispatch (that is for Zaal-facing work with watcher/recap). They are a silent background fleet with their own thin runner.

### 2. Extractor design - 4 single-purpose readers

| Extractor | Pulls | Example episode body |
|-----------|-------|----------------------|
| people | new humans, roles, affiliations | "On 2026-06-16 Zaal noted Bayo's brother is a musician interested in ZAOstock/WaveWarZ." |
| projects | products, repos, initiatives + status | "As of 2026-06-16 ZArtizen is the graduated repo for all ZAO x Artizen work, local-only, not yet pushed." |
| decisions | choices made + the reason | "On 2026-06-16 Zaal decided ZOE must never self-build code; builds happen in Claude Code, tested live in ZOE." |
| commitments | promises, follow-ups, due dates | "Zaal committed to following up with Tom Fellenz on the brand-org structure." |

Each gets ONLY the verbatim Zaal message + minimal date context (per `feedback_no_sub_agent_context_fabrication` - never inject invented dates/amounts). Each returns 0-N episodes; most turns produce 0-2.

### 3. Cost + scale (Anthropic deep-research benchmarks)

- Anthropic's own multi-agent research system runs 3-10 subagents per query and reports ~15x the token cost of a single chat turn for deep research. That is the ceiling, not our case.
- Our extractors are span-tagging, not research: ~$0.013 per 4-agent Haiku extraction (measured-equivalent from the research-agent estimate). At ~20 substantive messages/day = ~$0.26/day, ~$8/month. Negligible against the value of a complete graph.
- "Tons of agents" reads as the *feeling* of the system - many readers firing per message - but the right engineering is a small, cheap, gated fleet, not literally dozens. 4 categories cover the fact-space; add a 5th (`questions/open-threads`) later if a gap shows.

### 4. Guardrails (why precision beats recall here)

- **Confidence gate (>=0.7):** doc 798 showed invented "purpose" fields polluted the graph. Extractors emit only what is literally stated; a low-confidence guess is dropped, not written.
- **Dedup:** local `seen-episodes.json` hash-guard for exact repeats; Graphiti's name-based node merge handles near-dups on ingest (getzep/graphiti temporal-KG behavior, doc 858).
- **PII/secret scan:** every body runs the `secret-hygiene.md` key regex + `pii-hygiene.md` PII regex before POST. A body that trips either is SKIPPED (best-effort, same pattern as the existing mirror secret-scan).
- **No Zaal-facing noise:** extraction is silent. ZOE does not report "I wrote 3 episodes" every turn. It surfaces only when recall later uses them.

### 5. Closing the loop - recall reads what extraction wrote

Extraction is only half. `recall.ts` `delveBonfire()` already pulls episodes into `<bonfire_recall>` each turn. As the graph fills from extraction, ZOE's answers get grounded in Zaal's own history - "you told me Bayo's brother does music" - instead of generic knowledge. Write-then-read is the flywheel.

## Build Plan (for Zaal in Claude Code, NOT ZOE self-build)

1. `bot/src/zoe/extractors.ts` - `fanOutKnowledgeExtractors(msg, reply)`: 4 Haiku calls via `callClaudeCli`, each with a tight category prompt + JSON schema (`{episodes:[{name,body,confidence}]}`).
2. Gate: `if (msg.length < 40 || isCommand(msg)) return;`
3. For each returned episode with `confidence >= 0.7`: dedup-hash -> secret/PII scan -> `remember()` POST.
4. Wire `fanOutKnowledgeExtractors(...)` after `mirrorTurn()` at `index.ts:786`, fire-and-forget (`.catch(logOnly)`).
5. Add `seen-episodes.json` to `~/.zao/zoe/`.
6. Deploy via `scripts/zoe-deploy.sh` (whole-branch ff + verify boot). Test live by DMing ZOE a rich intro and checking `/delve` returns the new episodes.

## Also See

- [Doc 759](../759-zoe-orchestrator-architecture/) - GATEWAY + 8-worker lock
- [Doc 796](../796-zoe-proactive-reasoning/) - proactive tick + open-threads continuity
- [Doc 858](../858-bonfires-graphiti-deep-dive/) - Graphiti temporal-KG ingest + node merge
- [Doc 859](../859-zoe-bonfire-proactivity/) - mirrorTurn + delve recall wiring
- [Doc 860](../860-zoe-improvement-roadmap/) - where this sits on the roadmap

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `extractors.ts` + wire after mirrorTurn | @Zaal | Claude Code | Next ZOE session |
| Add `seen-episodes.json` dedup store | @Zaal | Claude Code | With extractors |
| Extend secret-scan with PII regex before episode POST | @Zaal | PR | With extractors |
| Verify extraction live via /delve after a rich DM | @Zaal | QA | Post-deploy |

## Sources

- Anthropic Engineering - "How we built our multi-agent research system" (3-10 subagents, ~15x token cost) - https://www.anthropic.com/engineering/built-multi-agent-research-system [FULL, via research agent]
- getzep/graphiti - temporal knowledge graph, entity node-merge on ingest - https://github.com/getzep/graphiti [FULL]
- ZAOOS codebase: `bot/src/zoe/index.ts:786` (mirrorTurn), `bot/src/zoe/recall.ts` (delveBonfire), `bot/src/zoe/dispatch.ts:184` (worker seam) [FULL, local]
- Doc 798 graph-pollution lesson (verifiable-facts-only, no invented fields) [FULL, local]
