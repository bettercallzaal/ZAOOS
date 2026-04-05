# 44 — Agentic Development Workflows: AI Agents Building & Maintaining ZAO OS

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Set up AI agents to autonomously improve, review, test, and maintain the codebase — with human approval on all changes via PRs

---

## The Big Picture

**41% of all code written in 2025 was AI-generated.** 56% of engineers do 70%+ of their work with AI. The shift: humans go from writing code to defining requirements, reviewing agent output, and making architectural decisions.

For ZAO OS, the recommended model: **Claude Code creates branches and PRs → CI checks pass → human reviews and merges.**

---

## 1. Claude Code as Persistent Dev Partner

### CLAUDE.md (The Most Important File)

What to include:
- Build/dev/test commands Claude can't guess
- Code style rules that differ from defaults
- Architectural decisions (App Router patterns, Supabase RLS, Neynar API)
- Environment quirks and gotchas

What to exclude:
- Anything Claude can figure out from reading code
- Standard conventions Claude already knows
- File-by-file descriptions

**Rule:** For each line, ask "Would removing this cause Claude to make mistakes?" If not, cut it.

### Hooks System (Guarantee Behavior)

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx eslint --fix $FILE_PATH"
      }]
    }],
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "block-destructive-commands.sh"
      }]
    }]
  }
}
```

PostToolUse hooks auto-lint after every edit. PreToolUse hooks block destructive commands.

### Sub-Agents

Define in `.claude/agents/`:
```markdown
# .claude/agents/security-reviewer.md
---
name: security-reviewer
tools: Read, Grep, Glob, Bash
model: opus
---
Review code for injection, auth flaws, secrets, and insecure data handling.
```

### GitHub Actions Integration

**Official action:** `anthropics/claude-code-action@v1`

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  schedule:
    - cron: '0 9 * * 1-5'
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Security review:** `anthropics/claude-code-security-review` — AI security analysis as inline PR comments, diff-aware, language-agnostic.

### Cost Management
- ~$100-200/developer/month with Sonnet
- Use `--max-turns`, `--max-cost`, and workflow timeouts
- Check usage with `/cost`
- Prompt caching + auto-compaction reduce costs

---

## 2. OpenClaw / CLAWD (Austin Griffith)

### What It Is
Austin Griffith's autonomous AI agent on Base that writes code, deploys dApps, and manages its own treasury — all without human intervention. Built 12 live dApps with no human code review.

### For ZAO OS?
**Not recommended for codebase maintenance.** CLAWD is designed for greenfield smart contract deployment, not maintaining existing Next.js apps. The "no human review" approach is too risky for user-facing applications.

**What ZAO could learn from the pattern:**
- Autonomous testnet → mainnet promotion pipeline (for future Respect token contracts)
- Agent treasury management (for future community fund)
- The ERC-8004 identity standard for on-chain agent identity

---

## 3. ElizaOS as a Dev Agent

### Plugin-AutoCoder
ElizaOS has a `plugin-autocoder` that generates TypeScript plugins, n8n workflows, and MCP servers from natural language. Includes SWE-bench evaluation.

### For ZAO OS?
The planned ElizaOS agent (for community onboarding/support) could be extended with:
- GitHub monitoring plugin (watch issues, suggest fixes)
- Claude API integration for code reasoning

**However**, for actual autonomous coding, Claude Code's GitHub Actions is far more mature. Use ElizaOS for community interaction, Claude Code for code maintenance.

---

## 4. Other Agentic Tools Compared

| Tool | Autonomous PRs | Open Source | Best For | Price |
|------|---------------|-------------|----------|-------|
| **Claude Code** | Yes | No | Complex reasoning, multi-file | ~$100-200/mo |
| **Devin** | Yes | No | Fully hands-off defined tasks | $20 + $2.25/ACU |
| **SWE-Agent** | Yes | Yes (MIT) | GitHub issue fixing | API costs only |
| **Open SWE** | Yes | Yes | Async cloud-hosted coding | API costs |
| **Sweep AI** | Yes | Yes | Cleanup, issue-to-PR | Free |
| **Aider** | Yes | Yes | Terminal batch operations | API costs |
| **Cursor** | Yes | No | IDE-based, parallel agents | $16/mo |
| **Codex CLI** | Yes | Yes (CLI) | Multi-surface | API costs |
| **Copilot** | Limited | No | Inline suggestions | $10/mo |

**Recommendation for ZAO OS:** Claude Code (primary) + Sweep AI (automated cleanup PRs) + SWE-Agent (for issue-to-fix automation).

---

## 5. Branch-Based Agentic Workflow

### The Full Autonomous PR Pipeline

```
Agent creates feature branch
        ↓
Agent makes changes autonomously
        ↓
CI runs (lint, type-check, tests, build)
        ↓
Agent creates PR with description
        ↓
Vercel deploys preview
        ↓
Human reviews PR + preview deployment
        ↓
Human approves or requests changes
        ↓
Agent addresses feedback
        ↓
Merge on approval
```

### Continuous Claude

[`AnandChowdhary/continuous-claude`](https://github.com/AnandChowdhary/continuous-claude) implements this full loop:

```bash
curl -fsSL https://raw.githubusercontent.com/AnandChowdhary/continuous-claude/main/install.sh | bash
```

Options: `--max-runs`, `--max-cost`, `--max-duration`, `--merge-strategy`, `--worktree` for parallel execution.

### Branch Protection Rules
- Required: 1 human approval before merge
- Required: CI must pass (lint, type-check, tests, build)
- No direct pushes to main
- Dismiss stale reviews after new pushes

---

## 6. Scheduled Code Health Agents

### Weekly Health Check

```yaml
name: Weekly Code Health
on:
  schedule:
    - cron: '0 6 * * 1'  # Monday 6 AM
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Weekly code health check:
            1. Find unused dependencies (npx depcheck)
            2. Find type errors (npx tsc --noEmit)
            3. Remove console.log statements
            4. Find missing TypeScript return types
            5. Check for TODO/FIXME comments
            6. Find dead code (unused exports)
            Batch all fixes into one PR: "chore: weekly code health"
```

### What Agents Can Do on Schedule
- Find and fix dead code
- Update outdated dependencies safely
- Improve test coverage
- Fix lint warnings
- Optimize bundle size
- Update documentation
- Clean up console.logs
- Add missing TypeScript types

### Avoiding Noise
- Batch improvements into meaningful PRs (one per week)
- Set minimum thresholds (only create PR if 3+ improvements)
- Group related changes together
- Use "code health" label to distinguish from feature work

---

## 7. AI-Powered Testing

### Prompting for Meaningful Tests

```
Write tests for src/lib/xmtp/client.ts covering:
1. Happy path: successful connection, message send/receive
2. Edge cases: connection timeout, invalid wallet, expired session
3. Error cases: network failure, rate limiting, malformed messages
Run tests after implementing.
```

**Key:** Always say "run the tests after implementing" — enables self-correction.

### Stats
- 84% of developers use AI for test creation
- Speeds up test writing by ~60%
- Cloudflare's vinext: 1,700 Vitest tests + 380 Playwright E2E tests across 800+ AI sessions, 94% API coverage

---

## 8. MCP Servers for Development

### Key MCP Servers for ZAO OS

```bash
# Supabase — query data, inspect schema, test RLS
claude mcp add supabase -- npx -y @supabase/mcp-server

# Playwright — E2E testing, browser automation
claude mcp add playwright -- npx -y @playwright/mcp-server

# GitHub — branches, PRs, issues
claude mcp add github -- npx -y @anthropic/mcp-server-github
```

### What This Enables
- Claude can directly verify database state after migrations
- Claude can navigate your app, fill forms, verify UI state
- Claude can create branches and PRs programmatically

---

## 9. Risks & Guardrails

### Essential Rules for ZAO OS

1. **Never allow autonomous deployment to production** — all changes via PR with human review
2. **Sandboxed tool execution** — PreToolUse hooks block destructive commands
3. **Scoped credentials** — never give agents production DB write access
4. **Required CI gates** — lint, type-check, tests, build must all pass
5. **Budget limits** — `--max-turns`, `--max-cost`, workflow timeouts
6. **Secret scanning** — hooks intercept secrets at prompt submission

### When to Use Agents vs Code Manually

| Use Agents | Code Manually |
|-----------|---------------|
| Repetitive refactoring | Core business logic |
| Test generation | Security-critical flows (auth) |
| Lint/type fixes | Architectural decisions |
| Dependency updates | Farcaster protocol integration |
| Documentation | Smart contract logic |
| Code review | |
| Boilerplate | |

---

## 10. Implementation Plan for ZAO OS

### Phase 1: Foundation (Week 1)
1. Create focused `CLAUDE.md` with build commands, code style, architecture
2. Set up `.claude/settings.json` with PostToolUse hooks (auto-lint)
3. Create `.claude/agents/security-reviewer.md` subagent
4. Create `.claude/skills/fix-issue/SKILL.md`

### Phase 2: GitHub Actions (Week 2)
1. Install Claude GitHub App via `/install-github-app`
2. Add `ANTHROPIC_API_KEY` to repo secrets
3. Set up `@claude` mention workflow for PRs and issues
4. Add `claude-code-security-review` action on every PR
5. Configure branch protection: 1 review + CI pass

### Phase 3: Scheduled Automation (Week 3)
1. Weekly code health cron job (Monday mornings)
2. Daily dependency audit
3. Vercel preview deployments for agent PRs

### Phase 4: MCP Integration (Week 4)
1. Supabase MCP for database inspection
2. Playwright MCP for E2E testing
3. Set up Vitest with AI-assisted test generation

### Phase 5: Continuous Loop (Month 2)
1. Evaluate `continuous-claude` for test coverage improvement
2. Set up Ralph Loop for PRD-driven feature implementation
3. Cost monitoring and budget limits

---

## Sources

- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Claude Code Security Review](https://github.com/anthropics/claude-code-security-review)
- [Continuous Claude](https://github.com/AnandChowdhary/continuous-claude)
- [Ralph Loop](https://github.com/snarktank/ralph)
- [SWE-Agent](https://github.com/SWE-agent/SWE-agent)
- [Open SWE](https://github.com/langchain-ai/open-swe)
- [Sweep AI](https://github.com/sweepai/sweep)
- [ElizaOS AutoCoder](https://github.com/elizaos-plugins/plugin-autocoder)
- [CLAWD on Base](https://bingx.com/en/learn/article/what-is-clawd-agentic-economy-powering-autonomous-ai-on-base)
- [Supabase MCP](https://github.com/supabase-community/supabase-mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Anthropic Agentic Coding Trends 2026](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)
