---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-11-09
superseded-by:
related-docs: 441, 154, 928, 2649, 2700, 1028
original-query: "Ponytail (DietrichGebert/ponytail, 89k stars) - the AI-agent 'laziest senior dev / best code is the code you never wrote' Claude Code plugin. Research what it is, how it works (the laziness/simplicity ladder, plugin mechanics), community reception, and the ecosystem around it (ponytail-lite, ponystack merging it with gstack, karpathy-ponytail-skills). Key angle for ZAO: how it fits/compares with what we already run - gstack (vendored), caveman mode, and the .claude/rules elegance/YAGNI/agent-loop rules - and whether to adopt it. Re-researched 2026-11-09 on Zaal's 'research ponytail': what changed since July (Ponytail 5), what the independent measurements say, and what else to adopt beyond the ladder."
tier: STANDARD
---

# 2081 - Ponytail: AI-agent code-restraint, and what ZAO should take from it

> **Goal:** Decide what ZAO adopts from Ponytail now that it is Ponytail 5 (187,712 stars on 2026-11-09, up from 89,290 on 2026-07-25), given we already run the 7-rung ladder as `.claude/rules/code-restraint.md`, caveman, gstack and the agent-loop rules; and what the independent measurements say the ladder is actually worth.

**Re-researched 2026-11-09.** The July version (last-validated 2026-07-25) decided "adopt the ladder as a rule, not the plugin"; that shipped as `.claude/rules/code-restraint.md`. This version re-fetched every source. What changed: Ponytail 5 (2026-10-08) rewrote the rules, the review and the audit; two independent paired tests landed (JetBrains, Marmelab); a rival (Chisle) published the runs where Ponytail backfires; and upstream now carries the "house component beats a native widget" guard that the July doc had to add for ZAO.

## Key Decisions (recommendations first)

1. **KEEP the rule, not the plugin, and KEEP it loaded as a rule file.** JetBrains measured the install path that matters: with Ponytail dropped in as a plain skill and the model left to decide, it self-activated **0 times in 10 sessions**. Every saving they measured came from the arm where the ruleset was injected on every session, which is exactly what a `.claude/rules/*.md` file does for every ZAOOS session. The plugin's own value is that injection plus the modes and the band; the rules file gives ZAO the injection for free.

2. **UPDATE `code-restraint.md` to the Ponytail 5 rules (one PR, held, Zaal merges).** Five additions, each measured upstream as the reason Ponytail 5 beat Ponytail 4 (replies preferred 110 to 67 by a blind judge; tests where logic needs one 98% vs 68% with no skill):
   - **Scope before writing:** list every place the change must reach (callers, tests, fixtures, config, exports) and what it could break; that is the scope, extra features are not.
   - **End every reply with what was skipped or not checked, and any risk.** This is the F line of `loop-evals.md` made mandatory for every code reply, not only PRs.
   - **Bug fix: grep every caller first, fix the root cause once in the shared code.** `agent-loops.md` rule 3 says read live code first; this names the move.
   - **Non-trivial logic leaves one small test or an assert self-check** (a branch, a loop, a parser, money, security, a new script). `loop-evals.md` B (no coverage regression) becomes a floor per change.
   - **A known-limit shortcut gets a `shortcut: <limit>, <when to upgrade>` comment.** ZAO's MISTAKES and board already hold "later"; a grep for `shortcut:` is the debt ledger with no new tool.
   Also fold upstream's own wording of the ladder: rungs 3 and 4 merged ("standard library or a platform feature, unless the project has its own; a house component beats a native widget"), which is the ZAO guard the July doc added, now agreed upstream.

3. **SET EXPECTATIONS at 10 to 15 percent, not 54.** Three independent measurements, three different workloads: JetBrains (80 paired SkillsBench tasks, Sonnet 5, 251 billed trials, USD 246.09): code **-15.4%** median (p=0.088), cost **-10.3%** (p=0.004), time -11%, no quality difference detectable at n=80. Marmelab (a multi-agent CRM builder loop, 4 tasks): -14% to -99% cost, biggest where the baseline over-built, and fewer developer-reviewer round trips. Chisle's single-turn no-tools runs (13 prompts x 2 seeds, Haiku 4.5): Ponytail billed **127%** of a bare model because its reasoning grew almost 5x on short prompts. The pattern across all three: the ladder pays where there is room to over-build (features, multi-agent loops, a new entity) and costs on short prompts with nothing to cut. For ZAO that means the rule earns its keep on ZOE features and lane builds, and the seat's short Q&A turns are where "decide the rung once at plan time" (already in the rule) matters.

4. **SKIP the band and the board for now.** Ponytail 5.3's band (a Claude Code mod above the prompt: task cost, tokens, agent time, reuse rate, tests passing; a local board in Ponytail's own config folder) needs Claude Code 2.1.290 or later and is a per-pane UI. ZAO's status line already carries ctx, usage limits and (since dotfiles #884, 2026-11-09) load; `zao-spend` and Orca's `diagnostics memory` carry cost and memory per lane. Revisit only if Zaal wants per-task cost in the bar; it is one `/plugin install`, reversible.

5. **SKIP Chisle as a plugin; INVESTIGATE its unused-tool-schema report, read-only.** Chisle (JayPokale/Chisle, MIT, 750 stars, pushed 2026-11-07) adds a PostToolUse hook that compresses tool output and a `npx chisle tools` report of tool schemas and skill descriptions you never call. Marmelab measured where tool tokens live on an agent loop: `Read` results are 90.6% of tool tokens and Chisle's hook excludes Read, Edit and Write by design, so its compression ceiling on our fleet is low. The schema report is a different matter: on the maintainer's Claude Code, unused tool schemas were about 5k tokens per request (15k with Artifact). The seat measured 147 MCP server processes on 2026-11-08 and has a trim card for Zaal's hand; a one-time read-only `npx chisle tools` run is the cheap way to size what the trim saves per request. Running it is Zaal's call (a new npm package, "ask first").

## Findings

### What changed in Ponytail since July (fetched 2026-11-09)

| Item | July 2026 (doc v1) | 2026-11-09 | Source |
|---|---|---|---|
| Stars | 89,290 | 187,712 (forks 10,411, 192 open issues, 100 contributors, last push 2026-10-29) | gh api, zao-research-snapshot |
| Version | v4.x | v5.3.3 (v5.0.0 on 2026-10-08, 163 commits since 2026-07-25) | gh releases, commits |
| Rules | 7-rung ladder | rewritten, about half as long: scope mapping before writing, the skipped/not-checked/risk closing lines, the test rule, `shortcut:` comments, rungs 3 and 4 merged with "a house component beats a native widget" | `AGENTS.md` at main |
| `/ponytail-review` | looked only for code to cut | reads the code the change touches, not just the diff; bugs, security, load, missing tests, speed, what to cut; found 100% of planted problems and 100% of problems outside the diff in the benchmark (no skill 87% and 78%) | README "The review, rebuilt" |
| `/ponytail-audit` | listed what to delete | whole-repo, ranked, "fix this first" | README |
| Band and board (5.3, 2026-10-16) | none | per-task cost, tokens, agent time, reuse rate, tests, in Claude Code 2.1.290+; local board | release v5.3.0 |
| Codebase map | none | a short map of what exists, injected at session start, so the agent reuses before it writes | release v5.0.0 |
| Licence | MIT | MIT, LICENSE file read: "MIT License, Copyright (c) 2026 DietrichGebert" | contents/LICENSE |

### Upstream's own numbers (Ponytail 5 benchmark, 2026-10-07)

Opus 5.5, headless Claude Code 2.1.288, 39 tasks (12 feature tickets on the FastAPI full-stack template, 18 surgical tasks with hidden checks, 9 open-scope builds), 5 runs each, 585 sessions, Bash disabled for every arm, fresh temp folder outside any git repo. Versus no skill: lines of code **-53%** [-63..-41], output tokens -45%, cost **-26%** [-36..-16], time -41%, turns -22%, cheaper on 30 of 38 tasks. Hidden checks: 87 of 90 vs 86 of 90, level. Tests where the logic needs one: 98% vs 68%. Mean cost per session: no skill $0.200, Ponytail 5 $0.142. Replies 30% shorter; a blind judge preferred Ponytail 5 over no skill 82 to 106 (not significant) and over Ponytail 4 110 to 67 (p=0.002), "the main reason in the judge's notes: Ponytail 5 ends with what it skipped or did not check." The author's own limits: Bash off means it measures what the agent writes, not how it debugs; the 21 non-hidden tasks measure size only.

### Independent measurements

| Who, when | Setup | Result | What it tells ZAO |
|---|---|---|---|
| JetBrains AI blog, Denis Shiryaev, 2026-07-29 (part 3 of a series; part 1 caveman -8.5%, part 2 rtk +7.6%) | 80 paired SkillsBench tasks, Sonnet 5 medium effort, Ponytail v4.8.4 ruleset injected byte-identical to its hook's output, every trial audited for contamination (100% treatment, 0% baseline), USD 246.09 | code **-15.4%** median (p=0.088); cost **-10.3%** (p=0.004, cheaper on 46 of 80); time -11%; no quality difference at n=80; **self-activation as a plain skill: 0 of 10** | the install path decides whether you get anything; a rules file is the injection path; expect a tenth, not a half |
| Marmelab (Bourlon and Piernot), 2026-08-27 and the r/ClaudeAI write-ups 2026-08-31 and 2026-09-16 | a multi-agent CRM builder (orchestrator, dev agents, reviewer) on real tickets, 4 paired tasks | hide a button -63.9%; add a field -14.0%; add multiple fields -98.8% (6.6M to 76.7k tokens); new entity -93.5%; fewer dev-reviewer round trips; caveman on the same loop cost +3% to +104% | on a loop like ZAO's lanes the saving is in turns, not prose; caveman is the wrong tool for a build loop |
| Chisle `docs/comparison.md`, re-measured 2026-10-12, tools off | 13 prompts x 2 seeds, Haiku 4.5, single turn | ponytail billed **127%** of a bare model (reasoning grew almost 5x), caveman 81%, Chisle 82%; every arm cost more than no tool on at least 12 of 26 cells | short prompts with nothing to cut are where the ladder backfires; that is the seat's Q&A turns, which the rule already exempts by deciding the rung once |
| Claude Code Guide (Bruniaux), 2026-09-30 tally | 3 third-party results collected | median cost -2.75%; stars 149k at that date | the honest cross-source median is small |
| Reddit, 6 threads read (r/ClaudeAI launch 2026-06-12, 609 points, 87 comments; r/ClaudeCode "Is Ponytail useful?" 2026-06-28; r/ClaudeAI 2026-06-28; r/ClaudeCode 2026-08-02 and 2026-08-15; r/codex 2026-07-30 on the JetBrains test) | user reports | split: "the worst experience was Ponytail, it takes shortcuts instead of fixing the problem"; "output is still verbose"; "I never hit my five-hour limit anymore (Opus, Max 20)"; the JetBrains numbers read as "not the alleged 50%" | the shortcut complaint is exactly what v5's "lazy about the solution, never about the change" and the test rule answer; adopt those lines, not the mode |

### How it sits against ZAO's stack now

| ZAO has today | Ponytail 5 equivalent | Gap |
|---|---|---|
| `code-restraint.md` (7 rungs, rung 2 over 3 and 4, safety never cut, decide once at plan time) | the ladder, now with the same guard upstream | none on the ladder |
| `loop-evals.md` F (evidence in the PR report) | "end every reply with what you skipped or did not check, and any risk" | ours binds PRs; theirs binds every reply |
| `loop-evals.md` B (test count after >= before) | "non-trivial logic leaves one small test or assert" | ours is a count, theirs is per change |
| `agent-loops.md` rule 3 (read live code before building) | "scope: list every place the change must reach; bug fix: grep every caller, fix the root once" | ours is the principle, theirs names the moves |
| MISTAKES.md, the board, `zao-mistake` | `shortcut:` comments and `/ponytail-debt` | a comment form at the point of the shortcut; a grep is the ledger |
| `zao-evaluate` (fresh-context, default-FAIL, red control) | `/ponytail-review` reads the code the change touches, not just the diff | ours is stronger on independence; theirs names "beyond the diff" as a check, which `zao-evaluate` already does by extract |
| status line (ctx, limits, load), `zao-spend`, `orca diagnostics memory` | the band and the board | per-task cost in the bar; not needed now |
| caveman (active) | none; caveman is prose, Ponytail is code | Marmelab: caveman cost more on a build loop; keep caveman for Q&A panes, not lanes |

### Ecosystem now

| Project | Stars 2026-11-09 | Last push | Note |
|---|---|---|---|
| DietrichGebert/ponytail | 187,712 | 2026-10-29 | the source |
| JayPokale/Chisle | 750 | 2026-11-07 | prose + code + tool-output compression + schema trim; publishes losing runs; MIT (LICENSE read) |
| ilindaniel/ponytail-lite | 244 | 2026-07-26 | one-file AGENTS.md; dormant since July |
| oratelecom/tokenwar | 71 | 2026-09-29 | a 7-tool stack (caveman, rtk, context tools) plus a project wiki |
| AbdullahHameedKhan/karpathy-ponytail-skills | 64 | 2026-06-25 | dormant |
| AyanbekDos/ponystack | 20 | 2026-06-18 | dormant; the July "blueprint" did not grow |
| anshaneja5/scalpel | 12 | 2026-07-03 | dormant |

The July ecosystem bets (ponystack, scalpel, lite) all stopped moving within a month. The live rival is Chisle, which started as a mashup of caveman and Ponytail and credits both.

## Also See

- [Doc 441](../441-everything-claude-code-integration/) - the ECC rules integration (the "pin rules into .claude/rules" pattern this doc uses)
- [Doc 154](../154-skills-commands-master-reference/) - skills and commands master reference
- [Doc 928](../../agents/928-agent-loop-best-practices/) - agent-loop best practices (the elegance check the ladder sharpened)
- [Doc 2649](../2649-rules-history/) - rules history; `archive/code-restraint.md` holds the July rationale
- [Doc 2700](../2700-agents-md-vox-ux-dx-ax-lines/) - AGENTS.md line conventions, where an upstream-style closing line would be specified for ZOE
- [Doc 1028](../1028-rdxmin-claude-code-token-optimizer/) - an earlier token-optimizer look
- Tracker: research-doc:2081 review card (done 2026-07-28)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR to ZAOOS `.claude/rules/code-restraint.md`: add the five Ponytail 5 lines (scope before writing; skipped/not-checked/risk closing lines; bug fix greps callers and fixes the root once; non-trivial logic leaves one small test; `shortcut:` comment form) and merge rungs 3 and 4 with the house-component wording; held, Zaal merges | seat (orchestrator2), merge Zaal | PR | 2026-11-12 |
| Mirror the same five lines into the dotfiles global CLAUDE.md (the one every Mac session loads) or a global rule, so they bind beyond ZAOOS; held, Zaal merges | seat, merge Zaal | PR | 2026-11-12 |
| Decide: run `npx chisle tools` once, read-only, to size unused tool-schema tokens per request against the MCP trim card; A yes (his shell), B skip | @Zaal | Decision | 2026-11-12 |
| Measure the rule on the fleet: `zao-spend --days 7` cost per merged PR before and after the rule PR lands, noted in a comment on this doc; expect about 10%, not 54% | seat | Measurement | 2026-11-23 |
| Re-validate this doc or mark superseded | seat | Re-research | 2026-12-09 |

## Sources

- [DietrichGebert/ponytail README at main](https://github.com/DietrichGebert/ponytail) - fetched via gh api 2026-11-09, 231 lines read [FULL]
- [DietrichGebert/ponytail AGENTS.md at main](https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md) - the Ponytail 5 compact ruleset, 32 lines [FULL]
- [Release v5.0.0, 2026-10-08](https://github.com/DietrichGebert/ponytail/releases/tag/v5.0.0) and [v5.3.0, 2026-10-16](https://github.com/DietrichGebert/ponytail/releases/tag/v5.3.0) - release bodies via gh api [FULL]
- [benchmarks/results/2026-10-07-agentic.md](https://github.com/DietrichGebert/ponytail/blob/main/benchmarks/results/2026-10-07-agentic.md) - setup, results, correctness, tests, replies, 186 lines [FULL]
- [DietrichGebert/ponytail LICENSE](https://github.com/DietrichGebert/ponytail/blob/main/LICENSE) - "MIT License, Copyright (c) 2026 DietrichGebert", file read [FULL]
- [JetBrains AI blog: Ponytail Skill for Claude Code, does it really cut agent code by 54%?, Denis Shiryaev, 2026-07-29](https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/) - raw HTML fetched with curl and stripped, findings 1 to 4 read [FULL]; its HN thread (item 49094075, 4 points, 1 comment) [FULL]
- [Marmelab: Cutting the Coding Agent Bill, 5 plugins under test, 2026-08-27](https://marmelab.com/blog/2026/08/27/which-agent-based-plugin-should-you-use-in-2026.html) - via exa highlights: the tool-token table, the Ponytail and caveman result tables, the conclusion [PARTIAL - the Headroom and LSP sections were not read in full]
- [r/ClaudeAI, Marmelab: I tested 3 Claude Code plugins to reduce costs, 2026-08-31](https://www.reddit.com/r/ClaudeAI/comments/1w3hxt1/i_tested_3_claude_code_plugins_to_reduce_costs/) and [the 2026-09-16 follow-up](https://www.reddit.com/r/ClaudeAI/comments/1whsbju/i_tested_3_more_claude_code_plugins_to_cut_costs/) - via exa highlights [PARTIAL - comment trees not read]
- [r/ClaudeAI launch post, 2026-06-12, 609 points](https://www.reddit.com/r/ClaudeAI/comments/1u3k2ed/i_gave_claude_code_a_lazy_senior_dev_mode_and_it/), [r/ClaudeCode: Is Ponytail useful?, 2026-06-28](https://www.reddit.com/r/ClaudeCode/comments/1uhkper/is_ponytail_useful/), [r/ClaudeAI: how reliable are your agents, 2026-06-28](https://www.reddit.com/r/ClaudeAI/comments/1uhparm/be_honest_guys_how_reliable_are_your_agents_for/), [r/ClaudeCode: Ponytail, 2026-08-02](https://www.reddit.com/r/ClaudeCode/comments/1vdvw83/ponytail/), [r/ClaudeCode: Ponytail full and caveman full, 2026-08-15](https://www.reddit.com/r/ClaudeCode/comments/1vos14t/is_ponytail_full_and_caveman_full_really_worth_it/), [r/codex: JetBrains evaluation, 2026-07-30](https://www.reddit.com/r/codex/comments/1vaeisk/jetbrains_empirical_evaluation_of_ponytail_and_rtk/) - via exa highlights with top comments [PARTIAL - full comment trees not read; the Reddit fetcher has no OAuth credentials on this Mac]
- [JayPokale/Chisle README](https://github.com/JayPokale/Chisle) - via gh api, 274 lines, benchmarks and compression table read [FULL]; [docs/comparison.md](https://github.com/JayPokale/Chisle/blob/main/docs/comparison.md) via exa highlights, the 2026-10-12 re-measure table [PARTIAL]; [I publish the benchmarks my AI coding tool loses, 2026-09-27](https://jaypokale.me/writing/chisle-benchmarks-it-loses) via exa [PARTIAL]; [dev.to comparison, 2026-10-23](https://dev.to/jaypokale/caveman-vs-ponytail-vs-chisle-why-id-pick-chisle-for-claude-code-46lf) via exa [PARTIAL]
- [Claude Code Guide: token-saving tools, claims and third-party studies, Florian Bruniaux, 2026-09-30](https://cc.bruniaux.com/token-savings/) - the Ponytail row via exa [PARTIAL]
- [postcursors.dev: Saving tokens, the counter says 45%, the invoice 2%, 2026-08-12](https://postcursors.dev/en/dispatches/token-optimization-illusion/) - the announced vs measured table via exa [PARTIAL]
- [kRouter: Caveman vs Ponytail, 2026-10-05](https://krouter.kodelyth.com/blog/caveman-vs-ponytail-output-tokens) - the outside-measurement bullets via exa [PARTIAL]
- GitHub repo facts for ponytail-lite, ponystack, scalpel, tokenwar, karpathy-ponytail-skills - gh api 2026-11-09 [FULL]
- Escalation note: the PARTIAL sources above are secondary and corroborating; every load-bearing number in this doc (stars, versions, the v5 benchmark, the JetBrains findings, the Chisle re-measure table, Marmelab's four tasks) was read from a FULL source or from the quoted table of the page itself. Each PARTIAL stays PARTIAL for the reason in its own bracket above, and none carries a number this doc acts on.
