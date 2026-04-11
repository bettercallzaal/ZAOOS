# 321 - WorktreeHQ + Git Worktree Branching Strategy

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Evaluate WorktreeHQ and git worktree workflows for managing parallel Claude Code sessions in ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Desktop dashboard** | USE WorktreeHQ for branch hygiene visibility - detects squash-merged dead branches that pile up on Vercel, MIT licensed, v0.x but functional |
| **CLI worktree management** | USE `git-worktree-runner` (gtr) for creating worktrees with `gtr new feature --ai` which auto-launches Claude Code in isolation |
| **Current /worksession skill** | KEEP but evolve - our `ws/` prefix branch naming is good, but we're not using actual git worktrees (just branches in the same checkout) |
| **Branch cleanup** | USE WorktreeHQ's squash-merge detection - we just deleted 5 stale branches manually today, this automates it |
| **Parallel sessions** | UPGRADE from "branches in same dir" to "worktrees in separate dirs" - eliminates the node_modules/build cache conflicts we hit with multiple terminals |

## Current ZAO OS Branching (What We Have)

Our `/worksession` skill (`.claude/skills/worksession/SKILL.md`) creates `ws/` prefixed branches:
```
ws/fractal-fixes-0406-1423
ws/morning-2026-04-07
ws/zaostock-agenda-0410-1415
```

**Problems with current approach:**
1. All sessions share one working directory - `node_modules`, `.next` cache, and Turbopack state collide
2. Switching branches requires stashing or committing WIP
3. Dead branches accumulate (we just cleaned 5 today) - no automated detection
4. No visibility into what each terminal session is doing
5. Build artifacts from one branch leak into another

## Comparison of Options

| Tool | Type | Worktree Support | AI Integration | Branch Cleanup | License | Maturity |
|------|------|-----------------|----------------|----------------|---------|----------|
| **WorktreeHQ** | Desktop app (Tauri v2) | Full dashboard with live status | Claude IDE detection (macOS/Linux) | Squash-merge detection via GitHub API + `git cherry` | MIT | v0.x, early |
| **git-worktree-runner (gtr)** | CLI | `gtr new`, `gtr rm`, `gtr cd` | `gtr ai branch` launches Claude Code | `gtr clean --merged` | MIT | Active |
| **wtp** | CLI | Auto-generates paths from branch names | None | None | MIT | Active |
| **Git Worktree Toolbox** | MCP server + CLI | Full CRUD | MCP-native for AI tools | None | MIT | Active |
| **Our /worksession** | Claude Code skill | None (branch-only) | Native (it IS Claude Code) | None | N/A | Stable |

## WorktreeHQ Deep Dive

### Architecture
- **Frontend:** React 18 + TypeScript + Tailwind + Zustand
- **Backend:** Tauri v2 (Rust) - thin shell, delegates all git ops to system binary via single `git_exec()` command
- **Polling:** 15-second refresh loop + filesystem watcher for early triggers
- **Config:** `~/.config/worktreehq/config.toml` stores GitHub token and preferences

### Key Features for ZAO OS
1. **Worktrees tab:** Live status cards showing branch, dirty/clean, ahead/behind counts
2. **Branches tab:** Filters for "safe to delete", "stale" (30+ days), "orphaned"
3. **Squash-merge detection:** Two-pass algorithm:
   - Pass 1: Parse PR numbers from commit subjects, verify via GitHub API
   - Pass 2: `git cherry main <branch>` fallback for branches without PR refs
4. **Claude detection:** Polls for running Claude IDE processes, warns about concurrent write conflicts
5. **Per-worktree notepads:** Persistent notes per session that survive app restarts

### Requirements
- Node.js 20+, Rust toolchain
- macOS: Xcode CLI tools
- GitHub PAT with `repo` scope for squash detection
- Build from source only (no installers yet)

## Git Worktree Runner (gtr) Deep Dive

### How It Solves Our Problem
```bash
# Instead of our current:
git checkout main && git pull && git checkout -b ws/feature-0411-1000

# We'd do:
git gtr new feature-0411-1000 --ai
# Creates ../worktrees/feature-0411-1000/ with isolated checkout
# Copies .env, .claude/ config automatically
# Launches Claude Code in the new worktree
```

### Key Features
- **Smart file copying:** Propagates `.env.local`, `.claude/` settings to new worktrees
- **Hooks:** Post-creation hooks can run `npm install` automatically
- **AI launch:** `gtr ai branch` or `gtr new branch --ai` starts Claude Code
- **Cleanup:** `gtr clean --merged` removes worktrees for closed PRs

## ZAO OS Integration

### Files to modify
- `.claude/skills/worksession/SKILL.md` - upgrade from branch-only to worktree-based sessions
- `.claude/skills/worksession/branch-guard.sh` - update branch detection for worktree paths
- `CLAUDE.md` - document the new worktree workflow
- `.gtrconfig` (new) - configure gtr for ZAO OS repo

### Proposed New Workflow

**Phase 1: Install gtr + update /worksession (immediate)**
```bash
# Install gtr
npm install -g git-worktree-runner

# New /worksession flow:
git gtr new <description>-<MMDD>-<HHMM> --ai
# Working dir: ../worktrees/<description>-<MMDD>-<HHMM>/
# Each session is fully isolated
```

**Phase 2: Add WorktreeHQ for visibility (when we need it)**
```bash
git clone https://github.com/adamjgmiller/worktreehq.git
cd worktreehq && npm install && npm run tauri build
# Launch for branch hygiene dashboard
```

**Phase 3: Automate cleanup**
- WorktreeHQ detects squash-merged branches after PR merge
- `gtr clean --merged` in a weekly cron or post-merge hook
- No more manual `git push origin --delete` sessions

### Worktree Directory Structure
```
~/Documents/
  ZAO OS V1/                    # Main checkout (stays on main)
  worktrees/
    feature-auth-0411-1000/     # Isolated worktree
    fix-search-0411-1430/       # Another session
    research-0411-0900/         # Research session
```

### Node_modules Concern
Each worktree needs its own `node_modules` (~1.2GB for ZAO OS). Mitigations:
- Use `npm install --prefer-offline` to leverage npm cache
- Create worktrees only for code sessions, not research-only
- Clean up worktrees promptly after PR merge
- 3-5 parallel worktrees max (3.6-6GB disk, manageable)

## What NOT to Change

- Keep the `ws/` branch prefix convention - it's good for identifying session branches
- Keep PR-on-finish workflow - already saved as feedback memory
- Keep `/worksession` as the entry point - just upgrade its internals
- Don't use worktrees for research-only sessions (no code changes = no isolation needed)

## Sources

- [WorktreeHQ repo](https://github.com/adamjgmiller/worktreehq) - MIT, Tauri v2 desktop app
- [git-worktree-runner (gtr)](https://github.com/coderabbitai/git-worktree-runner) - MIT, CLI with AI integration
- [Git Worktree official docs](https://git-scm.com/docs/git-worktree)
- [Claude Code Git Worktree Guide](https://thepromptshelf.dev/blog/claude-code-git-worktree-guide/) - parallel AI session patterns
- [Nx Blog: Git Worktrees + AI Agents](https://nx.dev/blog/git-worktrees-ai-agents) - real-world workflow patterns
- [Git Worktree Toolbox MCP](https://github.com/ben-rogerson/git-worktree-toolbox) - MCP server approach
