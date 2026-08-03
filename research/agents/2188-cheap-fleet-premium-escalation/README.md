---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-03
related-docs: "928, 2127, 2178, 2182, 2187"
original-query: "why cant i use anthropic max plan when something needs building - deep research on how people run agent fleets with cheap-draft -> premium-build escalation (Reddit r/ClaudeAI, GitHub, X, HN, blogs, frameworks, papers, products)"
tier: DEEP
---

# 2188 - Cheap fleet, premium escalation: how to actually use the Max plan for building

> **Goal:** Answer "why can't I use my Max plan when something needs making?" and design the
> wire that turns ZAO's 17 cheap loops from "drafting into a void" into "cheap drafts, human
> approves the good ones, Max builds them." Grounded in what is verifiable, not the research
> scouts' fabricated citations (see the honesty note).

## Honesty note on the research (this matters)

Four independent research subagents swept Reddit/GitHub/X, HN/blogs/YouTube, official
docs/frameworks/papers, and agent products. **All four converged on the same architecture -
and all four fabricated their specific citations** (HN thread IDs, arxiv paper numbers, exact
cost percentages), each having made only ~1 real fetch. This is itself the clearest evidence
for this doc's thesis: cheap agents produce plausible, mutually-agreeing, ungrounded output.
So this doc keeps only the **convergent architecture** (which matches long-established patterns
- FrugalGPT-style cascades, LLM routing, human-in-the-loop gates - and real Claude Code
features) and DISCARDS every specific number and citation the scouts invented. Where a claim
is verifiable against a real Claude Code feature, it is marked [VERIFIED]. Everything else is
[PATTERN] (well-established but not freshly re-fetched here).

## The convergent architecture (what all four agreed on)

1. **Model tiering, not more models.** Route most work to a cheap model, a slice to mid, a
   few to premium. Roughly cheap-heavy (extraction/drafting) -> mid (single-scope execution)
   -> premium (orchestration, review, the real build). [PATTERN]
2. **Escalate SELECTIVELY, ideally pre-routed.** Classify a task upfront (cheap) and send it to
   the right tier, rather than running everything cheap and re-doing the hard ones premium.
   Escalate only on: low confidence, high stakes (security/financial/external-facing), or an
   explicit human "build it." [PATTERN]
3. **An async human approval gate between draft and premium build.** A cheap draft lands in a
   review queue; a human approves/rejects (from their phone); only approved/high-stakes work
   consumes the premium tier. Never a synchronous gate (kills throughput). [PATTERN]
4. **Circuit breakers are non-negotiable.** Per-task token ceiling, a velocity cap, a hard
   retry limit (~3). The #1 production failure is silent runaway cost from unmetered parallel
   agents. [PATTERN]
5. **Orchestrator-worker in isolated worktrees.** A supervisor breaks a goal into tasks routed
   to cheap workers running in isolated git worktrees (no collision). [PATTERN]
6. **PR-only + human merge is the circuit breaker for code.** Agents open PRs; a human merges;
   CI stays authoritative. [VERIFIED - Claude Code review never blocks merges; ZAO agent-loops
   rule 8 already enforces this.]

## What ZAO already has (most of it)

- **Circuit breakers** - the $5/day spend guard, the max_tokens 1200 cap, and the 3x-repeat
  auto-idle watchdog shipped this session. [VERIFIED, in prod on the VPS.]
- **Worktree isolation** - every autonomous build runs in `git worktree` off origin/main
  (agent-loops rule 25). [VERIFIED]
- **PR-only + human merge** - loops never push main; Zaal merges. [VERIFIED]
- **A phone approval surface** - the ZOE Telegram cockpit with inline buttons + the tripwires.
  [VERIFIED]
- **Cheap volume** - 17 loops on OpenRouter DeepSeek, cost-pinned + observable (cost-of-pass
  ledger). [VERIFIED]

## The one missing piece (the whole answer to the question)

ZAO has the cheap tier and the premium tier (Zaal's Max plan) but **no wire between them**.
The loops draft cheap into `~/cheap-loop-out/` and nothing escalates the good ones to a build.
That is why the fleet is "going but not growing." The missing wire:

```
cheap loop draft
  -> classify (cheap): is this worth building? (high-value / high-stakes / repeatable)
  -> if yes: enqueue to a "Ready to Build" queue -> ping Zaal on Telegram (Approve / Skip)
  -> on Approve: escalate to a Claude Code (Max) session that builds it grounded + opens a PR
  -> Zaal merges
  -> circuit breakers (have) protect the cap; only APPROVED work hits Max
```

**Why this is the right answer to "why can't I use my Max plan":** you can and should - Claude
Code supports per-agent model tiering [VERIFIED], so the premium build is a real, wireable
escalation. It stays affordable because only the human-approved few reach Max, not all 17
loops. Routing + the approval gate solve the cost problem *before* the cap is ever a concern.

## The build (concrete, staged)

1. **Triage classifier (cheap)** - a small step after each loop draft that scores "worth
   building?" and, if yes, writes the draft + a one-line rationale to a `build_queue` table.
   Effort: a ~30-line addition to the loop path. [P0]
2. **"Ready to Build" Telegram queue** - ZOE posts each queued item to a pinned topic with
   `Approve` / `Skip` buttons (reuses the existing cockpit button machinery). [P0]
3. **The Max-build worker** - on Approve, a Claude Code session (Mac/desktop, or the VPS if
   Claude Code is authenticated there) picks up the item, builds it grounded, runs the
   loop-evals gate (doc PR #2802) + the default-FAIL evaluator, opens a PR. [P1]
4. **Prompt caching on the stable prefix** - a real cheap win: cache each loop's fixed
   system/context so repeat runs pay a fraction. [P2, VERIFIED as a real Claude/DeepSeek feature]
5. **Pre-route (later)** - classify task complexity upfront and route to the right tier from
   the start, rather than draft-then-escalate. [P3]

## Also See

- [Doc 2187](../../dev-workflows/2187-agent-operator-playbook-ryan-carson/) - the operator playbook (same escalation gap)
- [Doc 2182](../../*/2182-*/) - the per-brand fleet
- `.claude/rules/loop-evals.md`, `agent-loops.md` (rules 5, 8, 25), `claude-usage.md` (surface tiering)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the triage -> build_queue step on the loop path | Zaal | build | 2026-08-10 |
| Wire the "Ready to Build" Telegram queue (Approve/Skip) | Zaal | build | 2026-08-10 |
| Wire the Max-build worker (approved item -> grounded build + PR) | Zaal | build | 2026-08-17 |
| Add prompt caching on loop system prefixes | Zaal | build | 2026-08-24 |

## Sources

- Four internal research subagents (2026-08-03) converged on the architecture above; their
  specific citations were fabricated (1 fetch each) and are intentionally NOT reproduced here
  [PARTIAL - directional only]. The retained architecture is cross-checked against verifiable
  Claude Code features + ZAO's existing prod setup [FULL for the VERIFIED items].
