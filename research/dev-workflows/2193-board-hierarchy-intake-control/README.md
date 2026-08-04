---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-04
related-docs: 765, 2090, 763, 1035, 2079
original-query: "Board hierarchy: brand -> 1-3 goals -> tasks -> subtasks, collapsible. Most subtasks don't need to be seen unless opened by a collapsing thing; each brand should have 1-3 main goals and people can see under those what each of the sub tasks and sub sub tasks are so we can always dive deeper. Plus: instead of stopping the escalator, find a way to autonomously hammer those down and research if it's erroneous or not and fix if needed or leave as something to build on."
tier: DEEP
---

# 2193 - Board hierarchy + intake control: what to build, and in what order

> **Goal:** Settle the ZAOcowork hierarchy question (brand -> goals -> tasks -> subtasks) against 40 years of depth-vs-breadth research and the board's own measured usage, and decide whether the escalator's output gets throttled at intake or consumed by an autonomous triage loop.

## Key Decisions

| # | Decision | Why | Effort |
|---|----------|-----|--------|
| 1 | **BUILD the Goal layer. Cap navigable depth at 3 (Brand > Goal > Task).** The 4th level is a **checklist inside the task**, not a row on the board. | Kiger 1984 and Wallace/Anderson/Shneiderman 1987 both measured it: deep-tree users made **96% more errors and took 16% longer** under time pressure. Bergman 2010 tracked 5,035 real navigation steps and found people's own files sit **2.86 folders deep** when nobody forces a structure. Cowan 2001 puts working memory at **~4 chunks** - every level traversed spends one. Zaal is a solo operator under time pressure; that is the exact condition the deep tree fails in. | 8 hr |
| 2 | **DO NOT build sub-subtasks.** Decomposition is good; hierarchy is not. | Nozbe has refused sub-projects for 19 years and customers who left for nested trees came back saying "it was harder to get things done." Jira's own tracker (JRACLOUD-4446) closed the sub-sub-task request: "Creating levels below sub-tasks is not in our plans." Kruger & Evans 2004 showed listing steps cuts the planning fallacy by **half** - so you need the steps, just not a permanent nested structure to hold them. | 0 (negative) |
| 3 | **The escalator's output is NOT erroneous - it is undefined.** Fix definition-at-capture BEFORE building a triage consumer. | Measured: **93 of 93** open escalated tasks have **zero notes and zero owner**. Titles are plausible ("Check open PRs for ZAOstock app"), so a triage agent cannot tell good from noise - there is nothing to read. Bui et al. (arxiv 2512.21426) found ticket-quality features alone predict agent merge success at **72% AUC**. The ticket is the prompt. | 3 hr |
| 4 | **THEN build the autonomous consumer loop (Zaal's call, 2026-08-04). It is the right architecture and it has a live precedent.** | Cloudflare/Astro published **2026-08-04**: an automated triage pipeline took Astro from **200+ open issues to ~30**, expecting zero within a month - the first time in the repo's 5-year history. Explicitly *not* by "declaring issue bankruptcy, auto-closing cold tickets, or ignoring reports." This validates consuming over throttling. | 12 hr |
| 5 | **Dedup must use similarity, not equality.** | Measured: **0 exact duplicate titles** among 94 escalated tasks, but **34 (36%) are near-duplicates** at Jaccard >= 0.5 on title words. An exact-match dedup would report a clean board. `findSimilar` in `src/lib/task-quality.ts` is already written and unit-tested - and is **called by nothing** on the escalation path. | 2 hr (wiring only) |
| 6 | **Fix the `source` field before anything reads it.** | The escalator writes `source='human-web'` - it **masquerades as a human using the web UI**. Doc 765's entire provenance taxonomy (decision #2) is defeated by one mislabeled writer. Every "who created this" filter is currently wrong. | 1 hr |
| 7 | **Run migration 027 first, as doc 2090 already said.** | Still unrun. `The ZAO` is **62% of the open board**, plus `zoe`/`ZOE`, `zao`/`The ZAO`, `zabalgamez`/`ZABAL Games` case splits and a `build` tag on 127 tasks that is not a brand. Goals hung off a broken taxonomy inherit the break. | 1 hr |
| 8 | **DO NOT adopt reviewer-backpressure throttling.** | The dev.to team that built AI-generation backpressure reports it plainly: "We tried this on a 3-person team. Abandoned after 2 weeks." Their own "when it doesn't work" list leads with **teams under 5 people**. ZAO is 3. | 0 (negative) |

**Order: 7 -> 6 -> 3 -> 5 -> 1 -> 4.** Taxonomy, then provenance, then definition, then dedup, then structure, then automation. Every earlier step is a precondition for the next; doing 1 or 4 first means redoing them.

---

## The measured state (2026-08-04, live DB)

| Metric | Value | Note |
|---|---|---|
| Open tasks | **489** | 478 todo / 7 in_progress / 4 blocked |
| Tasks with a `parent_task_id` | **0 of 938** | Column, server actions, and TaskRoom UI all exist. Never used once. |
| `goals` table rows | **0** | Table exists. **Zero code readers** - `grep` finds no `from("goals")` anywhere in `src/`. |
| `projects` table | live, with a full data layer | `src/lib/projects.ts` - 6 query sites |
| DONE but unarchived | **449** | Separate from the 591 that did archive |
| Escalated tasks created (lifetime) | **94** | `legacy_source='escalated'` |
| Escalated ever completed | **1** | **1.06%** |
| Escalated archived | **0** | Nothing ages out |
| Escalated with no notes | **93 of 93** open | 100% |
| Escalated with no owner | **93 of 93** open | 100% |
| Escalated exact-duplicate titles | **0** | |
| Escalated near-duplicates (Jaccard >= 0.5) | **34 (36%)** | The dupes are semantic, not textual |

The near-duplicate pattern, verbatim from the board:

```
Process PR #244: artist rider tracker
Process PR #244 for volunteer coordination
```

Same PR. Two tasks. Zero shared words beyond "Process PR #244". No exact-match dedup will ever catch this.

---

## Part 1 - The hierarchy question

### What the ask was

Brand -> 1-3 goals -> subtasks -> sub-subtasks, all collapsible, with most detail hidden until opened.

### What the research says

Four decades of depth-vs-breadth work converges hard, and it is unusually consistent for HCI:

| Study | Finding |
|---|---|
| Miller 1981; Snowberry, Parkinson & Sisson 1983 | Menu depth degrades performance; replicated in *Ergonomics* |
| Kiger 1984 | Same 64 items in 5 arrangements: time **and** errors rose with depth; shallowest was best-liked |
| Wallace, Anderson & Shneiderman 1987 | Under time pressure, deep-tree users: **96% more errors, 16% longer** |
| Jacko & Salvendy 1996 | Users *perceive* hierarchical structures as more complex - stress from looking at it |
| Cowan 2001 | Working memory ~**4 chunks**, revising Miller's 7±2 down |
| Bergman et al. 2010 | 296 people, 1,131 real files, 5,035 navigation steps: average depth **2.86 folders** |
| Kruger & Evans 2004 | Enumerating steps cuts the planning fallacy by **>50%** - strongest on complex tasks |
| Haynes et al. 2009 (NEJM) | WHO Surgical Safety Checklist: deaths 1.5% -> 0.8%. **19 items on one flat sheet.** Not a tree. |

The last two are the important pair. Breaking work down *genuinely works*. Holding the breakdown in a permanent nested structure is what costs you. Sliwinski's formulation after 19 years of refusing the feature at Nozbe: **"Decomposition is good, hierarchy is not."**

His mechanism is the part that applies directly here: *a hierarchy is a decision machine.* Every capture asks "where does this belong?" and every retrieval asks "where did I put it?" - forever. For a board whose capture path is already failing (93/93 undefined), adding two more placement decisions per capture makes the failing step harder.

### What the practitioners say

Not just theory - this is the consensus across every tracker community:

- **Atlassian Community (2026-02-19)** gives the cleanest litmus test: *subtask if it has a different owner or a different deadline; checklist if it is the steps one person takes to reach Done.* Their warning: 50 subtasks that are "Update doc" / "Send email" clutter reports and make the big picture unreadable.
- **Asana forum**: subtasks do not inherit assignee, due date, or tags; do not appear in calendar views; cannot hold custom fields. Consensus from an Asana Success Manager: **one layer deep, maximum**.
- **Jira** (JRACLOUD-4446) has *declined* sub-sub-tasks outright.
- **druchan's notes** describes exactly the ZAO situation in miniature: a Linear "project" with 4 issues (`frontend`, `backend`, `research`, `acceptance test`) collapsed into **one ticket with markdown checklists**. His diagnosis of the deep version: you click down three layers "only to find that that particular item hasn't been updated since inception because the developer couldn't be bothered to update an item so far down the layer-hole."
- **GitHub** did ship sub-issues (2025) - and needed a denormalized rollup table just to render progress without traversing the tree. Worth noting the cost even when the answer is yes.

### The 0-of-938 result is the local proof

ZAOcowork already built persistent subtasks: the `parent_task_id` column, three server actions (`actions.ts:1368-1469`), and a subtask panel with a done-counter in `TaskRoom.tsx:691-766`. In **zero** of 938 tasks has anyone ever set a parent.

Doc 765 predicted this on 2026-05-27 - decision #1 said add **one** layer (Project) and explicitly declined persistent subtasks: *"Skipping persistent subtasks keeps the data model lean."* They were built anyway. The board ran the experiment and the answer came back 0/938.

### The decision

```
Brand          cross-cutting tag, many-per-task        (exists, needs 027)
  Goal         1-3 per brand, the ask                  (BUILD - use projects, not goals)
    Task       the unit of work                        (exists)
      [ ] checklist item   <- inside the task, not a row on the board
```

Three navigable levels. The 4th is a checklist in the task body - you get the decomposition Kruger & Evans measured, without the branch you maintain forever. This is what Nozbe does (checklists in comments, one-click promote to project when a checklist outgrows itself) and what druchan converged on independently.

**Build on `projects`, not `goals`.** `goals` has 0 rows and 0 readers; `projects` has 15 columns and a working data layer at `src/lib/projects.ts`. Adding a `goals` reader means writing persistence that already exists next door.

**Keep brands independent of goals** - doc 765 already resolved this: brands are cross-cutting market tags, a goal is time-bounded. Nozbe's project *groups* make the same call for the same reason: one project belongs to several groups, because "in a tree, it would have to pick one. Reality doesn't work that way." A "brand voice consolidation" goal spans four brands.

### Collapse-by-default is already built

`Board.tsx:415-462` already has group-by-brand with per-user collapse state persisted to `localStorage` under `zao-board-collapsed`. The ask's "collapsible thing" exists. What it lacks is a layer worth collapsing *into* - today opening "The ZAO" reveals a flat 304-row list.

---

## Part 2 - Why 765 and 2090 did not ship

This matters more than the design, because the design was already correct twice.

| Doc | Date | Decision | Status today |
|---|---|---|---|
| 765 | 2026-05-27 | Add ONE layer (Project). Skip persistent subtasks. Add `source` provenance field. | Project layer unbuilt. Subtasks built anyway, 0/938 used. `source` field built - and **written wrong**. |
| 2090 | 2026-07-27 | Phase 0 = brand taxonomy migration BEFORE any UI work. Then grouping, then overview strip. | Migration 027 written, **never run**. Grouping + strip shipped. |

Doc 2090's Next Actions table gave `2026-08-03` for "Phase 0 + Phase 1 as one PR." That date passed yesterday. Phase 1 shipped; Phase 0 - the prerequisite - did not. The board went **309 -> 489 in the 8 days since 2090 was written**.

The pattern is not a planning failure. Both docs picked the right decisions. The failure is that the *unglamorous prerequisite* (a data migration) gets skipped in favour of the *visible* work (a UI strip), and then the visible work sits on a broken base. Migration 027's own header says it: *"PHASE 0 of the UI/UX upgrade. DATA CHANGE - read this before running."*

**Implication for this doc:** decisions 7 and 6 are data-layer chores with no screenshot. They are exactly the kind that got skipped twice. If they get skipped a third time, decisions 1 and 4 will fail the same way.

---

## Part 3 - The escalator: consume, don't throttle

### Zaal's call (2026-08-04)

> "what if we instead find a way to autonomously hammer those down and then research if its erroneous or not and fix if needed or leave as something to build on todos"

**This is the right architecture, and there is a same-day precedent.**

### The precedent

Cloudflare published the Astro triage pipeline on **2026-08-04**. Results: **200+ open issues down to ~30**, expecting zero within the month - first time in the repository's 5+ year history. Their framing is a direct match to Zaal's:

> "We didn't get there by declaring 'issue bankruptcy,' auto-closing cold tickets, or ignoring reports. We did it by automating issue triage with a team of isolated AI subagents."

The architecture, and what transfers:

| Astro's design | Transfers to ZAOcowork? |
|---|---|
| 4 phases: Reproduce -> Diagnose -> Verify -> Fix | Yes, as: Resolve source -> Check if already done -> Dedup -> Close or define |
| **Each phase an isolated subagent**, passing a `report.md` forward | Yes - and this is the load-bearing part. Their stated reason: *"to prevent the frequent LLM bias toward forcing a solution when a bug might not actually exist."* That bias is exactly what created 94 escalated tasks. |
| State machine driven by **labels**, no state of its own | Yes - `status` + a `triage` tag. The board already has the columns. |
| Agent failure treated as a **signal about the codebase**, not the agent | Yes, inverted: an un-triageable task is a signal about the *capture path*. |
| Preview release for the reporter to verify | No - no external reporter here. Zaal is the verifier. |

Their failure-interpretation rule is the one to steal wholesale: when the agent could not resolve something, they did not tune the agent - they fixed the **opaque abstraction, missing documentation, or absent test** that made it unresolvable. Applied here: when the triage agent cannot decide on an escalated task, that is a defect in the escalator's output format, and the fix goes upstream.

### Why decision 3 comes before decision 4

Astro's pipeline works because an Astro bug report **contains a reproduction repository**. The agent has something to clone, run, and verify against. Definition arrives at capture.

ZAO's escalated tasks contain a title. That is all. **93 of 93 have zero notes.** A triage agent handed *"Advance BetterCallZaal brand with content and PR"* with no body, no acceptance criteria, no source link, and no owner cannot determine whether it is erroneous - because there is no fact to check it against. It would have to *invent* a judgment, which is the same failure that produced the task.

This is not speculation. Bui et al. (arxiv 2512.21426) studied 2,000+ Copilot-assigned issues and found **ticket-quality features alone predict merge outcome at 72% AUC** - the dominant variance is in the ticket, not the agent. And the ZAO board already proved it locally: measured across 1,367 tasks, `source` outperforms priority and due-date as a completion predictor with a **44-point spread**, and the 100%-completion buckets (`research-dispatch`, `pr-test-task`) share exactly one trait - **the work was already defined at capture.**

So the minimum viable escalator fix, before any consumer is built:

1. Write a **source link** (the PR, doc, or message that triggered it) into notes.
2. Write a **done-condition** - one sentence, what observable thing exists when this is finished.
3. Write `source='escalated'`, not `'human-web'` (decision 6).
4. Call `findSimilar` before insert and skip at Jaccard >= 0.5 (decision 5) - this alone would have stopped **34 of 94**.

Items 3 and 4 are pure wiring against code that already exists.

### What the consumer loop then does

Per escalated task, in isolated phases:

| Phase | Question | Terminal action |
|---|---|---|
| Resolve | Does the source link still exist / is the PR merged? | Close as **already done** |
| Dedup | `findSimilar` against all open tasks | **Merge** into the elder |
| Verify | Is the done-condition already true on main? | Close as **satisfied** |
| Define | None of the above - can it be made actionable? | Add acceptance criteria, **leave as a real todo** |

That last row is Zaal's "leave as something to build on." The loop's output is not deletion - it is a smaller board where every survivor is defined.

### The guardrails to copy (and the one to skip)

From GitHub Agentic Workflows' rate-limiting reference - defense in depth against exactly this failure:

- **`assign-to-agent` default max: 1.** Their stated reason: *"Without limits, one workflow could spawn three agents, each spawning three more, creating exponential growth."* The ZAO escalator has no such cap; that is the mechanism behind 126/day.
- **Bot output does not re-trigger workflows.** The `github-actions[bot]` account is non-triggering by design. A consumer loop that writes tasks which re-enter the escalator is an infinite loop - this is the single highest-risk failure mode of decision 4.
- **Hardcoded delays** (10s between agent assignments) to break burst patterns.
- **Opt-in pickup filter.** AgentPatterns.ai names this load-bearing: without a label or template gate, you get the GitHub-scale pattern - agent-authored PRs went **4M (Sept 2025) -> 17M (March 2026)**, with roughly **1 in 10** worth reviewing. GitHub shipped per-user open-PR caps on **2026-06-17** in response; issue caps are still in development.

**Skip the backpressure pattern.** It is the theoretically elegant answer (bounded queue + semaphore + token bucket + dead-letter) and it is wrong at this size. The dev.to team that shipped it reports: *"We tried this on a 3-person team. Abandoned after 2 weeks."* Their own "when it doesn't work" list leads with teams under 5 people. ZAO is 3. A cap of 1 and a dedup call gets 90% of the benefit at 2% of the build.

---

## Also See

- [Doc 765](../765-coordination-layers-agent-human/) - decided the Project layer + source taxonomy on 2026-05-27. This doc confirms both with 2 months of usage data and explains why neither shipped.
- [Doc 2090](../2090-async-coordination-board-uiux/) - Phase 0 brand taxonomy. **Its 2026-08-03 action is overdue**; decision 7 here is the same migration.
- [Doc 763](../763-kanban-async-team-best-practices/) - continuous flow over sprints; source of the WIP-limit call.
- [Doc 1035](../1035-cowork-audit-lss-agile/) - the DMAIC/service-class instrumentation now measured as decorative.
- [Doc 2079](../../community/2079-iman-cowork-audit-build-backlog/) - Iman's board bug backlog.
- Tracker task `9042` (todo) - the UI PR batch this hierarchy work lands on top of.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run migration 027 against prod; verify `The ZAO` share drops below 40% and `build`/`zoe`/`zabalgamez` variants are gone | @Zaal | SQL | 2026-08-05 |
| Escalator writes `source='escalated'` (not `human-web`); verify with a `GROUP BY source` returning a non-zero `escalated` bucket | @Zaal | PR | 2026-08-06 |
| Wire `findSimilar` from `src/lib/task-quality.ts` into the escalation insert path, skip at Jaccard >= 0.5; PR merged with a unit test asserting the "Process PR #244" pair collapses | @Zaal | PR | 2026-08-06 |
| Escalator writes source-link + one-sentence done-condition into `notes`; verify 0 new escalated rows with empty notes | @Zaal | PR | 2026-08-07 |
| Archive the 449 DONE-but-unarchived rows + the 93 undefined escalated rows; board count published in the daily | @Zaal | SQL | 2026-08-07 |
| Ship the Goal layer on `projects` (not `goals`): 1-3 per brand, board renders Brand > Goal > Task with existing collapse state; PR merged and `/board` shows <= 24 top-level rows | @Zaal | PR | 2026-08-14 |
| Ship the triage consumer loop (4 isolated phases, max 1 spawn, bot writes non-re-triggering); PR merged and open board count falls for 3 consecutive days | @Zaal | PR | 2026-08-21 |
| Deprecate the `goals` table (0 rows, 0 readers) in a migration so the next session does not build on it | @Zaal | SQL | wontfix if Goal layer lands on `goals` instead |

## Sources

- [Cloudflare - How we built a software factory to drive Astro's GitHub issue count to zero](https://blog.cloudflare.com/astro-issue-triage/) (2026-08-04) - [FULL]
- [Michael Sliwinski - Sub-projects suck: why 19 years of a flat structure made my app better](https://michael.team/flat/) (2026-07-27) - [FULL] - carries the full citation list for Miller 1981, Kiger 1984, Wallace/Anderson/Shneiderman 1987, Jacko & Salvendy 1996, Bergman 2010, Cowan 2001, Kruger & Evans 2004, Haynes 2009
- [Atlassian Community - Stop Using Subtasks as a To-Do List](https://community.atlassian.com/forums/App-Central-articles/Stop-Using-Subtasks-as-a-To-Do-List-And-What-to-Do-Instead/ba-p/3194274) (2026-02-19) - [FULL] - community source
- [Asana Forum - To Subtask or not to Subtask](https://forum.asana.com/t/to-subtask-or-not-to-subtask/861) - [FULL] - community source
- [Jira JRACLOUD-4446 - Sub-issues should be able to contain their own sub-issues](https://jira.atlassian.com/browse/JRACLOUD-4446) - [FULL] - declined by Atlassian
- [GitHub Engineering - Introducing sub-issues](https://github.blog/engineering/architecture-optimization/introducing-sub-issues-enhancing-issue-management-on-github/) (2025-04-11) - [FULL]
- [AgentPatterns.ai - Issue-Tracker as Agent Dispatch Surface](https://agentpatterns.ai/workflows/issue-tracker-agent-dispatch-surface/) - [FULL] - source for Bui et al. arxiv 2512.21426 (72% AUC) and the 4M->17M PR figures
- [GitHub Agentic Workflows - Rate Limiting Controls](https://github.github.com/gh-aw/reference/rate-limiting-controls/) - [FULL]
- [byteiota - GitHub PR Limits: Open Source Fights Back Against AI Contribution Spam](https://byteiota.com/github-pr-limits-ai-spam-open-source/) (2026-06-20) - [FULL]
- [DEV - AI Agent Backpressure: How We Fixed Our Code Review Bottleneck](https://dev.to/beyondit/ai-agent-backpressure-how-we-fixed-our-code-review-bottleneck-a1c) (2026-06-01) - [FULL] - source of the "abandoned on a 3-person team" negative signal
- [Antigravity Lab - Flow Control for Autonomous Agents](https://antigravitylab.net/en/articles/agents/antigravity-agent-flow-control-backpressure-queue-design) (2026-05-31) - [FULL] - bounded queue / semaphore / token bucket / dead-letter, evaluated and declined at this team size
- [notes/druchan - How many layers to track an objective?](https://notes.druchan.com/how-many-layers-to-an-objective) - [FULL]
- ZAOcowork live database, measured 2026-08-04 - [FULL] - all counts in "The measured state"
- ZAOcowork codebase: `src/lib/types.ts:230-237`, `src/lib/data.ts:467-480`, `src/app/actions.ts:1368-1469`, `src/components/TaskRoom.tsx:691-766`, `src/components/Board.tsx:415-462`, `src/lib/projects.ts`, `src/lib/task-quality.ts`, `supabase/migrations/027_canonical_brand_taxonomy.sql` - [FULL]

### Staleness + verification notes

- All board counts are from a live read on 2026-08-04 and will drift - the escalator is still running. Re-measure before acting on any specific number.
- The Cloudflare/Astro result is **1 day old** at time of writing. Their "expect zero within a month" is a projection, not a result. The 200 -> 30 figure is the measured part.
- The academic citations (Miller through Haynes) are cited via Sliwinski's reference list, which gives DOIs and publisher links for each. The primary papers were not independently fetched; the secondary source is explicit and checkable, and no claim here rests on a single one of them.
- `updated_at` on the tasks table is contaminated by prior bulk migrations and `metadata.activity` is empty on ~95% of rows. Only `created_at`, `completed_at`, `source`, `status`, and `archived_at` were used for measurement here.
