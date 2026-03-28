# Doc 165 — Claude Code Multi-Session Management

> Research date: 2026-03-28 | Claude Code v2.1.86 | Opus 4.6

Complete reference for managing, monitoring, and orchestrating multiple Claude Code CLI sessions in parallel.

---

## Table of Contents

1. [Built-in Session Management](#1-built-in-session-management)
2. [Permission Modes & Auto-Approve](#2-permission-modes--auto-approve)
3. [Worktree & Tmux Integration](#3-worktree--tmux-integration)
4. [Headless / Non-Interactive Mode](#4-headless--non-interactive-mode)
5. [Scheduled Tasks & Remote Triggers](#5-scheduled-tasks--remote-triggers)
6. [Third-Party TUI Dashboards](#6-third-party-tui-dashboards)
7. [Terminal Multiplexer Setups](#7-terminal-multiplexer-setups)
8. [Community Orchestration Tools](#8-community-orchestration-tools)
9. [allowedTools Configuration Reference](#9-allowedtools-configuration-reference)
10. [Practical Multi-Session Recipes](#10-practical-multi-session-recipes)

---

## 1. Built-in Session Management

### Session Resume & Continue

```bash
# Continue the most recent conversation in this directory
claude --continue

# Open interactive session picker (fuzzy search)
claude --resume
claude -r "deploy"          # search for sessions matching "deploy"

# Resume a specific session by ID
claude --resume <session-id>

# Name a session (shown in /resume picker and terminal title)
claude --name "auth-refactor"
claude -n "auth-refactor"

# Fork a session (new ID, keeps history as starting point)
claude --resume <session-id> --fork-session
claude --continue --fork-session
```

**In-session commands:**
- `/resume` - interactive session picker
- `/rename` - rename current session for easy finding
- `Ctrl+R` - rename shortcut (some versions)

**Session storage:** Sessions are persisted to disk by default. Each session gets a UUID. Named sessions appear with their name in the picker.

### Session ID Capture for Scripting

```bash
# Capture session ID from JSON output
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')

# Resume that specific session later
claude -p "Continue that review" --resume "$session_id"
```

### Disable Persistence

```bash
# Sessions not saved to disk (useful for ephemeral CI jobs)
claude -p "one-off task" --no-session-persistence
```

---

## 2. Permission Modes & Auto-Approve

### Permission Modes (--permission-mode)

| Mode | Description | Use Case |
|------|-------------|----------|
| `default` | Prompts on first use of each tool | Normal interactive work |
| `acceptEdits` | Auto-accepts file edits, still asks for Bash | Trusted editing sessions |
| `plan` | Read-only analysis, no modifications | Code review, exploration |
| `auto` | AI classifier auto-approves safe actions, blocks risky ones | **Best for parallel sessions** (research preview) |
| `dontAsk` | Auto-denies unless pre-approved in `/permissions` | Locked-down environments |
| `bypassPermissions` | Skips all prompts (except .git/.claude/.vscode writes) | **Sandboxed containers only** |

```bash
# Launch with auto mode (recommended for parallel work)
claude --permission-mode auto

# Full bypass (ONLY in sandboxed environments)
claude --dangerously-skip-permissions

# Enable bypass as an option without making it default
claude --allow-dangerously-skip-permissions
```

### Settings.json Permission Configuration

**Three levels of settings files (evaluated in order):**

1. **Managed settings** (cannot be overridden) - deployed via MDM
2. **User settings** (`~/.claude/settings.json`)
3. **Shared project settings** (`.claude/settings.json`) - checked into git
4. **Local project settings** (`.claude/settings.local.json`) - gitignored

**Rule evaluation order:** deny -> ask -> allow (first match wins, deny always takes precedence)

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "Bash(npm run:*)",
      "Bash(git:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(mkdir:*)",
      "Bash(npx:*)",
      "Bash(curl:*)"
    ],
    "ask": [],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)"
    ]
  },
  "defaultMode": "auto"
}
```

### Permission Rule Syntax Reference

| Rule | Matches |
|------|---------|
| `Bash` or `Bash(*)` | All Bash commands |
| `Bash(npm run build)` | Exact command only |
| `Bash(npm run *)` | Commands starting with `npm run ` (space+star = word boundary) |
| `Bash(npm*)` | Commands starting with `npm` (no space = prefix match, includes `npmx`) |
| `Bash(* --version)` | Commands ending with ` --version` |
| `Bash(git * main)` | Commands like `git checkout main`, `git merge main` |
| `Read(./.env)` | Reading .env in current directory |
| `Read(/src/**/*.ts)` | Reading .ts files under project src/ |
| `Read(~/.zshrc)` | Reading home directory .zshrc |
| `Read(//Users/alice/secrets/**)` | Absolute path (double slash prefix) |
| `Edit(/docs/**)` | Edits in project docs/ |
| `WebFetch(domain:example.com)` | Fetch requests to specific domain |
| `mcp__puppeteer` | All tools from puppeteer MCP server |
| `mcp__puppeteer__puppeteer_navigate` | Specific MCP tool |
| `Agent(Explore)` | The Explore subagent |
| `Agent(my-custom-agent)` | Custom subagent |

**Important:** Shell operators are tracked -- `Bash(safe-cmd *)` will NOT allow `safe-cmd && other-cmd`. Compound commands approved with "Yes, don't ask again" save separate rules per subcommand (up to 5).

### CLI Override Flags

```bash
# Allow specific tools for this session only
claude --allowedTools "Bash(git:*) Edit Read"

# Deny specific tools for this session
claude --disallowedTools "Bash(rm *) Bash(curl *)"

# Restrict to only specific built-in tools
claude --tools "Bash,Edit,Read"    # only these tools available
claude --tools ""                   # disable all tools
claude --tools "default"            # all tools (default)
```

### Auto Mode Classifier Configuration

Configure what the auto mode classifier trusts in `~/.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "autoMode": {
    "environment": [
      "Source control: github.com/your-org and all repos under it",
      "Trusted cloud buckets: s3://your-builds",
      "Trusted internal domains: *.internal.yourco.com"
    ]
  }
}
```

Inspect and validate:
```bash
claude auto-mode defaults   # built-in rules
claude auto-mode config     # effective merged config
claude auto-mode critique   # AI feedback on custom rules
```

---

## 3. Worktree & Tmux Integration

### Built-in --worktree Flag

Native git worktree support shipped in Claude Code v2.1.49 (February 19, 2026). Each worktree creates an isolated branch and directory at `.claude/worktrees/<name>/`.

```bash
# Create a named worktree and start Claude in it
claude --worktree auth-fix

# Auto-name the worktree
claude --worktree

# Worktree + tmux session (opens in its own tmux pane)
claude --worktree auth-fix --tmux

# --tmux=classic for traditional tmux (vs iTerm2 native panes)
claude --worktree auth-fix --tmux=classic
```

**In-session tools:**
- `EnterWorktree` tool - creates worktree mid-session
- `ExitWorktree` tool - leave worktree (keep or remove)

**How it works:**
- Creates a new git branch based on HEAD
- Creates a directory at `.claude/worktrees/<name>/`
- Session CWD switches to the worktree
- On session exit, prompts to keep or remove
- Each agent sees only its worktree's branch context

### Parallel Worktree Pattern

```bash
# Terminal 1: Feature work
claude --worktree feature-auth --tmux -n "auth-feature"

# Terminal 2: Bug fix
claude --worktree fix-login --tmux -n "login-bugfix"

# Terminal 3: Research
claude --worktree research --tmux -n "research"

# Each operates on its own branch, no conflicts
```

---

## 4. Headless / Non-Interactive Mode

The `-p` / `--print` flag runs Claude Code non-interactively. This is what was previously called "headless mode."

### Basic Usage

```bash
# Simple one-shot prompt
claude -p "What does the auth module do?"

# With tool permissions
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit"

# Bare mode (fastest, skips all auto-discovery)
claude --bare -p "Summarize this file" --allowedTools "Read"
```

### Output Formats

```bash
# Plain text (default)
claude -p "Summarize this project"

# JSON with metadata (session_id, usage, etc.)
claude -p "Summarize this project" --output-format json

# Streaming JSON (real-time token streaming)
claude -p "Explain recursion" --output-format stream-json --verbose --include-partial-messages

# Structured output with JSON Schema
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

### Bare Mode

`--bare` skips hooks, LSP, plugin sync, attribution, auto-memory, background prefetches, keychain reads, and CLAUDE.md auto-discovery. Recommended for CI/CD and scripted calls.

```bash
claude --bare -p "Review this PR" \
  --allowedTools "Read,Bash(git diff *)" \
  --append-system-prompt "You are a security engineer." \
  --output-format json
```

**Bare mode context flags:**

| To load | Use |
|---------|-----|
| System prompt additions | `--append-system-prompt`, `--append-system-prompt-file` |
| Full system prompt replacement | `--system-prompt`, `--system-prompt-file` |
| Settings | `--settings <file-or-json>` |
| MCP servers | `--mcp-config <file-or-json>` |
| Custom agents | `--agents <json>` |
| Plugin directory | `--plugin-dir <path>` |

### Conversation Continuity in Headless Mode

```bash
# First request
claude -p "Review this codebase for performance issues"

# Continue the same conversation
claude -p "Now focus on database queries" --continue
claude -p "Generate a summary" --continue

# Or capture session ID for explicit resume
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue that review" --resume "$session_id"
```

### Budget Control

```bash
# Limit spending per invocation
claude -p "Refactor the auth module" --max-budget-usd 5.00

# With fallback model for overload
claude -p "Fix bug" --fallback-model claude-sonnet-4-6
```

---

## 5. Scheduled Tasks & Remote Triggers

### /loop Command (In-Session Scheduling)

The `/loop` skill creates recurring tasks within a Claude Code session. Shipped March 2026.

```
/loop 5m Check error logs and report any new errors
/loop 1h Run the test suite and summarize failures
/loop 30s Monitor the build output
```

**Supported intervals:** `s` (seconds), `m` (minutes), `h` (hours), `d` (days)

**Limits:**
- Up to 50 concurrent scheduled tasks per session
- Recurring tasks auto-expire after 3 days
- Tasks fire between your turns (not mid-response)
- If Claude is busy when task is due, it queues until current turn ends

### /schedule Command (Cloud-Based Remote Triggers)

The `/schedule` skill manages remote agents that run on Anthropic's servers on a cron schedule.

```
/schedule                    # list all scheduled triggers
/schedule create             # interactive trigger creation
/schedule run <trigger_id>   # manually run a trigger
```

**RemoteTrigger API actions:**
- `list` - GET /v1/code/triggers
- `get` - GET /v1/code/triggers/{trigger_id}
- `create` - POST /v1/code/triggers (requires body with cron expression)
- `update` - POST /v1/code/triggers/{trigger_id}
- `run` - POST /v1/code/triggers/{trigger_id}/run

**CronCreate accepts standard 5-field cron expressions:** minute hour day-of-month month day-of-week. All fields support wildcards, single values, steps (*/15), ranges (1-5), and comma-separated lists.

### Remote Control

Launched as research preview February 2026. Start Claude Code in your terminal, then control it from:
- claude.ai/code web interface
- iOS/Android Claude apps
- Works even after closing your laptop

---

## 6. Third-Party TUI Dashboards

### ccboard (Recommended)

Single Rust binary, 12-tab TUI + web interface. The most comprehensive monitoring tool.

```bash
# Install
brew tap FlorianBruniaux/tap && brew install ccboard
# or
cargo install ccboard

# Setup (injects hooks into ~/.claude/settings.json)
ccboard setup

# Run
ccboard
```

**12 tabs:** Dashboard, Sessions, Analytics, Costs, History, Audit Log, MCP, Config, Hooks, Tools, Plugins, Search

**Key features:**
- Live session monitoring (500ms refresh)
- Budget alerts with 4-level warnings
- 30-day cost forecasting
- FTS5-powered search across all sessions
- SQLite cache (89x faster startup)
- Web UI alongside TUI

GitHub: https://github.com/FlorianBruniaux/ccboard

### claude-dashboard (k9s-style)

k9s-inspired TUI that detects sessions via tmux and process tree.

```bash
# Install via npm or cargo (check repo)
```

**Features:** Real-time CPU/memory monitoring, session status, uptime tracking, tmux session re-attach

GitHub: https://github.com/seunggabi/claude-dashboard

### claude-code-monitor

macOS-only real-time dashboard with mobile web UI.

```bash
# Generates QR code for phone access
```

**Features:** CLI + Mobile Web UI, QR code access, terminal focus switching (iTerm2, Terminal.app, Ghostty)

GitHub: https://github.com/onikan27/claude-code-monitor

### claudash

Interactive TUI focused on session history ("like tig for git").

GitHub: https://github.com/claudash/claudash

### cc-enhanced

Unofficial TUI dashboard for usage analytics -- tokens, costs, projects, and todos.

GitHub: https://github.com/melonicecream/cc-enhanced

### cc-sessions

Fast CLI to list and resume Claude Code sessions across all projects.

GitHub: https://github.com/chronologos/cc-sessions

---

## 7. Terminal Multiplexer Setups

### tmux (Officially Supported)

tmux is the only multiplexer with native Claude Code integration (Agent Teams, --tmux flag, /terminal-setup).

**Basic multi-session tmux setup:**

```bash
# Create a tmux session with multiple Claude panes
tmux new-session -d -s claude-work

# Pane 1: Feature development
tmux send-keys -t claude-work "claude --worktree feature-auth -n 'auth'" Enter

# Pane 2: Bug fixing
tmux split-window -h -t claude-work
tmux send-keys -t claude-work "claude --worktree fix-bug -n 'bugfix'" Enter

# Pane 3: Research
tmux split-window -v -t claude-work
tmux send-keys -t claude-work "claude -n 'research'" Enter

# Attach
tmux attach -t claude-work
```

**Recommended tmux config additions (~/.tmux.conf):**

```tmux
# Increase scrollback for long Claude sessions
set -g history-limit 50000

# Mouse support for pane switching
set -g mouse on

# Better pane borders
set -g pane-border-style fg=colour238
set -g pane-active-border-style fg=colour208

# Status bar showing session info
set -g status-right '#{pane_title} | %H:%M'
```

**Key tmux shortcuts:**
- `Ctrl-b %` - split vertically
- `Ctrl-b "` - split horizontally
- `Ctrl-b o` - cycle panes
- `Ctrl-b z` - zoom/unzoom pane
- `Ctrl-b d` - detach (sessions keep running)

### Zellij (Community Support Only)

Zellij is NOT natively supported by Claude Code for Agent Teams or --tmux. There are open feature requests:
- Issue #31901: Native Zellij support for Agent Teams
- Issue #24122: Zellij split-pane mode support

**However, Zellij works well for manual multi-session management:**
- Serializes sessions to disk (survives laptop close)
- Panes can run independent Claude sessions
- Community plugin: `zellij-workflow` (v1.4.3) provides integration

```bash
# Using Zellij for parallel Claude sessions
zellij
# Then open multiple panes, each running `claude` independently
```

### Screen

Works but lacks the pane management of tmux/Zellij. Not recommended for parallel Claude Code work.

---

## 8. Community Orchestration Tools

### claude-squad (Most Popular)

TUI app that manages multiple AI agents (Claude Code, Codex, Gemini, Aider, Amp) in isolated workspaces.

```bash
# Install
brew install smtg-ai/tap/claude-squad
# or
curl -sSL https://raw.githubusercontent.com/smtg-ai/claude-squad/main/install.sh | bash

# Launch
cs
```

**Architecture:** Uses tmux for terminal isolation + git worktrees for code isolation. Each agent gets its own branch.

**Keyboard shortcuts:**
- `n`/`N` - create new session
- `D` - delete session
- `j`/`k` or arrows - navigate sessions
- `Enter`/`o` - attach to session
- `Ctrl-q` - detach
- `s` - push changes
- `c` - checkout
- `r` - resume paused session
- `q` - quit

**Config:** `~/.claude-squad/config.json` supports named profiles for different program configurations.

GitHub: https://github.com/smtg-ai/claude-squad

### parallel-cc

Automated parallel management using git worktrees with autonomous coordination between agents.

GitHub: https://github.com/frankbria/parallel-cc

### claustre

TUI for orchestrating multiple Claude Code sessions across projects with vim-style navigation.

GitHub: https://github.com/pmbrull/claustre

### workmux

git worktrees + tmux windows for zero-friction parallel dev.

GitHub: https://github.com/raine/workmux

### muxtree

Single bash script that pairs git worktrees with tmux sessions.

```bash
# Dead simple: one script, worktree + tmux pairing
```

GitHub / DevTo: https://dev.to/b-d055/introducing-muxtree-dead-simple-worktree-tmux-sessions-for-ai-coding-2kf2

### claude-tmux

tmux popup with session management, git worktree, and PR support.

GitHub: https://github.com/nielsgroen/claude-tmux

### GitButler Virtual Branches (No-Worktree Approach)

Uses Claude Code lifecycle hooks to automatically assign work to virtual branches in a single directory. No worktrees needed.

- Hooks notify GitButler when files are about to be edited
- Session ID maps to a branch
- One commit per chat round, one branch per session
- Requires GitButler CLI

Blog: https://blog.gitbutler.com/parallel-claude-code

---

## 9. allowedTools Configuration Reference

### Your Current Project Config (.claude/settings.json)

```json
{
  "permissions": {
    "allow": [
      "Read", "Edit", "Write", "Glob", "Grep",
      "WebSearch", "WebFetch",
      "Bash(npm run lint)", "Bash(npm run build)",
      "Bash(ls:*)", "Bash(cat:*)", "Bash(cd:*)",
      "Bash(find:*)", "Bash(mkdir:*)", "Bash(curl:*)",
      "Bash(git:*)", "Bash(npm run:*)", "Bash(npx:*)"
    ]
  }
}
```

### Recommended Addition for Parallel Work

```json
{
  "permissions": {
    "allow": [
      "Read", "Edit", "Write", "Glob", "Grep",
      "WebSearch", "WebFetch",
      "Bash(npm run *)", "Bash(git *)", "Bash(ls *)",
      "Bash(cat *)", "Bash(mkdir *)", "Bash(npx *)",
      "Bash(node *)", "Bash(curl *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  },
  "defaultMode": "auto"
}
```

### Security Best Practices for Auto-Approve

1. **Use `auto` mode instead of `bypassPermissions`** -- the AI classifier catches destructive actions
2. **Always set deny rules** for dangerous operations (rm -rf, force push, hard reset)
3. **Use project-level settings** (.claude/settings.json) for team-wide rules
4. **Use local settings** (.claude/settings.local.json) for personal overrides (gitignored)
5. **Never bypass permissions outside containers/VMs** -- `bypassPermissions` has no safety net
6. **Prefer specific patterns** -- `Bash(git commit *)` is safer than `Bash(git *)`
7. **Read/Edit deny rules don't block Bash** -- `Read(./.env)` deny won't stop `cat .env`; use sandboxing for true enforcement

---

## 10. Practical Multi-Session Recipes

### Recipe A: Three Parallel Worktrees with Auto Mode

```bash
# Terminal 1
claude --worktree feature-new --tmux --permission-mode auto -n "feature"

# Terminal 2
claude --worktree bugfix-123 --tmux --permission-mode auto -n "bugfix"

# Terminal 3 (research, no worktree needed)
claude --permission-mode plan -n "research"
```

### Recipe B: CI/CD Headless Pipeline

```bash
#!/bin/bash
# Run review and tests in parallel
review_id=$(claude --bare -p "Review src/ for security issues" \
  --allowedTools "Read,Grep,Glob" \
  --output-format json \
  --max-budget-usd 2.00 | jq -r '.session_id') &

test_id=$(claude --bare -p "Run test suite, report failures" \
  --allowedTools "Bash(npm test *),Read" \
  --output-format json \
  --max-budget-usd 3.00 | jq -r '.session_id') &

wait

# Get results
claude -p "Summarize the review findings" --resume "$review_id" --output-format text
claude -p "Summarize test results" --resume "$test_id" --output-format text
```

### Recipe C: claude-squad Multi-Agent

```bash
# Install and launch
brew install smtg-ai/tap/claude-squad
cs

# In the TUI:
# n -> create "auth-refactor" session
# n -> create "test-coverage" session
# n -> create "docs-update" session
# j/k to navigate, Enter to attach, Ctrl-q to detach
```

### Recipe D: Monitoring with ccboard

```bash
# One-time setup
brew tap FlorianBruniaux/tap && brew install ccboard
ccboard setup

# Run monitoring alongside your Claude sessions
# In a separate terminal:
ccboard

# Now all Claude sessions are tracked with costs, status, and analytics
```

---

## Key Flags Quick Reference

| Flag | Purpose |
|------|---------|
| `-p` / `--print` | Non-interactive / headless mode |
| `--bare` | Skip all auto-discovery (fastest) |
| `-w` / `--worktree [name]` | Isolated git worktree |
| `--tmux` | Launch in tmux session (requires --worktree) |
| `--tmux=classic` | Force traditional tmux (vs iTerm2 panes) |
| `-n` / `--name <name>` | Name the session |
| `-c` / `--continue` | Continue most recent conversation |
| `-r` / `--resume [id]` | Resume by ID or interactive picker |
| `--fork-session` | Fork conversation with new ID |
| `--permission-mode <mode>` | Set permission mode |
| `--allowedTools <tools>` | Allow tools without prompting |
| `--disallowedTools <tools>` | Deny specific tools |
| `--tools <tools>` | Restrict available tool set |
| `--dangerously-skip-permissions` | Skip ALL permission checks |
| `--output-format <format>` | text / json / stream-json |
| `--json-schema <schema>` | Structured output validation |
| `--max-budget-usd <amount>` | Spending cap per invocation |
| `--fallback-model <model>` | Fallback for overloaded model |
| `--agent <name>` | Use specific agent |
| `--agents <json>` | Define custom agents inline |
| `--append-system-prompt <text>` | Add to system prompt |
| `--system-prompt <text>` | Replace system prompt |
| `--mcp-config <file>` | Load MCP servers |
| `--settings <file-or-json>` | Load additional settings |
| `--add-dir <path>` | Add directory access |
| `--session-id <uuid>` | Use specific session UUID |
| `--no-session-persistence` | Don't save session to disk |
| `--model <model>` | Override model (e.g., sonnet, opus) |
| `--effort <level>` | low / medium / high / max |

---

## Sources

- [Claude Code Official Docs - Headless Mode](https://code.claude.com/docs/en/headless)
- [Claude Code Official Docs - Permissions](https://code.claude.com/docs/en/permissions)
- [Claude Code Official Docs - Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks)
- [Claude Code Auto Mode (Anthropic Engineering)](https://www.anthropic.com/engineering/claude-code-auto-mode)
- [claude-squad GitHub](https://github.com/smtg-ai/claude-squad)
- [ccboard GitHub](https://github.com/FlorianBruniaux/ccboard)
- [claude-dashboard (k9s-style)](https://github.com/seunggabi/claude-dashboard)
- [claude-code-monitor](https://github.com/onikan27/claude-code-monitor)
- [claudash](https://github.com/claudash/claudash)
- [cc-sessions](https://github.com/chronologos/cc-sessions)
- [claustre](https://github.com/pmbrull/claustre)
- [workmux](https://github.com/raine/workmux)
- [claude-tmux](https://github.com/nielsgroen/claude-tmux)
- [parallel-cc](https://github.com/frankbria/parallel-cc)
- [GitButler Parallel Claude Code](https://blog.gitbutler.com/parallel-claude-code)
- [Boris Cherny on Worktrees](https://www.threads.com/@boris_cherny/post/DVAAoZ3gYut)
- [Muxtree (DEV Community)](https://dev.to/b-d055/introducing-muxtree-dead-simple-worktree-tmux-sessions-for-ai-coding-2kf2)
- [Zellij Support Issue #31901](https://github.com/anthropics/claude-code/issues/31901)
- [Managing Sessions (clauderc.com)](https://clauderc.com/blog/2026-02-28-managing-multiple-claude-code-sessions/)
- [How to Run Parallel Claude (ona.com)](https://ona.com/stories/parallelize-claude-code)
