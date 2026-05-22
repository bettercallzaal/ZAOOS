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

# 1. No real .env file staged (.env.example is allowed).
ENV_STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null \
  | grep -E '(^|/)\.env($|\.local$|\.production$)' || true)
if [[ -n "$ENV_STAGED" ]]; then
  echo "" >&2
  echo "[secret-scan] BLOCKED - an env file is staged:" >&2
  echo "$ENV_STAGED" | sed 's/^/    /' >&2
  echo "Unstage it: git restore --staged <file>. Env files must stay gitignored." >&2
  exit 1
fi

# 2. Scan ADDED lines of the staged diff for secret patterns.
DIFF=$(git diff --cached --diff-filter=ACM -U0 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' || true)
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
