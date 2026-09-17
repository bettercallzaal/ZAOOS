---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-17
superseded-by:
related-docs: 507, 2467, 552, 137, 2411, 2276
original-query: "/zao-research claude skills"
tier: STANDARD
---

# 2496 - Claude skills: which mechanisms held when measured

> **Goal:** The library already holds thirteen docs on the skills ecosystem and on how to write a skill. None asks whether the skills we ship actually work. This one measures that, over the 48 hours in which three agents produced twelve failures, and answers the uncomfortable question a skills library should ask itself: how many of those would a skill have prevented.

## Key Decisions

| # | Decision | Because | Evidence |
|---|---|---|---|
| 1 | **Stop paying for compliance with prose. Put the rule in a script.** | Measured in this estate: honor-system rules run 3 to 40 percent compliance, structurally enforced ones near 100. | `claude/skills/clipboard/SKILL.md` own notes; four PRs today converted rules to checks |
| 2 | **The token argument is settled here. Stop optimising it.** | The always-on cost of 114 skills is ~7,939 tokens, 1.8 percent of the 437,630-token corpus, because a body loads only when used. Zero descriptions exceed the 500-character guidance. | measured 2026-09-17, `~/.claude/skills/*/SKILL.md` |
| 3 | **Audit skills for WRONG INSTRUCTIONS, not for unused ones.** | 31 of 93 skills have never been invoked across 3,986 transcripts and cost nothing while idle. One skill with a wrong verification step cost a whole mutation run. | `zao-skill-audit`; doc 2276 |
| 4 | **Every verification step names the surface that can answer it.** | Nine of ten failures in eight hours were one shape: a surface was checked that could not report the state asked about. | `claude/instruments.md`, 18 claims, four merged PRs |
| 5 | **A lesson recorded in a comment must become a test.** | 140 executables, 50 record a lesson, only 23 carried a test. A documented trap recurred six hours after it was written up. | `bin/zao-lesson-has-test`, census 2026-09-17 |

## Findings

### 1. The ecosystem's framing is about discovery and cost. Neither is our binding constraint.

Anthropic's design is that a skill's body "loads only when it's used, so long reference material costs almost nothing until you need it", and the harness reads only the frontmatter at session start. Simon Willison's write-up, the highest-signal community source on the feature (738 points, 370 comments), puts the same point as "each skill only takes up a few dozen extra tokens, with the full details only loaded in should the user request a task that the skill can help solve".

Measured against our own library on 2026-09-17, that holds exactly:

| | chars | approx tokens | when paid |
|---|---|---|---|
| name + description, 114 skills | 31,756 | 7,939 | every session |
| all skill bodies | 1,750,520 | 437,630 | only on use |

The always-on tax is 1.8 percent of the corpus, and not one description exceeds the 500-character guidance. The official troubleshooting page covers a skill not triggering, triggering too often, and descriptions being cut short. Every one of those is a DISCOVERY problem. None of our twelve failures was a discovery problem.

### 2. Usage is long-tailed, and that is fine

`zao-skill-audit` over 3,986 transcripts: 93 skills seen, 62 invoked at least once, 31 never invoked. The most-used are `zao-research` (138), `handoff` (68), `clipboard` (53), `quick-grill` (45). The largest never-invoked skill is `last30days` at 31,610 estimated tokens.

Doc 507 carries the ecosystem's rule of thumb, "no more than 3 skills without measurable lift". On the evidence, that rule is aimed at the wrong cost. An unused skill costs its description, about 70 tokens, until someone runs it. A USED skill with a wrong instruction cost the wwtracker lane an entire mutation campaign. Rank the audit by correctness, not by idleness.

### 3. The one shape behind nine of ten failures

Over roughly eight hours on 2026-09-16 and 17, three agents produced ten failures and nine were the same: **a surface was checked that could not report the state being asked about, and its answer was reported as the state.** Examples, each reproduced before being written down:

- A Paragraph PREVIEW url still renders "Draft preview, not published yet" after publication, so a published edition was reported as a draft three times. The instrument that answers is the feed's `pubDate`. The neighbouring trap: `/@thezao/feed` is a 404 whose BODY is an HTML error page, so grepping it returns a zero that means nothing.
- `grep -c '<item>'` counts LINES CONTAINING the tag. On the live feed it says 2 where `grep -o | wc -l` says 50, because the document is one line.
- A dead-link sweep matched `href="..."` only, and missed links rendered as plain text in a `<p>`.
- A hand-kept route list of 14 pages is why a sitemap with 23 entries and ZERO artist pages survived six audit passes.
- A revert between mutations used `git checkout`, which does not remove untracked files, so the mutations stacked and every per-mutation number was cumulative.

### 4. The tool built to catch this failed the same way first

The scan written to find broken instruments in skills flagged 15 steps on its first run. **All 15 were false positives**: 13 in a vendored bundle, 2 in tables describing a failure rather than instructing it. It matched words rather than instructions, which is the same defect one level up. Two fixes made it useful: match an instruction rather than a mention, and skip vendored trees through a file that prints its own skip count, so an exclusion cannot quietly grow.

After tightening, across the 121 skill files we author, it found exactly **one** real broken instruction: `autoresearch/references/debug-workflow.md` told readers to run `git stash` to reach a clean tree. Measured in a scratch repo: after `git stash` an untracked `coverage.json` and `build/` are still present; after `git reset --hard HEAD` an untracked file is still present; only `git stash -u` leaves `git status --porcelain` empty. That is the same mechanism that invalidated the mutation run, sitting in our own documentation.

A second instance appeared while building the mutation tool itself: a same-length source edit inside one mtime second let CPython reuse `__pycache__`, so the suite ran the ORIGINAL bytecode and the mutation "survived". The cache, not the tests, was the answer.

### 5. The seat's question: how many would a skill have prevented?

Classifying all twelve honestly, where "a skill would have prevented it" means a person or agent reading a written instruction would have acted differently, and "needed a mechanism" means only a script or gate would have caught it:

| Failure | A skill would have prevented | Needed a mechanism |
|---|---|---|
| preview url read as published | | yes |
| `grep -c` line count (twice) | no, and this is measured | yes |
| href-only link sweep | | yes |
| route list 14 vs 23 | | yes |
| countdown cause inferred from phrasing | partly | yes |
| merge onto a red base | | yes |
| revert left untracked files | | yes |
| mutation green by construction | | yes |
| stale state read as current | | yes |
| `systemctl cat` leaked a token, twice | no, and this is measured | yes |
| `git stash` in our own skill | yes, once corrected | the scan keeps it true |
| `__pycache__` served stale bytecode | | yes |

**One of twelve was fixable by fixing a written instruction. Two are cases where the instruction already existed and failed anyway**: the counting trap recurred six hours after being written up, and "be careful with host pastes" had already failed twice before it failed a third time.

That is an uncomfortable finding for a skills library, and it is the finding. A skill is good at telling a competent reader WHAT to do. It is weak at making them do it under pressure, and it is useless once the reader has skimmed past it. The estate's own compliance numbers say the same thing in one line: 3 to 40 percent for honor-system rules, near 100 for structural ones.

### 6. What this changed, and what it cost

Four merged PRs on 2026-09-17 (`bettercallzaal/zaal-dotfiles` #267, #269, #270, #271):

| Mechanism | What it refuses | Debt it exposed |
|---|---|---|
| `claude/instruments.md` + `bin/zao-instruments` | a skill step that instructs a surface which cannot answer its claim | 1 real broken instruction, 18 claims registered |
| `bin/zao-mutate` | a campaign from a dirty tree, a failing baseline, an unproven revert | names the harness when every mutation survives |
| `bin/zao-lesson-has-test` | a tool that records a lesson and names no test | 27 of 50 had none; census closed |
| `bin/zao-skill-paths` (earlier) | a SKILL.md naming a path that does not exist | 32 of 127 paths missing, 1 dead |

Each carries a red control: with the mechanism removed the test fails. That discipline caught two of my own defects before review, and the reviewer caught a third.

### 7. The review loop is itself a mechanism worth naming

Over three hours the seat and this lane exchanged four corrections in three directions. Their sitemap cause was wrong (a count problem, actually zero artist pages in 23 entries) and I corrected it. Their artist-link example page was clean and I corrected it. Their countdown fix I called broken, and **I was half wrong**: I had measured a client-rendered widget on three pages that do not carry the server-rendered string at all. They corrected me with numbers, and I reproduced their numbers before accepting: `/onepagers/overview` gives raw 3, stripped 1, match "16 days to go".

Neither side took the other's word once. The registry entry that came out of it names a test rather than an instrument, which is the general form and survives the next framework: **ask whether the string is in the document at all**; if it is, the stripped text answers; if it is not, only something that executes JavaScript can read it.

Worth noting for its own sake: raw 3 against stripped 1 on the SAME page, because an embedded JSON payload inflates the raw count. Three instruments, three answers, one question, for the third time in one morning.

## Also See

- [dev-workflows/507-claude-skills-1116-ecosystem-zao-picks](../507-claude-skills-1116-ecosystem-zao-picks/) - the ecosystem cut, and the "no more than 3 without measurable lift" rule this doc argues is aimed at the wrong cost
- [dev-workflows/2467-agent-skill-collections](../2467-agent-skill-collections/) - what to take and what to refuse from large skill collections
- [dev-workflows/2276-skills-estate-audit](../2276-skills-estate-audit/) - the 66-entry hand audit; `zao-skills-check` came out of it
- [dev-workflows/552-zao-skill-library-audit](../552-zao-skill-library-audit/) - the earlier library audit
- [dev-workflows/137-skills-audit-security-practices](../137-skills-audit-security-practices/) - skills and prompt-injection hygiene
- [dev-workflows/2411-tool-usage-audit-measured](../2411-tool-usage-audit-measured/) - the transcript-measurement method this doc reuses
- Doc 429 is AMBIGUOUS (`business/429-paragraph-agents-launch-apr2026` and `dev-workflows/429-claude-code-skills-deep-dive`); the skills one is [dev-workflows/429-claude-code-skills-deep-dive](../429-claude-code-skills-deep-dive/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `zao-instruments --scan` on the ZAOOS `.claude/skills` tree (it has never been scanned; only the dotfiles tree is wired into zao-selftest) and fix or register every hit | @Zaal | PR to ZAOOS | 2026-09-24 |
| Cut the 3 largest never-invoked skills (`last30days` 31,610 tok, `tutorial-creator` 16,602, `graphify` 12,126) or record why each stays, in doc 2276's table | @Zaal | PR | 2026-09-30 |
| Add a `published` check to the newsletter skill that reads the feed `pubDate`, so "is it live" stops being answered by a preview url | @Zaal | PR to dotfiles | 2026-09-24 |
| Shrink the lesson-debt census from 27 by writing tests for the 5 most-invoked tools on it; the count prints on every `zao-selftest` run | @Zaal | PR to dotfiles | 2026-10-08 |
| Re-validate this doc against a fresh `zao-skill-audit` run and a second `zao-research-snapshot anthropics/skills` (first look recorded today; the delta is the point) | @Zaal | Research | 2026-10-17 |

## Sources

- [Extend Claude with skills - Claude Code docs](https://code.claude.com/docs/en/skills) - **[FULL, METHOD: curl + HTML strip]** http 200, 1,094,414 bytes, 84,317 chars of text. Verified 2026-09-17. Source of the load-on-use and 500-line claims.
- [Agent Skills specification](https://agentskills.io/specification) - **[FULL, METHOD: curl + HTML strip]** http 200, 7,297 chars of text. Verified 2026-09-17. The two required frontmatter fields.
- [Claude Skills are awesome, maybe a bigger deal than MCP - Simon Willison, 2025-10-16](https://simonwillison.net/2025/Oct/16/claude-skills/) - **[FULL, METHOD: curl + HTML strip]** http 200, 32,578 bytes. Community source, 738 points and 370 comments on Hacker News.
- [Hacker News: Claude Skills](https://news.ycombinator.com/item?id=45607117) - **[FULL, METHOD: hn.algolia.com official API, keyless]** 816 points, 427 comments, 2025-10-16; 1,143 stories match "claude skills". Verified 2026-09-17.
- [anthropics/skills](https://github.com/anthropics/skills) - **[FULL, METHOD: gh api]** 176,793 stars, 20,932 forks, 1,236 open issues, last push 2026-09-10. **Licence: no LICENSE file at the repo root and the API field is `none`** - per this skill's Hard Requirement 13 that is all-rights-reserved, not public domain. Snapshot recorded via `zao-research-snapshot`; top contributors rlancemartin (15), klazuka (13).
- **This estate, measured 2026-09-16 and 17** - **[FULL, METHOD: local commands, each reproduced before citing]** `zao-skill-audit --json` over 3,986 transcripts; `~/.claude/skills/*/SKILL.md` description and body character counts; `zao-instruments --scan`; `zao-lesson-has-test`; `zao-skill-paths`; a scratch-repo measurement of `git stash`, `git stash -u` and `git reset --hard`; live fetches of paragraph.com and zaostock.com.
- **zaal-dotfiles PRs #267, #269, #270, #271** - **[FULL, METHOD: gh, merged and verified on main]** the four mechanisms and their red controls.
