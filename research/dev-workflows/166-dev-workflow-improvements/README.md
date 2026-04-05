# 166 — ZAO OS Developer Workflow Improvements

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Analyze ZAO OS git history, codebase patterns, and identify concrete workflow bottlenecks and automations to implement

---

## Key Decisions / Recommendations

| Priority | Improvement | Impact | Effort |
|----------|------------|--------|--------|
| **1. NOW** | Add pre-commit hooks (lint + typecheck) | Eliminates ~25% of fix commits | 10 min |
| **2. NOW** | Install GitHub Actions Claude Code bot for PR review | Automated code review on every push | 15 min |
| **3. NOW** | Add `SessionStart` hook to inject recent git context | Never start a session blind | 5 min |
| **4. THIS WEEK** | Add `PostToolUse` hook for auto-format on file edit | No more manual lint fixes | 5 min |
| **5. THIS WEEK** | Create `/daily` scheduled agent for lint + typecheck + test | Catches regressions overnight | 10 min |
| **6. NEXT** | Increase test coverage (14 test files / 491 source files = 2.8%) | Catch bugs before they ship | Ongoing |
| **7. NEXT** | Add build verification hook before `git push` | No more broken deploys | 10 min |

---

## The Data: What Git History Reveals

### By the Numbers (Feb-Mar 2026)

| Metric | Value |
|--------|-------|
| Total commits | 580 |
| Commits per day (avg) | ~10 |
| Most active day | March 25 (61 commits) |
| Peak coding hours | 11am, 8pm, 5pm |
| Codebase size | 491 files, 45,574 lines |
| Test files | 14 (2.8% coverage) |
| Commit types | 162 feat, 137 fix, 108 docs, 6 chore, 4 test |
| Branches | 1 active (main), 2 stale worktrees, 1 stash |
| npm scripts | 10 (dev, build, lint, typecheck, test, analyze) |

### Pattern: Fix Commits Follow Feature Commits

**23.6% of all commits are fixes.** Many fix the immediately preceding feature:

```
feat: 40 audio filter presets in 4 categories
fix: simplify audio filters to playbackRate-based effects      ← same feature
fix: audio filters — disconnect source before inserting filter chain  ← same feature
```

```
feat(library): add Library page with submit, feed, and deep research
fix(library): await Minimax summary instead of fire-and-forget  ← same feature
fix(library): add bottom padding to clear music player bar      ← same feature
fix(library): accessibility, tab persistence, image fallback    ← same feature
fix(library): SSRF protection, search debounce, vote guard      ← same feature
fix(library): navigation, search injection, fid checks          ← same feature
```

**Root cause:** No pre-commit validation. Code ships, then gets fixed in the next 2-5 commits.

**Fix:** Pre-commit hooks that run lint + typecheck before every commit. This alone would eliminate ~30-50 of the 137 fix commits.

### Pattern: Mega-Commits Touch Too Many Files

Some commits touch 10-18 files at once:

```
Add volume control, fix z-index layering, improve accessibility: 18 files
Add logo/SEO, Farcaster Mini App support: 14 files
Add likes, recasts, personalized respect page, and notifications: 13 files
```

**Root cause:** No branching strategy. Everything lands on `main` in one shot.

**Fix:** Use git worktrees or claude-squad to develop features in isolation, then merge smaller PRs.

### Pattern: All Work on `main`

Only 1 active branch. No PRs, no review gates, no deploy previews.

**Fix:** GitHub Actions Claude Code bot reviews every push. Even solo, an automated second opinion catches issues.

---

## Implementation: 7 Automations to Add

### 1. Pre-Commit Hook (lint + typecheck)

Add to `.claude/settings.json` hooks:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(git commit*)",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$PROJECT_DIR\" && npx eslint --max-warnings 10 $(git diff --cached --name-only --diff-filter=d | grep -E '\\.(ts|tsx)$' | tr '\\n' ' ') 2>/dev/null && npm run typecheck 2>&1 | tail -5",
            "statusMessage": "Running lint + typecheck..."
          }
        ]
      }
    ]
  }
}
```

If the command exits non-zero, Claude Code blocks the commit.

### 2. Auto-Format on File Edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "if": "Edit(src/**/*.{ts,tsx})|Write(src/**/*.{ts,tsx})",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix \"$TOOL_ARG_FILE_PATH\" 2>/dev/null; exit 0",
            "statusMessage": "Auto-formatting..."
          }
        ]
      }
    ]
  }
}
```

### 3. Session Start Context Injection

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Here's the recent project state:\n\nLast 5 commits:\n$(cd \"$PROJECT_DIR\" && git log --oneline -5)\n\nUncommitted changes:\n$(cd \"$PROJECT_DIR\" && git status --short)\n\nAny failing tests:\n$(cd \"$PROJECT_DIR\" && npm test 2>&1 | tail -10)"
          }
        ]
      }
    ]
  }
}
```

Every new Claude Code session starts with awareness of what just happened.

### 4. GitHub Actions: Claude Code PR Review

Install via:

```bash
claude /install-github-app
```

Or manually add `.github/workflows/claude-review.yml`:

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          review_mode: "security,bugs,style"
          claude_md: true
```

### 5. Scheduled Daily Agent

Use `/schedule` to create a daily lint + test + typecheck run:

```
/schedule "daily-health" "0 9 * * *" "Run npm run lint, npm run typecheck, and npm test. Report any failures."
```

This runs every morning at 9am on Anthropic's cloud. If something's broken, you'll know before you start coding.

### 6. Build Verification Before Push

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(git push*)",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$PROJECT_DIR\" && npm run build 2>&1 | tail -20",
            "statusMessage": "Verifying build before push..."
          }
        ]
      }
    ]
  }
}
```

### 7. Notification on Long-Running Tasks

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"$NOTIFICATION_MESSAGE\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

Get macOS notifications when Claude Code needs your attention or finishes a long task.

---

## Workflow Gaps vs What's Already Good

### Already Good

| Area | Status |
|------|--------|
| CI pipeline | Lint + typecheck + test + build on every push |
| Research workflow | 165+ docs, quality scoring hook, skill-driven |
| Skills library | 9 project skills + 30+ gstack/superpowers |
| Commit messages | Conventional commits (feat/fix/docs) consistently used |
| CLAUDE.md | Comprehensive — security rules, conventions, architecture |

### Gaps to Fix

| Gap | Impact | Current State |
|-----|--------|---------------|
| No pre-commit hooks | Fix commits pile up | CI catches issues too late |
| No auto-format | Manual lint fixes | `eslint --fix` not wired in |
| 2.8% test coverage | Bugs ship to prod | 14 test files for 491 source files |
| No PR workflow | No review gate | Everything commits directly to main |
| No session start context | Repeat questions each session | Must manually /catchup |
| No macOS notifications | Miss when Claude finishes | Have to watch the terminal |
| Stale worktree branches | Clutter | `worktree-agent-a62d12f7`, `worktree-agent-a7170b14` still exist |

---

## Test Coverage: The Biggest Gap

**14 test files for 491 source files = 2.8% coverage.**

Priority test targets (most-changed, most-fixed files):

| Area | Files Changed | Fix Commits | Test Priority |
|------|--------------|-------------|---------------|
| Music player/audio | 41 new files | 8 fixes | HIGH — crossfade, filters, queue |
| Library feature | 15 files | 6 fixes | HIGH — submit, vote, search |
| Auth/session | 5 files | 4 fixes | HIGH — race conditions, session |
| Publishing (5 platforms) | 8 files | 3 fixes | MEDIUM — cross-post normalization |
| Governance/proposals | 6 files | 3 fixes | MEDIUM — voting, thresholds |

Recommendation: add tests for music player and library first — they have the most fix churn.

---

## Quick Wins to Do Right Now

### 1. Clean up stale worktree branches

```bash
git worktree remove .claude/worktrees/worktree-agent-a62d12f7 2>/dev/null
git worktree remove .claude/worktrees/worktree-agent-a7170b14 2>/dev/null
git branch -d worktree-agent-a62d12f7 worktree-agent-a7170b14 2>/dev/null
```

### 2. Pop or drop the stale stash

```bash
git stash list  # check if stash@{0} and stash@{1} are still needed
git stash drop stash@{1}  # if not needed
```

### 3. Set default permission mode

Already done in this session (`Bash(*)` in user settings).

---

## Recommended Daily Workflow (After All Automations)

```
Morning:
  1. Open terminal, run `claude -c` (continues last session)
  2. SessionStart hook auto-injects recent commits + failing tests
  3. Scheduled agent already ran overnight — check for failures

Building:
  4. Use claude-squad for parallel features (cs)
  5. Each agent in its own worktree
  6. PostToolUse auto-formats every file edit
  7. PreToolUse blocks bad commits (lint + typecheck gate)

Shipping:
  8. Push creates PR (not direct to main)
  9. Claude Code GitHub Action reviews the PR automatically
  10. macOS notification when review is done
  11. Merge and Vercel deploys
```

---

## Sources

- ZAO OS git history analysis (`git log --since="2026-02-01"`, 580 commits)
- ZAO OS codebase (`491 .ts/.tsx files, 45,574 lines, 14 test files`)
- [Claude Code Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code Settings](https://docs.anthropic.com/en/docs/claude-code/settings)
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
- [Claude Code Scheduled Tasks](https://docs.anthropic.com/en/docs/claude-code/scheduled-tasks)
- Doc 165 — Claude Code Multi-Terminal Management
- Doc 164 — Skills Research Workflow Improvements
- Doc 44 — Agentic Development Workflows
