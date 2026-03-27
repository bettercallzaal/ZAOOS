---
name: catchup
description: Use when starting a new session, after /clear, or when context is lost and you need to understand current work state
disable-model-invocation: true
---

# Catchup — Restore Work Context

Reload your working context after `/clear` or at the start of a new session.

## What It Does

Reads uncommitted changes, recent commits, open branches, and running processes to reconstruct what you're working on.

## Output

Provide a concise summary covering:

1. **Branch & Status** — current branch, uncommitted changes, staged files
2. **Recent Work** — last 10 commits with messages
3. **Uncommitted Changes** — what's modified but not committed (read the diffs)
4. **Open TODOs** — any TODO/FIXME/HACK in recently modified files
5. **Next Steps** — infer what the user was likely working on and what comes next

## Context to Gather

```
Git branch: !`git branch --show-current`
Git status: !`git status --short`
Recent commits: !`git log --oneline -10`
Uncommitted diff: !`git diff --stat`
Recently modified files: !`git diff --name-only HEAD~3`
```

Read the actual content of any uncommitted changed files to understand the work in progress.

## Rules

- Never modify any files — this is read-only
- If there are no changes, say so clearly
- Focus on WHAT and WHY, not listing every file
- If a plan file exists in the conversation or `docs/superpowers/plans/`, read it
