---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: 2640, 2641, 2636, 2586, 2645
original-query: "hows our loop right now for orcestratiosn can u /zao-research loops please and the skill and how to make more effective loops"
tier: STANDARD
---

# 2647 - The seat loop, measured per wake: what a tick costs, what wakes it, and a cheaper shape

> **Goal:** Measure what the orchestrator seat's loop costs per wake, split it by
> what woke the seat, and say which parts are scripts and which need judgment.
> Read the official `/loop` docs, then propose what the seat reads, what wakes it,
> when it stops, and what that should cost per day.
>
> [Doc 2640](../2640-orchestrator-loop-improvements/) covers the loop's failures and
> [doc 2641](../2641-orchestrator-seat-measured-dispatch/) covers dispatch. This doc
> is about cost and wake sources only.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The seat cost about $761 in the 24h window, not $1,425.** Fix `zao-spend` so it counts each API message once. | Claude Code writes one transcript line per content block, and each line repeats the same `usage`. In the seat transcript, 805 of 1,829 usage lines are repeats of a message id already seen, and **0 of the 805 differ**. `zao-spend` sums every line, so it reported $1,424.74 where the deduplicated figure is $760.97. Its "24 sessions" is 1 session plus 23 subagent files. |
| 2 | **The cost is context size, not the heartbeat.** 82% of the seat's spend is cache reads. | The median call re-reads **437k cached tokens** (max 840k), which is about $0.66 per call at Opus cache-read rates before any work starts. Shares: cache reads $621.83 (81.7%), cache writes $95.62 (12.6%), output $43.47 (5.7%), input $0.05. |
| 3 | **The second cost is relay wakes.** Move FYI lane reports off SendMessage and into a mailbox the seat reads in batches. | 258 wakes came from peer messages ($356). **189 of them ($233, 31% of the seat's spend) used no tool except SendMessage, ListAgents or ToolSearch**: acknowledgements and relays. Only 69 peer wakes did real work (Bash, Agent, Write; $123). The top sender was the PR lead (59 messages). |
| 4 | **The timer heartbeat is not the problem.** Keep a long fallback, and do not tune it further. | 34 loop-fired wakes cost $63.69 in total, a median of **$0.46** and 1 call each. That is 8% of the seat's spend. |
| 5 | **Subagents are not the problem.** | 23 subagent transcripts cost $13.90, 1.8% of the seat's total. |
| 6 | **Use a Monitor on a diff script for change-driven wakes.** Do not poll. | The official docs: Monitor "runs a background script and streams each output line back, which avoids polling altogether and is often more token-efficient and responsive than re-running a prompt on an interval." |
| 7 | **Start a fresh seat session at the rhythm's two boundaries (noon and 3 PM), booted from the queue page.** | It bounds the 437k context. Anthropic's cost page: "Stale context wastes tokens on every subsequent message." The queue page already carries the seat's state (`session-boundaries.md`: the artifact carries the state). |

## Part 1. What a seat tick costs (measured 2026-10-08)

**Window and method.** The 24 hours since 2026-10-07 11:06 local, the same window
`zao-spend --by-lane` printed. The seat transcript is
`~/.claude/projects/-Users-zaalpanthaki-orca-workspaces-ZAO-OS-V1-orchestrator/233d3093-...jsonl`.

- **Prices:** `zao-spend`'s own hardcoded list rates (Opus 15/75/18.75/1.50 and
  Fable 3/15/3.75/0.30 per Mtok), so the figures compare with its output.
- **Deduplication:** by `message.id`.
- **Wakes:** a "wake" is a user-side entry that is not a tool result. Each wake is
  classed by its text: a cross-session message, a loop fire, a notice, or other.
  "Other" is mostly Zaal typing in the pane, skill expansions and compaction.

Model calls: 805 on Opus 5.5 and 216 on Fable 5.1, 1,021 billed in all (plus 9 synthetic).

| Woken by | Wakes | Cost | Median $ per wake | Median calls per wake |
|---|---|---|---|---|
| Peer messages (lanes, PR lead) | 257 | $355.94 | $1.19 | 2 |
| Zaal and other (typing, skills, compaction) | 150 | $336.67 | $1.39 | 2 |
| Loop fire (ScheduleWakeup) | 34 | $63.69 | $0.46 | 1 |
| Notices | 4 | $4.66 | $1.34 | 2 |
| **All** | **445** | **$760.97** | | |

The peer-wake count is 257 in the table and 258 in the relay split, because the two
scripts ran a few minutes apart. Both are from the same transcript.

**Peer wakes by what the seat did:**

| Seat's response | Wakes | Cost |
|---|---|---|
| No tool at all | 79 | $53.25 |
| Messaging tools only, the 79 above included (relay or ack) | 189 | $233.32 |
| Real work (Bash, Agent, Write, ...) | 69 | $123.12 |

**Who sends them:**

| Sender | Messages |
|---|---|
| zaal-dotfiles-fc | 59 |
| dreamnet-54 | 37 |
| zoe-15 | 27 |
| skills-73 | 22 |
| north-creek-fe | 18 |
| zaoos-35 | 17 |
| zaostock-5e | 14 |
| wavewarz-a4 | 13 |
| repo-refresh-8a | 10 |
| iman-desk-9c | 8 |

Tool calls the seat made in the window: SendMessage 441, Bash 311, Agent 23,
ScheduleWakeup 21, AskUserQuestion 14, ListAgents 9.

**What this means.** Every call pays to re-read the whole conversation. With 437k
tokens in context, even a one-line "received, thanks" costs about $1.20. Short
wakes are not cheap in a long session.

### The meter itself was wrong

`zao-spend` (zaal-dotfiles `bin/zao-spend`, the `scan()` loop) adds up `usage` from
every JSONL line and never deduplicates by message id. On the seat this
overcounted by **1.87x**. The ratio elsewhere depends on how many content blocks
each message has, and **was not measured for other lanes**.

`agent-spend.md`'s "cost = turns x ~$1.01" was measured with this same tool on
2026-08-10. Its dollar totals are probably inflated by the same mechanism. Its main
finding, that cost per turn is flat over a long session, is a ratio, so it may still
hold. Both are UNVERIFIED until it is re-measured with the fix.

## Part 2. Script or judgment, per step of a tick

| Step | Same judgment every time? | Belongs in |
|---|---|---|
| Diff the queue page against the last tick | yes | script |
| PR state for tracked PRs (open, CLEAN, merged, CI) | yes | script (`gh pr view --json`) |
| Parse a lane's Condition / Actions / Needs report into a queue row | mostly yes: the format is fixed | script, with the free text kept |
| "Has anything changed since I last looked?" | yes | script; this is the whole relay-wake cost |
| Ack a lane's FYI ("received") | yes | nothing: drop it |
| Rank the queue | rule plus judgment (seat item 6; doc 2645's rubric trial) | script proposes, seat decides |
| Route a ruling to a lane with a written scope | judgment | seat |
| Decide whether a lane's report needs Zaal (the five gates) | judgment | seat |
| Write the one table Zaal reads | rendering is a script; the content is judgment | both |

`code-over-inference.md`: "Same judgment every time -> it is a SCRIPT."

## Part 3. The /loop skill and the wake tools, from the official text

From `code.claude.com/docs/en/scheduled-tasks.md`, raw, fetched 2026-10-08:

- `/loop` is a bundled skill. The interval and the prompt are optional: "Interval
  only, or nothing ... The built-in maintenance prompt runs, or your `loop.md` if
  one exists".
- Dynamic mode: "After each iteration it picks a delay between one minute and one
  hour based on what it observed: short waits while a build is finishing or a PR is
  active, longer waits when nothing is pending."
- Monitor instead of polling: "Monitor runs a background script and streams each
  output line back, which avoids polling altogether and is often more
  token-efficient and responsive than re-running a prompt on an interval."
- "Tasks are session-scoped". For pushing events in rather than polling, the page
  points to Channels.

The `ScheduleWakeup` tool description, as loaded in this session on 2026-10-08:

- The delay is "Clamped to [60, 3600] by the runtime".
- "Consecutive `noop: true` ticks are collapsed in the user's terminal view and
  tracked as a streak".
- "Do NOT schedule a short-interval wakeup to poll for background work you started -
  when harness-tracked work finishes, you are re-invoked automatically".
- For a fallback heartbeat: "1200s+, so quiet wakeups stay rare".
- The prompt cache TTL is one hour, so "every allowed delay ... wakes up with your
  conversation context still cached".

That last point matters here. A wake within the hour is cheap to resume, but it
still pays the full cache-read cost of the context. The TTL saves the cache rebuild,
not the read.

From `code.claude.com/docs/en/tools-reference.md` (Monitor section): Monitor "lets
Claude watch something in the background and react when it changes, without pausing
the conversation". The listed uses include "Poll a PR or CI job and report when its
status changes" and "Watch a directory for file changes".

From `code.claude.com/docs/en/channels.md`: "A channel is an MCP server that pushes
events into your running Claude Code session". It is in research preview, needs Bun,
and ships Telegram, Discord and iMessage plugins. Installing a channel plugin is a
settings change, so it is Zaal's call. It is noted here only because Telegram is
already ZOE's surface.

From `code.claude.com/docs/en/costs.md`: "Token costs scale with context size: the
more context Claude processes, the more tokens you use", and "Clear between tasks:
Use `/clear` to start fresh when switching to unrelated work. Stale context wastes
tokens on every subsequent message."

## Part 4. What others do (thin, stated as thin)

- **Anthropic, "Effective harnesses for long-running agents"** (raw, 2026-10-08):
  agents "must work in discrete sessions, and each new session begins with no memory
  of what came before". The fix that worked was "a way for agents to quickly
  understand the state of work when starting with a fresh context window, which is
  accomplished with the claude-progress.txt file alongside the git history". The
  seat's queue page is that file. Decision 7 uses it the same way.
- **Community.** The HN search (Algolia API, stories since 2025-07-01) found no
  discussion of `/loop` or of event-driven seats with more than 7 points ("Why Claude
  Code's Agent Loop Is over 1,400 Lines", 7 points; "What Claude Code Orchestrator
  Loops Look Like in Practice", 2 points, 0 comments). The r/ClaudeCode search
  FAILED: `zao-fetch-reddit.sh` has no OAuth credentials on this Mac. There is no
  community consensus to cite, so none is claimed.

## Part 5. The proposal

**What wakes the seat:**

1. **Zaal typing.** Unchanged.
2. **A Monitor on `seat-digest`**: a small read-only script, to be written, that
   prints one line only when something changed. Changes it watches:
   - the queue page in the vault;
   - the state of each tracked PR;
   - a new entry in the lane mailbox.

   No line, no wake. This replaces the "is anything new?" relay.
3. **Peer SendMessage only for things that need the seat now:** a gate, a blocker,
   or a "needs you". Everything else goes in the mailbox:
   - a lane's routine "done, PR head X" goes there instead;
   - the PR lead's merge notices go there too.

   The mailbox can be `orca orchestration send` / `inbox`, which Orca already ships,
   or one append-only vault file.
4. **A ScheduleWakeup fallback at 3600s** in case the Monitor dies. With two quiet
   fallbacks in a row, it stops (`agent-spend.md`).

**What the seat reads each wake:** the digest line or lines that woke it, and nothing
else, until a line needs judgment.

**When it stops:**
- At the two boundaries, noon and 3 PM, the seat writes the queue page and ends its
  session. A new seat session boots from the page.
- Overnight it is one session, slots 1-5.

**Expected $ per day.** These are predictions, not measurements, and each rests on
one stated assumption:

| Change | Rests on | Effect on $760.97 |
|---|---|---|
| Half the 189 relay wakes become mailbox lines | lanes follow the "SendMessage only for now-items" norm | about -$117 |
| Median context drops from 437k to about 200k via the two boundary restarts | a fresh seat boots in well under 200k | cache reads (82%) fall by about half: about -$260 on the remainder |
| Monitor replaces the timer heartbeat | the digest is quiet most hours | about -$40 |

**Projected: about $340 to $400 a day, against $761 measured.** That is a forecast.
Re-measure with the fixed `zao-spend` one full day after the change.

**What this does not settle:**
- No settings or hook change is proposed. Monitor and `/loop` need none.
- An auto-compact window setting, or installing a channel plugin, would be a
  settings change, and that is Zaal's.
- Changing how lanes report is a rule change for the seat to adopt or decline.

## Also See

- [Doc 2640](../2640-orchestrator-loop-improvements/) - nine loop failures and ranked fixes
- [Doc 2641](../2641-orchestrator-seat-measured-dispatch/) - the seat as dispatcher
- [Doc 2636](../2636-agentic-organization-day-measured/) - one day measured
- [Doc 2645](../2645-agentic-system-review/) - tool split and the rubric-ranking trial
- `.claude/rules/agent-spend.md`, `code-over-inference.md`, `session-boundaries.md`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Fix `zao-spend` to deduplicate usage by `message.id`, add a test with a two-block message, and re-print the 24h by-lane table. Shipped = merged zaal-dotfiles PR with before and after figures. | zaal-dotfiles-fc | PR | 2026-10-09 |
| Re-measure `agent-spend.md`'s per-turn figure with the fixed tool and correct the rule if it moved | zaal-dotfiles-fc | PR | 2026-10-10 |
| Adopt or decline the reporting norm: SendMessage the seat only for gates, blockers and Needs; everything else to the mailbox | seat | Decision | 2026-10-09 |
| Write `seat-digest`, read-only and git-tracked, with a red control (one fake change must print one line). Shipped = merged PR. | zaoos-35 (Claude), if the seat adopts it | PR | 2026-10-10 |
| Run the seat for one day with the Monitor plus the boundary restarts, then re-measure $/day | seat | Trial | 2026-10-11 |

## Sources

Quotes come from raw text (curl of the `.md` docs, or curl plus an HTML strip) or
from local measurement. None comes from a WebFetch summary.

- [code.claude.com/docs/en/scheduled-tasks.md](https://code.claude.com/docs/en/scheduled-tasks.md) - curl, 200, 6,289 bytes **[PARTIAL]**: the file ends after the dynamic-interval section, so the jitter, expiry and maintenance-prompt sections were not read
- [code.claude.com/docs/en/tools-reference.md](https://code.claude.com/docs/en/tools-reference.md) - curl **[FULL]** (Monitor section)
- [code.claude.com/docs/en/channels.md](https://code.claude.com/docs/en/channels.md) - curl **[FULL]**
- [code.claude.com/docs/en/costs.md](https://code.claude.com/docs/en/costs.md) - curl **[FULL]**
- [Anthropic, Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - curl plus strip **[FULL]**
- HN Algolia search API, three queries, 2026-10-08 **[FULL]** (results listed in Part 4)
- r/ClaudeCode search via `zao-fetch-reddit.sh` **[FAILED]**: "No OAuth credentials"
- `ScheduleWakeup` tool description as loaded in this session **[FULL]**
- Seat transcript and its 23 subagent transcripts, parsed read-only by a local script, 2026-10-08 **[FULL]**. `zao-spend --hours 24 --by-lane --no-output` output, and its source (`scan()`), read 2026-10-08 **[FULL]**
