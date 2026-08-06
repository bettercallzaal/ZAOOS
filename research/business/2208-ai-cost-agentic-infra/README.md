---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 2204, 2206
original-query: "research solutions to the AI cost challenge for our agentic infrastructure (~21 loops + ZOE)"
tier: STANDARD
---

# 2208 - The AI cost challenge for ZAO's agentic infrastructure: the add-list

> **Goal:** ZAO runs ~21 always-on autonomous loops + ZOE, doing research/coding/content. Cut spend without cutting quality. Ranked levers, grounded, with what ZAO already has vs the gap.

## Key Decisions (biggest wins first)

| # | ADD to ZAO | Verified fact | ZAO status | Grade |
|---|-----------|---------------|-----------|-------|
| 1 | **Prompt caching on reused context** (system prompts, brand/repo instructions, ICM boxes, RAG). | Anthropic: cache **read = 0.1x** base input (a **90% discount** on cached tokens); write = 1.25x (5-min TTL) or 2x (1-hour). **Stacks with the Batch discount.** [VERIFIED against Anthropic's own docs.] | **GAP.** ZOE/the loops do NOT use prompt caching. Every loop re-sends its big directive + context uncached each tick. This is the single biggest unclaimed win. | **HIGH** |
| 2 | **Batch API for async work** (overnight research, audits, bulk content). | Anthropic Batch = **~50% off** input+output, <24h SLA (Anthropic's caching docs confirm the batch discount stacks with caching -> a cached+batched call is ~5% of on-demand for that portion). [caching-stacks VERIFIED; the 50% batch figure is widely-cited, spot-verify at purchase.] | **GAP.** ZAO's overnight loops run synchronously. They tolerate latency (nobody's watching at 3am) -> ideal batch candidates. | **HIGH** |
| 3 | **Model routing by task complexity** - cheap tier for grunt, frontier only for the crux. | Directional: routing ~90% of calls to a cheap tier yields large savings with negligible quality loss on the easy 90% (the "march of nines" - most steps don't need frontier). [PARTIAL - directional, well-established.] | **PARTIAL.** ZOE already tiers by worker-KIND (sonnet/haiku, `workers.ts` WORKER_CONFIG). The refinement is per-TASK complexity (doc 2204 ADD #4) - opus for the hard one, haiku for grunt. | **MEDIUM (have coarse; refine)** |
| 4 | **Cheap open models via OpenRouter** (DeepSeek/Qwen) for commodity work. | DeepSeek/Qwen are ~an order of magnitude cheaper than frontier per token. [PARTIAL - exact 2026 per-token prices came from a low-fetch source; treat specific numbers as UNVERIFIED, direction solid.] | **DONE tonight.** All 21 loops pinned to OpenRouter (deepseek) 2026-08-06; cheap-loop defaults to it. ZOE cap-fallback routes here too. | **DONE** |
| 5 | **Observability-driven budget caps** - per-run cost ledger + anomaly alerts + per-loop daily cap. | "You can't cut what you can't measure"; the highest-RoI control is a per-request cost log + a cap that catches runaway loops. [PARTIAL - directional.] | **PARTIAL.** ZOE HAS `cost-ledger.ts` (per-model spend/day) + `watcher.ts` (cost-over-cap / high-fail anomaly). The gap is a hard per-loop daily CAP that halts, + cache-hit-rate tracking. | **MEDIUM (extend existing)** |
| 6 | **Semantic caching / dedup** for recurring queries. | Similar-query cache (threshold ~0.85-0.95) returns a cached answer in ms; typical 20-40% dedup on high-overlap workloads. [PARTIAL.] | **GAP** but lower priority than #1 (prompt caching already keeps full context cheap). | **LOW** |
| 7 | **Prompt compression (LLMLingua-style)** for huge static contexts. | 2-5x compression; only worth it above ~10K-token contexts AND when NOT already caching. [PARTIAL.] | **SKIP for now** - #1 (caching) already makes reused context cheap; compression's overhead isn't worth it once caching is on. | **SKIP** |
| 8 | **Local Ollama** for the cheapest tier on owned hardware. | $0 marginal cost after model download; ~70-85% of frontier quality; "easier to start than to run at scale." [PARTIAL.] | **PARTIAL.** ZAO has Ollama on the VPS/Pi (`:11434`), used as the cheap-loop's local fallback. Keep as tier-3, don't expand. | **LOW (have it)** |

## The one-line strategy

**ZAO already does the cheap-models + coarse-routing + cost-ledger half. The unclaimed half is CACHING + BATCH + a hard per-loop cap.** Stacking prompt caching (90% off reused context) + batch (50% off async) on top of the OpenRouter switch is the biggest remaining cut, and both are low-effort (a `cache_control` block on the loops' reused context; route overnight jobs through the batch endpoint).

## What ZAO has today (ground truth)

- **`bot/src/zoe/cost-ledger.ts`** - per-model spend per day (JSONL + rollup). Have.
- **`bot/src/zoe/watcher.ts`** - anomaly detection (cost-over-cap, high-fail, quality-decay). Have.
- **`bot/src/zoe/workers.ts` WORKER_CONFIG** - 2-tier model routing by worker kind (sonnet/haiku). Have (coarse).
- **`bot/src/zoe/models/router.ts`** - OpenRouter/DeepSeek cap-fallback. Have (now primary for loops).
- **`~/.zao/openrouter-loops`** - all 21 loops pinned to OpenRouter (2026-08-06). Done.
- **NOT present:** prompt caching, batch API usage, a hard per-loop daily halt-cap, cache-hit-rate metrics.

## Also See

- [Doc 2204](../../agents/2204-cross-family-verification-99darwin-orchestrator/) - ADD #4 (per-task complexity) is lever #3 here
- [Doc 2206](../2206-cloudflare-wallets-agentic-payments/) - the agentic-payments rail (a future cost/settlement surface)
- `.claude/rules/claude-usage.md` (surface tiering - the human-side of the same cost discipline), `agent-loops.md` rule 5 (cost + iteration ceilings)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `cache_control` prompt caching to the loops' + ZOE's reused context (directive/system blocks) - the 90% lever | Zaal | PR | 2026-08-13 |
| Route the overnight research/audit loops through the Batch API (~50% off, latency-tolerant) | Zaal | PR | 2026-08-20 |
| Extend `cost-ledger.ts`/`watcher.ts` with a HARD per-loop daily cap that halts + a cache-hit-rate metric | Zaal | PR | 2026-08-20 |
| Build ADD #4 per-task complexity routing (lever #3 refinement) | Zaal | PR | 2026-08-20 |
| Re-validate the specific 2026 per-token prices (DeepSeek/Qwen/Anthropic tiers) at implementation - the research's exact numbers were low-fetch | Zaal | Re-research | 2026-09-06 |

## Sources

- [Anthropic Prompt Caching docs](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) - cache read 0.1x / write 1.25x-2x, TTLs, stacks with batch - **[FULL, verified this run]**
- Subagent research report (2026-08-06, this session) - the lever landscape + rankings, ~13 searches / 3 fetches (2 FULL, 1 FAILED). Its DIRECTIONAL lever-ranking is retained; its specific secondary prices (DeepSeek V4, GPT-5.6 tiers, Ollama adoption stats) are marked **[PARTIAL/UNVERIFIED]** and NOT enshrined here as fact per `research-grounding.md` - only the Anthropic caching numbers were independently verified.
- ZAO code (this repo, FULL): `cost-ledger.ts`, `watcher.ts`, `workers.ts`, `models/router.ts`; `~/.zao/openrouter-loops` (VPS) **[FULL]**
