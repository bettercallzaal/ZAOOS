---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-27
related-docs: 2079
original-query: "Organize board tasks by brand + make the main page cleaner to see/analyze; do an overall upgrade to the ZAOcoworking UI/UX; and research best ways to coordinate async."
tier: STANDARD
---

# 2090 - Async coordination + the ZAOcowork board UI/UX upgrade

> **Goal:** How a 3-person, multi-timezone, fully-async ZAO team should coordinate, and the concrete UI/UX upgrade that makes the 300+ task board legible - grounded in the real board numbers and how the best tools do it.

## Key Decisions (do these first)

| Decision | Call | Why |
|----------|------|-----|
| Fix the brand taxonomy BEFORE any UI work | **YES - phase 0** | "The ZAO" (97) + "zaodevz" (80) + "ZAO" (47) + "ZAO Devz" (2) are FOUR labels for the same thing - ~226 tasks, 73% of the board. This is why grouping/analysis by brand fails today. It's a data problem, not a UI one. |
| Group the main view by brand + add a per-brand overview strip | **YES** | A flat 309-row list is unreadable. Grouping + counts makes "which brand is drowning" a 3-second answer. |
| Make the board the single source of truth; Telegram = notify/urgent only | **YES** | Async loops ("did we decide this?") die when status/blockers/feedback live on the task, not in a 3-day-old chat thread. |
| Add per-person "My Work" + a WIP badge (3 active max) | **YES** | 309 tasks / 3 people with everyone juggling 10 = nothing ships. Low WIP is the lever; the 41%-overdue pile is a WIP-blocker signal. |

## The real board state (measured 2026-07-27)

- **309 open tasks.** 271 todo / 34 in-progress / 4 blocked.
- **127 overdue (41%)** - so "overdue" has stopped meaning anything; needs a distinct at-risk signal.
- **40 unowned** - invisible in everyone's my-work.
- **Brand field broken:** ZAO is labeled 4 ways (~226 tasks). Real distinct brands after collapsing: ZAO/ZAO-Devz ~226, ZABAL Games 19, WaveWarZ 18, ZAOstock 14, ZOE 12, BetterCallZaal 6, Juke/POIDH 3, COC/Bonfire 2, Baraza 1.

## Part 1 - Async coordination practices for a tiny distributed team

The team is Zaal (US), Iman (Africa, real power-cut constraints), Jose (Latin America) - so sync time is expensive. The 7 highest-leverage practices:

1. **Written-first, single source of truth.** Every decision/status/handoff goes on the board first; Telegram notifies. (GitLab all-remote handbook.)
2. **Async standups.** Each person posts a 3-4 min written "shipped / focus / blocked" in a daily window - no meeting. The 9:30am EST sync becomes blockers-only. (Range, Catapult.)
3. **Low WIP (3 active per person).** Overdue items block new intake. (Atlassian kanban WIP.)
4. **Structured handoffs.** When Iman's power cuts or a timezone gap hits, her "what I did / in progress / blockers / next" lives as a written artifact on the task - Zaal picks up without re-asking. (Forwardcurrents, Monday.)
5. **Comms pyramid: board default, Telegram urgent-only.** Cuts always-on-chat load; keeps decisions searchable. (Doist, Twist.)
6. **Monthly 30-min cleanup.** Merge duplicates, clarify one-word tasks, triage 7+ day overdue. 306 -> ~200 real items over 3 months. (ClickUp/Jira dedup.)
7. **Predictable sync + escalation.** Keep 9:30am EST but only for unblocks/decisions, fed by the async standup.

## Part 2 - Board UX upgrades (ranked, grounded in tool precedent)

| # | Change | Value | Effort | Grounded in |
|---|--------|-------|--------|-------------|
| 1 | Brand grouping as the default main view (collapsible sections + counts) | High | Low | Notion group-by, Linear group-by-project, GitHub swimlanes |
| 2 | Per-person "My Work" filter + WIP badge (green<3 / yellow 3-5 / red>5) | High | Low | Notion My Tasks, Linear saved views, kanban WIP |
| 3 | Analytical overview strip (per-brand total + overdue/at-risk, clickable) | High | Med | Linear custom views, Supabase GROUP BY rollup |
| 4 | "Today's Focus" view (Priority A/B/C enum + saved filter) | Med | Low | Linear priority filters |
| 5 | Blocked parking lot + create-time dup/vague nudges | Med | Low | GitHub/Notion blocked lane, ClickUp/Jira dedup |

**Perf note:** every view is a scoped SQL query with COUNT/aggregates - never the full-table `getActions()` read that caused the #262 hang.

## Also See

- [Doc 2079](../../community/2079-iman-cowork-audit-build-backlog/) - the Iman cowork audit (board bugs B1-B4)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Cowork terminal ships Phase 0 (brand taxonomy migration) + Phase 1 (brand grouping) as one PR | zaal | PR | 2026-08-03 |
| Cowork terminal ships Phase 2-3 (overview strip + My Work/WIP) | zaal | PR | 2026-08-10 |
| Adopt the async-standup + board-as-SSoT workflow with Iman + Jose | zaal | Process | 2026-08-05 |

## Sources

- [GitLab all-remote handbook](https://handbook.gitlab.com/handbook/company/culture/all-remote/) - [FULL]
- [Range - async daily standups](https://www.range.co/blog/asynchronous-daily-standups) - [FULL]
- [Doist - how we work remote (comms pyramid)](https://doist.com/how-we-work/how-doist-works-remote) - [FULL]
- [Atlassian - kanban WIP limits](https://www.atlassian.com/agile/kanban/wip-limits) - [FULL]
- [Linear - custom views](https://linear.app/docs/custom-views) - [FULL]
- [Notion - board view](https://www.notion.com/help/guides/board-view-databases) - [FULL]
- [GitHub Projects - swimlanes](https://github.blog/changelog/2023-07-27-github-issues-projects-july-27th-update/) - [FULL]
- [Forwardcurrents - async handoff template](https://forwardcurrents.com/async-project-handoff-template/) - [FULL]
