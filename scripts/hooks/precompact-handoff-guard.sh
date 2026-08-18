#!/bin/bash
# precompact-handoff-guard.sh - PreCompact hook (handoff-discipline.md rule 2).
#
# Fires before compaction. If this lane's vault brief is stale (>6h) or
# missing, emit a loud directive: write/refresh the handoff NOW, before
# compaction degrades the context that would write it well. The wavewarz
# lane died at 90% context without a brief; this is the structural fix.
#
# Never blocks (exit 0 always) - it instructs the model, it does not gate.
set -u
H="$HOME/zao-vault/handoffs"
LANE="${ZAO_LANE:-$(tmux display-message -p '#S' 2>/dev/null || echo unknown)}"
BRIEF="$H/$LANE.md"
now=$(date +%s)
if [[ -f "$BRIEF" ]]; then
  mt=$(stat -f %m "$BRIEF" 2>/dev/null || stat -c %Y "$BRIEF" 2>/dev/null || echo 0)
  age_h=$(( (now - mt) / 3600 ))
  if (( age_h < 6 )); then
    echo "handoff-guard: $LANE brief is ${age_h}h old - fresh enough."
    exit 0
  fi
  echo "HANDOFF GUARD: compaction is firing and $BRIEF is ${age_h}h stale."
else
  echo "HANDOFF GUARD: compaction is firing and NO brief exists for lane '$LANE'."
fi
cat <<'EOF'
Before doing anything else after compaction: write or refresh this lane's
handoff at ~/zao-vault/handoffs/<lane>.md per the TEMPLATE (mission, priority
order, Zaal tap stack, cautions, links, session-summary tail; frontmatter
status: unconsumed). If context is too degraded for a full brief, emergency-
dump the minimal one: current tasks, git state, open threads, last user
directive. Then commit + push the vault. See .claude/rules/handoff-discipline.md.
EOF
exit 0
