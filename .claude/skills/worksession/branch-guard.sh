#!/bin/bash
# Branch guard — runs before git push to catch parallel session conflicts
# Warns if: pushing to main, branch is behind remote, or not on a ws/ branch
# Works in both regular checkouts and git worktrees

cd "$PROJECT_DIR" 2>/dev/null || exit 0

BRANCH=$(git branch --show-current 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

# Block direct push to main
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "BLOCKED: You're pushing directly to $BRANCH. Use /worksession to create a session branch first."
  exit 1
fi

# Warn if not on a ws/ branch (might be a shared feature branch)
if [[ "$BRANCH" != ws/* ]]; then
  echo "WARNING: Branch '$BRANCH' is not a work session branch (ws/*). Another terminal might be on this branch. Consider using /worksession to create an isolated branch."
fi

# Check if we're in a worktree (informational)
TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null)
COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null)
if [ "$COMMON_DIR" != ".git" ] && [ "$COMMON_DIR" != "$(git rev-parse --git-dir 2>/dev/null)" ]; then
  # We're in a linked worktree — good, isolated
  :
fi

# Check if remote branch exists and we're behind
git fetch origin "$BRANCH" --quiet 2>/dev/null
BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null)
if [ -n "$BEHIND" ] && [ "$BEHIND" -gt 0 ]; then
  echo "WARNING: Your branch is $BEHIND commit(s) behind origin/$BRANCH. Another session may have pushed. Run 'git pull --rebase origin $BRANCH' first."
  exit 1
fi

exit 0
