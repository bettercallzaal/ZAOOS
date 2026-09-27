---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-25
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
| 1 | **Stop paying for compliance with prose. Put the rule in a script.** | Measured in this estate: honor-system rules run 3 to 40 percent compliance, structurally enforced ones near 100. Re-confirmed 2026-09-25: even the mechanisms built to enforce this (`zao-skill-audit`, `zao-instruments`) do not themselves check whether a skill's own frontmatter parses - 8 of 64 current skills have broken or missing frontmatter and nothing caught it until this pass. | `claude/skills/clipboard/SKILL.md` own notes; four PRs on 2026-09-17 converted rules to checks; gap found 2026-09-25 |
| 2 | **The token argument is settled here. Stop optimising it.** | Updated 2026-09-25: the corpus shrank (64 skills now vs 114 then, body chars nearly halved), so the absolute numbers moved a lot - but the RATIO claim still holds and even ticked up slightly: the always-on tax is now ~2.4 percent of the corpus (was ~1.8 percent), still small enough that it is not the binding constraint. The "zero over 500 chars" half of this decision's evidence is now FALSE - see Findings #1. | measured 2026-09-25, `~/zaal-dotfiles/claude/skills/*/SKILL.md` (the tree `~/.claude/skills` symlinks to) |
| 3 | **Audit skills for WRONG INSTRUCTIONS, not for unused ones.** | Re-confirmed 2026-09-25: 29 of 64 real on-disk skills have never been invoked across 4,125 transcripts and cost nothing while idle (unchanged shape from the original 31-of-93 finding). One skill with a wrong verification step still costs more than a shelf of unused ones. | `zao-skill-audit --json`, re-run 2026-09-25; doc 2276 |
| 4 | **Every verification step names the surface that can answer it.** | Nine of ten failures in eight hours were one shape: a surface was checked that could not report the state asked about. The registry has grown since - 27 claims now (was 18) - but the SAME broken instruction (`git stash` without `-u`) that was fixed in the dotfiles copy on 2026-09-17 is still live, unfixed, in the ZAOOS copy of the same file, and the Next Action to scan and fix it (due 2026-09-24) is now overdue. | `claude/instruments.md`, `bin/zao-instruments --scan` re-run 2026-09-25 |
| 5 | **A lesson recorded in a comment must become a test.** | Updated 2026-09-25: 69 executables now record a lesson (was 50), 43 carry a test (was 23), 26 are on the debt list (was 27) - the raw debt count barely moved, but that number hides the real result: `zao-lesson-has-test --json` reports zero new lessons added without a test since the gate shipped, so the entire 26-item debt is pre-gate legacy and none of the growth from 50 to 69 added new debt. | `bin/zao-lesson-has-test --json`, re-run 2026-09-25 |

## Findings

### 0. LEAD: a central claim from the last validation is now false

The 2026-09-17 version of this doc said "not one description exceeds the 500-character guidance." Re-measured 2026-09-25 with a corrected extractor (see the methodology note in Finding 1 - the first extractor tried was itself broken and silently over-counted, then under-counted, before a YAML-aware parse settled it): **3 of the current 64 skills now exceed 500 characters** - `claude-creativity` (642 chars), `drunk-claude` (598), `seat` (540). This is not a rewording of an old number; it is a claim that held on 2026-09-17 and does not hold today. It is listed first because Hard Requirement rules for this re-research say a wrong central claim leads.

### 1. The ecosystem's framing is about discovery and cost. Neither is our binding constraint.

Anthropic's design is that a skill's body "loads only when it's used, so long reference material costs almost nothing until you need it," and the harness reads only the frontmatter at session start. That framing is unchanged and still confirmed by the official docs page (re-fetched 2026-09-25, still http 200).

**Updated 2026-09-25: the corpus itself moved a great deal.**

| | 2026-09-17 (old) | 2026-09-25 (now) | delta |
|---|---|---|---|
| skills with a `SKILL.md` | 114 | 64 | -50 (-44%) |
| name+description chars | 31,756 | 22,501 | -9,255 |
| name+description approx tokens | 7,939 | 5,625 | -2,314 |
| all skill-body chars | 1,750,520 | 925,802 | -824,718 (-47%) |
| all skill-body approx tokens | 437,630 | 231,450 | -206,180 |
| always-on tax as % of corpus | 1.78% | 2.37% | +0.59 pt |

Method note on the count: measured live against `~/.claude/skills/*/SKILL.md` (this machine symlinks that path to `~/zaal-dotfiles/claude/skills`; confirmed on branch `main` throughout, via `git branch --show-current`, so this is not the branch-switch hazard the estate's own CLAUDE.md warns about - it is a real drop over 8 days). The 64 excludes two non-skill cache directories that sit in the same tree (`.trash`, `synced` - a local undo/sync cache, not skills) and two real subdirectories with no `SKILL.md` at all (`learned`, `spawn`). `zao-skill-audit --json`'s own disk scan lands on the identical 64 independently, which is a second, different method landing on the same number - use it as the corroborated figure, not a guess. A commit near 2026-09-17 (`c875a4b`) shows 85 tracked `SKILL.md` files in git history at that point, between the old doc's 114 and today's 64 - which says the corpus has been volatile and under active pruning for over a week, not that one measurement was wrong; UNKNOWN which specific skills were cut and when, since no single commit removes 50 at once and the working tree (rather than a commit) is what both this doc and the 2026-09-17 one measured.

Method note on the chars: the first extraction attempt used a regex frontmatter-field splitter (`^\w+:` to detect the next key) that is silently wrong whenever a later frontmatter key contains a hyphen - `allowed-tools:`, `argument-hint:` - because `\w` does not match `-`. That bug over-counted `21st`'s description by folding the entire `allowed-tools` line into it (741 chars measured, 461 actual). Caught by spot-checking one skill's raw file against the parsed value, exactly the check the estate's own "before you report a measurement" rule calls for. The number in the table above is from a YAML-aware parse (Python `yaml.safe_load` on the frontmatter block) with a single-line fallback for files whose frontmatter fails strict YAML.

That YAML parse turned up two more defects the 2026-09-17 measurement did not carry, both about frontmatter integrity itself rather than the tokens argument:

- `tclip` (added 2026-09-24) ships with **no YAML frontmatter at all** - no `name:`, no `description:` - so the harness has nothing to key discovery on for it. `zao-skill-audit` does not catch this: it still reports 1,880 estimated tokens for the file by byte count alone, `no_skill_md: false`, because the tool checks for the file's existence, not whether its frontmatter parses.
- 7 skills (`audit-skill`, `autoresearch`, `capture`, `design-review`, `gstack`, `orchestration`, `platform`) have a `description:` field that fails strict YAML parsing, in every case because of an unquoted colon inside the prose (e.g. `platform`'s description contains `Trigger: /platform <name>` with no quoting). A tolerant single-line reader recovers a value; a strict one would truncate or error. Which one the actual Claude Code harness runs was not verified in this pass - flagged as a real, reproducible defect, not fixed here (see Next Actions).

The official troubleshooting page (re-checked 2026-09-25, still resolves) still covers a skill not triggering, triggering too often, and descriptions being cut short - all DISCOVERY problems. None of the twelve original failures was a discovery problem, and the frontmatter defects just found are ALSO discovery problems (a skill the harness cannot key on, or a description a strict parser mangles), not correctness problems - so they support Finding 3's framing (audit for wrong instructions) rather than contradict it, even though they are new and real.

### 2. Usage is long-tailed, and that is fine

`zao-skill-audit --json` re-run 2026-09-25 over 4,125 transcripts (was 3,986, +139): using the SAME raw counting method as the 2026-09-17 doc (which does not filter invoked-but-not-on-disk names or noise directories), it reports 101 "skills seen," 68 invoked, 33 never invoked - up from 93/62/31. Filtered to only real, on-disk skills (the comparison this doc actually cares about): **64 counted, 35 invoked at least once, 29 never invoked.** Of the 37 non-real rows: 32 are skill names invoked in transcripts with no matching folder in this tree (built-in or plugin skills such as `brainstorming`, `systematic-debugging`, `artifact-design`, `secure`, `loop`, `writing-plans` - these live outside `~/.claude/skills` and are not double-counted against the 64), and 5 are non-skill directories the scan still walks (`spawn`, `.gstack`, `.trash`, `learned`, `synced`).

Top invoked, ranking UNCHANGED, every count higher: `zao-research` 218 (was 138), `handoff` 82 (was 68), `clipboard` 60 (was 53), `quick-grill` 57 (was 45).

Largest never-invoked (real, on-disk, by estimated tokens): `last30days` 31,610, `tutorial-creator` 16,602, `graphify` 12,126 - **identical, to the token, to the 2026-09-17 measurement.** These three files have not been touched in the 8 days since, and none has gained a single invocation. The Next Action to cut or justify them (due 2026-09-30) has not started - see Next Actions.

**Anomaly, reported not explained:** the tool's own JSON gives `last_used: "2026-09-26"` for both `zao-research` and `clipboard` - one day AFTER today (2026-09-25, per this session's system clock). Reproduced directly from `zao-skill-audit --json` output, not a transcription error. Cause UNKNOWN - could be a transcript timestamp already written for a session spanning midnight, a clock-skew source, or a tool bug; not investigated further in this pass. Flagging per the estate's own rule against writing down a clean number without naming what it rests on.

Doc 507 carries the ecosystem's rule of thumb, "no more than 3 skills without measurable lift." On the evidence, that rule is still aimed at the wrong cost, more so now: 29 unused skills cost about 70 tokens of description each until invoked, while frontmatter that silently fails to parse (8 of 64 skills, this pass) costs a skill its discoverability regardless of use count.

### 3. The one shape behind nine of ten failures

Unchanged from 2026-09-17 - this finding is a historical account of the 2026-09-16/17 incident window, not a live measurement, so it is not re-verified here. Over roughly eight hours, three agents produced ten failures and nine were the same: **a surface was checked that could not report the state being asked about, and its answer was reported as the state.** Examples, each reproduced before being written down at the time:

- A Paragraph PREVIEW url still renders "Draft preview, not published yet" after publication, so a published edition was reported as a draft three times. The instrument that answers is the feed's `pubDate`. The neighbouring trap: `/@thezao/feed` is a 404 whose BODY is an HTML error page, so grepping it returns a zero that means nothing.
- `grep -c '<item>'` counts LINES CONTAINING the tag. On the live feed it says 2 where `grep -o | wc -l` says 50, because the document is one line.
- A dead-link sweep matched `href="..."` only, and missed links rendered as plain text in a `<p>`.
- A hand-kept route list of 14 pages is why a sitemap with 23 entries and ZERO artist pages survived six audit passes.
- A revert between mutations used `git checkout`, which does not remove untracked files, so the mutations stacked and every per-mutation number was cumulative.

**Update 2026-09-25: the specific `pubDate` trap named above has since been worked around, not fixed as literally described.** See Finding 6.

### 4. The tool built to catch this failed the same way first

Unchanged history from 2026-09-17: the scan written to find broken instruments in skills flagged 15 steps on its first run, all 15 false positives. After tightening, it found exactly one real broken instruction: `autoresearch/references/debug-workflow.md` told readers to run `git stash` to reach a clean tree, when only `git stash -u` actually leaves `git status --porcelain` empty.

**Update 2026-09-25: that fix did not travel.** Re-running `bin/zao-instruments --scan` against this dotfiles repo's own `claude/skills` tree now passes clean - the fix (`git stash -u`, with a "Superseded 2026-09-17" note) is in place. Running the SAME scan against the ZAOOS repo's `.claude/skills` tree (`/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills`) - which is a SEPARATE, un-synced copy of the `autoresearch` skill - still fails with the exact original defect: line 251 still reads `git stash` to test clean state, unfixed. This is the Next Action from the last version of this doc (due 2026-09-24) that has not happened; it is now overdue. No wiring of `zao-instruments` into any ZAOOS-side selftest was found either - the only reference to `zao-instruments` findable inside the ZAOOS research tree is this doc itself.

### 5. The seat's question: how many would a skill have prevented?

Unchanged from 2026-09-17 - a one-time classification of the 2026-09-16/17 incident window, not something to re-measure:

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

One of twelve was fixable by fixing a written instruction, and even that one - see Finding 4 - only stayed fixed in the copy someone re-ran the scan against. A skill is good at telling a competent reader WHAT to do. It is weak at making them do it under pressure, weaker still at making a SECOND, unsynced copy of the same instruction do it, and useless once the reader has skimmed past it.

### 6. What this changed, and what it cost

The four PRs this doc names as the mechanisms built from the 2026-09-16/17 incident, re-verified 2026-09-25 with `gh pr view --repo bettercallzaal/zaal-dotfiles`: all four are still **MERGED**, all on `main`.

| PR | Title (verbatim, `gh pr view`) | Mechanism | State |
|---|---|---|---|
| #267 | "instrument registry: the one surface that answers each claim, the one that cannot, and a scan that keeps the skills honest" | `claude/instruments.md` + `bin/zao-instruments` | MERGED 2026-09-17 |
| #269 | "zao-mutate: a mutation campaign that proves its own reverts and names the harness when every mutation survives" | `bin/zao-mutate` | MERGED 2026-09-17 |
| #270 | "zao-lesson-has-test: a lesson recorded in a comment must name a test, with a debt list that can only shrink" | `bin/zao-lesson-has-test` | MERGED 2026-09-17 |
| #271 | "instruments: a gate that asserts an absence, what a reader actually sees, and the count trap that recurred" | a second, companion `zao-instruments` mechanism | MERGED 2026-09-17 |

**Correction on attribution:** the 2026-09-17 table listed a fourth mechanism, `bin/zao-skill-paths`, alongside these four PR numbers and marked it "(earlier)" - meaning it came from a PR before this batch, not from #271. #271's real content (confirmed by title and re-read) is a second instruments-registry PR ("a gate that asserts an absence... and the count trap that recurred"), not `zao-skill-paths`. The original doc's own table was technically correct (it marked `zao-skill-paths` "earlier"), but the phrasing invited exactly this misread - fixed here so a future reader does not have to re-derive it.

Growth in the registries these PRs created, measured 2026-09-25:

| Mechanism | 2026-09-17 | 2026-09-25 | What moved |
|---|---|---|---|
| `claude/instruments.md` claims | 18 | 27 | +9 claims registered |
| `zao-lesson-has-test`: lessons recorded | 50 | 69 | +19 |
| `zao-lesson-has-test`: carry a test | 23 | 43 | +20 |
| `zao-lesson-has-test`: debt (no test) | 27 | 26 | -1 net, but 0 of the +19 new lessons shipped without a test - the debt is 100% pre-gate legacy |

### 7. The review loop is itself a mechanism worth naming

Unchanged from 2026-09-17 - a one-time historical account, not re-measured. Over three hours the seat and the lane exchanged four corrections in three directions, each reproduced before being accepted rather than taken on the other side's word. Worth noting for its own sake: raw 3 against stripped 1 on the SAME page, because an embedded JSON payload inflated the raw count. Three instruments, three answers, one question, for the third time in one morning.

## Also See

- [dev-workflows/507-claude-skills-1116-ecosystem-zao-picks](../507-claude-skills-1116-ecosystem-zao-picks/) - the ecosystem cut, and the "no more than 3 without measurable lift" rule this doc argues is aimed at the wrong cost
- [dev-workflows/2467-agent-skill-collections](../2467-agent-skill-collections/) - what to take and what to refuse from large skill collections
- [dev-workflows/2276-skills-estate-audit](../2276-skills-estate-audit/) - the 66-entry hand audit; `zao-skills-check` came out of it; the table where the never-invoked cuts get recorded
- [dev-workflows/552-zao-skill-library-audit](../552-zao-skill-library-audit/) - the earlier library audit
- [dev-workflows/137-skills-audit-security-practices](../137-skills-audit-security-practices/) - skills and prompt-injection hygiene
- [dev-workflows/2411-tool-usage-audit-measured](../2411-tool-usage-audit-measured/) - the transcript-measurement method this doc reuses
- Doc 429 is AMBIGUOUS (`business/429-paragraph-agents-launch-apr2026` and `dev-workflows/429-claude-code-skills-deep-dive`); the skills one is [dev-workflows/429-claude-code-skills-deep-dive](../429-claude-code-skills-deep-dive/)

All six related-doc numbers above were resolved with `zao-research-health --resolve N` on 2026-09-25 and each returns exactly one path - none of them are on the library's ambiguous-number list.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix the ZAOOS `.claude/skills` copy of `autoresearch/references/debug-workflow.md:251` (`git stash` -> `git stash -u`) so `zao-instruments --scan "/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills"` prints OK instead of FAIL - this was due 2026-09-24 and is now overdue | @Zaal | PR to ZAOOS | 2026-09-29 |
| Cut `last30days` (31,610 tok), `tutorial-creator` (16,602 tok), and `graphify` (12,126 tok), or add a row to doc 2276's table naming why each stays - none has moved since 2026-09-17 | @Zaal | PR + doc 2276 update | 2026-09-30 |
| Fix frontmatter on the 8 skills found broken 2026-09-25: `tclip` has no frontmatter at all; `audit-skill`, `autoresearch`, `capture`, `design-review`, `gstack`, `orchestration`, `platform` fail strict YAML parsing on an unquoted colon in `description:` | @Zaal | PR to dotfiles | 2026-10-02 |
| Trim `claude-creativity` (642 chars), `drunk-claude` (598), and `seat` (540) to at or under the 500-character description guidance | @Zaal | PR to dotfiles | 2026-10-02 |
| Shrink the lesson-debt census from 26 by writing tests for the 5 most-invoked tools still on it; `zao-lesson-has-test --json` debt must read 21 or lower | @Zaal | PR to dotfiles | 2026-10-08 |
| Re-validate this doc again: fresh `zao-skill-audit --json` run, fresh `zao-research-snapshot anthropics/skills` diff, and check whether the five rows above shipped | @Zaal | Research | 2026-10-25 |

## Sources

- [Extend Claude with skills - Claude Code docs](https://code.claude.com/docs/en/skills) - **[FULL, METHOD: curl + HTML strip]** re-checked 2026-09-25, http 200. Source of the load-on-use and 500-line claims; unchanged from 2026-09-17.
- [Agent Skills specification](https://agentskills.io/specification) - **[FULL, METHOD: curl + HTML strip]** verified 2026-09-17, not re-fetched this pass (static spec page, low churn risk; the two required frontmatter fields it documents are unaffected by anything measured here).
- [Claude Skills are awesome, maybe a bigger deal than MCP - Simon Willison, 2025-10-16](https://simonwillison.net/2025/Oct/16/claude-skills/) - **[FULL, METHOD: curl + HTML strip]** re-fetched 2026-09-25, http 200, 32,585 bytes. The raw page carries no embedded HN point/comment count - that number comes from the HN thread below, added as its own source this pass since the 2026-09-17 doc cited it only as prose, not as a linked source.
- [Hacker News: "Claude Skills are awesome, maybe a bigger deal than MCP"](https://news.ycombinator.com/item?id=45619537) - **[FULL, METHOD: hn.algolia.com official search API, keyless]** 738 points, 370 comments, created 2025-10-16T17:40:21Z. This is the actual HN discussion of the Simon Willison post; confirmed 2026-09-25, matches the 2026-09-17 doc's inline figure exactly.
- [Hacker News: "Claude Skills"](https://news.ycombinator.com/item?id=45607117) - **[FULL, METHOD: hn.algolia.com official items + search API, keyless]** 816 points, 427 comments, created 2025-10-16T16:05:47Z, links to Anthropic's own announcement (`anthropic.com/news/skills`), NOT the Willison post - a separate thread from the one above. Re-confirmed 2026-09-25: identical numbers to 2026-09-17, as expected - HN scoring freezes roughly 30 days after posting and this thread is about 11 months old.
- [anthropics/skills](https://github.com/anthropics/skills) - **[FULL, METHOD: gh api + zao-research-snapshot]** re-measured 2026-09-25: 178,344 stars (was 176,793, +1,551/+0.9%), 21,114 forks (was 20,932, +182/+0.9%), 1,133 watchers (was 1,128, +5/+0.4%), 1,298 open issues (was 1,236, +62/+5.0%), last push 2026-09-24 (was 2026-09-10). **Licence unchanged: `gh api repos/anthropics/skills/contents/LICENSE` still returns 404, the API `.license` field is still `null`** - per this skill's Hard Requirement 13 that is all-rights-reserved, still not public domain. Top contributors unchanged at the top: rlancemartin (15), klazuka (13).
- **This estate, measured 2026-09-25** - **[FULL, METHOD: local commands, each reproduced before citing]** `zao-skill-audit --json` over 4,125 transcripts; a YAML-aware parse of `~/zaal-dotfiles/claude/skills/*/SKILL.md` name/description/body char counts (superseding a first-pass regex extractor that was itself measured and found broken mid-research, per Finding 1); `zao-instruments --scan` against both the dotfiles and the ZAOOS `.claude/skills` trees; `zao-lesson-has-test --json`; `zao-instruments --json --list`; `git branch --show-current` and `git log` on `claude/skills` to confirm the corpus drop is not a branch-switch artifact.
- **zaal-dotfiles PRs #267, #269, #270, #271** - **[FULL, METHOD: gh pr view --json, merged and verified on main 2026-09-25]** all four still MERGED; verbatim titles recorded in Finding 6, correcting the earlier doc's ambiguous fourth-mechanism attribution.
