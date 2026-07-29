---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: 928, 2036, 994
original-query: "https://x.com/zodchiii/status/2082408590460006732 - Anthropic engineer: build a system with Opus 5 that prompts itself, not prompt Claude"
tier: STANDARD
---

# 2127 - Loop / Harness Engineering (Anthropic "systems that prompt themselves") - ZAO alignment audit

> **Goal:** Take the viral "you're not supposed to prompt Claude, you build a system that prompts itself" talk and answer the only question that matters for us: what does ZAO already do, and what are the 2-3 concrete tune-ups worth making.

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **Do NOT build anything new from this - ZAO already practices loop/harness engineering.** Doc 928 + `.claude/rules/agent-loops.md` (36 rules) + the live ZOE loops (`orchestrator-tick.ts`, `work-loop.ts`) ARE the harness the talk describes. Treat the talk as external validation, not a to-do. | The talk's whole thesis (self-prompting observe-plan-act-reflect loops, memory files, stop conditions, human gates) is already the ZAO operating model. Building "loop engineering" would duplicate what ships. | @Zaal |
| 2 | **Audit the "claude.md tax."** The talk's one genuinely actionable metric: poorly-structured context files cost ~14% of productivity (they cite up to 60% lost to bad context). ZAO's `CLAUDE.md` + `MEMORY.md` + 10 `.claude/rules/*.md` are LARGE and auto-load every session. Measure whether they help or tax. | Doc 2036 already flagged MEMORY.md size + prompt-cache as the biggest context lever. This talk quantifies the cost and makes the audit concrete. | @Zaal |
| 3 | **Adopt the 3-level maturity ladder as a shared vocabulary for ZAO loops, nothing more.** L1 observe-act (minutes), L2 task-decomposition (a day), L3 autonomous multi-day with checkpoints + human gates (a week). Map each ZAO loop to a level so their scope is legible. | Cheap, no code, closes the "which loops are running and what can they do" gap (workflow-discipline rule 2). | @Zaal |
| 4 | **Note where ZAO is AHEAD, not behind: persistent cross-run learning.** The blog explicitly says the talk does NOT detail agents learning across separate runs. ZAO's rule 6/9 ("persist lessons to the repo, not just memory") + the 36 fold-back rules in `agent-loops.md` ARE cross-run learning. Keep doing it. | Don't cargo-cult a talk that is behind us on the one axis that compounds. | @Zaal |

## The talk (what it actually says)

A clip (17 min in the [zodchiii](https://x.com/zodchiii/status/2082408590460006732) version; a 45-min version circulates attributed to a different speaker - **attribution is muddy across the viral reposts, some say "he", some "she"; do not cite a name**) of an Anthropic engineer arguing the 2026 skill is **loop / harness engineering**, not prompt engineering.

Core thesis, verbatim: **"You're not supposed to prompt Claude. You're supposed to build a system that prompts itself."**

The canonical loop:
1. **OBSERVE** - read codebase, tests, error logs
2. **PLAN** - decide the next action from observations
3. **ACT** - make changes, run tests, commit
4. **REFLECT** - evaluate, find gaps, adjust
5. **REPEAT** - until done or timeout

Runs autonomously for hours/days with no human between cycles. Single prompts fail because they can't iterate, lose context, and bottleneck on the human.

Supporting pieces:
- **Memory files** - architecture map, code-style rules, testing strategy, deploy process, business/security context. Bad ones = the "14% claude.md tax."
- **Task decomposition** - break a feature into sub-tasks, each its own observe-plan-act cycle.
- **Stop conditions** - max turns (20-50 typical), circuit breakers on repeated failure, token monitoring, human-approval gates for high-risk actions.
- **3 implementation levels** - L1 simple observe-act (~1hr), L2 multi-step decomposition (~1 day), L3 autonomous multi-day with checkpoints + human gates (~1 week).

Claimed numbers (Anthropic, by May 2026): **8x daily code output**, **80%+ of merged production code authored by Claude**, **76% success rate on open-ended software tasks**, up to **60% of developer productivity lost to poorly-structured context**.

## Findings: the ZAO map (talk concept -> where it already lives)

| Talk concept | ZAO already has it | Evidence |
|--------------|--------------------|----------|
| "System that prompts itself" | The ZOE orchestrator loop + relay bridge built THIS session; the work-loop | `bot/src/zoe/orchestrator-tick.ts`, `bot/src/zoe/work-loop.ts` |
| Observe-plan-act-reflect | `agent-loops.md` rule 2 (read state before acting) + rule 1 (ground truth close) + rule 10 (learn online periodically) | `.claude/rules/agent-loops.md` |
| Memory files | `CLAUDE.md` + `AGENTS.md` + `MEMORY.md` + 10 `.claude/rules/*.md`, all auto-loaded | repo root + `.claude/rules/` |
| Sub-agent split | rule 7 (subagents for bounded research/isolation, inline for the hot path) | `agent-loops.md` rule 7; doc 928 practice 8 |
| Stop conditions / cost ceilings | rule 5 (hard cost + iteration ceilings), daily caps, file-locks, empty-queue=zero-spend | `agent-loops.md` rule 5; `orchestrator-tick.ts` DAILY_CAP + lock |
| Human gates for high-risk | rule 8 (PR-only + human gate as circuit breaker); outbound/on-chain/spend gated | `agent-loops.md` rule 8; `workflow-discipline.md` |
| Circuit breaker on repeated failure | rule 30 (boot-verify hard-fail), rule 32 (verify the right commit), auto-rollback in `zoe-autodeploy` | `agent-loops.md` rules 29-32 |
| Persist lessons across runs | rule 6/9 (persist to `.claude/rules`, not session memory) - **talk does NOT do this; ZAO does** | 36 fold-back rules in `agent-loops.md` |

**Bottom line: of 8 concepts in the talk, ZAO already ships 8.** Doc 928 (2026-06-30) is the ZAO distillation of Anthropic's earlier "Building Effective Agents" + "Effective Harnesses for Long-Running Agents" - this talk is the same lineage, restated for the Opus 5 era with a punchier name ("loop engineering") and marketing numbers. It is confirmation, not new information.

## The genuine delta (what is actually worth doing)

1. **The claude.md tax is measurable and ZAO is exposed to it.** ZAO's context stack is unusually large (a multi-thousand-line `CLAUDE.md`, a big `MEMORY.md`, 10 rule files, all loaded every session). The talk says bad context files cost ~14-60% of productivity. This is the one place the talk could save ZAO real cap. Pair with doc 2036 (context-hygiene) - measure, then trim what taxes.
2. **Name the levels.** ZAO runs several loops (ZOE orchestrator, work-loop, autodeploy, research loops) at different autonomy. Tag each L1/L2/L3 so "what is running and what can it do" is legible (workflow-discipline rule 2). Zero code.
3. **Nothing else.** No new loop, no new bot, no framework. The talk validates the road ZAO is on.

## Also See

- [Doc 928](../928-agent-loop-best-practices/) - the ZAO agent-loop rulebook (the earlier Anthropic guidance, already distilled into `agent-loops.md`)
- [Doc 994](../994-loop-engineering-taxonomy/) - ZAO's own loop-engineering taxonomy (same thesis, already mapped)
- [Doc 2036](../../dev-workflows/2036-context-hygiene-cost-discipline/) - context hygiene + cost discipline (MEMORY.md size, prompt-cache) - the claude.md-tax audit lives here

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Audit the "claude.md tax": measure whether CLAUDE.md + MEMORY.md + rules help or bloat a session, trim the dead weight - land the trim as a PR | @Zaal | PR | 2026-08-12 |
| Tag each live ZAO loop (ZOE orchestrator, work-loop, autodeploy, research) with an L1/L2/L3 autonomy level in `agent-loops.md` | @Zaal | PR | 2026-08-12 |
| No new loop/bot from this doc - decision recorded; revisit only if a specific ZAO gap appears | @Zaal | Decision | wontfix |

## Sources

- [zodchiii tweet (the source)](https://x.com/zodchiii/status/2082408590460006732) - `[FULL]` - fetched via fxtwitter: text + engagement (35 favs, 2827 views, posted 2026-07-29). The embedded 17-min video is the primary artifact.
- [explainx.ai - Harness Engineering breakdown](https://explainx.ai/blog/anthropic-engineer-loops-prompts-ai-coding-harness-engineering-2026) - `[FULL]` - full structured summary of the talk: observe-plan-act-reflect, memory files, stop conditions, the 8x/80%/76%/14% numbers, the 3-level ladder.
- The embedded talk video (`video.twimg.com/.../T8FIy-gf-IpHFRZg.mp4`) - `[FAILED]` - `zao-ingest.sh` could not transcribe the direct twimg mp4 (it fell back to on-site-transcript extraction and produced nothing). The explainx blog is a full textual substitute for the talk's content, so the doc is not written off a snippet.
- Viral reposts confirming the concept + name discrepancy: [Vikas gupta](https://x.com/vicky_grok/status/2081386780386062643), [Anatoli Kopadze](https://x.com/AnatoliKopadze/status/2074493620325953985), [Rahul](https://x.com/sairahul1/status/2068627267488710930) - `[PARTIAL]` - titles/snippets read via WebSearch (not each thread's full tree); used only to confirm the concept is widely circulating and that speaker attribution is inconsistent across reposts.
- ZAO grounding (code is ground truth): `.claude/rules/agent-loops.md` (36 rules), `bot/src/zoe/orchestrator-tick.ts`, `bot/src/zoe/work-loop.ts`, [Doc 928](../928-agent-loop-best-practices/) - `[FULL]` - read directly this session.
