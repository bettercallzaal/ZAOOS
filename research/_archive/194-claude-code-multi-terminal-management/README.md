# 165 — Claude Code Multi-Terminal Management

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Find the best ways to track, monitor, and manage multiple Claude Code terminals with minimal friction ("yes to all" vibe)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Quick win: auto-approve** | Use `--permission-mode auto` — AI classifier approves safe actions, blocks dangerous ones. Best balance of speed + safety |
| **Multi-session orchestrator** | **claude-squad** — manages multiple Claude Code agents in tmux + git worktrees with a TUI dashboard. `brew install smtg-ai/tap/claude-squad` |
| **Cost + session tracking** | **ccboard** — 12-tab TUI + web UI, cost tracking, 30-day forecasts. `brew install ccboard` |
| **Named sessions** | Use `claude --name "feature-x"` to label sessions, `claude --resume` to fuzzy-search pick them back up |
| **Parallel isolated work** | Use `claude --worktree feature-x --tmux` — each session gets its own git branch + tmux pane, zero conflicts |
| **Headless scripting** | `claude -p "prompt" --output-format json` for non-interactive batch runs |

**TL;DR for Zaal:** Install claude-squad for the dashboard, use `--permission-mode auto` for the "yes to all" feel, and `--worktree --tmux` for parallel isolated sessions.

---

## 1. Permission Modes ("Yes to All" Spectrum)

Claude Code has 6 permission modes, from most restrictive to most permissive:

| Mode | What It Does | Risk Level |
|------|-------------|------------|
| `default` | Asks before every tool call | Safest, slowest |
| `plan` | Can read files freely, asks for writes | Low |
| `acceptEdits` | Auto-approves file edits, asks for bash/web | Medium |
| **`auto`** | **AI classifier auto-approves safe actions, blocks risky ones** | **Recommended** |
| `dontAsk` | Auto-approves everything except a deny list | High |
| `bypassPermissions` | Approves literally everything | Dangerous |

### How to use `auto` mode:

```bash
# One-off session
claude --permission-mode auto

# Set as default (user-level)
# In ~/.claude/settings.json:
{
  "permissions": {
    "defaultMode": "auto"
  }
}
```

### Fine-grained with `allowedTools`:

In `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git *)",
      "Bash(npm run *)",
      "Bash(npx vitest *)",
      "Edit",
      "Write"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)"
    ]
  }
}
```

**Rule evaluation order:** deny > ask > allow (deny always wins).

**Settings hierarchy:** managed policy > CLI flags > local project > shared project > user-level.

---

## 2. claude-squad — The Multi-Terminal Dashboard

The most popular orchestrator for running multiple Claude Code sessions. Think "htop for Claude Code agents."

```bash
brew install smtg-ai/tap/claude-squad
```

### What it does:

- **TUI dashboard** showing all running Claude Code sessions with status
- **Auto-creates git worktrees** per session — zero merge conflicts
- Manages **tmux sessions** under the hood
- Shows which sessions are waiting for input, running, or idle
- One-key switching between sessions
- Supports `--auto-yes` mode per session

### Workflow:

```bash
# Launch the dashboard
claude-squad

# Add a new agent with a task
# Press 'n' in the TUI, give it a prompt
# It spawns a new Claude Code session in its own worktree

# Switch between sessions with arrow keys
# See real-time output from each agent
# Merge completed work back to main branch
```

### Why this fits ZAO OS:

With the multi-feature dev workflow (working on music player + governance + social simultaneously), claude-squad lets you run 3+ Claude Code sessions on different features without them stepping on each other's files.

---

## 3. ccboard — Cost Tracking + Analytics

```bash
brew install ccboard
```

- **12-tab TUI** with session list, cost breakdown, token usage
- **Web UI** for browser-based monitoring
- **30-day cost forecasts** based on usage patterns
- **FTS5 search** across all session transcripts
- **SQLite cache** for offline access to session history

Good complement to claude-squad — squad manages the sessions, ccboard tracks the spend.

---

## 4. Built-in Session Management

### Named sessions:

```bash
# Start a named session
claude --name "music-player-fix"

# Resume by name
claude --resume "music-player-fix"

# Resume most recent in current directory
claude --continue
# or shorthand:
claude -c

# Interactive session picker with fuzzy search
claude --resume
# or shorthand:
claude -r
```

### Worktrees (native isolation):

```bash
# Create isolated session with its own git branch
claude --worktree spaces-feature

# Same but auto-launch in tmux pane
claude --worktree spaces-feature --tmux

# Force classic tmux (vs iTerm2 native panes)
claude --worktree spaces-feature --tmux=classic
```

Worktrees live at `.claude/worktrees/<name>/`. Each gets a full copy of the repo on its own branch.

### Fork a conversation:

```bash
# Branch current conversation (new session ID, keeps context)
claude --fork-session
```

---

## 5. Headless / Scripted Mode

For batch operations or CI/CD:

```bash
# Non-interactive single prompt
claude -p "add error handling to src/app/api/music/route.ts" --output-format json

# With budget cap
claude -p "refactor the auth module" --max-budget-usd 5.00

# Bare mode (skip auto-discovery, fastest startup)
claude -p "lint fix" --bare

# Structured output with schema validation
claude -p "list all API routes" --json-schema '{"type":"array","items":{"type":"string"}}'
```

---

## 6. Scheduled & Remote

### Loop (in-session recurring):

```bash
# Inside a Claude Code session:
/loop 5m "check if the dev server has any new errors"
```

- Up to 50 loops per session
- Auto-expires after 3 days

### Remote triggers (cloud-based cron):

```bash
# Inside Claude Code:
/schedule
# Creates a remote agent on Anthropic's servers
# Full cron expression support
```

### Remote Control:

- Control any local Claude Code session from `claude.ai/code` or mobile
- Preview feature shipped Feb 2026

---

## 7. Other Monitoring Tools

| Tool | What It Does | Install |
|------|-------------|---------|
| **claude-dashboard** | k9s-style TUI, real-time CPU/memory per session | `npm i -g claude-dashboard` |
| **claude-code-monitor** | macOS menu bar app + mobile web UI with QR code | `brew install claude-code-monitor` |
| **cc-sessions** | Fast CLI for listing/resuming sessions across all projects | `npm i -g cc-sessions` |

---

## 8. Recommended Setup for ZAO OS Development

### One-time setup:

```bash
# 1. Install claude-squad for multi-session management
brew install smtg-ai/tap/claude-squad

# 2. Set auto permission mode as default
# Add to ~/.claude/settings.json or project .claude/settings.json

# 3. Configure allowed tools for ZAO OS specifically
# Add to .claude/settings.local.json (gitignored)
```

### Suggested `.claude/settings.local.json`:

```json
{
  "permissions": {
    "defaultMode": "auto",
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "Write",
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cd *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)"
    ]
  }
}
```

### Daily workflow:

```bash
# Launch multi-agent dashboard
claude-squad

# Spin up parallel sessions:
# Agent 1: "fix the audio player crossfade bug" (worktree: audio-fix)
# Agent 2: "add governance voting UI" (worktree: governance-ui)
# Agent 3: "research XMTP group messaging" (worktree: xmtp-research)

# Switch between them in the TUI
# Merge completed work back when done
```

---

## 9. tmux Cheat Sheet (for manual setup)

If you prefer raw tmux over claude-squad:

```bash
# Create a named tmux session with 3 panes
tmux new-session -s zao -d
tmux split-window -h -t zao
tmux split-window -v -t zao
tmux send-keys -t zao:0.0 'claude --name "music" --permission-mode auto' Enter
tmux send-keys -t zao:0.1 'claude --name "social" --permission-mode auto' Enter
tmux send-keys -t zao:0.2 'claude --name "governance" --permission-mode auto' Enter
tmux attach -t zao
```

Key bindings: `Ctrl-b` + arrow keys to switch panes, `Ctrl-b d` to detach.

---

## Sources

- [Claude Code CLI Reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference)
- [Claude Code Permission Modes](https://docs.anthropic.com/en/docs/claude-code/security)
- [claude-squad GitHub](https://github.com/smtg-ai/claude-squad)
- [ccboard GitHub](https://github.com/ccboard/ccboard)
- [Claude Code Worktrees](https://docs.anthropic.com/en/docs/claude-code/worktrees)
- [Claude Code Settings](https://docs.anthropic.com/en/docs/claude-code/settings)
