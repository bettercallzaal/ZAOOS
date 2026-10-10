---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-10-10
superseded-by:
related-docs: "1006, 2204, 2214, 497, 2652"
original-query: "[STANDARD] What do other teams do for agents managing pull requests: review, merge gates, merge queues, stacked PRs, auto-merge, fork-CI handling, and lane roles. Compare with the ZAO merge-lane practice of 2026-10-09/10 (zao-merge pins, seat evaluator, lane-send) and recommend what to adopt. Added 2026-10-10: also what other orchestrators do (how multi-agent orchestrators hand PRs to a merge step and keep a channel of merge state), and a short ZAO merge channel proposal."
tier: STANDARD
---

# 2655 - Agent PR management: merge queues, stacks, fork CI, and orchestrator practice

> **Goal:** Who merges, when, in what order, what blocks, and how roles split when agents open the pull requests. Compare the external practice with the ZAO merge lane of 2026-10-09/10 and say what to adopt. Review quality is out of scope (see 2204, 2214).

## Key Decisions

Verdicts: USE = adopt now, KEEP = ZAO practice already right, SKIP = do not adopt, INVESTIGATE = open question with a named check.

| Verdict | Decision | Tied to measured incident | Evidence |
|---|---|---|---|
| KEEP | Keep zao-merge's pin on the exact head SHA and its refusal of a moved head. Re-verdict on any new commit. | 1 (head moved after pin, vault #125; pinned before CI finished, ZAOOS #3867) | zao-merge gates re-read the pinned head (check_head_green, zao-merge.txt:327-471). GitHub's own auto-merge is disabled when someone without write access pushes to the head (gh-automerge.txt). Same rule, different enforcement. |
| USE | Keep the claims-vs-diff gate (refuses a body that names a path the diff does not touch) and generate PR bodies from the diff, so the author cannot write a false path. | 1 (ZAOOS #3863, #3860, dotfiles #494 refused on body paths) | zao-merge check_claims (zao-merge.txt:785). #3863 and #3860 are now MERGED (gh api, 2026-10-10), so the refusal was recoverable. No external tool in this doc checks body text against the diff; this is ZAO-specific and worth keeping. |
| USE | Run expensive checks only at merge time, cheap checks on every PR (two-step CI). This is the direct fix for the minute budget. | 2 (Actions billing refused every job; 1,801 of 2,000 minutes used, item 26) | Mergify "two-step CI: run fast tests on every PR, and run expensive tests only before merge" (mergify-mq.txt). Matches Zaal's item 46 option B, which is already ruled. |
| USE | Make the seat evaluator verdict a REQUIRED check, not a comment, so GitHub enforces it before any auto-merge. Set it in rulesets (a Zaal settings change). | 6 (docs automerge merged ZAOOS #3873 before the evaluator ran; #3873 merged 2026-10-10T11:26:15Z) and 2 (red head refused, --head-red-ok denied by classifier) | GitHub auto-merge "merges a pull request automatically after all required reviews and status checks pass" (gh-automerge.txt). A required status is enforced by the platform, so a lane cannot skip it by reasoning. |
| USE | Keep GitHub's documented fork-CI procedure: a maintainer reviews the diff and taps "Approve workflows to run". Put the approval on a card with a date, because unapproved runs expire after 30 days. | 4 (ZAOstock #378, #432 are fork PRs, run in action_required) | Fork approval and 30-day expiry (gh-fork.txt). Verified: ZAOstock #378 and #432 are open with head.repo.fork=true (gh api, 2026-10-10). ZAO fix dotfiles #497 (Vercel placeholder) is still OPEN. |
| USE | Stacked PRs: after a base squash, re-create each dependent PR as a fresh branch off main and close the old one as superseded (the lane did this for ZAOOS #3864 to #3867 and wavewarz #52-55 to #57). Do not hand-merge the top of a stack. | 3 (wavewarz #56 squashed #52, #53, #55, #56 into one commit) | Verified: ZAOOS #3864 CLOSED unmerged, #3867 MERGED; wavewarz #56 MERGED, #57 OPEN. Rule 19 of agent-loops.md already says rebase onto a NEW branch. Graphite restack behaviour NOT verified (fetch FAILED, see Sources). |
| INVESTIGATE | Whether a GitHub native merge queue (or Mergify) would replace the pin lane. It needs `merge_group` triggers in every workflow and a queue-owner setting. Check on one private repo before deciding. | 1, 2 | GitHub: without the `merge_group` event "status checks will not be triggered ... The merge will fail" (gh-mq.txt). Costs CI runs per group, which is the wrong direction for item 26. Owner decision: Zaal. |
| SKIP | Auto-merge on green with no evaluator (what 99darwin's README and doc 2204 imply). | 6 | The 99darwin/orchestrator repo at HEAD has no merge step: its tree is README, LICENSE, two agent/command files and skills/orchestrator/SKILL.md, and grep of SKILL.md finds no merge, PR or push step (gh api git/trees, 2026-10-10). Doc 2204's "auto-merge in 99darwin/orchestrator" is NOT supported by the code we can read. |
| SKIP | Any `--head-red-ok` style bypass, or a lane asking another lane to merge for it. | 2 (classifier denied --head-red-ok on vault #127; the lane asked the seat to merge, refused) | The denial is the control working. zao-merge's own refusal text names the override (zao-merge.txt:442-447); the answer is to fix CI or get the required check green, not to route around it. |
| KEEP | Lane roles as split today: build agent opens, seat evaluator grades, merge lane executes from a pin, Zaal approves fork CI, flips settings, and owns billing. | 5 (usage limit, dispatcher misroute to dreamnet) | See the role table below. Fix the dispatcher ranking (dotfiles #495 OPEN) rather than the role split. |

## What the ZAO merge lane does today (measured)

- zao-merge runs 8 gates in order: base is the integration branch, base green, head green (refuses running, failed, or all-skipped checks), main green after merge, claims vs diff, hosts, review gate, deletions (zao-merge.txt gate functions at lines 166, 202, 327, 518, 785, 1086, 1160, 1287).
- zao-merge-only-guard blocks raw `gh pr merge` and `gh pr ready` for lanes (zao-merge-only-guard.txt:2). Drafts are flipped by Zaal.
- The seat's pins: 14 PRs pinned overnight 2026-10-09/10, 10 merged. Of the 4 not merged at the time of the brief, ZAOOS #3864 was closed and superseded by #3867 (MERGED), and dotfiles #495, #496, #497 remain OPEN as of 2026-10-10 (gh api).
- Policy: item 28 (grill-2026-10-09-seat-morning.md) says agents merge anything reviewed and reversible; Zaal reviews impact only for database and schema changes (item 34 narrowed it further, item 34a: "this is only for now"). Overnight code pins are held (rule 35).

## Comparison: merge mechanisms (4+ options)

| Option | Who merges | Head moved after review | Fork CI | Cost in CI minutes | Verdict for ZAO |
|---|---|---|---|---|---|
| A. GitHub native merge queue | a user with write access enqueues; the queue merges | queue re-tests the group on latest target (gh-mq.txt) | runs need approval first (gh-fork.txt) | one run per group; needs `merge_group` workflows | INVESTIGATE (one private repo) |
| B. Bot queue (Mergify, Homu, Kodiak) | a bot merges after the queue's checks | Homu and Kodiak docs do not say (PARTIAL); Mergify tests PRs against latest main speculatively (mergify-mq.txt) | bot-dependent, UNVERIFIED | speculative batches cost more runs; two-step CI reduces it | INVESTIGATE; SKIP adopting a second bot (rule: no new bots without doc) |
| C. ZAO zao-merge pin lane | merge lane, from a seat pin on an exact SHA | refused unless the pin matches (check_head_green) | Zaal taps Approve; dotfiles #497 fixes the Vercel placeholder | none beyond normal CI; blocked when Actions billing refuses jobs | KEEP, with the required-check change below |
| D. Auto-merge on green with the evaluator as required check | GitHub, when required checks and reviews pass | disabled by GitHub if a write-less user pushes (gh-automerge.txt) | the approval step still applies | normal | USE once the evaluator is a required status (Zaal settings change) |
| E. Hand merge by the human | Zaal | n/a | n/a | n/a | Fallback only (what happened for wavewarz #56) |

Numbers: GitHub merge queue build concurrency 1 to 100 and merge limits 1 to 100 (gh-mq.txt). Approval expiry 30 days (gh-fork.txt). Actions minutes 1,801 of 2,000 (grill item 26). Vault docs runs 994 and dotfiles CI runs 148 since 2026-10-01 (grill item 26).

## Role split: ZAO versus external setups

| Role | ZAO (2026-10-10) | GitHub merge queue | Homu (rust-lang) | Kodiak | claude-code-action |
|---|---|---|---|---|---|
| Opens the PR | build lane or build agent (sometimes as draft) | author | author | author | the workflow on an issue or PR comment |
| Reviews | seat evaluator (fresh context, default-FAIL) and zao-review-gate | required reviews in branch protection | reviewer comments r+ | required approvals | Claude in the workflow (review comment, not a merge) |
| Merges | merge lane, zao-merge pin | queue, after checks pass | bot, after tests pass on the merged result | bot, when label plus CI plus approvals | not documented as a merger (README lists PR review and comments) |
| Approves fork CI | Zaal (tap) | maintainer with write access | maintainer | maintainer | n/a |
| Flips flags and settings | Zaal | repo admin | repo admin | repo admin | n/a |
| Channel | orchestrator2 pane, merge-lane brief in the vault, BLACKBOARD | queue UI and PR page | PR comments and bot status | dashboard app.kodiakhq.com and PR labels | PR comments with progress checkboxes |

## Orchestrator-level practice (added 2026-10-10 at Zaal's request)

| System | Who holds merge authority | The channel for merge state | Head moved after review | Fetch status |
|---|---|---|---|---|
| ZAO seat plus merge lane | Seat grades, merge lane merges from a pin; Zaal sets policy (item 28) | orchestrator2 pane; vault handoffs/pr-merges.md; BLACKBOARD | re-verdict required; pin is exact SHA | FULL (own files, gh api) |
| 99darwin/orchestrator | Human. SKILL.md says the orchestrator runs workers and verifiers; no merge step exists at HEAD | none in the repo; report goes to the chat | not addressed in the repo | FULL for README, SKILL.md, tree (gh api, 2026-10-10); MIT LICENSE, Copyright 2026 Nick |
| OpenHands (All-Hands-AI/OpenHands) | UNVERIFIED. README describes "Agent Canvas" automations that integrate with GitHub, Slack and Linear; the PR landing flow is not in the README | Agent Canvas control center (README) | UNVERIFIED | PARTIAL: README fetched raw (12.9 KB, 2026-10-10); docs.openhands.dev not fetched |
| Claude Code subagents and background agents | Not specified in the docs; subagents work inside one session, background agents and cross-session messaging run separate sessions (sub-agents page) | ListAgents, cross-session messaging | not in the docs | FULL (docs.claude.com sub-agents page, curl plus strip, 760 lines) |
| claude-code-action | The workflow's permissions decide; README lists PR review, comments and code changes, not merging | PR comments with progress checkboxes | not in the README | FULL for README; LICENSE first line "MIT License" read, full text not read: PARTIAL |
| Aider | Human; Aider commits each edit with a descriptive message and commits dirty files before editing them | git log | not applicable (commit per edit) | FULL (aider.chat/docs/git.html, curl plus strip) |
| Cursor background agents | UNVERIFIED | UNVERIFIED | UNVERIFIED | PARTIAL: docs.cursor.com/background-agent returned 200 with navigation text only (20 lines) |
| Devin | UNVERIFIED. Landing page lists "PR Review" as a use case | UNVERIFIED | UNVERIFIED | PARTIAL: docs.devin.ai landing page (60 lines) |
| SWE-agent | not fetched in this run | not fetched | not fetched | FAILED: not attempted after a tool error |
| Homu (bot queue, orchestrator analogy) | Reviewer r+, then bot merges after tests on the merged result | PR comments and bot status | not read | FULL README (rust-lang/homu, gh api); MIT LICENSE read, Copyright 2015 Barosl Lee |
| Kodiak | Maintainer adds `automerge` label; bot merges once CI and approvals pass | dashboard app.kodiakhq.com | not in README | FULL README (chdsbd/kodiak); AGPL-3.0 LICENSE read (copyleft: copying its code would bring share-alike duties, so the idea is described, not copied) |

Community sources: HN thread 49104747 "A local merge queue for parallel Claude Code agents" (42 points, 22 comments; read via hn.algolia.com items API). A commenter reports using CI for exclusive locks and says a local queue "theoretically can't scale"; another recommends jj with a workspace per subagent. HN thread 47520220 "Optio: Orchestrate AI coding agents in K8s to go from ticket to PR" (88 points, 58 comments, FULL via items API). A commenter asks "what stops it making total garbage"; the author answers: CI checks that must pass before merge, a review agent with a prompt, and auto-merge settings disabled so a human reviews. A reply notes a review agent "shifts the distribution of acceptable responses" rather than enforcing anything. Both support the required-check position (USE D).

### Proposal: one ZAO merge channel

One list of every open PR across the ZAO repos, with columns: repo, PR, head SHA (short), verdict (CLEAN, NEEDS_WORK or none), pin (yes or no), hold reason (billing, red head, moved head, draft, fork approval, zao-merge refusal with its text), and next action with owner and date.

- Refreshed by a loop that only reads (gh api and zao-merge --claims-only). It never merges and never flips a draft. Agent-spend rule: no polling for human actions; refresh on change, back off on quiet.
- The orchestrator pane is the channel for now (rule 36: a message is transport, not the record).
- A vault file is the record (rule 36 and handoff-discipline rule 6). Proposed path: zao-vault notes/merge-channel.md, one row per PR, rewritten by the loop.
- Scope: the list covers the repos named in this doc (ZAOOS, zaal-dotfiles, zao-vault, wavewarz-protocol, ZAOstock, ZAODEVZ/ZAOartizen). It is not a dashboard.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Approve the ZAOstock #378 fork run 37993135800 (BLACKBOARD card 149), and re-check the 30-day expiry for #432 | Zaal | Gated tap | 2026-10-12 |
| Merge zaal-dotfiles #496 (zao-pr-open: same gates at PR-open time), once its head is pinned and green | Zaal | PR merge (dotfiles) | 2026-10-14 |
| Make the seat evaluator verdict a required status in rulesets for ZAOOS and zaal-dotfiles; disable docs automerge until it is set | Zaal | Settings change (gated) | 2026-10-17 |
| Correct doc 2204: the 99darwin/orchestrator repo at HEAD has no auto-merge step (tree and SKILL.md read 2026-10-10). Open a ZAOOS PR with the fix | Zaal (reviews the PR) | PR (ZAOOS) | 2026-10-16 |
| INVESTIGATE: try a GitHub native merge queue on one private repo (zao-vault) to see whether merge_group triggers fix item 26 cost | Zaal | Decision | 2026-10-24 |
| Settle the stacked-PR question: fetch the Graphite restack docs (FAILED here) and write the result into this doc as a follow-up | Zaal (reviews) | Research PR (ZAOOS) | 2026-10-24 |
| Build the merge-channel file and refresh loop from the proposal above; first version read-only | Zaal (assigns the seat lane) | PR (vault and ZAOOS) | 2026-10-17 |

Card ids for these rows: none created in this run. Board creation is not done (the tracker step is run after the PR).

## Sources

Method key: curl = curl with a browser user agent, then Python tag strip (raw text); gh api = GitHub REST via the gh CLI (raw content or JSON); hn-api = hn.algolia.com JSON; local = file read in the worktree or from the origin/main contents API of ZAO repos. WebFetch was not used for any quoted claim.

- [GitHub Docs: Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) - [FULL, method: curl plus strip, 76 text lines]
- [GitHub Docs: Merging a pull request with a merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue) - [PARTIAL, method: curl plus strip, 34 text lines; only the merge_group and gh-readonly-queue passages were used via the managing page]
- [GitHub Docs: Approving workflow runs from public forks](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/approving-workflow-runs-from-public-forks) - [FULL, method: curl plus strip]
- [GitHub Docs: Automatically merging a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) - [FULL, method: curl plus strip]
- [Mergify merge queue docs](https://docs.mergify.com/merge-queue/) - [FULL, method: curl plus strip, 99 text lines]
- [rust-lang/homu README](https://github.com/rust-lang/homu) - [FULL, method: gh api readme, 139 lines]; LICENSE read: MIT, Copyright (c) 2015 Barosl Lee [gh api contents].
- [chdsbd/kodiak README](https://github.com/chdsbd/kodiak) - [FULL, method: gh api readme, 66 lines]; LICENSE read: GNU AFFERO GENERAL PUBLIC LICENSE Version 3 [gh api contents].
- [99darwin/orchestrator](https://github.com/99darwin/orchestrator) - [FULL for README (52 lines), skills/orchestrator/SKILL.md (gh api contents raw, grep for merge/PR/push/approve: no merge step), and the repository tree (gh api git/trees, 2026-10-10)]; LICENSE read: MIT, Copyright (c) 2026 Nick [gh api contents].
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) - [FULL for README (71 lines, gh api readme); PARTIAL for LICENSE (first line "MIT License" read, full text not read)].
- [Claude Code sub-agents docs](https://docs.claude.com/en/docs/claude-code/sub-agents) - [FULL, method: curl plus strip, 760 text lines].
- [Aider: git integration](https://aider.chat/docs/git.html) - [FULL, method: curl plus strip].
- [All-Hands-AI/OpenHands README](https://github.com/All-Hands-AI/OpenHands) - [PARTIAL, method: raw.githubusercontent README, 12.9 KB; no PR-landing text found; docs.openhands.dev not fetched].
- [Cursor background agents](https://docs.cursor.com/background-agent) - [PARTIAL, method: curl plus strip; 200 but navigation text only, 20 lines].
- [Devin docs](https://docs.devin.ai/) - [PARTIAL, method: curl plus strip; landing page only, 60 lines].
- [SWE-agent](https://swe-agent.com/latest/usage/cl_tutorial/) - [FAILED: attempted in the first batch, tool call errored; not retried].
- [ctx.rs "Why coding agents need a merge queue"](https://ctx.rs/blog/merge-queue-for-agents/) - [FAILED, method: curl, HTTP 404].
- [Graphite docs on stacked PRs](https://graphite.dev/docs/stacked-prs) and graphite-cli README (withgraphite/graphite-cli and screenplaydev/graphite-cli) - [FAILED, method: curl HTTP 404 and gh api 404 on both names].
- [Reddit thread on agents and merge queues] - [FAILED, method: zao-fetch-reddit.sh --selftest: token endpoint 401, public .json text/html, redlib 0 of 3; no thread was read].
- [HN: Show HN merge queue for parallel Claude Code agents, item 49104747](https://news.ycombinator.com/item?id=49104747) - [FULL, method: hn-api items JSON, 22 comments read first 10].
- [HN: Optio, item 47520220](https://news.ycombinator.com/item?id=47520220) - [FULL, method: hn-api items JSON, 58 comments walked].
- [HN search for "agents merge queue" and "AI agents auto merge pull requests"](https://hn.algolia.com/api/v1/search?query=agents%20merge%20queue&tags=story) - [FULL, method: hn-api search, 15 hits, 2 cited].
- [mergifyio/mergify](https://github.com/mergifyio/mergify) - [PARTIAL: license contents endpoint 404; last push 2023-09-07 per gh api; not adopted].
- [bors-ng/bors-ng](https://github.com/bors-ng/bors-ng) - [FULL for LICENSE via gh api contents (not read in full; header only): PARTIAL; not adopted].
- ZAO files, read this run: zaal-dotfiles bin/zao-merge (1660 lines), bin/zao-merge-only-guard (269), bin/zao-review-gate (501), bin/zao-review-dispatch (206) - [FULL for merge and guard passages cited; dispatch PARTIAL, grep only]. bin/zao-prs at origin/main returned 0 bytes via the contents API - [FAILED: no content read].
- ZAO vault, read from origin/main via gh api: handoffs/pr-merges.md (37 lines, [FULL]), decisions/grill-2026-10-09-seat-morning.md (108 lines, [FULL]). AGENTS.md downloaded but not read in this run - [PARTIAL].
- ZAO PR states, gh api 2026-10-10: ZAOOS #3860 MERGED, #3863 MERGED, #3864 CLOSED unmerged, #3867 MERGED, #3873 MERGED at 2026-10-10T11:26:15Z; zaal-dotfiles #494 MERGED, #495 OPEN, #496 OPEN, #497 OPEN; wavewarz-protocol #56 MERGED, #57 OPEN; ZAODEVZ/ZAOstock #378 and #432 OPEN with head fork=true [FULL].
- Local: .claude/rules/agent-loops.md rules 8, 19, 35, 36, 37 and loop-evals.md "Per-loop reliability" [FULL].

## Unverified

- UNVERIFIED: the "11 CLEAN PRs held" count in the incident brief. Only the PR states above were checked.
- UNVERIFIED: the three refusals (ZAOOS #3863, #3860, dotfiles #494) and their exact refusal text. The PRs are now merged; the refusal output was not reread.
- UNVERIFIED: the head-moved behaviour of Homu, Kodiak, Mergify and Cursor. Not in the pages read.
- UNVERIFIED: OpenHands, Cursor and Devin PR-landing and merge authority. Pages were shells or README only.
- UNVERIFIED: whether 99darwin/orchestrator has a merge step on any branch other than HEAD. Only HEAD was read.
- UNVERIFIED: the value of the seat evaluator as a required status in rulesets; GitHub's behaviour with a non-Actions status source was not read in the docs fetched.
- NOT ATTEMPTED: GitHub's Graphite-specific restack documentation, the Mergify LICENSE text, and the full claude-code-action LICENSE.

## Also See

- [Doc 2204 - cross-family verification and 99darwin orchestrator](../../agents/2204-cross-family-verification-99darwin-orchestrator/) (its auto-merge claim is corrected above)
- [Doc 2214 - multi-model code review panel](../../agents/2214-multimodel-code-review-panel/)
- [Doc 497 (agents) - quad workflow deep dive](../../agents/497-quad-workflow-deep-dive/) (note: doc 497 is ambiguous; this is the agents one, cited by path)
- [Doc 1006 - agentic coding weaknesses](../1006-agentic-coding-weaknesses-easy-fixes/)
- [Doc 2652 - self-upgrade shared resources ingest](../../agents/2652-self-upgrade-shared-resources-ingest/) (present in the agents folder; not resolved by zao-research-health in this worktree)

## Credit

- Homu (rust-lang/homu, MIT, Copyright 2015 Barosl Lee; LICENSE read): the "only merge what was tested against the current main" idea. Not adopted as code.
- Kodiak (chdsbd/kodiak, AGPL-3.0; LICENSE read): the automerge-label pattern is described, not copied. AGPL means no code is taken.
- 99darwin/orchestrator (MIT, Copyright 2026 Nick; LICENSE read): cited as the orchestrator example. Its merge claim in doc 2204 is corrected above, not adopted.
- Mergify docs: two-step CI idea, described; no code or product adopted.
- HN commenters on items 49104747 and 47520220: quoted by username only as sources for the framing.
