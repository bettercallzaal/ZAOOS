---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "agents/2703-seat-routing-table-and-restart, agents/2647-seat-loop-effectiveness, agents/2641-orchestrator-seat-measured-dispatch"
original-query: "dont close lanes yet, can we optimize for not closing lanes but keeping them idle, can offload the memory somehow; then: as soon as a lane goes idle just drop its usage and have it come back as soon as its called on again as quickly as possible, like turn off and on to save compute, memory etc (Zaal, 23 Oct 2026, relayed by the seat orchestrator2-ee, which set the DEEP scope: baseline, sleep options, wake path, never-sleep list, prior art, one design with numbers and a red-control test plan)"
tier: DEEP
---

# 2704 - Lanes that sleep when idle and wake when called: measured on this Mac

> **Goal:** Make an idle lane cost (nearly) nothing and come back fast when a message, an Orca send or Zaal's keystroke arrives, keeping its pane and its conversation. Measure the baseline and every sleep option on this Mac, then recommend one design with numbers and a red-control test plan. Nothing is built here.

## Key Decisions

| # | Decision | Why (measured here, or fetched) |
|---|---|---|
| 1 | **The idle cost is memory, not CPU. USE "sleep = exit the process, keep the pane and the transcript; wake = `claude --resume <session id>`".** | 26 `claude` processes at 07:02 EDT held **6.47 GiB** RSS themselves and **9.97 GiB with their child trees** (median 219 MB per process, 328 MB per tree, 17 children). Idle CPU is near zero: `top`'s second sample gave a **median 0.9 percent** per `claude` process, 19 of 26 at or under 1 percent, and the 65 `node` children 0.0 in total. Exit frees the whole tree; the transcript keeps the conversation (Claude Code docs: a resumed session restores "the messages, tool calls, and results"). Wake measured at **4 to 6 s of start-up**, 7.8 to 10.1 s send-to-answer, on a loaded Mac (Part 3). |
| 2 | **SKIP SIGSTOP for any lane that receives messages.** | On a 120 MB toy process with a unix socket and one child: macOS cut its RSS from **169.4 to 33.4 MB** after 60 s stopped (it does reclaim), but **the child kept running** (state `SN`), **a request to the stopped socket hung and timed out at 5,002 ms** instead of failing, and on SIGCONT the stale request was delivered late to a client that had already given up. SendMessage needs a fast refusal, not a silent hang. |
| 3 | **USE a doorbell owned by an always-on helper (the messenger): a sleeping lane is a row in a sleep registry, and the first message to it resumes it, then delivers.** | A sleeping (exited) session has no socket, so SendMessage fails fast with "No agent named ... is reachable" (seen at 10:40Z on 23 Oct for `messenger-e0`). That failure is the doorbell signal: the sender, or the messenger on its behalf, runs the resume from the registry, waits for the session to come back, and resends. |
| 4 | **Never sleep: the seat, messenger, grill-sweep, the merge lane, and any lane with a Monitor, a ScheduleWakeup loop, a session cron or Remote Control in use.** | Those die with the process: the merge watcher died in the 06:26 reboot (doc 2703), and Remote Control needs the process ("Claude keeps running locally the entire time", Claude Code docs). |
| 5 | **Independent of sleep, and Zaal's settings change: deny the three plugin MCP servers that had zero calls in 7 days.** Recipe in Part 5. | Across 105 transcripts of the last 7 days: `memory` 0 calls, `sequential-thinking` 0, `github` 0 (control: 31,616 Bash calls counted the same way). Those three run **104 processes, 623 MB** across 26 sessions now. |
| 6 | **The first trigger for sleep is the `idle_prompt` Notification hook, plus a minimum idle time; not a guess from the screen.** | The hooks reference lists `idle_prompt` as a Notification type; SessionStart hooks "run again on resume with source set to `resume`", so a woken lane can reload its state. |

## Part 1. Baseline on this Mac (23 Oct 2026, 07:02 to 07:20 EDT)

**Memory.** `ps -axo pid,ppid,rss,comm`, every `claude` process and its whole child tree:

| Measure | Value |
|---|---|
| `claude` processes | 26 |
| RSS, `claude` processes alone | 6.47 GiB (median 219 MB, min 7, max 481) |
| RSS with child trees | 9.97 GiB (median 328 MB per session) |
| Children per session | median 17, max 27 |
| Swap (`sysctl vm.swapusage`) | 7.63 of 8.19 GB used at 07:02; the system grew the swap file to 15.36 GB by 07:20 |
| `vm_stat` | 567,526 pages in the compressor (16 KiB pages, about 8.7 GiB); swapouts 680,208 since boot at 06:26 |

**MCP servers per session**, children grouped by the server they run (RSS summed across the fleet):

| Server | Processes | Fleet RSS | Per session | Tool calls, 7 days |
|---|---|---|---|---|
| serena | 114 | 666 MB | 25.6 MB | not counted |
| context7 | 42 | 257 MB | 9.9 MB | 5 (standalone) / 0 (plugin copy) |
| playwright | 40 | 245 MB | 9.4 MB | 0 (plugin copy) |
| workspace-mcp (gdocs) | 26 | 246 MB | 9.5 MB | not counted |
| memory (plugin) | 36 | 211 MB | 8.1 MB | **0** |
| github (plugin) | 34 | 206 MB | 7.9 MB | **0** |
| sequential-thinking (plugin) | 34 | 206 MB | 7.9 MB | **0** |
| gitnexus | 22 | 166 MB | 6.4 MB | not counted |

One transient: two everything-claude-code hook runners (`scripts/hooks/run-with-flags.js`) under the seat's session held a 3,220 MB subtree in one snapshot and had exited a minute later. The cause is UNVERIFIED; the seat's transcript is 333 MB.

**CPU.** `top -l 2 -s 3`, second sample. Claude Code's process shows in `top` as its version, `2.1.309`, not as "claude", so a name filter finds nothing; rows were matched by PID. Median 0.9 percent per `claude`, sum 31.6, max 8.0; 19 of 26 at or under 1 percent. The machine's load was 60 in that sample, from other work.

**What the community and the tracker report.** The same shape on other Macs: "Each idle session costs about 0.5 GB." and "The process counts track the number of live sessions almost exactly: one `claude` and one copy of each MCP server per session, whether or not the session had been used in days." (anthropics/claude-code #103693, opened 2026-10-20, reporter's own figures). Lazy MCP start is an open request, not a feature: "all of them connect at session startup regardless of whether they'll be used" (#63251, open).

## Part 2. The sleep options, measured

**(a) Exit, then `claude --resume <session id>`.** Frees the process and every child. The transcript keeps the conversation: "the resumed session restores the conversation along with the state saved in it: Conversation history: the messages, tool calls, and results", and after a compaction it opens at the compaction summary; a tool interrupted mid-call is marked cut off, not rerun; the model and agent carry over (Claude Code docs, sessions). The permission mode is restored for a terminal `claude --resume <session-id>` (same page). Lost: anything the process itself was running (Monitor scripts, ScheduleWakeup timers, session crons, background shells) and a live Remote Control bridge. Wake cost: Part 3.

**(b) SIGSTOP / SIGCONT.** Measured on a toy process (Node 23.3.0, 120 MB of touched heap, a unix socket answering "pong", one child), script in the Method section:

| Step | Result |
|---|---|
| RSS running | 169.4 MB |
| Request while running | connected 0.1 ms, reply 1.5 ms |
| SIGSTOP the parent only | parent `TN`, **child still `SN` (running)** |
| Request while stopped | **hung, timed out at 5,002 ms** |
| RSS at 60 s and 180 s stopped | 33.4 MB and 33.4 MB (80 percent reclaimed under today's pressure) |
| SIGCONT, request again | the stale, timed-out request was processed first; the toy server then crashed on EPIPE writing to the closed client |

So stopping does free memory on macOS, but only the stopped process's (its MCP children need the whole process group stopped), it moves pages into swap that is already full, and it turns a message to the lane into a 5-second hang and a late, out-of-order delivery. Remote Control's bridge would stall the same way.

**(c) An Orca-native suspend.** None found: `orca --help` lists no suspend, hibernate, sleep or pause command (agent launch, orchestration send, terminal create/send/close/read/wait). What Orca does have, measured in doc 2703, is restore: after a restart it relaunches the agent (`claude --resume <id>` or `claude --continue`) in every `in-progress` workspace and in no `completed` one. That restore path is the same wake mechanism this design uses.

**(d) Fewer MCP servers per session.** No shared or lazy mode ships today (#63251 open). Proxies that put stdio servers behind one HTTP endpoint exist (sparfenyuk/mcp-proxy, MIT; tbxark/mcp-proxy, MIT, "aggregates multiple MCP servers behind a single HTTP entrypoint"; supergateway, MIT), but none of their READMEs shows a measured saving for many clients, so that is a separate experiment. The certain saving is to stop the servers nobody calls (decision 5).

## Part 3. Wake cost: exit plus resume, measured

**Method.** In a scratch directory, three cold `claude -p` runs, then three `claude -p --resume <id>` runs on the first run's session, each answering "Reply with the single word ok." on Haiku, Claude Code 2.1.309, with `--output-format json`. Headless `-p` is a proxy for an interactive resume: the same process start, plugins and MCP servers, without the TUI. The run was gated in the same command on a 1-minute load under 20 (it read 18.66), but the 5-minute load was 51, so these figures are pessimistic.

| Run | Wall | Turn (`duration_ms`) | Wall minus turn (start-up before the turn) | Cost |
|---|---|---|---|---|
| Cold 1 / 2 / 3 | 8.2 / 7.8 / 6.9 s | 3.6 / 3.2 / 3.2 s | 4.6 / 4.6 / 3.7 s | $0.009 / $0.006 / $0.006 |
| Resume 1 / 2 / 3 | 7.8 / 10.1 / 9.2 s | 3.1 / 5.0 / 3.7 s | 4.7 / 5.1 / 5.6 s | $0.016 / $0.018 / $0.018 |

**Read:** waking a lane costs about **4 to 6 seconds of start-up** before it works, on a loaded machine, plus the turn itself; send-to-answer was 7.8 to 10.1 s for a one-word reply. Resume costs about the same start-up as a cold start for a small transcript. `duration_api_ms` was not used: in resume run 3 it read 7,464 ms against a 3,651 ms `duration_ms`, so "wall minus API" is not a valid start-up figure.

**Not measured:** a resume of a large transcript. The seat's is 333 MB (doc 2703), and loading it is the one cost this test cannot see; the first interactive resume of a big lane is the measurement to take before trusting 4 to 6 s for it. Each resumed turn also re-reads the conversation from the cache-cold API (doc 2647: the seat's median call re-reads 437k cached tokens), so a long-context lane pays a cache write on wake.

## Part 4. The design: sleep registry plus doorbell

```
lane idle (idle_prompt hook + N minutes, and not on the never-sleep list)
  -> lane writes its row: name, worktree, Orca terminal handle, session id, slept-at
     (vault or ~/.zao/sleep/<lane>.json; a file the messenger reads)
  -> lane exits; the Orca pane stays open at a shell prompt
  -> Orca workspace stays in-progress, so a restart also brings it back (doc 2703)

message to a sleeping lane
  -> SendMessage fails fast: "No agent named <x> is reachable"
  -> sender asks the messenger (always on), or the messenger notices the row
  -> messenger: orca terminal send --terminal <handle> "claude --resume <session id>"
  -> waits for the session in ListAgents (new name suffix), then resends the message
  -> lane's SessionStart hook (source resume) re-reads its brief and status
Zaal's keystroke in the pane: the pane is a shell; one key (zorca's zr) resumes it
```

Why the messenger: it is always on, it already owns lane check-ins and reopens (doc 2703 routing table), and it already reopens lanes from RESUME entries each morning. No new process, no new bot.

## Part 5. The MCP recipe (Zaal's settings change; no lane makes it)

The three unused servers come from the everything-claude-code plugin, file `~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.10.0/.mcp.json` (servers `github`, `context7`, `exa`, `memory`, `playwright`, `sequential-thinking`). Editing that cached file is not the fix: a plugin update rewrites it, and the docs say "You add and remove plugin servers by installing or uninstalling the plugin". Disabling the whole plugin also drops its skills, agents and hooks, and `exa` (29 calls in 7 days) is in use.

The per-server switch is `deniedMcpServers` with the plugin's scoped name. The docs: a plugin server "registers under the scoped name `plugin:<plugin-name>:<server-name>`... Use that name where a configured server name is expected", and `deniedMcpServers` takes `serverName` entries (shown for claude.ai connectors). In the settings file this profile reads, `~/Library/Application Support/orca/claude-profiles/7d665b5d-76cb-418d-811d-cc7f60b99a69/home/settings.json` (the Orca profile's own file, not the dotfiles symlink; the dotfiles `claude/settings.json` should get the same lines so the two do not drift):

```json
"deniedMcpServers": [
  { "serverName": "plugin:everything-claude-code:memory" },
  { "serverName": "plugin:everything-claude-code:sequential-thinking" },
  { "serverName": "plugin:everything-claude-code:github" }
]
```

**UNVERIFIED:** the docs show `deniedMcpServers` working by name for connectors and give the scoped name for plugin servers, but no page shows the two combined. Verify after the change: in a new session, `/mcp` lists the three as denied, and `ps -axo command | grep -c server-memory` counts only the old sessions' copies. Expected for 26 sessions after each restarts: memory 36 -> 0, github 34 -> 0, sequential-thinking 34 -> 0 processes, **about 623 MB** freed. If a denied server still starts, the fallback is the same three lines removed from the plugin's `.mcp.json` by a local plugin fork, which is a heavier change.

The plugin's `context7` and `playwright` duplicate user-scope entries with identical commands, and the fleet runs about one of each per session (21 and 20), so denying the plugin copies is tidiness, with an expected saving near zero.

## Part 6. What must never sleep

| Lane | Why |
|---|---|
| The seat (orchestrator2) | Zaal's active window; routes everything (doc 2703) |
| messenger | It is the doorbell; it holds the session crons (the 05:02 reopen) |
| grill-sweep | The only place Zaal answers; asks run on its loop |
| merge | Its watcher is a process it runs (died in the reboot) |
| Any lane with a Monitor, ScheduleWakeup loop, session cron or background shell | They are owned by the process and die with it |
| Any lane with Remote Control in use | The bridge needs the process (docs); an idle bridge also costs CPU (#90228: about 7 percent indefinitely, reporter's figure) |

## Part 7. Red-control test plan (for the build)

| Test | Red without the design | Green with it |
|---|---|---|
| A sleeping lane's tree is gone | `ps` shows the session's `claude` and its MCP children after it goes idle | 0 processes for that session; its RSS is freed |
| A message wakes it | SendMessage to the sleeper fails and the message is lost | the messenger resumes it from the registry and the message arrives; time from send to delivery is recorded |
| The conversation survives | n/a | the woken session answers a question about a fact from before it slept |
| Never-sleep lanes stay up | a helper with a Monitor sleeps and its Monitor dies | the never-sleep check refuses to sleep it |
| A closed lane stays closed | (doc 2703) a lane closed with only `orca terminal close` returns after a restart | a slept lane returns on restart by design, a closed one does not |

## Comparison

| Option | Frees | Wake | Breaks | Verdict |
|---|---|---|---|---|
| (a) Exit + `--resume`, doorbell via messenger | process and all children | Part 3 | Monitors, crons, Remote Control (never-sleep list) | **USE** |
| (b) SIGSTOP / SIGCONT | the stopped process only (80 percent reclaimed in the test); not children | instant | messages hang 5 s and arrive late; bridges stall | SKIP |
| (c) Orca-native suspend | n/a | n/a | none exists in `orca --help` | n/a; Orca restore is used in (a) |
| (d) Deny unused MCP servers | 623 MB fleet-wide now | none needed | nothing that is used (0 calls) | **USE now**, Zaal's setting |
| (d') MCP proxy for shared servers | UNKNOWN | none | new moving part | measure later |

## Also See

- [Doc 2703](../2703-seat-routing-table-and-restart/) - routing table; why closed lanes came back after the reboot; names change on every restart
- [Doc 2647](../2647-seat-loop-effectiveness/) - what a seat wake costs
- [Doc 2641](../2641-orchestrator-seat-measured-dispatch/) - the seat as a dispatcher
- Codebase: `.claude/rules/resource-release.md`, `.claude/rules/measurement-traps.md` (trap 1, `top` second sample); dotfiles `bin/zao-lane-launch`, `bin/orca-board`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add the three `deniedMcpServers` lines to the Orca profile's `settings.json` and dotfiles `claude/settings.json`, then verify with `/mcp` and a process count | Zaal (settings) | settings change | 10:30 sitting |
| Build the sleep registry and the messenger's doorbell, with the never-sleep check, against the Part 7 tests | quidli or lane-quality, seat picks | dotfiles PR | after Zaal says yes |
| Measure an MCP proxy (one shared server, N clients) before adopting one | quidli | measurement | later |

## Sources

1. Claude Code docs, [Sessions](https://code.claude.com/docs/en/sessions) [FULL: curl, HTML stripped, 29,463 chars, read 2026-10-23]
2. Claude Code docs, [CLI reference](https://docs.claude.com/en/docs/claude-code/cli-reference) [FULL: curl, 40,148 chars]
3. Claude Code docs, [Hooks](https://docs.claude.com/en/docs/claude-code/hooks) [PARTIAL: curl, 245,830 chars; only the Notification types and the SessionStart-on-resume passages were read]
4. Claude Code docs, [MCP](https://docs.claude.com/en/docs/claude-code/mcp) [PARTIAL: curl, 119,921 chars; the plugin-server, scoped-name and deniedMcpServers passages]
5. Claude Code docs, [Remote Control](https://docs.claude.com/en/docs/claude-code/remote-control) [PARTIAL: curl, 57,130 chars; the "keeps running locally" and resume passages]
6. Claude Code docs, [Settings](https://docs.claude.com/en/docs/claude-code/settings) [PARTIAL: curl; the enabledPlugins passage]
7. GitHub, [anthropics/claude-code #103693](https://github.com/anthropics/claude-code/issues/103693) [FULL: gh api; quotes checked against the saved text]
8. GitHub, [anthropics/claude-code #63251](https://github.com/anthropics/claude-code/issues/63251) [FULL: gh api]
9. GitHub, [anthropics/claude-code #90228](https://github.com/anthropics/claude-code/issues/90228) [FULL: gh api; reporter's figure]
10. GitHub, [anthropics/claude-code #67433](https://github.com/anthropics/claude-code/issues/67433) [FULL: gh api; reporter's figure, not used for a decision]
11. GitHub, [anthropics/claude-code #18859](https://github.com/anthropics/claude-code/issues/18859) [FULL: gh api; reporter's figure, not used for a decision]
12. claudeissues.com mirror, [issue 88524, memory scales with open sessions](https://claudeissues.com/issue/88524-memory-scales-linearly-with-open-sessions-on-macos-idle-chats-never-release-ram) [FULL: curl; third-party mirror, canonical number UNVERIFIED]
13. claudeissues.com mirror, [issue 82952, per-session MCP spawn](https://claudeissues.com/issue/82952-per-session-mcp-server-spawn-multiplies-ram-use-lazy-spawn-or-per-session-mcp-sc) [FULL: curl; mirror, closed as duplicate]
14. jyoung.dev, [Claude Code parallel sessions and memory](https://jyoung.dev/blog/claude-code-parallel-sessions-memory/) [FULL: curl; blog, 2026-10-19; found via HN item 50166803]
15. GitHub, [sparfenyuk/mcp-proxy](https://github.com/sparfenyuk/mcp-proxy) [FULL: gh api README and LICENSE (MIT)]
16. GitHub, [tbxark/mcp-proxy](https://github.com/tbxark/mcp-proxy) [FULL: gh api README and LICENSE (MIT)]
17. GitHub, [supercorp-ai/supergateway](https://github.com/supercorp-ai/supergateway) [FULL: gh api README and LICENSE (MIT)]
18. GitHub, [docker/mcp-gateway](https://github.com/docker/mcp-gateway) [FULL: gh api README and LICENSE (MIT)]
19. GitHub, [smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) [FULL: gh api README and LICENSE.md (AGPL-3.0); its "pause" is a commit-and-pause workflow, code not read]
20. GitHub, [kbwo/ccmanager](https://github.com/kbwo/ccmanager) [FULL: gh api README and LICENSE (MIT): "restoring means starting the same command again, not resuming where it left off"]
21. Hacker News, [item 50166803](https://news.ycombinator.com/item?id=50166803) [FULL: Algolia API; 1 point, 0 comments]
22. The New Stack, [Firecracker snapshot resume](https://thenewstack.io/aws-wants-its-open-source-firecracker-to-become-faster/) [FULL: curl; a Linux microVM demo, "as little as 2ms", not comparable to a Node process tree]
23. [CRIU](https://criu.org/Main_Page) [FULL: curl; Linux only, no latency figure]
24. Firecracker snapshot docs [FAILED: HTTP 429]; Reddit r/ClaudeAI and r/ClaudeCode search [FAILED: HTTP 403 from this Mac]
25. Local, this Mac, 23 Oct 07:02 to 07:30 EDT: `ps`, `top -l 2`, `vm_stat`, `sysctl vm.swapusage`, `lsof`, `orca --help`, `orca worktree list`, the plugin `.mcp.json`, the profile `settings.json` and `.claude.json`, and 105 transcripts of the last 7 days (tool-call counts with a Bash control) [FULL]

A research scout fetched sources 7 to 24 (25 sources from 27 tool calls); the load-bearing quotes from #103693 and #63251 were checked against the saved raw text and #103693 against live `gh`.

## Method

The scripts are in this folder: `stopper.js` and `sigstop.py` (Part 2b) and `resume.py` (Part 3). Both experiments ran niced, on processes they started, cleaned up by pid; `resume.py` makes 6 Haiku calls (about $0.07 in total here). The SIGSTOP run started at a 1-minute load of 22, over the estate's 20 cap (logged in vault MISTAKES as brief-limit-not-enforced); the wake run was gated in the same command.
