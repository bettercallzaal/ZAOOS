---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "agents/2586-orchestrator-seat-outside-view, dev-workflows/763-kanban-async-team-best-practices, agents/2474-agentic-lane-throughput-and-research-retrieval, agents/2444-always-on-orchestrator"
original-query: "lets research more about this idfea and see what oithers are doing for this orgnaizaiton and prioritization style"
tier: STANDARD
---

# 2630 - Three active projects, side terminals, a parked queue: how others do it, and five tunings

## Summary for Zaal (ten lines)

1. Your model matches what others do: a small number of things in progress, helpers that do not count, everything else parked.
2. Nobody has evidence that THREE is the right number. Three, five and six are all habit, not measurement. What is measured is that switching between tasks costs time.
3. So keep three, and treat it as a dial: if a day goes badly, try two.
4. The side terminals (merge, review, questions) are queues too. Today they backed up while the three "active" slots looked fine.
5. A slot only helps if it frees. Each active project needs a finish line written down before it starts.
6. Keep the waiting line short: NEXT 1 and NEXT 2 in order, everything else in one unordered "later" pile.
7. A parked note is good if a fresh session can restart from it without asking you anything.
8. Pick what is active by what has a date on it and what costs most to delay, not by what is loudest.
9. Today's numbers say the real limit is your account's usage meter and your own attention, not the number of panes.
10. Five small, reversible changes are at the end, each with how you would know it worked.

> **Goal:** Zaal set a working model on 2026-10-07 (vault `decisions/grill-2026-10-07-seat-morning.md`, items 24 to 26): at most three ACTIVE projects; SIDE terminals that never count (the orchestrator, the merge terminal, skills, his question surface, a reviewer); every other project PARKED with its own handoff and a numbered queue. This doc checks that model against what others report, says what is evidence and what is lore, and proposes five tunings. It extends [doc 2586](../2586-orchestrator-seat-outside-view/), which covers the orchestrator seat itself.

## Key Decisions

| # | Decision | Grounded in | Evidence or lore |
|---|---|---|---|
| 1 | KEEP the cap of three active projects, and call it a dial, not a law | Kanban Guide: the number must be controlled, no number is given; Personal Kanban: "Limit your work-in-progress", no number | The need for a cap is well supported. The number three is lore |
| 2 | COUNT the side queues: reviews waiting and merges waiting are work in progress | Kanban Guide: control "from started to finished"; Willison: review is "the natural bottleneck" | Evidence from today: 10 verdicts and 13 merges ran through two side terminals |
| 3 | A slot frees on a finish line written in advance, and an unfinished project goes back to the queue instead of holding its slot | Shape Up circuit breaker | Practice at one company, reported by its author |
| 4 | Two ordered NEXT items, the rest unordered | Shape Up "no backlogs"; Now/Next/Later | Practice, not measured |
| 5 | Choose the active three by dated commitment first, then cost of delay | Reinertsen via Black Swan Farming | Method; no ZAO measurement yet |

## Findings

### 1. How many agent sessions can one person run, and what breaks

| Source | Number reported | What breaks above it |
|---|---|---|
| Claude Code docs, "Run agents in parallel" (fetched today) | No number. One warning: "Running several sessions or subagents at once multiplies token usage." | The usage meter |
| Claude Code docs, worktrees (fetched today) | No number. One worktree per parallel session "without the edits colliding" | Edit collisions, solved by isolation |
| Simon Willison, 2025-10-05 (fetched today) | "I can only focus on reviewing and landing one significant change at a time", with smaller tasks "fired off in parallel" | "the natural bottleneck on all of this is how fast I can review the results" |
| Addy Osmani, via doc 2586 (fetched 2026-10-04, not re-fetched) | "Three to five teammates is the sweet spot" | Token cost and scattered focus |
| Doc 2474, via doc 2586 (not re-fetched) | 6 to 8 concurrently reviewed agents, no sustained report above that without a state UI | Review and state memory |
| Superset launch thread, via doc 2586 (not re-fetched) | One user at 40 to 50 sessions, with a tool that surfaces agent state | Without the tool: "couldn't manage more than like 20 terminal tabs without losing track" |

The sources disagree on the count (1 significant change, 3 to 5, 6 to 8, 40 to 50) and agree on the cause: the human's review speed and memory of state, then the token meter. Zaal's three ACTIVE projects sits at the low end, which fits Willison's point that only one significant change can be reviewed at a time. Note what the numbers count: Osmani and doc 2474 count agents, Zaal counts projects. Three projects plus five side terminals is eight sessions, which is doc 2586's cap of 8.

### 2. Who separates service roles from project work

- **Team Topologies** (key concepts page, fetched today) names four team types. Two map onto Zaal's split: "Stream-aligned team: aligned to a flow of work", and "Platform team: ... provide a compelling internal product to accelerate delivery by Stream-aligned teams". A third, the "Enabling team: helps a Stream-aligned team to overcome obstacles", is described elsewhere on the same page as teams that "temporarily boost skills in other teams, then move on". Mapping: the three active projects are stream-aligned; the merge terminal and the reviewer are platform (used "as a Service"); skills is enabling. The page also warns against overload: "overloaded teams make poor decisions and move slowly".
- **Merge queues.** GitHub documents a merge queue as a product feature [PARTIAL: the page loaded but only its navigation text was extracted, so nothing is quoted]. ZAO's merge terminal is the same idea run by a lane: one place where reviewed work lands in order.
- **Orchestrator and workers.** Doc 2586 covers this: the top session routes and verifies, and does not build.

What the outside view adds: in Team Topologies the platform is still a team with its own capacity. A service role that "never counts" can still be the bottleneck.

### 3. Work-in-progress limits: what is evidence, what is lore

- **Kanban Guide** (kanbanguides.org, fetched today): members "must explicitly control the number of work items in a workflow from started to finished", and "should start work on an item (pull or select) only when there is a clear signal that there is capacity to do so". It gives no number. It pairs the control with watching age: "Ensuring work items do not age unnecessarily".
- **Personal Kanban** (fetched today): "There are only two real rules with Personal Kanban: 1. Visualize your work 2. Limit your work-in-progress". No number.
- **Rule of 3** (gettingresults.com, fetched today): "Choose three outcomes that matter most", daily, weekly and monthly. It claims "Three is not arbitrary. It's the smallest number that allows real prioritization without oversimplifying reality." That is the author's assertion; the page cites no study. LORE.
- **Ivy Lee's six** (James Clear's retelling, fetched today): "write down the six most important things you need to accomplish tomorrow. Do not write down more than six tasks", then "concentrate only on the first task". The story is dated 1918 and told "As the story goes". Clear himself says: "I don't believe there is anything magical about Lee's number of six important tasks per day. It could just as easily be five". LORE, and honest about it. Note that Lee's six is a queue with ONE item active.
- **Task switching** (Wikipedia, "Human multitasking", API extract, fetched today): a secondary summary quoting David Meyer that when people alternate rapidly between tasks "errors go way up, and it takes far longer - often double the time or more - to get the jobs done than if they were done sequentially". [PARTIAL: a secondary source; the APA page I tried for the primary summary returned a bot wall.] EVIDENCE that a cap helps, with no evidence for which cap.
- **ZAO's own earlier doc disagrees with hard caps.** [Doc 763](../../dev-workflows/763-kanban-async-team-best-practices/) (2026-05-26) chose "DO NOT adopt explicit WIP limits per column (yet)" for the team board, because hard caps "frustrate ... when expedite work shows up", and preferred work item age as the signal. That was about a team board of tasks; this is about one person's concurrent projects. Both can hold: cap the projects, and watch the age of everything else.

So: every source says to limit work in progress, none measures three against two or five, and the one piece of research cited is about switching cost. Zaal's own "max three goals per day" rule (memory `feedback_max_three_goals_per_day`) is the same lore, applied consistently.

### 4. How others park work so it restarts cold

- **Shape Up, no backlogs** (ch. 7, fetched today): "Backlogs are a big weight we don't need to carry." At the betting table "they look at pitches from the last six weeks - or any pitches that somebody purposefully revived and lobbied for again. Nothing else is on the table." And: "Really important ideas will come back to you."
- **Shape Up, clean slate** (ch. 8): "only betting one cycle at a time and never carrying scraps of old work over without first shaping and considering them as a new potential bet". The circuit breaker: "If they don't finish, by default the project doesn't get an extension."
- **Shape Up, cool-down** (ch. 8): "after each six-week cycle, we schedule two weeks for cool-down. This is a period with no scheduled work".
- **Now/Next/Later** (Janna Bastow, ProdPad, fetched today): "The Now column held the work we were confident about and actively building. Next held the problems we expected to pick up once the current work wrapped. Later held the bigger, fuzzier problems we wanted to keep in view but weren't ready to commit to." And: "The Now column is definite, while the Later column is full of possibilities."
- **Anthropic's harness post** (fetched for doc 2586 today): each session leaves "clear artifacts for the next session".

A good parked note, assembled from these and from ZAO's own handoff rules (`handoff-discipline.md`): where it stands (branch, PR, head), the first command to run on restart, what is waiting on Zaal, what would unpark it, and the date it was parked. Shape Up adds the uncomfortable part: a parked item is not owed a slot. It comes back only if someone argues for it again.

### 5. How they choose what is active

- **Cost of delay** (Black Swan Farming, fetched today): "Cost of Delay combines urgency and value - two things that humans are not very good at distinguishing between." Ranking by "CD3 (Cost of Delay Divided by Duration)" favours short, urgent work.
- **Appetite, not estimate** (Shape Up): decide how much time a thing is worth before starting it.
- **The human's attention** (Willison): choose so that at most one of the active things needs heavy review at a time.

Zaal's picks on 2026-10-07 already follow the first rule without naming it: bcz-yapz went active because an episode was at 17:00 that day (a dated commitment), and poidhz and x-account moved to the queue.

## Measured against ZAO on 2026-10-07

| Measure | Value | Source |
|---|---|---|
| Claude sessions open at 09:05 EDT | 13, of which 12 idle | `ListAgents`, measured by this lane (doc 2586 re-validation) |
| Orca terminals at about 13:15 EDT | 18 | `orca-board --json`, 18 rows, measured by this lane during a review |
| Terminals after the 15:03 closures | 13 remain | vault `handoffs/status/orchestration.md`, "Lanes closed by the seat" |
| "18 terminals cut to 14" | the orchestrator's figure | relayed; not re-measured by this lane |
| Account usage limit hit | about 14:44 to 14:47 EDT, reset 17:10 | vault `handoffs/status/orchestration.md`, read from five panes by the seat |
| Questions waiting vs answered, 6 Oct by 14:1x | 84 lines vs 16 rulings | vault `notes/orchestrator-improvements-2026-10-06.md`, proposal 9 |
| Verdicts through one reviewer pane today | 10, on 6 PRs (three of them re-reviewed after a fix) | this lane's own PR comments |
| Merges through the merge terminal by 14:59 EDT | 13 merged (10 zaal-dotfiles, 3 ZAOOS), 10 more reviewed and queued when the limit stopped it | vault `handoffs/status/orchestration.md`, the merge lane's own report |

Reading: the three-active rule was set at 15:18, AFTER the usage limit hit at 14:45. Before it, the day ran 13 to 18 sessions. The limit and the 84-to-16 question backlog are the two places the system actually stopped. Neither is a count of active projects. One is the token meter (Claude Code docs: parallel sessions multiply usage), the other is Zaal's attention (Willison's bottleneck). The side terminals did most of the afternoon's throughput: reviews and merges.

## Five tunings (each reversible)

| # | Tuning | What changes tomorrow morning | How he would know it worked |
|---|---|---|---|
| 1 | **Show the side queues as numbers.** Reviews waiting and merges waiting are work in progress even though the terminals "never count" | The seat's morning status carries two numbers: PRs waiting for a verdict, PRs CLEAN and waiting to merge | No PR waits overnight for a verdict without him having seen the number |
| 2 | **A finish line per active slot, written when the slot is taken.** One sentence of DONE-WHEN, and his own date if it has one | Each of the three active entries in `handoffs/status/orchestration.md` has a DONE-WHEN line | A slot turns over because its line was met, not because something louder arrived |
| 3 | **Two NEXT, the rest LATER.** Only NEXT 1 and NEXT 2 are ordered. Everything else parked is one unordered list, and a LATER item needs him to name it before it moves up | The parked list is rewritten as NEXT 1, NEXT 2, LATER | When a slot frees, the seat starts NEXT 1 without asking him which |
| 4 | **Cold-start test for parked notes.** Before a lane is parked, its note names the first command to run and what unparks it | Each parked lane's handoff has those two lines | The next time a parked lane resumes, its first message is work, not a question to him |
| 5 | **Let the meter set the dial.** If the account limit is hit before his work window ends, the next day runs two active, not three; if it is not hit for three days, three stays | The seat records the time the limit was hit (or "not hit") in the day's close-out, from `zao-spend` and the pane text | Days with the limit hit before 17:00 go down |

None of these needs a new tool. Tunings 1 to 4 are lines in files the seat already writes. Tuning 5 uses `zao-spend`, which exists (`agent-spend.md`).

One open point, not a tuning: three active PROJECTS can still mean three things that each need his hands on the same afternoon. Willison's line suggests staggering them, so that at most one of the three is at its review-heavy stage. That is his call to make per day, not a rule to write.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Read the ten-line summary and say which of the five tunings to try | Zaal | Decision | 2026-10-08 |
| If he says yes to 1 to 4: add the two queue numbers, DONE-WHEN lines, NEXT/LATER split and the two parked-note lines to `handoffs/status/orchestration.md` | orchestrator seat | Vault edit | the next morning status |
| If he says yes to 5: record the limit-hit time in each day's close-out | orchestrator seat | Habit | daily |
| Re-validate this doc after seven days of the three-active model, with the measured turnover of slots | a research lane | Doc | 2026-10-14 |

## Sources

Fetched 2026-10-07 unless marked. "Raw" means curl with a browser User-Agent, HTML stripped locally, quotes taken from that text.

1. Claude Code docs, [Run agents in parallel](https://code.claude.com/docs/en/agents.md) [FULL, raw markdown]
2. Claude Code docs, [Common workflows: Run parallel sessions with worktrees](https://code.claude.com/docs/en/common-workflows.md) [FULL, raw markdown]
3. Simon Willison, [Embracing the parallel coding agent lifestyle](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/), 2025-10-05 [FULL, raw]
4. Team Topologies, [Key Concepts](https://teamtopologies.com/key-concepts) [FULL, raw; the page mixes the authors' definitions with a practitioner's commentary, both quoted and distinguishable above]
5. Personal Kanban, [Personal Kanban 101](https://www.personalkanban.com/personal-kanban-101) (Modus Cooperandi) [FULL, raw; a short page]
6. [The Kanban Guide](https://kanbanguides.org/english/) (Orderly Disruption, Daniel S. Vacanti; CC BY-SA 4.0) [FULL, raw]
7. Ryan Singer, Shape Up, [ch. 7 Bets, Not Backlogs](https://basecamp.com/shapeup/2.1-chapter-07) [FULL, raw]
8. Ryan Singer, Shape Up, [ch. 8 The Betting Table](https://basecamp.com/shapeup/2.2-chapter-08) [FULL, raw]
9. James Clear, [The Ivy Lee Method](https://jamesclear.com/ivy-lee) [FULL, raw; a retelling of a 1918 anecdote]
10. J.D. Meier, [The Rule of 3 for Productivity](https://gettingresults.com/rule-of-3/) [FULL, raw]
11. Janna Bastow, [Why I Invented the Now-Next-Later Roadmap](https://www.prodpad.com/blog/invented-now-next-later-roadmap/), 2022-10-18 [FULL, raw; vendor blog by the format's author]
12. Black Swan Farming, [Cost of Delay](https://blackswanfarming.com/cost-of-delay/) [FULL, raw; a consultancy's page quoting Reinertsen]
13. Wikipedia, [Human multitasking](https://en.wikipedia.org/wiki/Human_multitasking) [PARTIAL: plain-text extract through the MediaWiki API; a secondary summary, used only for the Meyer quotation]
14. GitHub Docs, [Merging a pull request with a merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue) [PARTIAL: HTTP 200, but only navigation text survived the strip; nothing quoted]
15. APA, Multitasking: Switching costs (apa.org/topics/research/multitasking) [FAILED: a 212-byte bot-protection page]
16. GitHub Docs, "managing a merge queue" under repository settings [FAILED: HTTP 404 at the URL tried]

Not re-fetched, cited through [doc 2586](../2586-orchestrator-seat-outside-view/) (fetched 2026-10-04): Addy Osmani's "Code Agent Orchestra", the Superset launch thread on Hacker News, doc 2474's 6-to-8 figure, and Anthropic's long-running-agents post (re-fetched this morning for doc 2586).

Internal: zao-vault origin/main `decisions/grill-2026-10-07-seat-morning.md` (items 24 to 26), `handoffs/status/orchestration.md`, `notes/orchestrator-improvements-2026-10-06.md`; ZAOOS docs 2586 and 763; `.claude/rules/agent-spend.md` and `handoff-discipline.md`.

Not searched: Reddit and X for practitioner reports on personal caps (the budget was about fifteen fetches), Claude Squad, Conductor and Vibe Kanban's own docs on session counts (doc 2586 read their READMEs on 2026-10-04 and found no stated cap), and the primary psychology papers behind the switching-cost claim.
