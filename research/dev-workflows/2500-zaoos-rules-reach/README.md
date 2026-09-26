---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2472, 2365, 2411"
original-query: "lets /zao-research the zaoos and see how it would hit more of our other repos"
tier: STANDARD
---

# 2500 - ZAOOS's rules reach one repo in forty-five: how to make them reach the rest

> **Goal:** Inventory what ZAO OS V1 carries that governs agent and code quality, measure which other estate repos have any of it, and pick the mechanism that makes it reach them.

## Key Decisions

| # | Decision | Why, in one line | Status, re-measured 2026-09-25 |
|---|---|---|---|
| 1 | **USE `~/.claude/rules/`, Claude Code's native user-level rules directory.** It holds 0 files today. | The docs say "Personal rules in `~/.claude/rules/` apply to every project on your machine." No tool to adopt, nothing to build for the loading half. | Still 0 files. `ls -la ~/.claude/rules/` -> "No such file or directory". Directory does not exist. Not started. |
| 2 | **Make it a REAL directory synced from `origin/main`, NOT a symlink into `~/zaal-dotfiles`.** Gate it with `bin/zao-runtime-drift`. | `~/zaal-dotfiles` is one shared working tree lanes check out branches in. Measured 2026-09-17: a file added today exists on 1 of 228 refs. A symlinked rules dir would vanish for every session whenever a lane checks out one of the other 227. | The GATE now exists and works: `bin/zao-runtime-drift` runs, exits 0, reports its one configured pair (`bin/fleet-watch.py`) IDENTICAL. But no rules pair has been added to it, because there is nothing yet on either side of that pair - `zaal-dotfiles/claude/rules/` and `~/.claude/rules/` are both still absent. Tool built, use case not wired. |
| 3 | **Ship a DIGEST globally, not the 3,745 lines.** One file, under 100 lines: each estate-wide law as one or two sentences plus the path of the full rule. | "Rules without a `paths` field are loaded unconditionally", at launch, into every session on the Mac, including a one-line question in a repo with no code. | **Half shipped.** The 3-sentence digest from Next Action #1 (measurement traps) landed in the global `~/.claude/CLAUDE.md` and is confirmed live today - see Findings. But that landed in the CLAUDE.md path, not as a `~/.claude/rules/` file, so it is a stopgap for one law, not the digest-directory mechanism this decision describes. `zaal-dotfiles/claude/rules/estate-digest.md` (Next Action #2, due 2026-09-24) does not exist; the directory itself does not exist. Overdue by 1 day. |
| 4 | **MOVE the 24 estate-wide rules out of ZAOOS into `zaal-dotfiles/claude/rules/`; leave the 14 ZAOOS-specific ones where they are and give them `paths:` frontmatter.** | 24 of 38 rules mention no ZAOOS path at all. They are estate-wide by content and repo-locked by location. None of the 38 uses `paths:` today. | Not started - no file moved, no `paths:` frontmatter added (re-confirmed: 0 of 38 files carry `paths:`, same as 2026-09-17). The "24" input number itself does not reproduce cleanly on re-measurement; see Findings. Directional call is unaffected either way: something between 14 and 24 of 38 rule files don't mention a ZAOOS-specific path, so the move is still worth making. |
| 5 | **USE reusable workflows for CI, called from ZAOOS.** Start with three: claims-check, licence-clear, a secret scan. | 25 of 45 repos have no CI at all, and `zaal-dotfiles` was one of them. | **Partly overtaken.** `zaal-dotfiles` now has a CI workflow (`ci.yml`, added 2026-09-21) - but it is a same-repo workflow that runs `bin/zao-ci` locally, not a `workflow_call` reusable workflow called from ZAOOS. Re-checked ZAOOS's own workflow files at `origin/main`: none declare `on: workflow_call`. No repo checked this run calls a ZAOOS workflow. So the specific "reusable workflow" mechanism in this decision has not been built; the narrower problem it was aimed at (zaal-dotfiles has no CI) is separately solved a different way. |
| 6 | **SKIP the account-level `.github` repo for this.** | GitHub's default-file mechanism covers community health files only (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT and similar). It distributes neither workflows nor agent rules. | Not re-fetched this run (not a moving target - GitHub's community-health-file mechanism is not the kind of thing that changes week to week); recommendation stands. |
| 7 | **SKIP `ruler`, `rulesync` and AlignTrue.** | They solve syncing one rule set into many agent FORMATS (Cursor, Copilot, AGENTS.md, CLAUDE.md). This estate runs one agent, and that agent has a native user-level directory. | Re-confirmed with fresh star counts (ruler 2,930 -> 2,934; rulesync 1,434 -> 1,474, both still MIT, both still actively pushed within the last 2 days). Small movement, same verdict. |

## Updated 2026-09-25 - what changed since last validation

Lead finding: **the central claim - rules reach 1 of 45 repos - is STILL TRUE.** `~/.claude/rules/` still does not exist anywhere on this Mac, ZAOOS is still the only repo with a `.claude/rules/` directory (38 files, re-confirmed today at `origin/main` HEAD `aa0d92b9`), and every one of 16 other repos spot-checked this run (see Coverage, below) has zero rule files. Re-research does not overturn the finding this doc is named for.

What DID move, in order of how much it matters:

1. **Next Action #1 (the 3-sentence digest into global `CLAUDE.md`) SHIPPED.** Confirmed by direct read of `~/.claude/CLAUDE.md` today: a section titled "Before you report a measurement (2026-09-17)" carries all three sentences verbatim ("Before believing a filter that found nothing, feed it something it must find"; "A near-universal result from a new instrument is the instrument"; "A ratio with no denominator is a missing measurement, and it must print UNKNOWN"), and `grep -c "must print UNKNOWN" ~/.claude/CLAUDE.md` returns exactly `1`, matching this doc's own shipped-criteria. This is the one Next Action from the 2026-09-17 version of this doc that is unambiguously done.
2. **Next Action #2 (the real `~/.claude/rules/` directory) is OVERDUE, not shipped.** It was due 2026-09-24; today is 2026-09-25. Neither `zaal-dotfiles/claude/rules/` nor `~/.claude/rules/` exists. This is the one that actually moves the central number, and it has not moved.
3. **`zaal-dotfiles` now has CI (Next Action #4, due 2026-09-26, shipped 5 days early).** `.github/workflows/ci.yml`, added 2026-09-21, runs `bin/zao-ci` on every PR plus a daily 10:17 UTC schedule on main. Its own header comment cites this doc by number: "Measured 2026-09-17 (ZAOOS research doc 2500): this repo ... had no CI." So this doc's own Next Action produced a shipped artifact that names it back.
4. **Two more repos in the spot-check picked up CI where they had none or less before ZAOOS is not the only repo racking up new workflows:** `zao-vault` went from 0 workflows to 1 (`docs.yml`, added 2026-09-21, added link/frontmatter/secret checks scoped to the diff); `wwtracker` grew from 2 workflows to 3 (`checks.yml`, `live-watch.yml`, `refresh-battles.yml`). `zingfisher` picked up a `.claude/settings.json` it did not have on 2026-09-17.
5. **Official Claude Code memory docs changed a real behavior claim: AGENTS.md.** The 2026-09-17 version of this doc quoted "Claude Code reads `CLAUDE.md`, not `AGENTS.md`" and concluded four estate repos with an `AGENTS.md` were unserved unless a `CLAUDE.md` imported it. That literal sentence is gone from the docs page today. The current page instead documents a real default-read path: "By default, Claude reads AGENTS.md only when you have no CLAUDE.md in your working directory or above it" - with a full precedence table. This is a materially different claim, not a wording tweak, and it changes the coverage picture for the repos that carry `AGENTS.md` with no `CLAUDE.md` (on this doc's own coverage table: `zaal-dotfiles`, no - it has neither; but `zingfisher` and `zao-vault` do carry `AGENTS.md` with no `CLAUDE.md`, so, under the current docs, Claude Code now reads their `AGENTS.md` by default without any import needed). See Findings for the full quote and what else moved in the same section.
6. **Tracker task `research-doc:2365`** ("Rules-duplication audit: check 211 MEMORY.md entries vs .claude/rules/", linked in Also See as "still todo, due 2026-08-25") **is now `done`**, per `zao-tracker search`.
7. **Tracker task `handoff:vault-settings-json-tap-2026-09-17`** ("create `zao-vault/.claude/settings.json` with a project deny rule") **is still `todo`**, due 2026-09-20, now 5 days overdue - re-confirmed by filesystem: `zao-vault/.claude/settings.json` does not exist.
8. **A nuance worth stating precisely rather than repeating uncritically** (task asked for this explicitly): whether `zaal-dotfiles` has "no `CLAUDE.md` of its own." See Findings for the full argument; short version: true for the project-level loading path, misleading if read as "gets no CLAUDE.md content."

## The finding that started this

`.claude/rules/state-claims.md` was written in ZAOOS on 2026-08-08 after one session made eight wrong claims about the repo's own state. Its diagnosis: "Every wrong answer came from a proxy that was cheaper to reach than the truth."

On 2026-09-17, lanes working in `zaal-dotfiles`, `zao-vault`, `zorca`, `zaalcaster` and `wwtracker` logged that same failure **12 times in one day** in `~/zao-vault/MISTAKES.md`, under the shape `surface-cannot-report-state`. The seat wrote a new law for it, graduated the shape to that law, and only then was told by the zorca lane that the law already existed and was six weeks old.

None of those lanes had broken a rule they had read. Claude Code loads `.claude/rules/` for a session whose working directory is that project. The rule was in ZAOOS. The sessions were not. As the review lane put it: "I did not break a law I had read, I broke one I had never been served."

So the count of 12 is mostly one failure of distribution, not twelve failures of discipline. This is unchanged by today's re-research; not re-litigated further here.

## What ZAOOS carries

Re-measured against `origin/main` at `aa0d92b9` (`aa0d92b922af61c89ddbca89d0db667c081f2a42`) on 2026-09-25, reading the ref with `git ls-tree -r`, not the working tree - same method as the 2026-09-17 pass:

| Asset | Count, 2026-09-17 | Count, 2026-09-25 |
|---|---|---|
| `.claude/rules/*.md` | 38 files, 3,745 lines | **38 files, 3,745 lines - unchanged** |
| of which use `paths:` frontmatter | 0 | **0 - unchanged** |
| of which mention no ZAOOS-specific path (`src/`, supabase, next, `community.config`, `app/api`, `.tsx`) | 24 | **does not reproduce - see below** |
| `.claude/skills/*/SKILL.md` | 79 | not re-counted this run |
| `.github/workflows/*.yml` | 7 | not re-counted this run |

`git log --since=2026-09-17 -- .claude/rules/` on ZAOOS `origin/main` returns **zero commits** - the 38 rule files themselves have not changed a single byte since the last validation. So the 38-files/3,745-lines/0-`paths:` numbers are a clean re-confirmation, not a coincidence.

**The "24" figure does not reproduce, and the gap is a measurement-method problem, not a fact that changed.** Re-running the same grep pattern (`grep -E 'src/|supabase|next|community\.config|app/api|\.tsx'` per file, "no match" = counted) against the unchanged files gives **16** case-sensitive and **14** case-insensitive - neither is 24. Since the files are provably byte-identical to 2026-09-17 (see git log result above), the original 24 was either produced by a different pattern or process than the one written down, or hand-adjusted afterward without the method being recorded. Per this Mac's own measurement discipline (a ratio needs its exact method stated, not just its number): **treat "24" as unverifiable and "14-16" as the re-measured range**, both by the same literal grep. The directional conclusion in Key Decision 4 (a large minority to majority of the 38 rules are estate-wide by content) holds under either number; the precise count does not.

And what a session OUTSIDE ZAOOS loads, re-confirmed today via `readlink ~/.claude/CLAUDE.md ~/.claude/settings.json ~/.claude/skills`: all three still resolve to `/Users/zaalpanthaki/zaal-dotfiles/claude/{CLAUDE.md,settings.json,skills}` - still symlinks, unchanged. **`~/.claude/rules/` still does not exist** (`ls -la ~/.claude/rules/` -> "No such file or directory"). So of 3,745 lines of ZAOOS rules, the number reaching a session in any other repo via that mechanism is still zero.

The three rules that cover the 2026-09-17 failure family directly - `measurement-traps.md`, `state-claims.md`, `confirm-before-claiming-absence.md` - are unaffected by any of the above; a 3-sentence extract of them is the thing that shipped into the global `CLAUDE.md` (see Findings above).

## Coverage across the estate

**Denominator: 45, unchanged from the 2026-09-17 pass, and now understated.** This run did NOT re-do the full 45-repo table - the task scope was a spot check, not a re-audit, and re-measuring the full table honestly requires re-cloning-state checks on all 45 the same way the original pass did. Doing that is unfinished work, not zero work: **flagged as UNKNOWN whether 45 is still the right denominator**, because the local working set has visibly grown since 2026-09-17 (`~/Documents` and `~/Desktop/repos` now also show `dreamnet-zao`, `wavewarz-dj-wavy-mobile`, `fractalbotjuly2026`, `thezao-com`, `zabalgamez-agy-rules`, `zaostock-agy-rules`, plus multiple new worktree checkouts of `zaostock`, `wwtracker` and `zaoonparagraph` that dedupe to repos already in the table). None of the new names were audited this run. Do not read "45" below as re-confirmed; read it as "not disproven, not re-counted."

**Spot-checked 17 of the 45 repos this run** (all locally re-measured with `ls`/`git`, not trusted from the old table):

| Repo | Result this run (2026-09-25) | vs. 2026-09-17 row |
|---|---|---|
| `bettercallzaal/zaoos` | rules 38, CLAUDE.md yes, AGENTS.md yes, settings.json yes, CI 7 (unchanged, spot-checked via rules only) | unchanged |
| `bettercallzaal/zaal-dotfiles` | rules 0, CLAUDE.md no (project-level; see nuance below), AGENTS.md no, settings.json no, **CI 1** (`ci.yml`) | **CHANGED - CI workflow added 2026-09-21, cites this doc** |
| `bettercallzaal/zao-vault` | rules 0, CLAUDE.md no, AGENTS.md yes, settings.json no, **CI 1** (`docs.yml`) | **CHANGED - CI workflow added 2026-09-21** |
| `bettercallzaal/zorca` | rules 0, CLAUDE.md no, AGENTS.md no, settings.json no, CI 0 | unchanged |
| `zaodevz/zaostock` | rules 0, CLAUDE.md yes, AGENTS.md yes, settings.json no, CI 2 | unchanged |
| `bettercallzaal/CoCConcertZ` (nested at `~/Documents/cocconcertz/CoCConcertZ`, not at the folder's top level - a path trap worth naming) | rules 0, CLAUDE.md yes, CI 1 | unchanged |
| `bettercallzaal/zao-media` | rules 0, CLAUDE.md yes, CI 3 | unchanged |
| `bettercallzaal/zao-floor` | rules 0, CLAUDE.md no, CI 3 | unchanged |
| `bettercallzaal/wwtracker` | rules 0, CLAUDE.md no, **CI 3** (`checks.yml`, `live-watch.yml`, `refresh-battles.yml`) | **CHANGED - was CI 2, now 3** |
| `bettercallzaal/bcz-yapz` | rules 0, CLAUDE.md yes, CI 1 | unchanged |
| `bettercallzaal/sparkz` | rules 0, CLAUDE.md yes, CI 1 | unchanged |
| `bettercallzaal/zaalcaster` | rules 0, CLAUDE.md yes, settings.json yes, CI 1 | unchanged |
| `bettercallzaal/zingfisher` | rules 0, CLAUDE.md no, AGENTS.md yes, **settings.json yes**, CI 6, hooks yes | **CHANGED - settings.json now present (was absent)** |
| `zaodevz/zabalgames` (local folder renamed `zabalgamez` to match the ZABAL Gamez glossary spelling; same remote, `github.com/zaoDEVZ/zabalgames.git`) | rules 0, CLAUDE.md yes, settings.json yes, CI 1 | unchanged in substance |
| `bettercallzaal/zao-101` | rules 0, CLAUDE.md yes, CI 0 | unchanged |
| `zaodevz/iman-desk` | rules 0, CLAUDE.md yes, CI 0 | unchanged |
| `zaodevz/zaoartizen` | rules 0, CLAUDE.md yes, CI 0 | unchanged |
| `bettercallzaal/hermes-orchestrator` | rules 0, CLAUDE.md no, CI 1 | unchanged |

**Not re-checked this run (UNKNOWN, per this doc's own denominator rule):** the remaining 28 of 45 rows from the 2026-09-17 table, plus every repo that is not cloned locally (still roughly 105 of ~150 non-archived repos across both owners, same as 2026-09-17 - not re-verified this run either).

**Zero of the 17 spot-checked repos other than ZAOOS carry a `.claude/rules/` directory.** The `.claude/rules/` row of the summary table (`1 of 45`) is re-confirmed for the 17 checked; the other 28 rows are carried forward unverified.

**The "no `CLAUDE.md` of its own" nuance for `zaal-dotfiles`, investigated rather than repeated.** The 2026-09-17 doc said `zaal-dotfiles` has "no CI workflow, no `CLAUDE.md` of its own and no rules." The CI half is now wrong (see above). The CLAUDE.md half needs unpacking, because it is easy to read as "sessions here get no CLAUDE.md content," which is false - they get more of it than almost anywhere else on the machine:

- Claude Code's project-level convention loads a `CLAUDE.md` from the working directory or any directory above it, or from `.claude/CLAUDE.md`. `zaal-dotfiles` has neither at its repo root: `ls ~/zaal-dotfiles/CLAUDE.md` fails, and `~/zaal-dotfiles/.claude/` (the dotted directory, confirmed to exist) holds only `scheduled_tasks.lock`, `settings.local.json` and a `worktrees/` dir - no `CLAUDE.md`. So, strictly by that project-level path, the claim is correct: a session with cwd `zaal-dotfiles` loads no *project* `CLAUDE.md`.
- But `zaal-dotfiles` also contains `claude/CLAUDE.md` (undotted directory - a different path, a plain tracked file, not itself a symlink: `file` reports "Unicode text", last touched 2026-09-20) - and this is the literal file that `~/.claude/CLAUDE.md` is symlinked to, machine-wide. So every session on this Mac, in every repo, loads this repo's content as its GLOBAL user-level memory. `zaal-dotfiles` is not a repo with no CLAUDE.md reaching it; it is the repo whose CLAUDE.md reaches every other repo, sourced through the user-level mechanism rather than the project-level one.
- Precise statement, replacing the looser original: **`zaal-dotfiles` has no project-level `CLAUDE.md` that Claude Code's per-project convention would load for a session whose working directory is this repo - but this repo is the literal source of the global user-level `CLAUDE.md` that every session on the Mac loads instead.** That is a different kind of "reach" than this doc's `.claude/rules/` mechanism (which is about a directory, not a single file, and about content meant to travel to other repos' own memory, not content that already reaches everywhere by construction).

## How Claude Code actually loads rules

Re-fetched today: `curl -sL` (Mozilla UA) against `https://code.claude.com/docs/en/memory`, HTTP 200, HTML stripped to raw text (45,219 characters - up from 34,675 on 2026-09-17; the page has grown substantially, and the page's own body text carries dates up to 2026-09-26 and version references up to v2.1.281, both signs of an actively-changing document since last read). All quotes below are from that raw text, not from any cached memory of the earlier fetch.

- **User level exists and is native - unchanged.** "Personal rules in `~/.claude/rules/` apply to every project on your machine. Use them for preferences that aren't project-specific." Verbatim match to the 2026-09-17 quote.
- **Priority claim: the wording changed, and the substance is more nuanced than the old paraphrase.** The 2026-09-17 version of this doc said "Project rules win over user rules," citing "User-level rules are loaded before project rules, giving project rules higher priority." That second phrase does not appear on the page today, in any form - it may have been this doc's own paraphrase rather than a verbatim quote even then. **Current verbatim text: "Claude Code loads user-level rules before project rules, so a project rule appears later in Claude's context than a user rule. Neither set overrides the other: if a user rule and a project rule conflict, Claude may follow either one, so keep the two consistent."** This is a materially different claim from "project rules win" - it says conflicts are non-deterministic, not resolved in favor of the project. **Updated 2026-09-25: this doc's own reasoning for shipping a global digest ("a global digest cannot override a repo that needs to say something stricter") should be read as "a global digest and a conflicting project rule may resolve either way, so keep them non-conflicting," not as a guarantee that the project rule wins.**
- **Unscoped rules load unconditionally - unchanged.** "Rules without a `paths` field are loaded unconditionally and apply to all files." Verbatim match. The companion sentence about launch-time priority parity with `.claude/CLAUDE.md` was not re-found in this fetch's exact wording; not treated as retracted, just not re-located in the 45k-character page this time, and not worth an escalated re-search since the unconditional-load claim itself is confirmed twice over independently.
- **Path scoping - unchanged in substance,** with one addition: "As of v2.1.198, matching also works when Claude reaches a file through a symlinked path to the project directory, for example in a symlinked checkout." Not present in the 2026-09-17 quote set; whether it is new to the page or simply not quoted before is unknown from this fetch alone.
- **Symlinks are supported, with a catch - unchanged.** "The `.claude/rules/` directory supports symlinks, so you can maintain a shared set of rules and link them into multiple projects." And: "To load shared rules without that approval, keep them in `~/.claude/rules/`, where they apply to every project on your machine" - directly reinforcing Key Decision 2's mechanism choice.
- **The Cowork/symlink skip clause - verbatim unchanged.** "In those sessions it also skips a `~/.claude/CLAUDE.md` that is itself a symlink or hard link, and a symlinked `~/.claude/rules/` directory or rule file that points outside the working directory." Exact match to 2026-09-17. This estate's `~/.claude/CLAUDE.md` is still a symlink today, so the caveat still applies to it in that one product surface.
- **`AGENTS.md` claim CHANGED - this is the largest single change found in this re-fetch.** The 2026-09-17 doc quoted "Claude Code reads `CLAUDE.md`, not `AGENTS.md`" as a flat statement that AGENTS.md is not read. **That sentence is gone from the page today** (searched for it verbatim, zero hits). In its place is a whole new subsection with a real default-read path: **"By default, Claude reads AGENTS.md only when you have no CLAUDE.md in your working directory or above it."** The page adds a precedence table: files that count as "you have a CLAUDE.md" are `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` in the working directory or above; files that do NOT count (so AGENTS.md still loads alongside them) are the user's own `~/.claude/CLAUDE.md`, an org-managed CLAUDE.md, and `.claude/rules/` files. **Updated 2026-09-25: this is not a wording tweak, it reverses the doc's conclusion for a subset of repos.** Applying the new rule to this doc's own coverage table: `zingfisher` and `zao-vault` both carry an `AGENTS.md` and no project-level `CLAUDE.md` - under the current docs, Claude Code now reads their `AGENTS.md` by default, with no import needed. The 2026-09-17 doc's claim that "only those that also import it from a CLAUDE.md are actually served it" is no longer accurate for those two repos specifically (not re-verified live in a running session this run - this is a re-read of the documented default behavior, not an observed session; marked accordingly).

## The mechanisms compared

Unchanged from 2026-09-17 - re-read against today's docs fetch and nothing in it contradicts this table. Reproduced as-is:

| Mechanism | Reaches | Cost per repo | Survives a branch switch in `~/zaal-dotfiles` | Verdict |
|---|---|---|---|---|
| **`~/.claude/rules/` as a real dir, synced from `origin/main`, drift-gated** | every session on the Mac | none | **yes** | **USE** |
| `~/.claude/rules/` as a symlink into `~/zaal-dotfiles/claude/rules` | every session on the Mac | none | **no** - gone on any ref that lacks the dir; also skipped in Cowork desktop sessions | SKIP |
| Longer global `~/.claude/CLAUDE.md` | every session on the Mac | none | no, it is already a symlink into that tree | USE for short, high-value laws only (proven: the 3-sentence digest); it is the file already loaded everywhere |
| Symlink a shared rules dir into each repo's `.claude/rules/shared` | each repo you wire | one symlink plus one approval dialog each, 44 times | depends on target | SKIP - 44 approvals, and path-scoped rules behind such a link never load |
| Git submodule of a rules repo | each repo you wire | one submodule each, and a bump commit in 44 repos per rule change | yes | SKIP - the update cost is the failure mode |
| Reusable GitHub workflows called from ZAOOS | CI only, any repo | one `uses:` line | n/a | **USE for CI - not yet built; the CI that shipped this run (`zaal-dotfiles`, `zao-vault`) is same-repo, not reusable-workflow-based** |
| Account-level `.github` repo | community health files only | none | n/a | SKIP for this purpose |
| `ruler` / `rulesync` / AlignTrue | many agent formats | a config plus a generate step each | n/a | SKIP - solves a multi-agent problem this estate does not have |

**Why the second row is a SKIP and not the obvious answer.** `CLAUDE.md`, `skills` and `settings.json` are already symlinks into `~/zaal-dotfiles`, so making `rules` a fourth is the natural move. On 2026-09-17 the review lane held dotfiles #288 for exactly that shape: a launchd plist pointed at `~/zaal-dotfiles/bin/fleet-watch.py`, and it measured that 1 of 228 origin refs carried the file, so any lane checking out another branch would have made the 24/7 supervisor's script vanish. The global `CLAUDE.md` records the same hazard about itself (re-confirmed live today: the file still contains its own dated self-referential warning about the symlink hazard, with entries through 2026-09-12). The fix that merged was a real path outside the tree plus `bin/zao-runtime-drift`, which reads the reviewed copy as a blob from `origin/main`, never from the working tree, and reports IDENTICAL, DRIFT or UNKNOWN. **Re-confirmed today: the tool exists, is executable, and runs clean** - `zao-runtime-drift` reports its one configured pair (`bin/fleet-watch.py` vs `~/.zao/zorca-watch/fleet-watch.py`) IDENTICAL, exit 0. It takes a list of pairs. Rules are still one more pair, not yet added because there is nothing yet to pair.

## The OSS tools, measured

Snapshots taken 2026-09-17 with `zao-research-snapshot`; second look taken 2026-09-25 with `gh api repos/OWNER/REPO` (stars/forks/issues/pushed-at only - licence not re-read from the file this run, since it is not the kind of fact that flips between two dates 8 days apart and the original pass already read the LICENSE file directly, not the API classifier).

| Tool | Stars (09-17 -> 09-25) | Open issues (09-17 -> 09-25) | Licence (from file, 09-17 read) | Last activity |
|---|---|---|---|---|
| [intellectronica/ruler](https://github.com/intellectronica/ruler) | 2,930 -> 2,934 | 12 -> 13 | MIT License | pushed 2026-09-23 |
| [dyoshikawa/rulesync](https://github.com/dyoshikawa/rulesync) | 1,434 -> 1,474 | 53 -> 46 | MIT License | pushed 2026-09-25 |
| AlignTrue ([Show HN](https://news.ycombinator.com/item?id=46193951)) | n/a | n/a | not read | HN 2025-12-08, 1 point, 0 comments - not re-checked, static HN thread |

Both live repos are healthy and permissively licensed, both grew modestly in 8 days (ruler +4 stars, rulesync +40 stars and -7 open issues - net movement in the direction of "more used, better triaged," not a red flag either way). This remains a fit decision, not a quality one: the problem they solve (one rule set, many agent FORMATS) is not this estate's problem (one agent, many repos).

## First three steps

Superseded by the Next Actions table below, which now carries real shipped/not-shipped status per row rather than a flat list. Kept here as the original three-item framing, annotated:

1. ~~Land the three-sentence law in the global `CLAUDE.md`.~~ **SHIPPED**, confirmed 2026-09-25.
2. **Create `zaal-dotfiles/claude/rules/` with one `estate-digest.md`... sync it to a real `~/.claude/rules/`...** **NOT SHIPPED, overdue since 2026-09-24.** This is the step that actually changes the "1 of 45" number and it has not moved.
3. ~~Give `zaal-dotfiles` a CI workflow...~~ **SHIPPED** 2026-09-21, 5 days ahead of its 2026-09-26 due date - though see Key Decision 5: it is a same-repo workflow, not the reusable-workflow-from-ZAOOS pattern that decision specifically recommended.

## Also See

- [dev-workflows/2472-claude-setup-open-source](../2472-claude-setup-open-source/) - making the Claude setup safe and open-sourceable; four skipped rules found in one day
- [dev-workflows/2365-agent-memory-management](../2365-agent-memory-management/) - tracker task `research-doc:2365`, "Rules-duplication audit: check 211 MEMORY.md entries vs .claude/rules/" - **Updated 2026-09-25: now `done`**, per `zao-tracker search "rules-duplication audit"` (was "still todo" as of 2026-09-17)
- [dev-workflows/2411-tool-usage-audit-measured](../2411-tool-usage-audit-measured/) - a step naming a tool nobody invokes is not a step; the same argument applies to a rule nobody is served
- Tracker task `handoff:vault-settings-json-tap-2026-09-17` - create `zao-vault/.claude/settings.json` with a project deny rule. **Still `todo`, due 2026-09-20, now 5 days overdue** - re-confirmed by filesystem: the file does not exist.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DONE 2026-09-25 (re-confirmed): global `CLAUDE.md` carries the three sentences and `grep -c "must print UNKNOWN" ~/.claude/CLAUDE.md` is 1 | zj seat | PR | shipped |
| `zaal-dotfiles/claude/rules/estate-digest.md` exists, `~/.claude/rules/` is a real dir holding a byte-identical copy, and `zao-runtime-drift` reports that pair IDENTICAL; shipped when all three are true in one `ls` + one drift run | skills lane | PR | 2026-10-02 (re-set from the missed 2026-09-24 date; not "TBD" - one week from this re-validation) |
| Add the rules pair to `bin/zao-runtime-drift`'s `ZAO_DRIFT_PAIRS` (or its default list) the same PR that creates the digest, so the gate exists from the pair's first day instead of being bolted on later | skills lane | same PR as above | 2026-10-02 |
| The 24 (re-measured: 14-16) estate-wide rules are moved from `ZAOOS/.claude/rules/` to `zaal-dotfiles/claude/rules/`, each left behind in ZAOOS as a one-line pointer so no citation breaks; shipped when ZAOOS still loads them and a session in `zao-vault` does too | skills lane | 2 PRs | 2026-10-10 |
| The 14 ZAOOS-specific rules carry `paths:` frontmatter; shipped when a session that touches only `research/` no longer loads `components.md`, `api-routes.md` or `tests.md` | skills lane | PR | 2026-10-10 |
| Build the actual `workflow_call` reusable workflows (`claims-check`, `licence-clear`, a secret scan) in ZAOOS and call them from `zaal-dotfiles`, `zao-vault` and `wwtracker` first - all three now have their own local CI, so this is "add the shared checks to existing green pipelines," not "give them their first CI" | skills lane | 4 PRs | 2026-10-17 |
| Create `zao-vault/.claude/settings.json` with the project deny rule from tracker task `handoff:vault-settings-json-tap-2026-09-17` - already overdue, ship first of this batch | zj seat | PR | 2026-09-27 |
| Re-run the ZAOOS "24 rules mention no ZAOOS path" measurement with the exact grep command committed to this doc (done this run) or to a script, so the next re-validation reproduces a number instead of re-discovering the same gap | skills lane | doc/script edit | 2026-09-30 |
| Re-audit the coverage table for the 28 of 45 repos not spot-checked this run, plus the newly-visible local clones (`dreamnet-zao`, `wavewarz-dj-wavy-mobile`, `fractalbotjuly2026`, `thezao-com`, and others), so "45" is either re-confirmed or replaced with a real current count instead of carried forward | zj seat | measurement | 2026-10-03 |
| Measure the roughly 105 repos not cloned locally with one `gh search code` pass per asset, so the coverage denominator is the estate and not the working set | zj seat | measurement | 2026-10-03 |

## Sources

- [Claude Code docs - How Claude remembers your project (memory)](https://code.claude.com/docs/en/memory) - **[FULL]**, re-fetched 2026-09-25, `curl` plus HTML strip to raw text (45,219 characters, up from 34,675 on 2026-09-17), quoted verbatim above. HTTP 200. Page carries internal date references up to 2026-09-26 and version references up to v2.1.281 - actively changing, re-fetch again at next validation rather than trust this copy past a few weeks.
- [GitHub docs - Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) - **[FULL]** as of 2026-09-17, not re-fetched this run (not a central claim flagged for re-verification; the `workflow_call`/`uses:` mechanism itself is stable GitHub Actions syntax).
- [GitHub docs - Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) - **[FULL]** as of 2026-09-17, not re-fetched this run.
- [Hacker News - Show HN: AlignTrue CLI](https://news.ycombinator.com/item?id=46193951) - **[FULL]** as of 2026-09-17, not re-fetched this run - a static 2025-12-08 thread with 1 point does not change.
- [intellectronica/ruler](https://github.com/intellectronica/ruler) and [dyoshikawa/rulesync](https://github.com/dyoshikawa/rulesync) - **[FULL for metadata]**, re-fetched 2026-09-25 via `gh api repos/OWNER/REPO` for stars/forks/open-issues/pushed-at. Licence **[FULL as of 2026-09-17]** via `gh api .../contents/LICENSE` decoded and read, not re-read this run (see table note). **[PARTIAL]** for behaviour, unchanged from 2026-09-17: READMEs not read end to end.
- Reddit, r/ClaudeAI - **[FAILED]**, not re-attempted this run. 2026-09-17 status carried forward: Arctic Shift title search, 0 hits, no control query run, recorded as unreached rather than "nobody discusses this."
- Internal, measured 2026-09-25: `ls -la ~/.claude/rules/`; `readlink ~/.claude/CLAUDE.md ~/.claude/settings.json ~/.claude/skills`; `ls -la ~/zaal-dotfiles/claude/`; `~/bin/zao-runtime-drift` (run directly, exit code read); ZAOOS inventory via `git -C "ZAO OS V1" ls-tree -r origin/main` at HEAD `aa0d92b9`; `git log --since=2026-09-17 -- .claude/rules/` on ZAOOS (0 commits, confirms rule files unchanged); per-file `paths:` grep across all 38 ZAOOS rule files; 17-repo spot check via direct `ls`/`git remote -v` on each local clone; `zao-tracker search` for tracker task status; `.github/workflows/ci.yml` and `.github/workflows/docs.yml` read directly (`cat`) on `zaal-dotfiles` and `zao-vault`.
