---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-06
related-docs: 2467, 2456, 2431
original-query: "https://x.com/hanakoxbt/status/2096364160166621318 /zao-research this" and "https://x.com/githubprojects/status/2096441743445279181?s=46 also zao-research"
tier: STANDARD
---

# 2469 - Loops vs graphs, and the 100-line agent that proves the point

> **Goal:** Zaal sent two posts an hour apart. One is a framing, one is an
> artifact, and they answer each other. Decide what the ZAO estate takes from each.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Is the loops-vs-graphs framing right about US? | **YES, and painfully** | Measured today: **20 scheduled loops** across mac cron, Pi cron and launchd, plus the Orca tick. **Zero programmatic graph layer.** What decides which jobs exist is a human in a chat window |
| Adopt `mini-swe-agent` as a tool | **NO** | It is a *loop*, and loops are the half we already have twenty of. Nothing it does is a job the estate is short of |
| Read `mini-swe-agent` for its shape | **YES** | 100 lines, MIT, and it beats far larger harnesses. It is the strongest available argument that our tooling is bigger than it needs to be |
| Believe the post's "74% of real-world programming tasks" | **NO - it is 74% of SWE-bench Verified** | 500 curated GitHub issues from 12 Python repos. A real benchmark, not "real-world programming tasks" |
| Build a graph layer | **NOT YET** | Name the nodes and edges first. `handoffs/HOW-THE-LANES-CONNECT.md` written today is the first honest edge list and it is four hours old |

## Post 1 - loops vs graphs (@hanakoxbt, 605 favourites, 87,671 views)

Its own sentence, and it is the useful one:

> *"the loop lives inside a node. the graph lives between them."*
>
> *"after six passes you have one job, done very well. after six hundred passes
> you still have one job, done very well."*

**The estate is a worked example of the failure it describes.** Counted today:

| Loop surface | Count |
|---|---|
| mac crontab | 7 |
| Pi crontab | 8 |
| launchd agents (`com.zao.*`) | 5 |
| Orca `organizer-tick` automation | 1 |
| **Total scheduled loops** | **21** |
| Programmatic graph layer | **0** |

And the "six hundred passes" line is not a metaphor here. The `organizer-tick`
automation **ran roughly 1,100 times between 2026-08-30 and 2026-09-03 and wrote
nothing** (`handoffs/needs-zaal.md`, archived). One job, done many times, while
nothing decided whether that job was still the right one.

**What we have instead of a graph is the orchestrator seat**, which is a human
conversation. Everything the seat did today - merging PRs across five repos,
merging the images lane into content, telling six lanes their edges, deciding
that ZOL's picker displaces its generator - is graph work: *which jobs exist*,
not *how well one job runs*. It works, and it does not persist, and it stops when
the window closes.

The framing's ladder is **Prompts → Context → Harness → Loops → Graphs**. We are
deep into Loops and improvising Graphs by hand.

**The honest counter, and why "build a graph engine" is the wrong next move:**
this estate has already tried eleven orchestrators in eighteen days
([[orchestration-attempts-review-2026-09-05]]) and the failure list stopped
changing on 2026-08-27. A graph layer built before the nodes and edges are
written down is orchestrator number twelve. The first real edge list in this
estate is `handoffs/HOW-THE-LANES-CONNECT.md`, written today, and it is four
hours old. **Let it survive a week before automating it.**

## Post 2 - mini-swe-agent (@GithubProjects, 386 favourites, 21,119 views)

The post's link, `osp.fyi/mini-swe-agent`, **404s**. The real repo is
`SWE-agent/mini-swe-agent`.

Snapshotted with `zao-research-snapshot` 2026-09-06 - its first real use:

| | |
|---|---|
| Stars | **7,025** |
| Forks | 977 |
| Contributors | **39** |
| Licence | **MIT** (read from the LICENSE file) |
| Last activity | 2026-09-03 |
| Top contributor | `klieret` (867 commits) - a genuine single-maintainer project |

**Credible provenance:** built by the Princeton and Stanford team behind
SWE-bench and SWE-agent, and it now powers Ramp's SWE-bench work. This is not a
weekend repo.

**The claim, corrected.** The post says "solves 74% of real-world programming
tasks". The README says **">74% on the SWE-bench verified benchmark"**. SWE-bench
Verified is 500 human-validated GitHub issues drawn from 12 Python repositories.
That is a serious benchmark and a real result. It is not "real-world programming
tasks", and the gap matters: it is Python, it is issues with existing tests, and
it is a curated set. Quote the benchmark, never the paraphrase.

**Why it is worth reading anyway.** 100 lines for the agent class. Its own pitch
is *"radically simple, no huge configs"* and it *"starts much faster than Claude
Code"*. Against an estate that measured **109 tools in `zaal-dotfiles/bin` and 84
skills totalling ~343,865 tokens of context** ([[2467]]), a 100-line agent scoring
74% on SWE-bench Verified is the sharpest available argument that our tooling is
larger than the job requires.

## The two posts against each other

This is the finding neither post makes alone.

**`mini-swe-agent` is a perfect loop.** Produce, check, correct, repeat until the
tests pass. It is 100 lines because a loop *can* be 100 lines - a well-scoped node
does not need a framework.

**Our problem has never been the loop.** ZOL's hourly cast loop worked flawlessly
for weeks; it just fabricated 65 musicians because nothing above it asked whether
the job should run when the context was empty. `organizer-tick` looped 1,100
times perfectly. `zorca-bundle` exits 0 every night. **Every failure found in this
estate this week is a loop running correctly on a decision nobody made.**

So the ladder is right and we are on the wrong rung. Adding `mini-swe-agent`
would be adding a twenty-second loop. The work is one layer up.

## Sources

- [@hanakoxbt 2096364160166621318](https://x.com/hanakoxbt/status/2096364160166621318) - **[FULL]** raw text via `zao-fetch-x.sh` tier 0, 2026-09-06
- [@GithubProjects 2096441743445279181](https://x.com/githubprojects/status/2096441743445279181) - **[FULL]** same method, 2026-09-06
- [SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) - **[FULL]** `gh api` metadata, README decoded and read, LICENSE file read, contributors listed. Snapshot recorded in `projects/research-snapshots.csv`
- `osp.fyi/mini-swe-agent` - **[FAILED - HTTP 404]** the post's own link is dead; repo found via `gh search repos`
- Estate loop count - **[FULL]** measured live: `crontab -l` on mac and Pi, `ls ~/Library/LaunchAgents`, 2026-09-06
- The 1,100 missed organizer runs - **[FULL]** `zao-vault/archive/needs-zaal-2026-09-05.md`

## Also See

- [[2467]] - agent-skill collections; the 84-skill / 343,865-token context measurement
- [[orchestration-attempts-review-2026-09-05]] - eleven orchestrators, and why a twelfth is the trap
- `zao-vault/handoffs/HOW-THE-LANES-CONNECT.md` - the estate's first written edge list

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Leave `HOW-THE-LANES-CONNECT.md` unautomated for one week, then judge whether its edges held. Shipped when a dated note says which edges were wrong | orchestrator seat | Note | 2026-09-13 |
| Read `mini-swe-agent`'s `agents/default.py` (100 lines) and write down which of our 109 bin tools it makes look oversized. Shipped when that list exists | @Zaal | Note | 2026-09-20 |
| Never cite "74% of real-world programming tasks" - it is SWE-bench Verified, 500 Python issues. Recorded here so it is not repeated | @Zaal | Decision | done 2026-09-06 |
| Do NOT adopt mini-swe-agent as a tool. Recorded so it is not re-litigated | @Zaal | Decision | done 2026-09-06 |
