---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "2246, 2319, 2092"
original-query: "deep /zao-research https://x.com/githubprojects/status/2090408598623154659 into this and how our lanes workflow works"
tier: DEEP
---

# 2342 - smux / tmux-bridge vs the ZAO lanes workflow

> **Goal:** Read the tmux-bridge code that GitHub Projects promoted, compare it honestly against `lane-send` and the lanes workflow we already run, and take only what we are actually missing.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **DO NOT adopt tmux-bridge as our send path. Keep `lane-send`.** | `lane-send` verifies the message actually submitted and retries; tmux-bridge splits `type` and `keys` into separate commands with no verification, which is the exact failure Zaal hit on 2026-08-19 ("enter was never pressed here"). Swapping in tmux-bridge would reintroduce a bug we have already fixed. |
| 2 | **ADOPT the read-guard idea.** Require reading a pane before typing into it. | 26 lines in their implementation. It structurally prevents typing into a lane mid-prompt or interrupting a menu - which this session did repeatedly, sending into lanes sitting on unanswered AskUserQuestion menus. |
| 3 | **ADOPT `doctor`.** A one-command diagnostic for pane/socket reachability. | We had two lanes blocked on a broken browser today and neither could name the cause. A `zj doctor` that checks the session, the socket, and the binary would have said so immediately (`vanishing-dependencies.md` rule 3). |
| 4 | **SKIP their `message` sender-attribution.** | Our `lane-send` already prepends who is speaking in the prompt text, and `SendMessage` (agent-loops rule 36) does named addressing natively. Adding a third convention makes the surface question worse, not better. |
| 5 | **CREDIT ShawnPana/smux (MIT) in anything we adopt.** | `credit-attribution.md`. LICENSE file read directly, not the API classifier: MIT, "Copyright (c) 2026 shawn pana". |

## What smux actually is

`ShawnPana/smux` - 1,513 stars, Shell, last pushed 2026-07-28, not archived. Seven files: `.tmux.conf`, `install.sh`, `scripts/tmux-bridge` (403 lines), a ghostty config, and a `skills/smux/` directory with a SKILL.md and two reference files.

The X post that surfaced it is [@GithubProjects, 2026-08-20](https://x.com/githubprojects/status/2090408598623154659) - 1,940 views, 5 likes at read time. It links `osp.fyi/smux`, which redirects to the repo. Modest engagement; the repo's 1.5k stars are the real signal.

Its pitch: *"a CLI that lets any AI agent read, type, and send keys to any tmux pane, enabling cross-agent workflows"* - Claude Code prompting Codex in the next pane and getting replies back.

`tmux-bridge` exposes: `list`, `type`, `message`, `read`, `keys`, `name`, `resolve`, `id`, `doctor`, `version`.

## Findings

### 1. We built this already, and ours is better at the part that matters

We run 14 named tmux lanes, each a Claude Code session, addressed by `~/bin/lane-send` and surveyed with `zj`. The architecture smux describes is the architecture we have been running for months.

Where they differ is delivery. **tmux-bridge separates `type` (text, no Enter) from `keys` (send Enter) and never confirms the submission landed.** `lane-send` is 115 lines and does the opposite:

- Clears the line with `C-u` first, because a Claude Code TUI can hold *ghost text* - a visible prompt with an empty real buffer, so a bare Enter submits nothing.
- Types literally with `send-keys -l`.
- Sends Enter, then **reads the pane back** and checks the message is no longer sitting in the tail.
- Retries up to **3 times**, then **fails loud**: `NOT SENT to <lane> - the text is typed but will not submit after 3 attempts.`

That verification exists because the failure is real and recurring. `lane-send`'s own comments record that a long message's first Enter can land while the TUI is still ingesting, that one instance was *"noticed by accident"*, and that another *"ran only because someone pressed Enter by hand."* Zaal hit it directly on 2026-08-19: *"enter was never pressed here and it wasnt renamed or rced."* The fix became a standing rule - never raw `tmux send-keys`, always `lane-send`.

Adopting tmux-bridge's send path would be a regression from a verified write to an unverified one. This is `silent-failure-guard.md` in miniature: their `keys` command exits 0 whether or not anything submitted.

### 2. The read-guard is the one genuinely good idea

26 lines, and the concept is stronger than the code:

```
# Enforces read-before-act: agents must read a pane before typing/keys.
require_read() { ... die "must read the pane before interacting. Run: tmux-bridge read $1" }
```

It touches `/tmp/tmux-bridge-read-<pane>` on a read and refuses to type until that file exists.

**This session demonstrates why we want it.** Messages went into lanes that were sitting on unanswered menus - `audos` and `zaostock` were both parked on AskUserQuestion prompts awaiting Zaal. Typing into a lane mid-menu can select an option nobody chose. `lane-send` does capture the pane, but only *after* sending, to verify delivery. It never checks state *before*.

The ZAO version should be a state check rather than a touch-file: refuse to send when the pane tail shows an open menu (`Enter to select`, `❯ 1.`) unless `--force` is passed. That is strictly more useful than "somebody ran read once," and it does not need their file.

### 3. `doctor` earns its place today

`tmux-bridge doctor` diagnoses connectivity: which socket, which pane, whether the server is reachable. Its `resolve_socket` handles `TMUX_BRIDGE_SOCKET`, `TMUX`, and `TMUX_PANE` before giving up with a message naming which were unset.

Today produced two cases this would have shortened:

- Two lanes reported "all browser paths are down" and "Chrome extension not connected." Actual cause: `gstack browse/dist/` had never been built, so `/browse` could not run at all.
- The VPS vanished from the lane wall. Actual cause: the host is unreachable at the network level and absent from the tailnet.

Neither lane could name its own blocker. A `zj doctor` that asserts *the binaries exist, the sessions are reachable, the hosts answer* converts both into one line.

### 4. Where their model does not fit ours

smux targets **one machine, adjacent panes, heterogeneous agents** - Claude prompting Codex next door. Ours is **many machines and many agent kinds**: Mac, Windows desktop, VPS, Pi, plus non-Claude agents.

`agent-loops.md` rule 36 already resolves this and tmux-bridge does not change it. Claude-to-Claude on one machine uses native `SendMessage` - named addressing that outlives the agent, push delivery, a summary rather than raw history. Everything else rides the relay bus. tmux-bridge is a *third* transport competing with both, and it only works where panes are local. It cannot reach the desktop or the Pi, which is most of what our coordination actually needs.

The deeper point, from `handoff-discipline.md` rule 7: **transport is never the record.** tmux-bridge is pure transport. Our lanes workflow is transport (`lane-send`) plus a persistence layer (vault handoff briefs, board cards, PRs). A tool that only moves text between panes solves the easy half.

### 5. What our workflow has that smux has no answer for

Measured on this machine today:

| Capability | ZAO lanes | smux |
|---|---|---|
| Verified delivery with retry + loud failure | `lane-send`, 3 attempts | no |
| Read-before-act guard | no (adopt this) | yes, 26 lines |
| Connectivity `doctor` | no (adopt this) | yes |
| Persistent per-lane brief that survives the session | `~/zao-vault/handoffs/<lane>.md`, git-versioned | no |
| One-command boot of every unconsumed brief for this machine | `zao-lane-boot` | no |
| Cross-machine reach | relay bus + `SendMessage` | local panes only |
| Cross-lane collision map | `handoffs/IN-FLIGHT.md` | no |
| Restart-debt visibility | `zao-lane-boot --list` | no |

The brief layer is the substantive difference. smux moves text between panes; it has nothing that makes a lane resumable after the pane dies. Ours came out of a real failure - a lane that died at 90% context with no brief - and is now `handoff-discipline.md`.

### Honest counterpoint

Two places smux is cleaner and we should not pretend otherwise. Its socket resolution is more careful than ours - it tries `TMUX_BRIDGE_SOCKET`, then `TMUX`, then `TMUX_PANE`, and its error names which were unset, where `lane-send` assumes the default socket. And shipping a `skills/smux/` directory *inside* the repo, so the agent-facing instructions version alongside the code, is a pattern worth copying for our own `~/bin` tools, whose usage notes currently live only in rules files.

## Also See

- [Doc 2246 - Claude Code cross-session messaging](../2246-claude-code-cross-session-messaging/)
- [Doc 2319 - handoff workflow audit](../../dev-workflows/2319-handoff-workflow-audit/)
- [Doc 2092 - lane handoff coordination](../../dev-workflows/2092-lane-handoff-coordination/)
- `.claude/rules/agent-loops.md` rule 36, `.claude/rules/handoff-discipline.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a pre-send state check to `lane-send`: refuse when the pane tail shows an open menu (`Enter to select` / `❯ 1.`) unless `--force`, crediting ShawnPana/smux (MIT) inline | @Zaal | PR (zaal-dotfiles) | 2026-08-25 |
| Add `zj doctor`: assert each lane's session is reachable, each `~/bin` tool resolves, and each remote host answers | @Zaal | PR (zaal-dotfiles) | 2026-08-27 |
| Add a `--verify` note to `agent-loops.md` rule 36 recording that unverified pane writes are banned, with `lane-send`'s 3-attempt behaviour as the reference | @Zaal | PR | 2026-08-27 |
| Decide whether `~/bin` tools ship agent-facing usage docs beside them, as smux does with `skills/smux/` | @Zaal | Decision | 2026-08-29 |

## Sources

- [FULL - `gh repo clone`, read on disk] [ShawnPana/smux](https://github.com/ShawnPana/smux) - **MIT**, LICENSE file read directly (not the API classifier): "MIT License, Copyright (c) 2026 shawn pana". 1,513 stars, Shell, pushed 2026-07-28. Read: `scripts/tmux-bridge` (403 lines), file tree, usage block, read-guard implementation lines 10-36.
- [FULL - `zao-fetch-x.sh`, raw API] [@GithubProjects post](https://x.com/githubprojects/status/2090408598623154659) - 2026-08-20 12:00 UTC, 1,940 views, 5 likes, 0 replies. Text quoted verbatim.
- [FULL - `curl` + grep] `osp.fyi/smux` redirect target resolved to the GitHub repo (69,222 bytes fetched).
- [FULL - read on disk] `~/bin/lane-send` (115 lines) - the C-u clear, `send-keys -l`, capture-pane verification, and 3-attempt retry loop.
- [FULL - read on disk] `.claude/rules/agent-loops.md` rule 36; `.claude/rules/handoff-discipline.md` rule 7.
- [FULL - `tmux ls` this machine] 14 live lanes, 2026-08-20.

Credit: **ShawnPana, smux (MIT)** - the read-guard and `doctor` patterns recommended above are theirs.
