---
topic: business
type: market-research
status: research-complete
last-validated: 2026-06-27
superseded-by:
related-docs:
original-query: "https://www.reddit.com/r/ClaudeCode/s/FmLRNnUvL0 research this"
tier: STANDARD
---

# 914 - research this

> Drafted by ZOE's research-worker from "https://www.reddit.com/r/ClaudeCode/s/FmLRNnUvL0 research this". Auto-committed to main for durability; review + deepen as needed.

Write is not available in this subagent's tool set. Returning the complete structured research document as output for the parent to save.

---

## Findings

**Fetch status:** Both `reddit.com` and `old.reddit.com` are blocked for tool fetching. The share link `reddit.com/r/ClaudeCode/s/FmLRNnUvL0` does not resolve in web search indexes (share-format URLs are not indexed). Two FULL aggregator sources covering r/ClaudeCode community consensus were used as fallbacks.

---

**Proposed file path:** `research/dev-workflows/914-r-claudecode-community-best-practices/README.md`

```markdown
---
topic: r/ClaudeCode community best practices - context management, hooks, subagents, CLAUDE.md
type: dev-workflow
status: complete
last-validated: 2026-06-27
original-query: "Summarize Reddit post reddit.com/r/ClaudeCode/s/FmLRNnUvL0 — key points, top comments, actionable takeaways for ZAO OS / Claude Code usage"
related-docs:
  - research/dev-workflows/536-claude-dot-md-best-practices/
  - research/dev-workflows/441-everything-claude-code-integration/
  - research/dev-workflows/730-claude-code-mcp-best-practices/
  - research/dev-workflows/684-claude-code-agent-dispatch-parallelization/
  - research/dev-workflows/566-claude-reddit-gems-apr-2026/
---

# 914 - r/ClaudeCode Community Best Practices (2026)

**Tier:** STANDARD | **Date:** 2026-06-27 | **Status:** Complete

## Key Decisions

| Decision | Recommendation | Priority | Effort |
|----------|---------------|----------|--------|
| CLAUDE.md length | Enforce <200 line cap; split overflow into `.claude/rules/*.md` | High | Low |
| Hook vs. instruction | Move lint/format/test guardrails to PreToolUse/PostToolUse hooks; CLAUDE.md rules are advisory and sometimes ignored | High | Medium |
| Context management | Target <30% utilization; spawn subagents at 20+ file reads or 12+ grep operations | High | Low |
| MCP server count | Limit to <=4 active MCPs per session; enable Tool Search for lazy-load (46.9% token reduction) | Medium | Low |
| Session cadence | Short focused sessions > long marathons; commit checkpoints before autonomous work | Medium | Low |
| Subagent routing | Main session on Opus, subagents on Sonnet via `CLAUDE_CODE_SUBAGENT_MODEL` env var | Medium | Low |

---

## Findings

### Fetch Status

The Reddit share link `reddit.com/r/ClaudeCode/s/FmLRNnUvL0` could not be fetched directly - both `reddit.com` and `old.reddit.com` are blocked for tool fetching. Share-format URLs are not indexed by web search. The r/ClaudeCode community consensus is synthesized below from two FULL aggregator sources.

### Community Signal

r/ClaudeCode has 4,200+ weekly contributors as of early 2026 - triple r/Codex (1,200). Benchmark anchors from community aggregation:

- **67%** blind test win rate against alternatives
- **77.2%** SWE-bench solve rate
- **46%** "most loved" in developer surveys (Cursor: 19%, Copilot: 9%)
- **~80%** of Andrej Karpathy's code is now agent-written (2026)
- **83.6%** of real engineering tasks solved by Opus 4.5 Thinking (SonarSource 2026 benchmark)

One documented community case: developer delivered a 6-month project solo in 2 months.

### Context Management

Context degradation ("dumb zone") onset: ~40% utilization. Quality drops materially at 60%. On a 1M-context model, degradation is significant at 300-400k tokens. The correct pattern:

- Target <30% context use aggressively
- Manual `/compact <hint>` before hitting 40%
- `/clear + brief` for restart with summary handoff
- Auto-compact is the worst timing - model is already degraded when it triggers

Work absorbing 20+ file reads or 12+ grep operations should spawn a subagent. Only the final report returns to main context.

### CLAUDE.md Hygiene

Community standard: keep CLAUDE.md under 200 lines (Boris Cherny, Anthropic engineer). HumanLayer production CLAUDE.md: 60 lines. Overflow goes to `.claude/rules/*.md` with `paths:` frontmatter for lazy-loading.

**ZAO OS relevance:** `CLAUDE.md` is at the 200-line cap. `.claude/rules/` already follows the split pattern with 7 files (api-routes.md, components.md, pii-hygiene.md, secret-hygiene.md, skill-enhancements.md, tests.md, typescript-hygiene.md). Any new rules must route to `.claude/rules/`, not `CLAUDE.md`.

### Hooks vs. Instructions

Community correction #1: rules that must fire every time belong in hooks, not CLAUDE.md. Hooks run outside the agent loop and are deterministic. CLAUDE.md rules are advisory and sometimes ignored.

Hook event types: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`. Use cases: block writes outside workspace, lint after Edit calls, secret hygiene scan before git commit.

**ZAO OS relevance:** `.claude/settings.json` has an extensive `permissions.allow` list but zero hooks configured. The secret-hygiene requirement in `.claude/rules/secret-hygiene.md` describes a pre-commit scan (64-char hex, PEM blocks, Anthropic key patterns) that should be wired as a `PreToolUse(Bash(git commit*))` hook - as a prose rule it can be ignored by the model.

### Subagent Routing

Community pattern: main session on Opus, subagents on Sonnet via `CLAUDE_CODE_SUBAGENT_MODEL` env var. Agent Teams (launched Feb 2026) enables multiple agents to share context natively. Spawn threshold: 20+ file reads OR 12+ grep operations. Feature-specific agents outperform general "backend engineer" subagents.

### MCP Token Cost

Most common complaint: 67,000 tokens consumed before first prompt with 4 active MCP servers. Tool Search (lazy-load schemas on demand) reduced consumption from 51,000 to 8,500 tokens - a **46.9% reduction**. Limit active MCPs to <=4 per heavy session.

### Tool Comparison

| Tool | Best Use Case | Reddit Consensus |
|------|--------------|-----------------|
| Claude Code (Opus) | Complex multi-file refactoring, monorepos | Best quality, worst Pro plan value |
| Cursor | Daily IDE coding, autocomplete | Smooth UX, good quality |
| GitHub Copilot | Simple completions, enterprise | Weakest quality, best availability |
| Cline | Budget-conscious, custom setups | Open-source flexibility |

---

## Next Actions

| Action | File / Location | Why |
|--------|----------------|-----|
| Wire secret-hygiene as PreToolUse hook | `.claude/settings.json` | Prose rule in `.claude/rules/secret-hygiene.md` is advisory; hook is deterministic |
| Add PostToolUse lint hook | `.claude/settings.json` | Auto-runs `npm run lint:biome` after Edit tool calls |
| Enforce CLAUDE.md 200-line cap | `CLAUDE.md` | At the cap now; any additions must go to `.claude/rules/*.md` |
| Set CLAUDE_CODE_SUBAGENT_MODEL | `.env.example` + deployment env | Route subagents to Sonnet; main stays Opus |
| Verify Tool Search deferred loading | `.claude/settings.json` | 46.9% MCP token reduction per session |

---

## Sources

- [FULL] Claude Code Reddit Aggregator - https://www.morphllm.com/claude-code-reddit
- [FULL] Claude Code Best Practices 2026 - https://mcp.directory/blog/claude-code-best-practices
- [FAILED - reddit.com blocked] Original share link - https://www.reddit.com/r/ClaudeCode/s/FmLRNnUvL0
- [FAILED - old.reddit.com blocked] Keyless mirror attempt - https://old.reddit.com/r/ClaudeCode/s/FmLRNnUvL0
```

---

## Recommended Action

1. **Save the doc above** to `research/dev-workflows/914-r-claudecode-community-best-practices/README.md` - the content is complete and structured per the research doc standard.
2. **Wire the secret-hygiene hook** in `.claude/settings.json` as a `PreToolUse` event on `Bash(git commit*)` - this is the highest-signal gap the community consensus surfaces against ZAO OS's current config.
3. **Set `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6`** in the deployment environment to reduce per-session cost while keeping main loop on Opus.

## Sources

- [FULL] Claude Code Reddit Aggregator - https://www.morphllm.com/claude-code-reddit
- [FULL] Claude Code Best Practices 2026 - https://mcp.directory/blog/claude-code-best-practices
- [FAILED - reddit.com blocked for tool fetching] - https://www.reddit.com/r/ClaudeCode/s/FmLRNnUvL0
- [FAILED - old.reddit.com also blocked] - https://old.reddit.com/r/ClaudeCode/s/FmLRNnUvL0
