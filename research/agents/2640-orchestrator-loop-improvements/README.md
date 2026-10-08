---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "agents/2586-orchestrator-seat-outside-view, agents/2630-three-active-projects-wip-outside-view, agents/2636-agentic-organization-day-measured, agents/2444-always-on-orchestrator"
original-query: "can we spend some time improving our loop go do some deep resaech on it"
tier: DEEP
---

# 2640 - Improving the seat loop: nine failures in two days, and ranked changes, most of them scripts

## Summary for Zaal

1. Nine things went wrong in the loop over 7 and 8 October. Five of them are the same kind: a rule that lives only in a sentence, which a script could check.
2. The ZOE status command broke because the seat reformatted its queue page; nothing checked the format until you sent a screenshot.
3. Two lanes read a ruling more widely than you meant it, and the seat parked a lane against your earlier overnight instruction. Both were caught by you, not by the loop.
4. Several open PRs conflicted on the same settings-example file, twice in a row, until one lane fixed the cause.
5. The machine ran at a load average of 68 to 116 with about 18 to 22 sessions open. The load is real cost, and it is mostly idle sessions plus heartbeats.
6. What others do: keep notes outside the conversation, keep each session's context small, and let a status screen or a notification tell you who needs you, instead of polling.
7. Claude Code already ships two of the tools the estate keeps rebuilding: a "Needs input" state per session, and a Notification hook.
8. The top changes: a format check on the queue page, a written scope on every relayed ruling, a refusal to park a lane that has a standing instruction, one slot per flag in the settings example, and a heartbeat that only runs when something is queued.
9. Most of these are scripts or lines in files, not more thinking. Each says what it costs and which existing rule or tool it extends.
10. Nothing here needs a new bot or a new system.

> **Goal:** Find out what is going wrong in the orchestrator-and-lanes loop Zaal runs every day, from the record, compare it with how others run orchestrator-worker systems, and rank concrete changes. Extends [doc 2586](../2586-orchestrator-seat-outside-view/) (the seat), [doc 2630](../2630-three-active-projects-wip-outside-view/) (caps and queues) and [doc 2636](../2636-agentic-organization-day-measured/) (one day measured, five changes). Those docs set the shape; this one looks at the loop's moving parts.

## How the evidence was gathered, and one gap

- **Read directly by this lane:** zao-vault origin/main `decisions/grill-2026-10-07-seat-morning.md` items 45 to 56 (read 2026-10-08 06:55 EDT); the git log of `notes/orca-terminals-latest.md`; the two 2026-10-07 entries in `MISTAKES.md`; vault commits `a625179a` and `698a756a`; ZAOOS #3803; `uptime` on this Mac at 06:57 EDT.
- **Seat record, not re-read:** my permission layer denied a read of my scratch copies of `handoffs/status/orchestration.md` and `MISTAKES.md` ("Permission to use Bash with command ... has been denied"). I did not retry. The seat then sent its own first-hand record of the nine failures, each with an anchor. Those are cited below as "seat record". Three anchors were checked and hold: `a625179a` (2026-10-08 05:46, "queue page: morning state 05:46"), `698a756a` (06:11, "queue page: match the /terminals parser columns"), and ZAOOS #3803 (open, "fix(zoe): /terminals reports a drifted Terminals table instead of 0 terminals").
- **Rules read in full this session:** `agent-loops.md`, `agent-spend.md`, `lane-autonomy.md`, `handoff-discipline.md`, `code-over-inference.md`.

## Part 1. The nine failures

| # | Failure | Evidence | Kind |
|---|---|---|---|
| 1 | **The queue page drifted out of the /terminals parser's format.** The seat rewrote it with columns Group, Tab, State, Doing; ZOE's /terminals then answered "Active: none listed. 0 terminals:" | Seat record; commits `a625179a` (05:46) and `698a756a` (06:11, the fix); ZAOOS #3803 makes the parser loud on drift | A format that only a sentence defined |
| 2 | **The seat parked a lane against his earlier instruction.** On 2026-10-07 at about 21:3x the seat parked north-creek-fe because load was 68; his standing instruction was overnight design research. Resumed 05:19 on 10-08 after he typed "i asked you to review overnight" | Seat record | A standing instruction the parking step did not check |
| 3 | **A ruling read more broadly than given.** zaostock-5e read item 54 (AI visuals come down) as also settling the held thank-you question | Seat record; item 54 itself names North Creek and ZAOstock visuals only | A relayed ruling with no written scope |
| 4 | **PR stacks re-conflicted on `bot/.env.example`.** #3780, #3782 and #3784 conflicted after other merges, then #3796, #3795, #3784 and #3782 again after #3793 and #3780 landed. zoe-15 fixed the cause by giving each flag block its own slot | Seat record | A shared file every PR appends to at the same place |
| 5 | **Review gates denied and not routed around.** dreamnet-54's merge-tree check and its grep on #3769 were refused | Seat record; same shape as the four refusals in doc 2636 | Correct behaviour; the cost is a stalled review |
| 6 | **A self-review was caught.** dreamnet-54 declined to review #3769 because it wrote it | Seat record | The rule held, by the lane's own judgment |
| 7 | **Machine load.** 67.97 at 21:30 on 10-07; 99 to 116 reported by zoe-15 on 10-08; about 18 sessions open | Seat record; this lane measured 21.30 / 41.31 / 47.51 with 22 users at 06:57 on 10-08 | Too many live sessions on one Mac |
| 8 | **The heartbeat's cost against its value.** The seat stopped the hourly loop after two no-change ticks on 10-07 night, then restarted it at 25 to 30 minutes on 10-08 | Seat record; the queue page has 76 commits since 2026-10-06, 22 of them in the 12:00 hour and 21 in the 15:00 hour on 10-07 (git log) | A loop that wakes on time, not on change |
| 9 | **Questions scattered across panes.** Zaal: "I feel like each day we are missing things"; the seat counted 19 open items | Seat record; items 41 and 43 were typed in lane panes and relayed | More than one place to ask him |

Also in the record, from `MISTAKES.md` on origin: on 2026-10-07 a reviewer "called set -e a safe form without running it", and a CLEAN was "posted on zaal-dotfiles #433 before its CI had reported; CI went red". No entries are dated 2026-10-08 on origin as of 06:55 EDT; entries a lane has not pushed were not seen.

### What the nine have in common

Five of them (1, 2, 3, 4, 9) are the same failure: **a rule that existed only as prose, at a point where a script could have checked it.** The queue page's columns were a convention. "Do not park a lane with a standing instruction" was the seat's judgment. A ruling's scope lived in the seat's head. The `.env.example` layout was whatever the last PR did. Questions went wherever a pane was open. `code-over-inference.md` names this exactly: "Same judgment every time -> it is a SCRIPT."

Two (5, 6) are the system working: a lane stopped at a gate and a lane refused to grade its own work. Their cost is a stall, which doc 2636's change 1 (let review lanes read) addresses.

Two (7, 8) are spend. They follow from the number of sessions alive and the number of times the seat wakes.

## Part 2. How others run the loop (fetched raw)

**Anthropic, "Effective context engineering for AI agents"** (fetched 2026-10-08):
- "good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."
- "context rot: as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases."
- "Structured note-taking, or agentic memory, is a technique where the agent regularly writes notes persisted to memory outside of the context window ... Like Claude Code creating a to-do list, or your custom agent maintaining a NOTES.md file".

The seat's queue page is that note file. Failure 1 is what happens when the note file is also an interface another program parses, with no contract.

**Anthropic, multi-agent research system and harness posts** (fetched 2026-10-07 for docs 2586 and 2636): multi-agent systems use "about 15× more tokens than chats"; "Synchronous execution creates bottlenecks"; each session should leave "clear artifacts for the next session".

**Claude Code, agent view** (fetched 2026-10-08): one screen for background sessions with a state per row. "Needs input | Yellow | Claude is waiting on something only you can provide: an answer to a question, a permission decision, or another prompt only you can answer". Also: "Interactive sessions you have open in other terminals don't appear until you background them."

**Claude Code, hooks** (fetched 2026-10-08): "Run shell commands automatically when Claude Code edits files, finishes tasks, or needs input." The guide's first example is a `Notification` hook "so you get alerted whenever Claude is waiting for your input". This is the native answer to item 48 ("so the notifica tion bell doesnt need to be pressed").

**Claude Code, scheduled tasks** (fetched 2026-10-08): `/loop` can run "at an interval Claude chooses ... After each iteration it picks a delay between one minute and one hour based on what it observed". Tasks are session-scoped.

**Claude Code, agent teams** (fetched 2026-10-07): "Start with 3-5 teammates for most workflows"; "Token costs scale linearly".

**Gas Town** (fetched 2026-10-07): a "Witness" that "detects stuck agents", a "Refinery" merge queue, and a "Scheduler" that "Prevents API rate limit exhaustion by batching dispatch under configurable concurrency limits."

**Claude Squad** (fetched 2026-10-08, OSS, AGPL-3.0 per doc 2586): "Each task gets its own isolated git workspace, so no conflicts"; "Review changes before applying them". The same worktree-per-task rule the estate already follows.

Across these: notes live outside the session; who-needs-you is a state the tool shows, not something a loop polls for; concurrency is capped by a scheduler; each worker has its own workspace. None of them describes a shared page that both a human and a parser read, which is the one place the estate is ahead of the sources and also where it broke.

## Part 3. Ranked changes for the seat loop

Ranked by how often the failure happened and how cheap the fix is. "Script" means it runs the same every time and costs nothing per run once built; "inference" means it needs a turn each time (`code-over-inference.md`).

| Rank | Change | Fixes | Script or inference | Cost | Extends |
|---|---|---|---|---|---|
| 1 | **A format check on the queue page, run before each commit.** A short check that the Terminals table has the columns the /terminals parser expects, failing the seat's commit if not. Pairs with #3803, which makes the parser loud on drift | 1 | Script | One small script plus a call in the seat's commit step; then free | `698a756a`'s format contract; ZAOOS #3803; `silent-failure-guard.md` (assert on content) |
| 2 | **Every relayed ruling carries a written scope line.** "Applies to: X. Does not settle: Y." The seat writes it when it routes; the receiving lane quotes it back before acting | 3 | Inference, once per ruling (a line the seat is already writing) | Seconds per ruling | `lane-autonomy.md` ("When in doubt whether something is gated, IT IS GATED"); doc 2586's ruling path |
| 3 | **Park refuses a lane with a standing instruction.** Before the seat parks a lane, it reads the lane's row for a standing instruction with a time window ("overnight", "until done"). If one exists, it does not park; it asks Zaal inline, or lowers that lane's effort instead | 2 | Script for the check (a field in the queue page row), inference for the ask | A field per row, one grep | `handoff-discipline.md` rule 5 (lane lifecycle); the queue page |
| 4 | **One slot per flag in every `.env.example`.** The layout zoe-15 introduced, written into the file's header as the rule: each feature's block between its own markers, never appended at the end | 4 | Script (a one-line note in the file, and optionally a check that new blocks land in their own slot) | Already done once by zoe-15; writing it down is one line | `agent-loops.md` rule 29 (never union-merge code) |
| 5 | **The heartbeat wakes on change, not on time.** The seat loop runs when a lane message or a queue change arrives. A timed tick only checks one cheap signal (did the queue page or the inbox change since the last tick) and stops after two quiet ticks | 8 | Script for the change check; inference only when something changed | Removes most quiet-tick turns. `agent-spend.md`: a quiet tick "still costs $6-10" | `agent-spend.md` ("two consecutive no-change ticks means stop, not lengthen"); `agent-loops.md` rule 5 |
| 6 | **Use the native "needs input" signal.** A `Notification` hook on each lane that marks the lane as waiting on Zaal in the queue page (or colours it, item 48), in place of the seat reading panes to find out | 9, and item 48 | Script (a hook) | Settings change, so Zaal's tap; then free | Claude Code hooks guide; the skills lane's colour work (item 48) |
| 7 | **Cap live sessions by load.** When `uptime` reads above a set number (the seat would choose; 40 is a starting guess), the seat backgrounds or closes LATER and idle lanes with their handoffs before opening anything new | 7 | Script (one `uptime` read in the tick) | One command per tick | Doc 2630 (cap); Gas Town's Scheduler idea; `handoff-discipline.md` rule 5 |
| 8 | **One question surface, enforced.** A lane that wants an answer from Zaal sends it to the seat, never asks in its own pane; the seat holds one list. Items 41 and 43 show answers typed in lane panes still happen, so the seat records those as relayed | 9 | Inference (a line in every lane brief) | One line per brief | Doc 2586 ("Ask Zaal one plain-text question at a time"); his own item 29 |

Not ranked, already right: failures 5 and 6. A lane that stops at a denied read and a lane that will not review its own PR are the rules working. Doc 2636's change 1 (open the read-only allow rules) removes the stall without weakening either.

Not proposed: a new orchestrator tool, Gas Town or Claude Squad. The sources' ideas fit into files and checks the estate already has.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rank 1: the queue-page format check, as a vault PR that pairs with #3803 | orchestrator seat, or a lane it names | Script PR | 2026-10-09 |
| Ranks 2, 3 and 8: three lines in the seat's routing step and in each lane brief | orchestrator seat | Habit | 2026-10-08 |
| Rank 4: write the slot rule into the header of `bot/.env.example` and the root `.env.example` | zoe-15 | One-line PR | next ZOE PR |
| Rank 5: change-triggered heartbeat | orchestrator seat | Loop change | 2026-10-08 |
| Rank 6: the Notification hook | Zaal (a settings change) | Decision | when he wants |
| Rank 7: pick the load threshold | orchestrator seat, overridable by Zaal | Decision | 2026-10-08 |

## Sources

1. Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) [FULL, curl with a browser User-Agent, HTML stripped; fetched 2026-10-08]
2. Claude Code docs, [Manage multiple agents with agent view](https://code.claude.com/docs/en/agent-view.md) [PARTIAL: read by keyword and the session-state table; raw markdown; 2026-10-08]
3. Claude Code docs, [Automate with hooks](https://code.claude.com/docs/en/hooks-guide.md) [PARTIAL: the opening and the Notification example; raw markdown; 2026-10-08]
4. Claude Code docs, [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md) [PARTIAL: read by keyword; raw markdown; 2026-10-08]
5. smtg-ai, [Claude Squad README](https://raw.githubusercontent.com/smtg-ai/claude-squad/main/README.md) [PARTIAL: highlights section; raw; 2026-10-08]
6. Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) [FULL; fetched 2026-10-07 for doc 2636, quotes verified against the raw text then]
7. Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) [FULL; fetched 2026-10-07 for doc 2586's re-validation]
8. Claude Code docs, [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams.md) [FULL; fetched 2026-10-07 for doc 2636]
9. Gas Town, [README](https://raw.githubusercontent.com/steveyegge/gastown/main/README.md) [FULL for the role sections; fetched 2026-10-07 for doc 2636]
10. zao-vault origin/main, read 2026-10-08 06:55 EDT: `decisions/grill-2026-10-07-seat-morning.md` items 45 to 56, the git log of `notes/orca-terminals-latest.md`, `MISTAKES.md` headings dated 2026-10-07, commits `a625179a` and `698a756a` [FULL for what is cited]
11. `handoffs/status/orchestration.md` and the body of `MISTAKES.md` [FAILED: read denied by this lane's permission layer; the seat's first-hand record was used instead and is marked "seat record"]
12. ZAOOS #3803, `gh pr view` [FULL]; `uptime` on this Mac, 2026-10-08 06:57 EDT [FULL]

Credit: the nine-failure record is the orchestrator seat's; zoe-15 found the `.env.example` cause; dreamnet-54 declined its own review.
