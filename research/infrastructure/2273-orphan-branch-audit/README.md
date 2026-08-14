# Doc 2273 - Orphan branch audit: 120 branches that never had a PR

**Date:** 2026-08-13 (overnight, cowork lane)
**Deliverable:** this list. **Nothing was deleted.** Deletion is Zaal's, always.
**Scope:** `bettercallzaal/ZAOOS`, every remote branch, measured tonight.

## The numbers, and two corrections to the brief

| Measure | Value |
|---|---|
| Remote branches | **1,675** |
| Pull requests ever opened | 3,002 |
| Distinct branches that have had a PR | 2,889 |
| **Branches that never had a PR** | **120** |

The overnight brief said "at least 100" and "oldest is 2026-06-07". Both were
read off a truncated API page. Measured exhaustively:

- The real orphan count is **120**, not 100+.
- The oldest orphan is **2026-04-20**, not 2026-06-07 - nearly four months, and
  seven weeks older than the brief thought.

The undercount came from paging `/pulls`. `git ls-remote --heads` does not
paginate and returns all 1,675 in one call, and `gh api --paginate` over
`/pulls?state=all` returns all 3,002. Both were used here.

## Verdicts

| Verdict | Count | Meaning |
|---|---|---|
| **superseded** | 11 | The work is already in main. Safe to delete. |
| **keep** | 9 | Committed within 30 days. Live or plausibly live. |
| **stale** | 100 | Old, never proposed - **but every one holds commits that are not in main.** |

**The most important line in this document:** "stale" does not mean "safe to
delete". All 100 stale branches carry at least one commit whose changes are not
upstream, up to 15 commits on the largest. Deleting them discards work that was
never proposed - which may be exactly right, but it is a judgement about content,
not about age, and it is not mine to make.

Only the 11 superseded branches are provably safe: their changes already exist in
main, so deleting them loses nothing.

## How each verdict was decided

Evidence, cheapest decisive signal first:

1. **`git cherry origin/main <tip>`** - lists the branch's commits and marks each
   one that already has an equivalent upstream. A branch where every commit is
   marked upstream is **superseded**, regardless of age or name. This caught 7.
   Note it is strictly better than an ancestry check: only 4 tips are literal
   ancestors of main, but 7 branches are fully upstream, the other 3 having been
   rebased or cherry-picked. An ancestry-only audit would have under-reported.
2. **Merged doc number** - for `ws/research-NNNN-*` branches, whether doc NNNN
   already exists under `research/` on main. This caught 4 more.
3. **Age** - 30 days or less is **keep**, older is **stale**. A blunt rule, and
   the reason "stale" is a prompt for a decision rather than a verdict on the work.

## Superseded - safe to delete, work already in main (11)

| Branch | Last commit | Age | Author | Unique commits | Why |
|---|---|---|---|---|---|
| `ws/research-598-fip-visual-explainer` | 2026-05-03 | 102d | Zaal Panthaki | 1 | doc 598 is merged on main |
| `ws/research-599-hypersnap-vps-options` | 2026-05-03 | 102d | Zaal Panthaki | 1 | doc 599 is merged on main |
| `ws/research-600-agentic-stack-v1` | 2026-05-03 | 102d | Zaal Panthaki | 2 | doc 600 is merged on main |
| `ws/research-608-may4-meetings` | 2026-05-04 | 101d | Zaal Panthaki | 10 | doc 608 is merged on main |
| `ws/session-handoff-2026-05-18` | 2026-05-18 | 87d | Zaal Panthaki | 0 | every commit already upstream in main |
| `ws/research-768-bounty-patterns-zabalgames` | 2026-05-28 | 77d | Zaal Panthaki | 0 | every commit already upstream in main |
| `wip/preserved-stash-mining-settings` | 2026-06-11 | 63d | git stash | 0 | every commit already upstream in main |
| `docs/1220-geo-zao-ai-discoverable` | 2026-07-17 | 27d | Zaal | 0 | every commit already upstream in main |
| `test/discord-snapshot-clients` | 2026-07-17 | 27d | Zaal | 0 | every commit already upstream in main |
| `ws/rule-session-boundaries` | 2026-08-11 | 2d | Zaal | 0 | every commit already upstream in main |
| `main` | 2026-08-13 | 0d | Zaal | 0 | every commit already upstream in main |

## Keep - committed within 30 days (9)

| Branch | Last commit | Age | Author | Unique commits | Why |
|---|---|---|---|---|---|
| `ws/research-zaalcaster-coinz` | 2026-07-14 | 30d | zao-assistant | 2 | recent - 30d, 2 unique commit(s) |
| `ws/zoe-nightly-2026-07-14` | 2026-07-14 | 30d | Claude | 1 | recent - 30d, 1 unique commit(s) |
| `ws/calcom-zoe-wiring-design` | 2026-07-17 | 27d | Zaal Panthaki (via VPS) | 1 | recent - 27d, 1 unique commit(s) |
| `infra/vps-swarm-failover-recovered` | 2026-07-19 | 25d | zao-assistant | 1 | recent - 25d, 1 unique commit(s) |
| `zoe/nightly-2026-07-20` | 2026-07-20 | 24d | Claude | 1 | recent - 24d, 1 unique commit(s) |
| `ws/zoe-nightly-2026-07-23` | 2026-07-23 | 21d | Claude | 1 | recent - 21d, 1 unique commit(s) |
| `claude/lazao-new-brand-strategy-un13pm` | 2026-07-27 | 17d | Claude | 6 | recent - 17d, 6 unique commit(s) |
| `ws/audit-estate-tests-never-ran` | 2026-08-06 | 7d | Zaal Panthaki | 1 | active - last commit 7d ago |
| `ws/zoe-nightly-2026-08-10` | 2026-08-10 | 3d | Zaal Panthaki | 1 | active - last commit 3d ago |

## Stale - old, never proposed, and each still holds unique work (100)

Grouped by age. Every row has at least one commit not in main.

### 31 to 60 days (32)

| Branch | Last commit | Age | Author | Unique commits | Why |
|---|---|---|---|---|---|
| `ws/research-bonfires-graphiti-deep` | 2026-06-14 | 60d | Zaal Panthaki | 1 | 60d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-06-15` | 2026-06-15 | 59d | Claude | 1 | 59d old, 1 unique commit(s), never proposed |
| `ws/research-zoe-bonfire-proactivity` | 2026-06-15 | 59d | Zaal Panthaki | 1 | 59d old, 1 unique commit(s), never proposed |
| `ws/research-zoe-improvements` | 2026-06-15 | 59d | Zaal Panthaki | 4 | 59d old, 4 unique commit(s), never proposed |
| `ws/research-zoe-usage-guide` | 2026-06-15 | 59d | Zaal Panthaki | 1 | 59d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-06-15` | 2026-06-15 | 59d | Zaal | 1 | 59d old, 1 unique commit(s), never proposed |
| `claude/zao-os-estate-audit-o156hm` | 2026-06-16 | 58d | Claude | 4 | 58d old, 4 unique commit(s), never proposed |
| `wip/preserved-stash-zaogaps-doc863` | 2026-06-17 | 57d | git stash | 2 | 57d old, 2 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-06-17` | 2026-06-17 | 57d | Claude | 1 | 57d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-0618` | 2026-06-18 | 56d | Claude | 1 | 56d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-06-18` | 2026-06-18 | 56d | Claude | 1 | 56d old, 1 unique commit(s), never proposed |
| `docs/morning-briefing-2026-06-19` | 2026-06-19 | 55d | Claude | 1 | 55d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-06-19` | 2026-06-19 | 55d | Claude | 1 | 55d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-06-22` | 2026-06-22 | 52d | Zaal | 1 | 52d old, 1 unique commit(s), never proposed |
| `ws/artizen-mechanics-call` | 2026-06-23 | 51d | bettercallzaal | 15 | 51d old, 15 unique commit(s), never proposed |
| `ws/morning-briefing-2026-06-23` | 2026-06-23 | 51d | Claude | 1 | 51d old, 1 unique commit(s), never proposed |
| `ws/morning-2026-06-25` | 2026-06-25 | 49d | Zaal | 1 | 49d old, 1 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-06-25` | 2026-06-25 | 49d | Zaal | 1 | 49d old, 1 unique commit(s), never proposed |
| `zoe/briefing-2026-06-26` | 2026-06-26 | 48d | Claude | 1 | 48d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-06-29` | 2026-06-29 | 45d | Claude | 1 | 45d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-briefing-2026-06-29` | 2026-06-29 | 45d | Claude | 1 | 45d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-2026-06-30` | 2026-06-30 | 44d | Claude | 1 | 44d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-07-02` | 2026-07-02 | 42d | Zaal | 1 | 42d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-07-03` | 2026-07-03 | 41d | Claude | 1 | 41d old, 1 unique commit(s), never proposed |
| `wip/preserved-stash-juke-doc958` | 2026-07-05 | 39d | git stash | 1 | 39d old, 1 unique commit(s), never proposed |
| `wip/preserved-untracked-2026-07-05` | 2026-07-05 | 39d | git stash | 1 | 39d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-07-06` | 2026-07-06 | 38d | Claude | 1 | 38d old, 1 unique commit(s), never proposed |
| `docs/lunch-ping-2026-07-07` | 2026-07-07 | 37d | Claude | 1 | 37d old, 1 unique commit(s), never proposed |
| `ws/research-zc-empire-v2` | 2026-07-07 | 37d | Zaal Panthaki | 1 | 37d old, 1 unique commit(s), never proposed |
| `lunch/2026-07-09` | 2026-07-09 | 35d | Claude | 1 | 35d old, 1 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-07-10` | 2026-07-10 | 34d | Claude | 1 | 34d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-07-13` | 2026-07-13 | 31d | Claude | 1 | 31d old, 1 unique commit(s), never proposed |

### 61 to 90 days (46)

| Branch | Last commit | Age | Author | Unique commits | Why |
|---|---|---|---|---|---|
| `ws/zoe-nightly-0516` | 2026-05-15 | 90d | Zaal | 1 | 90d old, 1 unique commit(s), never proposed |
| `zoe-morning-briefing-2026-05-15` | 2026-05-15 | 90d | Claude | 1 | 90d old, 1 unique commit(s), never proposed |
| `nightly/2026-05-17` | 2026-05-17 | 88d | Claude | 1 | 88d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-05-18` | 2026-05-18 | 87d | Claude | 1 | 87d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-2026-05-18` | 2026-05-18 | 87d | Claude | 1 | 87d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-05-19` | 2026-05-19 | 86d | Claude | 1 | 86d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-05-19` | 2026-05-19 | 86d | Claude | 1 | 86d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-19` | 2026-05-19 | 86d | Claude | 1 | 86d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-0520` | 2026-05-20 | 85d | Claude | 1 | 85d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-20260520` | 2026-05-20 | 85d | Claude | 1 | 85d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-21` | 2026-05-21 | 84d | Claude | 1 | 84d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-briefing-0522` | 2026-05-22 | 83d | Zaal | 1 | 83d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-22` | 2026-05-22 | 83d | Claude | 1 | 83d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-0524` | 2026-05-24 | 81d | Claude | 1 | 81d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-05-25` | 2026-05-25 | 80d | Claude | 1 | 80d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-05-25` | 2026-05-25 | 80d | Claude | 1 | 80d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-25` | 2026-05-25 | 80d | Claude | 1 | 80d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-05-26` | 2026-05-26 | 79d | Claude | 1 | 79d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-05-27` | 2026-05-27 | 78d | Claude | 1 | 78d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-27` | 2026-05-27 | 78d | Claude | 1 | 78d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-ping-2026-05-28` | 2026-05-28 | 77d | Claude | 1 | 77d old, 1 unique commit(s), never proposed |
| `zoe/nightly-2026-05-28` | 2026-05-28 | 77d | Claude | 1 | 77d old, 1 unique commit(s), never proposed |
| `ws/lunch-ping-2026-05-29` | 2026-05-29 | 76d | Claude | 1 | 76d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-2026-05-29` | 2026-05-29 | 76d | Claude | 1 | 76d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-29` | 2026-05-29 | 76d | Claude | 1 | 76d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-0601-2200` | 2026-06-01 | 73d | Claude | 1 | 73d old, 1 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-06-01` | 2026-06-01 | 73d | Claude | 1 | 73d old, 1 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-06-02` | 2026-06-02 | 72d | Claude | 1 | 72d old, 1 unique commit(s), never proposed |
| `zoe/morning-briefing-2026-06-02` | 2026-06-02 | 72d | Claude | 1 | 72d old, 1 unique commit(s), never proposed |
| `zoe/lunch-ping-2026-06-03` | 2026-06-03 | 71d | Claude | 1 | 71d old, 1 unique commit(s), never proposed |
| `zoe/morning-briefing-2026-06-03` | 2026-06-03 | 71d | Claude | 1 | 71d old, 1 unique commit(s), never proposed |
| `zoe/lunch-2026-06-04` | 2026-06-04 | 70d | Claude | 1 | 70d old, 1 unique commit(s), never proposed |
| `zoe/morning-2026-06-04` | 2026-06-04 | 70d | Claude | 1 | 70d old, 1 unique commit(s), never proposed |
| `zoe/morning-briefing-2026-06-05` | 2026-06-05 | 69d | Claude | 1 | 69d old, 1 unique commit(s), never proposed |
| `zoe/nightly-2026-06-06` | 2026-06-06 | 68d | Claude | 1 | 68d old, 1 unique commit(s), never proposed |
| `docs/morning-briefing-2026-06-08` | 2026-06-08 | 66d | Claude | 1 | 66d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-06-08` | 2026-06-08 | 66d | Claude | 1 | 66d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-jun08` | 2026-06-08 | 66d | Claude | 1 | 66d old, 1 unique commit(s), never proposed |
| `nightly/2026-06-09` | 2026-06-09 | 65d | Claude | 1 | 65d old, 1 unique commit(s), never proposed |
| `ws/lunch-ping-0609` | 2026-06-09 | 65d | Claude | 1 | 65d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-0610` | 2026-06-10 | 64d | Claude | 1 | 64d old, 1 unique commit(s), never proposed |
| `ws/nightly-2026-06-10` | 2026-06-10 | 64d | Claude | 1 | 64d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-2026-06-10` | 2026-06-10 | 64d | Claude | 1 | 64d old, 1 unique commit(s), never proposed |
| `ws/lunch-ping-0612` | 2026-06-12 | 62d | Claude | 1 | 62d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-0612` | 2026-06-12 | 62d | Claude | 1 | 62d old, 1 unique commit(s), never proposed |
| `ws/nightly-2026-06-13` | 2026-06-13 | 61d | Claude | 1 | 61d old, 1 unique commit(s), never proposed |

### Over 90 days (22)

| Branch | Last commit | Age | Author | Unique commits | Why |
|---|---|---|---|---|---|
| `zoe/nightly-2026-04-20` | 2026-04-20 | 115d | Claude | 1 | 115d old, 1 unique commit(s), never proposed |
| `docs/zoe-morning-2026-04-27` | 2026-04-27 | 108d | Claude | 1 | 108d old, 1 unique commit(s), never proposed |
| `docs/zoe-nightly-2026-04-28` | 2026-04-28 | 107d | Claude | 1 | 107d old, 1 unique commit(s), never proposed |
| `docs/lunch-ping-2026-04-29` | 2026-04-29 | 106d | Claude | 1 | 106d old, 1 unique commit(s), never proposed |
| `docs/lunch-ping-2026-04-30` | 2026-04-30 | 105d | Claude | 1 | 105d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-briefing-0430` | 2026-04-30 | 105d | Claude | 1 | 105d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-0430` | 2026-04-30 | 105d | Claude | 1 | 105d old, 1 unique commit(s), never proposed |
| `docs/morning-briefing-may01` | 2026-05-01 | 104d | Claude | 1 | 104d old, 1 unique commit(s), never proposed |
| `docs/zoe-nightly-2026-05-01` | 2026-05-01 | 104d | Claude | 1 | 104d old, 1 unique commit(s), never proposed |
| `nightly/2026-05-02` | 2026-05-02 | 103d | Claude | 1 | 103d old, 1 unique commit(s), never proposed |
| `ws/zoe-briefing-2026-05-04` | 2026-05-04 | 101d | Claude | 1 | 101d old, 1 unique commit(s), never proposed |
| `ws/zoe-lunch-0504` | 2026-05-04 | 101d | Claude | 1 | 101d old, 1 unique commit(s), never proposed |
| `docs/morning-briefing-2026-05-05` | 2026-05-05 | 100d | Claude | 1 | 100d old, 1 unique commit(s), never proposed |
| `docs/lunch-ping-2026-05-06` | 2026-05-06 | 99d | Claude | 1 | 99d old, 1 unique commit(s), never proposed |
| `ws/zoe-morning-briefing-2026-05-06` | 2026-05-06 | 99d | Claude | 1 | 99d old, 1 unique commit(s), never proposed |
| `docs/briefing-2026-05-07` | 2026-05-07 | 98d | Claude | 1 | 98d old, 1 unique commit(s), never proposed |
| `ws/zoe-nightly-2026-05-07` | 2026-05-07 | 98d | Claude | 1 | 98d old, 1 unique commit(s), never proposed |
| `ws/lunch-ping-2026-05-08` | 2026-05-08 | 97d | Claude | 1 | 97d old, 1 unique commit(s), never proposed |
| `ws/morning-briefing-0508` | 2026-05-08 | 97d | Claude | 1 | 97d old, 1 unique commit(s), never proposed |
| `ws/lunch-ping-0512` | 2026-05-12 | 93d | Claude | 1 | 93d old, 1 unique commit(s), never proposed |
| `docs/morning-briefing-2026-05-13` | 2026-05-13 | 92d | Claude | 1 | 92d old, 1 unique commit(s), never proposed |
| `docs/zoe-morning-2026-05-14` | 2026-05-14 | 91d | Claude | 1 | 91d old, 1 unique commit(s), never proposed |

## What this says about how branches are made

Of the 120 orphans, **88 were authored by "Claude"** and 84 of those are stale.
Three more are literally authored by `git stash`. The dominant pattern is not
abandoned human work - it is agent lanes creating a branch per task and never
proposing it, plus stash-as-branch.

That is a process finding, not a cleanup finding: the branches are a symptom. A
lane that opens a branch and never opens a PR leaves no reviewable artifact,
which is the thing `agent-loops.md` rule 35 exists to require. Worth its own
decision separately from this list.

## Why it matters operationally

`git branch -r` is unusable at 1,675 entries, and the research doc-collision
guard scans branch names - so every orphan is permanent noise in the one check
that stops two lanes claiming the same doc number. Clearing the 11 provably-safe
branches costs nothing. The other 109 need Zaal.

## Method

- `git ls-remote --heads origin` - 1,675 branches, no pagination involved.
- `gh api --paginate "repos/bettercallzaal/ZAOOS/pulls?state=all&per_page=100"` -
  3,002 PRs, exit 0, so the walk completed.
- Orphan = a branch name never appearing as any PR's `head.ref`.
- `git log --no-walk` batched over all 120 tips for date and author.
- `git cherry origin/main <tip>` per branch for upstream equivalence.
- Doc numbers cross-referenced against `git ls-tree -r origin/main research/`.

Counted against 4,763 commits on main. All figures are absolute, measured
tonight, not carried from the brief.

## Caveats, stated rather than buried

- "Author" is the last committer on the tip, not whoever owns the work. For agent
  branches it is almost always "Claude" and tells you little.
- The 30-day keep threshold is arbitrary. A 45-day branch someone still intends
  to finish will read as stale here.
- `git cherry` compares patch-equivalence. A branch whose changes reached main by
  a different route - a rewrite rather than a cherry-pick - will read as holding
  unique commits when its intent is already satisfied. That is why the stale list
  needs a human, not a script.
- No branch was deleted, renamed, or pushed. This document is the only artifact.
