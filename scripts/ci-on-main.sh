#!/usr/bin/env bash
# Start a CI run on main when the commit at the tip of main has none.
#
# WHY. GitHub does not start a workflow run for a push made with the automatic
# GITHUB_TOKEN, and docs-automerge.yml merges with that token. So a bot-merged
# PR lands on main and ci.yml's `push: [main]` never fires. Measured
# 2026-10-11 over the 12 newest commits on main: 8 merged by a user, 8 with a
# push run; 4 merged by github-actions[bot], 0 with a push run.
#
# The one event that same token IS allowed to start a run with is
# workflow_dispatch, which is what this sends.
#
# It asks about the TIP OF MAIN, not about one PR, so it is safe to run at any
# time and as often as wanted: a tip that already has a run is left alone, and
# a merge that one invocation was too early to see is picked up by the next.
#
# Called by .github/workflows/ci-after-automerge.yml.
#
#   ci-on-main.sh <owner/repo>                      dispatch if the tip has no run
#   ci-on-main.sh <owner/repo> --dry-run            say what it would do, send nothing
#   ci-on-main.sh <owner/repo> --dry-run --sha SHA  ask about SHA instead of the tip
#
# Env: SETTLE_SECONDS (wait before looking, default 0), POLL_SECONDS (between
# checks that the dispatched run exists, default 5), POLL_TRIES (default 8).
#
# Exit 0: the tip has a run, or one was dispatched and seen.
# Exit 1: could not read the tip of main, or dispatched and no run appeared.
# Exit 2: bad arguments.
set -uo pipefail

WORKFLOW="ci.yml"
BRANCH="main"

repo="${1:-}"
[ -n "$repo" ] || { echo "usage: ci-on-main.sh <owner/repo> [--dry-run [--sha SHA]]" >&2; exit 2; }
shift
dry=0
sha_arg=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --sha) shift; sha_arg="${1:-}" ;;
    *) echo "ci-on-main: unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done
if [ -n "$sha_arg" ] && [ "$dry" != "1" ]; then
  echo "ci-on-main: --sha is for --dry-run only; a real dispatch always runs on the tip of $BRANCH" >&2
  exit 2
fi

sleep "${SETTLE_SECONDS:-0}"

tip_sha() {
  local s
  s=$(gh api "repos/$repo/commits/$BRANCH" --jq '.sha') || return 1
  printf '%s' "$s" | grep -Eq '^[0-9a-f]{40}$' || return 1
  printf '%s' "$s"
}

# How many CI runs tested this exact commit AS main. Prints a number, or
# returns 1 when the answer could not be read - never 0 for "could not look".
#
# A run counts when it is on the main branch, was started by push,
# workflow_dispatch or schedule, and is either still going or finished with a
# real result. A cancelled, skipped or timed-out run tested nothing.
# pull_request runs never count: they test a PR head, and a squash merge gives
# main a different commit.
runs_for() {
  local json
  json=$(gh api "repos/$repo/actions/workflows/$WORKFLOW/runs?head_sha=$1&per_page=100") || return 1
  printf '%s' "$json" | jq -e --arg b "$BRANCH" '
    [ .workflow_runs[]
      | select(.head_branch == $b)
      | select(.event == "push" or .event == "workflow_dispatch" or .event == "schedule")
      | select(.status != "completed" or .conclusion == "success" or .conclusion == "failure")
    ] | length' 2>/dev/null || return 1
}

if [ -n "$sha_arg" ]; then
  printf '%s' "$sha_arg" | grep -Eq '^[0-9a-f]{40}$' || { echo "ci-on-main: --sha needs a full 40-character commit id" >&2; exit 2; }
  sha="$sha_arg"
elif ! sha=$(tip_sha); then
  echo "::error title=ci-on-main::could not read the tip of $BRANCH - nothing dispatched"
  exit 1
fi

if count=$(runs_for "$sha"); then
  if [ "$count" -gt 0 ]; then
    echo "ci-on-main: $sha already has $count CI run(s) on $BRANCH - nothing to do"
    exit 0
  fi
  echo "ci-on-main: $sha has no CI run on $BRANCH"
else
  # An extra CI run costs minutes; a main nobody tested costs more. So when the
  # runs cannot be read, dispatch.
  echo "::warning title=ci-on-main::could not read the CI runs for $sha - dispatching anyway"
fi

if [ "$dry" = "1" ]; then
  echo "ci-on-main: dry run - would dispatch $WORKFLOW on $BRANCH"
  exit 0
fi

if ! gh workflow run "$WORKFLOW" --repo "$repo" --ref "$BRANCH"; then
  echo "::error title=ci-on-main::the dispatch of $WORKFLOW on $BRANCH was refused"
  exit 1
fi

# An accepted dispatch is not a run. Look for it, on whatever the tip is now -
# main may have moved, and the dispatched run is on the tip at dispatch time.
tries="${POLL_TRIES:-8}"
i=0
while [ "$i" -lt "$tries" ]; do
  sleep "${POLL_SECONDS:-5}"
  if now=$(tip_sha) && seen=$(runs_for "$now") && [ "$seen" -gt 0 ]; then
    echo "ci-on-main: dispatched $WORKFLOW on $BRANCH - $now now has $seen CI run(s)"
    exit 0
  fi
  i=$((i + 1))
done
echo "::error title=ci-on-main::dispatched $WORKFLOW on $BRANCH but no run appeared for the tip after $tries checks"
exit 1
