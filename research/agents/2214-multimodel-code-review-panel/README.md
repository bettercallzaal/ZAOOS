---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2204, 928, 601"
original-query: "Multi-model / cross-family CODE REVIEW and code auditing - use different model families to review the same code/diff, surface differing opinions, and synthesize the best decision. Extend ZOE's existing cross-family critic pattern to the code-review/audit step."
tier: STANDARD
---

# 2214 - Multi-Model Code-Review Panel for ZOE (extend the cross-family critic to a jury)

> **Goal:** Turn ZOE's SINGLE code critic into a PANEL of disjoint model families that review the same diff independently, disagree, and get synthesized into one gated verdict - the PoLL ("panel of LLM evaluators") pattern applied to the Hermes fix-PR pipeline.

## Key Decisions (recommendations first)

| # | Decision | Why | Grounded in |
|---|----------|-----|-------------|
| 1 | **BUILD `runCritiquePanel()`: extend the single Hermes critic into a 2-3 family panel.** | A single critic has intra-model bias (a model favors output from its own family) and is a coin-flip on any one bug. A disjoint-family panel removes the bias and converges toward catching real bugs. | `bot/src/hermes/critic.ts:70` `runCritic`; PoLL paper; Ensemble |
| 2 | **Reviewers = the families ZOE ALREADY has wired: Claude (native) + Codex (when uncapped) + DeepSeek/OpenRouter.** No new deps - `runCritiqueModel` + `callCapFallback` already reach all three. | Three disjoint families available today; DeepSeek makes the extra votes nearly free. | `bot/src/zoe/critics/types.ts` (`runCritiqueModel`), `bot/src/zoe/models/router.ts` (`callCapFallback`) |
| 3 | **Aggregate for SAFETY, not averages: gate the PR on the MIN score + a "flagged by >=2 reviewers" finding filter.** A blocker any family sees fails the gate; a finding only one family sees is flagged for human, not auto-blocking. | Ensemble: "if only one flags it, it's noise; if all three flag it, look." Safety gate wants the pessimist, not the mean. | Ensemble; `runner.ts:195` (`score >= HERMES_PASS_THRESHOLD`) |
| 4 | **Add a code-aware VERIFY pass after the panel: read the actual files to filter false positives + recalibrate severity.** | Panels raise false positives; a tool-equipped verifier against real code is how magpie + ZOE's own rules kill fabricated findings. This is ZOE's existing `zao-evaluator` / default-FAIL evaluator, reused. | magpie; `loop-evals.md` (default-FAIL evaluator), `anti-fabrication.md` (rule 3) |
| 5 | **Degrade LOUD: <2 real families available = a DEGRADED single-reviewer run, reported as such - never a confident consensus from one voter.** | Same discipline as the cross-family critic (#2889) and quorate's "heuristic-only = WARN, never a confident green." | quorate; `silent-failure-guard.md`; cross-family critic (doc 2204 / PR #2889) |
| 6 | **Ship flag-gated (`ZOE_CRITIC_PANEL=1`), default OFF, additive.** Single-critic path stays the default until Zaal validates panel quality on real PRs. | Matches every ZOE upgrade this cycle (nudge, complexity routing). | `agent-loops.md` rule 8 |

## The one-line thesis

**There is no single "best" code reviewer model - so stop asking one.** PoLL's core
result: a panel of smaller, *disjoint-family* judges beats a single large judge, with
LESS bias and ~7-8x LESS cost. ZOE's Hermes pipeline currently asks exactly one critic;
the upgrade is to convene 2-3 and synthesize.

## What ZOE has TODAY (ground truth, not aspiration)

The Hermes fix-PR pipeline already has a real code-review step - it is a SINGLE critic:

- `bot/src/hermes/runner.ts:180` runs `runCritic(...)` -> a `critique` with `score` (0-100)
  + `feedback`.
- `bot/src/hermes/runner.ts:195`: `if (critique.score >= HERMES_PASS_THRESHOLD)` (70) it
  opens the PR; else it retries the coder (max 3 attempts).
- `runCritic` (`bot/src/hermes/critic.ts:70`) calls `runCritiqueModel`
  (`bot/src/zoe/critics/types.ts`), which - as of PR #2889 - is already CROSS-FAMILY for
  ONE reviewer: it tries Codex, then OpenRouter/DeepSeek, then same-family Claude, flagging
  `reviewerFamily: 'cross' | 'same'`.

So the last mile is already 60% built: cross-family routing exists; what's missing is
running MORE THAN ONE family and aggregating. This is a "wire the last 10%", not a new
system (`agent-loops.md` rule 3).

## What the field does (5 shipping tools + the paper) - findings

| Source | Panel design | Aggregation | Verify step | Takeaway for ZOE |
|--------|-------------|-------------|-------------|------------------|
| **PoLL paper** (Cohere, 2024) | 3 judges from disjoint families (Command R + Haiku + GPT-3.5) | max-vote (binary) or average-pool (scores) | - | Disjoint families cut intra-model bias; 7-8x cheaper than one GPT-4 judge; std-dev 2.2 (PoLL) vs 6.1 (GPT-3.5 alone). "No single best judge." |
| **Ensemble** (ensemblecode.dev) | 3 independent reviewers, no shared context; Senior/Security/Architecture lenses; Claude + GPT-4o | consensus: 1-flag = noise, all-flag = look | - | "One run 40% catch, three 82%, five 96%." Adversarial quality GATE, not a reviewer. |
| **magi (opencode-magi)** | multiple models, "three wise men," per-role models (gpt/claude/kimi) | odd-number MAJORITY vote before requesting changes | - | Only post findings the majority accepts. |
| **quorate** | council of local CLIs (`claude`, `codex`, `qwen`, `kimi`) + heuristic | dedupe + rank -> ONE verdict PASS/WARN/FAIL, file:line evidence | heuristic layer | **Honest-by-default: a run with no real reviewer = "degraded", downgraded to WARN, never a confident green.** |
| **magpie** | multi-AI *adversarial*: independent round 1, DEBATE round 2+, convergence detection; claude-code + codex-cli + gemini-cli | consensus after debate | **code-aware verifier reads actual files to filter false positives + recalibrate severity** | The verify+audit step is the false-positive killer. |
| **prpilot-review** | 3 independent reviewers + 1 JUDGE model | judge synthesizes consensus | - | A dedicated judge-of-judges is a valid aggregator. |
| **PR-Agent** (Qodo, OSS) | single LLM call per tool; many models via LiteLLM | n/a (not ensemble by default) | - | Multi-model is config-cheap (LiteLLM reaches OpenRouter/Ollama), but single-model unless you build the panel. |

**Convergent design across all of them:** (1) reviewers run INDEPENDENT first (no shared
context, no execution-order advantage); (2) an explicit AGGREGATOR (vote / judge / dedupe);
(3) the best ones add a VERIFY-against-real-code pass; (4) honest DEGRADATION when the panel
can't be assembled.

## The concrete ZOE build (design, build-ready)

A new `runCritiquePanel()` alongside `runCritiqueModel` in `bot/src/zoe/critics/types.ts`,
called by `runCritic` when `ZOE_CRITIC_PANEL=1`:

1. **Fan out (independent).** Build the reviewer set from available families -
   `[claudeReview(), codexReview()?, openRouterReview()?]` - and run them with
   `Promise.allSettled` (fault-tolerant, same as ZOE's `Promise.allSettled` convention).
   Each gets the SAME diff + critic prompt, no shared context. Reuse the existing
   family callers (`callClaudeCli`, `callCodexCli`, `callCapFallback`).
2. **Parse each** into `{ family, score, findings:[{file:line, severity, claim}] }` with the
   existing tolerant `parseCritiqueJson`.
3. **Aggregate (safety-biased).**
   - **Gate score = MIN across reviewers** (the pessimist gates; one family seeing a blocker
     fails). Also record the spread - a wide disagreement is itself a signal to surface.
   - **Findings: keep those flagged by >=2 families as HIGH-CONFIDENCE; single-family findings
     are LOW-CONFIDENCE -> surfaced for human, never auto-blocking** (Ensemble's rule).
4. **Verify pass (reuse, don't rebuild).** Route the HIGH-CONFIDENCE findings to the existing
   fresh-context evaluator (`zao-evaluator` / `loop-evals.md` default-FAIL) to read the real
   file:line and confirm/kill each - this is magpie's verify+audit, which ZOE already has as
   a rule and an agent.
5. **Verdict + honesty.** Return `{ score, verdict: pass|warn|fail, reviewers:[family...],
   degraded: reviewers<2 }`. `runner.ts` gates on the verdict. If `degraded`, it is a WARN /
   single-reviewer note, never a confident consensus (quorate's rule; ZOE `silent-failure-guard`).

**Cost:** the extra votes are cheap - DeepSeek via OpenRouter is ~$0.0004/review and Codex is
flat-rate; the panel is 2-3x a single critic's tokens, and PoLL shows small-model panels beat
a single big judge, so there is no need to use opus for every seat.

**Reuse ledger (code-restraint):** panel fan-out reuses `runCritiqueModel`'s family callers;
aggregation is ~40 lines of plain TS; the verify step reuses `zao-evaluator`; the honesty rule
reuses the cross-family `reviewerFamily`/degraded pattern. Net-new surface is small.

## Risks + the honest caveats

- **False positives multiply with reviewers.** Three models produce three findings lists; without
  the verify pass (#4) you flood the PR with noise. The verify-against-real-code step is NOT
  optional - it is the reason magpie works and naive panels don't.
- **Latency.** Fan-out is parallel, so wall-clock ~= the slowest reviewer, not the sum - but a
  capped/slow family (Codex retry) can stall; cap each reviewer (the critic already time-boxes).
- **Disagreement needs a decision, not a punt.** "Reviewers disagree" must resolve to a concrete
  verdict (MIN-score gate + evidence-verified findings), or it just moves the judgment call to a
  human every time. The safety-biased aggregation (#3) is that decision rule.
- **Not every task needs the panel.** A one-line doc fix does not need three reviewers. Gate the
  panel to code diffs above a size/risk threshold (tie to the per-task complexity signal, doc/PR
  #2882) so cheap changes stay single-critic.

## Also See

- [Doc 2204](../2204-*/) - the cross-family critic pattern (99darwin/orchestrator via nickysap) this extends; single-reviewer version shipped PR #2889.
- [Doc 928](../928-agent-loop-best-practices/) - agent loop rules (read-live-code, verify subagent claims).
- `.claude/rules/loop-evals.md` - the default-FAIL fresh-context evaluator = the verify pass (#4).
- `.claude/rules/anti-fabrication.md` - findings carry evidence or are UNVERIFIED (rule 2/3).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `runCritiquePanel()` in `bot/src/zoe/critics/types.ts` + gate `runner.ts` on the panel verdict behind `ZOE_CRITIC_PANEL=1` (PR merged, tsc+suite green) | Zaal | PR | 2026-08-13 |
| Wire the verify pass to `zao-evaluator` for high-confidence findings (PR merged) | Zaal | PR | 2026-08-13 |
| Validate panel vs single-critic on 5 real Hermes PRs, record catch-rate + false-positive delta in this doc | Zaal | eval | 2026-08-20 |
| Decide default-ON only after the eval shows the panel beats single-critic without a noise blowup | Zaal | decision | 2026-08-20 |

## Sources

- [Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models (arXiv 2404.18796, Cohere, Verga et al., 2024)](https://arxiv.org/abs/2404.18796) [FULL] - PoLL; disjoint-family panel beats single judge, -bias, 7-8x cheaper; verified 200.
- [Ensemble - AI Code Review That Catches Drift](https://ensemblecode.dev/) [FULL] - 3 independent lenses, consensus, 40/82/96% catch rates, multi-model Claude+GPT-4o.
- [magi-ai/opencode-magi (GitHub)](https://github.com/magi-ai/opencode-magi) [FULL] - multi-model PR review, odd-number majority vote, per-role models.
- [UmutKorkmaz/quorate (GitHub)](https://github.com/UmutKorkmaz/quorate) [FULL] - council of local CLIs -> one PASS/WARN/FAIL verdict; honest "degraded" downgrade.
- [liliu-z/magpie (GitHub)](https://github.com/liliu-z/magpie) [FULL] - adversarial multi-AI review + debate + code-aware verify/audit against real files.
- [bishalprasad321/prpilot-review (GitHub)](https://github.com/bishalprasad321/prpilot-review) [FULL] - 3 reviewers + 1 judge consensus.
- [the-pr-agent/pr-agent (Qodo, GitHub)](https://github.com/the-pr-agent/pr-agent) [FULL] - OSS PR reviewer, many models via LiteLLM (single-model by default).
- ZOE live code: `bot/src/hermes/runner.ts` (critic gate), `bot/src/hermes/critic.ts` (`runCritic`), `bot/src/zoe/critics/types.ts` (`runCritiqueModel`, cross-family, PR #2889), `bot/src/zoe/models/router.ts` (`callCapFallback`) [FULL] - read this session.
