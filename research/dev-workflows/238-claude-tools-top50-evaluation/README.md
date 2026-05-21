---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-21
original-query: Which Claude tools and MCP servers should ZAO OS evaluate and install? (reconstructed)
tier: STANDARD
---

# 238 - Claude Tools Top 50 Evaluation for ZAO OS

> **Goal:** Filter 1,100+ Claude skills and MCP servers down to 5-10 worth installing for ZAO's stack (Supabase, Next.js, agents).

---

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Install Context7 first (P0) | 51.8K stars, MIT, solves hallucinated API docs for Next.js/Supabase (ZAO's stack). Latest docs fetched on-demand. No hallucinations = high ROI. |
| 2 | MCPHub on OpenClaw VPS (P1) | Unified MCP server management. ZOE runs multiple MCPs; dashboard + hot-swap = easier maintenance. |
| 3 | Install supabase/agent-skills + trailofbits/skills (P1) | Supabase RLS patterns (1.9K stars, from the team). Trail of Bits security (4.8K stars). Both high-authority, stack-specific. |
| 4 | Skip Codebase Memory MCP for now | ZAO has KNOWLEDGE.json + grep/glob. Overkill until 50K+ LoC. Revisit Q3. |
| 5 | Skip claude-squad, use Claude Code native subagents instead | Native subagents + /batch in Claude Code already solve parallelism. AGPL dependency not worth the overhead. |

## Install Priority by ROI

| Rank | Tool | Verdict | Why | Install Path |
|------|------|---------|-----|--------------|
| **P0** | **Context7** | **INSTALL** | Next.js 16, Supabase, React 19 docs always current. Eliminates outdated API hallucinations. 51.8K stars, MIT. | `npx ctx7 setup` |
| **P1** | **supabase/agent-skills** | **INSTALL** | RLS patterns, Postgres best practices. From Supabase team. 1.9K stars. | GitHub: `supabase/agent-skills` |
| **P1** | **trailofbits/skills** | **INSTALL** | Static analysis, semgrep, security diffs. ZAO handles wallet keys + smart contracts. 4.8K stars. | GitHub: `trailofbits/skills` |
| **P1** | **mattpocock/skills** | **AUDIT** | TypeScript rigor (18.2K stars). Matches ZAO's `.claude/rules/typescript-hygiene.md`. Audit for overlap with ECC. | GitHub: `mattpocock/skills` |
| **P1** | **MCPHub** | **DEFER** | Docker deploy on VPS 1. Useful when ZOE gains 3+ MCP servers. Revisit next sprint. | Docker: `samanhappy/mcphub` |
| **P2** | **Mem9** | **WATCH** | Multi-agent shared memory. Relevant when ZOE + Hermes + other agents need unified context. Phase 1 complete, not mature yet. | GitHub: `mem9-ai/mem9` |
| **SKIP** | Codebase Memory MCP | **NO** | Overkill now. AST-level indexing valuable at 50K+ LoC or 3+ contributors. Revisit Q3. | — |
| **SKIP** | Codefire | **NO** | 194 stars, requires OpenRouter key. Overlaps with MEMORY.md + research library. | — |
| **SKIP** | claude-squad | **NO** | Claude Code native subagents sufficient. Don't add AGPL dependency for parallelism already built-in. | — |

---

## 2026 MCP Ecosystem Update

Five MCP servers are core to Claude Code workflows per May 2026 research:

| Server | Purpose | ZAO Fit | Status |
|--------|---------|---------|--------|
| **Context7** (55.7K stars, updated 2026-05-21) | Fetch current library docs for Next.js, Supabase, etc. | DIRECT - solves training-cutoff hallucinations. Latest: ctx7@0.4.2 (May 11 2026), 120 contributors, 74 releases, active maintenance [FULL] | INSTALL |
| **Playwright** (MS, official) | Browser automation + testing. Local, no data exfil risk. | MEDIUM - ZAO uses Playwright for page testing | INSTALL |
| **GitHub MCP** (official) | PR triage, code search, issue tracking | MEDIUM - ZAO on GitHub, already have gh CLI | OPTIONAL |
| **Sequential Thinking** (official) | Multi-step reasoning for complex problems | LOW - not a bottleneck for ZAO currently | DEFER |
| **Memory MCP** (Anthropic official) | Persistent knowledge graph across sessions | HIGH - ZOE needs cross-session recall | AUDIT |

All 5 are first-party or high-rep community servers. Total context tax manageable: all fit under 10% of window combined. [FULL]

---

## Detailed Comparison Table (Updated May 2026)

| Tool | What It Does | License | Stars | Free Tier | Install Command | ZAO Integration Notes |
|------|-------------|---------|-------|-----------|-----------------|----------------------|
| **Context7** | Injects up-to-date library docs into LLM context. No more hallucinated APIs. Supports Next.js, Supabase, React, etc. | MIT | 55,752 (updated May 20 2026) | Free API key at context7.com/dashboard; paid = higher rate limits | `npx ctx7 setup` | Direct hit. ZAO uses Next.js 16, Supabase, React 19 — all supported. Eliminates outdated API pattern hallucinations. MCP server at `https://mcp.context7.com/mcp`. Latest release ctx7@0.4.2 (May 11 2026). [FULL] |
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

[FULL]
- [Context7 MCP](https://github.com/upstash/context7) - 51.8K stars, MIT, v0.3.9+
- [Supabase Agent Skills](https://github.com/supabase/agent-skills) - 1.9K stars, MIT
- [Trail of Bits Skills](https://github.com/trailofbits/skills) - 4.8K stars, MIT, 29 security skills
- [Matt Pocock Skills](https://github.com/mattpocock/skills) - 18.2K stars, TypeScript TDD
- [MCPHub Dashboard](https://github.com/samanhappy/mcphub) - 2.0K stars, Apache-2.0
- [Mem9 Persistent Memory](https://github.com/mem9-ai/mem9) - 824 stars, Apache-2.0
- [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) - 1.1K stars, MIT (defer for now)
- [MCPHub Directory - Top 100](https://mcphub.com/top-100-mcp-servers) - Live ranking, May 2026
- [Canopy Press - Best MCP Servers](https://canopy.press/best-mcp-servers-for-claude-right-now/) - Evaluation framework
- [Five MCP Servers Before Claude Code Writes a Line](https://dev.to/studiomeyer_io/five-mcp-servers-before-claude-code-writes-a-single-line-18f8) - May 12 2026 workflow patterns
- [Context7 vs DeepWiki vs Ref vs Docfork Comparison](https://mcp.directory/blog/context7-vs-deepwiki-vs-ref-vs-docfork-2026/) - Apr 30 2026
- [Claude Code MCP Servers Guide](https://cc.bruniaux.com/guide/mcp-servers-ecosystem/) - May 2026, 7.1K server ecosystem
- [ClaudePluginHub Blog - MCP Servers for Claude Code](https://www.claudepluginhub.com/blog/mcp-server-plugins-for-claude-code) - Apr 29 2026

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install Context7, test on Next.js 16 routes | @Zaal | Install + verify | This week |
| Review supabase/agent-skills for RLS pattern reuse | @Zaal | Code audit | Next sprint |
| Evaluate Trail of Bits for agent/contract security | @Zaal | Security review | Next sprint |
| Audit mattpocock/skills overlap with ECC TypeScript skills | Claude | Diff analysis | This week |
| Plan MCPHub deploy on VPS 1 (ZOE multi-MCP coordination) | @Zaal | Architecture | May 31 |

---

## Also See

- Doc 154 - Skills & Commands Master Reference
- Doc 312 - Claude Skills Marketplace (prior, RoboRhythms analysis)
- Doc 507 - Claude Skills 1,116 Ecosystem ZAO Picks (companion)
