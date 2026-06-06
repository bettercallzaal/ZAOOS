---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-06-05
superseded-by:
related-docs: 232, 238, 242, 297, 663
original-query: "MCP server usage patterns and underused MCP opportunities - which MCPs (gitnexus, serena, sequential-thinking, memory, context7, playwright, exa, supabase, github) deliver most value in Claude Code agentic workflows, and where in the ZAO OS dev workflow I should lean on them more. I currently use Bash/Edit/Read/Write for 99% of work and barely touch my connected MCPs."
tier: STANDARD
---

# 801 — MCP Usage Audit: Where To Lean In

> **Goal:** Measure which of Zaal's connected MCP servers actually earn their context cost, and name the specific ZAO OS workflows where leaning on the underused ones (chiefly Serena + context7) pays off.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE Serena for all code edits + refactors in ZAOOS** (`find_symbol` / `replace_symbol_body` / `find_referencing_symbols`), NOT raw Read/Edit | ZAOOS is a 301-route, 279-component monorepo - exactly the large codebase where Serena cuts 60-80% of tokens and catches every reference on rename. Currently used 1 time ever. |
| 2 | **USE context7 by default on every Next.js 16 / React 19 / Wagmi / Tailwind v4 task** via a CLAUDE.md auto-invoke rule | Stack churns fast; context7 is the #1-ranked MCP across every 2026 best-of list for killing hallucinated APIs. Used 5 times ever. |
| 3 | **KEEP supabase MCP as-is** (your real #1, 55 calls) | DB-native CRM + tracker work. Already the workhorse. Lock a read-only role for exploration, write-role only for migrations. |
| 4 | **KEEP playwright** (wrapped by `/qa` + `/browse`) and **exa** (research fallback) | Both earn their slot through skills even though direct call counts look low. |
| 5 | **DISABLE gitnexus, memory (ECC graph), sequential-thinking** - 0 real calls ever | Pure context tax. gitnexus overlaps Serena; ECC memory duplicates your file-memory + CLAUDE.md for 0 tokens; sequential-thinking is redundant with Opus 4.8 adaptive thinking. |
| 6 | **DEMOTE github MCP to per-need** (9 calls) | Your `gh` CLI via Bash (6201 Bash calls) already covers ~90% of GitHub flows at lower context cost. Community consensus agrees. |

## Ground Truth: Your Actual MCP Usage

Measured from 629 session transcripts in `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/*.jsonl`, counting real `tool_use` invocations (not the inflated tool-definition text that repeats in every system prompt). MCP config lives in `.claude/settings.json` + `.claude/settings.local.json`.

Total tool calls across all sessions: **12,834**. MCP share: **~150 (1.2%)**. Native dominates: Bash 6201, Edit 1559, Read 1195, Write 1122, Agent 586.

| MCP | Real calls | Top tool | Verdict |
|-----|-----------:|----------|---------|
| supabase | 55 | execute_sql (44) | Workhorse - keep |
| exa | 61 | web_search (44) | Research fallback - keep |
| grep | 11 | searchGitHub | Light, useful - keep |
| github | 9 | get_file_contents (8) | Demote (gh CLI covers it) |
| playwright | 6 | browser_navigate | Skill-wrapped - keep |
| context7 | 5 | query-docs | UNDERUSED - lean in |
| serena | 1 | onboarding check | UNDERUSED - lean in hard |
| Gmail | 1 | search_threads | Niche, PII-gated |
| Calendar | 1 | list_events | Niche, PII-gated |
| gitnexus | 0 | - | DEAD - disable |
| memory (ECC) | 0 | - | DEAD - disable |
| sequential-thinking | 0 | - | DEAD - disable |

The headline: you run a code-heavy monorepo almost entirely on file-level Read/Edit/Write, and the one MCP built to make that cheaper and safer (Serena) you have called once.

## Findings

### Serena is the biggest unrealized win for ZAOOS

Serena exposes Language Server Protocol (go-to-definition, find-all-references, safe rename) as MCP tools, so the agent reads code at the symbol level instead of loading whole files. Reported savings are consistent across independent write-ups:

- Firman Hanafi: **60-80% token drop** on large codebases; a 200-file Java trace went ~8000 tokens -> ~800 (10x).
- MangoDriod (100k-line Android/KMP): "Find auth logic" was **15,000 tokens without Serena vs 4,500 with** (~70%). Monthly est. 4M -> 1.2M tokens.
- ManoMano (36,407-line, 381-class Java payment service) head-to-head refactor: **Vanilla Claude** spun up 12 subagents, ran an hour, cost $23.54, **failed to build**. **Claude built-in LSP** gave up after 3 iterations with 9 tests failing. **Claude + Serena** finished in 45 min, $27.30, **building project, all tests passing** - and read 69M tokens against its own cache while keeping API cost contained.

ZAOOS fits the profile that makes this pay: 301 API routes across 54 domains, 279 components, TypeScript monorepo. The exact case the benchmarks measure.

The nuance that matters (ManoMano's deployment guide):
- **Quick read-only lookup** ("where is business rule X?") - Serena was ~4x cost and 60% slower. Use native Read/Grep. Disable Serena temporarily via `/mcp`.
- **Find function usage** - Serena and native tie; both beat Claude's built-in LSP which hallucinated same-named methods.
- **Deep code modification / refactor / test-writing** - Serena is mandatory; reference-aware edits mean a 20-file rename misses nothing (the dynamic-usage-in-a-template-string case that text search-and-replace always breaks).

Practical rule for ZAOOS: **Serena for write/refactor, native tools for quick reads.** Serena's `claude-code` context auto-disables tools that overlap Claude Code's native edit/shell, so it slots in without conflict. Your session-start hook already pushes Serena activation - you have just been ignoring it.

### context7 is cheap insurance against stale-API code

Ranked the single highest-leverage MCP in every 2026 best-of list reviewed (DevelopersDigest top-5, Totalum "install first", PromptWritingStudio). It injects version-pinned docs on demand, killing hallucinated APIs. ZAOOS runs Next.js 16, React 19, Tailwind v4, Wagmi/Viem - all fast-moving, all past the model's training edge for their newest releases.

You have called it 5 times. The fix is a one-line CLAUDE.md rule so it auto-fires (per upstash's own recommendation):

```
Always use context7 when I need library/API documentation, code generation, setup, or
configuration steps for Next.js, React, Wagmi, Viem, Supabase, or Tailwind - without me
having to ask. Include a specific question in the query, not just the library name.
```

Gotcha: query it like a search ("Next.js 16 App Router middleware matcher config"), not a table of contents ("Next.js"). Max 3 calls per question; free tier has daily quotas.

### sequential-thinking earns nothing on Opus 4.8

The MCP adds an inspectable scratchpad - it does not make the model smarter, it makes reasoning visible and revisable, at a **20-60% token premium**. On Opus 4.7+ manual extended thinking returns HTTP 400; adaptive thinking is on by default and handles ~80% of what you'd reach for it on. One practitioner's logs: sequential-thinking fired in 38% of sessions but was clearly load-bearing in only ~8%. For a "ask, edit, commit" workflow like yours on Opus 4.8, it is overhead. Only value would be post-hoc auditing of agent reasoning - which you don't do. Disable.

### gitnexus and ECC memory are duplicate surfaces

- **gitnexus** (codebase-as-graph) overlaps what Serena does better and what your `/graphify` skill does for knowledge. 0 calls. Not on any best-of list. Disable until a concrete query need appears.
- **ECC memory** (knowledge-graph entities/relations) duplicates your file-memory at `~/.claude/.../memory/` + CLAUDE.md, which cost 0 tool-schema tokens. Community verdict is blunt: "CLAUDE.md is your memory." You already run the file system well (206-line MEMORY.md index). Disable the graph MCP.

### The context-budget principle behind all of this

Every connected server ships its tool schemas into context every turn (~500-2,000 tokens each; a 15-server kitchen sink = 15-30k tokens before you type). On a 1M window that's small in raw terms, but the real cost is **cognitive: more tools means more wrong-tool picks.** Consensus sweet spot across every source: **3-6 servers.** Claude Code's MCP Tool Search now loads schemas lazily (you see this as ToolSearch in your own transcripts), which softens but doesn't eliminate the cost. Cutting 3 dead servers is free upside.

## Recommended ZAOOS MCP Stack (target state)

| Keep (daily) | Keep (task-specific) | Disable |
|--------------|----------------------|---------|
| supabase (DB work) | playwright (via /qa, /browse) | gitnexus |
| context7 (auto-rule) | github (per-PR, else gh CLI) | memory (ECC) |
| serena (code write/refactor) | exa + grep (research, via /zao-research) | sequential-thinking |

That's 4 daily + 3 task-specific = within the 6-ish sweet spot, minus 3 dead weights.

## Also See

- [Doc 232](../232-mcp-server-development-guide/) - building MCP servers (the protocol side; this doc is the usage side)
- [Doc 238](../238-claude-tools-top50-evaluation/) - broader Claude tooling eval
- [Doc 242](../242-claude-20-underused-features-power-user/) - underused Claude Code features
- [Doc 297](../297-graphify-knowledge-graph-codebase/) - graphify (the knowledge-graph surface gitnexus overlaps)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add context7 auto-invoke rule to CLAUDE.md (Next.js/React/Wagmi/Tailwind/Supabase) | @Zaal | PR | This week |
| Start using Serena symbol tools for next code refactor; measure token delta vs file-reads | @Zaal | Habit | Next code task |
| Disable gitnexus + ECC memory + sequential-thinking in MCP config | @Zaal | Config | After approval |
| Confirm supabase MCP uses read-only role for exploration, write-role only for migrations | @Zaal | Config audit | This week |
| Re-measure MCP usage in 30 days to confirm Serena/context7 adoption rose | @Zaal | Audit | 2026-07-05 |

## Sources

- [Serena + MCP: How AI Reads a Codebase Without Burning Tokens - hanafifirman.dev](https://hanafifirman.dev/en/blog/serena-mcp-token-efficiency/) [FULL]
- [Benchmarking AI Coding Agents: Claude vs Claude Code vs Serena on 36K Lines of Java - ManoMano Tech (Medium)](https://medium.com/manomano-tech/project-aegis-benchmarking-ai-agents-and-why-serena-is-our-new-must-have-311673db35dd) [FULL]
- [Supercharging Claude Code with Serena - Save 70% on Tokens - MangoDriod](https://md.eknath.dev/posts/ai-ml/serena-claude-code-setup/) [FULL]
- [Serena MCP: Giving Your AI Coding Tools an IDE Brain - Arda Kilicdagi](https://arda.pw/posts/serena-mcp-semantic-code-assistant/) [FULL]
- [Serena vs Claude Code - aicoolies](https://aicoolies.com/comparisons/serena-vs-claude-code) [FULL]
- [Navigating Claude Code: MCP Servers Worth Adding - HackerNoon](https://hackernoon.com/navigating-claude-code-mcp-servers-worth-adding) [FULL]
- [271 MCP Servers Exist. These 5 Actually Make Claude Code Better - Developers Digest](https://www.developersdigest.tech/blog/271-mcp-servers-top-5-that-matter) [FULL]
- [The Right MCP Stack: Five Servers - PromptWritingStudio](https://promptwritingstudio.com/claude-code-mcp-stack) [FULL]
- [Best Claude Code MCP Servers in 2026 (Ranked) - DEV Community](https://dev.to/stravukarl/best-claude-code-mcp-servers-in-2026-ranked-466b) [FULL]
- [Best MCP Servers in 2026: 12 Picks - Totalum](https://www.totalum.app/blog/best-mcp-servers-2026) [FULL]
- [Best MCP Servers for Claude Code: 16 Ranked - buildtolaunch (Substack)](https://buildtolaunch.substack.com/p/best-mcp-servers-claude-code) [FULL]
- [Context7 - upstash/context7 README](https://github.com/upstash/context7) [FULL]
- [Sequential Thinking in Claude Code: A Practical MCP Guide - maketocreate](https://maketocreate.com/sequential-thinking-in-claude-code-a-practical-mcp-guide/) [FULL]
- [Sequential Thinking MCP Guide 2026 - skiln.co](https://skiln.co/blog/sequential-thinking-mcp-guide-2026) [FULL]
- [Sequential Thinking MCP Server: Setup, Features, Usage - Agentbrisk](https://agentbrisk.com/mcp/sequentialthinking/) [FULL]
