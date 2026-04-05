# 91 — Top Claude Skills, MCP Servers & GitHub Repos for ZAO OS

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Evaluate the viral "Top 50 Claude Skills & GitHub Repos" list (189K views) and identify which skills, MCP servers, and repos are most relevant for ZAO OS development
> **Source:** [@zodchiii tweet](https://x.com/zodchiii/status/2034924354337714642) + ecosystem research

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install Context7 MCP** | YES — 49.9K stars, free, gives Claude up-to-date docs for Next.js 16, Supabase, Wagmi, XMTP. Eliminates hallucinated APIs. Install: `npx ctx7 setup` |
| **Install Tavily MCP** | YES — web search from inside Claude Code. Free tier = 1,000 searches/month. Install: `claude mcp add --transport http tavily https://mcp.tavily.com/mcp` |
| **Install Task Master AI** | EVALUATE — 26K stars, PRD-to-tasks workflow. Good for the doc 90 Agent OS implementation. Install: `npm install -g task-master-ai` |
| **Install official Anthropic skills** | YES — `pdf`, `xlsx` for governance doc processing. 98.6K stars. Install from [github.com/anthropics/skills](https://github.com/anthropics/skills) |
| **Skip gstack** | ALREADY INSTALLED — 21 skills active at `~/.claude/skills/gstack/` |
| **Skip Superpowers** | OVERLAP — autoresearch + gstack already cover brainstorming, TDD, shipping, review |
| **Bookmark skill marketplaces** | YES — skillsmp.com (500K+ skills), aitmpl.com/skills, awesomeskills.dev (3,032 skills) |
| **Skip agent frameworks** | YES — Dify, LangGraph, AutoGen, CrewAI are for building agent platforms. ZAO uses Paperclip + ElizaOS instead |

---

## Tier 1: Install Now (High Value for ZAO OS)

### Context7 MCP Server
**What:** Pulls up-to-date, version-specific documentation from official library sources directly into prompts. No more hallucinated APIs from stale training data.

| Stat | Value |
|------|-------|
| Stars | 49,900 |
| License | MIT |
| Cost | Free |
| Repo | [github.com/upstash/context7](https://github.com/upstash/context7) |

**Install:**
```bash
npx ctx7 setup
# Or manually:
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

**Usage:** Add "use context7" to any prompt, or specify: "use library /supabase/supabase for API and docs"

**Why for ZAO OS:** ZAO uses Next.js 16 (very new), Supabase, Wagmi v2, XMTP browser SDK v7, Neynar SDK v3 — all of which have APIs that changed recently. Context7 ensures Claude always has the current docs, not stale training data. This alone could prevent hours of debugging wrong API calls.

### Tavily MCP Server
**What:** Production-ready MCP server providing real-time web search, content extraction, site mapping, and crawling from within Claude Code.

| Stat | Value |
|------|-------|
| Stars | 1,400 |
| License | MIT |
| Cost | Free tier: 1,000 credits/month. Paid: from $0.008/credit |
| Repo | [github.com/tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp) |

**Install:**
```bash
# With API key (recommended):
claude mcp add --transport http tavily "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_KEY"
# Without key (OAuth flow):
claude mcp add --transport http tavily https://mcp.tavily.com/mcp
```

**Free tier:** 1,000 API credits/month (no credit card). Basic search = 1 credit.

**Why for ZAO OS:** Powers the `/zao-research` skill with live web search. Currently web research uses WebSearch/WebFetch tools — Tavily gives structured, AI-optimized search results instead of raw HTML. Also useful for the Research Agent in Paperclip.

### Anthropic Official Skills (pdf, xlsx, docx)
**What:** Official document processing skills from Anthropic. Extract text, tables, metadata from PDFs, create/edit spreadsheets, generate documents.

| Stat | Value |
|------|-------|
| Stars | 98,600 |
| License | Apache 2.0 |
| Cost | Free |
| Repo | [github.com/anthropics/skills](https://github.com/anthropics/skills) |

**Install:**
```bash
git clone https://github.com/anthropics/skills.git /tmp/anthropic-skills
# Copy the ones you need:
cp -r /tmp/anthropic-skills/pdf .claude/skills/pdf
cp -r /tmp/anthropic-skills/xlsx .claude/skills/xlsx
```

**Why for ZAO OS:** Process governance proposals as PDFs, analyze allowlist CSVs as spreadsheets, generate community reports. The `xlsx` skill is especially useful for the admin CSV upload flow.

---

## Tier 2: Evaluate Soon (Good Fit, More Setup)

### Task Master AI (Claude Task Master)
**What:** AI-powered task management. Parses PRDs into structured tasks with dependencies, tracks implementation progress, generates complexity reports.

| Stat | Value |
|------|-------|
| Stars | 26,000 |
| License | MIT with Commons Clause |
| Cost | Free (bring your own API keys) |
| Repo | [github.com/eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) |
| Docs | [task-master.dev](https://www.task-master.dev/) |

**Install:**
```bash
npm install -g task-master-ai
```

**Why for ZAO OS:** Could replace the manual sprint planning in `docs/superpowers/plans/`. Feed it the doc 90 Agent OS design → auto-generate task tree with dependencies. Multi-model support (Claude, OpenAI, Gemini).

**Why wait:** ZAO already has autoresearch + gstack `/office-hours` for planning. Task Master adds value only if you need structured PRD→task pipelines with dependency tracking.

### Vercel Next.js Best Practices Skill
**What:** Official Vercel skill for Next.js patterns — file conventions, RSC boundaries, data patterns, metadata, error handling.

**Why for ZAO OS:** Already have `/next-best-practices` skill installed (project-level). Check if the Vercel official version is more up-to-date for Next.js 16 patterns.

### Supabase PostgreSQL Best Practices Skill
**What:** PostgreSQL patterns for Supabase — RLS, schema design, Edge Functions, pgvector.

**Why for ZAO OS:** ZAO has 14+ tables with RLS. This skill could improve schema decisions for new tables (agent_logs, member_onboarding from doc 90).

### Composio SaaS Integrations
**What:** 78+ SaaS app integrations as Claude Code skills — Slack, GitHub, Discord, Telegram, Twitter, Stripe.

| Stat | Value |
|------|-------|
| Repo | [github.com/ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

**Why for ZAO OS:** Could power the Content Publisher agent (doc 90, deferred) — cross-post to Discord, Telegram, Twitter without building custom integrations. Also useful for GitHub issue tracking from Paperclip.

### Webapp Testing (Playwright)
**What:** Official Anthropic skill for testing web apps with Playwright.

**Why for ZAO OS:** gstack's `/qa` already does this with its own Playwright setup. Evaluate if the Anthropic version adds anything gstack doesn't have.

---

## Tier 3: Bookmark for Later

### Agent Frameworks (Skip for Now)

These are for building agent *platforms*, not for building *on top of* existing agent tooling. ZAO already uses Paperclip + ElizaOS.

| Repo | Stars | Why Skip |
|------|-------|---------|
| **Dify** | 129.8K | Visual drag-and-drop agent builder. ZAO uses Claude Code directly |
| **LangGraph** | 24.8K | LangChain ecosystem. ZAO doesn't use LangChain |
| **AutoGen** | 44.6K | Microsoft multi-agent. ZAO uses Paperclip for multi-agent |
| **CrewAI** | ~25K | Role-based agent teams. Overlaps with Paperclip agent roles |
| **MetaGPT** | ~45K | Software company simulation. Overlaps with Paperclip + gstack |

### Multi-Agent Orchestrators (Watch)

| Repo | Description | Why Watch |
|------|-------------|----------|
| **Claude Squad** | Terminal app managing multiple Claude agents | Alternative to Conductor for parallel sessions |
| **Claude Swarm** | Agent swarm orchestration | If Paperclip doesn't scale |
| **Claude Code Flow** | Code-first orchestration | If you need more control than Paperclip provides |
| **Container Use (Dagger)** | Containerized dev environments for agents | If agents need isolated environments |

### Content & Marketing Skills (Future)

| Skill | Description | When Useful |
|-------|-------------|-------------|
| **create-viral-content** | Social media content optimized for virality | When Content Publisher agent ships |
| **Twitter Algorithm Optimizer** | Optimize tweets for reach | For cross-posting to X/Twitter |
| **marketingskills** | Marketing strategy and campaigns | For community growth campaigns |
| **Typefully** | Social media scheduling | Alternative to ZAO's built-in scheduling |
| **Remotion** | Programmatic video with React | Music video content for /zao channel |

### Data & Research (Future)

| Skill | Description | When Useful |
|-------|-------------|-------------|
| **D3.js Visualization** | Interactive data visualizations | For community analytics dashboard |
| **CSV Data Summarizer** | CSV analysis with visualizations | For admin allowlist/respect data |
| **deep-research (Gemini)** | Multi-step research using Gemini | Alternative to `/zao-research` skill |
| **Supermemory** | AI memory and context engine | If Hindsight memory (doc 26) doesn't ship |
| **postgres skill** | Safe read-only SQL queries | Direct Supabase query tool for debugging |

### Security (Already Covered)

| Skill | Description | Status |
|-------|-------------|--------|
| **Trail of Bits Security** | Code auditing skills | ZAO has `/autoresearch:security` + security-auditor agent |
| **FFUF Web Fuzzing** | Vulnerability scanning | Specialized — use if doing a deep security audit |

---

## Skill Marketplaces to Bookmark

| Marketplace | Size | URL | Notes |
|-------------|------|-----|-------|
| **skillsmp.com** | 500K+ skills | [skillsmp.com](https://skillsmp.com) | Largest. Filters by quality (min 2 stars). Not affiliated with Anthropic |
| **aitmpl.com/skills** | Growing | [aitmpl.com/skills](https://www.aitmpl.com/skills/) | One-click `npx` install. Partners with Bright Data, Neon |
| **awesomeskills.dev** | 3,032 skills | [awesomeskills.dev](https://www.awesomeskills.dev/en) | Curated atlas across all platforms |
| **VoltAgent/awesome-agent-skills** | 630+ skills | [GitHub](https://github.com/VoltAgent/awesome-agent-skills) | 12.1K stars. Includes official vendor skills |
| **Pawgrammer Skills** | 172+ skills | [skills.pawgrammer.com](https://skills.pawgrammer.com/) | Free community skills |
| **Claude Skills Market** | Growing | [claudeskillsmarket.com](https://www.claudeskillsmarket.com/) | Community marketplace |

---

## Quick Install Commands (Copy-Paste Ready)

```bash
# 1. Context7 MCP (up-to-date library docs)
npx ctx7 setup

# 2. Tavily MCP (web search from Claude Code)
# Get free API key at tavily.com, then:
claude mcp add --transport http tavily "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_KEY"

# 3. Anthropic official skills (document processing)
git clone https://github.com/anthropics/skills.git /tmp/anthropic-skills
cp -r /tmp/anthropic-skills/pdf ~/.claude/skills/pdf
cp -r /tmp/anthropic-skills/xlsx ~/.claude/skills/xlsx

# 4. Task Master AI (PRD → tasks, optional)
npm install -g task-master-ai
```

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| **89** — Paperclip + gstack + autoresearch Stack | Covers gstack (already installed), Conductor, skill marketplaces. This doc adds MCP servers + official skills |
| **69** — Claude Code Tips & Best Practices | 45 tips audited. Context7 + Tavily address the "stale docs" gap identified there |
| **63** — Autoresearch Deep Dive | autoresearch already installed. Task Master AI is a complementary workflow tool |
| **44** — Agentic Development Workflows | Original agent tooling doc. This doc represents the 2026 state of the ecosystem |
| **70** — Subagents vs Agent Teams | Agent framework comparison. This doc confirms: skip Dify/LangGraph/CrewAI, use Paperclip |

---

## Sources

- [@zodchiii tweet — Top 50 Claude Skills](https://x.com/zodchiii/status/2034924354337714642) — 189K views, 2.7K bookmarks
- [Anthropic Official Skills](https://github.com/anthropics/skills) — 98.6K stars
- [Context7](https://github.com/upstash/context7) — 49.9K stars
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) — 1.4K stars, [docs](https://docs.tavily.com/documentation/mcp)
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master) — 26K stars, [docs](https://www.task-master.dev/)
- [Superpowers](https://github.com/obra/superpowers) — 101K stars
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 12.1K stars, 630+ skills
- [SkillsMP](https://skillsmp.com) — 500K+ skills marketplace
- [AI Templates](https://www.aitmpl.com/skills/) — Skills marketplace with npx install
- [Composio Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills) — 78+ SaaS integrations
- [TurboDocx: Best Claude Code Skills](https://www.turbodocx.com/blog/best-claude-code-skills-plugins-mcp-servers)
