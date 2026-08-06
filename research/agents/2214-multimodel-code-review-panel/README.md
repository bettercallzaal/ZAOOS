---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2204, 928, 601, 2127"
original-query: "Multi-model / cross-family CODE REVIEW and code auditing - use different model families to review the same code/diff, surface differing opinions, and synthesize the best decision. Extend ZOE's existing cross-family critic pattern to the code-review/audit step. Deep-research it since this step is critical for ZOE."
tier: DEEP
---

# 2214 - Multi-Model Code-Review Panel for ZOE (extend the cross-family critic to a jury)

> **Goal:** Turn ZOE's SINGLE code critic into a PANEL of disjoint model families that review the same diff, then synthesize into one gated verdict - grounded in the deep literature on LLM juries, judge bias, and multi-agent debate, and honest about where AI review actually fails.

## Key Decisions (recommendations first)

| # | Decision | Why (deep-research verdict) | Grounded in |
|---|----------|------------------------------|-------------|
| 1 | **BUILD a code-review PANEL, but VOTE - do NOT debate.** Reviewers review INDEPENDENTLY (no shared context), then aggregate. No debate rounds. | The strongest deep finding: multi-agent DEBATE does not reliably beat simple majority VOTE, and can make things WORSE (conformity, sycophancy, "debate hacking"). Majority voting accounts for most of the gains people attribute to debate. | Debate-or-Vote (NeurIPS'25); "Talk Isn't Always Cheap" (2509.05396); "When/Why MAD Fails" (2510.20963) |
| 2 | **Cross-family is the correct lever - and it's EMPIRICALLY the whole point.** Panel = disjoint families (Claude + Codex + DeepSeek/OpenRouter), all already wired. | Judge bias is measured: models favor their own outputs AND their own FAMILY's outputs ("family-bias"). A Claude critic on Claude-written code is structurally biased; a different family removes it. | "Play Favorites" (2508.06709); PoLL (2404.18796); `bot/src/zoe/critics/types.ts` |
| 3 | **A cheap model (DeepSeek) as an independent VOTER is fine - but weight it, don't give it equal blocking authority.** | Nuance the deep research forces: uncorrelated errors average out in INDEPENDENT ensembles (a weaker voter can still add signal), but a weaker model actively HARMS a DEBATE. Since we vote (not debate), DeepSeek is a useful low-cost seat - as an advisory vote, not a sole blocker. | 2509.05396 (weak harms debate); panel-composition scan (weak helps ensembles - see caveats) |
| 4 | **Score per-DIMENSION, not one holistic number.** Each reviewer scores correctness / security / tests / architecture separately. | Structured multi-dimensional (forced-choice per dimension) scoring reduces self-preference bias ~31.5% vs a single holistic score, because one stylistic cue can't inflate the whole verdict. | SPB paper (2604.22891) |
| 5 | **The VERIFY-against-real-code pass is NON-NEGOTIABLE.** After the panel, a tool-equipped verifier reads the actual files to confirm findings, kill false positives, and recalibrate severity. Reuse `zao-evaluator`. | Real AI-review false-positive rates run 5-15% with codebase context and up to ~80% on "subtle bug" claims without it. Without verify, three models just triple the noise. | magpie; Jacar (80% FP); tianpan.co (5-15%); `loop-evals.md`, `anti-fabrication.md` |
| 6 | **AGGREGATE to ONE verdict - never dump N comment-sets. Gate on high-confidence (>=2 families agree); a single-family finding is advisory, not blocking. Precision over recall.** | "One well-tuned tool beats three overlapping bots" - for HUMANS, multi-bot noise trains inattention. ZOE's structural ADVANTAGE: it gates an autonomous builder, so it can aggregate to a verdict instead of flooding a human. Keep that advantage. | Jacar; Umur Inan; tianpan.co; Ensemble |
| 7 | **Treat the panel as an ADDITIONAL FILTER, never the gate of record.** ZOE's real gates stay tsc + tests + esbuild + human merge. The panel improves the critic step; it does not replace ground truth. | Honest ceiling: even a full AI reviewer caught ~7% of a human's logic-bug rate at ~40x the comment volume (one 3-month real log). AI review is a floor, not a ceiling. | Umur Inan; Cadence; `loop-evals.md` |
| 8 | **Ship flag-gated (`ZOE_CRITIC_PANEL=1`), default OFF; validate on real PRs before default-ON.** | Same discipline as every ZOE upgrade this cycle. Measure comment-action-rate / catch-rate before trusting. | `agent-loops.md` rule 8; tianpan.co (measure before mandate) |

## The one-sentence thesis (updated by the deep dive)

**Use a panel of disjoint families that VOTE independently, score per-dimension, and get
their findings verified against the real code - as an extra filter on top of ZOE's real
gates, never as a trust-me verdict.** The naive version ("run 3 models, let them argue,
trust the result") is exactly what the literature says fails.

## What ZOE has TODAY (ground truth)

The Hermes fix-PR pipeline already has a real, single-critic review step:

- `bot/src/hermes/runner.ts:180` runs `runCritic(...)` -> `{score (0-100), feedback}`.
- `bot/src/hermes/runner.ts:195`: `if (critique.score >= HERMES_PASS_THRESHOLD)` (70) it opens
  the PR; else it retries the coder (max 3 attempts).
- `runCritic` (`bot/src/hermes/critic.ts:70`) calls `runCritiqueModel`
  (`bot/src/zoe/critics/types.ts`), which is now CROSS-FAMILY for ONE reviewer (PR #2889):
  Codex -> OpenRouter/DeepSeek -> same-family Claude, flagging `reviewerFamily: 'cross'|'same'`.

So single-reviewer cross-family routing already exists. The panel is: run >1 family, vote,
verify. ~60% is built; this is a "wire the last 10%" (`agent-loops.md` rule 3).

## Deep findings

### A. Judge bias is real and MEASURED - this is why cross-family matters

- **Self-preference bias (SPB):** models rate their own outputs higher even controlling for
  quality. GPT-4 shows the highest SPB in a pairwise study of 8 models; the mechanism is
  *familiarity/perplexity* - a model over-rates text it would itself likely generate (2410.21819).
- **Family-bias (the killer point):** a >5000-pair, 9-judge study finds GPT-4o and Claude 3.5
  Sonnet not only self-favor but "systematically assign higher ratings to outputs produced by
  other models of the SAME FAMILY" (2508.06709). => A Claude critic reviewing Claude-written
  code is biased toward it; a *different family* is the fix. This is the empirical backbone of
  the whole idea.
- **Mitigation:** structured multi-dimensional (per-dimension forced-choice) scoring cuts SPB
  ~31.5% on average vs holistic pointwise scoring (2604.22891) - hence Decision #4.

### B. VOTE, don't DEBATE (the finding that changed the design)

- **"Debate or Vote" (NeurIPS 2025, deeplearning-wisc/debate-or-vote):** across 7 benchmarks,
  *majority voting alone accounts for most of the performance gains* usually attributed to
  multi-agent debate; theoretically, homogeneous debate is a martingale - expected correctness
  is unchanged by debate. "Simple ensembling methods remain strong and more reliable."
- **"Talk Isn't Always Cheap" (2509.05396):** debate can DECREASE accuracy over rounds; models
  "shift from correct to incorrect in response to peer reasoning, favoring agreement over
  challenging flawed reasoning." Critically: **adding a weaker agent to a debate degrades the
  stronger agent** - heterogeneous groups "converge on wrong answers together."
- **"When and Why MAD Fails" (2510.20963):** vanilla debate suffers "debate hacking" -
  consensus-seeking filters out informative disagreements; competitive debate becomes
  persuasion. Vanilla MAD underperforms single-agent.
- **Verdict for ZOE:** independent review + aggregate. No debate rounds in the gate. (magpie's
  debate mode is interesting but is exactly the risky path; if ever used, only a *collaborative*
  truth-seeking protocol with verification - out of scope for v1.)

### C. Panel composition (directional - some numbers UNVERIFIED)

- PoLL uses 3 judges from disjoint families (Command R + Haiku + GPT-3.5); ~7-8x cheaper than a
  single GPT-4 judge; lower score variance (std-dev 2.2) [FULL, PoLL].
- A parallel subagent scan reported "logarithmic gains with panel size, 3-5 optimal" and
  "weaker models can help independent ensembles" with specific correlation/percentage figures.
  **Those exact numbers are UNVERIFIED** (cited to search-result pages, not fetched papers) and
  are NOT relied on here - only the DIRECTION is kept, and it is consistent with A/B: in an
  INDEPENDENT ensemble uncorrelated errors average out, which is the opposite regime from debate.
- Practical call: **3 seats** (Claude + Codex + DeepSeek), parallel so latency ~= slowest seat.

### D. Production reality - the honest, sobering half (skeptic sources)

The vendor tools (Ensemble, magi, quorate, prpilot) are bullish; practitioners are not, and
ZOE must hear both:

- **"AI Code Review Is Mostly Noise" (Umur Inan, 2026-05):** a 3-month real review-queue log -
  of ~3,500 bot comments, **~80 (2.3%) led to a real change**; ~1,100 wrong, ~1,700 nitpicks,
  ~620 correct-but-immaterial. Human reviewers flagged **28 logic bugs** in the same period;
  the bot's logic-bug hit rate was "roughly 7% of a competent human reviewer's, while producing
  40x the comment volume." What AI *can't* catch: business logic, cross-file races, perf-at-scale,
  trust-context security, architectural drift, bugs-in-the-test, version-bump semantics.
- **"AI Code Review at Scale" (tianpan.co, 2026-04):** FP rates 5-15% (TS REST 3-5%, Java legacy
  6-12%); "noise trains inattention"; comment-action-rate <40% is the leading indicator of
  abandonment; tools WITHOUT codebase context miss relevance on ~54% of comments vs ~16% WITH
  context; precision > recall; run non-blocking + early.
- **Jacar (honest adoption):** subtle-bug false positives ≈80%; two rules that mattered most -
  do NOT block merges on AI comments, and **"one well-configured tool beats three overlapping
  bots"** (multiple bots overlap, contradict, raise cognitive load).
- **Cadence (2026-05):** AI pass is "a floor, not a ceiling"; ~45% of AI-generated code carries
  some security flaw, XSS ~2.74x human rate; AI summaries can worsen rubber-stamping (theatre).

**How ZOE escapes the practitioner critique:** every negative above is about dumping noisy
comments on a HUMAN. ZOE's critic gates an AUTONOMOUS builder and can AGGREGATE to one
verdict - so it keeps the panel's bias-reduction while sidestepping human alert-fatigue,
*provided* it aggregates + verifies (Decisions #5, #6) rather than posting three comment sets.

### E. False-positive control (the verify pass, corroborated)

magpie's "verify+audit" (a tool-equipped verifier reads real files to filter false positives,
by-design patterns, and pre-existing issues, then recalibrates severity) + quorate's honest
"degraded -> WARN, never a confident green" + an evidence-gate ("no finding without a
file:line + quote") are the convergent FP defenses. ZOE already has all three as rules
(`anti-fabrication.md`) and as an agent (`zao-evaluator`) - reuse, don't rebuild.

## The concrete ZOE build (design, build-ready, updated)

`runCritiquePanel()` alongside `runCritiqueModel` in `bot/src/zoe/critics/types.ts`, used by
`runCritic` when `ZOE_CRITIC_PANEL=1`:

1. **Fan out INDEPENDENTLY.** `Promise.allSettled([claudeReview(), codexReview()?, openRouterReview()?])`
   - same diff + per-dimension critic prompt, no shared context, no debate. Reuse the family
   callers already wired (`callClaudeCli`, `callCodexCli`, `callCapFallback`).
2. **Parse each** into `{ family, dims:{correctness,security,tests,arch}, findings:[{file:line, severity, claim, evidence}] }`.
3. **Aggregate (safety-biased, weighted).**
   - Gate score = weighted min across families (Claude/Codex full weight; DeepSeek advisory);
     record the SPREAD (wide disagreement is itself surfaced).
   - Findings flagged by >=2 families = HIGH-confidence (candidate blockers); single-family =
     LOW-confidence -> advisory, never auto-blocks.
4. **VERIFY (reuse `zao-evaluator`).** Route HIGH-confidence findings to the fresh-context,
   no-write evaluator to read the real file:line and confirm/kill each (magpie's verify+audit;
   `loop-evals.md` default-FAIL). Only verified blockers fail the gate.
5. **Verdict + honesty.** Return `{ score, verdict: pass|warn|fail, reviewers:[...], degraded: reviewers<2 }`.
   `runner.ts` gates on the verdict. `degraded` (only one real family) = WARN/single-reviewer note,
   never a confident consensus (quorate; `silent-failure-guard`).
6. **Stays an EXTRA filter.** The PR still requires tsc + tests + esbuild green + human merge.
   The panel raises critic quality; it is not the gate of record.

**Cost/latency:** parallel fan-out -> wall-clock ~= slowest seat; DeepSeek ~$0.0004/review,
Codex flat-rate, so the panel is ~2-3x a single critic's tokens - cheap, and per-dimension
prompts keep each seat focused.

**Reuse ledger (code-restraint):** fan-out reuses `runCritiqueModel`'s callers; aggregation is
~50 lines of plain TS; verify reuses `zao-evaluator`; honesty reuses the `reviewerFamily`/degraded
pattern from PR #2889. Net-new surface is small.

## Risks + honest caveats

- **False positives multiply without the verify pass** (D/E) - #5 is mandatory, not optional.
- **Don't let a cheap voter block on its own** (#3) - weight it; a lone DeepSeek "fail" is advisory.
- **No debate** (B) - independent + vote; debate risks conformity and can lower accuracy.
- **The ceiling is low** (#7) - a panel catches a fraction of real logic bugs; it never replaces
  tests + human judgment on business logic, architecture, security-with-trust-context.
- **Measure before mandate** - track catch-rate + false-positive-delta on real PRs; default-ON
  only when the panel beats the single critic without a noise blowup.
- **Scope by complexity** - a doc/one-liner does not need 3 reviewers; gate the panel to code
  diffs above a size/risk threshold (reuse the per-task complexity signal, PR #2882).

## Also See

- [Doc 2204](../2204-*/) - the cross-family critic pattern (99darwin/orchestrator via nickysap); single-reviewer version shipped PR #2889.
- [Doc 2127](../2127-*/) / [Doc 928](../928-agent-loop-best-practices/) - loop-harness engineering; march-of-nines (each un-gated step compounds error).
- `.claude/rules/loop-evals.md` - default-FAIL fresh-context evaluator = the verify pass (#5).
- `.claude/rules/anti-fabrication.md` - findings carry evidence or are UNVERIFIED (the evidence-gate).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `runCritiquePanel()` (independent fan-out + weighted safety aggregation + per-dimension scoring) behind `ZOE_CRITIC_PANEL=1`; gate `runner.ts` on the verdict (PR merged, tsc+suite green) | Zaal | PR | 2026-08-13 |
| Wire the verify pass to `zao-evaluator` for high-confidence findings; enforce evidence-gate (file:line+quote or drop) (PR merged) | Zaal | PR | 2026-08-13 |
| Run panel vs single-critic on 5 real Hermes PRs; record catch-rate + false-positive delta + comment-action-rate in this doc | Zaal | eval | 2026-08-20 |
| Decide default-ON only if the panel beats single-critic without a noise blowup; else keep single cross-family critic | Zaal | decision | 2026-08-22 |

## Sources

Grounded (fetched + read this run, FULL unless noted):

- [Replacing Judges with Juries / Panel of LLM evaluators (PoLL) - arXiv 2404.18796, Cohere](https://arxiv.org/abs/2404.18796) [FULL] - disjoint-family panel beats single judge; 7-8x cheaper; std-dev 2.2; "no single best judge."
- [Play Favorites: Measuring Self-Bias in LLM-as-a-Judge - arXiv 2508.06709](https://arxiv.org/abs/2508.06709) [FULL] - >5000 pairs, 9 judges; GPT-4o + Claude 3.5 Sonnet show self-bias AND family-bias; verified 200.
- [Self-Preference Bias in LLM-as-a-Judge - arXiv 2410.21819](https://arxiv.org/abs/2410.21819) [FULL] - GPT-4 highest self-preference; cause = perplexity/familiarity; verified 200.
- [Quantifying and Mitigating Self-Preference Bias of LLM Judges - arXiv 2604.22891](https://arxiv.org/abs/2604.22891) [FULL] - structured multi-dimensional scoring cuts SPB ~31.5%.
- [Beyond the Surface: Measuring Self-Preference (DBG score) - ACL 2025.emnlp-main.86](https://aclanthology.org/2025.emnlp-main.86/) [FULL].
- [Debate or Vote: Which Yields Better Decisions in Multi-Agent LLMs? - NeurIPS 2025](https://proceedings.neurips.cc/paper_files/paper/2025/file/934252acd87f254d5d4672fbde283bd2-Paper-Conference.pdf) [FULL] - majority vote does most of the work; debate = martingale. Repo `deeplearning-wisc/debate-or-vote` verified 200.
- [Talk Isn't Always Cheap: Failure Modes in Multi-Agent Debate - arXiv 2509.05396](https://arxiv.org/abs/2509.05396) [FULL] - debate can lower accuracy; a weaker agent harms the stronger; verified 200.
- [When and Why Does Multi-Agent Debate Fail - arXiv 2510.20963](https://arxiv.org/html/2510.20963v2) [FULL] - debate hacking; vanilla MAD underperforms single-agent.
- [Demystifying Multi-Agent Debate: Confidence and Diversity - ACL 2026 findings 1694](https://aclanthology.org/2026.findings-acl.1694/) [FULL] - vanilla MAD underperforms majority vote; needs diversity + calibrated confidence.
- [AI Code Review Is Mostly Noise - Umur Inan, 2026-05](https://umurinan.com/pages/posts/ai-code-review-is-mostly-noise.html) [FULL] - 2.3% comment-action rate; bot ~7% of human logic-bug catch at 40x volume.
- [AI Code Review at Scale: the False-Positive Trap - tianpan.co, 2026-04](https://tianpan.co/blog/2026-04-17-ai-code-review-at-scale-false-positive-trap) [FULL] - FP 5-15%; context 54%->16% relevance miss; precision>recall; non-blocking.
- [AI-assisted code review: an honest adoption story - Jacar](https://jacar.es/en/ai-assisted-code-review-an-honest-adoption-story/) [FULL] - ≈80% subtle-bug FP; "one tool beats three bots"; don't block merges.
- [AI-assisted code review without losing rigor - Cadence, 2026-05](https://cadence.withremote.ai/blog/ai-assisted-code-review) [FULL] - floor not ceiling; Greptile 82% vs CodeRabbit 44% test-issue catch; rubber-stamp risk.
- [AI Code Review: Is Automation Worth It? - Fordel Studios, 2026-04](https://fordelstudios.com/research/ai-code-review-automation-worth-it) [FULL] - tune to >40% acceptance; noise at defaults.
- Tools (FULL, from the STANDARD pass + subagent corroboration): [Ensemble](https://ensemblecode.dev/), [magi-ai/opencode-magi](https://github.com/magi-ai/opencode-magi), [UmutKorkmaz/quorate](https://github.com/UmutKorkmaz/quorate), [liliu-z/magpie](https://github.com/liliu-z/magpie), [prpilot-review](https://github.com/bishalprasad321/prpilot-review), [PR-Agent/Qodo](https://github.com/the-pr-agent/pr-agent).
- ZOE live code [FULL, read this session]: `bot/src/hermes/runner.ts`, `bot/src/hermes/critic.ts`, `bot/src/zoe/critics/types.ts` (cross-family, PR #2889), `bot/src/zoe/models/router.ts`.

Subagent-sourced, treated cautiously (resolves 200 but claim not independently re-read): RoPoLL (arXiv 2406.09301, panel robustness follow-up); Benjaminfranck/cyber-security-plugin (evidence-gate + adversarial-refutation + >=0.8 confidence). Their SPECIFIC numbers (panel-size logarithms, 0.92 vs 0.716 correlation, +47.3% secure-code) are marked UNVERIFIED and not relied upon - only directions consistent with the FULL sources above are kept.

Method note: the built-in WebSearch budget for this session was exhausted; 3 of 5 research subagents correctly returned BLOCKED rather than fabricate (per `research-grounding.md`). The DEEP grounding was gathered by the orchestrator directly via exa fetches ("cheaper than a scout: fetch it yourself") plus the 2 subagents that reached real pages; every load-bearing citation was spot-checked (HTTP 200) and bias/debate claims trace to fetched papers.
