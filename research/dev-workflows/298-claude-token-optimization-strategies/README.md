# 298 - Claude Token Optimization Strategies for ZAO OS Development

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Reduce Claude token consumption during ZAO OS development - hit weekly limits both of the last two weeks

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install Graphify** | USE Graphify (Doc 297) to reduce research doc token overhead by 71.5x - biggest single win |
| **Add CLAUDE.md context budget** | ADD a "Context Loading" section to CLAUDE.md that tells Claude which files to skip reading unless asked |
| **Use /compact aggressively** | USE `/compact` every 15-20 messages to compress conversation history |
| **Batch skill invocations** | BATCH related questions into single messages instead of separate prompts |
| **Schedule heavy work off-peak** | SCHEDULE Opus-heavy work outside 5:00-11:00 AM PT (8:00 AM-2:00 PM ET) - tokens cost more during peak |
| **Use Sonnet for simple tasks** | USE `/model sonnet` for grep, file reads, simple edits. Switch to Opus only for architecture/complex reasoning |
| **Enable overage billing** | ENABLE overage in Settings > Usage as safety net - API rates are cheaper than lost productivity |
| **Worksession isolation** | KEEP using `/worksession` - prevents branch conflicts that cause expensive re-reads and merge resolution |

---

## Comparison of Options

| Strategy | Token Savings | Effort to Implement | Impact on ZAO OS Workflow |
|----------|--------------|--------------------|-----------------------------|
| **Graphify for research/** | 71.5x per research query | 2 commands install | High - 338 docs are the biggest context burden |
| **CLAUDE.md context budget** | ~30-50% per session start | Edit 1 file | High - prevents unnecessary file reads |
| **/compact every 15-20 msgs** | ~60-70% context reduction | Behavioral habit | High - biggest single habit change |
| **Model switching (Sonnet/Opus)** | ~50-70% for simple tasks | `/model sonnet` command | Medium - Sonnet handles most edits fine |
| **Off-peak scheduling** | ~20-30% effective increase | Time management | Medium - same weekly limit, better distribution |
| **Batch prompts** | ~40% fewer context reloads | Behavioral habit | Medium - combine related questions |
| **Edit vs. follow-up** | ~50% per correction | Click edit, not send | Medium - prevents history stacking |
| **Enable overage** | Unlimited (at cost) | Settings toggle | Safety net - $0.003/1K input tokens at API rates |

---

## How Claude Token Limits Work

### The 5-Hour Rolling Window

Claude does not count messages. It counts tokens. The system uses a **rolling 5-hour window** starting from your first prompt. Everything you send AND receive in that window counts toward the limit.

**Token math per message:**
- Token cost per message = ALL previous messages + your new one
- Total tokens for N messages at S tokens/exchange: `S x N(N+1) / 2`
- At ~500 tokens per exchange:
  - 5 messages: 7,500 tokens
  - 10 messages: 27,500 tokens
  - 20 messages: 105,000 tokens
  - 30 messages: 232,500 tokens
- **Message 30 costs 31x more than message 1**

### Plan Limits (Per 5-Hour Session)

| Plan | Monthly Cost | Typical Prompts/Session | Weekly Opus Hours |
|------|-------------|------------------------|-------------------|
| Pro | $20 | 10-40 | N/A |
| Max 5x | $100 | 50-200 | 15-35 |
| Max 20x | $200 | 200-800 | 24-40 |

### Peak Hours (Since March 26, 2026)

**5:00-11:00 AM PT / 8:00 AM-2:00 PM ET on weekdays** - your 5-hour session limit burns faster during these hours. Weekly limit stays the same, but distribution changes. Heavy work should be scheduled outside this window.

---

## ZAO OS-Specific Token Drains

### Problem 1: Research Library Context Loading

ZAO OS has 338 research docs (5.9MB). Every session that involves research triggers multiple file reads. The `/zao-research` skill greps across all 338 docs, reads matches, then reads related docs for cross-referencing.

**Fix:** Install Graphify (Doc 297) to index `research/` into a persistent knowledge graph. Queries hit the graph instead of re-reading raw files. Estimated savings: 71.5x per research query.

### Problem 2: CLAUDE.md Is Large

`CLAUDE.md` is loaded every conversation. It's comprehensive but includes sections that aren't needed for most tasks (governance details, music player internals, spaces architecture).

**Fix:** Add a "Context Budget" section that tells Claude to lazy-load deep sections:

```markdown
## Context Budget
When starting a session, DO NOT pre-read these files unless the task specifically involves them:
- src/components/spaces/ (40+ files) - only for Spaces work
- src/components/music/ (30+ files) - only for music player work
- src/components/governance/ - only for governance work
- research/ - use Graphify graph instead of raw file reads
```

### Problem 3: Long Conversations Without Compaction

ZAO OS sessions often run 30+ messages - feature brainstorming, implementation, testing, shipping. By message 30, 98.5% of tokens are spent re-reading history, only 1.5% on actual output.

**Fix:** Use `/compact` every 15-20 messages. This compresses conversation history while preserving key context. Alternatively, start a fresh chat and paste a summary of prior work.

### Problem 4: Opus for Everything

Many ZAO OS tasks (file reads, simple edits, grep searches) don't need Opus. Using Opus for everything drains the weekly Opus quota unnecessarily.

**Fix:** Default to Sonnet for:
- File reads and searches
- Simple bug fixes
- Formatting and linting
- Research doc lookups

Switch to Opus for:
- Architecture decisions
- Complex multi-file refactors
- Brainstorming and planning
- Security reviews

### Problem 5: Multiple Claude Code Terminals

The `/worksession` pattern means multiple terminals may be open. Each terminal maintains its own conversation, and all count against the same weekly limit.

**Fix:** Already mitigated by `/worksession` branch isolation. Additional improvement: close idle terminals. Each idle terminal that receives a prompt still costs context tokens to re-establish.

---

## Implementation Plan for ZAO OS

### Phase 1: Immediate (Today)

1. Install Graphify: `pip install graphifyy && graphify install`
2. Index research library: `/graphify ./research`
3. Enable overage billing in Claude settings as safety net
4. Add context budget section to CLAUDE.md

### Phase 2: Habit Changes (This Week)

5. Use `/compact` every 15-20 messages
6. Use `/model sonnet` for simple tasks
7. Batch related questions into single messages
8. Edit prompts instead of sending corrections
9. Schedule Opus-heavy work outside 5:00-11:00 AM PT

### Phase 3: Tooling (Next Week)

10. Index `src/` with Graphify: `/graphify ./src`
11. Set up auto-update hook: `graphify hook install`
12. Create a `/token-check` skill that reminds about optimization habits

---

## Sources

- [Claude Code Token Limits Guide](https://blog.laozhang.ai/en/posts/claude-code-rate-limit) - comprehensive limit breakdown
- [Everything We Know About Claude Code Limits](https://portkey.ai/blog/claude-code-limits/) - plan comparisons, weekly caps
- [Anthropic Tweaks Usage Limits (March 2026)](https://www.theregister.com/2026/03/26/anthropic_tweaks_usage_limits) - peak hours announcement
- [Mastering Claude Pro Usage Limits](https://claudelab.net/en/articles/claude-ai/claude-pro-usage-limit-strategies-2026) - optimization strategies
- [Claude Code Limits for Engineering Leaders](https://www.faros.ai/blog/claude-code-token-limits) - team management perspective
- [Original X thread by @0x_kaize](https://x.com/0x_kaize) - 10 optimization habits
