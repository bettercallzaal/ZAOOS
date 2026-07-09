---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: 928, 994, 997, 998, 759, 070
original-query: "research with many agents, do some subagent research and optimize that, then learn how to add that to the loops"
tier: DEEP
---

# 1004 - Multi-Agent Research Playbook (and how to wire it into the ZAO loops)

> **Goal:** The optimized pattern for doing research with many subagents - decompose, verify, synthesize - and the concrete plan to bake it into the ZAO loops (fixing the ZOE research-pipeline leak from doc 998/estate). Built by fanning out 4 research subagents (dogfooding the pattern).

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Fan out or stay single? | **Fan out ONLY when subtasks are independent + read-heavy + latency matters. Stay single-agent when coupled + stateful.** | The Cognition "don't build multi-agent" vs Anthropic "big win" fight resolved to the SAME answer: naive parallelism fails, orchestrated fan-out on independent work wins. |
| 2 | How many subagents? | **Orchestrator + 2-4 scoped subagents. Not 10+.** Anthropic caps at 20; the useful default is 2-4. | Coordination + merge cost grows fast; >5 rarely pays. Specialize by domain, not count. |
| 3 | The lead's job | **The orchestrator COORDINATES + SYNTHESIZES - it does not do primary research.** | Anthropic's explicit rule. The lead decomposes, dispatches, dedups, flags contradictions, writes the synthesis. |
| 4 | Subagent output | **Structured JSON schema, NOT prose.** 8-15 fields, validated. | Cuts merge cost ~80%, surfaces contradictions by type-mismatch, kills false-consensus. The single highest-ROI change. |
| 5 | Avoid redundant work | **Divide-by-source at dispatch** (each subagent owns a distinct source/dimension), then **dedup-by-key** on merge. | Without it, 5 agents fetch the same Anthropic blog + GitHub trending = 5x cost, 0 marginal value. |
| 6 | Verification (the trust layer) | **Consensus is NOT verification.** Add adversarial-refute + perspective-diverse lens judges + an EXTERNAL-source gate + claim-status tags. | Polling N models fails because their errors correlate. External grounding + refutation is what actually cuts error. This is the fix for the fabrication/leak problem. |
| 7 | Cost control | **Model-tier (cheap finders, strong synthesis/verify), hard budget cap per run, structured-output dedup.** | Runaway multi-agent loops hit $6k-$47k in the wild. Caps are non-negotiable. |
| 8 | Wire into the ZAO loops | **Apply this to the ZOE research pipeline: structured outputs + verify-gate + auto-land-or-flag.** | Closes the doc-998 leak (failed tasks silent, unmerged PRs, fabrication risk). See Part 5. |

## Findings

> Provenance note: built by 4 parallel research subagents (Anthropic system, subagent economics, verification patterns, decomposition/failure modes). Several precise stats came from single secondary blogs or future-dated preprints and are marked illustrative; the behavior-changing patterns are corroborated across Anthropic's own posts + multiple sources.

### Part 1 - The optimized multi-agent research pattern
Anthropic's orchestrator-worker system is the canonical reference: a lead agent classifies the query (depth-first / breadth-first / straightforward), dynamically decomposes it, spawns workers via parallel tool calls, and synthesizes - the lead does NOT do primary research. Their published guardrails: max ~20 subagents; subagent budget ~5-15 tool calls (max 20, ~100 sources); subagents must flag speculation/source-quality rather than assert. Anthropic reported their multi-agent (Opus lead + Sonnet workers) beat single-agent Opus by ~90% on their internal research eval [PARTIAL - from the multi-agent-research-system post; they did NOT publish token-cost or a general eval-% in the effective-agents essay]. A recurring Anthropic insight: a **deterministic retrieval layer makes model choice matter far less** and kills run-to-run variance (same query 3x returned 106/15/5 results without tools; >90% consistently with tools).

### Part 2 - The decision rule (fan out or not)
- **Fan out** when: breadth-heavy, subtasks genuinely independent (no cross-dependency), read-only/light-output, wall-clock latency matters.
- **Stay single** when: depth-heavy, stateful edits across coupled files, frequent coordinator sign-off, task B needs A's output, hard token cap.
- **Default:** orchestrator + 2-4 domain-scoped subagents. Token overhead runs ~3x (simple) to 100x (complex 200-step) - so the cap + the "is this actually independent?" check gate every fan-out.

### Part 3 - The verification recipe (the trust layer)
The most important finding: **consensus is not verification.** Polling N models does not reliably improve accuracy because model errors are strongly correlated ("models are better at predicting what other models will say than at identifying what is true"). What actually cuts error is EXTERNAL grounding + refutation. Recommended recipe per load-bearing claim:
1. **Adversarial refute** - 1-3 skeptics prompted to REFUTE the claim with counter-evidence; default to refuted if uncertain.
2. **Perspective-diverse lens judges** (better than N identical judges) - e.g. correctness / source-integrity / reproducibility. Use a judge model from a different family than the generator to dodge self-preference bias; swap order to dodge position bias; binary pass/fail before numeric scores.
3. **External gate** - the claim must survive an external source check (fetch the real page, verify the citation exists and contains the claim). This is the ZAO fetch-quality-gate made mechanical.
4. **Claim-status tags** - every claim marked `[VERIFIED-EXTERNAL] / [VERIFIED-INTERNAL] / [UNVERIFIED] / [CONTRADICTED]`. Never average a contradiction - flag it.
Combined, sources report ~60-80% error reduction vs a single-pass agent [PARTIAL - figure from secondary blogs, treat as directional]. Citation-fabrication is real and large (reported 55% of GPT-3.5 / 18% of GPT-4 citations fabricated) - which is exactly the risk in our thin-fetch research docs.

### Part 4 - Failure modes + cheap mitigations (grounded in our own docs 547/759/600)
| Failure | Symptom | Cheap fix |
|---------|---------|-----------|
| **Stale state** | subagent reads context at t=0, shared state changes at t=5, output is outdated | snapshot inputs at dispatch; immutable task context |
| **Coordination overhead** | merging 5 prose briefs costs more than one agent would | 2-4 agents max; structured JSON output; no-debate rule (take highest-confidence, don't reconcile prose) |
| **Redundant work** | all agents fetch the same sources | divide-by-source at dispatch + dedup-by-key on merge |
| **Silent partial failure** | a subagent dies, its slice is missing, task declared done anyway | `Promise.allSettled` + explicit reject check; per-agent timeout; watch OUTPUT not process (rule 9/16) |
| **False consensus / conflicting conclusions** | A says "ready", B says "broken", synthesis says "mixed" | structured confidence; flag contradictions (don't merge); trust-boundary/injection guards at the agent boundary |

### Part 5 - HOW TO WIRE THIS INTO THE ZAO LOOPS (the payload)
This is the fix for the doc-998/estate ZOE-research-pipeline leak (failed tasks silent, PRs unmerged, proactive research ephemeral, fabrication risk). Concrete changes:

1. **ZOE research worker -> structured output + verify-gate.** Today ZOE's research-worker returns prose and ships (or fails silently). Change it to: worker returns a JSON schema (findings + per-claim source + confidence); a cheap Haiku verify-pass marks each claim's status and runs the external-source gate; only `[VERIFIED-*]` claims ship, `[UNVERIFIED]/[CONTRADICTED]` get flagged in the doc. Enforces the existing `feedback_no_synthesis_from_titles` rule mechanically.
2. **Auto-land-or-flag research PRs.** A research PR that is docs-only + green-CI should auto-merge (or ping once with a 1-click), instead of piling up unmerged (the observed leak - raidguild #1143 sat open). Never silent.
3. **Retry / surface failed tasks.** A failed (techfren) or needs-revision (mission-control) task must NOT vanish - retry once, then surface to Zaal with the error. Zero-output tasks are the worst leak.
4. **Commit proactive research.** ZOE's Telegram-only research blurbs (SEO/YT) evaporate - route the good ones into a research doc (or an appendix) so they become durable.
5. **The zao-research DISPATCH pattern already does the good parts** (one subagent per dimension, structured returns) - formalize: divide-by-source, JSON schema, dedup-by-key, contradiction-flag, lead-synthesizes-only. Add the verify-gate step before commit.
6. **Numbering + hygiene prerequisites** (from estate): ranges-per-agent numbering so parallel research subagents stop colliding; branch off clean origin/main so subagents don't contaminate (rules 18/19).

## Also See
- [Doc 928](../928-agent-loop-best-practices/) + [994](../994-loop-engineering-taxonomy/) - the loop canon
- [Doc 997](../997-agent-harness-design-zaalcaster/) - harness design (opinionated adapters, verify-with-environment)
- [Doc 998](../../infrastructure/998-github-repo-estate-audit/) + `research/estate/` - the pipeline leak this fixes
- [Doc 759](../759-*/) / [070](../070-subagents-vs-agent-teams/) - ZOE orchestrator + subagent paradigms

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a structured-output + Haiku verify-gate step to ZOE's research-worker (JSON schema + claim-status tags) - PR to bot/src/zoe | @Zaal | PR | 2026-07-16 |
| Auto-land-or-flag: docs-only + green-CI research PRs auto-merge or 1-click ping (no silent pileup) | @Zaal | PR | 2026-07-14 |
| Retry-once-then-surface for failed/needs-revision agent tasks (kill the zero-output leak) | @Zaal | PR | 2026-07-16 |
| Adopt ranges-per-agent doc numbering so parallel research subagents stop colliding | @Zaal | Decision | 2026-07-11 |
| Formalize the DISPATCH recipe in the zao-research skill: divide-by-source + JSON schema + dedup + verify-gate | @Zaal | PR | 2026-07-18 |

## Sources
Built by 4 parallel research subagents (2026-07-09). Primary:
- Anthropic, *Building Effective Agents* + *How we built our multi-agent research system* + *Agents in Biology* (deterministic-retrieval finding) `[FULL]`.
- Anthropic cookbook orchestrator-worker patterns; research_lead / research_subagent prompt guidance `[FULL]`.
- Cognition, *Don't Build Multi-Agents* + the 2026 convergence on orchestrator + isolated threads `[FULL/PARTIAL]`.
- Verification literature: LLM-as-judge bias studies, debate-as-oversight, citation-fabrication detection, "consensus is not verification" `[FULL/PARTIAL - some future-dated preprints, precise stats illustrative]`.
- Internal: docs 070, 547, 600, 759, 928, 994, 997, 998, `.claude/rules/agent-loops.md` `[FULL]`.
- Cost/economics figures (3x-100x overhead, $6k-$47k runaways, model pricing) `[PARTIAL - single secondary blogs, directional]`.
