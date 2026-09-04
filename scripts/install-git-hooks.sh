#!/usr/bin/env bash
# Wire the version-controlled .husky/ hooks into .git/hooks/ so git actually
# runs them. Kept as the documented entry point (doc 683):
#
#   bash scripts/install-git-hooks.sh
#
# The implementation moved to install-git-hooks.mjs on 2026-09-01 so that npm's
# `prepare` script can run it on every platform - npm on Windows shells out to
# cmd.exe, where `bash` may not be on PATH. Read that file's header for why the
# hooks were inert for as long as they were. This is a one-line delegator so the
# two entry points cannot drift.

set -euo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/install-git-hooks.mjs"
