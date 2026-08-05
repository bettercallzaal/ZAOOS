---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-05
superseded-by:
related-docs: 2198, 2199
original-query: "keep researching what can we add to upgrade our agent - observability/tracing + planning quality as ZOE upgrades"
tier: STANDARD
---

# 2200 - What to ADD to ZOE: step-level tracing + a verify-replan planning loop

> **Goal:** doc 2198 found winning teams "invested in observability, evaluation harnesses, and human-review, regardless of framework." This checks ZOE's real observability + planning against the field and names the two adds. Continues the [[feedback_research_to_agent_upgrade_lens]].

## What ZOE already has (so we don't re-add it)

Read live 2026-08-05: `cost-ledger.ts` (per-model spend per day, JSONL + rollup), `runs.ts` (append-only per-RUN telemetry - every worker run + critic verdict), `watcher.ts` (anomaly detection: cost-over-cap / high-fail-rate / quality-decay / unit-down/healed), `decompose.ts` (structured DecompositionPlan - worker routing, dependencies, parallel waves, approval gates, MAX_SUBTASKS 12, `shouldDecompose` heuristic + y/n approval to Zaal). No OpenTelemetry, no step-level nested spans, no golden-eval suite, no post-execution verify/replan.

## Key Decisions (the add-list)

| # | ADD to ZOE | Grounded in | Maps to ZOE |
|---|-----------|-------------|-------------|
| 1 | **Step-level tracing (OTel spans), not just run-level.** Make each worker run a trace TREE: worker span > each LLM call (`generation`) + each tool call (`tool`), carrying latency + tokens + cost + prompt-version. | OTel GenAI semantic conventions (finalized late 2025) are the industry standard; the Claude Agent SDK + MCP emit OTel natively; Langfuse's 4-level hierarchy (session > request > chain > leaf). The pain this fixes: "failures usually hide in an intermediate step" / "when something breaks mid-graph, tracing back what state you were in is painful" (doc 2198). | ZOE's `runs.ts` is run-granularity - it says a worker failed, not WHERE. `callClaudeCli` already returns model+tokens+cost per call (cost-ledger uses it); wrap the worker loop in spans and emit OTel. Lands in self-hosted Langfuse (OSS) or just structured local span JSONL. **Synergy: a real trace IS the raw `{signature, lesson}` data for doc 2199's failure memory AND the golden-eval set - #1 here enables 2199.** |
| 2 | **A verify-replan loop on `decompose.ts`.** After dispatch, a ResultVerifier scores each subtask (complete/partial/incomplete, 0-1, missing aspects, recommendation accept/retry/escalate); on gaps, retry the low-score subtasks PRESERVING prior results, bounded by stop conditions. | VMAO Plan-Execute-Verify-Replan (+53% completeness on open-ended queries); VERIMAP (verification functions + retry loop, replan after N retries, iteration cap 5). Key empirical: **most replan actions are RETRIES of incomplete subtasks, not new ones** - execution variance (tool failures) causes more gaps than bad decomposition. | `decompose.ts` produces the plan + dispatches; the missing piece is the post-execution verifier + a bounded retry-with-preserved-results. ZOE already has caps (MAX_SUBTASKS, daily cap) for the stop conditions. Reuse the `zao-evaluator` pattern as the ResultVerifier. |
| 3 | **(lighter) A golden-eval regression set + a pre-execution plan rubric.** Promote flagged failure runs into a labeled golden set; replay worker prompts against it whenever a persona/learning/worker-spec changes. And a binary completeness/executability checklist on the plan BEFORE surfacing to Zaal. | Langfuse golden-dataset (snapshot failing traces -> corrected expected output -> replay on prompt change, fail CI on regression; 3 eval tiers: deterministic / model-graded / golden-set). SVR static plan rubric ("plans look plausible but are incomplete"). | ZOE has the gate (`loop-evals.md`) but no standing regression SUITE - the "evaluation harness" doc 2198 named. `runs.ts` + doc 2199's failure memory are the raw source; add the labeling + replay + a CI check on prompt/persona changes. |

## Why these two first (not a trace UI for its own sake)

The 5 questions a production agent setup must answer on demand: what did the model see, what did it return, how long, how much did it cost, was it good - filterable by prompt-version + model-version. ZOE answers cost (cost-ledger) + a coarse "was it good" (critic/watcher) but NOT "where in the run did it go wrong" (no spans) and NOT "did this prompt change regress quality" (no golden set). Add #1 makes ZOE debuggable mid-run; #2 makes multi-step goals self-correcting instead of silently-partial; #3 makes prompt/persona changes safe. And #1 is load-bearing for the whole upgrade arc - the trace is the substrate doc 2199's memory + this doc's eval set both read from.

## Design notes (safety envelope)

- **OTel, not a bespoke SDK** (doc 2198 + Langfuse v4): emit standard OTel GenAI spans so ZOE is not locked to one backend and can fan out (self-hosted Langfuse today, anything OTLP later). Instrument once at the standard.
- **Verify-replan must be BOUNDED** (VMAO 5 stop conditions: completeness ~80%, diminishing-returns <5%, token budget, max ~3 iterations). ZOE's existing caps + `silent-failure-guard`/`loop-evals` gates are the ceiling - a replan loop without a hard stop is the runaway-spend failure mode.
- **Human-gate unchanged:** verify-replan is autonomous WITHIN a dispatched research plan (already the safety-rail work); code/outbound/spend stay Zaal-gated (agent-loops rule 8). Tracing + eval are pure observation - no behavior change.

## Also See

- Doc 2198 - agent orchestration (observability + gate findings) / Doc 2199 - ZOE add-list (failure-memory/skills), which #1's traces feed
- `.claude/rules/loop-evals.md`, `silent-failure-guard.md`, `agent-loops.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Prototype OTel span instrumentation of the ZOE worker loop (worker > generation + tool spans, latency/tokens/cost/prompt-version), emitting to a self-hosted Langfuse or local span JSONL - shipped when one worker run renders as a trace tree | @Zaal | PR | 2026-09-02 |
| Spec + prototype the verify-replan loop on `decompose.ts`: a ResultVerifier + bounded retry-with-preserved-results (reuse zao-evaluator) - shipped as a PR with a test proving an incomplete subtask triggers a bounded retry | @Zaal | PR | 2026-08-28 |
| Stand up a small golden-eval set from flagged `runs.ts` failures + a CI check that replays worker prompts on persona/learning/spec changes - shipped when a prompt change runs the set and fails on regression | @Zaal | PR | 2026-09-09 |

## Sources

- [AI Agent Observability, Tracing & Evaluation - Langfuse (2026-07-15)](https://langfuse.com/blog/2024-07-ai-agent-observability-with-langfuse) - [FULL] via exa; OTel convergence, 10 observation types, nested trace tree, Claude Agent SDK OTel
- [Langfuse v4 = the OpenTelemetry rewrite - dreaming.press (2026-07-21)](https://dreaming.press/posts/how-to-instrument-an-agent-langfuse-v4-otel.html) - [FULL] via exa; v4 IS an OTel layer, @observe nesting, fan-out/fan-in
- [LLM Observability with Langfuse and Helicone - Pavan Rangani (2026-05-08)](https://pavanrangani.com/blog/llm-observability-langfuse-helicone-tools-guide) - [FULL] via exa; the 5 questions, 4-level trace hierarchy, 3 eval tiers per prompt PR, OTel GenAI conventions
- [Golden-dataset evaluation - Langfuse docs](https://langfuse.com/resources/engineering/golden-dataset-evaluation) - [FULL] via exa; promote failing traces -> golden set -> replay on prompt change -> CI fail-on-regression
- [VMAO: Plan-Execute-Verify-Replan-Synthesize (arXiv 2603.11445, 2026-03-15)](https://arxiv.org/html/2603.11445v2) - [FULL] via exa; ResultVerifier + AdaptiveReplanner + 5 stop conditions; +53% completeness; retries > new questions
- [VERIMAP: Verification-Aware Planning for Multi-Agent Systems (EACL 2026)](https://aclanthology.org/2026.eacl-long.353.pdf) - [PARTIAL] via exa; verification functions + retry loop + replan-on-fail (iter cap 5)
- [Unified Plan Verification (SVR + DVP) - OpenReview ICLR 2026](https://openreview.net/forum?id=qDFegAnCin) - [PARTIAL] via exa; static pre-execution rubric (completeness/correctness/executability) + dynamic execution control
- [GNN-based plan verifier (arXiv 2603.14730)](https://arxiv.org/pdf/2603.14730v2) - [PARTIAL] via exa; structural plan defects (type mismatch, broken deps) LLM-judges miss

_Status: DESIGN/spec doc, not built (agent-loops rule 35). Fetch method: exa web_search (reddit.com blocked to WebSearch UA). ZOE module facts from reading live `bot/src/zoe/` this run. This is the final pass of the ZOE-upgrade research arc (docs 2199-2200); consolidating after this._
