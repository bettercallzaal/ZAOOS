---
name: worksession
description: Use at the start of any work session, especially when multiple Claude Code terminals may be open. Creates an isolated branch, prevents conflicts from parallel sessions on the same branch. Also use when asked to "start a session", "new branch", or "ws".
---

# Work Session

Branch isolation for parallel Claude Code terminals. One branch per session, PR at the end.

## Start of Session

Run these steps in order:

1. **Fetch latest and check state:**
   ```
   git fetch origin
   git status
   git branch --show-current
   ```

2. **Determine base branch:**
   - If on `main` or a shared feature branch with remote tracking: branch off
   - If already on a `ws/` branch with no remote: you're in a session, skip to work

3. **Ask the user** (one question):
   > "What are you working on? (short description for the branch name)"

4. **Create session branch:**
   ```
   git checkout main
   git pull origin main
   git checkout -b ws/<description>-<MMDD>-<HHMM>
   ```
   - Format: `ws/fractal-fixes-0406-1423`
   - Always branch from latest `main`
   - Prefix `ws/` makes session branches identifiable

5. **Confirm:**
   > "Session branch `ws/<name>` created from latest main. Ready to work."

## End of Session

When the user says "ship", "done", "pr", "wrap up", or work is complete:

1. Stage and commit any remaining changes
2. Push the session branch: `git push -u origin ws/<name>`
3. Create PR to `main` using `gh pr create`
4. Report the PR URL

## Rules

- **Never commit directly to `main`** from a work session
- **Never push to someone else's branch** — always your own `ws/` branch
- **Always pull main before branching** — stale bases cause merge conflicts
- If the branch already exists on remote, append a counter: `ws/fix-0406-1423-2`

## When NOT to Use

- Quick one-line fixes where the user says "just push to main"
- When the user explicitly says to work on an existing branch
- Research-only sessions (no code changes)
