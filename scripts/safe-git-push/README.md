# safe-git-push

Defense-in-depth push safety per doc 461. Stops:

- Direct push to `main` / `master`
- Push to a branch whose PR was already merged (orphan commit risk)

## Files

- `safe-git-push.sh` — the checker. Single source of truth, called from all enforcement layers.
- `install.sh` — idempotent installer for the script + git pre-push hook in the current checkout.

## Quick install (per-checkout)

```bash
bash scripts/safe-git-push/install.sh
```

This:
1. Symlinks `~/bin/safe-git-push.sh` to the repo copy so updates flow via `git pull`.
2. Writes `.git/hooks/pre-push` that calls the checker.

Repeat for every worktree (or wire into `/worksession` skill).

## Claude Code PreToolUse hook (per-user)

Add to `~/.claude/settings.json` inside the existing `"hooks"` block:

```json
"PreToolUse": [
  {
    "matcher": "Bash",
    "hooks": [
      {
        "type": "command",
        "command": "SAFE_PUSH_ARGS=\"$CLAUDE_TOOL_INPUT_command\" REPO_DIR=\"$(pwd)\" \"$HOME/bin/safe-git-push.sh\"",
        "if": "Bash(git push *)",
        "timeout": 12
      }
    ]
  }
]
```

This blocks Claude-initiated pushes that violate the rules.

## Optional zsh wrapper

Append to `~/.zshrc`:

```bash
git() {
  if [[ "$1" == "push" ]]; then
    SAFE_PUSH_ARGS="$*" REPO_DIR="$(command git rev-parse --show-toplevel 2>/dev/null || pwd)" ~/bin/safe-git-push.sh || return 2
  fi
  command git "$@"
}
```

Catches manually-typed `git push` commands. Bypass: `command git push ...`.

## GitHub branch protection (server-side)

```bash
gh api repos/bettercallzaal/ZAOOS/branches/main/protection \
  -X PUT \
  -F enforce_admins=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F required_status_checks=null \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -F restrictions=null
```

Server-side authoritative — even if every client hook fails, GitHub refuses direct pushes to main.

## Test

```bash
~/bin/safe-git-push.sh                       # OK on a ws/ branch
git checkout main; git push --dry-run        # BLOCKED (push to main)
ALLOW_UNSAFE_PUSH=1 git push --dry-run       # bypass (emergency only)
```

## Disable

```bash
rm .git/hooks/pre-push                       # remove pre-push hook
# Edit ~/.claude/settings.json to remove the PreToolUse Bash entry
# Edit ~/.zshrc to remove the git() function
```

## Refs

- Doc 461: `research/dev-workflows/461-push-to-merged-pr-failure-fix/README.md`
- Existing feedback memos covering same intent (now downgraded to "intent docs"): `feedback_no_push_merged_pr.md`, `feedback_branch_discipline.md`, `feedback_always_pr.md`, `feedback_workspace_worktrees.md`
