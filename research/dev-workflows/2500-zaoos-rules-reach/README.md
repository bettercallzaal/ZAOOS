---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-17
superseded-by:
related-docs: "2472, 2365, 2411"
original-query: "lets /zao-research the zaoos and see how it would hit more of our other repos"
tier: STANDARD
---

# 2500 - ZAOOS's rules reach one repo in forty-five: how to make them reach the rest

> **Goal:** Inventory what ZAO OS V1 carries that governs agent and code quality, measure which other estate repos have any of it, and pick the mechanism that makes it reach them.

## Key Decisions

| # | Decision | Why, in one line |
|---|---|---|
| 1 | **USE `~/.claude/rules/`, Claude Code's native user-level rules directory.** It holds 0 files today. | The docs say "Personal rules in `~/.claude/rules/` apply to every project on your machine." No tool to adopt, nothing to build for the loading half. |
| 2 | **Make it a REAL directory synced from `origin/main`, NOT a symlink into `~/zaal-dotfiles`.** Gate it with `bin/zao-runtime-drift`. | `~/zaal-dotfiles` is one shared working tree lanes check out branches in. Measured 2026-09-17: a file added today exists on 1 of 228 refs. A symlinked rules dir would vanish for every session whenever a lane checks out one of the other 227. |
| 3 | **Ship a DIGEST globally, not the 3,745 lines.** One file, under 100 lines: each estate-wide law as one or two sentences plus the path of the full rule. | "Rules without a `paths` field are loaded unconditionally", at launch, into every session on the Mac, including a one-line question in a repo with no code. |
| 4 | **MOVE the 24 estate-wide rules out of ZAOOS into `zaal-dotfiles/claude/rules/`; leave the 14 ZAOOS-specific ones where they are and give them `paths:` frontmatter.** | 24 of 38 rules mention no ZAOOS path at all. They are estate-wide by content and repo-locked by location. None of the 38 uses `paths:` today. |
| 5 | **USE reusable workflows for CI, called from ZAOOS.** Start with three: claims-check, licence-clear, a secret scan. | 25 of 45 repos have no CI at all, and `zaal-dotfiles` is one of them. A reusable workflow is one `uses:` line per repo and one place to fix. |
| 6 | **SKIP the account-level `.github` repo for this.** | GitHub's default-file mechanism covers community health files only (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT and similar). It distributes neither workflows nor agent rules. |
| 7 | **SKIP `ruler`, `rulesync` and AlignTrue.** | They solve syncing one rule set into many agent FORMATS (Cursor, Copilot, AGENTS.md, CLAUDE.md). This estate runs one agent, and that agent has a native user-level directory. |

## The finding that started this

`.claude/rules/state-claims.md` was written in ZAOOS on 2026-08-08 after one session made eight wrong claims about the repo's own state. Its diagnosis: "Every wrong answer came from a proxy that was cheaper to reach than the truth."

On 2026-09-17, lanes working in `zaal-dotfiles`, `zao-vault`, `zorca`, `zaalcaster` and `wwtracker` logged that same failure **12 times in one day** in `~/zao-vault/MISTAKES.md`, under the shape `surface-cannot-report-state`. The seat wrote a new law for it, graduated the shape to that law, and only then was told by the zorca lane that the law already existed and was six weeks old.

None of those lanes had broken a rule they had read. Claude Code loads `.claude/rules/` for a session whose working directory is that project. The rule was in ZAOOS. The sessions were not. As the review lane put it: "I did not break a law I had read, I broke one I had never been served."

So the count of 12 is mostly one failure of distribution, not twelve failures of discipline.

## What ZAOOS carries

Measured against `origin/main` at `c564a0fa2` on 2026-09-17 18:16 EDT, reading the ref with `git ls-tree -r`, not the working tree:

| Asset | Count |
|---|---|
| `.claude/rules/*.md` | **38 files, 3,745 lines** |
| of which use `paths:` frontmatter | **0** |
| of which mention no ZAOOS-specific path (`src/`, supabase, next, `community.config`, `app/api`, `.tsx`) | **24** |
| `.claude/skills/*/SKILL.md` | 79 |
| `.claude/agents` | 6 |
| `.claude/commands` | 10 |
| `.claude/settings.json` | present |
| `CLAUDE.md` | 230 lines |
| `.github/workflows/*.yml` | 7 (`ci`, `claims-check`, `doc-collision-guard`, `docs-automerge`, `estate-health`, `licence-clear`, `research-index`) |
| `.husky/` | present |
| `scripts/` | 314 files |

And what a session OUTSIDE ZAOOS loads, from `ls -la ~/.claude/`: `CLAUDE.md`, `settings.json` and `skills`, all three symlinks into `~/zaal-dotfiles/claude/`. **`~/.claude/rules/` does not exist.** So of 3,745 lines of rules, the number that reach a session in any other repo is zero.

The three rules that cover the 2026-09-17 failure family directly are `measurement-traps.md` (336 lines), `state-claims.md` (295) and `confirm-before-claiming-absence.md` (122): 753 lines, all three estate-wide by content, all three loading in exactly one repo.

## Coverage across the estate

**Denominator: 45.** Every distinct GitHub repo under `bettercallzaal` or `ZAODEVZ` that is cloned on this Mac under `~/Documents`, `~/Desktop/repos`, `~/zaal-dotfiles` or `~/zao-vault`, with worktrees deduplicated by remote URL. Each was read at its default remote ref, not at whatever branch its tree was on. UNKNOWN (no readable default ref): 0. **Not measured: repos that are not cloned locally.** The two owners hold about 150 non-archived repos, so this table covers the working set, roughly a third of the whole, and the rest is UNKNOWN rather than assumed empty.

| Has | Repos |
|---|---|
| `.claude/rules/` | **1 of 45** (ZAOOS) |
| `.claude/settings.json` | 3 of 45 |
| any skill | 3 of 45 |
| git hooks dir | 3 of 45 |
| `AGENTS.md` | 4 of 45 |
| any CI workflow | 20 of 45 |
| `CLAUDE.md` | 22 of 45 |

Three rows worth reading before the full table. `bettercallzaal/zaal-dotfiles`, which every session's tools, skills, settings and global `CLAUDE.md` come from, has **no CI workflow, no `CLAUDE.md` of its own and no rules**. `bettercallzaal/zao-vault`, the shared record, has an `AGENTS.md` and nothing else. `bettercallzaal/zorca` has none of the seven.

| Repo | rules | CLAUDE.md | AGENTS.md | settings.json | skills | CI workflows | git hooks |
|---|---|---|---|---|---|---|---|
| `bettercallzaal/zaoos` | 38 | yes | yes | yes | 79 | 7 | yes |
| `bettercallzaal/zingfisher` | 0 | - | yes | - | 0 | 6 | yes |
| `bettercallzaal/zao-floor` | 0 | - | - | - | 0 | 3 | - |
| `bettercallzaal/zao-media` | 0 | yes | - | - | 0 | 3 | - |
| `zaodevz/zaocowork` | 0 | yes | - | - | 0 | 3 | - |
| `bettercallzaal/poidhz` | 0 | - | - | - | 0 | 2 | - |
| `bettercallzaal/wwtracker` | 0 | - | - | - | 0 | 2 | - |
| `bettercallzaal/zao-website` | 0 | yes | - | - | 0 | 2 | - |
| `zaodevz/zaostock` | 0 | yes | yes | - | 0 | 2 | - |
| `bettercallzaal/bcz-yapz` | 0 | yes | - | - | 0 | 1 | - |
| `bettercallzaal/cocconcertz` | 0 | yes | - | - | 0 | 1 | - |
| `bettercallzaal/hermes-orchestrator` | 0 | - | - | - | 0 | 1 | - |
| `bettercallzaal/sparkz` | 0 | yes | - | - | 0 | 1 | - |
| `bettercallzaal/wavewarz-protocol` | 0 | - | - | - | 0 | 1 | - |
| `bettercallzaal/zaalcaster` | 0 | yes | - | yes | 1 | 1 | - |
| `bettercallzaal/zao-fractal-bot` | 0 | - | - | - | 0 | 1 | - |
| `bettercallzaal/zao-nyc` | 0 | yes | - | - | 0 | 1 | yes |
| `bettercallzaal/zol` | 0 | - | - | - | 0 | 1 | - |
| `zaodevz/zabalgames` | 0 | yes | - | yes | 1 | 1 | - |
| `zaodevz/zaofractal` | 0 | yes | - | - | 0 | 1 | - |
| `bettercallzaal/bcz-strategies` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/bettercallzaalwebsite` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/finance-hq` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/fractalbotapril2026` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/mac-optimization` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/thezao-com-archive` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/wavewarz-community` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zaal-dotfiles` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zabalnewsletterbuilder` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zao-101` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zao-brand` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zao-doots` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zao-icm` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zao-meetings` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zao-papers` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zao-vault` | 0 | - | yes | - | 0 | 0 | - |
| `bettercallzaal/zaofractal-contracts` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zaoonparagraph` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zaostock-deck` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zaotravelz` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zignite` | 0 | - | - | - | 0 | 0 | - |
| `bettercallzaal/zoostr` | 0 | yes | - | - | 0 | 0 | - |
| `bettercallzaal/zorca` | 0 | - | - | - | 0 | 0 | - |
| `zaodevz/iman-desk` | 0 | yes | - | - | 0 | 0 | - |
| `zaodevz/zaoartizen` | 0 | yes | - | - | 0 | 0 | - |

## How Claude Code actually loads rules

All quotes are verbatim from the official memory documentation, fetched as raw text.

- **User level exists and is native.** "Personal rules in `~/.claude/rules/` apply to every project on your machine. Use them for preferences that aren't project-specific".
- **Project rules win over user rules.** "User-level rules are loaded before project rules, giving project rules higher priority." So a global digest cannot override a repo that needs to say something stricter or different.
- **Unscoped rules load unconditionally.** "Rules without a `paths` field are loaded unconditionally and apply to all files." And separately: "Rules without paths frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`."
- **Path scoping is how you keep context cost down.** "These conditional rules only apply when Claude is working with files matching the specified patterns... Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use."
- **Symlinks are supported, with a catch.** "The `.claude/rules/` directory supports symlinks, so you can maintain a shared set of rules and link them into multiple projects." But: "Claude Code treats a symlink whose target is outside your working directory like an external import. The linked rules don't load until you approve external imports for the project, and after that only the ones without a `paths` field load."
- **A symlinked user directory is skipped in one product.** In "Cowork sessions on your desktop", Claude Code "skips a `~/.claude/CLAUDE.md` that is itself a symlink or hard link, and a symlinked `~/.claude/rules/` directory or rule file that points outside the working directory." This estate's `~/.claude/CLAUDE.md` IS a symlink today, so that caveat already applies to it.
- **`AGENTS.md` is not read.** "Claude Code reads `CLAUDE.md`, not `AGENTS.md`." Four repos here have an `AGENTS.md`; only those that also import it from a `CLAUDE.md` are actually served it.

## The mechanisms compared

| Mechanism | Reaches | Cost per repo | Survives a branch switch in `~/zaal-dotfiles` | Verdict |
|---|---|---|---|---|
| **`~/.claude/rules/` as a real dir, synced from `origin/main`, drift-gated** | every session on the Mac | none | **yes** | **USE** |
| `~/.claude/rules/` as a symlink into `~/zaal-dotfiles/claude/rules` | every session on the Mac | none | **no** - gone on any ref that lacks the dir; also skipped in Cowork desktop sessions | SKIP |
| Longer global `~/.claude/CLAUDE.md` | every session on the Mac | none | no, it is already a symlink into that tree | USE for the 3-sentence law only; it is the file already loaded everywhere |
| Symlink a shared rules dir into each repo's `.claude/rules/shared` | each repo you wire | one symlink plus one approval dialog each, 44 times | depends on target | SKIP - 44 approvals, and path-scoped rules behind such a link never load |
| Git submodule of a rules repo | each repo you wire | one submodule each, and a bump commit in 44 repos per rule change | yes | SKIP - the update cost is the failure mode |
| Reusable GitHub workflows called from ZAOOS | CI only, any repo | one `uses:` line | n/a | **USE for CI** |
| Account-level `.github` repo | community health files only | none | n/a | SKIP for this purpose |
| `ruler` / `rulesync` / AlignTrue | many agent formats | a config plus a generate step each | n/a | SKIP - solves a multi-agent problem this estate does not have |

**Why the second row is a SKIP and not the obvious answer.** `CLAUDE.md`, `skills` and `settings.json` are already symlinks into `~/zaal-dotfiles`, so making `rules` a fourth is the natural move. On 2026-09-17 the review lane held dotfiles #288 for exactly that shape: a launchd plist pointed at `~/zaal-dotfiles/bin/fleet-watch.py`, and it measured that 1 of 228 origin refs carried the file, so any lane checking out another branch would have made the 24/7 supervisor's script vanish. The global `CLAUDE.md` records the same hazard about itself: 340 refs carry it, 78 lack one of its sections. The fix that merged was a real path outside the tree plus `bin/zao-runtime-drift`, which reads the reviewed copy as a blob from `origin/main`, never from the working tree, and reports IDENTICAL, DRIFT or UNKNOWN. That tool takes a list of pairs. Rules are one more pair.

## The OSS tools, measured

Snapshots taken 2026-09-17 with `zao-research-snapshot`; licence read from each repo's LICENSE file, first line, not from the API field.

| Tool | Stars | Contributors | Open issues | Licence (from file) | Last activity |
|---|---|---|---|---|---|
| [intellectronica/ruler](https://github.com/intellectronica/ruler) | 2,930 | 23 | 12 | MIT License | 2026-09-16 |
| [dyoshikawa/rulesync](https://github.com/dyoshikawa/rulesync) | 1,434 | 90 | 53 | MIT License | 2026-09-17 |
| AlignTrue ([Show HN](https://news.ycombinator.com/item?id=46193951)) | n/a | n/a | n/a | not read | HN 2025-12-08, 1 point, 0 comments |

Both live repos are healthy and permissively licensed, so this is a fit decision, not a quality one. `ruler` describes itself as "apply the same rules to all coding agents"; AlignTrue's author describes "20+ agent formats (Cursor, AGENTS.md, CLAUDE.md, etc)". The problem they solve is one rule set, many agents. This estate's problem is one agent, many repos, and the agent already has a directory for it.

## First three steps

1. **Land the three-sentence law in the global `CLAUDE.md`.** Zaal ruled yes on 2026-09-17 (`zao-vault/decisions/grill-2026-09-17-seat-evening.md`). It is the only file every session already loads, and it costs three lines: before believing a filter that found nothing, feed it something it must find; a near-universal result from a new instrument is the instrument; a ratio with no denominator is a missing measurement and must print UNKNOWN.
2. **Create `zaal-dotfiles/claude/rules/` with one `estate-digest.md`, under 100 lines,** sync it to a real `~/.claude/rules/` from `origin/main`, and add the pair to `bin/zao-runtime-drift`. Start with the three measurement rules plus `pii-hygiene`, `secret-hygiene`, `no-rm-rf` and `anti-fabrication`: the ones whose absence costs most.
3. **Give `zaal-dotfiles` a CI workflow** that runs its own `bin/*-test` suites and `zao-selftest`. It is the most load-bearing repo in the estate and the only check on it today is a lane remembering to run the tests.

## Also See

- [dev-workflows/2472-claude-setup-open-source](../2472-claude-setup-open-source/) - making the Claude setup safe and open-sourceable; four skipped rules found in one day
- [dev-workflows/2365-agent-memory-management](../2365-agent-memory-management/) - tracker task `research-doc:2365`, "Rules-duplication audit: check 211 MEMORY.md entries vs .claude/rules/", still todo, due 2026-08-25
- [dev-workflows/2411-tool-usage-audit-measured](../2411-tool-usage-audit-measured/) - a step naming a tool nobody invokes is not a step; the same argument applies to a rule nobody is served
- Tracker task `handoff:vault-settings-json-tap-2026-09-17` (todo, due 2026-09-20) - create `zao-vault/.claude/settings.json` with a project deny rule

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Global `CLAUDE.md` carries the three sentences and a pointer to the full rule; shipped when the dotfiles PR is merged and `grep -c "must print UNKNOWN" ~/.claude/CLAUDE.md` is 1 | zj seat, Zaal reads before merge | PR | 2026-09-19 |
| `zaal-dotfiles/claude/rules/estate-digest.md` exists, `~/.claude/rules/` is a real dir holding a byte-identical copy, and `zao-runtime-drift` reports the pair IDENTICAL | skills lane | PR | 2026-09-24 |
| The 24 estate-wide rules are moved from `ZAOOS/.claude/rules/` to `zaal-dotfiles/claude/rules/`, each left behind in ZAOOS as a one-line pointer so no citation breaks; shipped when ZAOOS still loads them and a session in `zao-vault` does too | skills lane | 2 PRs | 2026-10-10 (after ZAOstock) |
| The 14 ZAOOS-specific rules carry `paths:` frontmatter; shipped when a session that touches only `research/` no longer loads `components.md`, `api-routes.md` or `tests.md` | skills lane | PR | 2026-10-10 |
| `zaal-dotfiles` has a CI workflow running every `bin/*-test` and `zao-selftest`; shipped when a PR that breaks a suite shows a red check | zj seat | PR | 2026-09-26 |
| `claims-check`, `licence-clear` and a secret scan are `workflow_call` reusable workflows in ZAOOS, called from `zaal-dotfiles`, `ZAOstock` and `wwtracker` first; shipped when those three repos show the checks on a PR | skills lane | 4 PRs | 2026-10-17 |
| Measure the roughly 105 repos not cloned locally with one `gh search code` pass per asset, so the coverage denominator is the estate and not the working set | zj seat | measurement | 2026-10-03 |

## Sources

- [Claude Code docs - How Claude remembers your project (memory)](https://code.claude.com/docs/en/memory) - **[FULL]**, `curl` plus an HTML strip to raw text (34,675 characters), quoted verbatim. HTTP 200 on 2026-09-17.
- [GitHub docs - Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) - **[FULL]**, `curl` plus HTML strip (22,459 characters). Used for `on: workflow_call` and the `uses: owner/repo/.github/workflows/file.yml@ref` call form.
- [GitHub docs - Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) - **[FULL]**, `curl` plus HTML strip (7,606 characters). Confirms personal accounts are supported and that the supported file types are community health files only.
- [Hacker News - Show HN: AlignTrue CLI](https://news.ycombinator.com/item?id=46193951) - **[FULL]**, official Algolia items API, author text quoted. 1 point, 0 comments: a statement of what the tool is, NOT evidence of community adoption.
- [intellectronica/ruler](https://github.com/intellectronica/ruler) and [dyoshikawa/rulesync](https://github.com/dyoshikawa/rulesync) - **[FULL for metadata and licence]**, `zao-research-snapshot` plus `gh api .../contents/LICENSE` decoded and read. **[PARTIAL]** for behaviour: READMEs were not read end to end, so the SKIP rests on each project's own one-line description of its purpose, which is sufficient for a fit decision and would not be for a quality one.
- Reddit, r/ClaudeAI - **[FAILED]**. Method: Arctic Shift `posts/search` with `title=` for "rules across repos" and "share CLAUDE.md across projects", 0 hits each. A title phrase search returning nothing is weak evidence of absence, and no control query was run against it, so this is recorded as unreached, not as "nobody discusses this". The official docs answer the mechanism question on their own, so the ladder was not climbed further.
- Internal, measured this run: ZAOOS inventory via `git ls-tree -r origin/main`; 45-repo coverage via each repo's default remote ref; `~/zao-vault/MISTAKES.md` shape counts via `zao-mistake due`; dotfiles #288 review, `~/zao-vault/handoffs/status/review.md`.
