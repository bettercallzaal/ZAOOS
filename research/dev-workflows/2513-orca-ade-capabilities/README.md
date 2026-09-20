---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "2407, 2497, 2461, 2435, 2344"
original-query: "can u start working on a research doc on orca in /zao-research on the zaoos and also include links to it from the zorca github and make best practices for using orca"
tier: STANDARD
---

# 2513 - Orca: what the ADE actually provides, what we use, and how to use it well

> **Goal:** Measure Orca's real command surface against what the ZAO estate actually invokes, verify the high-value unused commands by running them, and write the best practices that follow from what was measured.

Orca `1.4.204`, runtime `ready`, measured 2026-09-20 on this Mac.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **USE the bundled `orca-cli` and `orchestration` skills instead of writing more shell around the CLI. Both are already installed here.** `orca skills installed` lists them (`orca-cli 545c036ef493e803`, `orchestration 46c0d7dd79714674`) among 426 skills. The estate hand-rolled 9,326 lines of lane tooling (doc 2497) while a maintained skill for terminals, waits and worktrees sat installed and unreferenced. | `orca skills installed`; doc 2497's line count | A |
| 2 | **USE `orca terminal wait --for tui-idle` instead of polling and scraping pane text.** Verified with a control pair, same command, two live panes: an idle pane returned `satisfied:true, status:"running"` in **0.11s, rc=0**; a working pane returned `error.code:"timeout"` after **6.13s, rc=1**. It discriminates, it exposes `status` and `exitCode` as fields, and the timeout is a distinct exit code a shell can branch on. Pane-scraping produced six detector faults in one week (doc 2497). | run live 2026-09-20 | A |
| 3 | **USE `orca agent-context --json` before writing any new Orca call.** It prints the machine-readable schema for all **234 commands**. Calls were wasted this week on `--id` where the flag is `--terminal`. | `orca agent-context` reports "234 commands (schema v1)"; 176,052-byte JSON | A |
| 4 | **RAISE lane blocks as `orchestration gate-create`, not as picker text in a pane.** Gates are already in live use and working: run `run_a4892c0a5cdc` carries **22 tasks (20 completed, 2 ready) and 8 gates, all resolved**, with real questions like *"Archive the 14 unreferenced dead repos now?"*. A gate is queryable; a picker in a pane is only visible to whoever looks at that pane. | `orca orchestration gate-list --run run_a4892c0a5cdc` | A |
| 5 | **Do NOT point a long-running process at a path inside `~/zaal-dotfiles`.** That tree is ONE shared working tree lanes check out branches in; only 1 of its refs carried `bin/fleet-watch.py`, so a supervisor pointed there would vanish whenever any lane switched branches. `bin/zao-runtime-drift` exists to police exactly this and reported `IDENTICAL` today. | `bin/zao-runtime-drift` docstring and run, 2026-09-20 | A |
| 6 | **Keep doc 2407's decision 3: Orca is the VIEWER, tmux is the SUBSTRATE.** Nothing measured here changes it. Every command below reads or drives what Orca draws; none of them is where a lane lives. | [dev-workflows/2407](../2407-orca-tmux-lane-integration/), last-validated 2026-08-24 | A |

## Findings

### We use 19 of 234 commands. 215 are untouched.

Counted by parsing `orca agent-context --json` (key `command`, 234 entries) and grepping each against `~/bin`, `~/.zao/zorca-watch` and `~/.claude/skills`.

| | count |
|---|---|
| Commands in the schema | **234** |
| Referenced anywhere in our tooling | **19** |
| Unused | **215 (91%)** |

The 19: `automations edit`, `orchestration dispatch`, `dispatch-show`, `gate-list`, `run-list`, `run-use`, `task-list`, `repo add`, `repo show`, `serve`, `status`, `terminal close`, `terminal create`, `terminal list`, `terminal read`, `terminal send`, `worktree create`, `worktree list`, `is`.

**Control:** `terminal send` (19 files) and `terminal read` (12 files) were included deliberately as things that must be found. They came back high, so the zeros below are absences rather than a broken pattern.

**A near-miss worth recording.** The first version of this count walked the JSON for a `name` key. The schema uses `command`. It matched nothing and printed `commands in schema: 0 / referenced: 0 / UNUSED: 0` and **exited 0** - a clean-looking all-clear from a filter that matched no input. It was caught by an unrelated timeout, not by a check. Logged as `surface-cannot-report-state`.

### The high-value unused commands, each RUN not just read

| command | refs | what it actually returned here |
|---|---|---|
| `terminal wait --for tui-idle` | **0** | idle pane: `ok:true satisfied:true status:"running" exitCode:null`, 0.11s, rc 0. Working pane: `ok:false error.code:"timeout"`, 6.13s, rc 1. |
| `agent-context --json` | **0** | 234 commands, 176KB schema |
| `worktree ps` | 5 | `repo / ref / host / live:N / pty:yes|no / unread:yes|no` plus a pane preview, per worktree |
| `repo search-refs --repo id:<id> --query <text>` | **0** | structured `refs[]` + `refDetails[]`. This is the ref hunting that was hand-rolled on 2026-09-19. |
| `diagnostics memory --json` | 1 | cpu and memory **per worktree**, with history, plus app main/renderer split. Its own help: *"the same host process sweep used by the Resource Usage popover... a point-in-time diagnostic rather than a cheap heartbeat."* |
| `orchestration ask` | **0** | not run - creates state |
| `orchestration worker-start` / `worker-stop` / `worker-abandon` | **0** | not run - starts processes |

`worker-abandon` deserves its own line: *"Fence an uncertain worker without claiming it stopped."* That is the honest-uncertainty distinction the estate keeps having to write out in prose, available as a verb.

### Gates model a TASK, not a pane

`gate-create` takes `--task <task_id>`. A gate is a task blocked on a decision. **A picker open in a pane is not a gate** unless someone creates one - which is why a pane can hold a decision for seven hours with thirteen messages queued behind it and nothing in any list shows it (doc 2497). The fix is not to detect pickets better; it is for a blocking lane to create a gate.

### Community signal is near zero, and that is a risk to name

Hacker News, searched via the keyless Algolia API 2026-09-20: *"Orca - The Agent Development Environment"* (2026-09-11) has **1 point and 0 comments**. There is no discussion to learn from, no thread of other people's failures, and no independent pressure on its roadmap. Compare herdr, the alternative runtime in [agents/2461](../../agents/2461-herdr-agent-runtime/): 39,201 stars and three HN threads over 400, 281 and 166 points.

**This does not mean Orca is bad** - it is the substrate this estate already runs on and it works. It means every problem we hit with it, we hit alone, and there is no second opinion. Budget for that: when something is ambiguous, the answer comes from `agent-context` and from running it, not from a search.

## Best practices for using Orca

Each one is here because something measured above made it necessary.

**1. Read the schema before writing the call.** `orca agent-context --json`. Flags are not guessable - it is `--terminal <handle>`, not `--id`.

**2. Wait, do not poll.** `orca terminal wait --terminal <h> --for tui-idle --timeout-ms <n>`. Branch on the exit code: 0 means satisfied, 1 means timeout. Never derive "idle" from pane text - the text contains chrome, and chrome has been misread as a user's typing, as a question, and as four lanes that did not exist.

**3. A pane's rendered text is never a fact about intent.** A picker's highlighted row and a confirm dialog's default both sit behind the same prompt glyph as something a person typed. If a decision matters, it belongs in a gate.

**4. Address by handle, and re-read handles every session.** Handles are runtime-issued. A handle from a previous session is not a lane, and `terminal list` is cheap.

**5. `--json` on everything you parse.** Every command here accepts it, and it returns `ok`, `result` and a structured `error.code` - which is how the timeout above is distinguishable from a failure.

**6. Never point a daemon at the shared dotfiles tree.** See decision 5. Run long-lived scripts from a path that does not move when a lane checks out a branch, and let `zao-runtime-drift` keep the copies honest.

**7. Read the whole `--help` before the first run of a state-creating command.** `gate-create`, `ask`, `worker-start` and `automations create` all write. Reading their help costs nothing; a gate on the wrong task is in someone's queue.

**8. Prefer the bundled skills to new shell.** `orca-cli` for worktrees, terminals, waits and handoffs; `orchestration` for messages, ask/reply, task DAGs, gates and coordinator loops. Both installed. They encode sequences this estate has repeatedly rebuilt by hand.

## Also See

- [dev-workflows/2407](../2407-orca-tmux-lane-integration/) - Orca as viewer, tmux as substrate. Its decision 3 constrains everything here. **Last validated 2026-08-24, 27 days ago**, and Orca has moved since - the orchestration Run, task and gate surface in use today is not described there.
- [agents/2497](../../agents/2497-zorca-upgrades/) - the 9,326 lines of hand-rolled lane tooling, and the detector faults that decision 2 answers
- [agents/2461](../../agents/2461-herdr-agent-runtime/) - the alternative runtime, and the semantic-state gap
- [agents/2435](../../agents/2435-ng-openworker-vs-our-stack/) - organizer / orchestrator split
- [agents/2344](../../agents/2344-wall-picked-off-governor/) - the on-the-wall vs picked-off operating model these commands render

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `terminal wait --for tui-idle` against every pane for one cycle and diff it against fleet-watch's scraped class. Shipped when the diff is in a vault brief and names which reader was wrong where. | @Zaal | Measurement + brief | 2026-09-23 |
| `zorca` repo README links to this doc, so the Orca layer is discoverable from the repo that drives it. Shipped when the link is on main. | @Zaal | PR to bettercallzaal/zorca | 2026-09-22 |
| One lane raises its next Zaal-blocking decision as `orchestration gate-create` instead of a pane picker, and the gate appears in `gate-list`. Shipped when a gate with a non-resolved status exists. | @Zaal | Live trial | 2026-09-26 |
| fleet-watch replaces its 30s poll with `terminal wait` for at least one class, or records why not. Shipped when the PR is open against zaal-dotfiles. | @Zaal | PR | 2026-09-30 |

## Sources

- `orca --help`, `orca agent-context`, `orca agent-context --json` (176,052 bytes, 234 commands) - run locally 2026-09-20 [FULL - direct CLI]
- `orca terminal wait --for tui-idle --json` against two live panes, control pair - run locally [FULL - executed, both outcomes in Findings]
- `orca worktree ps`, `orca repo list --json`, `orca repo search-refs --json`, `orca diagnostics memory --json`, `orca status --json`, `orca skills installed`, `orca skills list` - run locally [FULL - direct CLI]
- `orca orchestration run-list / gate-list / task-list --json` on `run_a4892c0a5cdc` - run locally [FULL - direct CLI]
- `~/zaal-dotfiles/bin/zao-runtime-drift` - docstring read and tool run [FULL - file read + execution]
- [Orca - The Agent Development Environment](https://news.ycombinator.com/item?id=49663543) - 1 point, 0 comments, 2026-09-11 [FULL - HN Algolia search API, keyless, objectID 49663543 read from the API response, not inferred. A direct fetch of the item page returned **HTTP 429 (rate-limited)**, so liveness is unconfirmed by fetch; the id is authoritative because it came from HN's own index. There is no comment tree to fetch, which is the finding]
- Research library: `dev-workflows/2407`, `agents/2497`, `agents/2461` - read locally, every number resolved with `find` before citing [FULL]
