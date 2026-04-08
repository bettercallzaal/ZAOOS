# 301 - Developer Tooling Roundup: Agent-Era Tools (April 2026)

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Evaluate last30days, Nia Docs, and other developer tools from the post-Karpathy wave for ZAO OS workflow

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **last30days skill** | INSTALL - researches any topic across Reddit, X, YouTube, HN, Polymarket in the last 30 days. Perfect for `/zao-research` enhancement. 10 sources, composite scoring, auto-saves briefings |
| **Nia Docs (AgentSearch)** | USE for external API docs - `npx nia-docs https://docs.neynar.com` gives Claude filesystem access to Neynar docs without manual reading. Zero setup |
| **Oh-My-Mermaid** | INSTALL (covered in Doc 300) - architecture diagrams from codebase |
| **Graphify** | INSTALL (covered in Doc 297) - knowledge graph + wiki |
| **PromptFoo** | INVESTIGATE - eval framework for testing prompts. Could help test ZAO OS AI moderation quality |
| **OpenClaw content engine** | ADAPT the brand-voice skill pattern for ZAO newsletter/socials workflow |
| **AI Employee pattern** | ADAPT the workspace structure for ZOE's daily autonomous tasks |

---

## Comparison of Options

| Tool | What It Does | Install | Free? | ZAO OS Use Case | Priority |
|------|-------------|---------|-------|-----------------|----------|
| **last30days** | Research across 10 platforms in last 30 days | Claude Code plugin | Yes (3 free sources) | Enhance /zao-research with real-time social data | HIGH |
| **Nia Docs** | Docs-as-filesystem for agents | `npx nia-docs URL` | Yes | Read Neynar/Supabase/XMTP docs without manual browsing | HIGH |
| **Oh-My-Mermaid** | Architecture diagrams from code | `npm i -g oh-my-mermaid` | Yes | Document ZAO OS architecture for contributors | MEDIUM |
| **PromptFoo** | Prompt/LLM eval framework | `npm i -g promptfoo` | Yes (OSS) | Test AI moderation prompts, evaluate agent quality | LOW |
| **brain-ingest** | YouTube/audio to structured notes | pip install | Unknown | Transcribe podcast/talks into research docs | LOW |

---

## last30days (mvanhorn/last30days-skill)

### What It Does

Claude Code skill that researches any topic across up to 10 sources from the last 30 days and writes a synthesized briefing with real citations and engagement metrics.

### Sources (10 Platforms)

| Source | Free? | What It Covers |
|--------|-------|----------------|
| Reddit | Yes (public JSON) | Subreddit discussions, community sentiment |
| Hacker News | Yes | Tech discussions, launches |
| Polymarket | Yes | Prediction market odds |
| X/Twitter | Needs ScrapeCreators key | Posts, engagement, handles |
| YouTube | Needs API key | Videos, transcripts |
| TikTok | Needs ScrapeCreators key | Short-form content trends |
| Instagram | Needs ScrapeCreators key | Visual content trends |
| Bluesky | Needs app password | Decentralized social posts |
| Truth Social | Needs key | Political/alt discourse |
| Web (Exa/Brave) | Needs API key | Articles, blogs, news |

3 free sources (Reddit, HN, Polymarket) work with zero config.

### Key Features

- **Composite relevance scoring:** text similarity + engagement velocity + source authority + cross-platform convergence + temporal decay
- **Comparative mode:** "X vs Y" runs 3 parallel research passes, produces side-by-side tables
- **Auto-saves briefings** to `~/Documents/Last30Days/` as markdown
- v2.9.5, 455+ tests

### Install

```bash
/plugin marketplace add mvanhorn/last30days-skill
```

### ZAO OS Use Case

Enhance `/zao-research` skill with real-time social intelligence:
- "What are people saying about Farcaster in the last 30 days?"
- "Farcaster vs Bluesky adoption" (comparative mode)
- "What's trending in web3 music communities?"
- Research for newsletters and social posts

---

## Nia Docs / AgentSearch

### What It Does

Turns any documentation website into a virtual filesystem agents can `grep`, `cat`, and `tree`. One command: `npx nia-docs https://docs.example.com`. No API keys, no install, no config.

### How It Works

```bash
# Search Neynar docs for webhook info
npx nia-docs https://docs.neynar.com -c "grep -rl 'webhook' ."

# Read a specific page
npx nia-docs https://docs.neynar.com -c "cat getting-started.md"

# See full doc structure
npx nia-docs https://docs.neynar.com -c "tree"
```

### Architecture

1. **Index** - crawls doc site, respects llms.txt, detects OpenAPI specs. Each page becomes a file.
2. **Serve** - filesystem operations as API endpoints (read, grep, ls, tree, find). Gzip compressed, cached.
3. **Shell** - client-side just-bash TypeScript implementation. In-memory filesystem. grep over 500 pages completes in milliseconds.

### ZAO OS Use Cases

| Doc Site | Command | Why |
|----------|---------|-----|
| Neynar | `npx nia-docs https://docs.neynar.com` | Farcaster API - check endpoints before coding |
| Supabase | `npx nia-docs https://supabase.com/docs` | Database, RLS, auth reference |
| XMTP | `npx nia-docs https://docs.xmtp.org` | Messaging protocol docs |
| Stream.io | `npx nia-docs https://getstream.io/video/docs` | Spaces/video SDK reference |
| Wagmi | `npx nia-docs https://wagmi.sh` | Wallet integration |
| Next.js | `npx nia-docs https://nextjs.org/docs` | App Router, RSC, API routes |

Instead of manually browsing docs, Claude reads them as a filesystem. Massive token savings vs pasting docs into context.

### Setup for Claude Code

```bash
npx nia-docs setup https://docs.neynar.com | claude
```

This appends a few lines to CLAUDE.md telling Claude how to check the docs when needed.

---

## OpenClaw Content Engine (Corey Ganim Pattern)

### What It Does

One OpenClaw agent ("Claire") running 24/7, connected to Discord, Gmail, Calendar, filesystem. Multiple skills (markdown instruction files) handle the entire content pipeline.

### Skills Architecture

| Skill | What It Does |
|-------|-------------|
| **brand-voice** | Full voice profile - every output sounds like the user |
| **x-article-creation** | End-to-end X article writer (body, intro, headlines, thumbnails) |
| **youtube-video-promotion** | Podcast transcript to tactical promo tweets |
| **tweet-cta** | CTAs that drive waitlist/community signups |
| **last30days** | Research trending topics across platforms |

### Key Patterns Worth Borrowing

1. **Brand Voice Skill** - 5-minute interview, then every output matches your voice. ZAO OS already has newsletter/socials skills but no formal brand voice profile.
2. **Quote Tweet Machine** - Find trending tweets, add tactical value on top. Could automate ZAO's Farcaster engagement.
3. **YouTube-to-X Pipeline** - Every podcast/video becomes social content. Lead with the tactic, not "new episode dropped."
4. **Thumbnail Generation** - HTML files rendered at exact platform dimensions via headless Chrome. We have gstack for this.

### ZAO OS Adaptation

The `/newsletter` and `/socials` skills could benefit from:
- A `brand-voice.md` file in `.claude/skills/` that defines Zaal's voice
- Research phase using last30days before writing content
- Quote-cast pattern for Farcaster engagement

---

## AI Employee Pattern (Khairallah)

### Workspace Structure

```
/ai-employee
+-- /inbox          # New inputs that need processing
+-- /working        # Files currently being processed
+-- /outputs        # Finished deliverables
+-- /context        # Role definition, standards, references
+-- /logs           # Records of what the employee did
+-- /schedule       # Task definitions for recurring work
+-- /archive        # Completed work
```

### Key Insight: Self-Check Loop

Before delivering output, the AI reviews its own work against quality standards. First draft is rough, self-check turns it into polished work. This pattern should be in every ZOE skill.

### ZAO OS Adaptation for ZOE

ZOE on the VPS could use this pattern:
- `/context/` = SOUL.md + AGENTS.md + standards
- `/inbox/` = tasks from Telegram or scheduled triggers
- `/outputs/` = completed work (research, reports, social posts)
- `/logs/` = what ZOE did and when (already have event logging)
- Self-check loop in every skill

---

## 7 Open Source AI Projects (Video Roundup)

From a recent viral video covering tools to improve agent workflows:

| Tool | Stars | License | What It Does | ZAO OS Relevance |
|------|-------|---------|-------------|------------------|
| **Impeccable** | 10,000+ | Unknown | Design skill for AI coding tools. `/polish`, `/typeset`, `/arrange`. Anti-slop. | HIGH - install for UI work |
| **PromptFoo** | 13,200 | MIT | LLM eval framework. Compare models, red-team prompts. Acquired by OpenAI. | MEDIUM - test AI moderation |
| **OpenViking** | 1,000+ | Unknown | ByteDance context database. L0/L1/L2 tiered loading. File system paradigm. | LOW - MemPalace covers this |
| **Agency Agents** | Unknown | Unknown | Pre-built agent templates for every startup role. | LOW - reference for ZOE personas |
| **MiroFish** | 18,000+ | AGPL-3.0 | Swarm intelligence prediction engine. Simulates 1M+ agents. | SKIP - not our use case |
| **NanoChat** | Unknown | Unknown | Karpathy's from-scratch LLM training pipeline ($48 for GPT-2). | SKIP - educational only |
| **Heretic** | Unknown | AGPL v3.0 | Removes LLM safety guardrails. | SKIP - ethical concerns |

**Install Impeccable** - the highest-value addition for ZAO OS frontend work. Created by Paul Bakaus (former Google). Commands like `/polish` and `/arrange` would directly improve component quality.

---

## Nia Docs Pricing & Details

| Tier | Price | Queries/Month | Indexes |
|------|-------|---------------|---------|
| Free | $0 | 50 | 3 lifetime |
| Builder | $15/mo | 1,000 | Unlimited |

Free tier covers ZAO OS needs - 50 queries/month across 3 doc sites (Neynar, Supabase, Next.js). YC S25 company, $6M seed funded.

Claude Code plugin: `/install nia` or `/plugin marketplace add nozomio-labs/nia-plugin`. Requires API key at `~/.config/nia/api_key`.

---

## Sources

- [last30days GitHub](https://github.com/mvanhorn/last30days-skill) - v2.9.5, 455+ tests, 10 platform sources
- [Nia Docs / AgentSearch](https://www.agentsearch.sh/) - docs-as-filesystem, by Nozomio Labs
- [Nia Plugin GitHub](https://github.com/nozomio-labs/nia-plugin) - MIT, Claude Code integration
- [Arlan's article](https://x.com/arlanr/status/2041215978957389908) - docs-as-filesystem, 182K views
- [Corey Ganim's OpenClaw system](https://x.com/coreyganim/status/2039699858760638747) - 21M views/month
- [Khairallah's AI Employee](https://x.com/eng_khairallah1/status/2041442796423590115) - autonomous agent system
- [Impeccable GitHub](https://github.com/pbakaus/impeccable) - 10K+ stars, design skill
- [PromptFoo GitHub](https://github.com/promptfoo/promptfoo) - 13.2K stars, MIT
- [OpenViking GitHub](https://github.com/volcengine/OpenViking) - ByteDance context database
- [Agency Agents GitHub](https://github.com/msitarzewski/agency-agents) - virtual AI agency templates
