#!/usr/bin/env bash
# Wire the version-controlled .husky/ hooks into .git/hooks/ so git actually
# runs them. Run once after cloning ZAOOS:  bash scripts/install-git-hooks.sh
#
# Why this exists: core.hooksPath points at .git/hooks (not .husky), so the
# .husky/ hooks are version-controlled but inert until delegated. This script
# writes thin delegators into .git/hooks/. It does NOT touch git config.
#
# Each delegator is local-only (not committed); the real hook logic lives in
# .husky/ and propagates through git. See doc 683.

set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$(git rev-parse --git-path hooks)"
mkdir -p "$HOOKS_DIR"

MARKER="# zaoos-husky-delegator"

for hook in pre-commit; do
  src="$REPO/.husky/$hook"
  [[ -f "$src" ]] || continue
  dst="$HOOKS_DIR/$hook"

  if [[ -f "$dst" ]] && ! grep -q "$MARKER" "$dst" 2>/dev/null; then
    cp "$dst" "$dst.bak.$(date +%s)"
    echo "backed up existing $hook -> $dst.bak.*"
  fi

  cat > "$dst" <<EOF
#!/usr/bin/env sh
$MARKER - delegates to version-controlled .husky/$hook (scripts/install-git-hooks.sh)
exec "$REPO/.husky/$hook" "\$@"
EOF
  chmod +x "$dst"
  echo "wired .git/hooks/$hook -> .husky/$hook"
done

echo "done. pre-push is left as-is (safe-git-push wrapper, doc 461)."
