---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "2675, 2672"
original-query: "lets spend some time on the orchestrator reviewing orca best practices how im using orca and make some upgrades"
tier: STANDARD
---

# 2677 - Orca: what it offers, how we use it, and what to upgrade

> **Goal:** Compare Orca's real feature set (docs, changelog, CLI) with how this estate uses it on 2026-10-14, and rank upgrades by four aims: fewer idle wake-ups, lane state read correctly, one place to see the nine slots, and automations instead of loops.

Asked by Zaal on 2026-10-14 through the orchestrator2 seat. Orca 1.4.224 (app, CLI and runtime all report 1.4.224), MIT licence (LICENSE file, Lovecast Inc.), github.com/stablyai/orca. Every count below was measured on 2026-10-14 from the CLI with `--json`.

## Key Decisions

| # | Decision | The evidence |
|---|---|---|
| 1 | **FIXED: orca-board read the status line as a question.** PR zaal-dotfiles#528. | The status line's third row ends `\| PRs 16, oldest 18d \| 10 idle \| gh?`, and `classify()` matched `PRs 16, oldest 18d \| 10 idle \| gh?` as a question. **16** lanes read `asked-question` before the fix, **11** of them with that exact text, while `orca worktree ps` reported 16 agents `done`, 3 `working` and none `waiting`. After the fix: **7**, all real questions. The new test fails against the old file and passes with the fix. |
| 2 | **ASK Zaal: run the seat in the same permission mode as the lanes.** | Claude Code holds a cross-session message for the user's approval when the sender runs in a different permission mode, and may let it expire (SendMessage tool contract). The seat runs `bypass`; **16** of the 24 rows on the board run `auto`, **3** `bypass`, **5** have no mode (bare shells). So most of the seat's messages cross a mode boundary. This explains the expiring messages the seat reported. |
| 3 | **REPLACE polling loops with Orca automations that use `--precheck`.** Start with the existing `fleet-health` automation, disabled since its last run on 2026-09-09. | The docs say a precheck is "a cheap shell probe": when it exits non-zero, "a skipped run" is recorded and no agent starts. A quiet tick then costs no tokens, where a `/loop` tick costs a full turn (`.claude/rules/agent-spend.md`). `scripts/fleet-health.sh` cannot be the precheck as it stands, for two reasons. Its exits are 0 (all clear), 1 (a lane needs a human), 2 (board unreadable; its header says "the caller should not alarm on 2") and 4 (the vault commit failed), so a negated exit would start an agent on 2 and 4 as well. And every run writes `handoffs/FLEET-HEALTH.md` and commits it to vault main, so an hourly precheck would commit hourly. **The precheck needs a read-only `--check` mode first**: it computes the lane states, writes nothing, and exits 0, 1 or 2. The automation then uses `--precheck 'bash scripts/fleet-health.sh --check; [ $? -eq 1 ]'`, so only exit 1 starts an agent, and exit 2 logs a skipped run and stops. Enabling it changes a live job that can message Zaal, so it is his call (question 2). |
| 4 | **USE Orca's own state for lane state, and the screen only for the question text.** | `orca worktree ps --json` carries hook-fed state per agent (`working`, `waiting`, `done`) with `stateStartedAt`. orca-board already reads it (`agent_states()`), but only lets it override a screen reading of `idle-done`. Decision 1 shows the screen was wrong in the other direction. Keep the hook state as a column and flag any row where screen and hooks disagree. |
| 5 | **ASK Zaal: turn on Orca's Agent Dashboard (Settings > Experimental) as the one place to see the nine slots.** | The docs describe a kanban across worktrees with Needs You, Working, Done and Idle columns, driven by the same hooks, filterable by workspace status. Today two boards cover the same lanes: `orca-board` (24 rows, with a `slot` column) and `zj` (19 Orca rows). Both are ours to maintain. It is a settings toggle, so it is Zaal's. |
| 6 | **DO NOT count on Orca to switch Claude accounts for a running pane.** | `orca account select` accepts only `opencode` or `devin` (its `--help`). The v1.4.223 notes list "Claude account profiles" as groundwork "not switched on yet". Upstream issue stablyai/orca#19900 (reported 2026-09-10 on Orca 1.4.197) says a switch has no effect on a running session, because every pane shares one credential file. A later commenter, not the reporter, adds on 2026-10-13 that a switch "only reaches the next `claude` you start". A contributor, not a maintainer, replied "looking into it" on 2026-09-11. This supports doc 2675: fix the account when the pane launches. |
| 7 | **SKIP agent hibernation for cost.** | It pauses a finished agent's terminal after an idle window (default 30 minutes) to save memory, and resumes it with `claude --resume`. It does not cut tokens. The cost comes from waking an idle session with a large context (doc 2672). |
| 8 | **SKIP Orca orchestration runs for now.** | 2 runs exist, last updated 2026-08-27. The docs mark orchestration experimental and say `coordinator-start` / `coordinator-stop` "perform no effects". Our coordination runs through SendMessage and the vault. |

## 1. What Orca offers that we do not use

| Feature | What it does (Orca docs, fetched raw) | Our use, measured 2026-10-14 |
|---|---|---|
| Scheduled automations | Run a prompt on a preset, cron or RRULE schedule with any agent. `--precheck` skips the run when a shell probe fails; `--workspace-mode existing\|new-per-run` | 1 automation, `fleet-health`, hourly, Claude, **disabled**, last run 2026-09-09 |
| Worktree checkpoints | `orca worktree set --comment ... --workspace-status todo\|in-progress\|in-review\|completed`: a status field agents update themselves | Partly. 29 of 66 worktrees have a comment, and `orca-board --sync` writes status (dotfiles #491). Most lanes put their status in the display name instead: 9 of 66 use "N name - status", plus a "(waiting)" prefix |
| Worktree lineage | Parent and child worktrees; "Sleep with Descendants" | 15 of 66 worktrees have a parent. Not read by any of our tools |
| `orca terminal wait --for tui-idle` | Blocks until an agent's TUI is idle | Not used. Our tools poll screens instead |
| Agent status hooks | Orca-managed hooks report working, waiting and done; they survive an app restart through `{userData}/agent-hooks/endpoint.env` | Installed, and read by orca-board only as a fallback |
| Agent Dashboard (experimental) | Kanban: Needs You, Working, Done, Idle | Off |
| Agents feed | Threaded feed of completions, blocking questions and response previews across worktrees | Not part of our routine |
| Usage roster | Status-bar usage per provider: 5-hour, weekly and Fable windows, with a warning at 80% | Available. Not referenced in our rules |
| Account select | `orca account add\|list\|select`. **Claude: add and list only**; select is OpenCode and Devin | 3 Claude accounts registered on this host |
| Project host setups, environments | Run worktrees or automations on a named host; pair a remote Orca runtime | 1 host (this Mac), 0 environments, 28 projects |
| Agent hibernation (experimental) | Pause finished background agents after an idle window, resume on open | Off. Saves memory, not tokens (decision 7) |

## 2. How we use it today

| Measure | Value | Read from |
|---|---|---|
| Worktrees | 66 (28 main checkouts, 38 linked); 0 archived, 0 pinned | `orca worktree list --json` |
| Worktree activity | 22 active within a day, 32 within 1 to 7 days, 8 within 7 to 30, 4 older | same |
| Workspace status field | 34 completed, 17 in-progress, 15 todo | same |
| Terminals | 22, all connected, 0 orphaned; 19 recognised as Claude | `orca terminal list --json` |
| Agent state per hooks | 16 done, 3 working | `orca worktree ps --json` |
| orca-board before the fix | 16 asked-question, 3 bare-shell, 2 working; every state from the screen | `orca-board --json` |
| orca-board after the fix | 10 waiting, 7 asked-question, 5 bare-shell, 2 working | the fixed file, run live |
| Permission modes on the board | 16 auto, 3 bypass, 5 none | `orca-board --json`, field `mode` |
| Nine numbered slots | 9 of 66 worktrees named "N name - status"; slot 0 is the seat and its children | display names |

**One more fault found, not fixed here.** orca-board's own live test "every live lane resolves to exactly one session" reads **0 of 22** on `main`, before and after the fix. It checks how the board maps a lane to its Claude session so it can re-derive the context number from the transcript. On 2026-10-14 that mapping resolves no lane at all. It needs its own card and PR.

**Worktree cleanup candidates, for Zaal only.** Nothing was removed. All 12 worktrees idle 7 or more days with no live terminal are main checkouts of a repo, not lane worktrees: ZAOOS (40 days), zaalvoice, zabalgames, cocconcertz (30 each), zol (26), zorca (22), zao-papers, wwtracker, zaalcaster (16 each), zao-media (10), zao-fractal-bot (9), zao-vault (7). Removing a main checkout from Orca's sidebar is a choice about what he wants to see, not cleanup. None of the 38 linked worktrees has been idle 7 days with no terminal.

## 3. Upgrades, ranked

| Rank | Upgrade | Aim | File it touches | State |
|---|---|---|---|---|
| 1 | Status line below the prompt is not a question | lane state | `zaal-dotfiles/bin/orca-board`, `bin/orca-board-test` | **PR #528**, hold, evaluator-80 |
| 2 | Seat runs in the lanes' permission mode, so its messages are not held or expired | fewer lost messages | how the seat pane is launched in Orca (Settings > Agents launch arguments, or the pane's mode) | Zaal's (question 1) |
| 3 | Add a read-only `--check` mode to `fleet-health.sh` (writes nothing, exits 0/1/2), then re-enable the `fleet-health` automation with `--precheck 'bash scripts/fleet-health.sh --check; [ $? -eq 1 ]'`, replacing an hourly seat check | automations instead of loops; fewer wake-ups | `zao-vault/scripts/fleet-health.sh`, then the Orca automation `fleet-health` (`orca automations edit`) | `--check`: a vault PR. Enabling: Zaal's (question 2) |
| 4 | Show the hook state beside the screen state, and flag a disagreement | lane state | `zaal-dotfiles/bin/orca-board` (`agent_states`, `hook_override`) | next PR after #528 |
| 5 | Fix the 0-of-22 session resolution | lane state (context number) | `zaal-dotfiles/bin/orca-board` (`_sessions_for`) | card, then PR |
| 6 | Agent Dashboard as the single view of the nine slots | one place | Orca Settings > Experimental | Zaal's (question 3) |
| 7 | Lanes write status with `orca worktree set --comment` instead of renaming the pane | one place; less churn | `zorca/PLAYBOOK.md` conventions section | doc PR in zorca after Zaal answers question 3 |

## Questions for Zaal (inline, pick first)

1. **The seat runs in bypass mode and most lanes in auto, so its messages can be held or expire.** A) Restart the seat in auto mode (recommended: it matches 16 of 19 lanes). B) Keep bypass and move the lanes to bypass. C) Leave it.
2. **Once `fleet-health.sh` has its read-only `--check` mode, re-enable the `fleet-health` automation so it starts an agent only when a lane needs you?** The check writes nothing and commits nothing. When a lane does need you, the agent run writes `handoffs/FLEET-HEALTH.md`, commits it to vault main, and sends you one short message naming those lanes. A) Yes, hourly (recommended: a quiet hour costs nothing). B) Yes, every 3 hours. C) No.
3. **Turn on Orca's Agent Dashboard as the one view of the nine slots?** A) Yes, keep orca-board for the seat's own use (recommended). B) No, orca-board stays the one view. C) Try it for a week, then decide.

## Also See

- [Doc 2675](../2675-claude-rate-limit-multi-tool-routing/) - running two Claude plans; why the account is fixed at launch
- [Doc 2672](../2672-model-tier-routing-cost-per-merged-pr/) - waking an idle large-context session is the cost to cut
- `~/Documents/zorca/PLAYBOOK.md` - the operating loop and conventions this doc updates
- zaal-dotfiles #491 (`orca-board --sync`), #521 (`orca-board --table`), #528 (this doc's fix)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review and merge zaal-dotfiles #528 | evaluator-80, then the merge lane | PR | After review |
| Answer questions 1 to 3 | Zaal, through the seat | Decision | When convenient |
| Add the read-only `--check` mode to `scripts/fleet-health.sh` | repo-refresh lane | vault PR | Before question 2 is answered |
| Card and PR for the 0-of-22 session resolution | repo-refresh lane | PR | After #528 |
| orca-board: hook state column and disagreement flag | repo-refresh lane | PR | After #528 |
| zorca PLAYBOOK: status through `worktree set --comment` | repo-refresh lane | PR | After question 3 |

## Sources

- [Orca docs: Scheduled automations](https://www.onorca.dev/docs/cli/automations) [FULL - curl and HTML strip]
- [Orca docs: Orchestration](https://www.onorca.dev/docs/cli/orchestration) [FULL - curl and HTML strip]
- [Orca docs: Worktree checkpoints](https://www.onorca.dev/docs/cli/worktree-checkpoints) [FULL - curl and HTML strip]
- [Orca docs: Agents and sessions, Agent Dashboard](https://www.onorca.dev/docs/model/agents-sessions) [FULL - curl and HTML strip]
- [Orca docs: Agent hibernation](https://www.onorca.dev/docs/agents/hibernation) [FULL - curl and HTML strip]
- [Orca docs: Agent hooks and memory](https://www.onorca.dev/docs/agents/hooks-memory) [FULL - curl and HTML strip]
- [Orca docs: Usage and rate-limit tracking](https://www.onorca.dev/docs/agents/usage-tracking) [FULL - curl and HTML strip]
- [Orca docs: Notifications and Inbox](https://www.onorca.dev/docs/notifications) [FULL - curl and HTML strip]
- [Orca docs: Agents feed](https://www.onorca.dev/docs/activity) [FULL - curl and HTML strip]
- [Orca docs: Worktrees, parallel agents, Claude Code](https://www.onorca.dev/docs/model/worktrees) [PARTIAL - fetched with recipes/parallel-agents and agents/claude-code; skimmed, not quoted]
- [Orca v1.4.224 release notes](https://github.com/stablyai/orca/releases/tag/v1.4.224) [PARTIAL - gh api; headings and known issues read, 42,015 characters, not every line]
- [Orca v1.4.223 release notes](https://github.com/stablyai/orca/releases/tag/v1.4.223) [PARTIAL - gh api; grepped for accounts, automations, orchestration, status]
- [stablyai/orca repository](https://github.com/stablyai/orca) [FULL for licence and metadata - LICENSE file read: MIT; 92,219 stars and 8,292 open issues on 2026-10-14]
- [stablyai/orca#19900: Claude account switch does not reach a running session](https://github.com/stablyai/orca/issues/19900) [FULL - gh api, body and both comments; the reporter, a later commenter (2026-10-13) and a contributor reply are told apart above]
- Orca `llms.txt` [FAILED - https://onorca.dev/llms.txt returned 404; docs pages fetched one by one instead]
- Local, 2026-10-14: `orca --help` and `--help` for all 146 subcommands; `orca status`, `worktree list`, `worktree ps`, `terminal list`, `automations list`, `project list`, `host list`, `environment list`, `orchestration run-list`, each with `--json`; `orca-board --json` before and after the fix; `zj -l`; `~/Documents/zorca/PLAYBOOK.md`; `bin/orca-board` source
