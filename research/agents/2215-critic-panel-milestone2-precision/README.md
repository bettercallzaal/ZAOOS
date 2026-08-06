---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2214, 2204, 928"
original-query: "After the multi-model code-review panel hit 100% of milestone 1 (run>1 family / vote / verify), re-audit and spec the next milestone."
tier: STANDARD
---

# 2215 - Critic Panel Milestone 2: Precision + Prove-Then-Enable

> **Goal:** Milestone 1 built the panel (run >1 family, vote, verify). Milestone 2
> makes it PRECISE enough to trust and PROVES it beats the single critic before it
> is ever turned on by default. Spec + build plan.

## Re-audit: where milestone 1 landed (100% of the stated gap)

The stated 60%->100% gap was "cross-family routing exists (1 reviewer) -> run >1 family,
vote, verify." All three shipped + verified:

| Piece | Status | Evidence |
|-------|--------|----------|
| Run >1 family (independent fan-out Claude+Codex+DeepSeek) | DONE | `runCriticPanel` PR #2891 |
| Vote (safety-biased min-gate, DeepSeek advisory, honest degradation) | DONE | `aggregatePanel` PR #2891 |
| Verify (code-aware adjudication on a straddling disagreement, default-FAIL) | DONE | `verifyDisagreement` PR #2892 |
| Opt-in, single path unchanged | DONE | `ZOE_CRITIC_PANEL`, `ZOE_CRITIC_PANEL_VERIFY` |
| Tested | DONE | panel 9 + verify 5 + existing 10; full suite 1867/1867 |

**What milestone 1 deliberately did NOT do** (and is therefore milestone 2): the panel
scores HOLISTICALLY (one 0-100 per family, not per-dimension), aggregates at the SCORE
level (not finding-level with an evidence-gate), runs on EVERY diff (no complexity gate),
and has NOT been validated against the single critic on real PRs - so it stays flag-OFF.

## Key Decisions (milestone 2)

| # | Decision | Why | Grounded in |
|---|----------|-----|-------------|
| 1 | **PROVE-THEN-ENABLE is the headline.** Run the panel in SHADOW on real Hermes PRs, compare to the single critic, and only flip default-ON when it wins. Nothing else in M2 matters if the panel isn't actually better. | Every production skeptic source: measure comment-action-rate / catch-rate before mandating; "usage != value." | doc 2214 (D); tianpan.co |
| 2 | **Per-dimension scoring** (correctness / security / tests / scope). Gate = min per-dimension across full-weight families. | Structured multi-dimensional scoring cuts self-preference bias ~31.5% vs holistic; and it tells us WHICH axis failed. | doc 2214 (A); arXiv 2604.22891 |
| 3 | **Finding-level output + evidence-gate.** Reviewers emit `findings:[{file:line, severity, claim}]`; drop any finding without a file:line; a finding raised by >=2 families = high-confidence, single-family = advisory. Verify then adjudicates the high-confidence findings, not just the pessimist's holistic concern. | Precision over recall; the >=2-family filter + evidence-gate are the false-positive defense the deep research names. | doc 2214 (E); magpie; anti-fabrication |
| 4 | **Complexity-gate the panel.** Only fan out for code diffs above a size/risk threshold; docs/one-liners stay single-critic. Reuse `classifyDiffComplexity` + the per-task complexity signal. | The panel is 2-3x the cost/latency; spend it only where it can catch something. | doc 2214 (#8); PR #2882 |
| 5 | **Cost + trigger telemetry.** Log per-family cost + the verify-trigger rate to the cache-aware cost-ledger, surfaced in `/budget`. | We must SEE what the panel costs vs the single critic to make the enable decision on #1. | PR #2883/#2884 (cost-ledger) |
| 6 | **(stretch) Promote DeepSeek to blocking on SECURITY findings only.** A cheap advisory voter stays advisory in general, but a security-category finding it raises is escalated to the verify pass rather than dropped. | Security is the highest-stakes miss; the cheap seat earning a real vote there is worth it. | doc 2214 (#3); security-specific review |

## Build plan (ordered, each a PR)

1. **Shadow-mode + eval harness** (unblocks #1). Add `ZOE_CRITIC_PANEL_SHADOW=1`: run BOTH
   the single critic (which still gates) AND the panel, log both verdicts + the delta to a
   JSONL, but let the single critic decide. Zero risk, pure measurement. Run it across the
   next N real Hermes PRs; record catch-rate, false-positive delta, latency, cost in doc 2214.
2. **Per-dimension scoring** (#2). New panel-mode critic prompt emitting per-dimension scores;
   `PanelReview.dims`; gate = min per-dimension across full-weight families. Keep `CritiqueOutput`
   `{score, feedback}` at the boundary (runner unchanged) - collapse dims->score internally.
3. **Finding-level + evidence-gate** (#3). Emit `findings[]`; dedupe by file:line+claim;
   >=2-family = high-confidence; drop no-evidence findings; route high-confidence findings to
   `verifyDisagreement` (generalize it from one concern to a finding list).
4. **Complexity gate** (#4). In `runCritic`, only enter the panel when `classifyDiffComplexity`
   is 'complex' (or a size threshold); simple diffs stay single-critic even with the flag on.
5. **Telemetry** (#5). `recordCall` per family + a `panel.verify_triggered` counter; a `/budget`
   line for panel cost + trigger rate.
6. **Enable decision** (#1 close): if the shadow eval shows the panel beats single-critic
   (more real blockers caught, no false-positive/latency blowup), flip default-ON; else keep it
   opt-in and record why (honest - a null result is a valid result).

## Guardrails carried from milestone 1 (do NOT regress)

- VOTE, never debate (independent reviewers; no rounds).
- Safety-biased: the pessimist among full-weight families gates; a cheap voter never
  false-fails a PR on its own.
- Verify is default-FAIL: it upholds a block unless it can prove a false positive with evidence.
- Honest degradation: <2 families = flagged degraded, never a silent confident pass.
- The panel is an EXTRA filter; tsc + tests + esbuild + human merge remain the gates of record.

## Also See

- [Doc 2214](../2214-multimodel-code-review-panel/) - the DEEP research + milestone-1 design (shipped PRs #2891, #2892).
- `bot/src/hermes/critic.ts` - `runCriticPanel`, `aggregatePanel`, `verifyDisagreement` (live).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build shadow-mode + eval harness (`ZOE_CRITIC_PANEL_SHADOW`); log panel-vs-single delta (PR merged) | Zaal | PR | 2026-08-13 |
| Per-dimension scoring in the panel (PR merged) | Zaal | PR | 2026-08-15 |
| Finding-level output + evidence-gate + finding-level verify (PR merged) | Zaal | PR | 2026-08-18 |
| Complexity-gate the panel + cost telemetry (PR merged) | Zaal | PR | 2026-08-20 |
| Run shadow eval on 5+ real Hermes PRs; record deltas in doc 2214; decide default-ON or keep opt-in | Zaal | decision | 2026-08-22 |

## Sources

- [Doc 2214](../2214-multimodel-code-review-panel/) [FULL] - DEEP research this milestone continues (18 fetched sources: PoLL, judge-bias, debate-vs-vote, production-reality).
- Live code read this session [FULL]: `bot/src/hermes/critic.ts` (panel + verify, PRs #2891/#2892), `bot/src/hermes/runner.ts`, `bot/src/hermes/types.ts`.
