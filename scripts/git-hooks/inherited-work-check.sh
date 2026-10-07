#!/bin/sh
# inherited-work-check.sh - does HEAD carry commits that belong to another lane?
#
# WHY THIS EXISTS. In a checkout that several lanes share, `git checkout -b <new>`
# with no start-point branches off whatever the last lane left HEAD on. Measured
# 2026-09-20 in ~/Documents/ZAO OS V1: this happened TWICE in one day, to two
# different lanes, five hours apart, neither aware of the other. One inherited
# another lane's in-flight research doc and its index row and opened a PR with
# them; the other produced PRs that came out mergeable=false. Both were caught
# late - by a CI collision guard and by a red mergeable flag - and git itself
# said nothing at any point.
#
# WHAT IT CANNOT DO. Git has no pre-checkout hook (checked against git 2.50.1:
# the hook set has no way to intervene before a checkout). So a bare
# `git checkout -b` CANNOT be refused. This runs after the fact in post-checkout,
# where it can only tell you, and before a push in pre-push, where it can refuse.
#
# THE TEST. Commits between origin/main and HEAD that are ALSO reachable from
# some other remote branch are, by construction, somebody else's work riding on
# your branch. Your own new commits are reachable from no remote branch at all.
set -u
BASE="${INHERIT_BASE:-origin/main}"

git rev-parse --verify --quiet "$BASE" >/dev/null 2>&1 || exit 0   # nothing to compare against
head_ref=$(git symbolic-ref --quiet --short HEAD 2>/dev/null) || exit 0
[ "$head_ref" = "main" ] && exit 0
[ "$head_ref" = "master" ] && exit 0

mine=$(git rev-list "$BASE".."HEAD" 2>/dev/null) || exit 0
[ -z "$mine" ] && exit 0

# A branch that has been PUSHED has its own commits reachable from its own
# remote counterpart, and from its configured upstream. Those are not another
# lane's work, they are yours coming back at you. Dry-run 2026-09-20 over 25
# live worktrees flagged 7; SIX of the seven were exactly this, the branch
# seeing its own remote. A near-universal result from a new instrument is the
# instrument, so the exclusions are part of the check, not a nicety.
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)
self_remote=""
for r in $(git remote 2>/dev/null); do
  self_remote="$self_remote
$r/$head_ref"
done

found=""
for c in $mine; do
  # every remote branch containing this commit, except the base, this branch's
  # own remote counterpart on any remote, and its configured upstream
  others=$(git branch -r --contains "$c" 2>/dev/null \
    | sed 's/^[* ]*//' | grep -v '\->' \
    | grep -v -x "${BASE#refs/remotes/}" \
    | { [ -n "$upstream" ] && grep -v -x "$upstream" || cat; } \
    | grep -v -x -F "$(printf '%s' "$self_remote" | sed '/^$/d')" \
    | head -3)
  if [ -n "$others" ]; then
    found="$found$c $(echo "$others" | tr '\n' ' ')
"
  fi
done

[ -z "$found" ] && exit 0

printf '%s\n' "INHERITED WORK: this branch carries commits that belong to another branch." >&2
printf '%s\n' "  Branch: $head_ref" >&2
printf '%s\n' "  These commits are reachable from a remote branch that is not $BASE:" >&2
printf '%s' "$found" | while IFS= read -r line; do
  [ -n "$line" ] && printf '    %s\n' "$line" >&2
done
printf '%s\n' "" >&2
printf '%s\n' "  In a shared checkout, 'git checkout -b <name>' with no start-point" >&2
printf '%s\n' "  branches off whatever the last lane left HEAD on. Rebuild off the base:" >&2
printf '%s\n' "    git checkout -b <name> $BASE" >&2
printf '%s\n' "    git cherry-pick <your own commits>" >&2
printf '%s\n' "  Do not force-push the branch you inherited from. It is someone else's." >&2
exit 1
