#!/usr/bin/env bash
# Pre-commit secret scan. Hard-aborts a commit when the staged diff contains an
# obvious secret. Mirrors .claude/rules/secret-hygiene.md step 2.
#
# Two reasons this exists: a Telegram bot token leaked into a session transcript
# and a real token leaked into a test fixture, both 2026-05. See doc 683.
#
# Invoked from .husky/pre-commit. Standalone-safe: pass repo root as $1 or it
# falls back to git rev-parse. Override a confirmed false positive with
# `git commit --no-verify`.
#
# Patterns are deliberately PREFIXED tokens only (high precision, near-zero
# false positives). A bare 64-char-hex check was omitted on purpose - it trips
# on lockfile hashes and research docs. Every secret type the ZAO stack uses
# (Anthropic, OpenRouter, OpenAI, GitHub PATs, Telegram, AWS, PEM keys) is
# prefixed, so the named patterns cover the real risk.

set -uo pipefail

REPO="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[[ -z "$REPO" ]] && exit 0
cd "$REPO" || exit 0

# MID-MERGE: A LINE IS NEWLY AUTHORED ONLY IF IT IS ABSENT FROM BOTH PARENTS.
#
# `git diff --cached` compares the index against HEAD alone. In a merge commit
# the index holds everything BOTH sides brought, so every line the OTHER parent
# contributed reads as newly added and this gate refuses the commit over content
# already on main that nobody in the merge wrote.
#
# Same bug, same shape, as check-research-doc-collisions.sh (#3498) and
# git-pii-scan.py (#3502). Found here the way both of those were found: by being
# blocked by it. Third of five gates - zao-claims-check (zaal-dotfiles) and
# check-research-index.sh still have it.
#
# Two fixes were tried on the doc gate and both were wrong, recorded so they are
# not re-derived. `git merge-base` does not help: the other side added its content
# AFTER the branch point, so it is in that diff too. And exiting early when
# MERGE_HEAD exists is FAIL-OPEN - conflict resolution is an edit, so a secret
# typed while resolving would skip a security gate entirely, which is
# `--no-verify` with no flag and no trace.
#
# Intersecting the two parents' diffs is exact. The other side's content is in
# MERGE_HEAD so it never enters that set; ours is in HEAD so it never enters the
# first; content authored during the resolution is in neither, enters both, and
# is still caught.
MERGING=""
if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then MERGING=1; fi

# Added lines as PATH<TAB>LINE, so the intersection below compares a line IN THE
# FILE IT BELONGS TO.
#
# HONEST SCOPE. I expected bare text to allow a false pass - the other parent's
# `+FOO` in one file cancelling a genuinely new `+FOO` in another - and wrote a
# control for it. THE CONTROL DID NOT GO RED: a file created during the
# resolution is new relative to MERGE_HEAD as well, so its lines are always in
# that set and cannot be cancelled. I could not construct a case where the two
# spellings differ in outcome. Path-tagging is kept because comparing a line in
# the file it belongs to is the right comparison and costs one awk, NOT because
# it is a demonstrated guard. Stated here so nobody later reads it as one.
added_rows() { # $@ = extra args to git diff (e.g. MERGE_HEAD)
  git diff --cached --diff-filter=ACMR -U0 "$@" 2>/dev/null | awk '
    /^\+\+\+ / { path = substr($0, 7); next }          # "+++ b/path"
    /^\+/        { print path "\t" substr($0, 2) }
  '
}

# Keep only what is also new relative to MERGE_HEAD.
#
# FAILS CLOSED, and this is the most important line in the file. If the
# MERGE_HEAD read fails OR genuinely returns nothing, the input is returned
# UNFILTERED - today's behaviour. An empty `theirs` intersected with anything is
# empty, so treating a failed read as "the other parent added nothing" would pass
# EVERY line, and a conflicted merge is exactly when git is likeliest to be in an
# odd state. Erring this way can only ever over-report.
narrow_to_both_parents() { # stdin = ours (already normalised); "$@" = theirs cmd
  local ours theirs
  ours=$(cat)
  if [[ -z "$MERGING" || -z "$ours" ]]; then printf '%s\n' "$ours"; return 0; fi
  if ! theirs=$("$@") || [[ -z "$theirs" ]]; then
    printf '%s\n' "$ours"   # cannot tell "added nothing" from "read failed"
    return 0
  fi
  comm -12 <(printf '%s\n' "$ours" | sort -u) <(printf '%s\n' "$theirs" | sort -u)
}

# The filter must include R. `--diff-filter=ACM` means Added/Copied/Modified and
# EXCLUDES Renamed, and git detects a rename by default (diff.renames is on since
# 2.9). So `git mv old new` plus an edit in the same commit stages as a single R
# entry that ACM drops entirely - the file is neither listed by --name-only nor
# diffed by the content scan below, and the gate exits 0 having read nothing.
# Measured: `git mv notes.md config/keys.md` + adding a line stages as R058, and
# `git diff --cached --diff-filter=ACM -U0` prints nothing while the unfiltered
# diff prints the added line. Renaming a file INTO `.env` is R100 and is invisible
# to the check below for the same reason. D stays excluded on purpose: DELETING a
# committed .env is the fix, not the offence.

# 1. No real .env file staged (.env.example is allowed).
# NEVER READ THIS EXIT CODE THROUGH A PIPE. `git ... | grep` reports grep's
# status, so a git that cannot read the index looks identical to a clean tree.
# Capture first, check git, then filter.
if ! STAGED_NAMES=$(git diff --cached --name-only --diff-filter=ACMR 2>&1); then
  echo "" >&2
  echo "[secret-scan] BLOCKED - cannot read the staged changes, so nothing was scanned:" >&2
  printf '%s\n' "$STAGED_NAMES" | sed 's/^/    /' >&2
  echo "This gate fails CLOSED. Fix the repository state and commit again." >&2
  exit 1
fi
STAGED_NAMES=$(printf '%s\n' "$STAGED_NAMES" | narrow_to_both_parents \
  git diff --cached --name-only --diff-filter=ACMR MERGE_HEAD)
ENV_STAGED=$(printf '%s\n' "$STAGED_NAMES" \
  | grep -E '(^|/)\.env($|\.local$|\.production$)' || true)
if [[ -n "$ENV_STAGED" ]]; then
  echo "" >&2
  echo "[secret-scan] BLOCKED - an env file is staged:" >&2
  echo "$ENV_STAGED" | sed 's/^/    /' >&2
  echo "Unstage it: git restore --staged <file>. Env files must stay gitignored." >&2
  exit 1
fi

# 2. Scan ADDED lines of the staged diff for secret patterns.
# Same rule again, and this is the one that mattered: `2>/dev/null || true`
# turned "I could not look" into "nothing is staged", so a staged AWS key passed
# with exit 0 on a corrupted index - measured, and the header above claims this
# gate fails closed. An empty result must mean an empty diff and nothing else.
if ! RAW_DIFF=$(git diff --cached --diff-filter=ACMR -U0 2>&1); then
  echo "" >&2
  echo "[secret-scan] BLOCKED - cannot read the staged diff, so nothing was scanned:" >&2
  printf '%s\n' "$RAW_DIFF" | sed 's/^/    /' >&2
  echo "This gate fails CLOSED. Fix the repository state and commit again." >&2
  exit 1
fi
# Path-tagged on BOTH sides so the two sets are the same spelling of the same
# thing, then the tag is stripped back off so the patterns below see plain lines
# and cannot match a file path.
DIFF=$(added_rows | narrow_to_both_parents added_rows MERGE_HEAD | cut -f2- || true)
[[ -z "$DIFF" ]] && exit 0

HITS=""
check() { # $1 = label, $2 = extended-regex
  local m
  m=$(printf '%s\n' "$DIFF" | grep -nE "$2" 2>/dev/null || true)
  [[ -n "$m" ]] && HITS="${HITS}  [$1]
$(printf '%s\n' "$m" | sed 's/^/      /')
"
}

check "private-key assignment with hex value" 'PRIVATE_KEY[A-Z_]*[[:space:]]*=.*[0-9a-fA-F]{32}'
check "PEM private key block"                  'BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY'
check "Anthropic API key"                      'sk-ant-[A-Za-z0-9_-]{20,}'
check "OpenAI / OpenRouter API key"            'sk-(proj-|or-v1-)?[A-Za-z0-9_-]{32,}'
check "GitHub classic PAT"                     'gh[pousr]_[A-Za-z0-9]{36,}'
check "GitHub fine-grained PAT"                'github_pat_[A-Za-z0-9_]{50,}'
check "Telegram bot token"                     '[0-9]{8,10}:[A-Za-z0-9_-]{35}'
check "AWS access key id"                      'AKIA[0-9A-Z]{16}'

if [[ -n "$HITS" ]]; then
  echo "" >&2
  echo "[secret-scan] BLOCKED - the staged diff looks like it contains a secret:" >&2
  echo "" >&2
  printf '%s' "$HITS" >&2
  echo "" >&2
  echo "If it is a placeholder/fixture: redact it to [REDACTED] and re-stage." >&2
  echo "If it is a real secret: rotate it NOW, then commit the redacted version." >&2
  echo "False positive you are certain about: git commit --no-verify" >&2
  exit 1
fi

exit 0
