# 238 — Claude Tools Top 50 Evaluation for ZAO OS

**Date:** 2026-04-01
**Source:** "Top 50 Claude Skills & GitHub Repos" by @zodchiii (X, March 20 2026)
**Status:** Current
**Category:** tooling

---

## Recommendations Summary

| # | Tool | Verdict | Priority | Action |
|---|------|---------|----------|--------|
| 1 | Context7 | **USE** | P0 | Install today — solves hallucinated API problem |
| 2 | Codebase Memory MCP | **WATCH** | P2 | ZAO's knowledge graph + grep works; revisit if codebase 3x |
| 3 | Markdownify MCP | **SKIP** | — | Claude Code already reads PDFs/images natively |
| 4 | MCPHub | **USE** | P1 | Deploy on OpenClaw VPS to manage ZOE's MCP servers |
| 5 | Claude SEO | **USE** | P1 | Run full audit on thezao.com before next launch push |
| 6 | Brand Guidelines | **SKIP** | — | ZAO already has brand rules in CLAUDE.md + components.md |
| 7 | Skill Creator | **WATCH** | P3 | Nice-to-have; ZAO already has 9 custom skills + superpowers |
| 8 | Doc Co-Authoring | **SKIP** | — | Whitepaper already done; not enough doc-writing volume |
| 9 | claude-squad | **USE** | P1 | Parallel agents for sprint work; AGPL = no bundling (OK for dev tool) |
| 10 | rendergit | **SKIP** | — | Neat but low utility — agent context solved better by Context7 |
| 11 | TDD Guard | **USE** | P1 | Enforces test-first; ZAO has 248 tests, needs discipline |
| 12 | Claude Inspector | **WATCH** | P3 | Useful for debugging prompt costs; not daily driver |
| 13 | Mem9 | **WATCH** | P2 | Compare to OpenClaw built-in memory; interesting for multi-agent |
| 14 | Codefire | **SKIP** | — | Too early (194 stars), overlaps with MEMORY.md + knowledge graph |

**Immediate installs (this week):** Context7, claude-squad, TDD Guard, Claude SEO
**Next sprint:** MCPHub on OpenClaw VPS
**Revisit Q3 2026:** Codebase Memory MCP, Mem9, Skill Creator

---

## Detailed Comparison Table

| Tool | What It Does | License | Stars | Free Tier | Install Command | ZAO Integration Notes |
|------|-------------|---------|-------|-----------|-----------------|----------------------|
| **Context7** | Injects up-to-date library docs into LLM context. No more hallucinated APIs. Supports Next.js, Supabase, React, etc. | MIT | 51.3k | Free API key at context7.com/dashboard; paid = higher rate limits | `npx ctx7 setup` | Direct hit. ZAO uses Next.js 16, Supabase, React 19 — all supported. Eliminates outdated API pattern hallucinations. MCP server at `https://mcp.context7.com/mcp`. |
| **Codebase Memory MCP** | Persistent knowledge graph via tree-sitter AST parsing (66 languages). SQLite + LZ4 storage. | MIT | 1.1k | Fully free/local | `curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh \| bash` | ZAO already has `research/_graph/KNOWLEDGE.json` (194 docs) + grep/glob. This tool adds AST-level code graph (functions, classes, routes, relationships). Overkill now but valuable if codebase grows significantly. |
| **Markdownify MCP** | Converts PDFs, images, audio, DOCX, XLSX, PPTX, YouTube transcripts to Markdown. | MIT | 2.5k | Fully free/local | Clone + `pnpm install && pnpm build` | Claude Code already reads PDFs and images natively. ZAO's research ingestion workflow uses WebFetch + WebSearch. Marginal gain. |
| **MCPHub** | Centralized management of multiple MCP servers. Dashboard UI, Docker support, smart routing, hot-swap config. | Apache-2.0 | 2.0k | Fully free/self-hosted | `docker run -p 3000:3000 -v ./mcp_settings.json:/app/mcp_settings.json samanhappy/mcphub` | Strong fit for OpenClaw VPS (31.97.148.88). ZOE currently manages MCP servers individually. MCPHub adds unified endpoint, dashboard monitoring, and OAuth. Docker-native = easy deploy. |
| **Claude SEO** | 19 sub-skills: technical audit, E-E-A-T, schema markup, Core Web Vitals, local SEO, AI search optimization (GEO), Google API integration. | MIT | 3.7k | Free (uses Claude Code) | `claude plugin install claude-seo@claude-seo-marketplace` | thezao.com needs SEO work. This is the most comprehensive SEO skill available. Runs parallel subagents for full-site audit. Works with existing Claude Code setup. |
| **Brand Guidelines** | Encodes brand identity (colors, fonts, visual elements) into a skill for consistent output. | MIT (Anthropic repo) | N/A | Free | Copy SKILL.md to `.claude/skills/` | ZAO already has brand rules in `CLAUDE.md` (navy #0a1628, gold #f5a623) and `.claude/rules/components.md`. Adding a separate skill is redundant — the enforcement is already inline. |
| **Skill Creator** | Meta-skill: interview user, generate SKILL.md, test with evals, iterate. 5-stage loop. | MIT (Anthropic repo) | N/A | Free | Copy SKILL.md to `.claude/skills/` | ZAO has 9 custom skills + ~30 superpowers skills. The creation workflow is already internalized. Useful if onboarding new contributors who need to create skills. Low priority. |
| **Doc Co-Authoring** | 3-stage collaborative writing: context gathering, refinement with surgical edits, reader testing with fresh Claude instance. | MIT (Anthropic repo) | N/A | Free | Copy SKILL.md to `.claude/skills/` | ZAO whitepaper (Doc 051) is already at Draft 4.5. Not enough ongoing doc-writing volume to justify. Could revisit for governance documentation. |
| **claude-squad** | Terminal app managing multiple Claude Code / Codex / Gemini agents in parallel tmux sessions with git worktrees. | **AGPL-3.0** | 6.8k | Free | `brew install claude-squad` | Already referenced in ZAO Doc 165. Perfect for sprint work: run 3-4 agents on independent features simultaneously. AGPL is fine since this is a dev tool (not bundled into ZAO OS). Requires tmux + gh CLI. |
| **rendergit** | Flattens a git repo into a single HTML page with syntax highlighting + LLM-optimized text view. | BSD-0 | 2.1k | Free | `uv tool install git+https://github.com/karpathy/rendergit` | Cool concept but low practical value. Context7 solves the "give agent context" problem better. Only 6 commits, no releases. Fun to try once, not a workflow tool. |
| **TDD Guard** | Enforces test-driven development: blocks implementation without failing tests, enforces minimal implementation, lint integration. | MIT | 2.0k | Free | `claude plugin install nizos/tdd-guard` then `/tdd-guard:setup` | Strong fit. ZAO has 248 tests (0/248 manually tested per QA doc). Works with Vitest (ZAO's test framework). Prevents agents from skipping tests. Requires Node.js 22+. |
| **Claude Inspector** | Electron MITM proxy that captures Claude Code API traffic. Reveals system prompt injection, tool loading, context growth, costs. | MIT | 110 | Free | `brew install --cask kangraemin/tap/claude-inspector` | Educational and useful for debugging token costs. Low daily utility but valuable when optimizing expensive agent workflows. macOS only. |
| **Mem9** | Cloud-backed persistent memory for AI agents. Hybrid vector + keyword search. Multi-tenant. TiDB backend. | Apache-2.0 | 824 | Free tier: 25 GiB storage, 250M requests/month (TiDB Cloud Starter) | Deploy mnemo-server + install Claude Code plugin | Interesting competitor to OpenClaw's built-in memory. Key differentiator: multi-agent shared memory pool. Would be relevant if ZAO runs multiple agents (ZOE + others). Phase 1 complete, Phase 3-4 still planned = early. |
| **Codefire** | Desktop app giving coding agents persistent memory via local SQLite. 63 MCP tools. Task tracking, session history, code search. | MIT | 194 | Free (needs OpenRouter API key) | Download app + configure MCP | Too early. 194 stars, requires OpenRouter key. ZAO already has MEMORY.md + knowledge graph + research library. Overlapping functionality without clear advantage. |

---

## Detailed Analysis by Category

### MCP Servers

#### Context7 — USE (P0)

The strongest recommendation on this list. Context7 directly addresses a real ZAO OS development pain point: Claude hallucinating outdated API patterns for Next.js, Supabase, and React.

**How it works:** MCP server that fetches up-to-date, version-specific documentation on demand. When you ask about Next.js middleware, it pulls the current Next.js 16 docs — not the Next.js 13 patterns from training data.

**Integration path:**
1. Run `npx ctx7 setup` (handles OAuth + API key)
2. Adds MCP server entry to `.claude/settings.json` pointing to `https://mcp.context7.com/mcp`
3. Use in prompts: "Using Context7, how do I set up Supabase RLS for this table?"

**Why P0:** ZAO uses bleeding-edge stack (Next.js 16, React 19, Supabase). These move fast. Context7's 51.3k stars and weekly releases (v0.3.9, March 27) indicate strong maintenance. MIT license. Free tier sufficient for solo/small team.

#### Codebase Memory MCP — WATCH (P2)

Impressive engineering (tree-sitter AST parsing, 66 languages, indexes Linux kernel in 3 minutes) but solves a problem ZAO doesn't fully have yet.

**What ZAO already has:** `research/_graph/KNOWLEDGE.json` with 194 docs indexed by category, tag, and code path. Grep/glob for code search. CLAUDE.md with architecture overview.

**When to adopt:** If ZAO OS codebase exceeds ~50k lines or gains multiple contributors who need codebase orientation. The AST-level graph (function calls, imports, route definitions) would become valuable at that scale.

**Risk:** Adds a PreToolUse hook that redirects agents from grep/glob to MCP graph tools — could conflict with ZAO's existing hooks in `.claude/settings.json`.

#### Markdownify MCP — SKIP

Claude Code natively reads PDFs and images as of the current version. ZAO's research ingestion uses WebFetch + WebSearch. The audio transcription feature is niche. The YouTube transcript feature is the only unique capability, but not a frequent ZAO need.

#### MCPHub — USE (P1)

Strong fit for the OpenClaw VPS (31.97.148.88) where ZOE runs. Currently, each MCP server on that VPS is managed individually.

**Integration path:**
1. Docker deploy on OpenClaw VPS: `docker run -p 3000:3000 -v ./mcp_settings.json:/app/mcp_settings.json samanhappy/mcphub`
2. Register existing MCP servers (web search, file system, etc.) in `mcp_settings.json`
3. Point ZOE at unified `http://localhost:3000` endpoint
4. Use dashboard at `:3000` for monitoring

**Why P1 not P0:** Works fine without it. Becomes essential when adding more MCP servers to ZOE (Context7, future tools).

### Skills

#### Claude SEO — USE (P1)

19 sub-skills is comprehensive. The parallel subagent architecture means a full-site audit runs fast. Key capabilities for ZAO:
- Technical SEO audit of thezao.com
- Schema markup generation (MusicGroup, Event, Organization)
- Core Web Vitals check (Next.js performance)
- AI search optimization (GEO) — important for discoverability

**Install:** `claude plugin install claude-seo@claude-seo-marketplace`

**When to run:** Before the next thezao.com launch push or marketing sprint.

#### Brand Guidelines — SKIP

ZAO's brand enforcement is already embedded in:
- `CLAUDE.md`: "Dark theme: navy #0a1628 background, gold #f5a623 primary"
- `.claude/rules/components.md`: "Follow the dark theme" + Tailwind directives
- `community.config.ts`: All branding centralized

The Anthropic skill is designed for teams that have NO brand rules encoded. ZAO already does.

#### Skill Creator — WATCH (P3)

The 5-stage loop (capture intent, write SKILL.md, test with evals, review, iterate) is well-designed. The eval-viewer for side-by-side comparison is the killer feature.

**When to adopt:** When ZAO wants to formalize eval testing for existing skills, or when onboarding contributors who need to create skills without deep Claude Code knowledge.

#### Doc Co-Authoring — SKIP

The 3-stage workflow (context gathering, surgical edits, reader testing with fresh instance) is smart. But ZAO's doc-heavy phase (whitepaper, research library) is largely complete. Not enough ongoing volume.

### Agent Tools

#### claude-squad — USE (P1)

The most practical agent orchestration tool available. Each agent gets its own tmux session + git worktree = zero conflicts.

**AGPL-3.0 license note:** This is a dev tool, not bundled into ZAO OS. AGPL only matters if you distribute modified versions. Using it as-is for development is fine.

**Integration path:**
1. `brew install claude-squad`
2. Ensure tmux and gh CLI installed
3. Use for sprint work: `cs new "fix-player-bug"` + `cs new "add-nft-gallery"` + `cs new "seo-audit"` running in parallel

**When to use:** Sprint days with 3+ independent tasks. Already referenced in ZAO Doc 165.

#### rendergit — SKIP

Karpathy's name gives it visibility but it's a simple tool (6 commits, no releases). The "flatten repo to one file" concept is solved better by Context7 (for docs) and codebase-memory-mcp (for code structure). Fun to try, not a workflow tool.

#### TDD Guard — USE (P1)

ZAO has 248 tests across 15 areas but QA doc shows 0/248 manually verified. TDD Guard would enforce discipline: agents cannot write implementation without first writing a failing test.

**Integration path:**
1. Install: `claude plugin install nizos/tdd-guard` then run `/tdd-guard:setup`
2. Works with Vitest (ZAO's test framework)
3. Configurable rules — can be toggled per session

**Why P1:** Complements ZAO's existing test infrastructure. The `superpowers:test-driven-development` skill provides guidance but TDD Guard provides enforcement (blocks, not just suggests).

#### Claude Inspector — WATCH (P3)

Reveals the hidden mechanics: system prompt size (~12KB), tool loading patterns, context accumulation, sub-agent isolation. Useful for understanding and optimizing Claude Code costs.

**When to use:** When debugging why a session is expensive, or when optimizing skill loading. Not a daily tool.

### Memory & Context

#### Mem9 — WATCH (P2)

The multi-agent shared memory pool is the differentiator. If ZAO runs ZOE (OpenClaw) + local Claude Code + possibly other agents, Mem9 could be the shared brain.

**Comparison to OpenClaw's built-in memory:**
- OpenClaw: Per-agent memory, built into the framework
- Mem9: Cross-agent memory with hybrid vector+keyword search, multi-tenant isolation

**When to adopt:** When ZAO has 2+ agents that need to share context (e.g., ZOE knows about a user issue, local Claude Code needs that context). Phase 1 complete but Phase 3-4 still planned = not fully mature.

#### Codefire — SKIP

194 stars, requires OpenRouter API key, overlaps with existing MEMORY.md + knowledge graph. The 63 MCP tools are impressive but ZAO's memory needs are covered by the research library + CLAUDE.md + MEMORY.md system.

---

## Installation Runbook (Recommended Tools)

### 1. Context7 (do first)
```bash
npx ctx7 setup
# Follow OAuth flow, get API key
# Verify: check .claude/settings.json for MCP server entry
```

### 2. claude-squad
```bash
brew install claude-squad
# Verify: cs --version
# Requires: tmux, gh CLI
```

### 3. TDD Guard
```bash
# In Claude Code:
# /plugin install nizos/tdd-guard
# Then: /tdd-guard:setup
# Configure for Vitest
```

### 4. Claude SEO
```bash
# In Claude Code:
# claude plugin install claude-seo@claude-seo-marketplace
# Then: /seo audit https://thezao.com
```

### 5. MCPHub (on OpenClaw VPS, next sprint)
```bash
# SSH to 31.97.148.88
docker run -d --name mcphub \
  -p 3000:3000 \
  -v /opt/mcphub/mcp_settings.json:/app/mcp_settings.json \
  samanhappy/mcphub
```

---

## Sources

- Context7: https://github.com/upstash/context7 (51.3k stars, MIT, v0.3.9)
- Codebase Memory MCP: https://github.com/DeusData/codebase-memory-mcp (1.1k stars, MIT)
- Markdownify MCP: https://github.com/zcaceres/markdownify-mcp (2.5k stars, MIT, v1.0.2)
- MCPHub: https://github.com/samanhappy/mcphub (2.0k stars, Apache-2.0, v0.12.10)
- Claude SEO: https://github.com/AgriciDaniel/claude-seo (3.7k stars, MIT)
- Brand Guidelines: https://github.com/anthropics/skills/tree/main/skills/brand-guidelines (MIT)
- Skill Creator: https://github.com/anthropics/skills/tree/main/skills/skill-creator (MIT)
- Doc Co-Authoring: https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring (MIT)
- claude-squad: https://github.com/smtg-ai/claude-squad (6.8k stars, AGPL-3.0, v1.0.17)
- rendergit: https://github.com/karpathy/rendergit (2.1k stars, BSD-0)
- TDD Guard: https://github.com/nizos/tdd-guard (2.0k stars, MIT, v1.3.0)
- Claude Inspector: https://github.com/kangraemin/claude-inspector (110 stars, MIT, v1.1.5)
- Mem9: https://github.com/mem9-ai/mem9 (824 stars, Apache-2.0)
- Codefire: https://github.com/websitebutlers/codefire-app (194 stars, MIT, v1.5.2)
- ZAO Doc 165 (claude-squad reference)
- ZAO Doc 154 (skills/commands master reference)

---

*Cross-references: Doc 154 (skills master reference), Doc 165 (claude-squad), Doc 209 (Claude skills + MCP toolkit), Doc 232 (MCP server development guide), Doc 234 (OpenClaw guide)*
