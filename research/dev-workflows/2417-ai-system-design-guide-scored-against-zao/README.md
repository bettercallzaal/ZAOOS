---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-25
superseded-by:
related-docs: "2411, 2405, 928, 2127"
original-query: "https://github.com/ombharatiya/ai-system-design-guide/ ZAO research this please"
tier: STANDARD
---

# 2417 - Scored against its anti-pattern catalog, ZAO passes most and fails the biggest one

> **Goal:** Read the guide, then use the only part of it we cannot get elsewhere -
> its anti-pattern checklist - as a mirror on our own estate.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt nothing wholesale. Use chapter 15 as a checklist and move on.** | It is an interview-prep and reference guide. ZAO is not preparing for interviews, and our loop rules already came from primary sources (Anthropic, Karpathy) rather than a secondary compendium. |
| 2 | **We fail "The God Prompt", measurably.** | **190,813 bytes - roughly 47,700 tokens - load at the start of every session** (36 rule files plus two `CLAUDE.md`). The guide's own anti-pattern example is annotated *"[continues for 5000 tokens]"*. **We are about 9.5x the thing it calls a mistake.** |
| 3 | **The fix is routing, NOT deletion.** | Every rule was earned by an incident, and one of them fired correctly during this very session. A rule that does not load cannot prevent anything. |
| 4 | **We fail "Infinite Loop Risk" on cost, and I proved it last night.** | Our rule says loops need ceilings. The overnight loop had a *stop condition* - two empty ticks - and **no cost ceiling at all**. The guide asks for `MAX_STEPS`, `MAX_COST` and `MAX_TIME`. We had one of three. |
| 5 | **We pass most of the rest, and can show the receipts.** | Provider failover, agent memory, tool sandboxing, rate limiting and human-in-the-loop are all already implemented and documented. |

## The repo, verified

| | |
|---|---|
| Repo | `ombharatiya/ai-system-design-guide` |
| Licence | **MIT** - read from the `LICENSE` file itself, not the API field |
| Stars / forks | 2,855 / 574 |
| Created | 2025-12-16 |
| Last push | **2026-08-15** (10 days before this doc) |
| Open issues | 5 |
| Shape | 20 numbered chapters plus a glossary, courses list and two deep-dive eval guides |

Its own framing is *"AI system design guide for engineers building production AI
systems and evals"*, and chapter `00-interview-prep/` carries 128 questions. **It
is a study guide first.** That is not a criticism; it is the reason most of it
does not apply to us.

Three chapters overlap our actual work: `07-agentic-systems` (twelve files, ending
in a 27KB `12-loop-engineering.md`), `14-evaluation-and-observability`, and
`15-ai-design-patterns`.

## The scorecard

Chapter 15's anti-pattern catalog, scored against what this estate actually does.
Every PASS cites something real; every FAIL cites a measurement.

| Anti-pattern | ZAO | Evidence |
|---|---|---|
| **The God Prompt** | **FAIL** | ~47,700 tokens of instructions load before any task starts |
| Single Provider Dependency | PASS | fleet failover claude -> codex -> openrouter -> ollama (`claude-usage.md`) |
| Premature Fine-Tuning | PASS | we fine-tune nothing |
| **Infinite Loop Risk** | **PARTIAL** | iteration ceilings exist; **no cost ceiling** on the loop run 2026-08-24 |
| Unsafe Tool Access | PASS | ZOL's capsule blocks `farcaster.post`, `wallet.sign`, `fund.transfer` by name |
| Agent Without Memory | PASS | Bonfire graph, ZOE memory blocks, 51 vault people notes |
| **Vibes-Based Evaluation** | **PARTIAL** | `loop-evals.md` is a real gate; doc 2411 measured its mandated tools at **3 calls in 30 days** |
| No Rate Limiting | PASS | ZOL auto-post capped at 2 per 4h, jittered |
| No Caching | PASS | prompt-cache discipline documented (doc 2036) |
| Vague Instructions / No Output Format | PASS | verdicts are a fixed five-key set with typed callbacks |

## The God Prompt finding, in full

**Measured 2026-08-25:** `CLAUDE.md` (project), `~/.claude/CLAUDE.md` (global) and
**36 files in `.claude/rules/`** total **190,813 bytes**. At four bytes per token
that is **~47,700 tokens consumed before a single instruction is read**.

The guide's stated failure modes, checked against us honestly:

- *"Context consumed by instructions, not user content"* - **true, and quantified.**
- *"Model struggles with conflicting instructions"* - **demonstrated.** This estate
  has hit it repeatedly: a browsing rule that mandated a tool which could not run
  while banning the one that worked (1,786 calls, doc 2411); a `TOOL STATUS` note
  in `thread-discipline.md` that told every session a working tool was missing for
  two days.
- *"Updates affect everything"* - **true.** A rule edit changes every lane at once.

**But the counter-evidence is equally real, and it is why the answer is not
deletion.** During this same session, `agent-loops.md` rule 37 fired exactly as
written: a follow-up commit was pushed to a PR branch that had already merged, the
commit stranded silently, and only the rule's instruction to re-check PR state
after pushing caught it. **A rule that does not load cannot prevent anything**, and
that is `vanishing-dependencies.md` applied to instructions.

So the correct move is the guide's own solution - a router - applied to rules:
**load by task shape rather than all 36 always.** Deployment rules for deploys,
research rules for research, and a small always-on core. That is a real piece of
work and should not be started casually.

## The loop ceiling gap, which this session created

`agent-loops.md` rule 5 says every autonomous path needs a hard cap. The overnight
loop of 2026-08-24 had a **stop condition** - two consecutive empty ticks - and
**no cost ceiling**. The guide asks for three:

```
MAX_STEPS = 20
MAX_COST  = 10.0
MAX_TIME  = 300
```

We had step-shaped intent and neither of the other two. Given `agent-spend.md`
prices a turn at roughly a dollar, a loop with no `MAX_COST` is precisely the
runaway the guide describes - and precisely the one Zaal has been surprised by
before. **This is the most directly adoptable thing in the repo.**

## What we already do better

Worth recording so the comparison is fair rather than flattering:

- **Our loop rules come from primary sources** - Anthropic's harness writing and
  Karpathy's agent model (docs 928 and 2127) - not a secondary compendium.
- **Our rules carry incidents.** The guide gives a pattern; our rules give the
  pattern plus the day it was learned and the cost. `first-handler-wins.md` names
  three bugs on one date; `liveness-probe-guard.md` names three instances over
  five weeks.
- **Chapter 14 assumes an eval dataset.** Our work is one-off and judgment-shaped -
  research docs, briefs, PRs - so RAGAS-style scoring does not transfer.

## Honest limits

- **I read three of twenty chapters in full** - 15 entirely, 07 and 14 by structure
  and file size only. The 27KB `12-loop-engineering.md` and the two deep-dive eval
  guides were **not read**, and either could change the assessment.
- **The 4-bytes-per-token figure is an approximation**, not a tokenizer count. The
  real number could be 15% either way; it does not change the order of magnitude.
- **Star count is not quality.** 2,855 stars says people bookmarked it.
- **No claim is made that the guide is wrong anywhere** - only that most of it
  addresses a reader we are not.

## Also See

- [Doc 2411](../2411-tool-usage-audit-measured/) - the measurement discipline this doc reuses, merged as PR #3311
- [Doc 2405](./2405-skills-audit/) - 75 skills and the argument that more is not the problem; the same shape as the God Prompt finding. **Unmerged as of 2026-08-25** (branch `ws/research-2405-skills`)
- [Doc 928](../../agents/928-agent-loop-best-practices/) and [Doc 2127](../../agents/2127-loop-harness-engineering-anthropic/) - where our loop rules actually came from

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `MAX_COST` and `MAX_TIME` ceilings to the loop contract in `agent-loops.md` rule 5; done when a loop can state its own budget and stop on it | @Zaal (Claude) | PR | 2026-08-27 |
| Measure the real token count of the always-loaded payload with a tokenizer, not a byte estimate | @Zaal (Claude) | Test | 2026-08-27 |
| Decide whether rules should be routed by task shape rather than all loaded always - this is a design decision, not a cleanup | @Zaal | Decision | 2026-09-05 |
| Read `07-agentic-systems/12-loop-engineering.md` (27KB) against our own loop rules and report only what differs | @Zaal (Claude) | Research | 2026-09-01 |

## Sources

- [FULL - `gh api repos/ombharatiya/ai-system-design-guide`, 2026-08-25] stars, forks, created, pushed, open issues, description.
- [FULL - `gh api .../contents/LICENSE`, decoded, 2026-08-25] **MIT License, Copyright (c) 2026 Om Bharatiya**, read from the file per `credit-attribution.md` and the zao-research licence rule - never the API field.
- [FULL - `gh api .../contents/README.md`, decoded, 24,427 bytes] chapter structure and framing quoted verbatim.
- [FULL - `gh api .../contents/15-ai-design-patterns/02-anti-patterns.md`, decoded, 12,834 bytes] the full anti-pattern catalogue; "The God Prompt", "Vibes-Based Evaluation" and "Infinite Loop Risk" quoted directly.
- [PARTIAL - directory listings only] `07-agentic-systems` (12 files) and `14-evaluation-and-observability` (3 files). **File contents not read.**
- [FULL - measured 2026-08-25 on this machine] 190,813 bytes across `CLAUDE.md`, `~/.claude/CLAUDE.md` and 36 files in `.claude/rules/`.
- Credit: the guide is **Om Bharatiya's** work, MIT-licensed. The anti-pattern catalogue used as this doc's scorecard is his; the scoring against ZAO is ours.
