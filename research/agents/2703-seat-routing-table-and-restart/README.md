---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "agents/2641-orchestrator-seat-measured-dispatch, agents/2647-seat-loop-effectiveness, agents/2640-orchestrator-loop-improvements, agents/2586-orchestrator-seat-outside-view, agents/2178-agent-harness-orchestrator-workers"
original-query: "thats the whole point of the orchestrator right lets do some research (Zaal, about 06:40 EDT 2026-10-23, relayed by the seat: how the orchestrator should route every ask to the best terminal); then 'lets keep doing research on the agentic process' (relayed: widen to helper handoffs, the restart that renamed every session and reopened closed lanes, and the merge watcher dying on restart)"
tier: STANDARD
---

# 2703 - Route first: a routing table for the seat, measured against one day of its work and one restart

> **Goal:** Give the orchestrator seat a routing table (kind of ask -> the helper or lane that owns it) and one mechanism that makes routing the default, measured against what the seat actually did on 22 to 23 October 2026; and explain, from measurements, why the 06:26 restart reopened closed lanes, renamed every session and dropped the merge watcher. Nothing is built here.

This extends [doc 2641](../2641-orchestrator-seat-measured-dispatch/) (the seat as a dispatcher; it proposed the leads under the seat that now exist as helpers) and [doc 2647](../2647-seat-loop-effectiveness/) (what a seat wake costs). It does not repeat them.

## Key Decisions

| # | Decision | Why (measured or fetched) |
|---|---|---|
| 1 | **USE the routing table below as step 0 of the seat skill: before any tool call on an ask, the seat names its owner and sends it there.** The seat's own work is classifying, dispatching with a brief, and relaying the answer. | In the 24 hours to 06:40 EDT 23 Oct the seat had 228 wakes costing $594.74 (usage deduplicated by message id). **167 wakes ($527.74, 89 percent) did inline work**; 18 were routing only ($34.61). It ran Bash 424 times and Agent 11 times. No routing table exists today in `handoffs/LANE-POLICY.md`, the seat brief `handoffs/orchestrator2.md` or `claude/skills/seat/SKILL.md`. |
| 2 | **USE Anthropic's delegation brief shape for every dispatch: objective, output format, tools and sources, task boundary.** | Anthropic: "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries. Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information." Three duplicate dispatches on 22 Oct are in memory `feedback_seat_dispatch_searched_line`. |
| 3 | **USE a measurement, not a hook, as the check: re-run the wake split weekly; the target is under half of seat cost in inline wakes.** SKIP a PreToolUse hook that refuses Bash in the seat. | 90 of the 424 Bash calls were `zao-status-append`, the seat's own record, which it must keep writing. A hook would fire on the normal case (`noisy-signal-guard.md`). |
| 4 | **Closing a lane is two steps, both required: close the terminal AND set the worktree to `completed` with a comment.** Extend `bin/orca-board`'s sync (or the close step) to do the second; do not build a new tool. | After the 06:26:40 reboot, `claude` was running in **23 of 25 `in-progress` worktrees, 0 of 50 `completed`, 0 of 12 `todo`**. The 8 lanes closed at 06:25 and dreamnet-research (closed 21:48 on 22 Oct) were closed with `orca terminal close` only, stayed `in-progress`, and Orca relaunched them. `LANE-POLICY.md` already says "closing moves the workspace to completed with a comment". `orca-board` sets `completed` only after "no session, idle 30h". |
| 5 | **Never store a session name; resolve the role at send time.** | Every session got a new suffix on restart, including ones resumed from the same transcript: the seat ran `claude --resume 4fd172f4-...` and came back as `orchestrator2-ee` (it was `orchestrator2-5a`). A message to `messenger-e0` failed at 10:40Z with "No agent named 'messenger-e0' is reachable. Did you mean: messenger-69?". |
| 6 | **Run the tracked merge watcher and re-arm it from the boot check, not by hand.** | The watcher died with the reboot. A `merge-watch.sh` process reappeared at 06:36:33, ten minutes after boot, still the untracked `~/.zao/merge/merge-watch.sh` (rewritten 06:36), although dotfiles #682 (`bin/zao-merge-watch`) is merged. The boot check (dotfiles #688, ZAOOS #4132) is open. |

## The routing table

Owners are the helpers' own Mission lines on vault origin/main (`handoffs/<helper>.md`), read 2026-10-23. The right-hand column is what the seat itself does.

| Kind of ask | Owner | Source of ownership | The seat's part |
|---|---|---|---|
| Lane check-in, status table, which lanes are idle, reopen or next item for a lane | **messenger** | `handoffs/messenger.md` Mission: "keeps every numbered lane moving"; memory `feedback_offload_to_best_terminal` (Zaal 23 Oct: "for this it would be messagere") | Forward the ask; relay the table |
| A question that needs Zaal's answer | **grill-sweep** | `handoffs/grill-sweep.md`: "The only place Zaal answers questions"; `LANE-POLICY.md` "Where questions go" | Write a QUESTIONS FOR ZAAL block; never ask in the seat pane |
| Merge a CLEAN, green PR; Zaal's merge list; the 10:30 block | **merge** | `handoffs/merge.md`: "Merges on green" | Send the pin; never merge (memory `feedback_author_never_merges_own_pr`) |
| Review a PR at a head | **evaluator** | `handoffs/evaluator.md`: "Independent, read-only verdicts" | Send repo, PR, head and checks |
| Board cards: close with evidence, type, route; small fixes | **board-burn** | `handoffs/board-burn.md` | Forward the card ids |
| A lane's brief, memory or boot context is weak | **lane-quality** | `handoffs/lane-quality.md` | Forward the lane name and the gap |
| A rule, ruling or measured fix that must land in a skill, brief, the vault or a small tool, as a PR | **quidli** | vault `handoffs/status/quidli.md` line 3: "takes research and audit jobs from orchestrator2, PR-only" (the "rules into files" scope is this doc's description of its queue on 22 to 23 Oct, not a quoted record) | Forward the ruling with its stamped record |
| Work inside a project (finance, cards, wavewarz, newsletter, ZAOstock and the rest) | **the numbered lane that owns the project** | `LANE-POLICY.md` "Slots in his focus order" | Through the messenger, which hands the lane its next item |
| A process failure | **the seat** files it with `/agentic-issue`, then dispatches the fix to the owner above | seat brief `handoffs/orchestrator2.md`, "Main job" | The one thing the seat does itself, besides deciding |
| Zaal talking (an idea, a goal, a priority) | **the seat** | `LANE-POLICY.md` "Three surfaces only" | Record it (`zao-status-append`), then route each piece by the rows above |

Rows not covered by any helper today: health readings (load, swap, disk), which the seat read about 30 times in the window (`date`, `uptime`, `df`); and opening or relaunching lanes, which it did with about 64 Orca calls and loops. Both are scripts, not judgment (`code-over-inference.md`): the first is `zao-ground-hold` or a beat file, the second is `zao-lane-launch`.

## Part 1. What the seat did for 24 hours (measured)

**Method.** Transcript `orchestrator2/4fd172f4-6772-407c-9810-aa3aeb9e6f71.jsonl` (333 MB), window 2026-10-22 10:40Z to 2026-10-23 10:40Z. A wake is a user-side entry that is not a tool result (doc 2647's definition). Each wake is classed by the tools the seat used before the next wake. Usage deduplicated by `message.id` (doc 2647 decision 1), priced at `zao-spend`'s list rates.

| What the seat did in the wake | Wakes | Cost | Share of cost |
|---|---|---|---|
| Inline work (any tool besides SendMessage, ListAgents, ToolSearch, Agent) | 167 | $527.74 | 88.7% |
| Routing only (SendMessage, ListAgents, ToolSearch) | 18 | $34.61 | 5.8% |
| No tool | 43 | $32.40 | 5.4% |
| **All** | **228** | **$594.74** | |

Split by what woke it: Zaal or other, 91 inline ($326), 27 no tool, 4 routing; peer messages, 76 inline ($202), 10 no tool, 14 routing; notices, 6 no tool.

**What the 424 Bash calls ran**, by first command:

| Command | Calls | What it is |
|---|---|---|
| `zao-status-append` | 90 | the seat's own record |
| `orca` (42) plus `for` loops over panes (22) | 64 | opening, reading and relaunching lanes |
| `git fetch` / `git show` / `git pull` | 60 | reading the vault and repos |
| `date`, `uptime`, `df` | 30 | health readings |
| `gh` (api, issue, pr) | 26 | PR and issue state |
| `grep`, `ls` | 26 | searching |
| `zao-vault-commit`, `zao-tracker`, other | the rest | |

Doc 2641 measured a seat holding "roughly ten lanes plus Zaal", over the incident-command span of three to seven. The helpers it proposed now exist (messenger, grill-sweep, merge, evaluator, board-burn, lane-quality, quidli), yet the seat still did 89 percent of its spend as inline work. **The structure is in place; the default is not.**

## Part 2. What the fetched sources say

- **Routing as a pattern.** "Routing classifies an input and directs it to a specialized followup task. This workflow allows for separation of concerns, and building more specialized prompts... Routing works well for complex tasks where there are distinct categories that are better handled separately, and where classification can be handled accurately" (Anthropic, Building effective agents). The asks the seat receives fall into the ten rows above, each with an owner whose brief exists.
- **Orchestrator-workers.** "a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results... well-suited for complex tasks where you can't predict the subtasks needed" (same). The seat is the orchestrator only when an ask does not match a row.
- **Delegation brief.** "Teach the orchestrator how to delegate... Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries" (Anthropic, multi-agent research system).
- **Effort scaling.** "Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons might need 2-4 subagents with 10-15 calls each, and complex research might use more than 10 subagents" (same). The seat's inline wakes ran many fact-finding calls itself.
- **Cost.** "agents typically use about 4x more tokens than chat interactions, and multi-agent systems use about 15x more tokens than chats" (same). Doc 2647 found the seat's cost is context size; every inline call re-reads it.
- **Description-based routing in Claude Code.** "When Claude encounters a task that matches a subagent's description, it delegates to that subagent" (Claude Code docs, sub-agents), with descriptions such as "Expert code reviewer. Use proactively after code changes." The routing table is the same idea written for helper sessions instead of subagents.
- **Community.** On the 763-point HN thread for "Building effective agents", one top-level comment on running agents in production: "Your processes need to run for months, be upgraded and restarted" (adeptima, 2024-12-21), naming durable execution as a gap; another: "Routing should specify which agent (or agents, in parallel) to run next, via that state" (tonyhb). Part 3 is the restart case.

## Part 3. The 06:26 restart, measured

**Timeline (Fri 23 Oct, EDT).** 05:03 the messenger's armed morning reopen started 8 lanes from their RESUME entries (messenger status). 06:22 swap 9.78 of 10.24 GB (seat status). 06:25 the messenger closed 8 lanes for memory (swap 96 percent): cards, wavewarz, hypersnap, zao-agent, newsletter, bandzbuilds, site-cutover, bookmarks. **06:26:40 the Mac rebooted** (`sysctl kern.boottime`). 06:31:10 Orca started. 06:31 to 06:37, 25 `claude` processes started.

**Why closed lanes came back.** Orca relaunched each restored terminal's agent, as `claude --resume <session-id>` (the seat, quidli and two others) or `claude --continue`. Which worktrees got an agent follows Orca's own workspace status exactly:

| Orca `workspaceStatus` | Worktrees | `claude` running after the reboot |
|---|---|---|
| in-progress | 25 | 23 |
| completed | 50 | 0 |
| todo | 12 | 0 |

(Method: `orca worktree list --json` against each `claude` process's working directory from `lsof -d cwd`; 25 live cwds, every one inside a worktree. The table counts linked worktrees only; the other 2 processes run in main checkouts, downeast-zao and wavewarz-protocol, both also `in-progress`, so all 25 processes are in `in-progress` workspaces.)

All 9 reopened "closed" lanes were `in-progress` with an empty comment. The seat closes lanes with `orca terminal close` (12 calls since 20:00 on 22 Oct), which ends the terminal and leaves the workspace status alone. Lanes marked `completed` with a comment (for example cpu-trim, "Done 19 Oct: 5 CPU PRs merged; terminal closed") stayed closed. The rule that would have prevented it is already written: `LANE-POLICY.md`, "closing moves the workspace to completed with a comment" (19 Oct, memory `feedback_orca_sidebar_format`). `bin/orca-board`'s sync sets `completed` only for "no session, idle 30h", so a lane closed one minute before a restart is still `in-progress`.

**Why every session was renamed.** The suffix belongs to the running process, not the transcript: the seat's process ran `claude --resume 4fd172f4-6772-407c-9810-aa3aeb9e6f71`, the same transcript as before, and is now `orchestrator2-ee`. All helpers changed (messenger-e0 to messenger-69, evaluator-a3 to evaluator-4b, merge-f9 to merge-b0, quidli-97 to quidli-22). Any message addressed to a stored name fails after a restart.

**Why the merge watcher died.** It is a plain background process with no supervisor; a reboot ends it. The process running now started at 06:36:33 from the untracked `~/.zao/merge/merge-watch.sh` (file rewritten 06:36), not the tracked `bin/zao-merge-watch` from dotfiles #682, which is merged. That is `vanishing-dependencies.md` rule 6, "Merged is not live". The merge lane's status file has no entry for the death or the re-arm between 05:00 and 06:59. The re-arm path the ruling chose is the boot check (dotfiles #688, ZAOOS #4132), still open, so for now a reboot leaves PRs unwatched until a session notices.

## Comparison: three mechanisms for "route by default"

| Option | What it is | Catches | Cost | Verdict |
|---|---|---|---|---|
| A. Routing table as seat-skill step 0 | The table above, read before any tool call; dispatch uses the four-part brief | every ask that matches a row | one skill edit; inference each ask | **USE** |
| B. PreToolUse hook refusing Bash in the seat | A hook allowlisting only routing tools and `zao-status-append` | all inline work | blocks health reads and record-keeping too; a guard that fires on the normal case (`noisy-signal-guard.md`); Zaal's merge (hook) | SKIP until A is measured |
| C. Move the recurring inline work into helpers and scripts | Health readings to a beat or `zao-ground-hold`; lane opens to `zao-lane-launch` via the messenger | the non-judgment share of the 424 Bash calls | a few routing lines; tools exist | **USE with A** |

A is the mechanism; C removes the work that A would otherwise route one call at a time. The check for both is the Part 1 measurement re-run weekly (decision 3).

## Also See

- [Doc 2641](../2641-orchestrator-seat-measured-dispatch/) - the seat as a dispatcher; span of control; leads under the seat
- [Doc 2647](../2647-seat-loop-effectiveness/) - what a seat wake costs; relay wakes
- [Doc 2640](../2640-orchestrator-loop-improvements/) - the loop's failure shapes
- [Doc 2586](../2586-orchestrator-seat-outside-view/) - the seat routes, it does not build
- [Doc 2178](../2178-agent-harness-orchestrator-workers/) - orchestrator-workers harness
- Codebase: `.claude/rules/code-over-inference.md`, `.claude/rules/vanishing-dependencies.md` rules 6 and 7, `.claude/rules/agent-loops.md` rule 39; dotfiles `bin/orca-board` (sync to `--workspace-status`), `bin/zao-lane-launch`, `claude/skills/seat/SKILL.md`; vault `handoffs/LANE-POLICY.md`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add the routing table and the four-part dispatch brief to the seat skill as step 0 | quidli, after dotfiles #687 merges (it touches the seat skill) | dotfiles PR | after #687 |
| Lane close = `orca terminal close` plus `orca worktree set --workspace-status completed --comment "<why>"`; extend `bin/orca-board` sync or the close step, with a test that a closed lane is not relaunched | quidli or lane-quality, seat picks | dotfiles PR | 2026-10-24 |
| Messages address roles, not stored names: resolve at send time (dotfiles #689 `zao-lane-launch --who`) | lane-quality (#689) | merge of an open PR | when #689 is CLEAN |
| Run `bin/zao-merge-watch` instead of the untracked copy, re-armed by the boot check | merge lane; boot check #688 is Zaal's (Reserved) | config plus Zaal merge | after #688 |
| Re-run the Part 1 wake split on the seat transcript; target under half of cost in inline wakes | quidli | measurement, vault note | 2026-10-30 |

## Sources

1. Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) [FULL: curl, HTML stripped, 19,130 chars, read 2026-10-23; quoted from disk]
2. Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) [FULL: curl, HTML stripped, 26,839 chars, read 2026-10-23]
3. Claude Code docs, [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents) [FULL: curl, HTML stripped, read 2026-10-23; the delegation and description passages]
4. GitHub, [anthropic-cookbook orchestrator_workers.ipynb](https://github.com/anthropics/anthropic-cookbook/blob/main/patterns/agents/orchestrator_workers.ipynb) [PARTIAL: raw notebook fetched (HTTP 200, 30,098 bytes); only the introduction and the `FlexibleOrchestrator` class name were read, the code was not used]
5. Hacker News, [Building Effective "Agents"](https://news.ycombinator.com/item?id=42470541) (763 points) [PARTIAL: Algolia items API, the first 40 top-level comments filtered for orchestration, routing and simplicity; two quoted]
6. Seat transcript `orchestrator2/4fd172f4-6772-407c-9810-aa3aeb9e6f71.jsonl`, 2026-10-22 10:40Z to 2026-10-23 10:40Z [FULL: local read-only parse; script in Method]
7. Vault origin/main 2026-10-23: `handoffs/LANE-POLICY.md`, `handoffs/orchestrator2.md`, the helper briefs, `handoffs/status/messenger.md` (05:03, 06:25), `handoffs/status/orchestrator2.md` (05:04, 06:22, 06:25) [FULL for what is cited]
8. This Mac at 06:40 EDT 2026-10-23: `sysctl kern.boottime`, `ps -o lstart,command`, `lsof -d cwd`, `orca worktree list --json`, `ls -la ~/.zao/merge/` [FULL]
