#!/bin/bash
# zao-dispatch <brand-lane> "<task instruction>" [--doc]
#
# The orchestrator's dispatch primitive. Posts a structured TASK to a brand's
# relay lane so that brand's worker terminal (VPS loop) picks it up on its next
# tick via the relay-autopull hook and works it PR-only.
#
# This is the SEND half of the per-brand-terminals harness (doc 2182). The
# RECEIVE half (the loop pulling its lane + acting on TASK messages) is a gated
# VPS deploy - see the doc. Until that ships, a dispatched task queues in the
# lane and a human/loop drains it with `zao-relay inbox <lane>`.
#
# Usage:
#   zao-dispatch zaostock "Draft the Oct-3 run-of-show from doc 2181 actions"
#   zao-dispatch sparkz   "Wire loadIdentities() per doc 2179 build path" --doc
#
# Guarantees: PR-only + gated stays gated. A dispatched task NEVER carries
# authority to merge, send outbound, spend, or deploy - the receiving loop's
# own guardrails (agent-loops rule 8) still bind. --doc appends a reminder that
# the deliverable is a research doc / PR, never a live change.
set -euo pipefail

LANE="${1:?usage: zao-dispatch <brand-lane> \"<task>\" [--doc]}"
TASK="${2:?usage: zao-dispatch <brand-lane> \"<task>\" [--doc]}"
DOC_ONLY=0
[ "${3:-}" = "--doc" ] && DOC_ONLY=1

command -v zao-relay >/dev/null 2>&1 || { echo "zao-dispatch: zao-relay not found"; exit 1; }

MSG="TASK (dispatched by orchestrator): ${TASK}"
MSG="${MSG}
Guardrails: PR-only. Do NOT merge, send outbound, spend, or deploy - open a PR / write a doc and report back on this lane. Gated actions bounce to Zaal."
[ "$DOC_ONLY" = 1 ] && MSG="${MSG}
Deliverable is a research doc or a PR, never a live change."

zao-relay send "$LANE" "$MSG"
echo "dispatched -> lane:${LANE}"
