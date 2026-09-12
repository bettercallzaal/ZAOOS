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
DIFF=$(printf '%s\n' "$RAW_DIFF" | grep -E '^\+' | grep -vE '^\+\+\+' || true)
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
