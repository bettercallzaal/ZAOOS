---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-11-08
superseded-by:
related-docs: "2655, 2663, 2581, 2725"
original-query: "this is cool, lets hav eiman do a deep resaerhc and have us do a deep resaerhc on the new github pages" (Zaal, 8 Nov 2026, after he saw GitHub's "Try the new pull requests Overview page!" popup on bettercallzaal/zao-vault PR #493)
tier: DEEP
---

# 2733 - GitHub's new pull request Overview page: what shipped, what people think, and what it does to the ZAO estate's PR gate

> **Goal:** Say exactly what GitHub shipped on 5 Nov 2026, whether it can change how our seat verdict comments, pin lines and head-SHA checks are read, and whether the "Ready to merge" panel now misleads about a gate that lives in a comment.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Does the Overview page change how the estate's tools read verdicts, pins or head SHAs? | NO. Keep every tool as is. | `zao-merge` reads verdicts through the REST endpoint `issues/N/comments?per_page=100 --paginate --slurp`, oldest first, from the first 400 characters of a comment by `bettercallzaal` (`/Users/zaalpanthaki/bin/zao-merge`, `clean_verdict_at`, line 1785). Sort order in the web page never reaches that call. Pin lines go to the PR lead through Orca, not through GitHub. `--match-head-commit` is an API parameter. |
| 2 | Is the panel "Ready to merge / All requirements are met / No approvals required" truthful for us? | NO, it is vacuous on zao-vault and half-true on ZAOOS. Treat it as "GitHub's own rules pass", never as "the seat gate passed". | zao-vault is a private repo on a plan where `gh api .../rulesets` and `.../branches/main/protection` both return HTTP 403 "Upgrade to GitHub Pro or make this repository public" (checked 2026-11-08). Zero rules are configured, so "all requirements are met" is a ratio with zero in the denominator. ZAOOS (public) requires 3 checks (`Lint & Typecheck`, `Test`, `Bot Tests`) and 0 approvals, with `enforce_admins` true. In the last 12 closed PRs of each repo there were 0 GitHub reviews and 17 (vault) and 16 (ZAOOS) seat verdict comments. The real gate is invisible to the panel in 24 of 24 closed-PR samples. |
| 3 | What should we adopt so the panel mirrors the real gate? | ADOPT a commit status named `seat/verdict` posted by the caller of `zao-evaluate` at the exact head SHA (success on CLEAN, failure on NEEDS_WORK). Keep the comment as the human record. Mark it required on ZAOOS only (Zaal's tap). | A status is bound to one SHA by GitHub itself: a new push has no status, so the panel returns to pending without any code from us. It works on the private free repo too (statuses need no protection feature), where it shows in the Checks count but cannot block. It avoids the self-approval ban (docs: "Pull request authors cannot approve their own pull requests"). |
| 4 | Post verdicts as real PR reviews? | NO for now. | All lanes post as `bettercallzaal`, the PR author, and GitHub forbids approving your own PR. A review would need a second identity or a GitHub App, which one source calls "a poor idea generally, since it satisfies a human-review requirement with no human" (Modern Git Academy). `pulls/493/reviews` returns 0 today. |
| 5 | Require 1 approval on either repo? | NO. | Nothing could merge: the only account that posts is the author. |
| 6 | Does newest-first sorting hide or reorder a verdict? | YES for humans, and only in the new view. The comment is not lost, but its position is no longer "bottom". Read the verdict by the head SHA in its first line, never by position. One filter risk is UNVERIFIED and needs a 30-second look (see Finding 5). | Newest-first is the preview's stated behaviour; a community user calls it "an odd default"; a default "Unresolved" filter hid a plain approval for another user. |
| 7 | The Agents tab? | IGNORE for the PR flow. It is Copilot coding agent's mission control, not part of the Overview page. | Introduced 2026-01-26; the docs say the tab needs Copilot coding agent enabled for the repo. Our session surface is Orca (docs 2581, 2725). |
| 8 | Switch to the new view or stay classic? | Each person chooses; the toggle is per viewer. Do not tell lanes or Iman which one to use, but write verdict-reading rules that hold in both. | GitHub: "You can use the same menu to return to the classic overview during the preview." No GA date and no admin-level off switch are published. |

## What GitHub shipped (facts, dated)

Current as of 2026-11-08.

| Item | Fact | Source |
|------|------|--------|
| Name and status | "New pull request overview page in public preview", an opt-in public preview, 5 Nov 2026. Rollout "continuing through the weekend". A GitHub staff reply in the feedback discussion (6 Nov) says "fully rolled out by Monday" (9 Nov). | Changelog [FULL, method: curl]; discussion 212186 [PARTIAL] |
| Opt in and out | A "Try the Overview page" button in the PR header; "You can use the same menu to return to the classic overview during the preview." | Changelog |
| Plans | The changelog names no plan restriction and no price. It is not stated that it is plan-gated. Whether Zaal's account is Free or Pro is UNKNOWN (the API returned no plan field). | Changelog; `gh api user` |
| GA date | None published. The post calls itself "the first step". | Changelog |
| Can it be turned off? | Per viewer, yes, during the preview. After GA: not stated. A Reddit commenter hopes it "can be disabled when it eventually rolls out". No org or repo admin setting is documented. | Changelog; Reddit 1xosddx |
| Merge box | Moves to the top, "less than half the space"; supporting signals for checks, comments, approvals; actions such as updating the branch; merge when requirements are met. | Changelog |
| Conversation | Filters for unresolved conversations and for comments you wrote; sort newest to oldest; an activity summary top right; mark draft ready or close from the header. | Changelog |
| Same direction earlier in 2026 | 2026-03-05 merge status at the top of every PR page (public preview); 2026-03-19 docked panels on Files changed; 2026-04-23 global PR dashboard moved to opt-out public preview ("on by default"); 2026-09-10 refreshed repository PR list in public preview. The April move is the precedent: an opt-in preview became opt-out in about one cycle. | Changelogs [PARTIAL, highlights] |
| GitHub's stated reason | Staff post on X: "Agents have made this a lot worse. They push commits and leave review comments of their own, and all of it lands in the timeline." | David Poll on X via nitter mirror [PARTIAL] |
| Repo nav seen on PR #493 | Code, Issues, Pull requests, Agents, Actions, Projects, Security and quality, Insights, Settings. "Agents" = Copilot coding agent sessions (changelog 2026-01-26; docs "Agent management"). "Security and quality" is where Dependabot, secret scanning, code scanning and Code Quality findings live (GitHub docs). The date this tab was renamed from "Security" was not found: UNVERIFIED. | Changelog 2026-01-26; docs |

## Community reaction

Counts as of 2026-11-08: Hacker News 175 points, 122 comments by the Algolia API (an earlier mirror showed 166 and 113); GitHub feedback discussion 212186 with 38 comments and reaction counts 14 thumbs up, 6 thumbs down, 6 tada, 1 confused; r/github 36 points, 5 comments.

| Theme | Who | Evidence |
|-------|-----|----------|
| Cosmetic, fix reliability first | HN, many | "Can you fix the inbox first"; "Merge when ready" reported to reach the queue only 60-70 percent of the time; one team moved to trunk.io's merge queue and cut P90 queue entry from up to 40 minutes to 16 seconds (HN, self-reported, unverified). r/github: "surely people would prefer they focus on stability improvements". |
| Merge box at the top is good | HN, discussion | "atleast the merge button is better reachable"; "Finally approve button is available on the main screen"; "Being able to see the status at a glance ... is a huge win". |
| Newest-first is a bad default | Discussion | "I find newest-first sorting really hard to read ... an odd default"; another: "I want to read the whole timeline ... from oldest (top) to newest (bottom), before I click Merge". |
| Split timelines lose force-push context | Discussion (simon-abbott, j0k3r) | Activity moved to a side summary; no easy link to a force push's diff. Matters to us: lanes force-push rarely (the pre-push hook refuses) but rebases appear. |
| Default filter hides things | Discussion (Cerbrus) | "The default 'Unresolved' comment filter does not show said [approval] comment. The 'All' filter does." |
| "Ready" wording and checks | Discussion (kubo6472, gromer, bakies) | "A check is in progress, but hasn't failed" is worded as failed; optional checks and required approvals share one grey bar. |
| Lost features | Discussion (pushcx, noritada, pfgithub) | No report/block/delete-comment; no "copy as Markdown"; per-commit CI icons missing. |
| Pin a comment to the top | Discussion (jinder, 7 votes) | "It would be useful to be able to pin a comment to the top ... bot feedback ... important top level content." This is our verdict comment's need, asked for by someone else. |
| The real bottleneck is review itself | HN | "the PR-centric lifecycle has to change"; "first round of PR comments becomes unmoored from ground truth after any subsequent commits". |
| Copy was AI-written | HN, Reddit ("Thanks Claude") | Style complaint; no technical content. |
| Misread as an AI feature | Reddit (WithersChat) | "the last thing I need is yet another AI overview" - the page is a layout change, not a summary generator. |

Contradiction, left unresolved: HN mirrors disagree on the score (166/113, 172/119, 175/122 at different times); the Algolia number is the one cited. A third-party summary (msoftnews) says the changelog "supplies no metrics or before-and-after details" and that GitHub staff did not comment; the discussion shows GitHub staff (madsbolaris) replying. The staff-reply claim rests on the discussion page, which was read; the summary is wrong on that point.

## Findings for the ZAO estate

### Finding 1 - Tools read the API, not the page

`zao-merge` (2,801 lines) merges only when a non-author seat verdict reads CLEAN at the full 40-character head. `VERDICT_LINE` is a regex over the first 400 characters of a comment by `bettercallzaal`; the newest matching verdict at that head wins; an unreadable comment list refuses rather than reading as "no verdict" (`clean_verdict_at`, `check_author`, `/Users/zaalpanthaki/bin/zao-merge` lines 1777-1870). `zao-pr-open` (894 lines) runs the same gates before the PR exists. `zao-review-dispatch` (197 lines) pins the head SHA (rule 7c) and sends to the evaluator pane found by worktree path. `zao-evaluate` step 3 sends the PR lead "Condition: verdict ... at head <FULL_SHA>, comment <id>" through Orca. None of these touch the PR web page. The Overview page changes nothing for the machines.

### Finding 2 - The panel is vacuous on zao-vault and partial on ZAOOS

Measured 2026-11-08 with `gh api`:

| Repo | Visibility | Branch protection | Rulesets | Required checks | Required approvals | Reviews on last 12 closed PRs | Seat verdict comments on the same 12 |
|------|-----------|-------------------|----------|-----------------|--------------------|-------------------------------|--------------------------------------|
| bettercallzaal/zao-vault | private | HTTP 403 (needs Pro or public) | HTTP 403 | none possible | none | 0 | 17 |
| bettercallzaal/ZAOOS | public | present; enforce_admins true | 1, "Block Saftey 1", enforcement disabled | 3 | 0 | 0 | 16 |

PR #493 on zao-vault: head 8603df50739ad2617c517ef74883aa0753a3f722, 1 check-run at that head, 0 reviews, 0 review comments. So "Checks 1/1", "Approvals 0, no approvals required" and "All requirements are met" were all true and all said nothing about the verdict. The panel is honest about GitHub's rules and silent about ours. The danger is a human or a new lane reading green as cleared. Rush Commerce's advice is the same shape: "A readiness summary is only as honest as your branch protection."

### Finding 3 - Why the review route is closed and the status route is open

GitHub docs: "Pull request authors cannot approve their own pull requests." Every lane posts as `bettercallzaal`, which is also the PR author and the verdict poster, so an approving review cannot exist. A commit status or check-run has no such rule, is tied to one commit SHA, and is shown in the very Checks summary the new panel puts first. A new push drops the status automatically, which is the head-SHA discipline the estate enforces by hand today. On ZAOOS, adding `seat/verdict` to the required contexts would make the GitHub merge button itself refuse without a CLEAN, with protection already on (3 contexts, `enforce_admins` true). That edit is a settings change on a public repo and is Zaal's tap.

### Finding 4 - The Agents tab is a different product

Agents tab: introduced 2026-01-26 as repository-level mission control for Copilot coding agent sessions; "ensure that you have Copilot coding agent enabled for your repository." From 2026-02-04 Claude and Codex can run as partner agents for Copilot Pro+ and Enterprise, one premium request per session in the preview. It has no connection to the Overview page or to our verdict flow. Whether Zaal's account has Copilot coding agent turned on is UNKNOWN; the tab was visible on PR #493 in his screenshot.

### Finding 5 - Two ordering and filter risks for people (UNVERIFIED on our PRs)

1. Newest-first puts the latest comment at the top, not the latest verdict for the current head. If a head moves and a lane posts a re-verdict, the older CLEAN sits below it; a human skimming the top comment can match a verdict to the wrong head. The rule that already protects the machines (match the 40-character SHA) must be said to humans.
2. A user reported the default "Unresolved" filter hides a plain approval comment. Our verdicts are plain issue comments, not review threads. Whether they show under the default filter on the new page was not tested: Zaal or Iman should open PR #493 on the new view and read the filter state. This doc does not claim either answer.

## Comparison: ways to make the panel reflect the real gate

| Option | Binds to head SHA by itself | Works on private free zao-vault | Can block the merge button | Self-approval ban applies | Effort | Verdict |
|--------|-----------------------------|----------------------------------|----------------------------|---------------------------|--------|---------|
| A. Do nothing; read comments by SHA | No, a human matches it | Yes | No | n/a | 0 | Keep as the floor |
| B. Commit status `seat/verdict` from the zao-evaluate caller | Yes | Yes, visible but not enforcing | Yes on ZAOOS if marked required | No | One `gh api repos/R/statuses/SHA` call in step 2, plus a test | ADOPT |
| C. Real PR review from a second identity or an App | Yes (reviews carry commit_id) | Yes, visible | Yes with required reviews, then needs a human-review exemption | Avoided only by a second identity | A new account or App, token handling, a policy argument | SKIP now |
| D. `COMMENT`-type review from the same account | Yes | Yes | No (not an approval) | Not an approval, so allowed | Small, but moves the verdict out of `issues/N/comments`, which `zao-merge` reads | SKIP: breaks the reader |
| E. Require 1 approval | Yes | Not enforceable (403) | Yes | Yes, nothing could merge | n/a | REJECT |

Option B costs one write per verdict and leaves `zao-merge` unchanged, so the reader and the writer stay in step (the writer-enforces-the-reader's-shape rule).

## Staleness and caveats

- Preview behaviour changes weekly; GitHub says "a starting point". Re-validate 2026-11-22.
- The April 2026 precedent (global PR dashboard: opt-in then "on by default ... opt-out") suggests this page can become the default. No date is published. If the default flips, Finding 5 applies to every viewer, Iman included.
- Numbers from other people's pages (merge queue timings, HN scores) are as reported, not reproduced.

## Also See

- [Doc 2655](../2655-agent-pr-management-merge-queues-stacks-fork-ci/) - agent PR management, merge queues, stacks
- [Doc 2663](../2663-merge-policy-one-tier-table/) - merge policy
- [Doc 2581](../2581-orca-how-others-use-it/) and [Doc 2725](../2725-orca-fundamentals-tutorials/) - Orca is our session surface, not the Agents tab
- Files: `/Users/zaalpanthaki/bin/zao-merge`, `/Users/zaalpanthaki/bin/zao-pr-open`, `/Users/zaalpanthaki/bin/zao-review-dispatch`; `/Users/zaalpanthaki/Documents/ZAO OS V1/.github/workflows/ci.yml` (the workflow that produces the required contexts)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open PR #493-style test: on the new Overview view, read whether a plain seat verdict comment shows under the default filter, and whether newest-first puts a stale-head verdict above a current one; reply with one line. Shipped when: result recorded in this doc's Finding 5. | Zaal | Check | 2026-11-10 |
| Build option B: add a `seat/verdict` commit status call to the zao-evaluate caller step (success on CLEAN, failure on NEEDS_WORK, at the full head SHA) with a red-control test. Shipped when: PR merged in zaal-dotfiles and a status appears on one live PR head. | Seat lane (zao-evaluate owner) | PR | 2026-11-13 |
| Decide whether to mark `seat/verdict` a required context on ZAOOS main protection (currently Lint & Typecheck, Test, Bot Tests). Shipped when: the setting is changed or "wontfix" is recorded. | Zaal | Settings tap | 2026-11-15 |
| Add one line to the seat verdict reader docs: read a verdict by the 40-character head SHA in its first line, never by page position, in either view. Shipped when: line merged in the zao-evaluate skill. | Seat lane | PR | 2026-11-13 |
| Compare this doc with Iman's deep research on the same question; merge any finding this doc lacks. Shipped when: a note naming the differences is added here. | Zaal with Iman | Review | 2026-11-12 |
| Re-validate the preview facts (GA date, plans, off switch, default filter) against the changelog and discussion 212186. Shipped when: `last-validated` updated. | Research lane | Doc update | 2026-11-22 |
| File one GitHub feedback comment asking for a way to pin a bot comment and to show custom commit statuses by name. NOT sent by this doc; outbound, Zaal decides. | Zaal | Outbound, gated | wontfix unless Zaal says go |

## Sources

Method key: curl = raw HTML fetched and tag-stripped; API = official JSON; exa = text returned by the exa search/fetch tool (the page text as exa extracted it).

1. [FULL, curl] [GitHub Changelog, New pull request overview page in public preview, 2026-11-05](https://github.blog/changelog/2026-11-05-new-pull-request-overview-page-in-public-preview/)
2. [PARTIAL - page served 38 comments with "8 hidden items / Load more" not expanded; read about 30, curl] [GitHub Community discussion 212186](https://github.com/orgs/community/discussions/212186)
3. [FULL, API (Algolia items endpoint, 122 comments walked)] [Hacker News 50408931](https://news.ycombinator.com/item?id=50408931)
4. [FULL, Arctic Shift (5 of 5 comments)] [r/github 1xosddx](https://www.reddit.com/r/github/comments/1xosddx/new_pull_request_overview_page_in_public_preview/)
5. [PARTIAL - X not read directly; text from a nitter mirror via exa, unverified against x.com] [David Poll (GitHub) on X, 8 Nov 2026](https://nitter.gq/depoll)
6. [FULL, exa] [Changelog 2026-01-26, Introducing the Agents tab in your repository](https://github.blog/changelog/2026-01-26-introducing-the-agents-tab-in-your-repository/)
7. [FULL, exa] [Changelog 2025-10-28, A mission control to assign, steer, and track Copilot coding agent tasks](https://github.blog/changelog/2025-10-28-a-mission-control-to-assign-steer-and-track-copilot-coding-agent-tasks/)
8. [FULL, exa] [Changelog 2025-08-19, Agents panel](https://github.blog/changelog/2025-08-19-agents-panel-launch-copilot-coding-agent-tasks-anywhere-on-github-com/)
9. [FULL, exa] [Changelog 2026-02-04, Claude and Codex in public preview](https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/)
10. [PARTIAL - highlights only] [Changelog 2026-03-05, Quick access to merge status](https://github.blog/changelog/2026-03-05-quick-access-to-merge-status-in-pull-requests-in-public-preview/)
11. [PARTIAL - highlights only] [Changelog 2026-03-19, code and comments side by side](https://github.blog/changelog/2026-03-19-view-code-and-comments-side-by-side-in-pull-request-files-changed-page/)
12. [PARTIAL - highlights only] [Changelog 2026-04-23, Global pull requests dashboard to opt-out preview](https://github.blog/changelog/2026-04-23-global-pull-requests-dashboard-moves-to-opt-out-public-preview/)
13. [PARTIAL - highlights only] [Changelog 2026-09-10, Refreshed repository pull requests page](https://github.blog/changelog/2026-09-10-refreshed-repository-pull-requests-page-in-public-preview/)
14. [FULL, exa] [GitHub Docs, Agent management](https://docs.github.com/en/copilot/concepts/agent-capabilities/choosing-and-delegating-agent-work/agent-management)
15. [FULL, exa] [GitHub Docs, Approving a pull request with required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)
16. [FULL, exa] [GitHub Docs, About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
17. [FULL, exa] [GitHub Docs, Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
18. [FULL, exa] [GitHub Docs, Managing security and analysis settings (Security and quality tab)](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository)
19. [FULL, exa] [GitHub Docs, Fixing code quality findings in recently merged files](https://docs.github.com/en/code-security/how-tos/maintain-quality-code/fix-findings-in-recent-merges)
20. [FULL, exa] [Rush Commerce, GitHub pull request Overview page](https://rushcommerce.dev/blog/github-pull-request-overview-page-public-preview-merge-box-at-the-top-filter-unresolved-comments-make-review-the-fast-step)
21. [FULL, exa] [Vinish.Dev, Overview page enters public preview](https://vinish.dev/github-pull-request-overview-page-public-preview)
22. [FULL, exa] [LavX News, GitHub previews compact pull request overview page](https://news.lavx.hu/article/github-previews-compact-pull-request-overview-page)
23. [FULL, exa] [The Lede, Code review is the next bottleneck](https://theledes.com/trends/1378/)
24. [PARTIAL - a model-written summary of the HN thread, used only for the score mirror] [HN Screenshots mirror](https://hn.urlbox.com/item/50408931/github-new-pull-request-overview-page-in-public-preview)
25. [FULL, exa] [msoftnews, GitHub ships new pull request overview page](https://msoftnews.com/posts/github-ships-new-pull-request-overview-page-in-public-preview)
26. [FULL, exa] [Stack Overflow, Why can't I approve my own PR](https://stackoverflow.com/questions/74332878/why-cant-i-approve-my-own-pr-in-github-even-when-i-have-disabled-the-setting-f)
27. [FULL, exa] [Modern Git Academy, Required Reviews (the solo-maintainer problem)](https://moderngitacademy.com/github/pull-requests/required-reviews/)
28. Local, measured 2026-11-08: `gh api repos/bettercallzaal/{zao-vault,ZAOOS}/{rulesets,branches/main/protection,pulls,issues/N/comments}`; one seat verdict comment on zao-vault PR 493 read via `gh api .../issues/comments/<id>`; source of `/Users/zaalpanthaki/bin/zao-merge`, `zao-pr-open`, `zao-review-dispatch`; `zao-evaluate` SKILL.md steps 0.5 to 3.

URL liveness: sources 1-4 and 6-9 fetched live on 2026-11-08; the others were returned by exa on 2026-11-08 and not separately re-opened. Source 5 (X) and the Reddit thread count are the weakest links. Not searched: Bluesky, Mastodon, Lobsters, r/ExperiencedDevs (an Arctic Shift query on r/programming, r/ExperiencedDevs and r/webdev for "overview" since 4 Nov returned no matching posts).
