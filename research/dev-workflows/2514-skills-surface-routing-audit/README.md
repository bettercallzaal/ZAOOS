---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: 2496, 1485, 946, 507, 2411, 2513
original-query: "why dont we review all skills and more https://www.reddit.com/r/claudeskills/comments/1wktyuu/agent_dispatcher_automatically_routes_tasks_to/ lets properly /zao-research and deep resarch this"
tier: DEEP
---

# 2514 - The routed skill surface: 428 skills, 93 audited, and what the other 335 do

> **Goal:** Doc 2496 audited this estate's skills three days ago and concluded the token argument was settled. It measured 93 skills. The router sees 428. This doc measures the surface the router actually reads, finds what the 2496 instrument could not see by construction, and tests the Reddit "Agent Dispatcher" thesis - that more skills means worse routing - against our own numbers rather than against its author's.

## Key Decisions

| # | Decision | Because | Evidence |
|---|---|---|---|
| 1 | **Re-scope `zao-skill-audit` to every source the router reads, not `~/.claude/skills` alone.** | Its `SKILLS_DIRS = [Path.home()/".claude/skills"]` is one directory, one level. That single line is why doc 2496 reported 93 skills and 7,939 always-on tokens when the routed surface is 428 skills and ~28,782 characters' worth of name plus description. | `bin/zao-skill-audit:35`; `orca skills installed --json`, 2026-09-20 |
| 2 | **Stop routing hidden directories under `~/.claude/skills`.** | 22 of the 126 SKILL.md files there sit in hidden dirs: a 21-file `.agents/` mirror of the whole gstack bundle, and a `.trash/` holding a deleted skill that is still routed. The mirror is where the only over-cap description in the estate lives, at 1,966 characters. | this doc, Findings 3 and 3a |
| 3 | **Do not archive on idleness. Archive on ambiguity.** | 365 of 428 skills have never been invoked and cost about 70 tokens each while idle. 13 duplicated names carry divergent descriptions and cost a wrong route. Doc 2496 reached the same conclusion on the smaller denominator and it survives the larger one. | this doc, Findings 2 and 3; doc 2496 decision 3 |
| 4 | **Treat the plugin marketplace cache as a pinned dependency and say which pin.** | Our `everything-claude-code` clone supplies 183 of 428 routed skills and sits 2,796 commits behind its origin. It is not a dead project - upstream pushed today - it is our copy that is frozen at 2026-04-19. | `git rev-list --count HEAD..origin/main`, 2026-09-20 |
| 5 | **Gitignore `.gstack/` in zorca.** | `browse` writes a network log into every repo it runs in. Eleven of the twelve repos carrying one already ignore it. zorca is the exception, so a `git add -A` there would commit it. | `git check-ignore` across 12 repos, 2026-09-20 |
| 6 | **Adopt the dispatcher post's design rule, not its evidence.** | "Skills should generally be narrower than agents" matches what our own duplicate-name data shows. Its routing numbers do not support the headline: the author states in the thread that his baseline "is a simple keyword matcher against the repo's role/skill/tool catalog, not Claude without my code." | Reddit thread, author reply; `docs/jev.md` in the repo |

## Findings

### 1. The instrument was the finding, twice, in the first ten minutes

Two measurements in this audit came back near-empty and both were the tool.

`find ~/.claude/skills -iname SKILL.md` returned **0**. `~/.claude/skills` is a symlink into `~/zaal-dotfiles/claude/skills` and `find` does not follow symlinks without `-L`. The same omission then reported that eight skills doc 1485 flagged for archive were `GONE` when all eight are live. A positive control caught it: `zao-research` must be found, it was not, so the filter was wrong rather than the estate empty. With `-L` the count is 77 at depth 3 and 127 at depth 5.

This is the CLAUDE.md rule paying for itself in the same session that carries it: before believing a filter that found nothing, feed it something it must find.

The third instance is structural rather than mine. `zao-skill-audit` scans `SKILLS_DIRS = [Path.home()/".claude/skills"]`, top level only. It cannot see plugin skills, it cannot see the nested `gstack` sub-library, and nothing in its output says so. Doc 2496's "114 skills" and "93 skills seen" are correct readings of that directory and are not the routed surface.

### 2. What the router actually sees

`orca skills installed --json`, 2026-09-20:

| | count |
|---|---|
| skills installed | **428** |
| distinct names | 375 |
| duplicated names | 39 |
| sources | 10 |

By source label:

| skills | source |
|---|---|
| 183 | Claude plugin everything-claude-code |
| 116 | Claude home |
| 71 | Hermes home |
| 20 | Codex plugin cache |
| 14 | Claude plugin superpowers |
| 7 | Agent skills home |
| 6 | Codex home bundled |
| 5 | Claude plugin caveman |
| 3 | Antigravity home |
| 3 | Claude plugin oh-my-mermaid |

Doc 2496 audited the 116, and only the top level of them. **312 of 428 routed skills, 73 percent, have never been audited by anything in this estate.**

The always-on text is 115,130 characters of name plus description, about 28,782 tokens at four characters per token. That is 3.63 times the 7,939 doc 2496 recorded. Both numbers are honest readings of their own denominators.

One qualification this doc will not paper over: 28,782 tokens is the **size of the description text orca can enumerate**, not a measured injection into any one session's context. Different hosts load different subsets, and this session's own reminder lists only user-invocable skills. What a given harness resident-loads is **UNKNOWN** here; measuring it needs a token count taken inside a session, which this audit did not do.

The `skills.20260605-235509.bak` directory, 179MB and 73 SKILL.md files, is **not** counted. `quad` exists only there and is absent from orca's listing, which is the control that establishes it.

### 3. The real cost is ambiguity, and it has a name

Of 39 duplicated names, 26 are identical copies, which are harmless. **13 carry divergent descriptions**, which is a genuine fork in the route:

| name | copies | distinct descriptions | sources |
|---|---|---|---|
| `pdf` | 5 | 3 | Claude home x3, Codex plugin cache, Hermes home |
| `docx` | 4 | 2 | Claude home x3, Hermes home |
| `skill-creator` | 4 | 2 | Claude home x3, Codex home bundled |
| `xlsx` | 4 | 2 | Claude home x3, Hermes home |
| `computer-use` | 3 | 3 | Agent skills home, Claude home, Hermes home |
| `deep-research` | 2 | 2 | Claude home, everything-claude-code |
| `systematic-debugging` | 2 | 2 | superpowers, Hermes home |
| `test-driven-development` | 2 | 2 | superpowers, Hermes home |

Seven pairs of **differently named** skills have descriptions more than 72 percent similar. The worst is not close:

```
0.988  browse  <->  gstack
```

That pair is **not** the primary `gstack` skill. `~/.claude/skills/gstack/SKILL.md` carries a 363-character description and is under every cap. The 1,966-character entry is a second copy at `~/.claude/skills/gstack/.agents/skills/gstack/SKILL.md`, and it is the one that opens with `browse`'s text word for word:

> "Fast headless browser for QA testing and site dogfooding. Navigate any URL, interact with elements, verify page state, diff before/after actions, take annotated screenshots, check responsive layouts, test forms and uploads, handle dialogs, and assert element states. ~100ms per command."

So the skill presenting itself to the router as a headless browser is `gstack`, a workflow product doc 1485 voted to ARCHIVE on 2026-07-18. Measured over 11,293 transcripts, `browse` has 23 invocations and `gstack` has 0, so the router has been picking correctly. The exposure is that it has had no help doing so.

Against the documented 1,024-character `description` cap, **exactly one skill of 428 exceeds it, and it is `gstack`**. Doc 2496 checked against a 500-character guidance and reported zero exceeding, which is true of the 114 it could see; 35 of 428 exceed 500. The 1,024 figure is the enforced limit in Anthropic's spec and is the one that matters, because a real bundle was rejected outright for breaching it (source 12).

### 3a. Twenty-two of the 126 local SKILL.md files are in hidden directories, and they route

This was found while preparing the cleanup, after the first version of this doc was written, and it corrects the version above (see the CORRECTION note at the end).

`~/.claude/skills` holds **126 SKILL.md files**; orca routes **116** of them. Hidden directories inside that tree:

| path | SKILL.md | what it is |
|---|---|---|
| `gstack/.agents/skills/` | 21 | a complete mirror of the gstack bundle. Directories are prefixed `gstack-*`, but the `name:` frontmatter keeps the ORIGINAL name, so each one routes under the same name as its twin. |
| `.trash/1789673156360-65582-Qqg9lG/` | 1 | `setup-writing-style`, in a trash folder, **and routed** (454-character description in orca's listing). |

The mirror is why `careful`, `guard`, `freeze`, `unfreeze` and 17 others each appear exactly twice under "Claude home" while existing at what looked like one path. It is also where the estate's only over-cap description lives.

A deleted skill that still routes is the sharper of the two. Deletion moved the directory; it did not remove it from the surface the router reads. Nothing in `orca skills installed` marks it as trashed.

Also inside the live skills tree: `gstack/node_modules` at **22MB**, and `~/.claude/skills/.gstack` at 104KB. The gstack directory is **138MB** in total, inside the tree that is symlinked into `~/zaal-dotfiles` and is therefore live config for every lane on this Mac.

### 3b. The four safety skills live inside the bundle doc 1485 voted to archive

Doc 1485 marked `gstack` **ARCHIVE** and, in the same table, marked `careful`, `guard`, `freeze` and `unfreeze` **KEEP**, with `careful` annotated "Operational safety tool - do not archive."

Measured 2026-09-20: **all four exist only at `~/.claude/skills/gstack/<name>/` and its `.agents` mirror. There is no top-level copy of any of them.**

| skill | top-level copy | invocations |
|---|---|---|
| `careful` | no | 0 |
| `guard` | no | 0 |
| `freeze` | no | 0 |
| `unfreeze` | no | 0 |
| `browse` | yes | 23 |
| `review` | yes | 8 |
| `design-review` | yes | 2 |

So executing doc 1485 as written would have removed the destructive-command guardrails it told the reader to keep. The doc treated a 22-skill bundle as one skill. This is the second way that July plan could not have been run correctly, and it is a worse one than the `/home/zaal/` path, because the path error fails loudly and this one does not.

### 4. Doc 1485's July verdicts were never executed, and could not have been

Nine skills were marked ARCHIVE on 2026-07-18. Re-measured 2026-09-20 with `-L`:

| skill | live on the routed path | in orca's listing | invocations, 11,293 transcripts |
|---|---|---|---|
| `claude-is-tripping` | yes | yes | 0 |
| `drunk-claude` | yes | yes | 0 |
| `gstack` | yes | yes | 0 |
| `gstack-upgrade` | yes (nested) | yes | 0 |
| `office-hours` | yes (nested) | yes | 0 |
| `find-skills` | yes | yes | 0 |
| `setup-browser-cookies` | yes (nested) | yes | 1 |
| `learned` | yes, **empty directory** | no | 0 |
| `quad` | no, backup only | no | 0 |

**Eight of nine are still live and still routable, two months later.** The cause is visible in the doc itself: its execution plan runs `mkdir -p /home/zaal/.claude/_archived-skills`, a Linux path that does not exist on this Mac. The plan was unrunnable as written, and the doc's status has said `research-complete` ever since.

`learned` is an empty directory with no SKILL.md, which doc 1485 also noted in July. orca skips it correctly. `find-skills` and `learned` were both described as empty then and one still is.

### 5. Idleness is cheap and the long tail is fine

Across **11,293 transcripts** (9.7GB, 9,843 modified in the last 30 days), the `Skill` tool was called **874 times** across **63 distinct skills**.

| skill | invocations |
|---|---|
| `zao-research` | 196 |
| `handoff` | 72 |
| `clipboard` | 70 |
| `quick-grill` | 57 |
| `artifact-design` | 55 |
| `superpowers:brainstorming` | 49 |
| `loop` | 44 |
| `deep-research` | 42 |
| `meeting` | 34 |
| `browse` | 23 |

Doc 2496 measured 62 of 93 invoked over 3,986 transcripts. This run sees 63 distinct skills over 11,293. The number of skills anyone actually reaches for barely moved while the installed surface grew to 428.

**The 63-of-428 ratio must not be read as "365 dead skills."** A large share of the plugin entries are subagents, reached through the `Agent` tool rather than `Skill`, so counting them with a `Skill`-only filter would repeat exactly the error Finding 1 is about. Measured separately: **2,086 `Agent` calls across 22 distinct subagent types.** The `everything-claude-code` agents account for roughly 17 of those 2,086, under one percent, spread over 8 of its ~40 agent types. So the plugin is genuinely lightly used, but it is lightly used at 0.8 percent of agent calls, not at zero.

### 6. The plugin cache is a pin nobody set

Every marketplace clone under `~/.claude/plugins/marketplaces/` last committed in April 2026. My first reading of that was "the ecosystem is stale." Checking upstream corrected it:

| marketplace | origin | our clone | upstream pushed | stars | licence |
|---|---|---|---|---|---|
| everything-claude-code | affaan-m/everything-claude-code | 2026-04-19 | **2026-09-20** | 263,396 | MIT |
| awesome-claude-plugins | ComposioHQ/awesome-claude-plugins | 2026-04-21 | 2026-07-26 | 1,973 | **none, all rights reserved** |
| caveman | JuliusBrussee/caveman | 2026-04-12 | - | - | - |
| oh-my-mermaid | oh-my-mermaid/oh-my-mermaid | 2026-04-07 | - | - | - |

`git rev-list --count HEAD..origin/main` on our everything-claude-code clone: **2,796 commits behind.** The 183 skills it contributes, 43 percent of the routed surface, are an April snapshot of a repo that shipped 2,796 commits since. Nothing in any listing says so.

The star and fork counts above come from the GitHub API, read twice but through the same API both times, so they are one source and not two. 263,396 stars on a repo created 2026-01-18 is high enough to be worth a sceptical eye before it is quoted anywhere outside this doc.

`awesome-claude-plugins` carries **no licence at all**, which means all rights reserved, alongside 352 open issues. That is a redistribution question, not a quality one, and it is flagged rather than resolved here.

### 7. `browse` writes into twelve repos, and one of them does not ignore it

`.gstack/browse-network.log` exists in 12 repos under `~/Documents`, including finance-hq. Contents were not read. Tracked status only:

- **0 of 12 are currently tracked by git.**
- **11 of 12 are gitignored. zorca is not**, so a `git add -A` in the repo I own would commit a browser network log.
- zignite has 3 commits touching `.gstack*` in its history, so the pattern has been committed somewhere before. zignite is not mine; this is reported, not acted on.

The fix in zorca is one gitignore line and is a two-way door.

### 8. The Agent Dispatcher post, read as a source

The post (r/claudeskills, 2026-09-19, u/drankthedew, score 1) argues that more agents, skills and instructions "don't automatically mean better results" and can introduce "context bloat, overlapping instructions, bad routing, unnecessary tool access, and conflicting guidance," and that the goal is to "load less, but load the right things." Its design rule is "skills should generally be narrower than agents."

The code is real: `nahid-sparktales/agent-dispatcher`, MIT, created 2026-09-19, last push 2026-09-20, **34 stars**, 0 forks, 0 open issues. It carries `decision/`, `catalog/`, `skills/`, `recipes/`, an `evals/` tree with committed fixtures, and a test suite. It is one day old.

**The headline routing numbers do not establish what the headline implies, and the author says so in his own thread.** Asked for the baseline, he replied that "the 'baseline' is a simple keyword matcher against the repo's role/skill/tool catalog, not Claude without my code. The Claude column also uses the dispatcher's routing instructions and catalog... It doesn't establish that the dispatcher outperforms plain Claude on actual tasks. I haven't measured that comparison yet." The repo's `docs/jev.md` is equally candid, listing "no end-to-end comparison" under "What this does not establish," and reporting 136 to 143 out of 162 across five re-runs rather than a fixed score.

The sharpest comment is the right one: u/EvalRaccoonDev asked for "the host's own routing, every skill installed, no dispatcher" as the baseline, which is the only comparison that would answer the question. That is also the comparison this estate is positioned to run, since we have the every-skill-installed condition already, at 428.

**Jev**, which the post names, is a real third-party product: a decision-only "System One" model from TypeSafe at `api.typesafe.ai/v1/systemone`, listed on OpenRouter. The post's own conclusion is that Claude-style routing beat it, so Jev stays optional.

### 9. What the literature supports, and where it is silent

The mechanism the post asserts is measured, but for **tool schemas**, not for skills. RAG-MCP (arXiv:2505.03275) reports tool-selection accuracy of **13.62 percent** unfiltered against **43.13 percent** with retrieval filtering. "How Many Tools Should an LLM Agent See?" (arXiv:2605.24660, 2026-05-23) reports 90.3 percent coverage from an average of 7 tools versus 90.8 percent from 50, and argues the right count is query-dependent rather than a fixed cap.

Two things cut against reading that straight across to skills:

- **Skills and tool schemas are different mechanisms.** Anthropic's spec loads only `name` plus `description` at startup, about 100 tokens per skill, with the body loaded on trigger and bundled files only on access. Tool schemas are typically resident in full. The bloat measured in the tool literature is not automatically the bloat a skills library carries.
- **The sources disagree about whether retrieval fixes it.** "The 99% Success Paradox" (arXiv:2605.18857) reports that retrieval systems scoring near 99 percent on top-k containment can still produce task success indistinguishable from random selection. Retrieval accuracy is not end-task accuracy, and this doc does not average the two results into one.

**No benchmark was found measuring Agent-Skills-style name-and-description dispatch accuracy at scale, 50 skills against 500.** That number is **UNKNOWN**. The searches run were arXiv, GitHub and HN Algolia; Semantic Scholar and ACL Anthology were not searched, so this is a bounded gap and not a proof of absence. Likewise, no benchmark was found for classify-to-specialist-role routing specifically; RouterBench (arXiv:2403.12031) routes between **models**, which is a different question.

The one hard production limit that is not in dispute: a 44-skill bundle was rejected by Claude Cowork outright, and the cause was a single `description` at roughly 2,241 characters against the documented 1,024 cap (coleschaffer/dtc-copywriting-skills#1). That is the failure mode our hidden-mirror `gstack` entry is one skill away from, at 1,966.

## Sources

Local measurement, all taken 2026-09-20 on this Mac:

1. `orca skills installed --json` - 428 skills, sourceKind/sourceLabel breakdown, description lengths. FULL.
2. `find -L ~/.claude/skills -maxdepth N -iname SKILL.md` - 56/77/106/127 by depth. FULL.
3. `rg -o '"skill":"..."' ~/.claude/projects/` over 11,293 jsonl transcripts - 874 invocations, 63 distinct. FULL.
4. `rg -o '"subagent_type":"..."'` over the same corpus - 2,086 Agent calls, 22 types. FULL.
5. `bin/zao-skill-audit:35` - `SKILLS_DIRS = [Path.home()/".claude/skills"]`. FULL.
6. `git rev-list --count HEAD..origin/main` in `~/.claude/plugins/marketplaces/everything-claude-code` - 2,796. FULL.
7. `git check-ignore -v .gstack` across 12 repos under `~/Documents`; `git ls-files` and `git log --all --` for tracked status. FULL, contents not read.
8. `~/.claude/skills.20260605-235509.bak` - 73 SKILL.md, 179MB, absent from orca's listing (`quad` control). FULL.

Primary external sources:

9. Reddit, r/claudeskills, "Agent Dispatcher..." 2026-09-19, u/drankthedew, score 1, 9 comments - https://www.reddit.com/r/claudeskills/comments/1wktyuu/agent_dispatcher_automatically_routes_tasks_to/ - FULL via Arctic Shift (`zao-fetch-reddit.sh`; Reddit OAuth is BLOCKED on this machine, exact message "No OAuth credentials at /Users/zaalpanthaki/.zao/private/reddit.env").
10. github.com/nahid-sparktales/agent-dispatcher - MIT, created 2026-09-19, pushed 2026-09-20, 34 stars, 0 forks, 0 issues - FULL via `gh api`, verified independently of the subagent that found it.
11. Anthropic, Agent Skills overview - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview - three-level progressive disclosure, ~100 tokens per skill at level 1, `description` capped at 1,024 characters, `name` at 64 - FULL.
12. Anthropic Engineering, "Equipping agents for the real world with Agent Skills", 2025-10-16 - design rationale, contains no ablation - FULL. STALE, over 6 months.
13. coleschaffer/dtc-copywriting-skills#1, opened 2026-05-28 - 44-skill bundle rejected; cause was a ~2,241-character description against the 1,024 cap - FULL via `gh issue view`.
14. dotnet/skills#35, opened 2026-02-18 - argues **against** many narrow skills, for one consolidated skill with embedded resources, "we risk overwhelming both users and agent context windows" - FULL. This contradicts the dispatcher post's "skills should be narrower than agents" and both are recorded.
15. Gan and Sun, "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via RAG", arXiv:2505.03275, 2025-05-06 - 13.62 percent to 43.13 percent tool-selection accuracy - PARTIAL, abstract and metadata. STALE.
16. Repantis et al., "How Many Tools Should an LLM Agent See? A Chance-Corrected Answer", arXiv:2605.24660, 2026-05-23 - 90.3 percent coverage at 7 tools vs 90.8 at 50; adaptive beats any fixed cap - PARTIAL.
17. Repantis et al., "The 99% Success Paradox", arXiv:2605.18857, 2026 - near-perfect retrieval can equal random selection on end-task success - PARTIAL.
18. Chroma, "Context Rot", 2025-07-14, Hong/Troynikov/Huber - 18 models degrade non-uniformly with input length below the window limit; about raw tokens, not skill count - PARTIAL. STALE.
19. ShishirPatil/gorilla discussion #606, 2024-08 - GPT-4-1106-Preview at 85.65 percent prompted vs 79.65 percent native function-calling, per BFCL's maintainer - FULL. STALE, over a year.
20. Hu et al., "RouterBench", arXiv:2403.12031, 2024-03 - 405k outcomes, 11 models, 7 tasks; routes between **models**, not roles - PARTIAL. STALE.
21. Armin Ronacher, "Agents are hard", 2025-11-21 - practitioner argument for minimal CLI tools over large MCP toolsets; opinion, not measurement - FULL. STALE.
22. HN 45607117, "Claude Skills", 2025-10-16, 816 points / 427 comments, id returned by the Algolia API - PARTIAL, metadata only, comment tree not read.
23. TypeSafe "Jev" System One model, `api.typesafe.ai/v1/systemone`, cross-checked against the OpenRouter listing - PARTIAL.
24. github.com/affaan-m/everything-claude-code and ComposioHQ/awesome-claude-plugins, `zao-research-snapshot` plus `gh api`, 2026-09-20 - FULL, single-source caveat noted in Finding 6.
25. r/claudeskills comment thread by u/EvalRaccoonDev linking https://engineering.uipath.com/measuring-skill-activation-across-agents-is-harder-than-it-looks-eada767f7047 - skill-activation measurement over 20 skills - PARTIAL, linked from the thread, not fetched.

FAILED: Reddit native OAuth, every automated path, "No OAuth credentials at ~/.zao/private/reddit.env". Arctic Shift substituted and is the only working route as of 2026-09-20.

Not verified, listed as leads only, do not cite: dsiddharth2/plug#36, pierceboggan/triage-test#519, lessweb/deepcode-cli#224, mattgierhart/PRD-driven-context-engineering#54.

## Next Actions

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | Stop routing hidden dirs under `~/.claude/skills`: the 21-file `gstack/.agents/` mirror and the routed `.trash/` entry. Raise with the skills owner before moving anything, since the tree is live config for every lane | zorca proposes, Zaal decides | 2026-09-22 |
| 2 | Add `.gstack/` to zorca's `.gitignore` | zorca | 2026-09-22 |
| 3 | Re-scope `zao-skill-audit` to every source `orca skills installed` reports, and make it print the source count it scanned so an exclusion cannot grow quietly | zorca | 2026-09-26 |
| 4 | Re-open doc 1485: its execution plan targets `/home/zaal/`, which does not exist here. Either fix the paths and run it, or mark the eight live skills KEEP with a reason | zorca | 2026-09-27 |
| 5 | Decide the plugin-cache pin: update `everything-claude-code` from 2,796 commits behind, or record the April pin deliberately | Zaal decides | 2026-09-30 |
| 6 | Measure the resident description cost inside a live session, which this doc lists as UNKNOWN | zorca | 2026-10-03 |
| 7 | Raise the `awesome-claude-plugins` licence question (none, all rights reserved) before anything from it is redistributed | Zaal decides | 2026-10-03 |

## Also See

- `dev-workflows/2496-claude-skills-mechanisms-measured` - the three-day-old audit this one re-scopes. Its findings hold on the larger denominator; its numbers were read through a one-directory instrument.
- `dev-workflows/1485-skills-archive-audit-jul2026` - the July verdicts, eight of nine unexecuted.
- `dev-workflows/2513-orca-ade-capabilities` - what else orca can do, including `terminal wait`.
- `dev-workflows/946-zao-claude-code-kit` - the 60-skill era this grew out of.
- `dev-workflows/507` - "no more than 3 skills without measurable lift", the rule the estate grew past.
- Tracker task src=research-doc:2496, status todo, due 2026-09-20 - the review that surfaced this.

## CORRECTION, 2026-09-20, after first publication

The first version of this doc said "`gstack`'s description is 1,966 characters and opens with `browse`'s text word for word," and Key Decision 2 said to fix that description.

**Both the location and the fix were wrong.** `~/.claude/skills/gstack/SKILL.md` carries a **363-character** description and breaches no cap. The 1,966-character entry belongs to `~/.claude/skills/gstack/.agents/skills/gstack/SKILL.md`, a hidden mirror copy.

The measurable claim survives: exactly one of 428 routed descriptions exceeds the documented 1,024-character cap, at 1,966, and it is a `gstack` entry. What changes is what to do about it. Editing the skill would not have touched the offending file, and would have left 21 duplicate routed entries and a routed trash folder in place.

**Cause:** the first pass read orca's listing, which reports a name and a description but not a path, and I attributed the longer of two same-named entries to the file I had on disk. A listing that does not carry a path cannot answer "which file is this," and I reported its answer as though it had. That is the `surface-cannot-report-state` shape, logged the same day, third instance in this one audit.

Findings 3a and 3b were added as a result, and Next Action 1 was rewritten. No other number in this doc changed.
