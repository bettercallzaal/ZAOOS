---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-15
related-docs: "759, 796, 858, 859, 801, 245"
original-query: "better ways to improve ZOE agent"
tier: DEEP
---

# 860 - ZOE improvement roadmap (grounded)

> **Goal:** the prioritized, real list of ways to improve ZOE - filtered against ZOE's actual code so we build the gaps, skip what doesn't apply to a CLI-run agent, and don't rebuild what already exists.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Graph-driven proactivity is the #1 upgrade** | ZOE's proactive tick (doc 796) is blind to the Bonfire graph + (until today) to cross-repo GitHub activity. The graph is the richest "be useful" signal and it's untapped. Spec'd in doc 859. Highest leverage. |
| 2 | **Wire reflexion memory INTO dispatch (recall-before-act)** | ZOE has `reflexion.ts` + writes episodes (`remember()`), but never `/delve`s "how did similar work go before" BEFORE acting. Close the loop: query past lessons, inject into the worker prompt. |
| 3 | **Add a lightweight continuous eval** - 4-5 golden journeys, daily | ZOE has ZERO eval today. It can't tell when a change breaks something (we nearly shipped thin recall). A few rubric-scored journeys/day catches regressions cheaply. |
| 4 | **Memory compaction before the graph gets noisy** | `/delve` already returns 44-53 episodes for common queries and grows daily. Periodic summarize-and-archive keeps recall sharp. |
| 5 | **SKIP: manual prompt cache_control, MCP-server rewrite, orchestrator redesign** | ZOE runs via the Claude Code CLI (`callClaudeCli`, `bare:false`) which handles prompt caching itself - manual `cache_control` doesn't apply. Workers already have role cards (`bot/src/zoe/.claude/agents/*.md`) and a validation gate (watcher-agent). These generic "upgrades" are already done or N/A. |

## What ZOE ALREADY has (do not rebuild)

Research surfaced 10 generic "agent upgrades." Filtered against the code, these already exist:

| Generic advice | ZOE reality |
|----------------|-------------|
| Reflexion / learn-from-outcome | `bot/src/zoe/reflexion.ts` + `learn.ts` exist |
| Episodic memory writes | `recall.ts` `remember()` + `mirrorTurn()` mirror captures to the graph |
| Role-based worker prompts | 8 workers + 3 critics as role cards in `bot/src/zoe/.claude/agents/` (doc 759) |
| Silent-failure catch / validation gate | `watcher-agent` (binary pass/warn/fail on worker output) |
| Threshold-gated proactivity, anti-noise | `proactive.ts` reasoning tick (doc 796): single-best-thing + unacked self-throttle |
| Model routing | `selectModel()` + `escalate:true` -> Opus |
| Grounding before answering | persona GROUNDING block: grep research/ first, /delve recall injected as `<bonfire_recall>` |

## The real gaps (prioritized roadmap)

### Tier A - high leverage, bounded
1. **Graph-driven proactive candidates** (doc 859): add `gatherBonfireCandidates()` to `proactive.ts` - stale-relationship, open-decision, stale-project nudges, sourced from the graph. Cross-repo GitHub awareness shipped today (`brief.ts` `gh search commits`); next is feeding it into the *tick*, not just the 5am brief.
2. **Recall-before-act**: in the GATEWAY dispatch path (`index.ts` / `concierge.ts`), before a worker runs, `/delve` "lessons from [similar task]" and inject. ZOE has all the pieces - just not wired in this order.
3. **Lightweight eval harness**: 4-5 golden journeys (task add+complete, graph-answer, escalation, capture-persists) run daily; rubric-score; alert on >X% drift. New `bot/src/zoe/eval/`.

### Tier B - real but heavier
4. **Memory compaction**: monthly cron - summarize episodes by tag, write an `archive_summary` episode, prune the originals. Keeps `/delve` sharp past ~1k episodes.
5. **Context efficiency**: the per-turn 4-block rebuild + 12-episode recall grows the prompt. Lever (CLI-compatible): only inject `<bonfire_recall>` when the message is graph-shaped (already gated at len>=12; tighten to intent), and trim stale `working` memory. NOT manual cache_control (CLI handles caching).
6. **Tool/permission audit**: ZOE's `allowedTools` in `concierge.ts` - confirm it has the read tools it actually needs (this session found `gh` underused). Add `gh search`, keep the list tight.

### Tier C - reliability (grounded in ZOE's actual routing/worker code)

**The real silent-failure gaps for ZOE** (the highest-value reliability work):
- **Read-after-write verification.** `recall.ts` `remember()` and the task writes return `ok` but never read back to confirm the episode/task actually persisted. The "13 agent eval tests" pattern (Thinking Loop, 2026) + read-after-write is the fix: after a write, fetch it and assert. Catches the "I logged it" / "no memory updates needed" class of silent failure. Low effort, high trust.
- **Stuck-loop watchdog.** No detector for a worker calling the same tool with the same args repeatedly (OpenClaw issue 16808 pattern: flag if same tool+args > N in last M calls). Cheap to add; prevents runaway loops.
- **Eval foundation already exists.** `runs.ts` writes per-run telemetry (cost, score, critic issues) to `~/.zao/zoe/runs/YYYY-MM-DD.jsonl`, and `learn.ts` already clusters recurring critic issues weekly. So the Tier A #3 eval harness has a data foundation - golden journeys + rubric scoring layer on top of this, not from scratch.

**Model routing - ZOE's concierge routing is SOTA-aligned; the worker path has one real gap.**
- Concierge `selectModel()` (Sonnet default; Opus for plan/strategy/architecture or >280 chars; Haiku for short factual) + `escalate:true -> Opus` matches 2026 best practice: Sonnet 4.6 hits 79.6% SWE-bench (vs Opus 80.8%) at ~5x less; escalate to Opus for deep reasoning (Opus keeps a 17-pt GPQA lead). The unified routing+cascade result (arXiv 2410.10347) confirms cheap-default + escalate is optimal. No concierge change needed.
- **The gap: workers never escalate to Opus.** When a worker fails its critic (score <70, threshold in `workers.ts`), ZOE does ONE revision pass *on the same Sonnet model* with feedback - it never escalates a repeatedly-failing worker to Opus (confirmed: no Opus fallback in `workers.ts`/`dispatch.ts`). The cascade literature says this is exactly when to escalate. **Upgrade: after a worker fails revision once, escalate the retry to `ZOE_HARD_MODEL` (Opus) instead of returning `needs-revision`.** Bounded, reuses the existing budget cap, directly improves output quality on hard tasks.
- Caveat (no action): concierge escalation uses self-reported `escalate:true` (verbalized confidence), weaker than probe-based UQ (ICML 2025, openreview DJpEIwKJt7) - but probe-UQ isn't feasible through the Claude Code CLI, so it's the right call for ZOE's runtime.

## Sequencing

- **This week:** graph-driven candidates (#1) + recall-before-act (#2) - both reuse existing pieces, biggest day-to-day impact.
- **Next:** eval harness (#3) so further changes are measurable.
- **Then:** compaction (#4) + context trim (#5) for scale.
- Audit (#6) anytime - cheap.

## Also See

- [Doc 859](../859-zoe-bonfire-connection-proactivity/) - the graph-driven proactivity spec (Tier A #1)
- [Doc 858](../858-bonfires-graphiti-current-state/) - why keep Letta blocks for ZOE, graph for shared knowledge
- [Doc 796](../796-zoe-conversational-proactive-redesign/) - the reasoning-tick proactivity ZOE runs
- [Doc 759](../759-zoe-orchestrator-architecture/) - the locked GATEWAY + 8-worker architecture
- [Doc 801](../801-zoe-cowork-systems-audit-consolidation/) - systems audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `gatherBonfireCandidates()` in proactive.ts (doc 859) | @Zaal/Claude | PR | This week |
| Wire recall-before-act into the dispatch path | @Zaal/Claude | PR | This week |
| Stand up `bot/src/zoe/eval/` with 4-5 golden journeys + daily run | @Zaal/Claude | PR | Next |
| Add monthly episode compaction cron | @Zaal/Claude | PR | After eval |
| Merge this session's shipped ZOE changes (persona/recall/brief, PRs staged behind rate limit) | @Zaal | Merge | When rate limit clears |

## Sources

- ZOE codebase read this session: `bot/src/zoe/{recall,proactive,scheduler,nudges,concierge,memory,brief,reflexion,relay}.ts`, `.claude/agents/*` [FULL]
- Agent-harness patterns brief (context engineering, episodic memory, Ralph loop, eval, tool granularity) - Anthropic context-engineering guidance, Reflexion (arXiv 2303.11366), Letta Terminal-Bench, MCP v2 spec [FULL via agent; generic advice filtered against ZOE reality]
- Proactive-assistant patterns brief (Charlie daemons, Reclaim focus-time, pre-meeting dossiers, signal-vs-noise) [FULL via agent]
- Reliability/eval brief [PARTIAL - agent still running at write time; Tier C to be enriched]
- [Doc 858 memory landscape](../858-bonfires-graphiti-current-state/) - Letta vs Graphiti benchmarks [FULL]
