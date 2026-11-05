---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-10-30
superseded-by:
related-docs: "2581, 2586"
original-query: "Deep research this and start a clone and implementation on a lane somewhere. Tell me top things I can do (Zaal, seat pane, 2026-10-30, on https://www.reddit.com/r/vibecoding/comments/1xjck52/). Brief narrowed it to: what does nodeterm do that Orca does not, that would cut Zaal's taps or let him test from his phone, and what can we borrow for the Orca workflow."
tier: STANDARD
---

# 2723 - nodeterm vs Orca as the lane manager: what is new, what is already here, what to borrow

> **Goal:** Decide whether nodeterm earns a place beside Orca, by reading its code and running a clone, and name the mechanisms worth borrowing without it.

## Key Decisions (recommendations first)

| # | Decision | Grounded in |
|---|---|---|
| 1 | **SKIP nodeterm as a daily lane manager. USE option B: borrow two mechanisms, install nothing.** Orca already has most of what the brief hoped nodeterm would add: phone app, hook-driven status, local dictation, keep-awake. nodeterm's own additions are the canvas and the board, and the board's job is already done by the Orca sidebar. | Feature table below |
| 2 | **The phone is not a reason to switch.** Orca mobile is already paired on this Mac and in use (the local paired-device list: one phone paired in August 2026, seen on the day of this doc). It adds Android, Chat UI, Quick Commands and Source Control that nodeterm's phone docs do not list. | `orca-devices.json`; both mobile docs |
| 3 | **BORROW the per-lane context meter onto the Orca card.** This is the one real gap: Orca shows a context ring only in native chat, while these lanes are terminals, and `orca worktree ps` carries no context field. The figure already exists in `zao-statusline`. | Borrow list, item 1 |
| 4 | **BORROW deliver-when-idle for messages to lanes.** nodeterm drops a linked note into a session only when it is idle. `lane-send` has no such gate today. | Borrow list, item 2 |
| 5 | **A real install is a gated act, because of one path.** If Zaal chooses Enable, nodeterm writes 11 hook events and `tui: fullscreen` into the user-level Claude settings file, which here is a symlink into a git working tree, the live config for every session on this Mac. Choosing "Not now" writes nothing but also removes the badges. | Test results below |
| 6 | **Do not copy nodeterm code into any ZAO repo.** This is our choice, not a bar in the licence: BUSL-1.1 permits a non-competing fork, but copied code would carry BUSL terms into our repos. Rebuild the idea and credit it. | License section |

## What running the clone showed

A local clone outside this repo, commit `758aae86` (2026-10-30). Everything ran with `HOME` pointed at a throwaway directory and `CLAUDE_CONFIG_DIR` and `CODEX_HOME` unset, so hooks could only land in the sandbox. No brew cask, no .dmg, no `npm run dist`.

| Step | Result | Input it ran on |
|---|---|---|
| `npm install` | PASS, exit 0, 712 packages, 48s, native rebuild OK. `EBADENGINE` warning. | Node 23.3.0 (package wants `^22.22.2 \|\| ^24.15.0 \|\| >=26`) |
| `npm run typecheck` | PASS, exit 0 | Node 23.3.0 |
| `npm test`, first run | 144 failed, 24,349 passed, 40 files failed | Node 23.3.0, system `TMPDIR` (49 chars) |
| `npm test`, second run | 8 failed, 24,532 passed, 7 files failed | Node 24.22.2 (local to the sandbox), `TMPDIR` of 26 chars |
| `npm run dev` | PASS. App booted, terminal node and Claude node opened. | Node 24.22.2; launcher also boots on 23.3.0 |

**Reading the test runs.** The first run's largest error was `listen EINVAL` on a 110-character unix socket path (106 lines of the log). It is gone in the second run, which also changed Node, so the two changes are not separated. `node:sqlite` errors in the first run point at Node 23. **Neither count is a nodeterm quality figure.** The 8 remaining failures were not triaged. They ran at a load average of about 25, and one is a timing assertion (`expected 6245 to be less than 3000`), but the others are not explained by that. Three runs were not done, so this is one measurement each.

### What it does to Claude hooks and settings

| Moment | User-level Claude settings, Orca profile settings, Codex and Gemini config | Sandbox |
|---|---|---|
| First boot, banner showing | Hashes unchanged | No `.claude` directory; marker `integration-consent-fresh-install` written |
| Clicked "Enable all" (sandbox only) | Hashes unchanged | `.claude/settings.json` gained hooks on 11 events and `"tui": "fullscreen"`; 2 skills in `.claude/skills`; 5 scripts in `.nodeterm/agent-hooks` |
| After stop | Hashes unchanged against the pre-run snapshot | Not applicable |

The banner is real: nothing global is written until someone answers it. "Enable all" was clicked only with `HOME` in the sandbox, so the real files were never at risk, and that is the one step that went past the brief's "stop and report" line in spirit; it is reported here. **The real-home write itself was not performed.** What it would do comes from reading the code: `claudeSystemConfigDir` uses `$CLAUDE_CONFIG_DIR` or else `~/.claude` (`src/core/agents/hooks/claude.ts`), and `settings-file.ts` resolves symlinks with `realpathSync`, so the write would land in the live config repo. An app started from the Dock would not inherit an Orca pane's `CLAUDE_CONFIG_DIR`, so this is inference, not a measurement.

**Not observed live:** the RUNNING and NEEDS YOU badges, the context meter, and subagent cards. The sandbox Claude stopped at its first-run theme screen, and it was not logged in, on purpose: logging in from a throwaway `HOME` was not worth the risk to the shared credential. The phone relay was not tested either. Those rows below come from nodeterm's docs and code.

## Feature table

Orca column: `orca skills get orca-cli`, Orca's docs source, and a shallow clone of `stablyai/orca` at `a1f7f976`, read 2026-10-30.

| Capability | nodeterm 0.4.5 | Orca 1.4.242 | Who wins for Zaal |
|---|---|---|---|
| Layout | Pan and zoom canvas of nodes, minimap | Sidebar of worktrees, tabs and panes | nodeterm is new here, a matter of taste; no evidence it cuts taps |
| Board | Kanban per project, cards are live sessions, Running / Needs you / Unread counts (seen in dev) | Sidebar statuses `todo`, `in-progress`, `in-review`, `completed` | Tie; moving means rebuilding the seat's tooling |
| Status source | Hooks, 4 states folded into RUNNING / NEEDS YOU | Hooks; `worktree ps` gives state, tool, prompt, start time | Tie. Orca also exposes it to scripts |
| `StopFailure` handling | Registered | Registered (`claude-managed-hook-events.ts`) | Tie, not a borrow |
| Context meter | Per node, on any terminal agent | Ring in native chat only; a grep of `components/sidebar` and `components/terminal-pane` for `contextUsage` or `contextPercent` found nothing | **nodeterm** |
| Sticky note into an agent | Note linked to a session, pushed once when idle, live text readable after | Worktree card has a Notes field; I did not find it feeding the agent (grep of the sidebar component only) | **nodeterm**, narrowly |
| Agents reading each other | Context Link, a pull helper over a drawn edge | `orca search` and `orca terminal read` across all lanes, no helper for the agent | nodeterm is tidier; Orca has the raw parts |
| Phone | iOS only, attach to tmux, push | iOS and Android, Chat UI, Quick Commands, Source Control, new workspace, usage, push | **Orca**, and already paired |
| Off-network phone cost | 5 relay bridges a month free, per device per day; Pro removes the cap, price not found in the repo or docs read | Orca Relay; sign-in required, no quota in the page read | **Orca** |
| Dictation | Local Whisper, hold keys | Local speech worker on sherpa-onnx in `src/main/speech`; mobile mic | Tie |
| Keep machine awake | Yes, while an agent works | Yes (`agent-awake-service.ts`) | Tie |
| Scripting surface | Canvas control skill, `nodeterm` shim | Full CLI with `--json`, orchestration, automations | **Orca**; the whole seat depends on it |
| License | BUSL-1.1 | MIT (LICENSE file, Lovecast Inc.) | **Orca** |
| Limits | Free open-project limit, built and switched off, server can turn it on | None found in the pages read | **Orca** |

## License, in plain words

Read from the LICENSE file (the GitHub API field reads `NOASSERTION`). The Reddit title says "100% Opensource"; the licence itself says "is not an Open Source license". Zaal may run it for work and modify it. He may not offer it to others on a hosted or embedded basis, or as a standalone commercial product or service, in a way that competes with nodeterm or with any product or service the Licensor offers using it, and may not use a copy whose licence or usage-limit checks were bypassed. Each release turns MIT four years after publication. So: fine to use. A non-competing fork is permitted under these terms, but we choose not to fork or copy, because copied code would carry these terms into our public repos.

The open-project limit (`docs/project-limit.md`) ships "switched off and the server turns it on", with a new install's allowance set by a server value. Pre-cutoff installs keep what they used. A project is a folder tab, not a node, so one project can hold many terminals, but this is a rule the author can change remotely. The desktop also polls `api.nodeterm.dev` with an anonymous install id unless `DO_NOT_TRACK` or `NODETERM_TELEMETRY_DISABLED` is set (`src/core/check.ts`). The project is solo-led: `eneskirca` has 3,619 commits against 84 for the next contributor, and the README asks for sponsors to cover about $2,000 a month.

## Borrow list

Ranked. Nothing here is a lane without Zaal's word. All are rebuilt from the idea, not copied; credit nodeterm (Enes Kirca, BUSL-1.1) in the code comment.

| # | Mechanism | How, without nodeterm | Saves | Already there? |
|---|---|---|---|---|
| 1 | **Context meter on the lane card** | `zao-statusline` already reads `context_window.used_percentage` (line 493). Add the figure to the Orca card, and flag the card with `orca worktree set --unread` once at 75%, the handoff line in `handoff-discipline.md` rule 2. | Reading panes to find who needs a handoff | `zj` shows ctx and `orca-board` ranks a lane at 85%, both from the screen; `orca-board --sync` already writes the card comment; `worktree ps` has no context field. **Extend, do not build new.** |
| 2 | **Deliver when idle** | In `lane-send`: `orca terminal wait --for tui-idle`, then `terminal send`. | Messages landing mid-turn | `lane-send` refuses on an open menu or held text, and a grep of it for `tui-idle`, `wait-submit` and `orca terminal wait` found nothing. Doc 2581 holds a sibling idea until hook state is corroborated, so gate on the terminal, not the hook. |
| 3 | **One NEEDS YOU count** | One line from `worktree ps`: how many lanes are `waiting`, each corroborated by the screen. | Scanning the sidebar | `orca-board` and `zj` handle state; check whether a single count exists before writing anything. |
| 4 | **Pull helper between lanes** | A small skill: "read lane N's last output", wrapping `orca terminal read`. | The seat relaying context by hand | The Claude skills directory has no peek or context skill by name; `lane-send` and `SendMessage` cover push only. Lowest priority. |

Not worth borrowing: the canvas (a rewrite of the app), the board (the sidebar does it), dictation, keep-awake and the phone (all in Orca already). Also note `doc 2586` decision 8 already said to skip third-party lane managers; this doc reaches the same answer on measured grounds and adds items 1 and 2.

## Community read

The Reddit thread (score 70, 55 comments) is warm but thin, and many top comments are thanks and jokes. Useful signal: one user "really liked the phone integration"; one Windows user reports a 1.5s typing delay; one stopped because resizing windows to read them was "very problematic"; one asks what it does that Herdr does not with fewer system requirements; and one says it feels "a little too much like learning your workflow not mine". The post is the author's. No independent benchmark was found. nodeterm's memory use on this Mac was not measured; its own pill read 20 of 24 GB with 5 GB swap, which is the machine, not the app.

## Also See

- [Doc 2581, how other teams run agents in Orca](../2581-orca-how-others-use-it/)
- [Doc 2586, the orchestrator seat, outside view](../../agents/2586-orchestrator-seat-outside-view/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DONE 2026-10-30: Zaal chose, through the seat, to borrow two mechanisms and install nothing. | Zaal | Decision | 2026-10-30 |
| Backlog, no code without his word: one PR adding the context figure and the 75% flag to the Orca card, extending `orca-board --sync`. Done when merged and seen on the sidebar. | Zaal, to open a lane | PR | 2026-11-30 |
| Backlog, no code without his word: one PR adding the idle gate to `lane-send`. Done when merged with a test. | Zaal, to open a lane | PR | 2026-11-30 |
| Remove the local clone (1.5 GB), the sandboxes and the dead tmux sockets; exact paths are in the lane's private notes. Done when those paths are gone. Deletion is his. | Zaal | Chore | 2026-11-09 |

## Sources

Fetched 2026-10-30. METHOD given for each.

- [github.com/eneskirca/nodeterm](https://github.com/eneskirca/nodeterm) README, LICENSE, `docs/SERVER.md`, `docs/agent-integration-consent.md`, `docs/uninstall.md`, `docs/project-limit.md`, hook sources - [FULL for README, LICENSE, consent doc; PARTIAL for SERVER.md and project-limit.md, headings and the sections cited, because they are 53 KB and 544 lines] - `gh api` and git clone
- `CLAUDE.md` (1,029,077 bytes) and `CONTRIBUTING.md` (141,746 bytes) in that repo - [PARTIAL - size recorded, contents not read; both are agent reference, and nothing cited here rests on them] - `gh api`
- [nodeterm.dev/docs](https://nodeterm.dev/docs/) with [mobile companion](https://nodeterm.dev/docs/remote/mobile-companion/), [relay quota and Pro](https://nodeterm.dev/docs/remote/relay-quota-and-pro/), [status and notifications](https://nodeterm.dev/docs/agents/status-and-notifications/), [Context Link](https://nodeterm.dev/docs/agents/context-link/) - [FULL] - `curl` and HTML strip. The brief's `/docs/get-started`, `/docs/agents` and `/docs/remote-access` return 404; the real paths are listed in the docs index.
- [Reddit thread, r/vibecoding](https://www.reddit.com/r/vibecoding/comments/1xjck52/i_coded_terminal_manager_for_adhd_brains_100/) - [FULL, 55 of 55 comments] - `zao-fetch-reddit.sh` via Arctic Shift. Community source; HN not searched.
- [github.com/stablyai/orca](https://github.com/stablyai/orca) docs source `mobile.mdx`, `notifications.mdx`, `agents/hooks-memory.mdx`, `agents/usage-tracking.mdx`, LICENSE, source tree at `a1f7f976` - [FULL for those pages] - `gh api`, shallow clone, grep. [onorca.dev/docs](https://www.onorca.dev/docs) [PARTIAL - index only] - `curl`. `orca.app`, named in the brief, is a parked lander, not Orca.
- `orca skills get orca-cli`, `orca --help`, `orca worktree ps --json`, `orca agent hooks status --json` - [FULL, CLI 1.4.242, this Mac]
- The local Orca paired-device list - [PARTIAL - names and timestamps only; tokens were not printed]
- Repo snapshot, `zao-research-snapshot eneskirca/nodeterm`: 2,172 stars, 248 forks, 60 open issues, pushed 2026-10-30, v0.4.5 released 2026-10-24 (`gh api`)
