# 2163 - CLAUDE.md Discipline (r/ClaudeAI) vs ZAOOS's Rule Load

**Date:** 2026-07-31
**Status:** Research + a concrete recommendation (a CLAUDE.md/rules prune + a drift-check). Full thread saved off-repo at `~/.zao/private/reddit-claudemd-discipline.json`.
**Owner:** Zaal
**Source:** r/ClaudeAI, "Anthropic cut most of Claude Code's system prompt and told us to put the rest in CLAUDE.md. Honestly I think this is the right call." (post 1vauevs; OP body since [removed], so this reads the title + the 15-comment thread). Zaal flagged it 2026-07-31.
**Siblings:** doc 2160 (founder-brain research), doc 2036 (context-hygiene), `.claude/rules/*` (all 15), MEMORY.md (index near its read limit), [[project_claude_usage_audit_jul3]].

---

## The thesis (title + the strongest comments)

Anthropic trimmed Claude Code's baked-in system prompt (model-era scaffolding now lives in the model) and pushed the rest to `CLAUDE.md`. The thread's operators converged on a discipline:

- **CLAUDE.md is always-resident - it eats your working context every turn.** "That's the real reason to keep it tight, not aesthetics." (the load-bearing insight)
- **Only rules that earned a line** - "ones written after something already broke once. Anything speculative just piles up ... until the file's 400 lines and half of it's dead weight."
- **Model-era patches rot every release.** "You are a senior developer, verify your results" was for older models; it's baked in now. What does NOT rot is **what the model cannot infer from your repo**: build/test commands, off-limits dirs, house conventions, when-to-ask-vs-guess, when-to-confirm-a-destructive-action.
- **Router / crossroads pattern:** a minimal CLAUDE.md that points to deeper docs pulled on demand - "one line pointing at a deeper docs file it pulls from when it needs them."
- **Rules rot silently and DRIFT across files** (the sharpest one): "I had one rule written in several places and most of the copies had drifted; one had gone actively wrong and was causing a review step to fail work that was actually correct. Nothing errors when a rule stops being true, so you find out late and from the wrong symptom. I run a check now that fails if two rule files disagree."

## ZAOOS's actual load (measured 2026-07-31)

- `CLAUDE.md`: **185 lines / 11 KB**.
- `.claude/rules/`: **15 files, 931 lines** (agent-loops, thread-discipline, code-restraint, components, typescript-hygiene, secret-hygiene, tests, silent-failure-guard, claude-usage, icm-grounding, anti-fabrication, workflow-discipline, pii-hygiene, api-routes, skill-enhancements).
- Plus `MEMORY.md` (~20 KB, flagged this session as near its read limit) + `AGENTS.md`.
- Net always-resident: **~1,100+ lines of rules/config every turn**, before any task context.

## Honest assessment - where ZAO is right, where the post bites

**ZAO already does the hardest part right: "only rules that earned a line."** Nearly every `.claude/rules` entry is incident-derived - `agent-loops.md`'s 36 rules each cite a real failure; `silent-failure-guard.md`, `anti-fabrication.md`, `workflow-discipline.md` are all "written after something broke." This is exactly the discipline the thread preaches. ZAO is not piling speculative filler.

**But three of the thread's warnings land:**

1. **The always-resident cost is real and large.** ~1,100 lines/turn is a lot of working context spent before the task - the exact concern in doc 2036 (context-hygiene) and `claude-usage.md` (the cap). The rules are individually earned but collectively heavy. The router pattern (lean CLAUDE.md -> rules loaded when relevant) is only partially in play - all 15 rules load every session.
2. **Drift is a LIVE, confirmed risk - not hypothetical.** Last night's brand-audit work found the CLAUDE.md glossary lists `magnetiq.io` while the verified URL is `magnetiq.xyz` (memory had it right; CLAUDE.md had drifted). That is precisely the commenter's "a copy had gone actively wrong and nothing errored." A ZAO rule/fact living in CLAUDE.md AND a memory AND an ICM box has three places to drift.
3. **Model-era patches may have rotted.** Worth a scan for lines that were true for older models but the current model handles natively (verbose "always verify," "think step by step," over-explained tool etiquette).

## Recommendation (concrete, adoptable)

1. **Prune pass on CLAUDE.md + rules.** For each block, ask the thread's test: does the model need this because it CANNOT infer it from the repo (build/test cmds, off-limits dirs, house conventions, gating)? Keep those. Cut/relocate model-era scaffolding and anything the model now does natively. Target: shrink the always-resident load without losing an incident-earned rule.
2. **Adopt the drift-check** (the thread's best idea). A check that FAILS when the same fact contradicts itself across CLAUDE.md / `.claude/rules` / memories / ICM boxes - starting with the high-drift facts (brand URLs, contract addresses, dates, handles). Wire it into a pre-commit hook or a `/retro`-style weekly. The magnetiq drift would have been caught automatically.
3. **Lean into the router pattern.** Keep CLAUDE.md as the crossroads (what this is, the map, the hard gates) and let the 15 rules be pulled by relevance rather than all-resident where the harness allows. Pairs with the `claude-usage.md` surface-tiering discipline.
4. **Do NOT delete incident-earned rules to chase a line count.** The thread's failure mode is speculative bloat; ZAO's rules are the opposite. Prune scaffolding and drift, not hard-won lessons. (Contrast the Boris "try removing your CLAUDE.md" note: valid for a fresh repo, wrong for one whose rules encode real incidents.)

## Verdict

Strong external validation of ZAO's incident-derived rule philosophy - and a sharp, timely nudge on the two things ZAO has NOT fully solved: the always-resident token cost and silent cross-file drift (already confirmed live via the magnetiq URL). The single highest-leverage adoption is the **drift-check**; the prune pass is worth a supervised session. Pairs with doc 2160 (an external founder converging on ZAO's architecture) and doc 2036 (context-hygiene).

## Source

r/ClaudeAI post 1vauevs + its 15-comment thread (full copy `~/.zao/private/reddit-claudemd-discipline.json`, fetched 2026-07-31 via arctic_shift; OP body was [removed], thesis reconstructed from title + comments). Measurements from the live repo. Written 2026-07-31.
