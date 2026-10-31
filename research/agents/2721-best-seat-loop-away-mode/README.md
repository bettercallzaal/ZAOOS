---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-29
superseded-by:
related-docs: "agents/2640-orchestrator-loop-improvements, agents/2647-seat-loop-effectiveness, agents/2704-lane-idle-sleep-and-wake, dev-workflows/2649-rules-history"
original-query: "can we learn how to build the best loop - a /zao-research STANDARD doc on the best loop for the seat to manage the lanes while Zaal is away: cadence, sweep shape, dead-pane recovery, when to stop, and cost per tick (Zaal's words relayed by the seat, 2026-10-29)"
tier: STANDARD
---

# 2721 - The away loop: how the lanes get managed while Zaal is away

> **Goal:** One loop that keeps the lanes moving while Zaal is away, so stepping away costs nothing in quality. It covers cadence, what a sweep reads, how a dead pane is brought back, when the loop stops, and what a tick costs. It extends [doc 2640](../2640-orchestrator-loop-improvements/) (the loop's failures) and [doc 2647](../2647-seat-loop-effectiveness/) (cost per wake). It does not repeat them.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE a self-paced `ScheduleWakeup` loop whose first act each tick is a script.** The model reads only the lines the script prints, and a tick with no lines ends as `noop` at once. | The script does the "has anything changed" step, which is the same judgment every time (`code-over-inference.md`). The model is paid only when a pane needs a decision. |
| 2 | **SKIP a Monitor as the standing doorbell.** Doc 2647 proposed `seat-digest --watch` as a Monitor. The official docs now cap it: "Every watch Claude starts has a deadline: 5 minutes by default, at most 30 minutes", and at the deadline "the watch ends". | A Monitor cannot cover a 60-minute absence alone, and on `--resume` Claude Code "doesn't restart the background Bash commands and monitors that were running when the session ended". A Monitor stays right for a single CI run inside one tick. |
| 3 | **Run the loop in the messenger lane (0c), not the seat.** The seat reads the messenger's return table and nothing else. | Cost scales with context ("Token costs scale with context size", costs.md). The seat's median call re-read 222,796 cached tokens over the last 24h, with 12 continuations. The open dotfiles branch already puts the sweep in the messenger skill. |
| 4 | **Cadence: 1200s while any lane is working or stuck on a question, 3600s when every lane is idle or waiting on Zaal with its question filed.** Never shorter than 1200s. | The away-mode branch measured six of seven lanes sitting 25 to 60 minutes between hourly sweeps on 2026-10-29. With a 1-hour prompt cache, every allowed delay wakes warm (ScheduleWakeup tool text), so 20 minutes costs no cache rebuild. |
| 5 | **Dead-pane recovery: busy is not dead; two sweeps before escalating; one nudge, never a respawn.** | `liveness-probe-guard.md` rules 1 to 3. The branch's 2026-10-29 case was a lane on "API Error: The response stopped arriving", dead about 25 minutes and unseen. |
| 6 | **Exit on Zaal's return, which is a one-shot cron set off the hour. Exit early after two sweeps with nothing working. A hard tick cap applies.** | One-shot tasks "scheduled for `:00` or `:30` run up to 90 seconds early" (scheduled-tasks.md). Two quiet ticks means stop (`agent-spend.md`). A cap bounds a loop that never sees its exit. |
| 7 | **Expected cost: about $0.05 to $0.15 for a quiet tick and about $0.16 median for an acting tick, so roughly $0.50 to $3 for a 60-minute absence.** This is a projection from measured per-call costs, to be re-measured after the first away window. | Measured: the seat's 254 wakes in the last 24h cost $85.21, with a median of $0.16 and a p90 of $0.97 per wake (local script, below). |

## Part 1. What exists already (searched first)

Search on 2026-10-29: `grep -iE "seat.*loop|away mode|scheduleWakeup|/loop|dead pane|sweep" research/*/README.md`; `gh pr list --search "loop in:title" --state all`; `command -v` on each tool. Results:

| Piece | State on 2026-10-29 | Source |
|---|---|---|
| Doc 2640: nine loop failures; ranked fixes (wake on change, use the native needs-input state, cap by load) | merged | `research/agents/2640-orchestrator-loop-improvements/` |
| Doc 2647: the seat cost $761 for 24h on 2026-10-08, 82% of it cache reads; relay wakes were 31%; Monitor plus boundary restarts proposed | merged | `research/agents/2647-seat-loop-effectiveness/` |
| `seat-digest`: one line per change in the queue page, PR state and (off by default) the inbox | built, git-tracked in zaal-dotfiles `bin/` | `seat-digest --help` |
| `zao-lane-sleep`: sleeps lanes WAITING 30+ minutes, wakes them on a message | built; DRY-RUN until Zaal creates the on-switch | messenger SKILL.md on main |
| Away-mode sweep: 20-minute cadence while away, dead-mid-turn nudge, auto-proceed line for non-gated questions | **on branch only**: zaal-dotfiles `fix/lane-away-mode-sweep-author-gate` at `b18650c` (2 commits, 6 files, +102/-2). `gh pr list --head` returned no PR | `git diff origin/main...origin/fix/lane-away-mode-sweep-author-gate` |
| Lane rule: take the recommended option on any non-gated question, log `auto-proceeded: <choice>, override anytime` | `.claude/rules/lane-autonomy.md` on main; the global fragment on the same branch | both read 2026-10-29 |
| Pane state without a model: `orca terminal list --json` gives `lastOutputAt`, `preview`, `connected` and `title` for each terminal | ships with Orca | run 2026-10-29 11:2x EDT, 12 terminals |

So the loop below is wiring and rules on top of what exists, not a new system. The one new piece of code it needs is a pane source for `seat-digest` (Next Actions, row 1).

**Measured while writing this.** `orca terminal list --json` at about 11:25 EDT showed the terminal titled "Read messenger handoff" with its last output 324 minutes earlier. If that is the messenger, the lane that is meant to sweep had not swept for about five and a half hours. The terminal was identified by its title only; the process behind it was not checked.

## Part 2. The loop shapes compared

| Shape | How it wakes | Fit for a 30 to 120 minute absence | Verdict |
|---|---|---|---|
| **A. Self-paced `/loop` (ScheduleWakeup), script-first tick** | The model picks 60 to 3600s each tick; `stop: true` ends it; an un-rescheduled tick gets "one fallback wakeup about 20 minutes later", then the loop ends | Good: the delay follows what the sweep saw, and quiet ticks are 1 call | **USE** |
| B. Fixed `/loop 20m` (cron) | Every 20 minutes, "0 to 15 minutes late" at a 30-minute step (jitter table); 7-day expiry | Fires on a fixed clock with no regard to state; `Esc` does not stop it | SKIP: no back-off |
| C. Monitor only | Each output line of a background script | Watch deadline at most 30 minutes; not restored on `--resume` | SKIP as the doorbell; USE inside a tick for one CI run |
| D. Desktop or cloud scheduled task | Its own session per run | Cloud: the comparison table lists its access to local files as "No (fresh clone)" and its minimum interval as 1 hour, so it cannot read Orca panes. Desktop: local, but a fresh session every run, with no memory of the last sweep | SKIP for this job |

All quotes in the table are from `code.claude.com/docs/en/scheduled-tasks.md` and the Monitor section of `tools-reference.md`, fetched raw on 2026-10-29.

## Part 3. What the sources say that changes the design

- **The script decides; the model judges.** Anthropic's long-running harness post (Nov 26, 2025): each session must "quickly understand the state of work when starting with a fresh context window, which is accomplished with the claude-progress.txt file alongside the git history." For this loop the state file is the sweep's own last-seen table, and the git history is each lane's status file.
- **A reset beats compaction for a long run.** "Harness design for long-running apps" (Mar 24, 2026): "While compaction preserves continuity, it doesn't give the agent a clean slate ... A reset provides a clean slate, at the cost of the handoff artifact having enough state for the next agent to pick up the work cleanly." The seat had 12 "continued from a previous conversation" wakes in 24h. **USE a fresh messenger session per away window**, booted from its status file, instead of a messenger compacted for the twelfth time.
- **Separate the judge from the worker.** Same post: "Separating the agent doing the work from the agent judging it proves to be a strong lever." The loop never grades a lane's PR. It routes PRs to the merge lane and the evaluator, as today.
- **The harness is cattle; the log survives it.** "Scaling Managed Agents" (Apr 8, 2026): "Because the session log sits outside the harness, nothing in the harness needs to survive a crash", resumed with `wake(sessionId)`. Here a dead pane's transcript is the log, and `claude --resume <session>` is the wake. So the recovery for a DEAD shell is the resume line, never a fresh replacement lane.
- **Every harness piece is an assumption that goes stale.** Same post: harness assumptions "need to be frequently questioned because they can go stale as models improve." That is the reason Decision 7 carries a re-measure date.
- **Community.** One HN thread on persistent Claude Code loops, "How I manage persistent Claude Code loops: Spool" (25 points, 9 comments, 2026-10-11). Two points from it apply here. A user running it reported "isolated Docker containers + only handpicked secrets that I gave to loops"; this loop has no secrets to hand out, because it sends text to panes and nothing else. And another user said one request "spawned around 70 fable agents, which consumed all my usage immediately", which is the case for a tick cap. That is thin evidence and is stated as thin. Wider HN searches since 2026-01-01 ("claude code loop": 962 hits; "long-running agent harness": 18) turned up no thread on away-mode lane supervision with more than 25 points.

## Part 4. The spec: one loop, `away-sweep`

**Owner.** The messenger lane (0c). The seat starts nothing; it reads the return table.

**Trigger.** Zaal says he is away ("going away 45 min", "gym", "back at 7"), in any pane. The messenger then does three things.
1. Runs `CronCreate` once, one-shot, at the return time, moved off `:00` and `:30` (`3 7 * * *`, not `0 7 * * *`). No stated time means 60 minutes.
2. Writes one line with `zao-status-append messenger "away until HH:MM, sweep on"`.
3. Starts the loop with `ScheduleWakeup` at 1200s.

After 20:30 ET the same loop runs in its overnight form: 3600s, unless a lane is working.

**What each tick reads, in order.**
1. **A script, and nothing else unless it prints.** `seat-digest --panes` (to be built: Next Actions row 1) reads `orca terminal list --json` and diffs it against its state file. It prints one line per lane whose state CHANGED or needs action:
   - `DEAD-MIDTURN <lane>`: the tail matches `API Error` or `The response stopped arriving`, and the same tail was read on the previous sweep too (two reads, never one).
   - `DEAD <lane> <resume line>`: the pane is at a shell prompt with a "Resume this session" line.
   - `STUCK-Q <lane>`: the tail shows a question and `lastOutputAt` has not moved since the last sweep.
   - `IDLE <lane> <minutes>`: no output for 30+ minutes, with no question showing.
   - `PR <repo>#<n> <state>`: from the existing PR source.
   A tail that shows a working spinner, or output newer than the last sweep, is WORKING and prints nothing. **No lines means the tick ends as `noop`, with no further reads.**
2. **Only for a printed line:** that lane's last 40 lines (`orca terminal read --terminal <handle>`) and, for a question, `zao-prior <terms>` before deciding it is gated.

**What it may do without asking.** Each act is reversible and is logged to the return table.

| Line | Act | Limit |
|---|---|---|
| DEAD-MIDTURN | send exactly `resume from where you stopped` | once per lane per window; the same tail on the next sweep goes to the seat as one line |
| DEAD | send the seat the `claude --resume <session>` line | never opens a replacement lane (`liveness-probe-guard.md` rule 2) |
| STUCK-Q, not gated | send: take your recommended option, log `auto-proceeded: <choice>, override anytime`, start your next step | `lane-autonomy.md`; when in doubt it is gated |
| STUCK-Q, gated | add it to "waiting on you" in the return table | never answered, never sent to Zaal's phone while he is away |
| IDLE, with a next step in its brief | send: start your next step | the lane's own brief only |
| slept lane has a message | `zao-lane-sleep wake <lane>`, then deliver | as the messenger skill says |
| PR CLEAN at its head | run `zao-merge-batch` and put the line in the return table | never merges; an author never merges its own PR |

**Never, while away:** answer a gated question (money, public or outbound, irreversible, his facts, settings or hooks); merge; close, renumber or move a numbered lane; kill or restart a process; nudge the same pane twice; change settings; delete anything; send Zaal anything after 20:30 ET.

**Cadence.** After the acts, the tick reschedules:
- 1200s if any lane printed WORKING since the last sweep, or any STUCK-Q, DEAD-MIDTURN or IDLE line was acted on;
- 3600s if every lane is idle or waiting on a gated question that is already in the table;
- `stop: true` on the exit conditions below.
A CI run that the next decision depends on gets a Monitor inside the tick (it ends within 30 minutes on its own), not a shorter wake.

**Exit condition.** The first of these ends the loop:
1. The return cron fires. The messenger writes the "while you were away" table (done, with PR numbers; decided for you, with each `auto-proceeded` line; waiting on you, gated, one line each), posts it to the seat, and calls `ScheduleWakeup` with `stop: true`.
2. Two consecutive sweeps where no lane is working and every waiting item is already in the table. The loop stops early and the table waits for his return.
3. A tick cap of `ceil(away_minutes / 20) + 3` ticks. Reaching it is itself a line in the table.
4. Zaal types anything in any pane. He is back.

**Cost per tick (projection).**
- Quiet tick: one or two calls. At the seat's measured median of 222,796 cached tokens and Opus 5.5's $0.20 per million cache-read rate (the `zao-spend` table), each call is about $0.045 before output, so a quiet tick is roughly $0.05 to $0.15. In a fresh messenger session it is lower, since its context is smaller; that has not been measured.
- Acting tick: the measured median for a seat wake is $0.16 (p90 $0.97).
- A 60-minute absence: 3 to 5 ticks, roughly $0.50 to $3. Re-measure after the first window with the script below.

## Part 5. Measured for this doc (2026-10-29)

- `zao-spend --hours 24 --by-lane`, since Oct 28 11:27: the seat's workspace (`orchestrator2`) was $90.20 over 20 sessions. On 2026-10-08 doc 2647 measured $761 for 24h. The meter was corrected in between (keep-last per message id, and per-version Opus pricing, per the comment in `bin/zao-spend` citing doc 2672), so the two figures are not a like-for-like trend.
- `wakecost.py` (this folder; read-only), run on the seat's 4 transcripts modified in the last 24h: 254 wakes, $85.21. Peer messages: 109 wakes, $32.09, median $0.16, p90 $0.97. Zaal, skills and continuations: 145 wakes, $53.12, median $0.17, p90 $0.84. Of the peer wakes, 46 used only SendMessage, ListAgents or ToolSearch, or no tool, for $4.17. **No wake was a timer fire.** A sample of the non-peer wake texts showed skills (16), continuations (12) and Zaal's typing, with no loop prompt among them. So in that window the seat ran no loop at all, and nothing swept the lanes from the seat.
- Control for the classifier: its $85.21 total against `zao-spend`'s $90.20 for the same workspace and window. The $5 gap fits the script skipping subagent files.

### Reproduce

```bash
python3 -I research/agents/2721-best-seat-loop-away-mode/wakecost.py \
  ~/.claude/projects/-Users-zaalpanthaki-orca-workspaces-ZAO-OS-V1-orchestrator2
zao-spend --hours 24 --by-lane | grep orchestrator2      # the control
orca terminal list --json                                 # pane state, no model
```

## Next Actions

| # | Action | Owner | Type | Done when |
|---|---|---|---|---|
| 1 | Add a `--panes` source to `seat-digest` (extend; no new tool). It reads `orca terminal list --json`, prints DEAD-MIDTURN only after the same tail on two reads, and has a red control on a fixture tail with `API Error` | a dotfiles lane the seat names | zaal-dotfiles PR | merged, with the control red without the change |
| 2 | Open the PR for branch `fix/lane-away-mode-sweep-author-gate` (`b18650c`), which has no PR as of 2026-10-29 11:2x EDT | that branch's author lane, via the seat | PR | PR open, ready, author lane named |
| 3 | Add Part 4's exit conditions, tick cap, off-the-hour return cron and two-read rule to the messenger skill's sweep section (on the same branch, or a follow-up if it has merged) | same lane as row 2 | skill edit | in the skill on dotfiles main |
| 4 | Start each away window in a fresh messenger session booted from its status file | messenger | habit | first away window after row 3 merges |
| 5 | Check that the terminal titled "Read messenger handoff" is the messenger, and why it had 324 minutes of no output during the day | seat | check | one line in the seat status |
| 6 | Re-measure per-tick cost after the first away window (`wakecost.py` on the messenger's transcripts) and correct Decision 7 here | research lane | doc update | `last-validated` moved, figures replaced |

## Sources

Method is stated per source. Quotes are from raw text (curl of the `.md` docs, or curl plus an HTML strip, or the HN Algolia JSON API), never from a WebFetch summary.

1. [Claude Code docs: Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks.md) [FULL]: curl, 200, 20,109 bytes (doc 2647 read a 6,289-byte version)
2. [Claude Code docs: Tools reference, Monitor tool section](https://code.claude.com/docs/en/tools-reference.md) [FULL for the Monitor section; the rest not read]: curl, 200
3. [Claude Code docs: Manage costs](https://code.claude.com/docs/en/costs.md) [PARTIAL: read by keyword (cache, idle, clear, background)]: curl, 200
4. [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), Nov 26, 2025 [FULL]: curl plus HTML strip, 13,845 characters of text
5. [Anthropic: Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), Mar 24, 2026 [PARTIAL: read by keyword across the context-reset, evaluator and cost sections; the appendix not read]: curl plus HTML strip
6. [Anthropic: Scaling Managed Agents with stable interfaces](https://www.anthropic.com/engineering/managed-agents), Apr 8, 2026 [PARTIAL: the first three chapters read; "Many brains, many hands" not read]: curl plus HTML strip
7. [HN: How I manage persistent Claude Code loops: Spool](https://news.ycombinator.com/item?id=50048193), 2026-10-11 [FULL, all comments]: Algolia items API
8. HN Algolia search API, three queries, stories since 2026-01-01 [FULL]: "claude code loop", "long-running agent harness", "agent orchestrator loop"
9. The `ScheduleWakeup` tool description as loaded in this session, 2026-10-29 [FULL]
10. Local, read-only, 2026-10-29: `zao-spend --hours 24 --by-lane`; `wakecost.py` on the seat transcripts; `orca terminal list --json`; `seat-digest --help`; `command -v` for each tool [FULL]
11. ZAOOS on origin/main: `.claude/rules/agent-loops.md`, `agent-spend.md`, `loop-evals.md`, `liveness-probe-guard.md`, `lane-autonomy.md`; docs 2640 and 2647 [FULL]
12. zaal-dotfiles: `claude/skills/messenger/SKILL.md` on main [FULL]; branch `fix/lane-away-mode-sweep-author-gate` at `b18650c`, diff against main for the messenger skill and the global fragment [FULL]
13. [r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/) [FAILED: WebSearch refused reddit.com ("not accessible to our user agent"); not retried with the keyless fetcher]

Credit: the away-mode sweep rules and the 2026-10-29 idle measurement are from the author of the dotfiles branch above; the cost-per-wake method is doc 2647's.
