---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "825, 816, 764, 2079, 2391, 2392"
original-query: "we should /zao-research all our coworking things so we can organize it with our zaostock todos and make that the highest priority"
tier: STANDARD
---

# 2397 - The coworking stack, measured, and the ZAOstock slice inside it

> **Goal:** Zaal asked to research the coworking things and organize them against
> the ZAOstock todos with ZAOstock as top priority. Twenty-plus cowork docs already
> exist, so this does not re-audit the architecture. It measures what is true today,
> names the two live infrastructure faults, and answers the actual question: what
> does ZAOstock need from the board, and what is in the way.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The board is not disorganized. It is centralized.** Zaal owns **294 of 439 open items - 67%** - with 126 overdue and 52 at P1. The next largest owner is unassigned (102), then Iman (26). | Measured live. No amount of reorganising a board changes a queue where two thirds of it is one person. The fix is assignment, not structure. |
| 2 | **The Pro upgrade did not reach ZAOstock.** The cowork REST path is back (verified). `zaostock.com/api/events/zaostock-2026/lineup` still fails. They are different Supabase projects, and the ZAOstock one is `yjrlaxpjusmrfylumban`. | Paying fixed the board and not the festival. The lineup API is the one the mobile app reads. |
| 3 | **`bettercallzaal/ZAOcowork` is ARCHIVED and has a stranded open PR.** The live repo is `ZAODEVZ/ZAOcowork`. | Identical shape to the zaostock repo split that already cost a session. PR #1 sits open on a dead repo where nobody will ever merge it. |
| 4 | **Do not write another cowork architecture doc.** Docs 825, 816, 764 and 2079 cover it; 825 is the architecture spine and is 2.5 months stale rather than wrong. | Twenty-plus docs exist. The gap was never documentation. |
| 5 | **ZAOstock's real blocker is not on the board at all** - it is that the artist roster does not exist. Three acts confirmed at 40 days out. | Every board item downstream of the lineup (poster, contracts, set times, the Sep 1 reveal) is waiting on a list nobody has written down. |

## Finding 1: the board's shape, measured

Live query against the cowork Postgres, 2026-08-23.

| Status | Count | Overdue |
|---|---|---|
| todo | 372 | 138 |
| in_progress | 60 | 25 |
| blocked | 7 | 3 |
| **open total** | **439** | **166** |
| done | 639 | - |

By owner:

| Owner | Open | Overdue | P1 |
|---|---|---|---|
| **Zaal** | **294** | **126** | **52** |
| (unassigned) | 102 | 16 | 15 |
| Iman | 26 | 14 | 0 |
| Jose | 5 | 4 | 0 |
| Samantha | 3 | 0 | 0 |
| ThyRev | 3 | 1 | 1 |
| Ohnahji, Dcoop, Aziz | 2 each | 2, 1, 2 | 0 |

**67% of open work sits on one person, and 52 of his items are P1.** A P1 count of
52 is not a priority signal, it is the absence of one - if a third of your open queue
is top priority, nothing is.

The second-largest bucket is **102 unassigned items**, 15 of them P1. Those are not
waiting on anybody, which means they are not moving.

This is the answer to "organize our coworking things". The board's structure is fine.
Its distribution is the problem, and reorganising columns will not touch it.

## Finding 2: the Pro upgrade covered one project, not both

Zaal upgraded the `thezao` Supabase org to Pro on 2026-08-23 to fix the coworking
egress block. Verified after the upgrade:

| Path | Result | Meaning |
|---|---|---|
| `zao-tracker search` (cowork REST) | **exit 0, 3 rows** | cowork REST write/read path is BACK |
| MCP `execute_sql` (cowork) | works | never stopped - read path was always up |
| `zaostock.com/api/events/zaostock-2026/lineup` | **503, `reason: upstream-error`** | ZAOstock's Supabase still failing |

The 503 rather than a 500 is worth noting: that is the degradation shipped in
`ZAODEVZ/ZAOstock` PR #41, which has merged and deployed. The endpoint now fails
honestly and tells callers to retry, instead of returning a bare 500. The fallback
seed is still empty, so it cannot serve a lineup - and it will not until someone
writes the roster into it.

**The ZAOstock project ref is `yjrlaxpjusmrfylumban`**, named on board card
`d555582f` ("Widen the Supabase grant: ZAOstock project"). It is a different project
from the cowork one, and on the evidence above a different billing scope.

**What is not established:** whether ZAOstock sits in a different org (needing its own
Pro subscription, from $25/mo, or $10/mo as an additional project in the same org) or
in the same org with the upgrade not yet applied. That is one look at the Supabase
billing page and it is Zaal's account, not readable from here.

### The leak is slowed, not fixed

`~/bin/lane-relay-daemon:21` reads `POLL="${LANE_RELAY_POLL:-60}"`, so the 6-second
poll really is now 60 seconds. But at 280 KB per poll that is still **403 MB per day
per lane, ~12 GB per lane per month**. Across a 12-20 lane fleet that is **145-242 GB
a month against Pro's 250 GB quota**, spent entirely on asking whether anything
changed.

Pro buys headroom, not a fix. The real repair is to stop refetching a large payload on
a timer: fetch `max(updated_at)` first and pull the row only when it moves, narrow the
`select=` columns, or use Realtime and stop polling. Any of those is one to two orders
of magnitude cheaper.

## Finding 3: two ZAOcowork repos, one of them dead

| Repo | Last push | Archived | Open PRs |
|---|---|---|---|
| `bettercallzaal/ZAOcowork` | 2026-07-16 | **YES** | **#1 "graft: DreamLoops framework onto zaocowork"** |
| `ZAODEVZ/ZAOcowork` | 2026-08-22 | no | #283 (the HUD harnesses work) |

This is the same trap as the zaostock repo split, which already cost one session a
wrong measurement taken from a stale clone. PR #1 is stranded: it sits open against
an archived repo, so it can never merge and nobody is looking at it. Either port it
to `ZAODEVZ/ZAOcowork` or close it with a reason - leaving it open is the worst of
the three options because it reads as in-flight work.

## Finding 4: the research already exists

| Doc | What it covers | last-validated |
|---|---|---|
| [825](../../agents/825-zaocowork-architecture-audit/) | whole-system architecture, how it connects | 2026-06-08 |
| [816](../../agents/816-cowork-control-plane-and-project-audit/) | control plane, project/todo/GitHub audit | 2026-06-08 |
| [764](../../dev-workflows/764-zaocowork-next-improvements/) | post-Phase-F improvements | 2026-05-27 |
| [2079](../../community/2079-iman-cowork-audit-build-backlog/) | Iman's build backlog | 2026-07-25 |

Plus roughly sixteen more across `agents/`, `business/`, `dev-workflows/` and
`security/`. **Doc 825 is the architecture spine and it is 2.5 months stale rather
than wrong** - the right move when the architecture question comes up again is to
re-validate 825 in place, not to write a twenty-first doc.

## The ZAOstock slice, as priority ordering

Thirty-plus open board items match ZAOstock. Ordered by what cannot be recovered
later rather than by due date.

**Tier 1 - the window closes, or everything downstream waits**

| Card | Item | Due | State |
|---|---|---|---|
| - | **The artist roster does not exist.** Three confirmed (Fellenz, Dcoop, Lyons Den) at 40 days | - | **not on the board at all** |
| `89e9da61` | Event insurance quotes - a permit condition, and unassigned | 2026-08-21 | overdue, **no owner** |
| `7d0cf2b0` | Sound system booking status | 2026-08-01 | 22 days overdue, P1 |
| `6386c0c7` | Fiscal sponsor replacement | 2026-08-26 | **no owner**, P1 |
| - | Art of Ellsworth permit exemption - 45-day window closed 19 Aug | - | not carded |

**Tier 2 - blocks the announcement**

`8556d703` pitch deck v1 (in_progress, P1) gates `b80026fc` sponsor tiers, which gates
all outreach. `801d6743` brand kit. `53e3ff3a` poster - which cannot start until set
times exist, which cannot exist until the roster does.

**Tier 3 - promotion surfaces, all overdue and all cheap**

`27dfa999` photos, `fbcf1d46` Star 97.7 + Black Moon logos, `80cdef1b` Black Moon
logo, `cc314651` Facebook event, `161567c3` Facebook page, `236edf76` radio with Paul.

**Note two cards that should not survive contact:** `6dca143d` ("Add Werb + Lyons Den
to all ZAOstock comms") and `8aaedfbd` (its PR #38 test plan) are both superseded -
Zaal's call on 2026-08-23 is to keep both artists off public surfaces until the lineup
reveal. And `3a60bcae` must not execute: Zaal confirmed Werb and Yerb are two
different people.

## The honest answer to "make it the highest priority"

ZAOstock already is the top priority by every ordering that exists - it has the most
open cards, the nearest immovable date, and the most P1s. Marking it higher changes
nothing, because **the constraint is not prioritisation, it is that 294 open items sit
on the one person who also has to run the festival.**

The two moves that would actually change throughput:

1. **Assign the 102 unassigned items or close them.** Fifteen are P1. An unassigned
   P1 is a contradiction.
2. **Move the ZAOstock Tier-1 items off Zaal where the work is not personally his.**
   Insurance quotes and the fiscal-sponsor comparison are both research-and-call
   tasks, both currently unassigned, both blocking.

## Also See

- [Doc 2391](../../events/2391-zaostock-run-of-show-oct3-v2/) - the run of show and its open decisions
- [Doc 2392](../../events/2392-zaostock-economic-lift-baseline/) - the measurement whose window closes on 3 October
- [Doc 825](../../agents/825-zaocowork-architecture-audit/) - the architecture spine, re-validate rather than replace

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Write the confirmed artist roster into `src/lib/lineup-fallback.ts` - shipped when the file has names and the lineup API serves them | @Zaal | PR | 2026-08-25 |
| Check whether the ZAOstock Supabase project `yjrlaxpjusmrfylumban` is in the upgraded org; upgrade or move it - shipped when the lineup API returns 200 | @Zaal | Ops | 2026-08-25 |
| Assign or close the 102 unassigned board items, starting with the 15 P1s - shipped when unassigned P1 count is 0 | @Zaal | Board | 2026-08-29 |
| Give `89e9da61` (insurance) and `6386c0c7` (fiscal sponsor) real owners - shipped when both have an owner_id | @Zaal | Board | 2026-08-25 |
| Port or close `bettercallzaal/ZAOcowork` PR #1 - shipped when the archived repo has 0 open PRs | @Zaal | PR | 2026-08-31 |
| Replace the 60s poll with a change-check on `max(updated_at)` - shipped when measured egress per lane drops below 1 GB/month | @Zaal | PR | 2026-09-15 |
| Re-validate doc 825 against the current architecture - shipped when its `last-validated` is refreshed | @Zaal | Doc | 2026-09-30 |

## Sources

- Cowork Postgres, live queries via the Supabase MCP on 2026-08-23: task counts by
  status, by owner, and the ZAOstock title/notes match - [FULL, direct SQL]
- `https://zaostock.com/api/events/zaostock-2026/lineup` - raw curl, HTTP 503,
  `reason: upstream-error` - [FULL, raw fetch not a summarizer]
- `~/bin/zao-tracker search` exit 0 with rows, confirming the cowork REST path
  recovered post-upgrade - [FULL, ran it]
- `~/bin/lane-relay-daemon` line 21, `POLL="${LANE_RELAY_POLL:-60}"` - [FULL, read]
- `gh api repos/bettercallzaal/ZAOcowork` and `repos/ZAODEVZ/ZAOcowork` - archived
  flag, push dates, open PR lists - [FULL, GitHub REST]
- [supabase.com/pricing](https://supabase.com/pricing) and
  [manage-your-usage/egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress) -
  Free 5 GB, Pro 250 GB then $0.09/GB, Pro from $25/mo - [FULL, raw curl + HTML strip]
- Board card `d555582f` naming the ZAOstock project ref - [FULL, direct SQL]
- Roster state from Zaal directly, 2026-08-23: *"we dont have a full list right now,
  we have fellenz, dcoop, lyons den all confirmed"* - [FULL, his words]
- Community sources: **none fetched.** This is an audit of our own infrastructure,
  where the checkable ground truth is the database and the repos, not the web. Marked
  explicitly rather than padded with an irrelevant Reddit thread.
