# 239 — Agent Frameworks & Infrastructure Evaluation for ZAO OS

> **Status:** Updated with live GitHub data
> **Date:** April 1, 2026 (v2 — refreshed star counts + revised verdicts)
> **Goal:** Evaluate 16 agent frameworks, security tools, search/data tools, and workflow automation for ZAO OS adoption
> **Context:** ZAO OS runs OpenClaw (ZOE agent) on a Hostinger VPS, uses gstack skills locally, and is operated by a 1-person team.

---

## Live GitHub Data (Fetched April 1, 2026)

| # | Tool | Stars | License | Last Updated |
|---|------|------:|---------|--------------|
| 1 | OpenClaw | 344,026 | MIT | Apr 1 2026 |
| 2 | n8n | 181,980 | Fair-code | Apr 1 2026 |
| 3 | Firecrawl | 102,247 | AGPL-3.0 | Apr 1 2026 |
| 4 | gstack | 60,307 | MIT | Apr 1 2026 |
| 5 | deer-flow (ByteDance) | 55,776 | MIT | Apr 1 2026 |
| 6 | Task Master AI | 26,343 | Proprietary | Apr 1 2026 |
| 7 | GPT Researcher | 26,167 | Apache-2.0 | Apr 1 2026 |
| 8 | promptfoo | 18,981 | MIT | Apr 1 2026 |
| 9 | elizaOS/eliza | 18,007 | MIT | Apr 1 2026 |
| 10 | claude-code-security-review | 4,101 | MIT | Apr 1 2026 |
| 11 | container-use (Dagger) | 3,695 | Apache-2.0 | Apr 1 2026 |
| 12 | CK (BeaconBay) | 1,542 | Apache-2.0 | Mar 31 2026 |
| 13 | Ghost OS | 1,271 | MIT | Apr 1 2026 |
| 14 | cmux | 471 | MIT | Apr 1 2026 |
| 15 | agent-governance-toolkit (MS) | 352 | MIT | Apr 1 2026 |
| 16 | figaro | 117 | MIT | Mar 31 2026 |
| 17 | Agent Alchemy | 31 | MIT | Mar 31 2026 |

---

## Recommendations Summary

| # | Tool | Verdict | Priority | Why |
|---|------|---------|----------|-----|
| 1 | OpenClaw | **USE** | P0 | Already deployed. 344K stars, fastest-growing OSS ever. ZOE lives here. |
| 2 | gstack | **USE** | P0 | Already installed. 60K stars. /qa, /ship, /review are daily drivers. |
| 3 | claude-code-security-review | **USE** | P1 | Free GitHub Action. Every PR gets Claude security scan. 5 min setup. |
| 4 | n8n | **USE** | P1 | Deploy on VPS. Automate ZOE triggers, cross-posting, fractal reminders. |
| 5 | container-use (Dagger) | **USE** | P2 | Sandbox ZOE's code execution. Prevents rogue agent actions on VPS. |
| 6 | promptfoo | **WATCH** | P2 | Red-team ZOE before exposing to community. Overkill now, critical at scale. |
| 7 | Firecrawl | **WATCH** | P2 | Good for bulk web scraping. ZAO has Tavily + WebSearch already. |
| 8 | CK (BeaconBay) | **WATCH** | P3 | Semantic code search. grep works at current scale. |
| 9 | Task Master AI | **SKIP** | -- | Redundant with gstack + superpowers:writing-plans + autoresearch. |
| 10 | deer-flow (ByteDance) | **SKIP** | -- | Python research agent. /zao-research + /autoresearch does this natively. |
| 11 | GPT Researcher | **SKIP** | -- | Same as deer-flow. Existing research workflows are purpose-built. |
| 12 | cmux | **SKIP** | -- | superpowers:dispatching-parallel-agents is the native approach. |
| 13 | figaro | **SKIP** | -- | Fleet orchestration. ZAO needs 1 agent, not a fleet. 117 stars. |
| 14 | Agent Alchemy | **SKIP** | -- | 31 stars. gstack is 2000x more adopted and already installed. |
| 15 | Ghost OS | **SKIP** | -- | AI controlling Mac apps. Irrelevant to a web platform. |
| 16 | agent-governance-toolkit (MS) | **SKIP** | -- | Enterprise multi-agent governance. ZAO has 1 agent. |

---

## Detailed Evaluations

### TIER 1: Already Using -- Keep Investing

#### 1. OpenClaw (344,026 stars, MIT)
**What it does:** Config-first agent framework. Write a SOUL.md, connect channels (Telegram, Discord, WhatsApp, 25+ more), plug in MCP servers, agent is live. No Python, no LangChain graphs.

**ZAO status:** ZOE agent deployed on Hostinger VPS (31.97.148.88). Running v2026.3.27. Needs SOUL.md, Telegram bot, and knowledge base loading (see doc 204).

**Why it matters:** 344K stars in ~60 days -- fastest-growing OSS project ever. Massive ecosystem: 162 agent templates, NemoClaw (Nvidia enterprise security), 25+ channel integrations. Config-first means Zaal iterates on ZOE's personality without writing framework code.

**Next steps:** Complete Phase 1-3 setup in doc 204. Priority: SOUL.md + Telegram + Supabase MCP.

#### 2. gstack (60,307 stars, MIT)
**What it does:** Garry Tan's opinionated Claude Code skill suite. 23 tools acting as CEO, Designer, Eng Manager, QA, Release Manager, and Doc Engineer.

**ZAO status:** Fully installed at `~/.claude/skills/gstack/`. Daily-use skills: /qa, /ship, /review, /design-review, /investigate, /plan-ceo-review.

**Why it matters:** Turns a 1-person team into a 6-person team output. 60K stars, 7.9K forks in 3 weeks. Already deeply integrated with ZAO's superpowers skill layer.

**Next steps:** Keep updated via /gstack-upgrade. No action needed.

---

### TIER 2: Should Adopt Soon

#### 3. claude-code-security-review by Anthropic (4,101 stars, MIT)
**What it does:** GitHub Action that runs Claude on every PR to find security vulnerabilities. Analyzes diffs for secrets, injection, auth bypass, etc.

**Why USE:** ZAO handles auth tokens, Supabase service keys, wallet operations, and user data. A free automated security reviewer on every PR is essential for a solo dev who cannot self-review blind spots. 5 minutes to add to `.github/workflows/`.

**Cost:** Free (GitHub Actions minutes).

**Next steps:** Add GitHub Action to ZAO OS repo. Combine with /autoresearch:security for deeper audits.

#### 4. n8n (181,980 stars, Fair-code)
**What it does:** Visual workflow automation with 400+ integrations and native AI nodes. Self-hostable. Open-source Zapier with LLM support.

**Why USE (revised from previous WATCH):** At 182K stars and with Docker support, n8n fills a real gap in ZAO's stack -- the automation glue between systems:
- Supabase row insert -> trigger ZOE response in Telegram
- New governance proposal -> cross-post to Farcaster/X/Bluesky (replacing custom `src/lib/publish/` code)
- Music submission -> moderation pipeline -> notification
- Fractal process reminders (Monday 6pm EST)

**Cost:** Free self-hosted. Fair-code license is fine for internal single-instance use.

**Concern:** Fair-code license prohibits redistribution as SaaS. Fine for internal ZAO use.

**Next steps:** Docker-compose on VPS alongside OpenClaw. Start with one workflow: fractal reminder automation.

#### 5. container-use by Dagger (3,695 stars, Apache-2.0)
**What it does:** Containerized dev environments for coding agents. Each agent gets an isolated container with its own filesystem, tools, and network.

**Why USE (revised from previous SKIP):** ZOE runs on the same VPS as the OpenClaw gateway. Standard OpenClaw Docker provides process isolation, but container-use provides stronger sandboxing for ZOE's code execution -- separate filesystem, network controls, resource limits. Prevents a rogue agent action from corrupting the workspace or leaking data.

**Cost:** Free. Needs Docker (already installed on VPS).

**Next steps:** Evaluate after ZOE is fully configured (post doc 204 completion).

---

### TIER 3: Watch List

#### 6. promptfoo (18,981 stars, MIT)
**What it does:** Automated testing and red-teaming for AI models. Define test cases, run against prompts/agents, get pass/fail. Covers jailbreaks, prompt injection, data leakage, bias. Used by OpenAI and Anthropic themselves.

**Why WATCH:** ZOE is not yet community-facing. Once ZOE talks to members via Telegram/Discord, prompt injection becomes a real risk. promptfoo tests "can someone trick ZOE into revealing Supabase keys?" before going live.

**When to USE:** When ZOE's Telegram bot goes public to community members.

#### 7. Firecrawl (102,247 stars, AGPL-3.0)
**What it does:** Turn any website into clean, LLM-ready markdown. Handles JS rendering, pagination, sitemaps.

**Why WATCH:** ZAO has Tavily + WebSearch + Jina Reader (doc 235). Firecrawl is better for bulk scraping (e.g., "scrape every track on this Bandcamp page"). AGPL license is viral -- modifications must be open-sourced.

**When to USE:** If ZOE needs structured data from music platforms at scale.

#### 8. CK by BeaconBay (1,542 stars, Apache-2.0)
**What it does:** Semantic code search. Search codebase by meaning, not keywords. Local-first, uses embeddings.

**Why WATCH:** Claude's 1M context + grep + 164 research docs handles current scale. Revisit if codebase grows past ~100K LOC.

---

### TIER 4: Skip

#### 9. Task Master AI (26,343 stars)
PRD-to-task pipeline for AI coding agents. **Skip:** gstack /plan-ceo-review + /plan-eng-review + superpowers:writing-plans + /autoresearch already do this. Adding another task system creates confusion.

#### 10. deer-flow by ByteDance (55,776 stars, MIT)
Python research agent with sub-agents and sandboxes. 55K stars is impressive. **Skip:** /zao-research + /autoresearch + 164 research docs is a purpose-built research system already tuned to ZAO's format.

#### 11. GPT Researcher (26,167 stars, Apache-2.0)
Autonomous research agent producing compiled reports. **Skip:** Same reason as deer-flow.

#### 12. cmux (471 stars, MIT)
tmux multiplexer for Claude Code. **Skip:** superpowers:dispatching-parallel-agents does this natively.

#### 13. figaro (117 stars, MIT)
Fleet orchestration for Claude agents across containers, VMs, devices. **Skip:** ZAO needs 1 agent (ZOE), not a fleet. 117 stars = very early.

#### 14. Agent Alchemy (31 stars, MIT)
Plugin collection for Claude Code. **Skip:** 31 stars, early. gstack (60K stars) is the same concept but vastly more mature.

#### 15. Ghost OS (1,271 stars, MIT)
AI agents controlling native Mac apps (Finder, Safari, Calendar). **Skip:** ZAO is a web platform. Native Mac control is irrelevant.

#### 16. agent-governance-toolkit by Microsoft (352 stars, MIT)
Zero-trust identity, execution sandboxing, policy enforcement. OWASP Agentic Top 10. **Skip:** Enterprise multi-agent governance at wrong scale for ZAO. /autoresearch:security handles audits.

---

## Priority Action Plan

### This Week (P0)
- [x] OpenClaw -- already deployed, continue doc 204 setup
- [x] gstack -- already installed, keep using

### This Month (P1)
- [ ] **claude-code-security-review** -- Add GitHub Action to ZAO OS repo (5 min)
- [ ] **n8n** -- Docker-compose on VPS, build first workflow (fractal reminder)

### Next Quarter (P2)
- [ ] **container-use** -- Sandbox ZOE after full configuration
- [ ] **promptfoo** -- Red-team ZOE before opening Telegram bot to community

### Revisit Later (P3)
- [ ] **Firecrawl** -- If ZOE needs bulk music platform scraping
- [ ] **CK** -- If codebase grows past 100K LOC

---

## Key Insight

ZAO's existing stack (OpenClaw + gstack + Claude Code skills + superpowers) covers ~80% of what these 16 tools offer. The real gaps are:

1. **Automated PR security** -- claude-code-security-review fills this (P1)
2. **Workflow automation glue** -- n8n fills this (P1)
3. **Agent sandboxing** -- container-use fills this (P2)
4. **Agent prompt security testing** -- promptfoo fills this when ZOE goes public (P2)

Everything else is either redundant with existing tools or solving problems ZAO does not yet have.

---

## Changes from v1 (Previous Evaluation)

| Tool | Old Verdict | New Verdict | Why Changed |
|------|------------|-------------|-------------|
| gstack | USE (3.2K stars) | USE (60,307 stars) | Star count was stale; 19x growth confirms it |
| n8n | WATCH (68K stars) | USE (181,980 stars) | 2.7x growth + AI nodes make it the right glue layer |
| container-use | SKIP | USE (P2) | Stronger sandboxing than basic Docker for agent code execution |
| Firecrawl | SKIP | WATCH | 102K stars, massive adoption; keep on radar for music scraping |
| deer-flow | WATCH (4.1K) | SKIP (55,776) | Grew 14x but still Python-based; ZAO's research is JS-native |
| claude-code-security-review | USE (1.2K) | USE (4,101) | 3.4x growth validates the approach |

## Sources

- [OpenClaw GitHub](https://github.com/openclaw/openclaw) -- 344K stars
- [gstack GitHub](https://github.com/garrytan/gstack) -- 60K stars
- [claude-code-security-review GitHub](https://github.com/anthropics/claude-code-security-review) -- 4.1K stars
- [n8n GitHub](https://github.com/n8n-io/n8n) -- 182K stars
- [container-use GitHub](https://github.com/dagger/container-use) -- 3.7K stars
- [promptfoo GitHub](https://github.com/promptfoo/promptfoo) -- 19K stars
- [Firecrawl GitHub](https://github.com/mendableai/firecrawl) -- 102K stars
- [deer-flow GitHub](https://github.com/bytedance/deer-flow) -- 55.8K stars
- [Task Master AI GitHub](https://github.com/eyaltoledano/claude-task-master) -- 26.3K stars
- [GPT Researcher GitHub](https://github.com/assafelovic/gpt-researcher) -- 26.2K stars
- [CK GitHub](https://github.com/BeaconBay/ck) -- 1.5K stars
- [Ghost OS GitHub](https://github.com/ghostwright/ghost-os) -- 1.3K stars
- [cmux GitHub](https://github.com/craigsc/cmux) -- 471 stars
- [agent-governance-toolkit GitHub](https://github.com/microsoft/agent-governance-toolkit) -- 352 stars
- [figaro GitHub](https://github.com/byt3bl33d3r/figaro) -- 117 stars
- [Agent Alchemy GitHub](https://github.com/sequenzia/agent-alchemy) -- 31 stars
- [Doc 204 -- OpenClaw Setup Runbook](../../_archive/204-openclaw-setup-runbook/)
- [Doc 234 -- OpenClaw Comprehensive Guide](../../agents/234-openclaw-comprehensive-guide/)
- [Doc 235 -- Free Web Search MCP Alternatives](../../agents/235-free-web-search-mcp-alternatives/)
- [Doc 238 -- Claude Tools Top 50 Evaluation](../../dev-workflows/238-claude-tools-top50-evaluation/)
