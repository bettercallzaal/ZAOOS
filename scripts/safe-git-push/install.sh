#!/usr/bin/env bash
# Install the safe-git-push checker + git pre-push hook in this checkout.
# Per doc 461. Idempotent — safe to re-run on every worktree.
#
# Usage:
#   bash scripts/safe-git-push/install.sh
#
# Installs:
#   - ~/bin/safe-git-push.sh (symlink to repo copy, so updates flow via git pull)
#   - .git/hooks/pre-push in the current worktree
#
# Does NOT install the Claude Code PreToolUse hook — that's a per-user setting.
# See scripts/safe-git-push/README.md for the settings.json snippet.

set -euo pipefail

REPO_DIR="$(git rev-parse --show-toplevel)"
SCRIPT_SRC="$REPO_DIR/scripts/safe-git-push/safe-git-push.sh"

if [[ ! -f "$SCRIPT_SRC" ]]; then
  echo "Cannot find $SCRIPT_SRC" >&2
  exit 1
fi

mkdir -p "$HOME/bin"
ln -sf "$SCRIPT_SRC" "$HOME/bin/safe-git-push.sh"
echo "Installed: $HOME/bin/safe-git-push.sh -> $SCRIPT_SRC"

if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
  echo "WARNING: $HOME/bin is not on PATH. Add the following to ~/.zshrc or ~/.bashrc:"
  echo '  export PATH="$HOME/bin:$PATH"'
fi

HOOK_DIR="$(git rev-parse --git-dir)/hooks"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/pre-push" <<'EOF'
#!/usr/bin/env bash
# Doc 461: block push to main/master OR to a branch with a merged PR.
SAFE_PUSH_ARGS="$*" REPO_DIR="$(git rev-parse --show-toplevel)" "$HOME/bin/safe-git-push.sh"
EOF
chmod +x "$HOOK_DIR/pre-push"
echo "Installed: $HOOK_DIR/pre-push"

echo ""
echo "Done. Test:"
echo "  $HOME/bin/safe-git-push.sh    # should print OK with current branch"
echo ""
echo "For Claude Code PreToolUse hook, see scripts/safe-git-push/README.md."
