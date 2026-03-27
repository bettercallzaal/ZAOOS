---
name: standup
description: Use when generating daily or weekly standup notes from recent git activity for build-in-public content
disable-model-invocation: true
---

# Standup — Generate Build-in-Public Notes

Creates standup summaries from git history, formatted for sharing on Farcaster or other platforms.

## Context to Gather

```
Recent commits: !`git log --oneline --since="yesterday" -20`
Weekly commits: !`git log --oneline --since="7 days ago" -30`
Files changed today: !`git diff --stat HEAD~5`
Branches: !`git branch --list`
```

## Output Format

### Daily Standup
```
What I shipped:
- [feature/fix]: one-line description

What I'm working on:
- [current branch/uncommitted work]

Blockers:
- [any failed builds, stuck issues]
```

### Weekly Recap (for Farcaster cast)
```
This week on ZAO OS:
- [top 3-5 highlights]
- [metrics if available: routes added, components built, bugs fixed]

Building in public: [link or context]
```

## Rules

- Keep daily standups under 10 lines
- Keep weekly recaps castable (under 1024 chars for Farcaster)
- Focus on outcomes ("added music favorites") not mechanics ("modified 3 files")
- Group related commits into single bullet points
- Always say "Farcaster" not "Warpcast"
