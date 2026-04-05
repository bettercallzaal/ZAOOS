# 259 — Agent Self-Optimization: AutoAgent + Claude Code Hooks

**Date:** 2026-04-05
**Sources:**
- https://x.com/kevingu/status/2039843234760073341 (AutoAgent)
- https://x.com/zodchiii/status/2040000216456143002 (Claude Code Hooks)

---

## AutoAgent — Self-Optimizing Agents

**From Kevin Gu (@kevingu), April 2026**

AutoAgent is an open source library for autonomously improving agents on any domain. Hit #1 on SpreadsheetBench (96.5%) and #1 on TerminalBench (55.1%) after optimizing for 24+ hours. Every other entry was hand-engineered.

### How It Works

```
Task agent: starts with just a bash tool
Meta-agent: experiments on task agent's harness
  - tweaks prompts
  - adds tools
  - refines orchestration
  - runs 1000s of parallel sandboxes

24+ hours later:
  → domain-specific tooling (discovered autonomously)
  → verification loops
  → orchestration logic
```

### The Optimization Loop

1. Edit the agent's harness
2. Run it on tasks
3. Measure performance
4. Read failure traces
5. Keep improvements, revert failures
6. Repeat

### Key Insight: "Model Empathy"

Claude meta-agent + Claude task agent >> Claude meta-agent + GPT task agent.

Same-model pairings win because the meta-agent writes harnesses the inner model actually understands. It shares the same weights and knows exactly how that model reasons.

> "Agents are better at understanding agents than we are."

As agents surpass 99th percentile human performance, our intuitions about good harness design become the wrong prior. They should discover from first principles.

### Tactics Discovered

- **Forced verification loops:** Built deterministic self-checks and formatting validators. Budgeted extra turns for self-correction.
- **Progressive disclosure:** Dumped long contexts to files when results overflowed.
- **Spot checking:** Ran isolated tasks for small edits instead of full suite. Dramatically sped up iteration.
- **Writing tests:** Steered task agent to build its own unit tests and checks for each task.
- **Orchestration logic:** Built task-specific subagents and handoffs when domain required it.

### ZAO Relevance

**Directly applicable to ZOE↔ZOEY:**
- ZOE and ZOEY are same model family = "model empathy" applies
- ZOE should run self-optimization loops on ZOEY: analyze her failure traces, improve her prompts/tools
- ZOEY should run the same loop on herself: after each task, read failure traces, improve

**AutoAgent-style loop for ZOEY:**
1. ZOE assigns task to ZOEY
2. ZOEY executes → writes results
3. ZOE reads failure traces → identifies patterns
4. ZOE updates ZOEY's prompts/tools
5. ZOEY improves on next run

---

## Claude Code Hooks — Automation Patterns

**From @darkzodchi, April 2026**

Claude Code hooks are automatic actions that fire every time Claude edits a file, runs a command, or finishes a task. PreToolUse runs before an action, PostToolUse runs after.

### Hook Types

| Hook | When | Use Case |
|------|------|----------|
| PreToolUse | Before action | Block dangerous commands, validate inputs |
| PostToolUse | After action | Format, run tests, log, cleanup |

### PreToolUse — Safety Bouncer

```bash
#!/usr/bin/env bash
# Block: rm -rf, git reset --hard, DROP TABLE, curl|bash, wget|bash
# Returns exit code 2 to block the action
```

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/block-dangerous.sh"
      }]
    }]
  }
}
```

### PostToolUse — Auto-Format

Runs prettier after every Write or Edit:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null; exit 0"
      }]
    }]
  }
}
```

### ZAO Relevance

**For ZAO OS codebase:**
- PreToolUse: block dangerous commands in ZOEY's execution context
- PostToolUse: auto-format after every file write (Prettier, ESLint fix)
- Test runner: automatically run tests after every edit
- Git hooks: auto-commit with meaningful messages after changes

**For ZOEY's execution:**
- ZOEY completes task → PostToolUse runs: check formatting, run tests, log result
- ZOEY tries dangerous command → PreToolUse blocks and asks for confirmation
- ZOEY writes file → PostToolUse auto-formats before commit

---

## Combined Insight

AutoAgent = meta-optimization at the agent level
Claude Code Hooks = micro-optimization at the execution level

ZAO should implement both:
1. ZOE runs AutoAgent-style self-optimization loops on ZOEY (failure trace analysis → improved prompts)
2. ZOEY runs Claude Code Hooks-style micro-optimization on her own executions (auto-format, safety blocks, test verification)

The principle: **agents should optimize themselves continuously, not wait for humans to fix their harnesses.**
