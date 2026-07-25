---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-25
superseded-by:
related-docs: 441, 154, 928
original-query: "Ponytail (DietrichGebert/ponytail, 89k stars) - the AI-agent 'laziest senior dev / best code is the code you never wrote' Claude Code plugin. Research what it is, how it works (the laziness/simplicity ladder, plugin mechanics), community reception, and the ecosystem around it (ponytail-lite, ponystack merging it with gstack, karpathy-ponytail-skills). Key angle for ZAO: how it fits/compares with what we already run - gstack (vendored), caveman mode, and the .claude/rules elegance/YAGNI/agent-loop rules - and whether to adopt it."
tier: STANDARD
---

# 2081 - Ponytail: AI-agent code-restraint, and what ZAO should take from it

> **Goal:** Decide whether ZAO adopts Ponytail (the "laziest senior dev" agent-restraint plugin, 89k stars) given we already run gstack, caveman, and the agent-loop/elegance rules - and if so, in what form.

## Key Decisions (recommendations first)

1. **ADOPT the ladder as a rule, NOT the plugin.** Add Ponytail's concrete 7-rung restraint ladder to `.claude/rules/` (new `code-restraint.md`, sibling to `agent-loops.md`) + a line in `AGENTS.md`. ZAO already has an "elegance check / is there a simpler way" rule (agent-loops.md line "Elegance check on non-trivial changes") but it is a vibe, not a checklist - the 7 rungs make it operational. The HN critics' loudest point ("it is basically just these rules plus plugin boilerplate") is the argument FOR taking the rules and skipping the plugin. This is the `ponytail-lite` approach (one AGENTS.md, zero plugin baggage) and it is how ZAO already runs caveman - an instruction overlay, not an install.

2. **ADAPT via the ponystack pattern, which ZAO is 80% of the way to already.** ponystack = gstack for the understand/plan phase ("think expensive, boil the lake") + the ponytail ladder for the implement phase ("write cheap, minimize"). ZAO already vendors gstack (`.claude/skills/gstack/`) and agent-loops.md rule 3 already mandates "read live code before building." The ladder completes that on the write side. Wire the ladder into the implement phase, keep gstack/plan-mode for understand.

3. **GUARD the ZAO-specific failure mode the community already found.** The credible unresolved critique (dev.to) is that Ponytail was benchmarked on a repo with NO component library, so its "use the native platform feature" rung can override an existing design system. ZAOOS has ~296 components + `community.config.ts` + Tailwind v4 conventions. The rule MUST state rung 2 (reuse what is already in this codebase) outranks rungs 3-4 (stdlib/native) - so the ladder never swaps a ZAO component for a raw `<input>`.

4. **SKIP the marketplace plugin + per-turn ladder re-evaluation.** Ponytail evaluates the ladder every turn; on reasoning-heavy models that spends tokens deliberating (the `scalpel` critique). Given `.claude/rules/claude-usage.md` (the weekly-cap is the real constraint), decide the rung ONCE at plan time (scalpel's "one incision"), not every response. Do not install the 89k-star plugin for a behavior a rules file delivers cap-free.

## Findings

### What Ponytail actually is

Ponytail (DietrichGebert/ponytail, MIT, created 2026-06-12, **89,290 stars** in ~1 month, last push 2026-07-15) is a plugin/skill for 20+ agents (Claude Code, Codex, Cursor, Gemini CLI, Pi, Hermes, etc.) that runs a **7-rung decision ladder before writing code**. It is more than a prompt - it hooks agent lifecycle events (pre-write, subagent injection) and adds modes (`/ponytail lite|full|ultra|off`) - but the core instruction is copyable to a single `AGENTS.md`, which is exactly what the `-lite` fork does.

The ladder (verbatim):

```
1. Does this need to exist?   -> no: skip it (YAGNI)
2. Already in this codebase?  -> reuse it, don't rewrite
3. Stdlib does it?            -> use it
4. Native platform feature?   -> use it
5. Installed dependency?      -> use it
6. One line?                  -> one line
7. Only then: the minimum that works
```

Load-bearing nuance (direct quote): *"The ladder runs after it understands the problem, not instead of it... Lazy about the solution, never about reading."* This is the same principle as agent-loops.md rule 3 (code is ground truth, read live code first) - Ponytail is the write-side complement to a read-first discipline ZAO already has.

### The measured case (agentic, defensible)

The credible benchmark is agentic, not single-shot: 12 feature tickets on a FastAPI+React repo, same agent with/without the skill, Haiku 4.5, n=4. vs no-skill baseline: **LOC -54%, tokens -22%, cost -20%, time -27%, safety 100%** (validation/error-handling/security/accessibility never cut). The dramatic single-shot numbers (80-94% less code) are discounted even by supporters because the baseline was "chatty and padded." Ponytail's author rebuilt the benchmark to agentic after a methodology critique (GitHub Issue #126, Colin Eberhardt showed a plain `"provide just one example"` prompt narrowed the gap to 16 vs 8.25 LOC) and conceded the claims "should be a bit more modest." That honesty is a point in its favor.

### Ecosystem (the forks tell the real story)

| Project | Stars | What it is | Signal for ZAO |
|---|---|---|---|
| DietrichGebert/ponytail | 89,290 | Full plugin: lifecycle hooks, modes, 20+ adapters | The rules are the value; the plugin is distribution |
| ilindaniel/ponytail-lite | 129 | One-file AGENTS.md, same ladder, no plugin | This is the form ZAO should copy |
| AyanbekDos/ponystack | 20 | Phase router: gstack (plan) + ponytail (implement) | The blueprint - ZAO already vendors gstack |
| anshaneja5/scalpel | 12 | One-shot planning + "anatomy" guardrails | Beats ponytail on token spend: Opus -30% LOC / -27% tokens vs ponytail |

### How it sits against ZAO's current stack

| ZAO has today | Overlap with Ponytail | Gap Ponytail fills |
|---|---|---|
| caveman mode (output compression, active now) | Both are instruction overlays, not installs | Different axis - caveman compresses PROSE, ponytail restrains CODE |
| gstack vendored (`.claude/skills/gstack/`) | ponystack proves they compose | gstack plans; ponytail constrains the write |
| agent-loops.md "elegance check", YAGNI | Same intent | Vague vibe -> a concrete 7-rung checklist |
| claude-usage.md (cap discipline) | Aligned (less code = fewer tokens) | Warns against per-turn re-deliberation (use one-shot) |
| typescript-hygiene.md, components.md | rung 2 (reuse) matches "use existing components" | Must pin rung 2 > rungs 3-4 so it respects the 296-component library |

### Community reception (verdict: real signal, over-packaged)

HN split cleanly: skeptics call it *"essentially just these rules, and a metric ton of boilerplate for specific plugin systems"* (compared to the leftpad over-engineering irony); supporters say structured constraints genuinely tame agent verbosity on real edits. The substantive open critiques - design-system blindness on mature repos, per-turn token cost on reasoning models, and "does it read project conventions or override them" - are exactly the ones ZAO must design around, and all three are handled by decisions 3 + 4 above. No dedicated Reddit r/ClaudeAI thread was found.

## Also See

- [Doc 441](../441-everything-claude-code-integration/) - the ECC rules integration (same "pin rules into .claude/rules" pattern)
- [Doc 154](../154-skills-commands-master-reference/) - skills/commands master reference (where a code-restraint rule gets indexed)
- [Doc 928](../../agents/928-agent-loop-best-practices/) - agent-loop best practices (the elegance-check rule this sharpens)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `.claude/rules/code-restraint.md` with the 7-rung ladder + the rung-2>rungs-3-4 ZAO guard + one-shot-not-per-turn note; PR merged | @Zaal | PR | 2026-07-30 |
| Add one line to `AGENTS.md` + `CLAUDE.md` pointing to code-restraint.md (so every session + ZOE loads it); PR merged | @Zaal | PR | 2026-07-30 |
| Trial the ladder on the next 3 ZAOOS feature PRs; record LOC/token delta in a comment on this doc | @Zaal | Trial | 2026-08-08 |
| Decide keep/drop after the trial (adopt permanently or revert the rule); note the call in this doc | @Zaal | Decision | 2026-08-11 |

## Sources

- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) - full README, ladder, benchmarks, install paths, modes [FULL]
- [ilindaniel/ponytail-lite](https://github.com/ilindaniel/ponytail-lite) - one-file AGENTS.md variant [FULL]
- [AyanbekDos/ponystack](https://github.com/AyanbekDos/ponystack) - gstack+ponytail phase router [FULL]
- [anshaneja5/scalpel](https://github.com/anshaneja5/scalpel) - critique + head-to-head benchmarks [FULL]
- [Hacker News discussion](https://news.ycombinator.com/item?id=48527946) - reception, "just rules + boilerplate" critique [FULL]
- GitHub Issue #126 (Colin Eberhardt) - benchmark methodology critique + author's agentic rebuild [FULL]
- DEV Community "Ponytail at GitHub Storm" - design-system-blindness gap on mature repos [FULL]
