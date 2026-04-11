---
name: worksession
description: Use at the start of any work session, especially when multiple Claude Code terminals may be open. Creates an isolated git worktree (or branch fallback), prevents conflicts from parallel sessions. Also use when asked to "start a session", "new branch", or "ws".
---

# Work Session

Isolated git worktrees for parallel Claude Code terminals. One worktree per session, PR at the end.

## Start of Session

Run these steps in order:

1. **Fetch latest and check state:**
   ```
   git fetch origin
   git status
   git branch --show-current
   ```

2. **Determine if already in a session:**
   - If already on a `ws/` branch: you're in a session, skip to work
   - If in a worktree (check `git rev-parse --show-toplevel` differs from main repo): skip to work

3. **Ask the user** (one question):
   > "What are you working on? (short description for the branch name)"

4. **Create isolated worktree session:**

   First, try the worktree approach (preferred):
   ```bash
   git checkout main
   git pull origin main
   
   # Create worktree in sibling directory
   BRANCH="ws/<description>-<MMDD>-<HHMM>"
   WORKTREE_DIR="../worktrees/<description>-<MMDD>-<HHMM>"
   
   git worktree add "$WORKTREE_DIR" -b "$BRANCH"
   ```
   
   Then set up the worktree:
   ```bash
   cd "$WORKTREE_DIR"
   
   # Copy environment files (not tracked by git)
   cp "../ZAO OS V1/.env.local" .env.local 2>/dev/null
   
   # Install dependencies (uses npm cache, fast)
   npm install --prefer-offline
   ```

   **Fallback** — if worktree creation fails (e.g. disk space, permissions), fall back to branch-only:
   ```bash
   git checkout -b "$BRANCH"
   ```

   - Format: `ws/fractal-fixes-0406-1423`
   - Always branch from latest `main`
   - Prefix `ws/` makes session branches identifiable

5. **Confirm:**
   > "Session `ws/<name>` created at `../worktrees/<name>/`. Ready to work."
   
   Or if fallback:
   > "Session branch `ws/<name>` created (same directory, worktree unavailable). Ready to work."

## End of Session

When the user says "ship", "done", "pr", "wrap up", or work is complete:

1. Stage and commit any remaining changes
2. Push the session branch: `git push -u origin ws/<name>`
3. Create PR to `main` using `gh pr create`
4. Report the PR URL
5. **Clean up worktree** (only after PR is merged or if user confirms):
   ```bash
   # From the main repo directory:
   cd "../ZAO OS V1"
   git worktree remove "../worktrees/<name>"
   ```
   Do NOT auto-remove — the user merges PRs themselves. Just remind them:
   > "PR created. After you merge, clean up with: `git worktree remove ../worktrees/<name>`"

## Rules

- **Never commit directly to `main`** from a work session
- **Never push to someone else's branch** — always your own `ws/` branch
- **Always pull main before branching** — stale bases cause merge conflicts
- If the branch already exists on remote, append a counter: `ws/fix-0406-1423-2`
- **Always create a PR** as the finishing step — Zaal merges himself
- Keep worktree count to 3-5 max (each needs ~1.2GB for node_modules)
- Use `git worktree list` to see active worktrees

## When NOT to Use

- Quick one-line fixes where the user says "just push to main"
- When the user explicitly says to work on an existing branch
- Research-only sessions (no code changes — no isolation needed)

## Worktree Directory Layout

```
~/Documents/
  ZAO OS V1/                          # Main checkout (stays on main)
  worktrees/
    feature-auth-0411-1000/           # Isolated session
    fix-search-0411-1430/             # Another session
```
