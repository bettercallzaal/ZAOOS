#!/usr/bin/env bash
# Test: setup-claude-teammate.sh is idempotent - running it twice against a
# clean fake HOME creates dirs once, reports EXISTS on the second run, and
# never errors.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAKE_HOME="$(mktemp -d)"
trap 'rm -rf "$FAKE_HOME"' EXIT

echo "=== first run ==="
FIRST_OUTPUT="$(HOME="$FAKE_HOME" bash "$SCRIPT_DIR/setup-claude-teammate.sh")"
echo "$FIRST_OUTPUT"

if ! echo "$FIRST_OUTPUT" | grep -q "^CREATED:$FAKE_HOME/.zao/clipboard$"; then
  echo "FAIL: first run did not report CREATED for ~/.zao/clipboard" >&2
  exit 1
fi
if ! echo "$FIRST_OUTPUT" | grep -q "^CREATED:$FAKE_HOME/.zao/handoff$"; then
  echo "FAIL: first run did not report CREATED for ~/.zao/handoff" >&2
  exit 1
fi
if [ ! -d "$FAKE_HOME/.zao/clipboard" ] || [ ! -d "$FAKE_HOME/.zao/handoff" ] || [ ! -d "$FAKE_HOME/.zao/private" ]; then
  echo "FAIL: expected dirs not created" >&2
  exit 1
fi

echo "=== second run (idempotency) ==="
SECOND_OUTPUT="$(HOME="$FAKE_HOME" bash "$SCRIPT_DIR/setup-claude-teammate.sh")"
echo "$SECOND_OUTPUT"

if ! echo "$SECOND_OUTPUT" | grep -q "^EXISTS:$FAKE_HOME/.zao/clipboard$"; then
  echo "FAIL: second run did not report EXISTS for ~/.zao/clipboard" >&2
  exit 1
fi

echo "PASS"
