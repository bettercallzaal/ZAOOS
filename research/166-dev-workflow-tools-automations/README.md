# Doc 166 — Developer Workflow Tools & Automations for Solo Devs Using Claude Code (2026)

**Created:** 2026-03-28
**Category:** Dev Workflows
**Status:** Complete

---

## 1. Pre-Commit Hooks with Claude Code

Claude Code's hook system replaces the need for traditional Husky + lint-staged setups. Hooks provide **guaranteed execution** (deterministic), unlike CLAUDE.md instructions which are advisory (~80% compliance).

### Block git commits unless lint passes

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git commit*)",
            "command": "npm run lint-staged || (echo 'Lint failed — commit blocked' >&2 && exit 2)"
          }
        ]
      }
    ]
  }
}
```

Exit code 2 = block the action. Exit code 0 = allow. Feedback written to stderr is sent back to Claude so it can fix the issue.

### Auto-format after every file edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Protect sensitive files from edits

Create `.claude/hooks/protect-files.sh`:

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2
  fi
done
exit 0
```

Register it:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

**Note:** There is an open feature request ([#4834](https://github.com/anthropics/claude-code/issues/4834)) for native `PreCommit` and `PostCommit` hook events, which would make this even cleaner.

---

## 2. Claude Code Hooks System — Complete Reference

### All 23 Hook Events (as of March 2026)

| Event | When it fires | Can block? |
|-------|--------------|------------|
| `SessionStart` | Session begins/resumes | No |
| `UserPromptSubmit` | User submits a prompt | No |
| `PreToolUse` | Before a tool call | **Yes (exit 2)** |
| `PermissionRequest` | Permission dialog appears | **Yes (JSON decision)** |
| `PostToolUse` | After a tool call succeeds | No |
| `PostToolUseFailure` | After a tool call fails | No |
| `Notification` | Claude sends notification | No |
| `SubagentStart` | Subagent spawned | No |
| `SubagentStop` | Subagent finishes | No |
| `TaskCreated` | Task created via TaskCreate | No |
| `TaskCompleted` | Task marked completed | No |
| `Stop` | Claude finishes responding | **Yes (keeps working)** |
| `StopFailure` | Turn ends due to API error | No |
| `TeammateIdle` | Agent team member going idle | No |
| `InstructionsLoaded` | CLAUDE.md or rules loaded | No |
| `ConfigChange` | Config file changes | **Yes (block)** |
| `CwdChanged` | Working directory changes | No |
| `FileChanged` | Watched file changes on disk | No |
| `WorktreeCreate` | Worktree being created | No |
| `WorktreeRemove` | Worktree being removed | No |
| `PreCompact` | Before context compaction | No |
| `PostCompact` | After compaction completes | No |
| `SessionEnd` | Session terminates | No |

### Three Handler Types

1. **Command** (`"type": "command"`) — runs shell command, communicates via stdin/stdout/exit codes
2. **Prompt** (`"type": "prompt"`) — single-turn LLM evaluation (Haiku by default), returns `{"ok": true/false, "reason": "..."}`
3. **Agent** (`"type": "agent"`) — multi-turn subagent with tool access, 60s timeout, up to 50 tool turns

Plus **HTTP** (`"type": "http"`) — POST event data to a URL endpoint.

### Advanced: Agent-based verification before stopping

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass. Run the test suite and check the results. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

### Advanced: Re-inject context after compaction

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm. Run bun test before committing. Current sprint: auth refactor.'"
          }
        ]
      }
    ]
  }
}
```

### The `if` field (v2.1.85+)

Filter by tool name AND arguments together:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-git-policy.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook Locations (scope)

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No (local) |
| `.claude/settings.json` | Single project | Yes (commit to repo) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin) |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes |
| Skill/agent frontmatter | While active | Yes |

### Debugging

- `/hooks` — browse all configured hooks (read-only)
- `Ctrl+O` — toggle verbose mode to see hook output in transcript
- `claude --debug` — full execution details

---

## 3. GitHub Actions + Claude Code

### Official Action: `anthropics/claude-code-action@v1`

**Quickstart:**
```bash
claude /install-github-app
```

### Automated PR Review

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Claude PR Review
        uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Review this pull request for:
            - Code quality and best practices
            - Potential bugs or edge cases
            - Performance issues
            - Security vulnerabilities
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Issue Triage & Auto-Labeling

```yaml
name: Issue Triage
on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Claude Issue Analysis
        uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Analyze this issue and categorize as bug/feature/docs/question.
            Assess priority (critical/high/medium/low).
            Suggest labels and draft a brief initial response.
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Security-Focused Review (Path-Specific)

```yaml
name: Security Review
on:
  pull_request:
    paths:
      - 'src/auth/**'
      - 'src/lib/auth/**'
      - 'src/middleware.ts'
      - '.env*'

jobs:
  security-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Claude Security Analysis
        uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Security-focused code review for OWASP Top 10:
            - Input validation and sanitization
            - Authentication/authorization issues
            - Data exposure risks
            - Dependency vulnerabilities
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Interactive @claude Mention in PRs/Issues

```yaml
name: Interactive Claude
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  respond:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Claude Response
        uses: anthropics/claude-code-action@v1
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Authentication Options

| Provider | Required Secrets |
|----------|-----------------|
| Direct API | `ANTHROPIC_API_KEY` |
| AWS Bedrock | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| Google Vertex AI | `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` |
| Microsoft Foundry | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` |

---

## 4. Vercel Deploy Previews + Claude Code

### Vercel Deploy Plugin

Install:
```
/plugin install vercel@claude-plugins-official
```

Commands: `/deploy`, `/vercel-logs`, `/vercel-setup`

### Agent-Browser for Automated QA

Vercel released `agent-browser` (at `vercel-labs/agent-browser`) for browser automation with AI agents. It works with Claude Code and allows the agent to verify its own frontend work:

1. Build a component
2. Launch a browser against the preview URL
3. Test interactions programmatically
4. Confirm behavior matches expectations

Compact page snapshots fit in a few hundred tokens, allowing many test cycles per context window.

### Workflow: Deploy Preview QA Loop

```
1. Push feature branch
2. Vercel auto-deploys preview
3. Claude Code uses agent-browser to navigate preview URL
4. Run visual + functional QA checks
5. Report findings or auto-fix issues
```

The `vercel-deploy-preview` skill (community plugin by `jeremylongshore/claude-code-plugins-plus-skills`) enables instant feedback and stakeholder sharing across branches.

---

## 5. Claude Code Scheduled Agents

### Three Scheduling Tiers

| Feature | Cloud Tasks | Desktop Tasks | `/loop` |
|---------|------------|---------------|---------|
| Runs on | Anthropic cloud | Your machine | Your machine |
| Requires machine on | No | Yes | Yes |
| Requires open session | No | No | Yes |
| Persistent | Yes | Yes | No (session-scoped) |
| Access local files | No (fresh clone) | Yes | Yes |
| Minimum interval | 1 hour | 1 minute | 1 minute |

### `/loop` — Quick Recurring Tasks

```
/loop 5m check if the deployment finished and tell me what happened
/loop 20m /review-pr 1234
/loop 1h run npm run lint and report any new warnings
```

Interval syntax: `s` (seconds), `m` (minutes), `h` (hours), `d` (days). Default: 10 minutes.

### One-Time Reminders

```
remind me at 3pm to push the release branch
in 45 minutes, check whether the integration tests passed
```

### `/schedule` — Persistent Cloud Agents

For tasks that survive session restarts. Managed via the `/schedule` skill:

```
/schedule daily at 9am run lint and type-check, report any regressions
/schedule weekly on mondays run /autoresearch:security
```

### Underlying Tools

| Tool | Purpose |
|------|---------|
| `CronCreate` | Schedule new task (5-field cron expression) |
| `CronList` | List all tasks with IDs, schedules, prompts |
| `CronDelete` | Cancel task by ID |

Session limit: 50 scheduled tasks. Three-day auto-expiry for `/loop` tasks.

### Practical Solo Dev Schedule

```
# Daily (via /schedule cloud tasks)
/schedule "0 9 * * 1-5" run npm run lint && npm run typecheck, report regressions

# Weekly security (via /schedule)
/schedule "0 10 * * 1" run /autoresearch:security on src/

# Session polling (via /loop)
/loop 5m check vercel deploy status for current branch
```

### Disable

Set `CLAUDE_CODE_DISABLE_CRON=1` to disable the scheduler entirely.

---

## 6. Git Worktree Workflows

### Setup

```bash
# Create worktrees for parallel features
git worktree add ../zao-os-payments feature/payments
git worktree add -b feature/notifications ../zao-os-notifications main

# Launch Claude Code in each (separate terminals)
cd ../zao-os-payments && claude
cd ../zao-os-notifications && claude

# List all worktrees
git worktree list

# Clean up after merge
git worktree remove ../zao-os-payments
git worktree prune
```

### Directory Naming Convention

```
ZAO OS V1/                    # main worktree (primary branch)
ZAO OS V1-payments/           # feature/payments
ZAO OS V1-notifications/      # feature/notifications
ZAO OS V1-hotfix/             # urgent production fix
```

Use descriptive names. Never use `worktree-1`, `worktree-2`.

### Best Practices

1. **One branch per worktree** — Git enforces this; you cannot checkout the same branch in two worktrees
2. **Name terminal tabs** after worktree/branch for quick switching
3. **Remove worktrees after merge** to prevent directory accumulation
4. **`git fetch` from any worktree** updates remote refs for all of them
5. **Open each worktree as separate IDE project** to avoid file watcher conflicts
6. **Claude Code native support** — the `EnterWorktree` and `ExitWorktree` tools plus `WorktreeCreate`/`WorktreeRemove` hooks provide first-class integration

### Parallel Patterns

- **Feature + Hotfix**: Keep feature dev going while shipping an urgent fix from main
- **Dual Feature**: Run 2-4 Claude Code agents simultaneously on different features
- **Code Review + Dev**: Check out reviewer's branch in a worktree while continuing work elsewhere

Teams report completing work in hours that previously took days using 4-5 parallel Claude Code agents.

---

## 7. Session Templates / Startup Scripts

### CLAUDE.md as Persistent Context

CLAUDE.md is automatically loaded at session start. This is the primary mechanism for project context.

### SessionStart Hooks for Dynamic Context

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Recent commits:' && git log --oneline -5 && echo '\\nOpen issues:' && gh issue list --limit 5"
          }
        ]
      }
    ]
  }
}
```

Matcher values: `startup` (new session), `resume` (continued session), `clear` (/clear), `compact` (after compaction).

### Slash Commands as Session Templates

Create `.claude/commands/` files for different session types:

```
.claude/commands/
  feature.md      # "Load feature dev context: current sprint, open PRs, recent changes"
  debug.md        # "Load debug context: recent errors, logs, failing tests"
  review.md       # "Load review context: open PRs, diff against main"
  ship.md         # "Load shipping context: changelog, version, deploy status"
```

### Named Sessions

```bash
claude -n "payments-feature"     # Name at startup
claude -r "payments"             # Resume by search term
claude -c                        # Continue most recent session
```

### Re-inject Context After Compaction

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "cat .claude/compaction-context.txt"
          }
        ]
      }
    ]
  }
}
```

Put critical reminders in `.claude/compaction-context.txt` that must survive context compaction.

---

## 8. CLAUDE.md Best Practices 2026

### What to Include (Essential Sections)

1. **Quick Start** — `npm install`, `npm run dev`, `npm run build`, `npm run lint`
2. **Project Structure** — directory tree with purpose descriptions
3. **Code Conventions** — naming, file organization, patterns (only what Claude would get wrong without it)
4. **Security Rules** — non-negotiable constraints (never expose keys, always validate with Zod, etc.)
5. **Architecture Decisions** — auth approach, database patterns, state management
6. **Key Files** — the 10-15 files Claude needs to know about most
7. **Technology Stack** — framework versions, key dependencies
8. **Testing Patterns** — framework, file locations, mocking approach
9. **Style Preferences** — dark theme colors, mobile-first, terminology
10. **Skills/Commands Reference** — available slash commands and when to use them

### Top Anti-Patterns to Avoid

1. **Too long** — if CLAUDE.md exceeds ~500 lines, important rules get lost. Ruthlessly prune.
2. **Redundant instructions** — if Claude already does something correctly without the instruction, delete it. Every unnecessary line dilutes the ones that matter.
3. **Generic boilerplate** — no "write clean code" or "follow best practices." Be specific.
4. **Stale content** — add timestamps: "These instructions last updated: March 2026"
5. **Using CLAUDE.md for deterministic rules** — if something MUST happen every time (formatting, linting, security), make it a hook. CLAUDE.md is advisory (~80% compliance). Hooks are deterministic (100%).

### Key Principles

- **Concise and scannable** — use tables, bullet points, code blocks
- **Specific over abstract** — show exact patterns, not vague guidance
- **Version-control it** — check into git; CLAUDE.md compounds in value over time
- **Use `/init`** — Claude Code generates a baseline by scanning your codebase
- **Split into `.claude/rules/*.md`** for domain-specific rules (components, tests, API routes)
- **Layered loading** — root CLAUDE.md for project-wide, subdirectory CLAUDE.md for module-specific context

### ZAO OS CLAUDE.md Audit

Your current CLAUDE.md is well-structured. Potential improvements:
- Add a timestamp header
- Move security rules to a hook (currently advisory in CLAUDE.md, but you have `SECURITY.md` already)
- Consider PostToolUse hooks for auto-formatting instead of relying on CLAUDE.md instructions
- The hooks you already have in `.claude/settings.json` (PostToolUse on Write) are a good start

---

## Sources

- [Automate workflows with hooks — Claude Code Docs](https://code.claude.com/docs/en/hooks-guide)
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Run prompts on a schedule — Claude Code Docs](https://code.claude.com/docs/en/scheduled-tasks)
- [Claude Code GitHub Actions — Claude Code Docs](https://code.claude.com/docs/en/github-actions)
- [anthropics/claude-code-action — GitHub](https://github.com/anthropics/claude-code-action)
- [Claude Code Hooks: PreToolUse, PostToolUse & All 12 — PixelMojo](https://www.pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns)
- [disler/claude-code-hooks-mastery — GitHub](https://github.com/disler/claude-code-hooks-mastery)
- [hesreallyhim/awesome-claude-code — GitHub](https://github.com/hesreallyhim/awesome-claude-code)
- [Git Hooks with Claude Code: Husky & Pre-commit — DEV](https://dev.to/myougatheaxo/git-hooks-with-claude-code-build-quality-gates-with-husky-and-pre-commit-27l0)
- [How I Automated My Entire Claude Code Workflow — DEV](https://dev.to/ji_ai/how-i-automated-my-entire-claude-code-workflow-with-hooks-5cp8)
- [Claude Code GitHub Actions Recipes — systemprompt.io](https://systemprompt.io/guides/claude-code-github-actions)
- [Claude Code Git Worktrees — MindStudio](https://www.mindstudio.ai/blog/claude-code-git-worktree-support-parallel-branches)
- [Mastering Git Worktrees with Claude Code — Medium](https://medium.com/@dtunai/mastering-git-worktrees-with-claude-code-for-parallel-development-workflow-41dc91e645fe)
- [Using Git Worktrees for Multi-Feature Development — Nick Mitchinson](https://www.nrmitchi.com/2025/10/using-git-worktrees-for-multi-feature-development-with-ai-agents/)
- [vercel/vercel-deploy-claude-code-plugin — GitHub](https://github.com/vercel/vercel-deploy-claude-code-plugin)
- [vercel-labs/agent-browser — GitHub](https://github.com/vercel-labs/agent-browser)
- [vercel-deploy-preview skill — playbooks.com](https://playbooks.com/skills/jeremylongshore/claude-code-plugins-plus-skills/vercel-deploy-preview)
- [CLAUDE.md Best Practices — UX Planet](https://uxplanet.org/claude-md-best-practices-1ef4f861ce7c)
- [How to Write a Good CLAUDE.md — Builder.io](https://www.builder.io/blog/claude-md-guide)
- [Best Practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [7 Claude Code best practices for 2026 — eesel AI](https://www.eesel.ai/blog/claude-code-best-practices)
- [Put Claude on Autopilot: /loop and /schedule — Medium](https://medium.com/@richardhightower/put-claude-on-autopilot-scheduled-tasks-with-loop-and-schedule-built-in-skills-43f3be5ac1ec)
- [Claude Code Gets Cron Scheduling — WinBuzzer](https://winbuzzer.com/2026/03/09/anthropic-claude-code-cron-scheduling-background-worker-loop-xcxwbn/)
- [Claude Code Session Hooks — ClaudeFast](https://claudefa.st/blog/tools/hooks/session-lifecycle-hooks)
- [Steve Kinney — Claude Code Hook Examples](https://stevekinney.com/courses/ai-development/claude-code-hook-examples)
- [DataCamp — Claude Code Hooks Tutorial](https://www.datacamp.com/tutorial/claude-code-hooks)
