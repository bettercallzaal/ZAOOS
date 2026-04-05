# 269 — Claude Skills, MCP Servers & Agent Toolkit for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate the top Claude skills, MCP servers, and GitHub repos from @zodchiii's curated list + LarryBrain marketplace for ZAO OS adoption
> **Source:** [zodchiii tweet (6.6M views)](https://x.com/zodchiii/status/2034924354337714642) + [larrybrain.com](https://www.larrybrain.com/skills/larry-marketing)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Marketing skills** | INSTALL Corey Haines Marketing Skills (40+ skills, MIT, free) — codifies ZAO's positioning for cross-platform content |
| **Social graphics** | INSTALL Canvas Design skill (Anthropic official) — generates PNG/PDF social cards for Farcaster/Bluesky/X publishing |
| **Brand consistency** | FORK Brand Guidelines skill with ZAO colors (navy `#0a1628`, gold `#f5a623`) — auto-applies brand to all generated visuals |
| **Codebase intelligence** | INSTALL Codebase Memory MCP (MIT, single binary) — persistent knowledge graph for 30+ music components + growing codebase |
| **Library docs** | INSTALL Context7 MCP — inject current Next.js 16, Supabase, Wagmi docs into context, prevent hallucinated APIs |
| **SEO** | INSTALL Claude SEO skill for landing page + cross-posted content schema markup optimization |
| **LarryBrain / OpenClaw** | SKIP for now — ZAO already has OpenClaw on VPS (Doc 207), Larry Marketing targets TikTok slideshows which isn't ZAO's primary channel |
| **Mem9 memory** | SKIP — current MEMORY.md + 166 research docs sufficient for single-agent workflow. Revisit when multi-agent is live |
| **Tavily MCP** | SKIP — WebSearch/WebFetch in Claude Code already covers research needs. Free tier (1,000/mo) adds little over existing tools |
| **Agent frameworks** | SKIP new frameworks — ZAO already invested in ElizaOS + OpenClaw + Paperclip stack (Docs 024, 205, 207) |

## Comparison of Options — Skills Worth Installing

| Skill/Tool | Type | Install Time | Cost | ZAO Relevance | Priority |
|------------|------|-------------|------|---------------|----------|
| **Marketing Skills** (coreyhaines31) | Claude Skill | 5 min | Free (MIT) | HIGH — content for 7-platform publishing | P0 |
| **Canvas Design** (Anthropic) | Claude Skill | 5 min | Free | HIGH — social graphics pipeline | P0 |
| **Brand Guidelines** (Anthropic, forked) | Claude Skill | 15 min | Free | HIGH — enforces ZAO brand identity | P0 |
| **Codebase Memory MCP** (DeusData) | MCP Server | 5 min | Free (MIT) | MEDIUM-HIGH — codebase navigation | P1 |
| **Context7 MCP** (Upstash) | MCP Server | 5 min | Free tier | MEDIUM-HIGH — up-to-date lib docs | P1 |
| **Claude SEO** (AgriciDaniel) | Claude Skill | 10 min | Free (MIT) | MEDIUM — landing page + GEO | P1 |
| **Larry Marketing** (LarryBrain) | OpenClaw Skill | 15 min | Free | LOW — TikTok-focused, not ZAO's channel | P2 |
| **Tavily MCP** | MCP Server | 5 min | Free 1K/mo | LOW — duplicates existing WebSearch | P3 |
| **Mem9** | MCP Server | 30 min | Free tier (TiDB) | LOW — overkill for single agent | P3 |

## Comparison of Options — GitHub Repos Worth Tracking

| Repo | Stars | License | ZAO Relevance | Why |
|------|-------|---------|---------------|-----|
| **gstack** (garrytan) | - | MIT | HIGH | Claude Code as virtual eng team, already referenced in superpowers |
| **claude-squad** (smtg-ai) | - | MIT | MEDIUM | Parallel terminal agents for multi-task dev sessions |
| **Codebase Memory MCP** (DeusData) | - | MIT | MEDIUM-HIGH | Persistent code knowledge graph, 66 languages |
| **Context7** (Upstash) | - | MIT | MEDIUM-HIGH | Live library docs in context |
| **rendergit** (Karpathy) | - | MIT | MEDIUM | Git repo → single file for LLM consumption |
| **CopilotKit** | - | MIT | MEDIUM | Embed AI copilot in React — possible future ZAO feature |
| **Firecrawl** (mendable) | - | MIT | MEDIUM | Website → LLM-ready data for research pipelines |
| **n8n** | - | Fair-code | LOW-MEDIUM | Automation workflows, possible for scheduled publishing |

## What ZAO OS Already Has (No Duplication Needed)

Before installing anything, ZAO OS already has significant tooling:

| Capability | Current Solution | From Tweet List |
|------------|-----------------|-----------------|
| Cross-platform publishing | `src/lib/publish/` — 7 platforms (Farcaster, Bluesky, X, Discord, Telegram, Lens, Hive) | Larry Marketing does TikTok only |
| Research pipeline | `/zao-research` skill + 166 docs + WebSearch/WebFetch | Tavily MCP (marginal improvement) |
| Agent infrastructure | OpenClaw + Paperclip on VPS (Doc 207) | OpenClaw (already deployed) |
| Code quality | `/autoresearch:debug`, `/autoresearch:fix`, `/review` | Superpowers (already installed) |
| Memory | MEMORY.md + `.claude/` + 166 research docs | Mem9 (overkill for now) |
| TDD | `/autoresearch:fix` + `superpowers:test-driven-development` | TDD Guard (redundant) |
| Project management | TaskCreate/TaskUpdate + autoresearch:plan | Task Master AI (different approach) |

## ZAO OS Integration

### Immediate Installs (P0 — Today)

**1. Marketing Skills → `.claude/skills/marketing/`**
```bash
# Clone and copy relevant skills
git clone --depth 1 https://github.com/coreyhaines31/marketingskills /tmp/marketingskills
cp /tmp/marketingskills/skills/product-marketing-context.md .claude/skills/marketing/
cp /tmp/marketingskills/skills/social-content.md .claude/skills/marketing/
cp /tmp/marketingskills/skills/copywriting.md .claude/skills/marketing/
cp /tmp/marketingskills/skills/launch-strategy.md .claude/skills/marketing/
cp /tmp/marketingskills/skills/community.md .claude/skills/marketing/
rm -rf /tmp/marketingskills
```

Customize `product-marketing-context.md` with:
- Product: ZAO OS — gated Farcaster social client for The ZAO music community
- Audience: Independent musicians, web3-native creators, Farcaster power users
- Positioning: The operating system for decentralized artist collectives
- Channels: Farcaster, Bluesky, X (cross-published via `src/lib/publish/`)

**2. Canvas Design → `.claude/skills/canvas-design/`**
```bash
git clone --depth 1 https://github.com/anthropics/skills /tmp/anthropic-skills
cp -r /tmp/anthropic-skills/skills/canvas-design .claude/skills/
rm -rf /tmp/anthropic-skills
```

Use for: governance proposal visuals, build-in-public social cards, fractal meeting announcements, track/album artwork for music player.

**3. Brand Guidelines → `.claude/skills/zao-brand/`**

Fork the Anthropic brand-guidelines skill, replace with:
- Primary: `#f5a623` (gold)
- Background: `#0a1628` (navy)
- Secondary: `#1a2a4a` (lighter navy)
- Text: `#e2e8f0` (slate-200)
- Typography: Match `community.config.ts` font stack
- Logo: ZAO emblem from public assets

### Near-Term Installs (P1 — This Week)

**4. Codebase Memory MCP**
```bash
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash
```

Configure in `.claude/settings.json` under MCP servers. Index the full `src/` directory. Use for:
- Impact analysis before refactoring music player stack (30+ components)
- Dead code detection (continuing the cleanup from commit `3415ad9`)
- Call chain tracing across `PlayerProvider` → `HTMLAudioProvider` → `usePlayerQueue`

**5. Context7 MCP**
```bash
npx ctx7 setup
```

Prevents hallucinated APIs for: Next.js 16.2.0, React 19.2.3, Supabase JS, Wagmi, Viem, iron-session, @tanstack/react-query. Especially valuable since ZAO uses bleeding-edge versions.

**6. Claude SEO**
```bash
git clone --depth 1 https://github.com/AgriciDaniel/claude-seo /tmp/claude-seo
bash /tmp/claude-seo/install.sh
rm -rf /tmp/claude-seo
```

Focus on: `src/app/page.tsx` (landing page), schema.org markup for published music content, AI Overviews optimization for "ZAO music community" queries.

## LarryBrain Deep Dive

**What it is:** An AI agent skill marketplace built for OpenClaw agents. $29.99/month for 30+ skills. Created by Oliver Henry.

**Larry Marketing specifically:** Autonomous TikTok slideshow creation. Researches competitors, generates AI images, posts via Postiz, tracks analytics. Claims 1M+ TikTok views in a week, $1.5K MRR in 3 days.

**Why SKIP for ZAO:**
1. ZAO's audience is on Farcaster/Bluesky/X, not TikTok
2. ZAO already has cross-platform publishing to 7 platforms (`src/lib/publish/`)
3. The $29.99/mo subscription adds cost for marginal value
4. OpenClaw is already deployed on VPS (Doc 207) — can build custom skills instead
5. The "Larry Loop" (analytics → content → post → iterate) is a pattern ZAO can implement natively using existing infrastructure

**What to borrow from Larry's approach:**
- The feedback loop concept: track which cross-posts get most engagement → feed into content strategy
- Slideshow/carousel format: Farcaster and Bluesky both support image carousels — 2.9x more comments than single images (Larry's data)
- Scheduled autonomous posting: Use the existing cron infrastructure (`src/app/api/cron/`) to automate content

## The @zodchiii Thread — Key Takeaways for ZAO

The thread (6.6M views, March 20, 2026) is a curated list of 90 AI tools across 3 categories:

1. **22 Claude Skills** — ZAO should install 6 of these (marketing, canvas, brand, SEO + 2 MCP servers)
2. **3 Must-Have MCPs** — Context7 is the most relevant; Tavily and Task Master are redundant with existing tools
3. **25 Core GitHub Repos** — ZAO already uses the OpenClaw/agent stack; gstack and claude-squad are worth tracking
4. **40 Fresh Repos** — Codebase Memory MCP, rendergit, and CopilotKit are the most relevant

**The meta-insight:** zodchiii's framework of Skills (teach HOW) + MCP (give ACCESS) + Repos (engines) maps perfectly to ZAO's existing architecture:
- Skills = `.claude/skills/` (10 custom skills)
- MCP = not yet configured (opportunity)
- Repos = research library patterns (166 docs)

## Implementation Plan

### Phase 1: Content Creation Pipeline (Today)
1. Install Marketing Skills (product-marketing-context + social-content + copywriting)
2. Install Canvas Design skill
3. Fork Brand Guidelines with ZAO colors
4. Create `/zao-graphics` command that chains brand → canvas → publish

### Phase 2: Developer Experience (This Week)
5. Install Codebase Memory MCP
6. Install Context7 MCP
7. Configure both in `.claude/settings.json`
8. Index codebase and verify knowledge graph

### Phase 3: Growth & SEO (Next Week)
9. Install Claude SEO skill
10. Audit landing page (`src/app/page.tsx`)
11. Add schema.org markup to cross-published content
12. Set up engagement tracking for cross-posts (analytics → content feedback loop)

### Phase 4: Automation (Sprint 2)
13. Build carousel/slideshow generator for Farcaster/Bluesky (inspired by Larry's approach)
14. Add cron job for scheduled content publishing
15. Implement the "feedback loop" — track engagement metrics → auto-adjust content strategy

## Sources

- [zodchiii curated list tweet — 6.6M views](https://x.com/zodchiii/status/2034924354337714642)
- [LarryBrain Skills Marketplace](https://www.larrybrain.com)
- [Corey Haines Marketing Skills](https://github.com/coreyhaines31/marketingskills) — MIT
- [Anthropic Official Skills Repo](https://github.com/anthropics/skills)
- [Canvas Design Skill](https://github.com/anthropics/skills/tree/main/skills/canvas-design)
- [Brand Guidelines Skill](https://github.com/anthropics/skills/tree/main/skills/brand-guidelines)
- [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) — MIT
- [Context7 MCP](https://github.com/upstash/context7) — MIT
- [Claude SEO](https://github.com/AgriciDaniel/claude-seo) — MIT
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) — MIT, free 1,000 credits/mo
- [Mem9](https://github.com/mem9-ai/mem9) — Apache 2.0
- [LarryBrain MRR Data](https://trustmrr.com/startup/larrybrain-openclaw-marketplace)
- [Oliver Henry on Larry results](https://x.com/oliverhenry/status/2030575460464119856)
- [Doc 207 — ZAO VPS Agent Stack](../../events/207-zao-vps-agent-stack-session-log/)
- [Doc 024 — ZAO AI Agent Architecture](../../_archive/024-zao-ai-agent/)
- [Doc 205 — OpenClaw/Paperclip Deployment](../../agents/205-openclaw-paperclip-elizaos-deployment-plan/)
