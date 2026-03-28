---
name: z
description: Quick status dashboard — what's happening, what needs attention, general pulse check
disable-model-invocation: false
---

# Z — Quick Status Dashboard

Fast pulse check. Run everything in parallel, report concisely. Target: under 30 seconds.

## Context to Gather

Run ALL of these in parallel:

```
Branch:              !`git branch --show-current`
Recent commits:      !`git log --oneline -5`
Git status:          !`git status --short`
Dev server:          !`lsof -ti:3000 > /dev/null 2>&1 && echo "running on :3000" || echo "not running"`
Build dir:           !`test -d .next && echo "exists" || echo "missing"`
Research count:      !`ls research/ | wc -l`
```

Then scan for TODOs — ONLY in files listed by `git status` (modified/staged files):

```
TODOs in changed files: !`git diff --name-only | xargs grep -n 'TODO\|FIXME\|HACK' 2>/dev/null || echo "none"`
```

## Output Format

Respond with EXACTLY this structure. Total output MUST be under 200 words.

```
## ZAO OS Status

**Branch:** {branch} | **Files changed:** {count from git status} | **Research docs:** {count}

### Recent (last 5 commits)
- {commit 1}
- {commit 2}
- ...

### Needs Attention
- {uncommitted files, if any — list file paths}
- {TODOs found in changed files, with file:line and comment text}
- Dev server: {running on :3000 / not running}
- {".next/ missing — run `npm run build`" if build dir missing, otherwise omit}

### Quick Actions
- `/catchup` for full context restore
- `/standup` for build-in-public note
- `npm run build` to check for errors
```

If nothing needs attention (clean tree, no TODOs, server running), replace the Needs Attention bullet list with: "All clear."

## Rules

- Read-only — NEVER modify files
- MUST complete in under 30 seconds — no deep file reading
- MUST be under 200 words total
- NO reading full file contents — only git commands, port checks, and quick scans
- Run git commands and port check in parallel for speed
- Omit the build dir line from Needs Attention if .next/ exists
- Quick Actions section is always the same 3 bullets — do not change them
