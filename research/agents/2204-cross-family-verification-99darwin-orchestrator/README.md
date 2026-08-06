---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 2198, 2199, 2200, 2201
original-query: "DEEP tier: 99darwin/orchestrator - the open-source multi-agent orchestration skill nickysap posted (delegates tasks to models in your harness - Fable/Kimi/Codex/Anthropic - by ranked complexity; bundled security skill). What is it, how does it work, and what can we ADD to ZOE from it? Ground in ZOE's real code (decompose.ts, dispatch.ts, workers.ts, fleet failover, tiered build team) so we don't re-recommend what exists."
tier: DEEP
---

# 2204 - Cross-family verification: what 99darwin/orchestrator (and the wider 2026 pattern) adds to ZOE

> **Goal:** nickysap open-sourced his orchestrator skill (github.com/99darwin/orchestrator, MIT, pushed 2026-08-06). Read it against ZOE's real orchestration code and the wider "cross-model review" literature, and name the ADDs - grounded so we do not re-recommend what ZOE already has.

## Key Decisions (the ADD-list, recommendations first)

| # | ADD to ZOE | Grounded in (source + ZOE code) | Grade |
|---|-----------|----------------------------------|-------|
| 1 | **Cross-FAMILY verification by default - route the critic/verifier to a different model family than the builder.** ZOE already verifies (critic + zao-evaluator), but with the SAME family, so it shares the builder's blind spots. Route the verify pass through the existing fleet router to a non-Claude family (DeepSeek/Codex/Ollama). | 99darwin verifier-prompt + arxiv 2607.21656 + 4 OSS impls (cross-verify-cli, straktur, sflow, cross-model-agents). ZOE gap: `bot/src/zoe/workers.ts:365` `runCriticFor(cfg.critic,...)` runs on `cfg.model` (line 319) = same family as the worker. The fleet router already exists: `bot/src/zoe/models/router.ts` (`selectBestModel`, `routeAndCall`, `callCapFallback`) - but it only fires on CAP fallback (`concierge.ts:172`), not as a default cross-family verifier. | **HIGH** |
| 2 | **Fact-check the cross-model finding before applying it (do NOT blind-apply).** The universal warning in every source: piping a reviewer's output straight back "launders one model's hallucination through another and stamps it peer-reviewed." The orchestrator must confirm each finding against ground truth (file:line, real signatures) and only apply verified ones. | sflow.be ("only verified findings graduated into the revision"), oh-namgyu deterministic gate. ZOE ALREADY has the discipline as rules: `.claude/rules/research-grounding.md`, `anti-fabrication.md` (rule 3: re-check every high-stakes claim). This ADD = wire that rule INTO the cross-family verify path, not a new concept. | **HIGH** (pairs with #1; #1 without #2 is dangerous) |
| 3 | **Write-set parallel-safety validation in `decompose.ts`.** Two subtasks are parallel-safe iff their WRITE-sets are disjoint. ZOE's plan has `parallel_with` but it is LLM-DECLARED, never validated - a decomposer that mislabels two file-touching subtasks as parallel can stomp writes. | 99darwin `references/parallel-safety.md` (write-set disjointness rules). ZOE gap: `bot/src/zoe/decompose.ts:51,286` `parallel_with` is filtered for type only, not checked for write-set overlap. | **MEDIUM** |
| 4 | **Per-task complexity -> model tier, from a live-discovered roster (not 2 fixed tiers by worker-kind).** ZOE picks model by WORKER-KIND (`WORKER_CONFIG`, 2 tiers: `sonnet`/`haiku`). Add a per-task complexity signal so the crux/hard subtask gets a strong-reasoning tier (opus) and boilerplate drops to the cheap tier - unifying the Node workers with the Agent-tool tiered build team (orchestrator/builder/formatter). | 99darwin SKILL.md Phase 2 (classify roster by ROLE - default/strong/fast/specialized - and assign by fit, discovered live). ZOE: `bot/src/zoe/workers.ts:125` `WORKER_CONFIG` fixes model per kind; `types.ts:215-217` = 2 tiers only. | **MEDIUM** |

**Where ZOE is already AHEAD (do NOT re-add):**

- **Multi-provider fleet is native.** 99darwin needs an external shim (CLIProxyAPI) to get more than one model family into its harness; ZOE already has OpenRouter/DeepSeek + Codex + Ollama wired (`models/router.ts`, the cost-ladder). ZOE has the roster #1 needs - it just does not USE it for verification yet.
- **Deterministic gate that overrides the LLM.** oh-namgyu's headline feature (a secret/license gate no model can talk past) is already ZOE's `loop-evals.md` deterministic gate + `secret-hygiene.md` scans.
- **The fact-checker-in-the-middle.** The thing sflow calls essential and most impls skip - ZOE already mandates via `research-grounding.md` + `anti-fabrication.md`.
- **Persistent infra:** cost-ledger, `runs.ts`, `watcher.ts`, Bonfire memory, and (as of today) step-level `trace.ts` + `verify-replan.ts`. 99darwin is a lean single-session Claude Code SKILL with none of this.

## What 99darwin/orchestrator actually is

A Claude Code SKILL (MIT, 11 files, 0 stars, pushed 2026-08-06 - hours old) that drives N parallel coding tasks through a strict per-task lifecycle: **implement -> /secure -> /review -> fix -> verify -> fix -> done.** The orchestrator plays project manager: decompose, dispatch subagents, collect, attribute bugs, loop until clean. Bundled: `/secure` (security-reviewer agent) + `/review` (correctness/security/perf/maintainability/test-coverage). Optional + degrades-with-a-note: `/agent-browser`, `/audit`.

Three design ideas carry the skill:

1. **Parallel-safety by write-set disjointness** (`references/parallel-safety.md`). Editing/creating any source, test, config, lockfile, or shared build artifact is a WRITE. Two tasks parallel-safe iff write-sets do not overlap; reads may overlap freely. Phase 1 VALIDATES this before dispatch - "most orchestration failures trace back to dispatching tasks that weren't actually parallel-safe."
2. **Model-by-role, discovered live** (SKILL.md Phase 2). Enumerate the agent roster THIS session; classify by role (default / strong-reasoning / fast-cheap / specialized / alternate-family); assign each task by FIT, not by hardcoded names. Strong-reasoning reserved for the crux task, cheap tier for grunt work.
3. **Cross-family verification as the DEFAULT** (Phase 2 step 3 + verifier-prompt). "Verifiers default to a different model family than the worker that built the task... same-model self-review shares blind spots." If the roster is homogeneous, SAY SO in the plan rather than silently defaulting to same-model verification.

Hard cap: 5 worker iterations per task, then surface to the human. Graceful degradation: an optional skill that is missing must be reported, never silently skipped and called clean (this is ZOE's `silent-failure-guard.md` in a different repo).

## The wider pattern (this is not one repo's idea)

Cross-model review is a recognized, actively-researched 2026 pattern. 99darwin is one instance:

- **arxiv 2607.21656 "Cross-Model LLM Code Review"** - studies Claude-writes/Codex-reviews and the reverse. Key, tempering finding: the gain depends on whether the reviewer is STRONGER than the drafter. A heavy first-pass verifier (Opus at high effort) "leaves less for any second pass to find," so a weaker cross-family reviewer can add cost without benefit - or regress a working solution. Cross-family verify pays off most where the builder is NOT already the ceiling.
- **oh-namgyu/cross-verify-cli** - "the model that wrote the code is never the one that approves it." A deterministic gate (secrets/PII/license, no LLM) whose blockers ALWAYS beat the model verdict + an independent second-model reviewer that never sees the author's self-assessment (anti-anchoring). Same-model verifier is detected and capped at `ready-with-notes`.
- **straktur.com cross-model recipe** - "models fail in opposite directions" (Claude over-architects, Codex over-simplifies). The "CTO who can disagree" framing so the builder evaluates each comment instead of blindly accepting.
- **sflow.be multi-model cross-review** - the load-bearing warning: "the orchestrator never blind-applies a finding... only verified findings graduated into the revision... skip that and you have built a machine for laundering one model's hallucination through another and stamping it peer-reviewed." Also the "second reviewer, find what the FIRST missed" priming so reviewer two does not just restate reviewer one.
- **Dallionking/cross-model-agents** - bidirectional Opus<->Codex adversarial pipeline: plan review, anti-slop per-file scoring (>=7/10, loop up to 3), devil's advocate, gap analysis - each a cross-model BLOCKER gate.

Convergent signal across 5 independent sources: different model FAMILIES have different blind spots; a finding two families reach independently is worth more than one family's confident finding; and the value is real ONLY if an arbiter fact-checks the findings against the actual code.

## What ZOE has today (ground truth, so #1-#4 are honest)

- **Decompose:** `bot/src/zoe/decompose.ts` produces a `DecompositionPlan` with `depends_on` + `parallel_with` + approval gates, MAX_SUBTASKS 12, "default to fewer parallel branches." `parallel_with` is LLM-declared and only type-filtered (lines 286-287), NOT write-set validated -> **ADD #3**.
- **Dispatch:** `bot/src/zoe/dispatch.ts` runs dependency waves -> `runClaudeWorker`, capped concurrency per wave.
- **Model per worker:** `bot/src/zoe/workers.ts:125` `WORKER_CONFIG` maps each worker KIND to `ZOE_DEFAULT_MODEL` (sonnet) or `ZOE_QUICK_MODEL` (haiku) - `types.ts:215-217`. Fixed, 2 tiers, no live roster, no per-task complexity, no opus tier -> **ADD #4**.
- **Verify:** `runCriticFor(cfg.critic,...)` (workers.ts:365) + the fresh-context `zao-evaluator` (loop-evals default-FAIL contract) + today's `verify-replan.ts`. All run on Claude/`cfg.model` = SAME family -> **ADD #1**.
- **Fleet:** `bot/src/zoe/models/router.ts` already routes to non-Claude providers, but only as CAP fallback (`concierge.ts:172`), not as a default cross-family verifier. The roster #1 needs is already there.
- **Tiered build team (Agent tool):** `zao-build-orchestrator` (Opus) / `zao-builder` (Sonnet) / `zao-formatter` (Haiku) / `zao-evaluator` (fresh-context grader) - a role-tiered team that exists SEPARATELY from the Node workers. #4 is partly "unify these two systems' tiering."

## Design notes (safety envelope)

- **#1 needs #2 or it is worse than nothing.** Routing the verifier to DeepSeek/Codex without ZOE fact-checking its findings turns cross-family review into hallucination-laundering (sflow). ZOE already has the arbiter rule - wire it in, do not skip it.
- **Apply cross-family verify where it pays (arxiv nuance).** ZOE's autonomous workers are sonnet/haiku, not the ceiling - a cross-family check adds signal there. An Opus-tier build (the tiered team's orchestrator) may not need it. Gate #1 by builder tier, do not blanket it.
- **Cross-family verify is observation + gating, not autonomous action.** It stays within the existing PR-only + human-gate rails (`agent-loops.md` rule 8). No outbound/spend/on-chain change.
- **Cost:** a cross-family verify pass is one extra cheap-tier call per verified task; the cost-ledger + daily cap already bound it. Route the verifier to the CHEAP fleet tier (OpenRouter/DeepSeek), not a second premium call.

## Also See

- [Doc 2198](../2198-agent-orchestration-field-scan/) - agent orchestration field scan (observability + gate findings)
- [Doc 2199](../2199-zoe-add-list-failure-memory-skills/) - ZOE add-list (failure-memory, skills)
- [Doc 2200](../2200-zoe-upgrade-tracing-verify-replan/) - step-level tracing + verify-replan (both now shipped + proven live)
- `.claude/rules/loop-evals.md` (default-FAIL fresh-context evaluator), `research-grounding.md` + `anti-fabrication.md` (the arbiter #2 relies on)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR: route `runCriticFor` verify pass to a non-Claude fleet family via `models/router.ts` (cheap tier), gated to sonnet/haiku-built tasks, findings fact-checked before apply (ADD #1+#2) | Zaal | PR | 2026-08-13 |
| PR: add write-set overlap check in `decompose.ts` - flag/sequence `parallel_with` subtasks whose declared file-touches intersect (ADD #3) | Zaal | PR | 2026-08-20 |
| Decide: unify Node `WORKER_CONFIG` tiers with the Agent-tool tiered build team into one per-task-complexity router (ADD #4) - design doc first | Zaal | Decision | 2026-08-20 |
| Ping nickysap (nick, @nickysap, FID 269091) - his orchestrator skill is aligned with ZOE; potential compare-notes | Zaal | Outreach | 2026-08-13 |

## Sources

- [github.com/99darwin/orchestrator](https://github.com/99darwin/orchestrator) - README, SKILL.md, parallel-safety.md, verifier-prompt.md fetched + read via `gh api contents` **[FULL]** (worker-prompt.md, verification-guide.md, security-reviewer.md, /secure, /review listed in tree, not each fully read - **[PARTIAL - read the 4 load-bearing files, not all 11]**)
- [farcaster.xyz/nickysap/0x0e17092f](https://farcaster.xyz/nickysap/0x0e17092f) - the source cast (fetched via Neynar cast-by-url) **[FULL]**
- [arxiv.org/html/2607.21656v1](https://arxiv.org/html/2607.21656v1) - "Cross-Model LLM Code Review" (Claude vs Codex reviewer asymmetry) **[PARTIAL - exa highlights, not full paper]**
- [github.com/oh-namgyu/cross-verify-cli](https://github.com/oh-namgyu/cross-verify-cli) - deterministic gate + independent second-model verifier + same-model guard **[FULL - via exa highlights]**
- [straktur.com/docs/recipes/cross-model-review](https://straktur.com/docs/recipes/cross-model-review) - "CTO who can disagree" cross-model recipe **[FULL - via exa highlights]**
- [sflow.be/insights/posts/multi-model-cross-review](https://sflow.be/insights/posts/multi-model-cross-review) - the fact-check-the-finding warning + parallel-jury shape (2026-06-11) **[FULL - via exa highlights]**
- [github.com/Dallionking/cross-model-agents](https://github.com/Dallionking/cross-model-agents) - bidirectional Opus<->Codex adversarial gates (2026-03-07) **[FULL - via exa highlights]**
- ZOE code (this repo, read FULL): `bot/src/zoe/decompose.ts`, `workers.ts`, `dispatch.ts`, `types.ts`, `models/router.ts` refs, `concierge.ts` cap-fallback **[FULL]**
