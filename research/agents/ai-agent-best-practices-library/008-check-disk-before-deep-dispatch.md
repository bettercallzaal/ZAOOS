---
id: agent-008
category: deployment-ops
tier: core
severity: medium
applies_to: [multi-agent]
deprecated_since: null
sources: [doc-766 friction-sources, "memory:project_zoe_orchestrator_locked"]
---

## RUN df -h before any DISPATCH of 5+ parallel sub-agents

Each parallel sub-agent writes its full conversation transcript to `/private/tmp/claude-501/<session>/tasks/*.output`. At 5+ agents with multi-tool-call transcripts, total can hit 50-200MB. If the disk is already tight, ENOSPC kills Bash, TaskUpdate, and even Write tool calls for the rest of the session.

Doc 766 lost ~15 minutes recovering from this exact pattern on a 460GB disk that hit 100% mid-DISPATCH.

The cheap fix is to run `df -h /` before any DISPATCH of 5+ sub-agents. If <5GB free, defer the dispatch or run cleanup first (`rm -rf ~/Library/Caches/Homebrew/* ~/.npm/_cacache ~/Library/Developer/Xcode/DerivedData/*`).

Cleanup commands the operator can run safely:
```bash
rm -rf /private/tmp/claude-501/*/tasks/*.output
rm -rf ~/Library/Caches/Homebrew/*
rm -rf ~/.npm/_cacache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### When NOT to do this

STANDARD or QUICK tier sub-agent dispatches (1-3 agents): transcript size is negligible, skip the check.

### Example

```bash
# Before DISPATCH of 5+:
FREE_GB=$(df -h / | tail -1 | awk '{print $4}' | sed 's/Gi//')
if (( $(echo "$FREE_GB < 5" | bc -l) )); then
  echo "Disk tight ($FREE_GB Gi free), running cleanup first"
  rm -rf /private/tmp/claude-501/*/tasks/*.output
  df -h /
fi
# Then dispatch
```
