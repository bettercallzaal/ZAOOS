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
# Install is OPT-IN (ZAOOS #4057). With no argument it installs nothing and
# prints ORCA-SETUP SKIPPED, because most lanes are docs or research lanes and
# a full install is about 2.9 GiB each (17 idle lanes held about 36 GiB on
# 2026-10-20). A lane that needs node_modules runs
#   bash scripts/orca-setup.sh --install
# (or sets ORCA_SETUP_INSTALL=1), which does the seed clone below.
#
# Free-space floor: the full-copy fallback (no seed matched, or the clone
# failed) refuses with exit 3 when the disk has less than
# ORCA_SETUP_MIN_FREE_GIB free (default 8). A free figure that cannot be read
# is UNKNOWN and refused the same way. ORCA_SETUP_MIN_FREE_GIB=0 turns it off.
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
# side), and never replaces an existing node_modules. It refuses a seed whose
# node_modules is a symlink, a sibling candidate that resolves outside the
# workspaces root, and a new workspace whose own node_modules is a symlink.
# A failed clone is left at .orca-setup-tmp/node_modules (gitignored by
# **/node_modules) and named loudly for a human to delete (no-rm-rf.md).
#
# Output (stdout, one line per step):
#   ORCA-SETUP SEED:<dir>            - seed chosen
#   ORCA-SETUP CLONED:<seconds>s     - clone finished
#   ORCA-SETUP SKIP-CLONE:<reason>   - node_modules already present
#   ORCA-SETUP SKIPPED:...           - no --install given; exits 0, installs
#                                      nothing
#   ORCA-SETUP REFUSED:...           - this workspace's node_modules is a
#                                      symlink (exit 2), or the full-copy
#                                      fallback is below the free-space floor
#                                      (exit 3); nothing installed
# Exit status is npm install's, except for SKIPPED and REFUSED.

set -u

say()  { echo "ORCA-SETUP $*"; }
loud() { echo "ORCA-SETUP FALLBACK: $*" >&2; }
skip() { echo "ORCA-SETUP SKIP-SEED: $*" >&2; }

ws="$(pwd -P)"

install=0
[ "${1:-}" = --install ] && install=1
[ "${ORCA_SETUP_INSTALL:-}" = 1 ] && install=1
if [ "$install" -ne 1 ]; then
  say "SKIPPED: no npm install (install is opt-in, ZAOOS #4057). If this lane needs node_modules, run: bash scripts/orca-setup.sh --install"
  exit 0
fi

# full_install <reason>: the plain npm install fallback, about 2.9 GiB, so it
# is the only path held to the free-space floor.
full_install() {
  local floor="${ORCA_SETUP_MIN_FREE_GIB:-8}" kib free
  if [ "$floor" != 0 ]; then
    kib="$(df -k "$ws" 2>/dev/null | awk 'NR==2{print $4}')"
    case "$kib" in
      ''|*[!0-9]*) free=UNKNOWN ;;
      *) free=$((kib / 1048576)) ;;
    esac
    if [ "$free" = UNKNOWN ] || [ "$free" -lt "$floor" ]; then
      echo "ORCA-SETUP REFUSED: full npm install needs about 2.9 GiB and $ws has ${free} GiB free (floor ${floor} GiB). Free disk first, or set ORCA_SETUP_MIN_FREE_GIB=0 to override." >&2
      exit 3
    fi
  fi
  loud "$1"
  exec npm install
}

# A symlinked node_modules in the new workspace (live or dangling) would make
# npm install write outside it. Refuse rather than install through it.
if [ -L "$ws/node_modules" ]; then
  echo "ORCA-SETUP REFUSED: $ws/node_modules is a symlink (to $(readlink "$ws/node_modules")). Not installing through it; a human should replace it with a directory." >&2
  exit 2
fi

if [ ! -f "$ws/package-lock.json" ]; then
  full_install "no package-lock.json in $ws, so no seed can match. Running plain npm install."
fi

mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0; }

# One line per candidate: "<kind>\t<dir>\t<root>". kind is "pinned" (ORCA_SEED
# or the main checkout, allowed wherever they resolve) or "child" (must resolve
# to a direct child of <root>, so a symlinked sibling cannot smuggle in a seed
# from elsewhere on disk).
candidates() {
  if [ -n "${ORCA_SEED:-}" ]; then
    printf 'pinned\t%s\t\n' "$ORCA_SEED"
    return
  fi
  local roots="${ORCA_SEED_ROOTS:-$(dirname "$ws")}"
  local IFS=:
  for root in $roots; do
    for d in "$root"/*/; do
      [ -d "$d" ] && printf 'child\t%s\t%s\n' "${d%/}" "$root"
    done
  done
  [ -z "${ORCA_SEED_ROOTS:-}" ] && printf 'pinned\t%s\t\n' "$HOME/Documents/ZAO OS V1"
}

pick_seed() {
  local best="" best_t=0 kind d root real realroot t
  while IFS=$'\t' read -r kind d root; do
    real="$(cd "$d" 2>/dev/null && pwd -P)" || continue
    [ "$real" = "$ws" ] && continue
    if [ "$kind" = child ]; then
      realroot="$(cd "$root" 2>/dev/null && pwd -P)" || continue
      if [ "$(dirname "$real")" != "$realroot" ]; then
        skip "$d resolves to $real, outside $realroot"
        continue
      fi
    fi
    # The seed's node_modules must be a real directory. A symlink would be
    # cloned as a symlink, and npm install would then write through it.
    if [ -L "$real/node_modules" ] || [ ! -d "$real/node_modules" ]; then
      [ -L "$real/node_modules" ] && skip "$d has a symlinked node_modules"
      continue
    fi
    [ -f "$real/node_modules/.package-lock.json" ] || continue
    [ -L "$real/node_modules/.package-lock.json" ] && continue
    cmp -s "$real/package-lock.json" "$ws/package-lock.json" || continue
    t="$(mtime "$real/node_modules/.package-lock.json")"
    if [ "$t" -gt "$best_t" ]; then best="$real"; best_t="$t"; fi
  done < <(candidates)
  printf '%s' "$best"
}

fallback=""
if [ -e "$ws/node_modules" ]; then
  say "SKIP-CLONE:node_modules already exists, left as it is"
else
  seed="$(pick_seed)"
  if [ -z "$seed" ]; then
    fallback="no live workspace has a package-lock.json matching this one. Running plain npm install (full copy, about 2.9 GiB)."
  else
    say "SEED:$seed"
    tmp="$ws/.orca-setup-tmp"
    if [ -e "$tmp" ]; then
      fallback="$tmp already exists, probably from an earlier failed clone. Not touching it. Running plain npm install; delete $tmp by hand to let the next setup clone again."
    else
      mkdir "$tmp"
      start=$SECONDS
      if cp -cR "$seed/node_modules" "$tmp/node_modules" && [ ! -L "$tmp/node_modules" ] && mv "$tmp/node_modules" "$ws/node_modules"; then
        rmdir "$tmp"
        say "CLONED:$((SECONDS - start))s"
      else
        fallback="cp -c clone from $seed failed. The partial copy is at $tmp/node_modules for a human to delete. Running plain npm install."
      fi
    fi
  fi
fi

[ -n "$fallback" ] && full_install "$fallback"
exec npm install
