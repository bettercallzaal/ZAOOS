---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-10-01
superseded-by:
related-docs: "2456, 2423, 2407, 2461, 2497, 2444, 2513"
original-query: "deep research what others do with orca to improve - how other teams use Orca (Stably AI, com.stablyai.orca, CLI 1.4.218) to run agents, measured against how ZAO runs it, ending in a ranked adopt/keep/both list split before and after Oct 4"
tier: DEEP
---

# 2581 - How other teams run agents in Orca, measured against how ZAO runs it

> **Goal:** Read Orca's own version-matched skill guides as primary sources, measure what Orca actually holds on this Mac, find how outside teams run agents in it, and rank what ZAO should adopt, keep, or run alongside - with nothing before ZAOstock on Saturday 3 October.

## The three unknowns in the brief, answered first

| Brief asked | Answer | Surface read |
|---|---|---|
| Where are Orca's public docs, and is there a community? | Docs at `https://www.onorca.dev/docs`, source in `docs/site/content/docs/` of `stablyai/orca` (MIT, 82,852 stars, 5,368 forks, created 2026-03-17, pushed 2026-10-01). Discord `discord.gg/fzjDKHxv8Q`. GitHub Discussions on (89 threads). | `gh api repos/stablyai/orca`, `curl` of onorca.dev, GraphQL discussions count |
| Is `orchestration` messaging durable, and does it mark relayed claims? | **Durable: yes.** SQLite at `~/Library/Application Support/orca/orchestration.db` (WAL), 26 tables. **Provenance: no.** The `messages` table has `type` (9 values), `priority`, `thread_id`, `payload`, `read`, `delivered_at`, `sender_pane_key` - no basis, source or evidence column anywhere in the schema (`.schema` grepped for `basis|provenance|measured|relayed|evidence|source`: only `archive_source` on worker terminals). So the seat's provenance layer in `agent-msg.py` is not a duplicate; the drop-box half of it is. | `sqlite3 "file:orchestration.db?mode=ro"` on 2026-10-01 |
| Does `orca search` index the sessions the vault archives? | It indexes **this machine's agent transcripts**: 9,512 files, 421,338 messages, 9,467 Claude / 26 Codex / 4 Cursor sessions, `phase: current`, last reconcile 2026-10-01 13:46 UTC. A query for this lane's own brief returned this session. The vault archives handoffs and status, a different corpus, so the two are complementary and neither replaces the other. | `orca search --index-status --json`; `orca search "orca-research lane brief" --since 2026-10-01` |

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **ADOPT `orca worktree ps --json` as the lane-state source for `zj`, `zao-lanes` and `fleet-watch.py`, after Oct 4.** Orca already holds hook-fed semantic agent state - `state: working/done`, the current tool, the prompt, `stateStartedAt` - for every Orca-launched Claude. ZAO's tools read only `orca terminal list` and `orca terminal read --screen` and classify from pane text. This is the exact gap [doc 2461](../../agents/2461-herdr-agent-runtime/) priced at 34,377 stars of herdr; it is already on the machine. | `grep` of `~/bin/zj`, `zao-lanes`, `orca-board`, `fleet-watch.py` (1, 1, 2, 1 orca calls, none to `worktree ps`); `orca worktree ps --json` output: 33 worktrees, 13 with live terminals, 5 agents `working`, 8 `done` | A |
| 2 | **ADOPT `orca search` for transcript recall now, by humans, and in skills after Oct 4.** Index is on, current, and found this session. It replaces grepping `~/.claude/projects/*/` and is the cheapest answer to "which session said X". Nothing to install or configure. | `orca search --index-status --json` 2026-10-01 | A |
| 3 | **ADOPT the Task-spec contract into `/lane-init` briefs: Target, Change, Constraints, Ownership, Observable acceptance.** This is a doc change, not an Orca change, and it closes the output-format and effort-budget gap doc 2456 found still open on 2026-09-25. | `orca skills get orchestration`, section "Task-spec contract" (quoted below); [doc 2456](../../agents/2456-orchestrator-practice/) question 3 | A |
| 4 | **KEEP `agent-msg.py` for provenance; it has no Orca equivalent.** Orca's inbox carries typed messages, blocking `ask`/`reply`, gates and idempotent `--retry-request`, but no basis field, and its addresses are Orca terminals and dispatches only. Antigravity, iman-desk and x-account have no Orca address. | schema measured above; `inbox/agents/` has 8 recipients, 42 messages | A |
| 5 | **BOTH for supervised runs: Orca Tasks/Dispatches as the ledger of Orca-launched work, the vault handoff as the record.** ZAO's one real run (2026-08-26/27: 2 runs, 22 tasks, 17 dispatch contexts, 8 gates, 60 messages, last message 2026-08-27 10:55 UTC) stopped because `worker_done` was fenced to registered producers, and three outside teams hit the same shape: polling not push (#4376), 1,097 notifications in a day (#15148), agents running commands without reading the skill (D#21391). The community answer is glue around the Run, not abandoning it. | `orchestration.db` counts; `~/zao-vault/notes/orca-organization.md` convention 7; issues and discussions below | B |
| 6 | **KEEP ZAO's cron and launchd for ticks; use an Orca automation only with `--precheck` and only after Zaal's gate.** The brief's `orchestrator-tick` automation does not exist. The only automation is `fleet-health`, hourly, `enabled: false`, last run 2026-09-09 18:00 UTC, 6 runs all `completed`. Zaal's 2026-09-30 ruling makes a relauncher a GENESIS-level grant, which an automation is. | `orca automations list --json`, `automations runs`; `decisions/grill-2026-09-30-orchestration-afternoon.md` item 4 | A |
| 7 | **ADOPT worktree comments and `--workspace-status` as the one-line lane status on the card.** 1 of 33 ZAO worktrees carries a comment today. The skill text asks for an update "after a repro, fix, validation, handoff, or blocker". `status-page.py` can read it with one call. | `orca worktree ps --json`: `with comment set: 1`; `orca skills get orca-cli`, "Worktree Comments" | B |
| 8 | **ADOPT `orca.yaml` `worktree.sharedDirectories: [node_modules]` in ZAOOS, after Oct 4, by PR.** Replaces the hand symlink in `agent-loops.md` rule 25 with the repo-checked-in form. The vendor's own `orca.yaml` is 4 lines. | `docs/site/content/docs/model/worktrees.mdx`; `repo-orca.yaml` | B |
| 9 | **SKIP headless `orca serve`, per-workspace environments, Linear, the race-three-agents recipe, and the mobile app until a separate doc.** The one first-hand headless account (dazzlog) is a solo developer on a home VM with a no-sudo runner and rootless Docker; the one multi-machine fleet account (tizerluo, #4376) reports CLI federation refused as a "mobile client". Not a before-Oct-4 question and not a one-paragraph one. | sources below | B |
| 10 | **Before Oct 4: nothing.** Every row above is reading, a doc change, or a post-festival PR. | brief, section "Priority order" item 5 | A |

## What the primary sources say (version-matched, this Mac, `orca` 1.4.218)

### `orca skills get orchestration` - 197 lines, 13,006 bytes; `--full` adds 7 references, 795 lines

The whole model in its own words:

> "A Run is a durable namespace and coordinator inbox; it does not schedule or place workers. A Task is work. A Dispatch is one authoritative Task attempt."

> "Lifecycle authority comes from the active Dispatch, not a terminal title, copied ID, old database row, provider transcript, or visible pane."

> "A successful `orchestration send` proves durable enqueue; its wake or nudge is best-effort attention only and does not prove the recipient read or accepted it."

That last line is the same design `agent-msg.py` states for itself ("It does NOT poll, watch, schedule or deliver"). Both layers are pull. The difference is where the inbox lives: Orca in a local SQLite file, ZAO in git.

The safety floor reads like ZAO's own rules written by someone else:

> "Safe failure: preserve work and authority and report the state as unknown or `unverifiable`. Only positive proof of exit authorizes stop, abandon, or retry, and only an accepted settlement authorizes release. Every other observation, absence included, is a checkpoint."

> "Liveness is layered: `worker-list`'s `projection.liveness` is the fleet verdict for the agent; `worker-show`'s `observation.status` is PTY liveness only. A live terminal can still hold a dead or stuck agent."

Compare `liveness-probe-guard.md` ("busy is not dead") and `state-claims.md` ("silence is not evidence"). Orca reached the same rule from the other side.

The Task-spec contract, which decision 3 adopts verbatim:

> "Every Task spec must be self-contained and name: Target: the files, component, or environment in scope. Change: the concrete result to produce. Constraints: invariants, compatibility rules, and do-not-touch boundaries. Ownership: what this worker may edit and any coordination boundary. Observable acceptance: the test, output, or evidence that proves completion."

The worker contract requires one `worker_done` "with a three-sentence executive summary, both lifecycle IDs, and explicit `--outcome succeeded` or `--outcome failed`. Never encode failure only in prose." And the coordinator loop: "After three consecutive empty waits, stop waiting blindly and enumerate" with `worker-list`. Both are `agent-spend.md`'s two-no-change-ticks rule with a number attached.

What the kernel says to use it for and not: "Model or effort selection does not make a handoff supervised." A full handoff is `orca-cli`'s job and "create no Run, Task, or Dispatch and do not monitor completion."

### `orca skills get orca-cli` - 248 lines, 20,301 bytes; `--full` adds automations, browser, publishing

Four things ZAO does not use today, each quoted from the guide:

- **Worktree comments.** "A worktree comment is the short status line on the workspace card. Update it at meaningful checkpoints ... Update after a repro, fix, validation, handoff, or blocker." Card status: `--workspace-status` with defaults `todo`, `in-progress`, `in-review`, `completed`.
- **Agent session search.** "`ORCA search` runs a full-text search over the agent sessions indexed on one Orca host ... Search for a distinctive phrase or identifier, not a description of the topic." Each hit "carries the session, a snippet with the matched text marked, and a `resumeCommand`."
- **Send receipts.** "`accepted: true` proves input acceptance, not a started turn. Use the receipt's `turn_started` stage when submission proof is needed; never resend on silence." And `--wait-submit <seconds>`. This is the fix for the hazard `orca-organization.md` logged on 2026-08-28 ("`orca terminal send --text ... --enter` does NOT submit multi-line text").
- **Artifacts and skill sharing** are gated behind a desktop setting a human must flip: "There is no CLI or RPC way to grant it." A denied share "fails with `artifact_sharing_disabled` before any upload. Do not retry."

Automations, from the bundled reference: "An automation is a scheduled Orca prompt run by a chosen provider against either a repo-created worktree or an existing workspace." Triggers: `hourly`, `daily`, `weekdays`, `weekly`, 5-field cron, or RRULE. The public docs add `--precheck`: "Skip scheduled work when a cheap shell probe fails (non-zero exit records a skipped run)."

### What Orca holds on this Mac, measured 2026-10-01

| Surface | Measured | What it means |
|---|---|---|
| `orchestration.db` | 26 tables; `messages` 60 (26 `worker_done`, 20 `status`, 14 `heartbeat`), dated 2026-08-26 00:59 to 2026-08-27 10:55 UTC; `tasks` 22; `dispatch_contexts` 17; `decision_gates` 8; `runs` 2 (one `run_legacy_local` tombstone) | ZAO tried supervised orchestration for 34 hours in August and has not written to it since |
| `agent-hooks/` | `endpoint.env` with 5 keys (port, token, env, version, transport - values not read); `spool/` holds 10 `pane-*.jsonl`; `~/.claude/settings.json` references `~/.orca/agent-hooks/claude-hook.sh` | Orca installed Claude Code hooks that report state back to it. That is where `worktree ps` gets `working`/`done` |
| `orca worktree ps --json` | 33 worktrees across 20 repos, 13 with live terminals, 14 live terminals, 3 child worktrees, agents `claude working` 5 and `claude done` 8, `workspaceStatus` in-progress 22 / in-review 10 / completed 1, comments set 1 | The fleet view ZAO's tools rebuild from screen text already exists as JSON |
| `orca automations list --json` | 1 automation, `fleet-health`, `FREQ=HOURLY`, `enabled: false`, `reuseSession: true`, last run 2026-09-09 18:00:27 UTC, 6 runs all `completed`, `missedRunPolicy: run_once_within_grace` (720 min) | The brief's `orchestrator-tick` is gone; this one has been off for 22 days |
| `orca search --index-status` | enabled, current, 9,512 files, 421,338 messages | Transcript recall is built and on |
| `orca host list` / `environment list` | one host (`local`, darwin); 0 remote environments | No headless or federated runtime in use |
| `tmux ls` from this pane | `error connecting to /private/tmp/tmux-501/default` | A count of tmux lanes from inside an Orca pane is UNKNOWN; this pane cannot see the tmux server. Not evidence that the Wall is empty |
| ZAO tools' Orca calls | `zj` 1 (`terminal list`), `zao-lanes` 1, `orca-board` 2 (`terminal list`), `fleet-watch.py` 1 (`terminal read --screen`), `zao-tick` 0, `zao-agents` 0 | None reads `worktree ps`, `search`, or the orchestration tables |

## The vendor, verified raw

- **Repo.** `stablyai/orca`: "Orca is the ADE for working with a fleet of parallel agents. Run any coding agent with your own subscription." 82,852 stars, 5,368 forks, 138 watchers, 100 contributors, top committers nwparker (4,436), AmethystLiang (1,932), brennanb2025 (1,930), Jinwoo-H (1,569). `open_issues_count` reads 7,264 but the GitHub search API splits that into **3,520 open issues and 3,746 open PRs**; Rick Hightower's August post warned that the headline number "counts pull requests too", and it still does.
- **Licence.** LICENSE file opens "MIT License / Copyright (c) 2026 Lovecast Inc." The YC page calls the company "Stably AI (Orca)", W22, founders Jinjing Liang (ex Google Chrome) and Neil Parker (ex Uber TL). The relation between Lovecast Inc. and Stably AI is not stated on either page: **UNVERIFIED**.
- **Releases.** Daily. v1.4.210 (09-24), .211, .212 (09-25), .214 (09-26), .215 (09-27), .216 (09-28), .217 (09-29), **v1.4.218 published 2026-09-30 20:53 UTC** - the installed version. Its notes: "Codex terminals now run on their own server by default", four more agents built in (DeepSeek Harness, Freebuff, Qoder, CodeBuddy), "Native chat (experimental): Structured chats can run orchestration themselves and receive worker results", and "orchestration workers wait out Codex 0.157's startup screen before their brief is typed" (PR #23745).
- **Positioning.** onorca.dev: "Ship 100x with the agent IDE. Run Claude Code, Codex, and any other coding agent in parallel, each in its own worktree." "Free and open source. New features shipped daily." "27 supported agents."
- **Docs on orchestration** (`docs/site/content/docs/cli/orchestration.mdx`): "Experimental. Enable orchestration under Settings → Experimental before using these commands." And: "`orca orchestration run` and `run-stop` (and `coordinator-start` / `coordinator-stop`) perform no effects. They return recovery text."
- **Docs on hooks** (`agents/hooks-memory.mdx`): "Settings → Agents → Agent status hooks controls the Orca-managed hooks that report working / waiting / done into the UI." "Hook endpoints are written to disk (`{userData}/agent-hooks/endpoint.env` on POSIX ...) and re-sourced on every hook invocation." This matches the file found on this Mac.
- **Docs on worktrees** (`model/worktrees.mdx`): three mechanisms for gitignored state - per-user Shared Paths, `orca.yaml` `worktree.sharedDirectories` ("symlink/share, not copy"), and `.worktreeinclude` ("gitignored files or directories to copy").
- **The vendor's own repo config** (`orca.yaml`, 4 lines): only a `scripts.setup` running `pnpm install`. Their `AGENTS.md` (135 lines) is a style and verification guide for agents working on Orca: "Reuse Before Reimplementing", "Always run tests and agent-launched apps in the background", and a PR template "written for a reviewer who has never seen this code".

## How other teams run agents in Orca (community, raw fetches)

### First-hand workflows

**1. A software factory on a headless VM** - dazzlog, 2026-08-23, `curl` FULL. Moved from herdr to Orca; runs `orca serve` on an Ubuntu VM over Tailscale with "the runner has no sudo, Docker is rootless". Work comes from a GitHub Project board with named states; "a backlog groomer ... performs at most one useful action", "the board walker reads Ready, claims an eligible card, creates its worktree, starts the implementer, and records the dispatch only after the terminal is actually running." Shape per issue: `orca worktree create --name ... --issue 152` then `orca terminal create --worktree ... --command "pi ..."`. Two forms of parallelism: independent issue workers, and "a coordinator session ... starts worker sessions in child worktrees." On automations: "A precheck keeps a full queue from starting another model session. A skipped automation run is normal ... no session and no tokens were spent." Limits he names: "Parallelism is not automatically good ... Worktree isolation prevents one class of damage; it does not remove the need for a queue, a WIP cap, or human judgment." And a follow-up post (2026-09-07) retracts part of it: "Commands tested the wrong checkout, copied shell snippets drifted apart ... I moved repeated operations into a tested Deno CLI."

**2. A multi-machine fleet, Kimi coordinator, Codex worker on a VPS** - tizerluo on issue #4376, 2026-09-02, `gh api` FULL. Orca 1.4.194, "macOS desktop + Linux VPS runtimes paired as environments". Measured pain: "The coordinator currently has to poll (`orchestration check --wait` in a loop, or a cron driving `terminal read`). Polling latency (25 min cadence for us) is pure dead time." Federation from the CLI refused: "`orchestration.federationAttachStart / federationShow / inbox is not available to mobile clients`". Their workaround "a 'proxy' pattern - a Run homed on the worker's own runtime, coordinated by a shell terminal there ... plus a local watcher script that polls the mailbox and injects into the coordinator terminal." Ask: "push instead of poll."

**3. `orq` - a noise filter in front of the coordinator** - leodiegoo/orq, created 2026-09-30, 2 stars, MIT, `gh api` FULL. "Orca types 'You have N orchestration messages' into the coordinator's terminal for every worker message, heartbeats included, and each notice is a new prompt that wakes the model and eats context." Fix: "The Runs are bound to the agent manager's terminal instead of the coordinator's ... The manager loop ... acknowledges batches that contain only heartbeats and types a single notice into the coordinator when something else arrives." Second fix: Claude Code hooks "record every user prompt as an entry that stays open until the coordinator records what it became", because "Orca stores tasks, but it has no link between 'the user asked for X at 14:02' and what that message turned into."

**4. `firstmate` - Orca as one of five backends** - kunchenguid/firstmate, 7,399 stars, MIT, pushed 2026-10-01, `gh api` FULL. "every crewmate works in its own tmux window or Herdr tab, or in an experimental Zellij tab, experimental cmux workspace, or experimental Orca terminal". Its spawn script calls `orca worktree create` and treats Orca as a session backend behind its own supervisor; "zellij and orca are never auto-detected" and `backend=orca does not support --secondmate spawns yet`. The largest project using Orca treats it as a terminal and worktree substrate, not as the orchestrator.

**5. `orca-issue-orchestrator` - GitHub Issues as the task source, a hook as the guard** - t4ku/agent-skills, `gh api` FULL. "The Orchestrator reads Issues, claims one, dispatches an Orca Task into a fresh worktree of the target repo, supervises until worker_done, and writes the outcome back to the Issue - it never edits code itself." First instruction each session: "Do not rely on a copy of Orca's CLI reference. At the start of each session run: `orca skills get orchestration --full`."

**6. A JSON lifecycle policy committed under `.orca/`** - kounoike/react-rich-media-hooks, `.orca/task-pr-lifecycle.json`, `gh api` FULL. Declares `"forbid_untracked_full_handoff": true`, persists `task_id, run_id, dispatch_id, worker_session_id, worktree_id, worktree_path, branch`, `"max_tasks": 3`, and an automatic completion mode capped at `max_changed_files: 10`, `max_changed_lines: 300`, `requires_no_decision_changes: true`.

**7. `orca-viz` and `orca-osw`** - nvergez/orca-viz (15 stars, MIT) reads `orchestration.db` read-only to draw "the task DAG, who is working what, the decision gates blocking the run"; it warns "It reads Orca's internal, undocumented schema ... it changes between Orca releases" and that orchestration sits "behind the localStorage flag `orca.orchestration.enabled`". shikihane/orca-osw (2 stars) "detects task completion through Orca's native agent state (with idle-signal fallback), forces a handoff pass, and reports the resulting handoff file back to the caller" - a third party rebuilt ZAO's handoff-on-done habit on top of Orca's state.

**8. The HN voice**, Algolia items API, FULL. On herdr's "Connecting the machines" thread (93 points, 35 comments, 2026-09-08): "Onorca.dev is very similar but has a desktop UI that I prefer to herdr ... The limitation of Orca or Herdr is that they don't have integration for multi project work" (bibstha); "love orca, but they severely need mobile support" (mrlinx). Two more drive-by endorsements (kn9, 2026-08-01; vishnuaniyan, 2026-09-10). The two Orca-titled stories scored 3 and 1 points. HN has not discussed Orca at length.

### Reviews and explainers (eight, all `curl` FULL unless marked)

andrew.ooo (2026-06-26): "Daily-ship velocity = occasional rough edges ... Bugs sometimes ship too; fixes typically land within 24 hours." "three parallel Claude Code agents = 3x token spend." ramonchancay (2026-07-06): a comparison table placing Orca alone with native parallelism and orchestration against Claude Code, Cursor and OpenHands; "Cost multiplies with agents." Rick Hightower (2026-08-06, 51,641 chars): "It is a message-passing system with a task DAG bolted on, and the semantics are surprisingly rigorous"; "`orca worktree ps` gives you a compact orchestration summary across the whole fleet, which is the closest thing here to `ps aux` for agents"; the risk "stated plainly: an orchestration layer whose value comes from being agent-agnostic is worth a great deal while you use several agents, and much less the day you standardize on one." apidog (2026-09-01): "the failure mode is spending five times the tokens to get five versions of the same answer." dev.to jamse_bao (2026-09-03): a star-count post with a `docker compose` quick start that does not match the repo (no `docker-compose` at the root - **the post is PARTIAL on substance**). aniketkarne (2026-09-12): "the most concrete named system for multi-agent coordination I've seen outside of a research paper." makeuseof (2026-09-30): byline and date fetched, body behind a JS shell - **PARTIAL**. olegdubovoi (2026-09-26): second-hand, "I haven't tested it myself", "already 3.6k pull requests. Looks like AI agents are working day and night."

### Complaints, with numbers

| Complaint | Evidence | Date |
|---|---|---|
| Notification storm from workers | #15148: "Orca 1.4.215 raised 1,097 agent notifications" in one day of coordinator-plus-worker runs (ShahrumAmiri); 5 comments, patch #15153 pending; a comment notes plain `worktree create --agent` handoffs and automations "have no dispatch record, so they would stay loud" | 2026-08-17 to 09-30 |
| Poll, not push | #4376 "I'm having to prompt the orch to poll worker status every x epoch, which also blocks them from being used otherwise" plus the tizerluo fleet report above | 2026-06-01, 09-02 |
| Agents skip the skill | D#21391 "Agents ignore Orca skills": "running Orca commands without first reading Orca's actual orchestration manual/skill ... encountered `selector_not_found` ... `consumer_fenced` ... a rejected `worker_done`"; 0 replies | 2026-09-18 |
| Session drops | #24288 "Claude Code in Orca terminals frequently drops its session and asks to log in again"; opened 2026-10-01, 2 comments, 0 reactions - new, not yet a pattern | 2026-10-01 |
| Residue after uninstall | wilgon456/orca-agent-cleanup, 46 stars: after removing Orca, "Claude Code or Codex calls the Orca hook every time it runs a tool", `orca-cli`, `computer-use`, `orchestration` skills stay exposed, `/usr/local/bin/orca` stays on PATH (translated from Korean) | 2026-08-07 to 09-03 |
| Release cadence | D#24045 "it gets me annoying with everyday releases. Would be much better to have it once a week." | 2026-09-30 |
| Community PRs | D#22851, Pr1p's census of 13,012 PRs June to August: the team's own "~8,600 ... Merged at 76%, median self-merge about an hour"; "The actual community: 4,384 PRs. 17% merged. 51% still open"; "Community merge rate by month: June 50% → July 25% → August 8%". Maintainer nwparker, 2026-09-30: "every PR should be linked to an issue. If it's not, we ignore it", and "If you ping the PR in our Discord it does get more eyes on it." | 2026-09-25 to 09-30 |
| Cost per task | D#24197 asks for "tracking cost and token usage per task directly within the workspace board" - not built | 2026-09-30 |

## Comparison: each Orca-native capability against the ZAO tool doing the same job

| Orca capability | ZAO tool today | Verdict | Why |
|---|---|---|---|
| `orca worktree ps --json` (hook-fed state per agent) | `zao-lanes` (1,049 lines, classifies pane text), `fleet-watch.py` (`terminal read --screen`), `zj` (`terminal list`) | **ADOPT as a source, keep the classifiers** | Orca knows `working`/`done` and the running tool from hooks; ZAO infers it from screen text. The ASKING/DEAD/picker detectors in `zao-lanes` still add value Orca does not expose (a trust prompt reads `live` in Orca - its own skill says so). Add the JSON as a first source, keep text as fallback |
| `orca search` (FTS over 421,338 messages) | `grep` over `~/.claude/projects/`, the vault's `scripts/citation-audit.py` for vault text | **ADOPT** | Already indexed, already on, returns a `resumeCommand`. No ZAO tool searches transcripts |
| `orchestration send/check/ask/reply` (SQLite, typed, idempotent) | `agent-msg.py` (git drop box, required `--basis`), `lane-send` (tmux), `SendMessage` (Claude native) | **KEEP OURS, borrow two ideas** | Orca cannot reach non-Orca agents and carries no provenance. Borrow: `--retry-request` idempotency and `check --peek` semantics. The seat's layer stands |
| Runs, Tasks, Dispatches, gates | vault handoffs (`handoffs/<lane>.md` + `done.json`), cowork board, `BLACKBOARD.md` | **BOTH, after Oct 4** | Use Orca's ledger for work Orca launched; keep the vault as the record the board and humans read. Orca's own state failed ZAO once (`worker_done` fenced) and three outside teams built glue around the same seams |
| Task-spec contract (five fields) | `/lane-init`, `handoffs/TEMPLATE.md` | **ADOPT into the template** | Doc 2456 found output-format and effort-budget still missing on 09-25. This is the missing shape |
| Worker contract (one `worker_done`, three sentences, `--outcome`) | `zao-status-append`, `HANDOFF-READY` stamps, `done.json` booleans | **KEEP OURS** | Same idea, already mechanised with a clock-stamped writer; ZAO's version survives a pane close |
| Automations (`--precheck`, `--disabled`, `--reuse-session`) | crontab (21 lines), launchd (`com.zao.fleet-watch`), `zao-tick` | **KEEP, Orca only with Zaal's gate** | Cron is free (`code-over-inference.md`); an automation spends a model turn. `--precheck` is the right pattern and dazzlog's "a skipped run spends no tokens" is the argument for it when Zaal rules a relauncher in |
| Worktree comment + `--workspace-status` | lane brief `status:` field, `zao-status-append` | **ADOPT as a mirror** | One line, visible on the card and in `worktree ps`; `status-page.py` can read it. 1 of 33 set today |
| Send receipts (`--wait-submit`, `turn_started`) | `lane-send --check` (verifies the Enter took, for tmux) | **ADOPT for Orca panes** | Closes the 2026-08-28 "multi-line send does not submit" hazard without screen-reading |
| `orca.yaml` `worktree.sharedDirectories`, `.worktreeinclude` | `agent-loops.md` rule 25 ("symlink `node_modules` in") | **ADOPT, ZAOOS PR** | Checked-in and automatic beats a rule people must remember |
| Headless `orca serve`, environments, federation | VPS systemd units, `ssh vps`, Pi | **SKIP for now** | One solo first-hand account; one fleet report of CLI federation refused. Needs its own doc after Oct 4 |
| Artifacts (`orca artifacts share`) | `documentation-in-repo.md` (repo is the copy of record), Claude artifacts, `status-page.py` served in house | **SKIP** | Gated behind a desktop toggle; same account-bound lifetime problem doc 2456's sibling rule already found with Claude artifacts |
| Linear / Jira / GitHub issue workspaces | cowork board (`zao-tracker`) | **SKIP** | Different task truth; the board already owns it |
| Race three agents on one task | not practised | **SKIP** | "three parallel agents = 3x token spend" (andrew.ooo); `agent-spend.md` |
| Computer use, embedded browser, emulators | `claude-in-chrome`, gstack `/browse` (unbuilt) | **not compared** | Out of this doc's scope |

## Ranked adoption list

### Before Oct 4 (Saturday 3 October is ZAOstock): nothing

Reading only. No install, no toggle, no automation, no new convention asked of a festival lane.

### After Oct 4, in order of value per line changed

1. **`zj` / `zao-lanes` / `fleet-watch.py` read `orca worktree ps --json` as a first source** (decision 1). Measured gap: zero of the four ZAO fleet tools call it. Keep the text detectors for pickers and trust prompts.
2. **`orca search` in the handoff and lane-init skills** (decision 2): "what did the last session say about X" becomes one command with a resume link.
3. **Task-spec contract into `handoffs/TEMPLATE.md` and `/lane-init`** (decision 3). Five fields, a vault PR.
4. **Worktree comment and status mirrored from `zao-status-append`** (decision 7), read by `status-page.py`.
5. **`orca.yaml` in ZAOOS with `worktree.sharedDirectories: [node_modules]`** (decision 8). Ask-first per CLAUDE.md; a four-line file.
6. **`terminal send --wait-submit` in any ZAO script that sends to an Orca pane** (comparison row 9).
7. **A supervised Run for the next multi-worker wave, with `orq`'s manager-terminal trick evaluated first** (decision 5). Only after 1 to 4 exist, so the Run's state reaches the Wall.
8. **Headless `orca serve` on the VPS**: a separate STANDARD doc, after reading `docs/reference/headless-linux-server.md` (42,138 bytes) and `remote-servers.mdx`.

### Keep ours, explicitly

`agent-msg.py` provenance, `zao-status-append` clock stamps, cron and launchd ticks, the vault as the record, `lane-send --check` for tmux lanes, the cowork board as task truth.

## Contradictions left standing

1. **ramonchancay (2026-07-06) vs the current docs.** He wrote "With `orca orchestration run`, Orca manages that loop for you up to a maximum number of concurrent workers." The 1.4.218 docs: `orca orchestration run` and `run-stop` "perform no effects". The feature was retired between July and September; any team following a July guide is running a no-op.
2. **"Ship 100x" vs the maintainers' own numbers.** The landing page sells throughput; the maintainers' discussion thread records community PRs at 17% merged and falling, and "every PR should be linked to an issue. If it's not, we ignore it." Both are true; they describe different users.
3. **"Experimental, enable under Settings" vs ZAO's August run.** The docs gate orchestration behind a setting; this Mac has 60 messages in the table, so the flag was on here by 2026-08-26. Whether it is still on was not toggled or tested (the brief forbids configuring).
4. **The vendor scout vs the raw fetch.** The subagent reported release dates in 2024 and "zero HN discussions". `gh api` shows v1.4.218 on 2026-09-30, and Algolia shows four HN comments and two stories. Its WebFetch output was discarded for every number above; the raw fetches replaced it.
5. **Lovecast Inc. vs Stably AI.** LICENSE names one, YC names the other. UNVERIFIED which is the legal owner.
6. **Doc 2423 (2026-08-27) says "DB is Orca-private; DONE.md is prose; no single read model."** Today orca-viz reads that DB read-only from outside and warns the schema changes per release. Both still hold: the DB is readable and it is unstable. ZAO reading it directly would inherit orca-viz's "a minor bump may be required after an Orca update" cost; `worktree ps --json` is the supported surface, which is why decision 1 names it and not the SQLite file.

## Staleness audit

- Orca ships daily; 1.4.210 to 1.4.218 landed in seven days. Every CLI claim here is pinned to **1.4.218 on 2026-10-01**. Re-validate the skill quotes by re-running `orca skills get` after any update; the repo copies of `orchestration.md` (13,028 bytes on main) and the local bundle (13,006 bytes) already differ by 22 bytes.
- The six blog posts span 2026-06-26 to 2026-09-30; the July one is already contradicted (contradiction 1).
- Issue #24288 is one day old. Not a pattern yet.
- `zao-research-snapshot stablyai/orca` taken 2026-10-01: stars 82,855, forks 5,368, watchers 138, issues 7,264 (includes PRs), contributors 100. The second look is where the delta shows.

## Also See

- [Doc 2456](../../agents/2456-orchestrator-practice/) - orchestrator practice; the brief gap this doc's decision 3 closes
- [Doc 2423](../../agents/2423-vault-as-transport-inter-terminal-context/) - the vault is memory, not a message bus; its "ledger" row maps to Orca's DB
- [Doc 2407](../2407-orca-tmux-lane-integration/) - tmux is the substrate, Orca is the viewer; `zj` sees Orca sessions
- [Doc 2461](../../agents/2461-herdr-agent-runtime/) - herdr's semantic state, which `worktree ps` already provides
- [Doc 2497](../../agents/2497-zorca-upgrades/) - the two convention parsers that `worktree ps` would let ZAO retire
- [Doc 2444](../../agents/2444-always-on-orchestrator/) - the tick and the 91.5% context-handling figure
- [Doc 2513](../2513-orca-ade-capabilities/) - prior Orca capability survey (not re-read for this doc; cited by `gh search code`)
- `~/zao-vault/notes/orca-organization.md` - conventions 1 to 24, including convention 7 (lanes report through a file, not `worker_done`)
- `~/zao-vault/projects/comms-layer-2026-09-30.md` - the seat's ledger of what `agent-msg.py` fixed
- Tracker rows found by `zao-tracker search orca`: `research-action:2497:66ff8bbc94` (`zorca-actuator`, `zorca-gui-test`), `research-action:2456:15989ecf74` (fold the playbooks)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Message the orchestration seat with this doc's path, the top three adoptions, and the agent-msg finding (shipped = message sent, noted in `handoffs/orca-research.done.json`) | @orca-research lane | SendMessage | 2026-10-01 |
| Add `orca worktree ps --json` as a first source in `zao-lanes` and `fleet-watch.py`, keeping text detectors as fallback; selftest with a fixture of the JSON above (shipped = PR merged in zaal-dotfiles, `zao-lanes --selftest` passes) | @Zaal | PR (zaal-dotfiles) | 2026-10-10 |
| Add the five-field Task-spec contract to `~/zao-vault/handoffs/TEMPLATE.md` and the `/lane-init` skill (shipped = template committed; next brief carries all five) | @Zaal | PR (zao-vault, dotfiles) | 2026-10-08 |
| Cite `orca search "<phrase>"` in the `/handoff` and `/lane-init` skills as the transcript-recall step (shipped = both SKILL.md files name it) | @Zaal | PR (dotfiles) | 2026-10-08 |
| `zao-status-append` also writes `orca worktree set --worktree active --comment "<line>"` when run inside an Orca worktree (shipped = `worktree ps` shows comments on more than 1 of 33) | @Zaal | PR (zaal-dotfiles) | 2026-10-10 |
| Add `orca.yaml` with `worktree.sharedDirectories: [node_modules]` to ZAOOS (ask-first per CLAUDE.md) (shipped = fresh Orca child worktree has `node_modules` without a symlink step) | @Zaal | PR (ZAOOS) | 2026-10-10 |
| Decide whether the disabled `fleet-health` automation is retired or re-enabled with `--precheck "bash scripts/fleet-health.sh --quiet"`; this is the relauncher-class grant from the 2026-09-30 grill (shipped = decision recorded in a grill note) | @Zaal | Decision | 2026-10-06 |
| STANDARD doc on headless `orca serve` for the VPS, reading `docs/reference/headless-linux-server.md` and dazzlog's VM setup (shipped = doc merged with a GO/NO-GO row) | @Zaal | Research | 2026-10-17 |
| Second snapshot: `zao-research-snapshot stablyai/orca` and re-read #15148, #24288 (shipped = delta recorded here under Staleness) | @Zaal | Re-research | 2026-10-15 |

## Sources

Method is stated per source. WebFetch was not used for any quoted line; the vendor subagent's WebFetch output was discarded and every number re-fetched raw.

Primary, this Mac, 2026-10-01:

- `orca skills get orchestration` and `--full` - **[FULL - CLI, 197 and 795 lines, saved to scratchpad]**
- `orca skills get orca-cli` and `--full` - **[FULL - CLI, 248 and 409 lines]**
- `orca --help`, `orca orchestration --help`, `orca orchestration send --help` - **[FULL - CLI]**
- `orca status --json`, `automations list --json`, `automations runs`, `orchestration run-list --json`, `orchestration inbox --json`, `search --index-status --json`, `host list`, `environment list`, `worktree ps --json` - **[FULL - CLI, read-only]**
- `~/Library/Application Support/orca/orchestration.db` - **[FULL - `sqlite3 "file:...?mode=ro"`, `.tables`, `.schema messages`, counts, date range]**
- `~/Library/Application Support/orca/agent-hooks/` - **[PARTIAL - key names of `endpoint.env` read, values deliberately not; `spool/` listed; newest spool file was 0 lines]**
- `~/.claude/settings.json` - **[FULL - grepped for `orca`]**
- `~/bin/zj`, `zao-lanes`, `orca-board`, `fleet-watch.py`, `zao-tick`, `zao-agents`, `zao-lane-watch-all` - **[FULL - grepped for `orca ` calls]**
- `~/zao-vault/scripts/agent-msg.py` (548 lines), `lane-route.sh`, `status-page.py`, `~/bin/zorca`, `zao-lane-boot` - **[FULL - headers and command structure read]**
- `~/zao-vault/notes/orca-organization.md` (2,130 lines) - **[PARTIAL - first 120 lines and all headings read]**
- `~/zao-vault/handoffs/orchestration-seat-2026-09-30.md`, `projects/comms-layer-2026-09-30.md`, `inbox/agents/README.md`, `decisions/grill-2026-09-30-orchestration-afternoon.md` - **[FULL]**
- [Doc 2456](../../agents/2456-orchestrator-practice/), [Doc 2423](../../agents/2423-vault-as-transport-inter-terminal-context/) - **[FULL - read in full before writing]**; [Doc 2407](../2407-orca-tmux-lane-integration/), [Doc 2497](../../agents/2497-zorca-upgrades/) - **[PARTIAL - Key Decisions read]**

Vendor:

- [stablyai/orca](https://github.com/stablyai/orca) - **[FULL - `gh api repos`, LICENSE file decoded, releases list, contents of README.md, AGENTS.md, CLAUDE.md, orca.yaml, `skill-guides/` and `docs/` listings]**
- [v1.4.218 release notes](https://github.com/stablyai/orca/releases/tag/v1.4.218) - **[FULL - `gh api releases`, body saved]**
- [onorca.dev](https://www.onorca.dev/) - **[FULL - `curl` + HTML strip, HTTP 200, 11,501 chars]**
- [onorca.dev/docs](https://onorca.dev/docs) - **[PARTIAL - `curl` HTTP 200, 3,667 chars of index text; content pages read from the repo instead]**
- [docs/cli/orchestration.mdx](https://www.onorca.dev/docs/cli/orchestration), [cli/automations.mdx](https://www.onorca.dev/docs/cli/automations), [model/worktrees.mdx](https://www.onorca.dev/docs/model/worktrees), [agents/hooks-memory.mdx](https://www.onorca.dev/docs/agents/hooks-memory), [recipes/parallel-agents.mdx](https://www.onorca.dev/docs/recipes/parallel-agents) - **[FULL - `gh api contents` of `docs/site/content/docs/`, raw MDX]**; `cli/overview.mdx`, `model/agents-sessions.mdx`, `agents/session-history.mdx` - **[PARTIAL - fetched, not quoted]**
- [YC: Stably AI (Orca)](https://www.ycombinator.com/companies/stably-ai-orca) - **[FULL - `curl` + HTML strip, HTTP 200, 5,417 chars]**

Community:

- [HN 49612818 - Connecting the machines (herdr)](https://news.ycombinator.com/item?id=49612818) - **[FULL - Algolia items API, whole tree, 93 points, 35 comments]**
- [HN 49855391](https://news.ycombinator.com/item?id=49855391), [49663543](https://news.ycombinator.com/item?id=49663543), [49636239](https://news.ycombinator.com/item?id=49636239), [49111019](https://news.ycombinator.com/item?id=49111019) - **[FULL - Algolia items API]**
- [Issue #4376 Improved orchestration](https://github.com/stablyai/orca/issues/4376), [#15148 worker notifications](https://github.com/stablyai/orca/issues/15148), [#24288 session drops](https://github.com/stablyai/orca/issues/24288), [#24059 host load gate](https://github.com/stablyai/orca/pull/24059), [#22636 own address](https://github.com/stablyai/orca/pull/22636) (open, unmerged), [#12033 durable wake](https://github.com/stablyai/orca/pull/12033), [#9793](https://github.com/stablyai/orca/pull/9793) - **[FULL - `gh api issues` bodies and comments]**
- [D#22851 Who works on community PRs](https://github.com/stablyai/orca/discussions/22851), [D#23781](https://github.com/stablyai/orca/discussions/23781), [D#21391 Agents ignore Orca skills](https://github.com/stablyai/orca/discussions/21391), [D#24197](https://github.com/stablyai/orca/discussions/24197), [D#24045](https://github.com/stablyai/orca/discussions/24045) - **[FULL - `gh api graphql`, bodies and comments]**
- [dazzlog - Orca Is My Agent Development Environment Now](https://blog.dazzlog.de/posts/2026-08-23_orca-is-my-agent-development-environment/) - **[FULL - `curl` + HTML strip, HTTP 200, 15,478 chars]**
- [leodiegoo/orq](https://github.com/leodiegoo/orq), [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate), [t4ku/agent-skills orca-issue-orchestrator](https://github.com/t4ku/agent-skills), [kounoike/react-rich-media-hooks `.orca/task-pr-lifecycle.json`](https://github.com/kounoike/react-rich-media-hooks), [nvergez/orca-viz](https://github.com/nvergez/orca-viz), [shikihane/orca-osw](https://github.com/shikihane/orca-osw), [wilgon456/orca-agent-cleanup](https://github.com/wilgon456/orca-agent-cleanup), [jrgilbertson/the-rookery](https://github.com/jrgilbertson/the-rookery), [matpeltier/dark-kitchen-ai](https://github.com/matpeltier/dark-kitchen-ai) - **[FULL - `gh api repos` stats and `contents` decoded; licences from the API field only, not the LICENSE file - treat licence cells as classifier output]**
- [andrew.ooo review](https://andrew.ooo/posts/orca-stablyai-parallel-coding-agents-ide-review/) (2026-06-26), [ramonchancay](https://www.ramonchancay.me/blog/orca-parallel-coding-agent-fleet) (2026-07-06), [Rick Hightower substack](https://rickhigh.substack.com/p/orca-and-the-rise-of-the-agent-development) (2026-08-06), [apidog](https://apidog.com/blog/orca-parallel-ai-agents/) (2026-09-01), [aniketkarne](https://aniketkarneai.com/blog/2026-09-12-orca-ade-parallel-agent-worktrees-orchestration-dag) (2026-09-12), [olegdubovoi](https://olegdubovoi.com/thoughts/2026-09-26-orca-agent-development-environment-ade-for-shipping-with-coding-agents/) (2026-09-26) - **[FULL - `curl` + HTML strip, all HTTP 200]**
- [dev.to jamse_bao](https://dev.to/jamse_bao/inside-stablyaiorca-parallel-coding-agents-without-vendor-lock-in-pl3) (2026-09-03) - **[PARTIAL - fetched in full, 3,292 chars, but its quick start does not match the repo; used only as a star-velocity data point]**
- [makeuseof](https://www.makeuseof.com/stopped-running-one-coding-agent-trying-weird-new-ide/) (2026-09-30) - **[PARTIAL - `curl` HTTP 200 returned byline and date only, body is a JS shell; not escalated because six first-hand sources already cover the ground]**
- Reddit - **[FAILED - the community subagent's Arctic Shift searches for "Orca Stably" / "stably orca" returned no relevant posts; not re-run by hand]**
- X - **[FAILED - four tweet URLs are embedded on onorca.dev as testimonials (davidfano, eddiejaoude, EXM7777, goon_nguyen); not fetched; vendor-selected quotes would not have changed a verdict]**
- Discord - **[FAILED - link verified on onorca.dev; not joined]**
- Search instruments: `zao-research-index "orca"` (15 hits, 8 named in the brief confirmed), `gh search code "orca worktree create"` / `"orca orchestration worker-start"` / `"orca orchestration"` / `"orca terminal send"` across GitHub, `gh search code` within `bettercallzaal` and `ZAODEVZ` (only ZAOOS research docs use the CLI name), `zao-research-snapshot stablyai/orca`, `zao-tracker search orca`.

Two subagents were dispatched (vendor, community) with the real-fetches-only preamble. Their per-URL tables were used to find targets; every quoted line and number in this doc was re-fetched raw by the orchestrator, per `.claude/rules/research-grounding.md`.
