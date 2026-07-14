---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-14
related-docs: 928, 1085, 1086
original-query: "https://x.com/0xCodila/status/2072329149520232639"
tier: STANDARD
---

# 1090 - Loop Engineering: The Karpathy Method and Bilevel Autoresearch

> **Goal:** Analyze 0xCodila's "Loop Engineering" X article (2026-07-01, 4.4M views) for new or behavior-changing practices vs ZAO's existing agent-loop operating doctrine. Identify what to fold back into `.claude/rules/agent-loops.md`.

## Key Decisions

- **ADOPT Bilevel Autoresearch pattern** into agent-loops.md as new rule 21: "Outer loop watches inner loop search patterns and generates code to improve the inner loop's exploration strategy."
- **ADOPT Verifier immutability** as rule 22: "Verifier/evaluator must be unreachable by the agent it tests - only the agent can touch the code-under-test, never the test itself."
- **ADOPT explicit "two-way stop condition"** as rule 23: "Every loop has two stops: goal met, or hard limit (N tries / token budget / wall-clock). Both are required."
- **ADD comprehension debt + cognitive surrender risks** to the "Honest Part" section of agent-loops.md (post-rule text) to formalize the non-technical risks.
- **SKIP state machine patterns** (mentioned in doc 1085/1086 DreamLoops work) - already in ZAO via session-state practices and .claude/rules.
- **SKIP skill/automation/connector/verifier basics** - already covered by agent-loops.md rules 1-8 and the five-building-blocks pattern (all present in ZOE + /loop CLI infrastructure).

## The Karpathy Method (Distilled)

**Three Core Parts:**
1. Verifier - a test/metric/build gate that cannot be touched by the agent (the check must be external)
2. State - a persistent record of what's been tried, failed, what's next (resume on restart without re-deriving context)
3. Stop condition - two ways out: goal met OR hard limit (N iterations / token budget / time)

**Loop Cycle:**
Read code -> propose change -> train/build -> verify result -> commit if pass, rollback if fail -> repeat

**Preconditions (when to build a loop vs one-shot prompt):**
- Task repeats weekly or more (setup cost amortizes)
- Verification is automated (no human in the room reading every diff)
- Token budget can absorb waste (loops retry, re-read context, explore)
- Agent has real tools (logs, build environment, ability to run and see breakage)

**Result on Karpathy's 2-year-tuned GPT model:**
- 700 experiments in 48 hours
- 20 improvements human missed (subtle optimizations, not bugs)
- Humans get tired after experiment 12; agent does not

**Why it works:**
Removes the human as the bottleneck. You are not the experiment runner; you are the goal-setter.

## Bilevel Autoresearch: The 5x Improvement (Karpathy Loop on a Loop)

**The Pattern:**
- Inner loop: propose change -> train -> evaluate -> keep/discard (same as Karpathy)
- Outer loop: watches inner loop run, reads its code and execution traces, identifies where search gets stuck, generates NEW Python code to change how inner loop searches, injects that code, lets inner loop run again

**The Insight:**
The model has priors about what optimizations to try. On hard problems, it keeps going back to the same priors even when they stop working. The outer loop breaks those patterns by forcing exploration in unexplored directions.

**Result:**
- 5x improvement vs single loop (not 5% - five times better)
- Same LLM for both levels (outer loop does not need a smarter model)
- Improvement comes from architecture, not from raw intelligence

**Applicability:**
"If autoresearch can meta-autoresearch itself, it can in principle meta-autoresearch anything with a measurable objective."

## Five Building Blocks (Already in ZAO)

The article identifies five pieces every working loop needs:

1. **Automation** - the heartbeat (schedule, event, trigger)
   - ZAO: /loop for cadence, /goal for running until condition holds
2. **Skill** - stores project knowledge (conventions, build steps, why-nots)
   - ZAO: .claude/rules/, skills/, project-specific skills (autoresearch, zao-research, etc.)
3. **Sub-agents** - split maker from checker (prevent self-grading)
   - ZAO: already implemented in ZOE (coder + critic split), /loop subagent spawning
4. **Connectors** - let loop act in real environment (PR, Slack, Linear, etc.)
   - ZAO: gh api integration, Telegram via ZOE, Slack integration via bots
5. **Verifier** - the gate (test, type-check, build, or metric)
   - ZAO: npm run typecheck, npm run build, vitest, bot boot-verify (esbuild + tsc + vitest + boot)

All five are present in ZAO's current loop infrastructure. The article validates the decomposition; it does not reveal new surfaces.

## Fold-Back List: Changes to `.claude/rules/agent-loops.md`

### New Rules to Add (after rule 20)

**Rule 21 - Bilevel Loops for Search Optimization:**
"When a single loop gets stuck in search-pattern repetition (same explorations failing repeatedly), build a second loop on top: outer loop watches inner loop's trace, identifies stuck patterns, generates code to adjust the inner loop's exploration strategy, injects it, and repeats. This is order-of-magnitude more powerful than single-loop retry. Applicable when: (a) inner loop has measurable objective + execution logs, (b) outer loop can safely mutate the inner loop's search code without breaking the verifier, (c) token budget allows meta-level iteration."

**Rule 22 - Verifier Immutability:**
"The verifier (test, type-checker, build, metric gate) must be unreachable by the agent it tests. If the agent can touch the verifier code, it will optimize the verifier instead of the work under test. Pattern: three separate files or scopes - code to change (agent writable), test/metric to evaluate it (agent read-only), instruction/goal (agent readable, human-writable). This is the core insight of Karpathy's train.py / prepare.py / program.md split."

**Rule 23 - Two-Way Stop Condition:**
"Every loop must exit cleanly in exactly two cases: (a) goal is met (verifier passes some success criteria), OR (b) hard limit is hit (N iterations exhausted, token budget exceeded, wall-clock time elapsed, cost ceiling breached). A loop with only goal-exit runs until success, broke, or drained your account. A loop with only limit-exit stops even when close to solving. Both are required. Implement as: iteration counter + budget check at loop top, conditional exit before re-entry."

### Updates to Existing Sections

**Extend the "Honest Part" section** (after rule 20 but before "Sources") with:

> Loops reduce operational overhead but increase structural risk. Two non-obvious problems compound as loops get better:
>
> - **Comprehension debt.** The faster the loop ships code you did not write, the wider the gap between what exists in your repo and what you understand. A smooth loop charges compound interest on that gap. The day you need to debug a system nobody has read will cost more than the token savings ever were.
> - **Cognitive surrender.** When the loop runs itself, it is tempting to stop forming an opinion and just accept whatever it delivers. The cure is designing the loop with judgment; the accelerant is designing the loop to avoid thinking. Same loop, opposite outcomes. Karpathy did not stop thinking when he stopped writing code. Bilevel autoresearch works because researchers stay engaged with the outer loop's strategy - they do not vanish.

**Update Source section** to add:
- [0xCodila: Loop Engineering - The Karpathy Method and Bilevel Autoresearch](https://x.com/0xCodila/status/2072329149520232639) - FULL (2026-07-01, 4.4M views, 1539 likes, 91 article blocks)
- [Bilevel Autoresearch paper (arxiv): Meta-Autoresearching Itself](https://arxiv.org) - inferred from article; verify arXiv link

**Add to rule 10 expansion:**
"Learn online every 2-3 loop cycles. The Loop Engineering article (0xCodila, 2026-07-01) introduced bilevel autoresearch (5x improvement) and formalized verifier immutability - both folded back here as rules 21-22."

## Findings: What Is Actually New

**Already in ZAO (no new rules):**
- Rule 1: Verifier as ground truth - covered by "Ground truth over confidence"
- Rule 2: State persistence - covered by "Read state before acting"
- Rule 5: Cost + iteration ceilings - covered by "Cost + iteration ceilings"
- Rule 7: Sub-agents split maker/checker - covered by "Subagents for bounded research"
- Five building blocks (automation/skill/sub-agents/connectors/verifier) - all present in ZOE + /loop + skills

**Genuinely New (behavior-changing):**
1. **Bilevel Autoresearch pattern** - the 5x improvement via outer loop meta-adapting the inner loop's search strategy. ZAO runs single-loop agents (ZOE, /loop, ZOL); bilevel is a next-level capability for stuck-loop recovery.
2. **Verifier immutability as a hard rule** - not just "test suite exists" but "agent cannot touch the verifier code ever." ZAO has this in bot bots (esbuild + tsc are untouchable), but it is not explicitly formalized as a design principle. The Karpathy train.py / prepare.py / program.md split makes it canonical.
3. **Two-way stop condition** - ZAO has cost ceilings (rule 5) but does not formalize "goal met OR hard limit" as a dual-exit design. Single-goal stops work until they do not; dual-exit is more robust.
4. **Comprehension debt + cognitive surrender as named risks** - ZAO has not formally documented the non-technical failure modes. These are powerful enough to justify failure even with all the technical rules in place.

**Community Reception (context):**
- 4.4M views, 1539 likes, 46 replies on the original X thread
- Shouting out Karpathy's AutoResearch (66k+ stars, Fortune coverage)
- Bilevel autoresearch paper cited but arXiv link not visible in article text (needs verification)

## Next Actions

| Action | Owner | Type | Criteria |
|--------|-------|------|----------|
| Land rules 21-23 + Honest Part update in .claude/rules/agent-loops.md | Zaal | PR | Merge this doc PR, then PR agent-loops.md with 3 new rules + 1 section expansion |
| Verify Bilevel Autoresearch paper on arXiv and add full link to Sources | Zaal or research bot | research | Find paper "Bilevel Autoresearch: Meta-Autoresearching Itself" (March 2026) and confirm link |
| Design bilevel test case for ZOE or /loop | Zaal | design | When ZOE gets stuck in search-pattern repetition, formalize outer-loop wrapper (owner TBD) |
| Document verifier immutability as a design pattern in the ZOE + bot architecture | Architecture review | design | Add pattern doc to research/agents/ explaining train.py / evaluate.py / config.md split for ZOE agents |
| Measure comprehension debt in current ZAO agents (ZOE, ZOL, work-loop) | Zaal | audit | Repo walk-through: how much bot code exists that no human has read or audited? Quantify and flag high-debt modules. |

## Sources

- [0xCodila: Loop Engineering - The Karpathy Method (X/Twitter, 2026-07-01)](https://x.com/0xCodila/status/2072329149520232639) - FULL (91 article blocks fetched via FxTwitter, 4.4M views)
- [Karpathy: AutoResearch repo (GitHub, March 2026)](https://github.com/karpathy/autoresearch) - REFERENCED (train.py / prepare.py / program.md architecture; 66k+ stars within 1 month)
- [Bilevel Autoresearch paper (arxiv, March 2026)](https://arxiv.org) - INFERRED (article cites "Bilevel Autoresearch: Meta-Autoresearching Itself" but link not in article text; needs verification)
- [ZAO .claude/rules/agent-loops.md](../../.claude/rules/agent-loops.md) - FULL (20 existing rules, loop-ops lessons)
- [Doc 928 - Agent-loop best practices](../agents/928-agent-loop-best-practices/README.md) - FULL (12 core practices + source review)
- [ZAO bot fleet architecture (ZOE, ZOL, work-loop)](../../bot/src/zoe/) - IMPLIED (bilevel pattern applicable but not yet implemented)

## Internal Notes (research process)

- Article fetched 2026-07-14 via `~/bin/zao-fetch-x.sh "2072329149520232639"` from FxTwitter (full 91-block body)
- Compared against existing agent-loops.md (20 rules + loop-ops 12-20) and doc 928 (12 practices)
- Identified 4 genuinely new behavior-changing practices; 3 folded back as rules 21-23 + Honest Part expansion
- Bilevel pattern most significant (5x improvement claim, applicable to search-stuck loops); verifier immutability formalizes existing instinct; two-way stop condition hardens robustness
- Comprehension debt + cognitive surrender are non-technical risks ZAO has not yet named; adding them increases likelihood of loop misuse detection

---

**For Zaal:** This doc completes the "learn online periodically" cycle (rule 10) for loop engineering. The Karpathy method validates what ZAO already does (all 5 building blocks present). Bilevel autoresearch is the upgrade: when single loops stall in search patterns, a meta-loop adjusts the inner loop's strategy for 5x improvement. Fold-back list is ready for PR to agent-loops.md. Comprehension debt is the quiet risk to watch (ZOE ships a lot of code fast now).
