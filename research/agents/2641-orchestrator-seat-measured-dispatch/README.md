---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "agents/2640-orchestrator-loop-improvements, agents/2636-agentic-organization-day-measured, agents/2630-three-active-projects-wip-outside-view, agents/2586-orchestrator-seat-outside-view"
original-query: "lets research how to be come better as a orcestrator and a loop and make that better"
tier: DEEP
---

# 2641 - The seat as a dispatcher, measured: what incident command and air traffic flow control teach one person plus one AI seat plus ten lanes

## Summary for Zaal

1. On 8 October by mid-morning, the estate had opened 56 PRs and merged 44, with none closed unmerged.
2. Review is the part that works. In a sample of 12 of those PRs, 9 had at least one "needs a fix" verdict before they were clean.
3. Once a PR was clean, it usually merged within about 10 to 15 minutes. Waiting for the merge is no longer the slow part.
4. The slow part is the seat's own capacity: it is your one point of contact and it also tracks about ten lanes.
5. Incident command, used by fire services since 1968, says one person should directly manage three to seven others, five being ideal. Above seven, you add a layer.
6. It also says each worker reports to one boss only. Two of this week's mix-ups were lanes taking direction from two places.
7. SRE incident practice gives the commander a scribe, so the person in charge is not also the one writing things down.
8. Air traffic flow control holds planes on the ground when the airport is full, rather than letting them circle. The estate's version would be: do not start a lane's turn when the machine or the usage meter is full.
9. The five changes: two leads under the seat, one boss per lane, a scribe script for the queue page, a ground hold on new turns at high load, and a short status format every lane uses.
10. Most of them are files and small scripts. Each says how it would be measured.

> **Goal:** Measure how the orchestrator seat performs as a dispatcher on 2026-10-08, compare it with how human dispatch roles run many parallel workers, and propose the five changes most likely to make the seat better. [Doc 2640](../2640-orchestrator-loop-improvements/) covered the loop's failure shapes; this doc does not repeat them. It looks at the seat's own job and capacity.

## Part 1. The seat, measured on 2026-10-08

### What was measured, and from where

- GitHub search, explicit query strings, UTC day 2026-10-08, read at about 07:45 EDT (11:45 UTC). The day was not over; every count is "so far".
- PR comments on 12 PRs, read with `gh api`, verdicts classified by their first line (CLEAN versus NEEDS).
- zao-vault origin/main at 07:41 EDT: `decisions/grill-2026-10-07-seat-morning.md` items 51 to 57, `decisions/grill-2026-10-08-grill-morning.md`, `decisions/bus-2026-10-08-extend-our-own.md`, and the git log.
- Not used: `handoffs/status/orchestration.md` and the body of `MISTAKES.md`, which this lane's permission layer refused to read earlier today (doc 2640 records the refusal).

### Throughput

| Measure | Value |
|---|---|
| PRs opened (bettercallzaal) | **56** |
| PRs merged | **44**: ZAOOS 22, north-creek 7, zao-vault 5, zaal-dotfiles 4, poidhz 2, bcz-yapz 2, zao-desks 1, bettercallzaalwebsite 1 |
| PRs closed without merging | **0** |
| PRs open at the time of reading | 32 |
| Vault commits on 10-08 (all lanes) | 34; by hour (as git reports it): 8 at 05, 11 at 06, 14 at 07, 1 at 10 |
| Queue-page commits on 10-08 | 4 |

### Review round-trips and verdict-to-merge latency

For each PR: the sequence of verdict comments in time order (N = a NEEDS verdict, C = CLEAN), and the minutes from the last CLEAN before the merge to the merge.

| PR | Verdicts | Last CLEAN to merge |
|---|---|---|
| ZAOOS #3795 | N N C | 11 min |
| ZAOOS #3807 | N N | still open |
| ZAOOS #3809 | N C | 15 min |
| zaal-dotfiles #452 | N C | 3 min |
| zaal-dotfiles #453 | N C | 4 min |
| ZAOOS #3793 | N (a later CLEAN not caught by the first-line rule) | merged |
| ZAOOS #3796 | N C | 10 min |
| ZAOOS #3803 | N | still open |
| ZAOOS #3806 | C | merged; the CLEAN's time could not be matched before the merge |
| ZAOOS #3784 | C C C | 11 min |
| ZAOOS #3782 | N N C C C | 12 min |
| ZAOOS #3810 | C | 12 min |

**Derived:**
- **Share of sampled PRs with at least one NEEDS verdict: 9 of 12.** The four named in the brief (#3795, #3807, #3809, zaal-dotfiles #452 and #453) all had one. This is a sample of PRs named in today's record, not every PR, so it overstates the rate for the estate as a whole: PRs with no trouble are less likely to be named.
- **Last CLEAN to merge: median 11 minutes** over the 8 PRs where both times were found (3, 4, 10, 11, 11, 12, 12, 15).
- **Round-trips:** most needing work were fixed in one round (N C); #3795 and #3807 took two NEEDS rounds; #3782 took two NEEDS rounds and three CLEANs (re-checks at new heads after fixes and merges of main).
- Limit: the classifier reads only each comment's first line, so a verdict phrased differently is missed (#3793's is the known case).

### Load on Zaal, and what reached him

| Measure | Value | Source |
|---|---|---|
| Items recorded from him on 10-08, 05:14 to 06:58 EDT | 7 seat items (51 to 57) plus 2 grill items plus 1 decision file | vault decisions |
| Of those, questions he was asked | about 5 (item 51 A/B; item 52 the re-ask cadence; item 54 the A/B; grill lanes-1; grill dotfiles-2) | same |
| Of those, typed in a lane's pane rather than the seat's | 2 (items 56 and 57, relayed) | same |
| Questions per hour in that window | about 3 | 5 over about 1.7 hours |
| Auto-proceeded items on 10-08 | UNKNOWN. No vault commit message on 10-08 says "auto-proceed", and the seat's log of them is in `orchestration.md`, which this lane could not read | git log |

Two answers he typed did not choose an offered option (grill dotfiles-2: "can you review each one by one with me in dotfiles ill move there"), which matches the 52 percent typed rate doc 2586 measured on 6 and 7 October.

### Where work waited

- **On Zaal:** the grill held his "16 open PRs in other people's repos" until he reviews them one at a time (grill dotfiles-2); North Creek's design work waits for Ryan (item 53); the bus plan's deploy, token minting and ZOE wiring are his own steps (bus decision).
- **On Vercel:** the standing rule from item 41 (no lane touches Vercel) makes every Vercel step a to-do for him. Doc 2636 counted the North Creek domain among them.
- **On the seat:** ZOE's "Work on it now" button (item 51) does nothing until the seat reads newly worked cards each tick, so the button's value depends on the seat's attention.

### The seat's span

At 20:53 on 2026-10-07 the queue page listed 20 terminals: 7 side, 3 active, 2 NEXT, 3 LATER, 5 opened by Zaal (doc 2636). On 10-08 at 06:29 `zao-lanes` showed 6 lanes working besides the grill against his rule of three active (grill lanes-1). The seat is directly coordinating roughly ten lanes plus Zaal.

## Part 2. How human dispatch roles run many workers (fetched raw)

### Incident Command System

From Wikipedia's ICS article (MediaWiki API, plain text; a secondary source summarising FEMA's NIMS doctrine):
- "the ICS requires that any single person's span of control should be between three and seven individuals, with five being ideal ... If more than seven resources are being managed by an individual, then that individual is being overloaded and the command structure needs to be expanded by delegating responsibilities (e.g. by defining new sections, divisions, or task forces)."
- "Unity of command: Each individual participating in the operation reports to only one supervisor. This eliminates the potential for individuals to receive conflicting orders from a variety of supervisors, thus increasing accountability, preventing freelancing".
- The structure scales: "as an incident scales down, roles will be merged back up the tree until there is just the IC role remaining."

From Wikipedia's "Span of control" article: "Theories about the optimum span of control go back to V. A. Graicunas ... In spite of numerous attempts since then, no convincing theories have been presented. This is because the optimum span of control depends on numerous variables". So three to seven is doctrine, not a law of nature. Same status as the "three active" cap in doc 2630.

### SRE incident management

Google's SRE book, "Managing Incidents" (fetched raw):
- "The incident commander holds the high-level state about the incident ... De facto, the commander holds all positions that they have not delegated."
- "The operations team should be the only group modifying the system during an incident."
- The failure story the chapter opens with: the engineer in charge "wasn't in a position to think about the bigger picture ... because the technical task at hand was overwhelming", and "Freelancing: Malcolm was making changes to the system with the best of intentions. However, he didn't coordinate".

PagerDuty's incident response guide (fetched raw): "An Incident Commander acts as the single source of truth of what is currently happening and what is going to happen during a major incident." Roles include a Deputy and a Scribe; "Certain roles only have one person per incident (e.g. IC)". Status reports use a fixed shape, "CAN reports: Condition: What is the current state of the service?" (then Actions and Needs).

### Air traffic flow management

Wikipedia, "Air traffic flow management" and "Ground delay program" (API extracts, secondary):
- "ATFM balances air traffic demand against the system's limitations".
- A ground delay program starts when the airport arrival rate is reduced: traffic managers "implement the least restrictive action necessary to ensure that traffic demand does not exceed system capacity", holding flights on the ground with an assigned departure time; when "demand decreases, the ATCSCC begins running compressions" to pull delays back in.

The principle: hold work before it starts, on the ground, cheaply; do not let it circle in the air, where waiting is expensive.

### Anthropic's orchestrator write-ups (fetched 2026-10-07 for doc 2636)

"the lead agent can't steer subagents, subagents can't coordinate, and the entire system can be blocked while waiting for a single subagent"; "multi-agent systems use about 15× more tokens than chats"; prompts that "scale effort to query complexity".

## Part 3. What transfers to one person, one AI seat and about ten lanes

| Human practice | ZAO today | Gap |
|---|---|---|
| Span of control 3 to 7, five ideal | The seat coordinates about ten lanes and Zaal | Over the doctrine's ceiling |
| Expand with sections when over seven | No layer under the seat | Missing |
| Unity of command: one supervisor each | Lanes take direction from the seat AND from Zaal typing in their pane (items 56, 57 today; 41, 43 yesterday) | Two sources, which doc 2640 tied to the broad read of item 54 and the wrong park |
| Commander holds state; a scribe writes it | The seat both decides and hand-writes the queue page (76 commits since 10-06; one format drift broke ZOE's /terminals, doc 2640) | No scribe |
| Ground hold when the airport is full | Turns start whenever routed; load ran 68 to 116 (doc 2640) and the usage limit hit at 14:45 on 10-07 | No hold |
| CAN reports: Condition, Actions, Needs | Each lane reports in its own prose | No fixed shape |

## Five changes for the seat

| # | Change | Script or inference | Cost | Extends | Metric that shows it worked |
|---|---|---|---|---|---|
| 1 | **Two leads under the seat.** The merge terminal leads everything about PRs (review routing, merge order, CI); the seat leads projects and Zaal. The seat stops routing individual reviews; it hands the PR list to the merge lead | Inference, once (a line in two briefs) | No new terminal: the merge terminal already exists | ICS span of control; doc 2586 (seat routes, does not build); item 50 ("running down all open prs") | Messages the seat sends per hour fall; the seat's direct reports drop toward five |
| 2 | **One boss per lane.** When Zaal types in a lane's pane, the lane relays his words to the seat before acting on anything beyond a direct answer, and the seat records it as a ruling with scope | Inference (one line in each brief) | One relay message per pane input | ICS unity of command; doc 2640 rank 2 (scope on every ruling) | No lane acts on a pane instruction the seat never recorded; zero "read broader than given" corrections |
| 3 | **A scribe for the queue page.** A script writes the Terminals table from `zao-lanes` and `claude agents --json`; the seat writes only the queue rows it decides. The script also enforces the format the ZOE parser needs | Script | One script, reusing tools that exist; then free | SRE scribe role; `code-over-inference.md`; doc 2640 rank 1; `698a756a` format contract | Zero format drifts; the seat's own commits to the page fall from 22 in an hour (10-07 12:00) to a handful a day |
| 4 | **A ground hold on new turns.** Before the seat starts or unparks a lane, it reads `uptime` and the usage meter; above a set level it queues the start with an expected time instead of starting it | Script (one check) | One command per routing step | Ground delay program; doc 2640 rank 7; `agent-spend.md` | Load stays under the chosen level; the usage limit is not hit before 17:00 |
| 5 | **A three-line status shape for every lane: Condition, Actions, Needs.** Lane reports to the seat use it, and the seat's morning list to Zaal is built from the Needs lines only | Inference (a line in each brief); optionally a check | Lanes write shorter reports | PagerDuty CAN reports; doc 2636 change 5 (three asks a morning) | The seat's morning list to Zaal is built without re-reading lanes; questions per hour to him hold at about 3 or fall |

Not proposed: more lanes, a second seat, or a new tool. The record says throughput and review already work (56 opened, 44 merged, a median of 11 minutes from CLEAN to merge). The constraint is how much one seat can hold and how many directions reach a lane.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Changes 1, 2 and 5: lines in the seat's and each lane's brief | orchestrator seat | Brief edits | 2026-10-08 |
| Change 3: the Terminals-table script, as a PR | a lane the seat names | Script PR | 2026-10-09 |
| Change 4: choose the load and meter levels, then add the check | orchestrator seat | Decision, then script | 2026-10-09 |
| Re-measure: seat messages per hour, verdict-to-merge, questions per hour, drifts | a research lane | Doc re-validation | 2026-10-15 |

## Sources

1. Wikipedia, [Incident Command System](https://en.wikipedia.org/wiki/Incident_Command_System) [FULL extract via the MediaWiki API, plain text; secondary to FEMA's NIMS doctrine, fetched 2026-10-08]
2. Wikipedia, [Span of control](https://en.wikipedia.org/wiki/Span_of_control) [FULL extract via the MediaWiki API]
3. Google, Site Reliability Engineering, [Managing Incidents](https://sre.google/sre-book/managing-incidents/) [FULL, curl, HTML stripped]
4. PagerDuty Incident Response, [Different Roles](https://response.pagerduty.com/before/different_roles/) [PARTIAL: the IC definition, the role list and the CAN report line; curl, HTML stripped]
5. Wikipedia, [Air traffic flow management](https://en.wikipedia.org/wiki/Air_traffic_flow_management) [FULL extract via the API; short article]
6. Wikipedia, [Ground delay program](https://en.wikipedia.org/wiki/Ground_delay_program) [FULL extract via the API]
7. Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) [FULL; fetched 2026-10-07 for doc 2636]
8. GitHub search API, 2026-10-08 at about 11:45 UTC: created, merged, closed unmerged, open [FULL]; PR comments on the 12 PRs in the table via `gh api` [FULL for first lines; classification is first-line only]
9. zao-vault origin/main at 2026-10-08 07:41 EDT: seat items 51 to 57, `decisions/grill-2026-10-08-grill-morning.md`, `decisions/bus-2026-10-08-extend-our-own.md`, git log [FULL for what is cited]
10. `handoffs/status/orchestration.md` [FAILED: read refused by this lane's permission layer on 2026-10-08, not retried; auto-proceeded counts are UNKNOWN for that reason]

Not covered: FEMA's own NIMS text (the Wikipedia extract is the secondary source used), Eurocontrol or FAA primary documents on flow management, and any study measuring span of control for AI agents.
