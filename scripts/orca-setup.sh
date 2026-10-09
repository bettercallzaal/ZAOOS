#!/usr/bin/env bash
# orca-setup.sh - setup step for a NEW Orca workspace of ZAOOS.
#
# Clones node_modules from a seed workspace with APFS clonefile (`cp -cR`),
# so the new workspace shares disk blocks with the seed until either side
# writes, then runs `npm install` as before. Design and measurements:
# zao-vault notes/node-modules-sharing-2026-10-09.md (option A, about 2.4 to
# 2.9 GiB saved per new workspace).
#
# Run it from the new workspace's root (Orca runs setup there).
#
# Seed choice: the newest LIVE workspace whose package-lock.json is
# byte-identical to this one's. Live = it has node_modules/.package-lock.json,
# which npm writes at the end of a completed install. Newest = that file's
# mtime. Candidates are every sibling of this workspace plus
# ~/Documents/ZAO OS V1, or ORCA_SEED_ROOTS (colon-separated list of
# directories whose children are candidates), or ORCA_SEED (one directory).
#
# Fallback: when there is no matching seed, or `cp -c` fails, it prints an
# ORCA-SETUP FALLBACK line to stderr and runs a plain `npm install`. The worst
# case is exactly what Orca did before.
#
# Safety: it writes only inside the current directory. It never removes
# anything, never touches the seed (the clone is read-only from the seed's
# side), and never replaces an existing node_modules. A failed clone is left
# at .orca-setup-tmp/node_modules (gitignored by **/node_modules) and named
# loudly for a human to delete (no-rm-rf.md).
#
# Output (stdout, one line per step):
#   ORCA-SETUP SEED:<dir>            - seed chosen
#   ORCA-SETUP CLONED:<seconds>s     - clone finished
#   ORCA-SETUP SKIP-CLONE:<reason>   - node_modules already present
# Exit status is npm install's.

set -u

say()  { echo "ORCA-SETUP $*"; }
loud() { echo "ORCA-SETUP FALLBACK: $*" >&2; }

ws="$(pwd -P)"

if [ ! -f "$ws/package-lock.json" ]; then
  loud "no package-lock.json in $ws, so no seed can match. Running plain npm install."
  exec npm install
fi

mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0; }

candidates() {
  if [ -n "${ORCA_SEED:-}" ]; then
    printf '%s\n' "$ORCA_SEED"
    return
  fi
  local roots="${ORCA_SEED_ROOTS:-$(dirname "$ws")}"
  local IFS=:
  for root in $roots; do
    for d in "$root"/*/; do
      [ -d "$d" ] && printf '%s\n' "${d%/}"
    done
  done
  [ -z "${ORCA_SEED_ROOTS:-}" ] && printf '%s\n' "$HOME/Documents/ZAO OS V1"
}

pick_seed() {
  local best="" best_t=0 d real t
  while IFS= read -r d; do
    real="$(cd "$d" 2>/dev/null && pwd -P)" || continue
    [ "$real" = "$ws" ] && continue
    [ -f "$real/node_modules/.package-lock.json" ] || continue
    cmp -s "$real/package-lock.json" "$ws/package-lock.json" || continue
    t="$(mtime "$real/node_modules/.package-lock.json")"
    if [ "$t" -gt "$best_t" ]; then best="$real"; best_t="$t"; fi
  done < <(candidates)
  printf '%s' "$best"
}

if [ -e "$ws/node_modules" ]; then
  say "SKIP-CLONE:node_modules already exists, left as it is"
else
  seed="$(pick_seed)"
  if [ -z "$seed" ]; then
    loud "no live workspace has a package-lock.json matching this one. Running plain npm install (full copy, about 2.9 GiB)."
  else
    say "SEED:$seed"
    tmp="$ws/.orca-setup-tmp"
    if [ -e "$tmp" ]; then
      loud "$tmp already exists (an earlier failed clone?). Not touching it. Running plain npm install."
    else
      mkdir "$tmp"
      start=$SECONDS
      if cp -cR "$seed/node_modules" "$tmp/node_modules" && mv "$tmp/node_modules" "$ws/node_modules"; then
        rmdir "$tmp"
        say "CLONED:$((SECONDS - start))s"
      else
        loud "cp -c clone from $seed failed. The partial copy is at $tmp/node_modules for a human to delete. Running plain npm install."
      fi
    fi
  fi
fi

exec npm install
