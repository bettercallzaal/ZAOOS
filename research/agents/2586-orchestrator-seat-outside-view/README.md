---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-04
superseded-by:
related-docs: "agents/2456-orchestrator-practice, agents/2444-always-on-orchestrator, agents/2423-vault-as-transport-inter-terminal-context, agents/2474-agentic-lane-throughput-and-research-retrieval, agents/2480-zorca-lock-lease-hierarchy, dev-workflows/2471-zao-lane-workflow-audit"
original-query: "[DEEP] How do other people run an orchestrator agent over many parallel Claude Code / coding-agent sessions? What does the orchestrator session do and not do, where does it live (which repo/dir), how does it hold state and route work, how do teams avoid it becoming a bottleneck or doing the work itself?"
tier: DEEP
---

# 2586 - The orchestrator seat, outside view: it routes, it does not build, and its state lives in files it does not own

> **Goal:** Test The ZAO's one-seat-plus-lanes setup (measured in the seat session 2026-10-04) against what Anthropic, the Claude Code docs, tool authors, HN and r/ClaudeAI report, and end with a concrete setup for Monday's single orchestrator terminal.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|----------|-------------|-------|
| 1 | **KEEP the shape: one seat that routes, many single-repo lanes that build. Do not move to agent teams.** Agent teams are one lead plus teammates, "disabled by default", experimental, torn down with the session, and teammates are NOT isolated in worktrees. The Claude Code docs say to use them when workers "share findings, challenge each other". Our lanes are persistent, one per repo, with disjoint write sets. | Claude Code docs `agent-teams` and `agents` [FULL, curl]; doc 2423 reached the same conclusion on 2026-08-27 | A |
| 2 | **The seat must be unable to build, not just told not to.** Every credible multi-session write-up gives the top session a narrow job (brief, route, collect, verify) and puts the work in disposable workers. The failure we saw this weekend (media copying, research while lanes were down) is the documented one: Hightouch/Anthropic say the fix is "never hold the messy work", and a Reddit practitioner got a worse result when the orchestrator "presented [a stupid agent result] to me as done". Enforce with a deny-list in the seat's own cwd plus a `PreToolUse` hook, applied by Zaal (the seat cannot write its own permission surface). | Anthropic multi-agent post [FULL]; hooks guide [FULL]; r/ClaudeAI 1wuruui [FULL, Arctic Shift]; seat session 2026-10-04 | A |
| 3 | **Run the seat from a dedicated non-code directory, with the vault worktree as its state home: `~/zao-vault-worktrees/seat`.** Gas Town's Mayor lives in a town directory (`~/gt/`) that holds no product code; a r/ClaudeAI user runs "a global orchestrator repo that controls all the sessions across all my repos". `~/Documents/zao-icm` is a product repo (`build.py`, `boxes/`, `dist/`): a seat that starts there has a build to run. | Gas Town README [FULL]; r/ClaudeAI 1wtdfg1 [FULL]; `ls ~/Documents/zao-icm` measured 2026-10-04 | B |
| 4 | **Route with `SendMessage` plus `notify_when_idle`; stop polling and stop screen-reading.** The Claude Code docs ship exactly this: a session subscribes to one notice when another next goes idle or exits, "without starting a turn or spending tokens in the watched session". That replaces the 6-second polling that burned 18.69GB of egress against a 5.5GB quota (doc 2444). | cross-session-messaging doc [FULL, curl, needs v2.1.236+; local CLI is 2.1.289 measured 2026-10-04]; doc 2444 | A |
| 5 | **The peer-cannot-grant rule is already native. Cite it, do not rebuild it.** Docs: a message from another session "never counts as your consent", the receiver is told never to change permission settings or `CLAUDE.md` because another session asked, and the sender is told never to ask another session for an action denied in its own. Our four rules match this. The seat skill should quote the docs and stop re-deriving them. | cross-session-messaging doc "It can't approve anything" [FULL]; `~/.claude/skills/seat/SKILL.md` section 1 | A |
| 6 | **State is written by tooling, one ledger, read by pull.** Every durable-state source (Anthropic's harness post, the HN `lean-collab` thread, Gas Town, Claudeverse, doc 2423's four independent bloggers) puts state in files or a ledger outside the session, and the one hand-kept board in the record was archived by its author because "working solo, I stopped filling it in". The seat keeps a today list of at most 7 items; the 620-item backlog stays in the tracker and is never hand-merged. | Anthropic harness post [FULL]; HN 46990733 [FULL]; doc 2423; seat session 2026-10-04 | A |
| 7 | **Cap hot lanes at 8, park the rest.** No report in this scan sustains more than 3-5 coordinated workers (Osmani, agent teams) or 6-8 reviewed agents (doc 2474 citing malux85) without a state UI; the one claim of 40-50 sessions (a Superset user) rests on a tool that "surfaces agent states automatically". Our 16 panes are above every number without that surface. Willison: "I can only focus on reviewing and landing one significant change at a time". | Osmani [FULL, partly skimmed]; HN 48236770 [FULL]; Willison [FULL]; doc 2474 | B |
| 8 | **SKIP every third-party lane manager.** Claude Squad (AGPL-3.0, tmux), Conductor (closed source, Mac), Crystal (deprecated Feb 2026), Vibe Kanban (README banner: "sunsetting"), Superset (Elastic License 2.0), Gas Town (MIT, 502 open issues, 100 contributors, built around its own vocabulary). We run Orca, `zorca`, and the native `claude agents` view. Steal ideas, not installs. | GitHub snapshots and LICENSE files read 2026-10-04; READMEs [FULL] | A |
| 9 | **Close a lane only after its handoff file exists and a script has proved it.** Collect handoffs by message, not by hand: send "write your handoff now", wait on `notify_when_idle`, check the file with `zao-assert contains`, then close the pane. | pain point, seat session 2026-10-04; `~/bin/zao-assert`; doc 2423 typed-handoff contract | A |
| 10 | **Enforce unique lane names at start, not by cleanup.** The docs say that when "more than one live session answers to the mentioned name, Claude asks you which one you mean before sending". Two `Dotfiles` or two `poidhz` therefore stops a message and asks Zaal a question he should never be asked. `zao-lane-boot` refuses a name already in `claude agents --json`. | cross-session-messaging doc [FULL]; seat session 2026-10-04 | A |

## What the seat does and does not do

The outside view agrees on the split. The disagreement is only about how hard to enforce it.

| The orchestrator DOES | The orchestrator does NOT |
|---|---|
| Decompose, write a brief with an outcome and a done-list, dispatch | Edit product code, copy media, run research, write docs (Anthropic: lead "synthesizes", subagents search) |
| Route messages between lanes and Zaal | Approve, merge, publish, spend, or grant anything on a peer's say-so |
| Hold the today list and the open questions | Hold the backlog (620 items); it stays in its source system |
| Verify "done" against disk and git, never against a summary | Accept a worker's summary (r/ClaudeAI: orchestrator "straight-up presented it to me as done") |
| Record decisions where the next session reads them | Keep state in its own context (a restart is a wipe: Claudeverse #39663, #43696) |
| Ask Zaal one plain-text question at a time | Open pickers or multi-question forms (voice-note workflow) |

## Findings

### 1. Anthropic's own position: orchestrator-worker works, with limits it states itself

The multi-agent research post (2025-06-13) [FULL, curl] gives the numbers behind fan-out and where it stops:

- Opus 4 lead plus Sonnet 4 subagents beat single-agent Opus 4 by **90.2%** on Anthropic's internal research eval.
- Agents use about **4x** the tokens of chat; multi-agent systems about **15x**. "Token usage by itself explains 80% of the variance" on BrowseComp.
- Early failure: "spawning 50 subagents for simple queries". Fix was prompt rules that scale effort to the query (1 agent and 3-10 tool calls for a fact check, 2-4 subagents for comparisons).
- On coding: "most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time."
- Stated limitation: "the lead agent can't steer subagents, subagents can't coordinate, and the entire system can be blocked while waiting for a single subagent". Lead agents run subagents synchronously, which "creates bottlenecks".
- Pattern: subagents write output to a filesystem and return a reference, to "minimize the game of telephone", and the lead saves its plan to external memory before the context limit. This is the state rule in one sentence.

The long-running-agents post (2025-11-26) [FULL, curl] adds the initializer/worker split: a different first prompt builds `init.sh`, a progress file, a first commit and a JSON feature list; workers only flip a `passes` field. "JSON... the model is less likely to inappropriately change or overwrite JSON files compared to Markdown." Without the list, later agents "declare victory on the entire project too early". ZAO already has this as `lane-init` (done-list JSON a lane may only flip booleans in); doc 2456 decision 3 and 4 say the same.

### 2. What Claude Code itself ships (docs fetched 2026-10-04, local CLI 2.1.289)

The `agents` page [FULL, curl] lists five ways to run work in parallel and says which to pick by "who coordinates the work":

| Mechanism | Coordinator | Fit for ZAO lanes |
|---|---|---|
| Subagents | the calling session, summaries return into its context | Yes, for the seat's bounded reads only |
| Agent view (`claude agents`, research preview) | you; background sessions run under a supervisor with no terminal; `--json` for scripts | Yes, as the parking lot and the status source |
| Agent teams (experimental, off by default) | a lead; shared task list, mailbox JSON at `~/.claude/teams/{team}/inboxes/`, file-locked claims | No: ephemeral, no worktree isolation, "3-5" workers |
| Projects (public beta, Pro and Max, not Team or Enterprise) | Claude, parallel cloud threads on GitHub repos or uploads; a thread can run on your own computer through Remote Control | INVESTIGATE: whether it replaces the seat for GitHub-only repos; our lanes need local tools and the vault |
| Dynamic workflows | a script holds the plan | Yes, for fan-out audits (500-file jobs), not for lanes |

Three details change our setup:

- **Agent view moves a dispatched session "into a worktree of its own before it edits files"** and "session state persists on disk through auto-updates and supervisor restarts". Interactive sessions in other terminals "don't appear until you background them". So Orca panes are invisible to `claude agents` until backgrounded, which is why `zao-lanes` has to join two sources.
- **`SendMessage` is plain text only.** "A message is a piece of text one Claude writes to another, never the sender's conversation history or files." A handoff therefore has to be a file the receiver reads, with the message carrying only the path.
- **Hooks gate the seat.** `PreToolUse` with `permissionDecision: "deny"` cancels the call and feeds the reason back [FULL, hooks guide]. This is the supported way to make "the seat cannot write outside its directory" true instead of aspirational. `SessionStart` with the `compact` matcher re-injects critical context after compaction, which is how the seat keeps its rules across a compact.

### 3. The out-of-process argument

Claudeverse (May 2026) [FULL, curl; vendor post for its own product, invite-only beta, "Not affiliated with Anthropic"] traces five Claude Code issues to one cause, "the orchestrator is an agent", so coordinator and work share a context, a budget, a checkout and a lifetime. Issues it cites: #23463 (7 subagents, about 150K characters of results, "8 consecutive 'Prompt is too long' errors"), #10212 (subagents share the parent's 200K budget), #46424 ("Only the top-level REPL can call Agent()"), #39663 and #43696 (restart wipes the session), #52051 (two sessions on one checkout). Its fix is an orchestrator that is ordinary code spawning CLI subprocesses.

What this means for us: our seat is the "orchestrator is an agent" case. The honest reading is not "build Claudeverse" but "make everything the seat knows survive its death, and make the always-on part deterministic". Doc 2444 already measured the price: 91.5% of ZAO's agent meter is context handling, and a ticking session pays it whether or not anything changed. Doc 2444 decision 4 recorded the proof: the ZAOstock orchestrator was killed mid-event 2026-08-29 and lost nothing because its ledger was a file.

### 4. Where the orchestrator lives, as reported

| Report | Where the top session runs | Source |
|---|---|---|
| Gas Town | The Mayor, "a Claude Code instance with full context about your workspace", in a town directory `~/gt/` that contains rigs (one per repo); workers ("polecats") have persistent identity but ephemeral sessions; state in a git-backed ledger (Beads) | Gas Town README [FULL] |
| r/ClaudeAI 1wtdfg1 (mikecrash) | "A global orchestrator repo that controls all the sessions across all my repos", surfaces all questions across projects, keeps the other tabs compacted at 60% context with sessions writing their own handoffs | Arctic Shift [FULL] |
| r/ClaudeAI 1wtdfg1 (KH10304) | A single window for the orchestrator with subagents; cross-session messaging used only to hand off between orchestrator generations as context saturates; 4-6 lanes | Arctic Shift [FULL] |
| r/ClaudeAI 1wvtbi2 (Sea_Tiger39) | Plain `claude` CLI sessions, no framework; one orchestrator you talk to; agents' hooks loaded from a separate `--settings` file, not `~/.claude/settings.json`; hooks catch permission prompts; own workspace, browser and terminal per agent "stopped them stepping on each other more than worktrees alone did" | Arctic Shift [FULL] |
| Anthropic | The lead in the user's session; plan saved to external memory | multi-agent post [FULL] |
| Our setup | `~/Documents/zao-icm`, a product repo with `build.py` and `dist/`; vault now via `~/zao-vault-worktrees/seat` | seat session 2026-10-04 |

Two of these map directly. The separate `--settings` file is the same idea as our rule "never write another agent's permission surface": give each role its own file. And the seat's orchestrator-generation handoff (KH10304) is the one use of `SendMessage` that nobody disputes.

### 5. Parallelism, review, and the human bottleneck

- Willison, 2025-10-05 [FULL, curl]: the "natural bottleneck on all of this is how fast I can review the results". He parallelises research, small maintenance and proofs of concept, and can "only focus on reviewing and landing one significant change at a time".
- Superset launch, HN 48236770 (108 points, 135 comments) [FULL, Algolia API]: "The hard part is not just run more agents. It is managing all the state around them... Once you have five or ten agents running, the bottleneck often becomes remembering what each one is doing and actual human review." A user: "couldn't manage more than like 20 terminal tabs without losing track", now 40-50 sessions "without losing track" because the tool surfaces states.
- HN 47268777 [FULL]: a founder runs 3-6 CLI agents across worktrees in a 300k-line monorepo; his rule for coordination is boring: "one agent per feature, and they don't touch each other's worktrees. When feature A needs something from feature B, I merge feature B first."
- Osmani, 2026-03-26 [FULL fetch; framing, subagent and agent-teams sections read, demos skimmed]: "Three to five teammates is the sweet spot. Token costs scale linearly... three focused teammates consistently outperform five scattered ones." His antidote to a lead becoming the bottleneck is peer messaging so "the lead is automatically notified" rather than relaying.
- Doc 2474 (our own earlier DEEP scan) found no sustained report above 6-8 concurrently reviewed agents without a manager layer, and the Cognition/Devin pattern of reviewing proof-of-work artifacts instead of supervising execution.

The pattern across all five: the bottleneck is review and state memory, not agent count. A seat that relays every message makes itself the bottleneck; a seat that only holds state and verification does not.

### 6. Contradiction check

| Claim A | Claim B | Verdict |
|---|---|---|
| Cognition, "Don't Build Multi-Agents" (2025-06-12) [FULL]: parallel subagents make "conflicting decisions", "very fragile"; use "a single-threaded linear agent" | Anthropic: multi-agent beat single-agent by 90.2% | Not resolved by either; the scopes differ. Cognition's failure needs parallel WRITERS sharing one deliverable. Anthropic's workload is read-heavy research and Anthropic itself says coding is less parallelizable. Our lanes partition by repo, so no two writers share a deliverable; cross-repo work is where Cognition's warning applies, and it is where the seat's briefs must carry the full decision, not a summary. |
| Gas Town: "4-10 agents become chaotic, scale comfortably to 20-30" (README); Yegge, 2026-04-03: "the 22-nose Clown Show, where the Mayor scored a new clown nose every time it had massive data loss, which went on for weeks", now "largely in maintenance mode" with successor Gas City in alpha [PARTIAL, first 6,000 characters] | HN 47770124 (113 points, 164 comments) [FULL]: "flaky and scorches tokens", "vibe designed", "reducing human oversight and control... profoundly misguided"; a $100/hour figure has "sketchy" sources | Unresolved. The 20-30 figure is the author's own claim; no independent measurement found. Do not adopt the number. |
| Claudeverse: the orchestrator must not be an agent | KH10304, mikecrash, Anthropic: the orchestrator is a Claude session | Both hold if the orchestrator's state is external. Claudeverse sells the alternative; the cheaper fix is ours: ledger in files, deterministic tick (doc 2444). |
| Osmani: hierarchical subagents, "teams of teams", 3x deeper decomposition | Claudeverse citing #46424: only the top-level REPL can call `Agent()` | Resolved for current versions by the docs: "By default, a subagent can spawn subagents of its own, up to three layers below the main conversation" (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` changes it; `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` caps concurrency, v2.1.217+). Issue #46424 is stale. Nesting works inside one session; it still does not turn independent Orca panes into a tree. |
| Reddit 1wuruui: a different model as orchestrator catches worker errors better | Same thread: "acceptance criteria being too vague" is the real cause | Both plausible, n=1 thread, 26 comments. Take the cheap half: define done as a check a script can run. |

### 7. Staleness audit (current as of 2026-10-04)

| Item | State | Evidence |
|---|---|---|
| Crystal | Deprecated Feb 2026, replaced by Nimbalyst; 3,123 stars, last activity 2026-02-26 | README [FULL], snapshot |
| Vibe Kanban | README banner "Vibe Kanban is sunsetting"; repo not archived, pushed 2026-09-19; 28,264 stars, 544 open issues | README, snapshot |
| Claude Squad | 8,569 stars (+72 in 16 days), last activity 2026-08-20, AGPL-3.0 | snapshot, LICENSE.md read |
| Superset | 14,871 stars, active 2026-10-05, **Elastic License 2.0** (read from LICENSE.md; not OSI open source) | snapshot |
| Gas Town | 18,255 stars (author quoted 13k on 2026-04-03), 502 open issues, MIT (read from LICENSE), active 2026-09-29; author says maintenance mode, effort moved to Gas City | snapshot, Yegge post |
| Pane | 510 stars, AGPL-3.0, active 2026-10-05 | snapshot |
| Conductor "metered as programmatic usage from June 15" | One HN comment (collin128), unverified; not used for any decision | HN 48236770 |
| Agent teams, agent view, Projects | Experimental, research preview, public beta: expect interface change | docs `agents` page |
| Anthropic multi-agent post | 16 months old; read as design principles, not current numbers | published 2025-06-13 |
| Claudeverse issue numbers | Cited from the vendor post; not re-checked on GitHub. #46424 is contradicted by the current subagent docs (see contradiction check) | not verified |

## Setup for Monday's single orchestrator terminal

This is a proposal. Anything that changes a permission surface, a hook, or a setting is Zaal's hand to apply, because the seat cannot write its own.

### Where it runs

- **cwd: `~/zao-vault-worktrees/seat`.** It is the seat's own vault worktree, so state is next to the process, `AGENTS.md` and `BLACKBOARD.md` are in tree, and there is no product code to build in. Leave `~/Documents/zao-icm` as a lane for the ICM repo.
- **One terminal, one name, `seat`.** Start it by `claude --name seat`; `zao-lane-boot` refuses to start a second `seat` or any lane whose name is already live.
- **Own settings file for the seat**, loaded with `--settings`, so lane sessions started by hand stay untouched (Sea_Tiger39 pattern). Contents Zaal approves: deny `Edit` and `Write` outside `seat/`, deny Bash `cp`, `mv`, `rsync`, `ffmpeg`, and any path under another repo; a `PreToolUse` hook that returns `deny` with the reason "the seat routes; open a lane for this".
- **Fresh session daily, resumed by file, not by `--continue`.** Long sessions pay the context tax every turn (doc 2444). The seat writes its end-of-day state and the next day starts from that file.

### What it loads at start (in this order, all by command, not memory)

1. `~/zao-vault/AGENTS.md` and `BLACKBOARD.md` from the seat worktree (rules and live state).
2. The latest seat handoff (the typed 6-field header from doc 2423: status, branch, goal, next-action, do-not, evidence).
3. `zao-lanes` output joined with `claude agents --json`: the measured list of live lanes, their state, and the duplicates. Never the lane list from memory.
4. The today list (at most 7 lines) and the open-questions file. Nothing else; the 620-item backlog is queried by command when a question needs it.
5. The `seat` skill. Its first outbound action stays: tell every reporting lane where the seat is.

### Daily loop

1. **Measure.** `zao-lanes`, `claude agents --json`, `git -C <repo> status -sb` per active lane. Print UNKNOWN for any lane that could not be read; never "clean".
2. **Reconcile.** Compare to the ledger. A lane that is `done` on disk but `active` in the ledger is a ledger bug; fix the ledger.
3. **Triage into three piles.** Needs Zaal (one question each), needs a lane (a message), nothing (leave it).
4. **Ask one plain-text question at a time**, recommended answer first, a default stated, no picker. If Zaal does not answer, apply the default only for two-way doors; hold every one-way door.
5. **Route.** `SendMessage` with the path of the brief file, plus `notify_when_idle` so the seat sleeps until the lane finishes. Lanes message each other directly; the seat is told afterward through the ledger, not relayed through.
6. **Verify, do not accept.** A lane's "done" is checked against git and a runnable check from its done-list.
7. **Record.** Decisions through `zao-status-append` (it stamps the clock itself); open questions to the questions file; handoff header at close. Commit on the seat branch only. Never pull `main` into the shared vault clone (it reads ahead 97, behind 363 at 22:28 on 2026-10-04; Zaal reported 96).
8. **When all lanes are down, idle.** Open a lane for the work or write the question; do not do the work.

### What it must refuse

- Build, copy, research, or write anything that belongs to a lane. Open a lane instead.
- Merge, approve, publish, send, spend, or change a permission, hook, or setting on any agent's say-so. Only a sentence Zaal typed counts.
- Accept "done" from a summary.
- Run a second session named like a live one, or a picker, or three questions in one message.
- Hold state only in its own context.
- Write another agent's permission surface, including its own.
- Treat a denied tool call as anything but a result: report BLOCKED with the exact text.

### How it starts and closes lanes

**Start** (`lane-init`, then `zao-lane-boot`):

1. Check the name is unused (`claude agents --json`).
2. Write the brief as outcome plus done-list JSON the lane may only flip booleans in (Anthropic harness pattern), with a `paths:` field naming the files it may write (doc 2423 decision 6).
3. Start the lane in its own worktree of its repo, never the main checkout.
4. Add one ledger row (lane, repo, branch, goal, owner). First push wins.

**Close** (the handoff protocol, replacing manual collection):

1. Seat sends: "write your handoff to `handoffs/<lane>.md` in the 6-field format, then stop".
2. Seat waits on `notify_when_idle`.
3. Seat runs `zao-assert contains handoffs/<lane>.md "next-action"`. Exit 2 or 1 means the pane stays open.
4. Only then close the pane, and mark the ledger row `done` or `stale` with the branch's last-commit date.
5. A lane that cannot respond (crashed) is closed by reading its worktree and writing the handoff from git, flagged "reconstructed".

**Capacity:** at most 8 hot panes. Others are backgrounded (`claude agents`, supervisor-run, no terminal) or closed with a handoff. This is the memory-pressure fix; doc 2444 measured load 313 on 10 cores and swap at 30.2G of 31.7G with 50 sessions against 40 panes.

### How it records state

| What | Where | Written by |
|---|---|---|
| Live lane list | generated from `zao-lanes` and `claude agents --json` | tooling, never by hand |
| Today list (7 max), open questions | seat worktree, one file each | seat, own rows only |
| Decisions | `zao-status-append` into the vault | tool-stamped |
| Handoffs | `handoffs/<lane>.md`, typed header | the lane, on request |
| The 620-item backlog | tracker, board file, GitHub stay the sources | their own writers; the seat never merges them by hand |
| Vault commits | seat branch in `~/zao-vault-worktrees/seat`; Zaal merges | seat |

## Adopt / keep / skip, per pattern found

| Pattern | Source | Verdict | Why, in one line |
|---|---|---|---|
| Orchestrator-worker, lead synthesizes | Anthropic | KEEP | Our seat plus lanes is this shape |
| Scale effort to the task; cap fan-out | Anthropic | ADOPT | One line in the seat brief: a lane per repo, not per idea |
| Subagents for the seat's bounded reads | Claude Code docs | ADOPT | Keeps lookups out of the seat's context; results must be summaries under a size cap (#23463) |
| Initializer/worker split, JSON done-list | Anthropic harness | KEEP | `lane-init` already does it |
| Subagent output to files, return a path | Anthropic | ADOPT | Make "return a path" a rule in every brief |
| Cross-session messaging | Claude Code docs | KEEP | `SendMessage` is the transport; docs match our rules |
| `notify_when_idle` | Claude Code docs | ADOPT | Ends polling and screen-scraping |
| Agent view / background sessions | Claude Code docs | ADOPT as a trial | Parking lot for cold lanes; research preview, so keep Orca as primary |
| Agent teams | Claude Code docs | SKIP | Ephemeral, one team, no worktree isolation, experimental |
| Dynamic workflows | Claude Code docs | ADOPT for audits | Script holds the plan; not for lanes |
| Projects (cloud threads) | Claude Code docs | INVESTIGATE | Does a thread reach a local repo without a picker |
| Worktree per lane | all sources | KEEP | Every source agrees; add `claude --worktree` for a second lane in one repo |
| `--settings` file per role | r/ClaudeAI 1wvtbi2 | ADOPT | Matches "never write another agent's permission surface" |
| `PreToolUse` deny on the seat | hooks guide | ADOPT | Makes "does not build" enforceable |
| Seat in a non-code dir | Gas Town, r/ClaudeAI | ADOPT | Removes the thing it drifted into building |
| Ledger written by tooling | doc 2423, HN 46990733 | ADOPT | Hand boards rot |
| Out-of-process orchestrator | Claudeverse | KEEP as principle only | State outside the session, deterministic tick; do not buy the product |
| Different model to check workers | r/ClaudeAI 1wuruui | SKIP for now | n=1 thread; define done as a runnable check first |
| Dedicated spec-reviewer or `@reviewer` | r/ClaudeAI, Osmani | ADOPT at lane level | Seat only ever sees green-reviewed work |
| Single-threaded writer per deliverable | Cognition | KEEP | One writer per repo is already our rule |
| Proof-of-work review, not supervision | doc 2474 | ADOPT | Lane DONE carries the command that proves it |
| Claude Squad, Conductor, Pane | tools | SKIP | AGPL / closed source; we have Orca |
| Crystal, Vibe Kanban | tools | SKIP | Deprecated, sunsetting |
| Superset | tool | SKIP | Elastic License 2.0; copy only the "surface agent state" idea |
| Gas Town | tool | SKIP | Own vocabulary, unmeasured 20-30 claim, 502 open issues; steal persistent ledger and stall detection |
| Hierarchical subagents (nested, 3 layers default) | Osmani, Claude Code docs | ADOPT inside a lane | Lets one lane fan out a reviewer-plus-verifier; does not create a secondary-lane tier across panes |
| Zulip/chat as the lane surface | HN 48236770 | SKIP | One user, no evidence it scales |

## Also See

- [agents/2456-orchestrator-practice](../2456-orchestrator-practice/) - the 2026-09-01 audit; this doc is its sequel on the seat's job
- [agents/2444-always-on-orchestrator](../2444-always-on-orchestrator/) - the meter and the deterministic tick
- [agents/2423-vault-as-transport-inter-terminal-context](../2423-vault-as-transport-inter-terminal-context/) - typed handoffs, ledger, pull not push
- [agents/2480-zorca-lock-lease-hierarchy](../2480-zorca-lock-lease-hierarchy/) - seat lease and tier language
- [agents/2474-agentic-lane-throughput-and-research-retrieval](../2474-agentic-lane-throughput-and-research-retrieval/) - the 6-8 reviewed-agents ceiling
- [dev-workflows/2471-zao-lane-workflow-audit](../../dev-workflows/2471-zao-lane-workflow-audit/) - the lane workflow gap audit
- Local: `~/.claude/skills/seat/SKILL.md`, `~/bin/zao-lanes`, `~/bin/zao-lane-boot`, `~/bin/zorca-lock`, `~/bin/zao-assert`, `~/bin/zao-status-append`
- Tracker: tasks `research-doc:2480`, `research-doc:2444`, `research-doc:2456` are open reviews on adjacent docs (due 2026-10-06)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review this doc and answer the one open decision: seat cwd `~/zao-vault-worktrees/seat` vs staying in `~/Documents/zao-icm`. Shipped when Zaal types a choice in the seat. | Zaal | Decision | 2026-10-05 |
| Draft the seat's `--settings` file (deny rules plus `PreToolUse` hook) as a PR in `zaal-dotfiles` for Zaal to apply. Shipped when the PR is open; applying it is Zaal's hand. | seat session | PR | 2026-10-06 |
| Add a name-uniqueness check to `zao-lane-boot` against `claude agents --json`. Shipped when starting a duplicate name exits non-zero with a test in `zao-lane-boot-test`. | Zaal-assigned lane owning `zaal-dotfiles/bin` | PR | 2026-10-09 |
| Write the close-lane protocol (message, `notify_when_idle`, `zao-assert contains`, close) as a script `zao-lane-close`. Shipped when it closes a test lane and refuses one with no handoff. | Zaal-assigned lane owning `zaal-dotfiles/bin` | PR | 2026-10-12 |
| Test agent view as the parking lot: background three cold lanes and confirm `zao-lanes` shows them. Shipped when a measured note says yes or no. | seat session | Spike | 2026-10-08 |
| Add the nesting result to doc 2480 as an addendum: nested subagents work to 3 layers inside one session, so a secondary-lane tier across panes still needs `SendMessage`. Shipped when the addendum PR is open. | seat session | Doc | 2026-10-10 |
| Add one section to `~/.claude/skills/seat/SKILL.md` quoting the cross-session docs on consent and the capacity cap of 8. Shipped when the PR merges. | Zaal-assigned lane owning `zaal-dotfiles/skills` | PR | 2026-10-12 |

## Sources

All fetched 2026-10-04. Method in brackets. `[FULL]` means the text was fetched raw and read; where a section was skimmed, it is named.

Anthropic and Claude Code docs
1. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) [FULL, curl + HTML strip; verbatim quotes above]
2. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) [FULL, curl + strip]
3. [Run agents in parallel](https://code.claude.com/docs/en/agents.md) [FULL, curl raw markdown]
4. [Message your other Claude Code sessions](https://code.claude.com/docs/en/cross-session-messaging.md) [FULL, curl raw markdown]
5. [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams) [FULL, curl + strip]
6. [Manage multiple agents with agent view](https://code.claude.com/docs/en/agent-view) [FULL, curl + strip]
7. [Create custom subagents](https://code.claude.com/docs/en/sub-agents) [FULL, curl + strip; includes the nested-subagent and concurrent-limit sections]
8. [Automate with hooks](https://code.claude.com/docs/en/hooks-guide) [FULL, curl + strip]
9. [Common workflows / worktrees](https://code.claude.com/docs/en/common-workflows) [FULL, curl + strip]
10. [Let Claude coordinate work with Projects](https://code.claude.com/docs/en/claude-projects.md) [FULL, curl raw markdown; read the intro, when-to-use and run-on-your-computer sections, the rest skimmed]

Community write-ups and tools
11. [Out-of-process orchestration for Claude Code, Claudeverse](https://claudeverse.ai/blog/out-of-process-orchestration) [FULL, curl; vendor post, undated beyond "May 2026"]
12. [Don't Build Multi-Agents, Cognition](https://cognition.ai/blog/dont-build-multi-agents) [FULL, curl; read to the principles and architecture sections]
13. [The Code Agent Orchestra, Addy Osmani](https://addyosmani.com/blog/code-agent-orchestra/) [FULL fetch; framing, subagent and agent-teams sections read, demos skimmed]
14. [Embracing the parallel coding agent lifestyle, Simon Willison](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/) [FULL, curl; first 3,000 characters quoted, remainder skimmed]
15. [Gas Town README](https://raw.githubusercontent.com/steveyegge/gastown/main/README.md) [FULL, curl raw]
16. [Claude Squad README](https://raw.githubusercontent.com/smtg-ai/claude-squad/main/README.md) [FULL, curl raw]
17. [Vibe Kanban README](https://raw.githubusercontent.com/BloopAI/vibe-kanban/main/README.md) [FULL, curl raw]
18. [Crystal README (deprecation notice)](https://raw.githubusercontent.com/stravu/crystal/main/README.md) [FULL, curl raw]
19. [Abralo comparison of Conductor, Claude Squad, Crystal, Vibe Kanban](https://abralo.com/alternatives) [PARTIAL - exa highlights only; two direct curl attempts returned no file (ladder: curl x2, exa; Playwright and Wayback not tried); vendor page for a competing product. Used only for "Conductor is closed source, Mac only"]
20. [Gas Town: From Clown Show to v1.0, Yegge](https://steve-yegge.medium.com/gas-town-from-clown-show-to-v1-0-c239d9a407ec) [PARTIAL - curl returned a 786-character shell; escalated to exa web_fetch, which returned the first 6,000 characters (published 2026-04-03); the Mayor section was not reached. Playwright and Wayback not tried. Cited only for the author's own statements in the part read]

Hacker News (Algolia API, keyless)
21. [Show HN: 20+ Claude Code agents coordinating on real work, 46990733](https://news.ycombinator.com/item?id=46990733) [FULL, 39 comments; 53 points]
22. [Launch HN: Superset, 48236770](https://news.ycombinator.com/item?id=48236770) [FULL, 135 comments; 108 points]
23. [Gas Town: From Clown Show to v1.0, 47770124](https://news.ycombinator.com/item?id=47770124) [FULL, 142 comments read via API; 113 points]
24. [Is anyone else drowning in terminal tabs, 47268777](https://news.ycombinator.com/item?id=47268777) [FULL, 7 comments; 2 points, thin signal]

Reddit (r/ClaudeAI, Arctic Shift, FULL; scores as the index last saw them and can lag reddit)
25. [Using Claude Code cross-session messaging as a multi-agent team, 1wtdfg1](https://www.reddit.com/r/ClaudeAI/comments/1wtdfg1/using_claude_code_crosssession_messaging_as_a/) [FULL, 7 comments, score 9]
26. [Fable > Opus 5.5 for orchestration, 1wuruui](https://www.reddit.com/r/ClaudeAI/comments/1wuruui/fable_opus_55_for_orchestration/) [FULL, 26 comments, score 35]
27. [Building an autonomous Claude Code harness, 1wvtbi2](https://www.reddit.com/r/ClaudeAI/comments/1wvtbi2/building_an_autonomous_claude_code_harness_how_do/) [FULL, 11 comments, score 4]

GitHub snapshots and licences (read from LICENSE files, 2026-10-04)
28. smtg-ai/claude-squad: AGPL-3.0 (LICENSE.md), 8,569 stars
29. BloopAI/vibe-kanban: Apache-2.0 (LICENSE), 28,264 stars
30. steveyegge/gastown: MIT (LICENSE), 18,255 stars
31. superset-sh/superset: Elastic License 2.0 (LICENSE.md), 14,871 stars
32. Dcouple-Inc/Pane: AGPL-3.0 (LICENSE), 510 stars
33. stravu/crystal: MIT per the API field only, not read from the file; irrelevant because deprecated

Internal: docs 2456, 2444, 2423, 2474, 2480, 2471 read in the research library; `~/.claude/skills/seat/SKILL.md` read in full; `~/bin` tool names listed by `ls`.

Not searched: X/Twitter sentiment (the X fetcher was not run), Codex-side orchestration write-ups, Cursor background agents, and Reddit subs other than r/ClaudeAI. A DEEP pass that covers those would add breadth, not change the decisions above.
