# 254 — ZOE Agent Ecosystem Status (Apr 3 2026)

**Category:** AI/Agents
**Status:** Living document
> **Date:** 2026-04-03
**Source:** VPS workspace dump + Telegram conversation logs

---

## Overview

Complete snapshot of ZOE's agent ecosystem as of April 3, 2026. Includes ZOE (orchestration), ZOEY (action agent), FISHBOWLZ spec, and the Farcaster Agentic Bootcamp framework.

---

## Agent Architecture

### ZOE — Orchestration Layer
- **Role:** Plans, coordinates, manages workspace, communicates with Zaal
- **Location:** VPS (Hostinger KVM 2, 31.97.148.88), Docker container
- **Stack:** OpenClaw + Minimax M2.7 + DuckDuckGo MCP + Jina Reader MCP
- **Identity:** SOUL.md — "You're not a chatbot. You're becoming someone."
- **Primary mission:** Best agent curator + creator for ZAO ecosystem
- **Crons:** 6am EST (Farcaster Scanner), 8am/8pm EST (Community Voice)

### ZOEY — Action Agent
- **Role:** Front-facing, goes out and does things, represents ZAO externally
- **Reports to:** ZOE
- **Identity:** "ZOEY does. While ZOE plans, ZOEY executes."
- **Workspace:** `zoey/` with tasks/, results/, SOUL.md, AGENTS.md
- **Delegation protocol:** ZOE writes tasks → ZOEY executes → writes results → ZOE reports to Zaal
- **Completed tasks:** publish.new research (detailed x402 marketplace findings)
- **Pending tasks:** poker arena, agent monitoring, FISHBOWLZ research

### Communication Protocol (ZOE ↔ ZOEY)
1. ZOE writes task to `zoey/tasks/YYYY-MM-DD-taskname.md`
2. ZOE spawns ZOEY via `sessions_spawn`
3. ZOEY reads task, executes, writes to `zoey/results/YYYY-MM-DD.md`
4. ZOEY messages ZOE via `sessions_send`
5. ZOE synthesizes + delivers to Zaal

---

## Agent Curator Mission

ZOE's expanded role (as of Apr 3):
1. Build and refine agents for ZAO (ZOEY, FISHBOWLZ, and more)
2. Help ZAO members build their own agents
3. Document agent patterns and best practices
4. Monitor the agent ecosystem

### Agent Taxonomy (ZOE's Framework)
- **Orchestration agents** — coordinate, plan, don't execute externally (ZOE)
- **Action agents** — go out, do things, represent ZAO (ZOEY)
- **Research agents** — gather, synthesize, report
- **Community agents** — engage, monitor, support members
- **Commerce agents** — transact, monetize, handle payments

---

## Farcaster Agentic Bootcamp (Mar 30 — Apr 10, 2026)

Source: https://luma.com/f7ok6tbp

### Completed Sessions
| Date | Topic | ZAO Relevance |
|------|-------|---------------|
| Mar 30 | Farcaster Building Blocks | Foundation — hubs, clients, miniapps |
| Mar 31 | Miniapps 101 | Direct — ZAO OS miniapp viewer |
| Apr 1 | Agents 101 | Core — event-driven agent patterns |
| Apr 2 | Memory, Context & Reasoning | Core — stateful agents (ZOE already does this) |
| Apr 3 | Agent Identity & Auth (ERC-8004) | High — agent registration, signing |

### Upcoming Sessions
| Date | Topic | ZAO Relevance |
|------|-------|---------------|
| Apr 6 | Give Your Agent a Wallet | High — economic agents |
| Apr 7 | Embedded Capital & Agentic Commerce | **CRITICAL** — x402, publish.new, agent monetization |
| Apr 8 | Going Viral on Farcaster | Medium — distribution for agent apps |
| Apr 9 | Miniapp Notifications & Sharable Moments | Medium — retention design |
| Apr 10 | Multi-Agent Systems & Open Coordination | **CRITICAL** — exactly what ZOE/ZOEY/FISHBOWLZ is |

---

## FISHBOWLZ — Persistent Audio Spaces Miniapp

**Concept:** Rotating fishbowl audio format. Small group discusses, larger group listens, host can leave and come back next day. Full transcripts. Agents can join via skill.

**MVP Scope:**
- Create room → join as listener/speaker → rotate in/out → full transcript
- All actions logged as JSONL (append-only, tokenomics-ready)
- Agent skill: `fishbowlz.join()`
- Cross-platform pull (Farcaster spaces first, then X Spaces via yt-dlp)

**Architecture decision:** Separate repo under ZAOOS folder, own agent (FISHBOWLZ agent)

**X Spaces integration:** yt-dlp extracts live audio (no API needed, free), Whisper transcribes locally. One-way capture — can't inject audio back into X.

**Link format:** farcaster.xyz (confirmed working, not warpcast.com)

---

## publish.new Research (ZOEY's Findings)

x402-based marketplace for agent commerce. Key findings:
- **CLI:** `publish new --price=X --author=WALLET --file=PATH --title=NAME`
- **HTTP API:** `POST https://publish.new/api/artifact/upload`
- **Payment:** USDC on Base mainnet, atomic settlement
- **OpenClaw skill exists** in their GitHub (not yet installed)
- **Recommended first product:** ZAO OS Onboarding Pack ($5-10 USDC)
- **Needs:** Base mainnet wallet with USDC receiving address

---

## Current VPS State

### Container
- OpenClaw gateway: healthy, up, ports locked to 127.0.0.1
- Security: UFW active, SSH root disabled, swap 4GB

### Workspace Files
| File | Status | Purpose |
|------|--------|---------|
| SOUL.md | Active | ZOE identity + ZOE↔ZOEY protocol |
| AGENTS.md | Active | Session protocol, memory, heartbeat guide |
| HEARTBEAT.md | Active | 60m checks, cron schedule |
| TASKS.md | Active | Work queue (ZOEY creation + FISHBOWLZ MVP) |
| MEMORY.md | Active | Tools, research refs, patterns, agent strategy |
| BOOTSTRAP.md | Present | Initial setup (should be cleaned up) |
| IDENTITY.md | Present | Identity backup |
| TOOLS.md | Present | Tool configuration notes |
| USER.md | Present | Zaal's profile for ZOE |

### Tools
- uvx: v0.11.3 (reinstalled today after container rebuild)
- gh CLI: v2.89.0 (reinstalled + re-authenticated today)
- MCP: DuckDuckGo + Jina Reader (working again after uvx reinstall)

### Known Issues
- Container rebuild loses gh/uvx — need reinstall each time
- `gh` config dir needed root fix for permissions
- Repo path is `ZAOOS` not `zaoos` (case-sensitive)

---

## Farcaster Scanner Findings (Apr 3)

### Trending
- @nomadicframe: Faces Friday (294 likes) — art community engagement
- @crenelxyz: Cross-posting tool for FC/X/Bluesky/Mastodon (170 likes) — potential integration
- Degen Season 19 airdrop — 150k free tokens

### ZAO Member Activity
- @zaal: Mentioned re: Neynar client builds, hosting Spaces, distributed raffle winnings
- @degentokenbase.eth: Degen airdrop promotion
- @alanrules: Won 1000 $DEGEN on kramerapp

### Opportunities
- Crenel.xyz cross-posting tool — potential partnership
- BETR contracts first mint via bpdotfun — early signal
- @yerbearserker interested in client builds using Neynar

---

## ZAO Member Agents Tracking

Currently empty — ZOEY tasked with monitoring. Template ready in `memory/zao-member-agents.md`.

---

## Content Options Generated (Apr 3)
- A) Community: ZOE played poker, won first match (+15 Elo, 18 USDC)
- B) Product: Q1 2026 Big Wins doc dropped
- C) Technical: /ecosystem page got persistent tab memory

---

## AgentMail
- Available: free tier 3 inboxes, 3000 emails/month
- Install: `npx clawhub@latest install agentmail`
- Sign up at agentmail.to → API key → add to openclaw.json
- Not yet installed or configured
