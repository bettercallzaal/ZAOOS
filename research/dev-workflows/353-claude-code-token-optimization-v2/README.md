# 353 - Claude Code Token Optimization v2: What's Actually Working (and What Isn't)

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Stop hitting 85% weekly limits - 3rd consecutive week of throttling. Update Doc 298 with new strategies and audit what's configured vs missing.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Create .claudeignore** | CREATE NOW - you have none. Exclude node_modules, .next, dist, build, *.lock, .git, *.db, test fixtures |
| **Cap thinking tokens** | SET `MAX_THINKING_TOKENS=10000` in settings.json - "single highest-impact change" per multiple sources |
| **Route subagents to Haiku** | SET env `CLAUDE_CODE_SUBAGENT_MODEL=haiku` - subagents currently inherit Opus, burning tokens on grep/file reads |
| **Add test output filter hook** | ADD PreToolUse hook that filters test/build output to errors only - saves 10K+ tokens per test run |
| **Audit MCP servers** | DISABLE unused MCP servers - every tool definition costs tokens on every message, even when not used |
| **Use /effort for simple tasks** | USE `/effort low` for file reads, greps, simple edits instead of full model switch |
| **Write agent output to disk** | INSTRUCT subagents to save findings to files, return only paths - 5 agents returning 1 line vs 500 lines |
| **Keep CLAUDE.md under 200 lines** | CURRENTLY 171 lines - good. Move any new specialized instructions to skills instead |

---

## Audit: What's Configured vs Missing

### Already Done (from Doc 298)

| Strategy | Status | Where |
|----------|--------|-------|
| Context Budget in CLAUDE.md | Done | CLAUDE.md lines 142-160 |
| /compact advice | Done | CLAUDE.md |
| Model switching advice | Done | CLAUDE.md |
| Worksession isolation | Done | .claude/settings.json hooks |
| Lint-on-commit hook | Done | .claude/settings.json PreToolUse |
| Auto-format hook | Done | .claude/settings.json PostToolUse |
| Branch guard hook | Done | .claude/settings.json PreToolUse |

### NOT Done (Quick Wins)

| Strategy | Impact | Effort | Why It Matters |
|----------|--------|--------|----------------|
| **.claudeignore file** | High | 2 min | No file exists. .next/ alone is hundreds of files Claude indexes |
| **MAX_THINKING_TOKENS** | Very High | 1 min | Thinking burns tokens invisibly. Default is unlimited. Cap at 10K |
| **Subagent model override** | High | 1 min | Every Agent() call inherits Opus. Haiku handles research/grep fine |
| **Test output filter hook** | Medium | 5 min | npm test dumps full output into context. Filter to failures only |
| **MCP server audit** | Medium | 5 min | Each MCP tool definition = tokens per message. /mcp to check |
| **/effort command** | Medium | Habit | `/effort low` for simple tasks, saves thinking tokens |

---

## The Math: Why You're Hitting 85%

### Token Cost Escalation Per Message

Token cost per message = ALL previous messages + your new one. At ~500 tokens/exchange:

| Messages | Total Tokens | Cost Relative to Msg 1 |
|----------|-------------|----------------------|
| 5 | 7,500 | 5x |
| 10 | 27,500 | 10x |
| 20 | 105,000 | 20x |
| 30 | 232,500 | 31x |

**Message 30 costs 31x more than message 1.** This is why /compact and /clear are critical.

### ZAO OS Specific Drains

1. **Research library**: 319+ docs, 6MB+. Every /zao-research invocation greps across all of them
2. **CLAUDE.md loaded every session**: 171 lines = ~1,200 tokens loaded on every single message
3. **Skills system**: superpowers + project skills load tool definitions into context
4. **Multiple terminals**: each terminal = separate context, all count against same weekly limit
5. **Long brainstorm sessions**: brainstorming skill encourages deep conversation (good for quality, expensive for tokens)
6. **No .claudeignore**: .next/, node_modules/ are being indexed

### Invisible Token Drains (New in This Research)

- **Extended thinking**: Default is UNLIMITED thinking tokens per response. A single complex planning response can burn 50K+ tokens in thinking alone
- **MCP tool definitions**: Every configured MCP server adds tool definitions to every message
- **Background summarization**: `claude --resume` feature runs background summarization jobs
- **Prompt caching miss**: Cache TTL is 5 minutes. If you pause >5 min between messages, full context reloads

---

## Implementation Plan

### Phase 1: Right Now (5 minutes)

1. Create `.claudeignore` at project root:

```
node_modules/
.next/
dist/
build/
*.lock
.git/
*.db
*.sqlite
__pycache__/
coverage/
.turbo/
*.tsbuildinfo
test-*.mp3
```

2. Add to global `~/.claude/settings.json`:

```json
{
  "env": {
    "MAX_THINKING_TOKENS": "10000"
  }
}
```

3. Add subagent model override to project `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

### Phase 2: This Session (15 minutes)

4. Add test output filter hook to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(npm test*)|Bash(npm run test*)|Bash(npx vitest*)",
        "hooks": [{
          "type": "command",
          "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\"}}'",
          "statusMessage": "Filtering test output..."
        }]
      }
    ]
  }
}
```

5. Run `/mcp` to audit active MCP servers, disable any unused ones

6. Run `/context` to see what's consuming context space

### Phase 3: Habit Changes (This Week)

| Habit | Trigger | Action |
|-------|---------|--------|
| /compact | Every 15 messages or after completing a feature | `/compact Focus on code changes and decisions` |
| /clear | Switching to unrelated task | `/clear` (use `/rename` first) |
| /effort low | Simple file reads, greps, formatting | `/effort low` before simple tasks |
| Model switch | Simple tasks | `/model sonnet` or `/model haiku` |
| Specific prompts | Starting any task | "Fix validateToken in src/auth/middleware.ts" not "fix auth" |
| Batch messages | Related questions | Combine into one message, not 3 separate ones |
| Edit, don't follow up | Typo or correction | Click edit on your message, don't send a new one |
| Close idle terminals | Done with a task | Close the terminal, don't leave it open |

### Phase 4: Advanced (Next Week)

7. Install code intelligence plugin for TypeScript - "go to definition" replaces grep + reading multiple files
8. Move specialized instructions from CLAUDE.md to on-demand skills
9. Create compaction instructions in CLAUDE.md:

```markdown
# Compact instructions
When compacting, preserve: modified file paths, test commands, architecture decisions, API contracts. Drop: exploration output, grep results, file contents already committed.
```

10. Pre-process hook for large log files (grep ERROR before Claude sees them)

---

## Comparison: Token Optimization Techniques Ranked

| Technique | Token Savings | Already Done? | Effort |
|-----------|--------------|---------------|--------|
| MAX_THINKING_TOKENS=10000 | 30-50% per complex response | YES (Apr 13) | 1 min |
| .claudeignore | 10-20% per session (indexing) | YES (Apr 13) | 2 min |
| Subagent model=haiku | 60-80% per subagent call | YES (Apr 13) | 1 min |
| Caveman plugin | 65-75% output tokens | YES (Apr 14) - see Doc 357 | 1 min |
| /compact every 15 msgs | 60-70% context reduction | Partial (advice exists, not habit) | Habit |
| /effort low for simple tasks | 20-40% per simple task | No | Habit |
| Test output filter hook | 10K+ tokens per test run | No | 5 min |
| Disable unused MCP servers | Variable (per-tool overhead) | No | 5 min |
| Specific prompts | 40-60% fewer file reads | Partial | Habit |
| Edit vs follow-up | 50% per correction | No | Habit |
| Code intelligence plugin | Fewer file reads | No | 10 min |
| Skills instead of CLAUDE.md | Keep base context lean | Partial | Ongoing |

---

## What Changed Since Doc 298 (April 8)

| Item | Doc 298 | Now |
|------|---------|-----|
| Graphify | Recommended as #1 priority | Still valid but not installed - revisit |
| Extended thinking | Not mentioned | NEW: biggest invisible drain, cap with MAX_THINKING_TOKENS |
| /effort command | Not mentioned | NEW: quick way to reduce thinking without full model switch |
| Subagent model override | Not mentioned | NEW: CLAUDE_CODE_SUBAGENT_MODEL env var |
| .claudeignore | Not mentioned | NEW: prevents indexing of build artifacts |
| Code intelligence plugins | Not mentioned | NEW: reduces file reads via symbol navigation |
| Hook-based preprocessing | Not mentioned | NEW: filter test/build output before it enters context |
| Agent teams | Not mentioned | NEW: 7x token multiplier, keep teams small |
| CLAUDE.md line count | Suggested additions | Currently 171 lines (good, under 200 limit) |

---

## ZAO OS Integration

Key files to modify:
- `CLAUDE.md` (line 142+) - already has Context Budget section, add compaction instructions
- `.claude/settings.json` - add env vars and test filter hook
- `~/.claude/settings.json` - add MAX_THINKING_TOKENS globally
- Create `.claudeignore` at project root (currently missing)

Codebase reference: `src/middleware.ts` already handles rate limiting for API routes. Token optimization is the development-side equivalent.

---

## Sources

- [Manage Costs Effectively - Official Claude Code Docs](https://code.claude.com/docs/en/costs) - canonical reference, updated regularly
- [18 Token Management Hacks - MindStudio](https://www.mindstudio.ai/blog/claude-code-token-management-hacks-3) - comprehensive hack list
- [8 Settings That Work - GenAI Skills](https://genaiskills.io/articles/claude-code-token-optimisation) - settings-focused, quantified savings
- [Claude Code Token Limits Guide - LaoZhang](https://blog.laozhang.ai/en/posts/claude-code-rate-limit) - limit math and plan comparisons
- [Stop Wasting Tokens: 60% Optimization - Medium](https://medium.com/@jpranav97/stop-wasting-tokens-how-to-optimize-claude-code-context-by-60-bfad6fd477e5) - context management focus
- [Claude Is Burning Through Your Limit - Nicholas Rhodes](https://nicholasrhodes.substack.com/p/claude-usage-limits-fix) - limit mechanics deep dive
- [Best Practices - Official Claude Code Docs](https://code.claude.com/docs/en/best-practices) - official recommendations
