---
topic: agents
type: DECISION
status: active
last-validated: 2026-10-24
related-docs: [2703, 2704]
original-query: "we need another graphical way to see all my orca and claude code sessions like how they interact with each other what oens are moveing kinda like waht sims kinda games ppls are building witht their agents we just need it for my claude code sessiosn" (Zaal, relayed by the seat on 2026-10-24), then "i want a new visual front screen that i can see in orca and ill just open in the orcestrator as a browser or sometihng", then "are we building it can be sesnsiitive info its basially how ill see my agentic workflow lets build that, do deep research on this so many people on x and reddit made their own versions of this"
tier: DEEP
---

# 2714 - A live map of every Claude Code session, opened in Orca's own browser

Zaal wants one screen, open beside the seat inside Orca, that shows every session as a character or tile: who is working, who is waiting, who is stuck at a prompt, and who is messaging whom. This doc measures what this Mac already records, surveys what other people built (GitHub, X, Reddit, HN), and ends in a v1 spec. A build lane (agent-map) started from the early findings on 2026-10-24.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **BUILD our own small page. Fork nothing.** | None of the 20 tools surveyed below draws messages between sessions, and that is the part Zaal asked for ("how they interact with each other"). Every node, state and edge we need is already on disk here (section "What this Mac already records"). |
| 2 | **BORROW from pixel-agents (pixel-agents-hq/pixel-agents, MIT, 9,874 stars, pushed 2026-10-21).** Characters, speech bubbles for waiting and permission, a heuristic mode that reads transcripts without hooks. Credit it, copy no code unless its MIT notice travels with it. | It is the clear community favourite (the most-liked X post about it: 2,694 likes, 243,665 views). It is still per-workspace and has no message edges, so as a whole it does not fit. |
| 3 | **Do NOT run its hook installer, and do not adopt tools that run sessions for you** (arcane-agents, purplemux, vibe-kanban, opcode). | The hook installer edits Claude Code's own settings file, which is Zaal's. The others replace Orca as the terminal host instead of watching it. |
| 4 | **The page binds 127.0.0.1 only, never 0.0.0.0, never a tunnel, never published.** It may show sensitive detail because it is Zaal's own local view (his ruling, 2026-10-24), and it never reads secret files. | The sessions directory that lists every session also holds `<pid>.<hex>.key` files; those are credentials. Orca's runtime token never goes into the page. |
| 5 | **Open it with `orca tab create --url http://127.0.0.1:<port>/ --worktree path:<seat worktree>`.** One page that polls a JSON endpoint and redraws in place. | Proven on this Mac: Orca's built-in browser loaded a 127.0.0.1 page and its title was read back. dotfiles #445 measured that Orca's browser refuses a page's own move to a `file://` URL, so it must be served over http and never navigate. |

## What this Mac already records (measured 2026-10-24)

| Need | Source | Measured |
|---|---|---|
| **Nodes: every live session, with its name** | `~/Library/Application Support/orca/claude-profiles/<profile>/home/sessions/<pid>.json`: `name`, `status`, `statusUpdatedAt`, `pid`, `cwd`, `sessionId`, `startedAt`, `messagingSocketPath` | 26 files, every pid alive. Status counts: busy 3, idle 20, waiting 1, shell 2. Names match ListAgents (`messenger-69`, `merge-b0`). The only Claude profile on the Mac. |
| **Hook state badge** | `~/.claude/state/status-<session_id>.json`, written by `bin/zao-cc-state.sh` on every hook: WORKING, WAITING, BLOCKED, ENDED | 7,123 files, mostly stale (ENDED 3,944, WAITING 2,508, WORKING 668, BLOCKED 3), so it is a badge source, never the node list. |
| **Stuck at a permission prompt** | `orca terminal read --terminal <handle> --screen`, last lines contain "Do you want" | On 2026-10-23 at 21:00 EDT, 6 of 33 panes were stuck that way, and 4 still were the next morning. The hook file read WAITING for those, so the screen is the truth for this state. |
| **Orca pane, title and activity** | `orca terminal list --json`: `handle`, `worktreePath`, `title`, `lastOutputAt`, `preview` | 33 terminals listed on 2026-10-23. |
| **Edges: who messages whom** | Each received peer message is in the receiver's transcript (`~/.claude/projects/*/<sid>.jsonl`, a symlink tree, so walk it with `find -L`) as `"origin":{"kind":"peer","from":"uds:<socket>","verifiedPeerPid":N,"msg_id":...,"name":"<sender>"}` | Last 24 h, 135 transcripts: **4,894 messages across 430 sender-to-receiver pairs**. Top pairs: evaluator to orchestrator2 134, orchestrator2 to messenger 100, merge to messenger 100. |
| **Load meter** | `sysctl -n vm.loadavg vm.swapusage` | Read at 08:05 EDT: 1-minute 24.9, 5-minute 46.2, 15-minute 67.9. |

Two joins make this work. First, `from: "uds:<path>"` on an edge matches the sender's `messagingSocketPath`, which gives the sender's live name. The `origin.name` on old messages carries a restart suffix (`messenger-69` and `messenger-44` are one role; ZAOOS #4137). Second, `cwd` in the session file matches `worktreePath` in the Orca list, which pins each session to its pane.

**Already built, extend it:** `bin/orca-board` (1,661 lines, ranks panes and classifies WORKING, WAITING, BLOCKED, TRUST PROMPT from the screen), `bin/zj` (every lane, live-pid checked), `bin/zao-tab-state` (puts state in the Orca tab title), `bin/cockpit`, and dotfiles #667 (`zao-output`, a 60-second read-only screen, open). The new page should call orca-board's `classify()` logic rather than write a second screen parser.

## What other people built (GitHub, X, Reddit, HN)

Stars and last push from `gh api repos/<r>` on 2026-10-24. Licence read from each repo's LICENSE file, not the API field.

| Tool | Stars | Last push | Licence (file) | What it shows | How it reads state | Fit |
|---|---|---|---|---|---|---|
| pixel-agents-hq/pixel-agents (Pablo De Lucca) | 9,874 | 2026-10-21 | MIT | Pixel office, one character per Claude Code terminal, bubbles for waiting and permission, sub-agents | Its own hooks, or a heuristic scan of `~/.claude/projects/` JSONL; binds 127.0.0.1, `--no-terminal` watch-only | Best look; no edges, per-workspace, hook install edits settings |
| rolandal/pixel-agents-standalone | 55 | 2026-08-12 | MIT | The same office as a browser app on localhost:3456 | Watches `~/.claude/projects/` | Older fork of the above |
| alminisl/agent-office | 7 | 2026-09-30 | **no LICENSE file** (all rights reserved) | Pixel office, sub-agents ride the elevator to the parent's desk, 24 h timeline replay, PR list | `~/.claude/sessions` | Ideas only, no code |
| NosytLabs/agent-office | 17 | 2026-10-23 | MIT | Pixel floor: working, waiting, sub-agents | Its own ledger on 127.0.0.1:8113 | Built for Hermes and OpenCode |
| thomasrice/arcane-agents | 12 | 2026-10-08 | MIT | Party of pixel characters on a map, real terminal one click away | Runs agents in its own tmux server and SQLite | Replaces the host |
| thousandsky2024/claude-pixel-agent-web ("Claude Dungeon") | 17 | 2026-03-03 | MIT | Sessions as dungeon heroes | not read | Small |
| btw-hash/agent-dashboard | 0 | 2026-10-14 | MIT | Pixel office with zones over WebSocket | not read | Small |
| graykode/abtop | 3,772 | 2026-09-14 | MIT | "Like htop, but for AI coding agents": tokens, context, rate limits, child processes, ports | Local process and file state; "All read-only. No API keys." | Best non-visual monitor |
| minchenlee/c9watch | 135 | 2026-10-23 | MIT | Mac app plus a JSON CLI for every Claude Code, Codex, Cursor and Pi session | Discovers sessions wherever they were started | Closest in spirit to ours |
| damelLP/agent-tmux-monitor (ATM) | 9 | 2026-10-23 | MIT | Live TUI over tmux: status, context, cost | tmux | Terminal only |
| seunggabi/claude-dashboard | 38 | 2026-03-27 | MIT | k9s-style TUI | Process tree and tmux | Terminal only |
| 9018/purplemux | 0 | 2026-10-19 | MIT | Web multi-session terminal on localhost:8022 | Runs sessions in tmux | Replaces the host |
| disler/claude-code-hooks-multi-agent-observability | 1,552 | 2026-02-08 | **no LICENSE file** | Event stream of hook events: Bun, SQLite, WebSocket, Vue | HTTP POST from hooks; README asks for `ANTHROPIC_API_KEY` | Hooks plus a key; no |
| BloopAI/vibe-kanban | 28,445 | 2026-09-19 | Apache-2.0 | Kanban that runs coding agents | Runs them itself | Replaces the host |
| winfunc/opcode | 22,423 | 2026-09-18 | **AGPL-3.0** | Desktop GUI over `~/.claude/projects/` | Session files | Share-alike licence; no |
| kubony/claude-code-visualizer | 39 | 2026-09-19 | MIT | Graph of agents, skills and commands | `.claude/` config files | Config graph, not live |
| NirDiamant/claude-watch | 66 | 2026-10-22 | no LICENSE file | Project bubble graph | Hooks | No |
| waynedev9598/PixelHQ-bridge (PixelHQ) | 41 | 2026-01-30 | MIT | Pixel office on a phone app over local Wi-Fi | Session files, metadata only (vendor claim) | Phone, LAN |
| a16z-infra/ai-town | 10,697 | 2026-08-26 | MIT | The original agent town | Convex backend plus an LLM | Simulation, not a monitor |
| joonspk-research/generative_agents (Smallville) | 22,282 | 2024-08-05 | Apache-2.0 | The paper's town map and replay | Needs an OpenAI key | Simulation, not a monitor |

**What the crowd agrees on:** a character per session, three or four states, a bubble when the agent waits on you. **What none of the 20 surveyed does:** draw the messages between sessions, or join sessions to the terminal host they run in. That gap is the reason to build.

**Community signal, read raw:**

- X, all via FxTwitter (`zao-fetch-x.sh`), FULL: Om Patel, 14 Mar 2026, "someone built a VS code extension that turns your claude code agents into pixel art characters working in a little office", 2,694 likes, 80 replies, 243,665 views. GitHub Projects, 2 Mar 2026, "A pixel office for your AI crew: turn invisible work states into a cozy little space with characters, daily notes, and guest agents", 712 likes, 41,706 views. Vox, 23 Feb 2026, "pixel agents turns your claude code sessions into a tiny office sim", 55 likes, 19,506 views. christina, 5 Mar 2026, "every claude code terminal gets its own pixel character (!!), with live activity tracking", 39 likes.
- HN (Algolia API), FULL: several Show HN posts in this space, all small. "Pixel Agents - A pixel-art mission control for your Claude Code agents" (2026-09-16, 5 points, 3 comments); "Claude Dungeon - Visualize Claude Code sessions as pixel-art dungeon heroes" (2026-03-01, 1 point); "Arcane Agents - A visual control room for terminal AI agents" (2026-03-05, 4 points).
- Reddit (Arctic Shift archive API; direct reddit.com fetches are blocked from this Mac and the OAuth route has no credentials): six title searches across r/ClaudeAI and r/ClaudeCode since 1 Jan 2026 (pixel, office, visualize, dashboard) returned 147 unique posts. The on-topic ones all score in single digits. "made a little Claude Code mod that shows your subagents as pixel critters" (r/ClaudeCode, 2026-10-09, score 8): "If one needs your approval it pops a yellow question bubble". "Your Claude Code agents, but they live in a pixel-art dungeon" (r/ClaudeCode, 2026-10-09, score 3): "I got tired of jumping between terminals just to check which one was working, which one needed me, which one hit a session limit". Argus (r/ClaudeAI, 2026-05-18, score 6), a VS Code debugger that "Streams the JSONL transcripts". Three dashboard posts with matching titles ("I kept losing Claude Code sessions that were waiting on me in some terminal tab, so I built a d...", 2026-10-22; "Built a dashboard for Claude Code with Claude Code - it shows which session needs you", 2026-10-18; "a free, local voice + status dashboard for running many Claude Code sessions at once", 2026-10-20) have bodies that read "[removed]", so only their titles count. The highest-scoring "pixel" posts (614 and 415) are a game and a usage widget, not session viewers.

Reading: the idea is popular to look at (the X numbers) and crowded to build (12 of the 20 repos above have under 100 stars). Building our own small page is normal here, not a detour.

## v1 spec (for the agent-map lane)

**One command, one page, one port.** `zao-agent-map` starts a server on `127.0.0.1:7461` (refuses to start if asked for any other host) and prints the `orca tab create` line for the seat's worktree.

**Data, refreshed every 5 seconds, all server side, read only:**

1. Nodes from `sessions/*.json` (glob `*.json` only, never `*.key`), pid checked alive.
2. Orca join on `cwd` to `worktreePath` from `orca terminal list --json`, for the pane title and `lastOutputAt`.
3. Stuck-at-prompt from `orca terminal read --screen` tail, reusing orca-board's `classify()`. Run it only on panes whose status is waiting or idle, to keep it light.
4. Hook badge from `~/.claude/state/status-<sessionId>.json` when fresh.
5. Edges from transcripts: only files modified in the last 30 minutes, scanned incrementally by byte offset, so a refresh reads only new lines. Count messages per pair over a sliding 30 minutes, joined on `messagingSocketPath`.
6. Load from `sysctl` (1, 5 and 15 minutes, plus swap).

**States drawn:** working (busy, or hook WORKING), waiting on Zaal, **blocked at a prompt** (loudest colour; the one state that needs his hand), idle, shell (no Claude running), ended. Each character's label is the role name with the restart suffix stripped, plus the time in its state.

**Edges drawn:** a line per pair with traffic in the window. Thickness is the message count; a dot travels the line for each new message, so "who is moving" is visible.

**Layout:** helpers (seat, messenger, merge, evaluator, grill) in the middle and lanes around them, grouped by repo. A load meter in the corner; at 1-minute load 20 or more it turns amber, because the estate's own rule holds local tests then (AGENTS.md rule 21).

**Rules the page must keep:**

- 127.0.0.1 only. Never serve files from disk by path, only the JSON it builds.
- Never read `*.key`, `~/.zao/private/`, `.env`, or the Orca runtime token.
- No buttons that act: no send, no kill, no approve. A click may copy a `orca terminal switch --terminal <handle>` line, nothing more.
- Single-user, local, unpublished. Sensitive detail (pane previews, prompts) is allowed on screen, by Zaal's ruling, because nothing leaves the Mac.

**Done when:** the page opens in an Orca tab next to the seat; the 26 sessions on screen match ListAgents by name; a pane stuck at a "Do you want" prompt shows as blocked within one refresh; sending a peer message makes its edge pulse within 10 seconds; `lsof -iTCP -sTCP:LISTEN` shows the port on 127.0.0.1 only.

## Next actions

| Action | Owner | Where |
|---|---|---|
| Build v1 to the spec above, PR-only | agent-map lane | zaal-dotfiles, `bin/zao-agent-map` and its test |
| Reuse `classify()` from `bin/orca-board` rather than a second parser | agent-map lane | zaal-dotfiles |
| Decide whether pixel-art characters are wanted in v1 or a later skin (credit pixel-agents, MIT, if its sprites or ideas are used) | Zaal | the grill |
| Re-run the one rate-limited Reddit query (r/ClaudeCode "dashboard") | quidli | this doc |

## Sources

- [FULL] This Mac, 2026-10-23 and 2026-10-24: `sessions/*.json` (26 files, fields and status counts), `~/.claude/state/status-*.json` (7,123 files), `orca terminal list --json` and `read --screen` (33 panes), transcripts walked with `find -L` (135 files, 4,894 peer messages), `sysctl`.
- [FULL] Orca 1.4.239 CLI: `orca tab create --help`, `orca skills get orca-cli` ("Built-In Browser" section and `references/browser.md`), and a live probe: a 127.0.0.1:7461 page opened with `orca tab create`, read back with `orca tab list` and `orca snapshot`, then closed.
- [FULL] zaal-dotfiles #445 body (Orca's browser refuses `file://` navigation), via `gh pr view`.
- [FULL] GitHub REST API (`gh api repos/<r>`, `/readme`, `/license`) for the 20 repos in the table, 2026-10-24.
- [FULL] https://registry.npmjs.org/pixel-agents/latest (curl): version 1.5.0, MIT.
- [FULL] X posts via api.fxtwitter.com (`zao-fetch-x.sh`): https://x.com/om_patel5/status/2032644304036835794, https://x.com/GithubProjects/status/2028493061865734655, https://x.com/Voxyz_ai/status/2025933528509403182, https://x.com/cszhu/status/2029608780342890984
- [FULL] https://hn.algolia.com/api/v1/search?query=pixel%20agents%20claude%20code&tags=story (curl, raw JSON).
- [PARTIAL - one of seven queries (r/ClaudeCode "dashboard") stayed rate-limited after three tries; three post bodies removed by Reddit] https://arctic-shift.photon-reddit.com/api/posts/search (curl, raw JSON, 2026-10-24): posts 1x1rci2, 1x1r4lb, 1tgj45v, 1xcl9m7, 1x960hm, 1xahn23. Direct reddit.com fetches FAILED: `zao-fetch-reddit.sh` reports "reddit blocked on every automated path" with no OAuth credentials on this Mac.
- [FAILED - repo 404 via the GitHub API] Ctrl/Cubicles (bulletproof-sh/ctrl), seen only as a VS Code Marketplace listing.
- Search used for triage only (not quoted): WebSearch, for X and Reddit thread URLs and tool names.

Credit: pixel-agents by Pablo De Lucca (MIT); character art in pixel-agents is credited by its README to JIK-A-4, Metro City; abtop by Tae Hwan Jung (MIT); c9watch by minchenlee (MIT); AI Town by a16z-infra (MIT); Generative Agents by Joon Sung Park et al. (Apache-2.0).
