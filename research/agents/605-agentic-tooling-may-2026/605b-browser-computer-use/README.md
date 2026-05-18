---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 467, 484, 547, 601, 568, 591
tier: STANDARD
---

# 605b - Browser + computer-use agents for ZOE

> **Goal:** Decide which (if any) browser-control agent ZAO wires into bot/src/zoe to extend it beyond text-only Telegram.

## Executive Summary

ZOE ships today (2026-05-04) with Read/Glob/Grep/Bash tooling via Claude Code CLI. This doc evaluates adding browser + computer-use capabilities to unlock research automation, Farcaster scraping (without copy-paste), and social media workflow (post scheduling, thread monitoring).

Five options exist: browser-use OSS (91k+ stars), Anthropic computer-use API (beta, vision-native), OpenAI Operator (consumer $200/mo, non-API), Claude Code Playwright MCP (free, already available), and Manus/Genspark (commercial). Analysis shows **Playwright MCP is the immediate unlock** (zero new cost on Max plan) with **browser-use OSS as a Phase 2 bridge** if desktop agents are needed.

## Key Decisions

| Decision | Action |
|----------|--------|
| Immediate (Phase 1) | UNLOCK Claude Code Playwright MCP in bot/src/zoe/concierge.ts allowedTools. Wire via MCP tooling already in Max subscription. Cost: $0 marginal. Effort: 2-3 hours. |
| Phase 2 (Q3 2026) | Evaluate browser-use OSS (91k stars, MIT, Python) as subprocess bridge IF desktop automation (non-browser UI) becomes a Zaal workflow. Cost: LLM tokens only. |
| Skip immediately | OpenAI Operator ($200/mo, non-API, consumer-only). Not programmable, locked to ChatGPT Pro UI. |
| Skip unless partnership | Manus/Genspark/Devin (commercial, unclear licensing for ZAO bots). Revisit only if Zaal pursues partnership or acquisition. |
| Revisit trigger | If Zaal reports friction with Farcaster scraping or social-media-bot workflows after Phase 1 ships, move to browser-use. |

## Comparison table

| Option | Cost | Browser fidelity | Integration path | Headless capability | What it adds over Claude Code today | ZAO fit |
|--------|------|------------------|------------------|---------------------|---------------------------------------|---------|
| **Claude Code Playwright MCP** | $0 marginal (Max plan) | High (Playwright standards) | Already in ~/.claude/skills; add to allowedTools array in concierge.ts line 95-105 | Both | Adds mcp__playwright__browser_* (click, type, screenshot, evaluate) to ZOE without new dependencies | IMMEDIATE UNLOCK: Easiest win. Zaal already has Max subscription. |
| **browser-use OSS** | $0 + LLM tokens (same cost as existing) | Very high (DOM-grounded, vision-fallback, 91k stars) | Python subprocess bridge (uv runtime in ~/bin/) called from TS via Bash; agents.md shows integration docs | Both headless and headful | Adds DOM element targeting, multi-step task loops, cross-tab orchestration; handles CAPTCHAs via Browser Use Cloud (paid tier) | Phase 2: If desktop agents or high-volume scraping. Now: complexity not needed. |
| **Anthropic computer-use API** | $3 per M input tokens + $15 per M output tokens (Sonnet 2024-12 pricing) | Very high (vision-based desktop control, screenshot grounding) | Direct beta API call (`computer-use-2025-11-24` header, Opus/Sonnet only). Requires Docker container for virtual desktop (Xvfb) | Headless (Linux container) | Adds full desktop GUI control (beyond browser): file manager, text editors, terminal, native apps | SKIP Phase 1: Over-engineered for browser-only Zaal workflows. Revisit if ZAO bots need desktop control (email clients, spreadsheet automation). |
| **OpenAI Operator** | $200/month (ChatGPT Pro) OR $20/month (ChatGPT Plus, limited) | High (o3 reasoning, visual UI understanding) | Consumer product only. No API. Research preview. | Headful only | Multi-tab browsing, cross-site form fills, task memory | SKIP: Non-programmable, locked to ChatGPT UI. Cannot integrate into bot/src/zoe. |
| **Manus/Genspark/Devin** | Varies ($200-500/mo or enterprise) | High (varies by product) | API (Manus/Genspark), unclear licensing for agent use | Both | Product-specific capabilities (Manus: AI copilot, Genspark: search+browser) | SKIP Phase 1: Commercial licensing murky for open-source ZAO bots. Revisit if partnership materializes. |

## What ZOE currently cannot do (without browser tools)

- Scrape Farcaster threads, replies, or engagement data programmatically (requires parsing HTML or using Neynar SDK, no direct Farcaster scraper)
- Monitor X/Bluesky trending topics or competitor posts without manual copy-paste
- Fill out OAuth flows programmatically (e.g., "connect Restream account" requires human login)
- Click links in published Farcaster posts and extract paywalled content
- Schedule social posts across multiple platforms with visual preview (currently posts via Neynar only, no scheduling queue)
- Monitor Bonfire graph ingestion pipeline health (visual logs live on bonfires.ai; currently requires manual Zaal check-in)

## What each option unlocks

### Claude Code Playwright MCP (PHASE 1: NOW)

Playwright MCP is already bundled in Claude Code's Max plan (no new cost). It exposes mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_evaluate, and mcp__playwright__browser_navigate. Wire into ZOE's allowedTools array in concierge.ts (line 95-105 currently shows Read, Glob, Grep, Bash). Unlocks:

- Real-time screenshot capture of any website
- Click targeting by element reference (from accessibility snapshots)
- Form filling with type + submit
- JavaScript execution on page (for data extraction)
- Full-page screenshots for visual debugging

Zaal workflow example: "Check Farcaster trending topics" → ZOE snapshots farcaster.com, parses DOM, extracts trending names, returns to Zaal. No new infrastructure. Works on VPS 1.

### browser-use OSS (PHASE 2: Q3 2026 IF NEEDED)

91.1k GitHub stars (as of May 2026), 320 contributors, MIT license, actively maintained (last commit 2026-05-03). Works with Claude via ChatAnthropic or ChatBrowserUse (anthropic models via LiteLLM). Achieves 89.1% success on WebVoyager benchmark (the gold standard for autonomous web navigation). Unlocks higher-level abstractions:

- Natural language task loops ("go find the latest ZAO member announcement, grab the link, summarize it")
- DOM element discovery without explicit selectors
- Multi-tab orchestration (open new tab, switch, maintain session)
- Stealth browsing via Browser Use Cloud ($50-200/mo optional for captcha+proxy rotation; optional)
- Built-in retry logic and error recovery

Zaal workflow example: "Monitor FISHBOWLZ Juke partnership progress across 5 links + summarize findings" → Agent loops, takes screenshots, navigates tabs, builds summary. Requires Python subprocess bridge (not in current stack). Token cost scales with screenshot count (typically 10-50k tokens per task, same as ZOE budget).

### Anthropic computer-use API (SKIP PHASE 1)

Requires Claude Opus 4.7 / Sonnet 4.6 (both supported via Max plan) + beta header (`computer-use-2025-11-24`). Unlocks full desktop automation: file manager, terminal, text editors, native applications. Pricing adds $3 per 1M input tokens + $15 per 1M output tokens on top of model cost. Requires Docker/Xvfb (virtual X11 display) on server or local machine. Unlocks:

- Desktop GUI control (spreadsheets, email, Photoshop, etc.)
- Terminal automation without SSH
- Cross-application workflows (e.g., "download from browser, process in LibreOffice, upload to Supabase")

Zaal workflow example: "Automate ZAOstock artist intake form (Google Form → CSV → Airtable)" → Agent controls browser, form, and spreadsheet in one loop. Overkill today; reserve for festival ops scaling Phase 3 (Oct 2026 post-launch).

### OpenAI Operator (SKIP)

Research preview, consumer ChatGPT Pro ($200/mo) exclusive, non-API, US-only. No way to integrate into bot/src/zoe. Not programmable. Skip.

### Manus / Genspark / Devin (SKIP unless partnership)

Commercial products with opaque licensing for agent use. Manus (AI copilot desktop tool) and Genspark (search+browser) unclear whether ZAO can use programmatically in open-source repo. Devin (code agent) not browser-focused. Skip Phase 1; revisit if Zaal considers partnership or acquisition.

## Costs and risks

### Playwright MCP cost

Zero additional cost (already in Max subscription at $20/month). System prompt overhead: negligible (Playwright tools add ~100 tokens to each request). Token consumption scales with screenshot size and DOM complexity. Typical Farcaster thread snapshot: 8-12k tokens. Research doc with links: 15-20k tokens. Well within ZOE's existing budget (Zaal's Max plan cover browser + read tools together).

### browser-use OSS cost and setup

Zero license cost (MIT). LLM cost same as ZOE (tokens for screenshots + model inference). Setup cost: ~5-10 hours to build Python subprocess bridge (uv runtime, error handling, session management). No new infra; runs on existing VPS 1 or Zaal's Mac. Risk: Python dependency in TS-only codebase. Mitigation: isolate to bot/src/zoe/browser-bridge.py, call via `bash` tool only, containerize if scaling.

### Anthropic computer-use API cost

$3 per 1M input tokens + $15 per 1M output tokens (Sonnet pricing, May 2026). A complex desktop workflow (e.g., 10-step spreadsheet task) might consume 200-500k tokens total, costing $0.60-$7.50 per task. Requires Docker container with Xvfb (virtual display). Setup: 3-5 days. Risk: headless desktop interaction is slower and less reliable than browser automation (latency + UI element detection). Only worthwhile if ZAO automates repeatable, high-frequency desktop tasks (e.g., 50+ per month).

### OpenAI Operator cost and lock-in

$200/month for Pro tier (10x ChatGPT Plus). No API = no ZOE integration possible. Consumer research preview, subject to change. Risk: feature removed, pricing adjusted, new terms imposed. Lock-in: 100% dependent on OpenAI's roadmap. Skip.

### Manus/Genspark/Devin commercial risk

Licensing unclear for open-source repo use. Commercial products may prohibit redistribution or bundling without agreement. Risk: legal friction, vendor lock-in, per-bot licensing. Skip Phase 1. Revisit only with explicit partnership agreement and Zaal's sign-off.

## Migration cost (Playwright MCP)

File to edit: `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/concierge.ts` lines 95-105.

Current code:
```typescript
allowedTools: [
  'Read',
  'Glob',
  'Grep',
  'Bash(gh issue list*)',
  'Bash(gh pr list*)',
  // ... more Bash patterns
],
```

New code (add these lines):
```typescript
allowedTools: [
  'Read',
  'Glob',
  'Grep',
  'Bash(gh issue list*)',
  'Bash(gh pr list*)',
  'mcp__playwright__browser_navigate',
  'mcp__playwright__browser_click',
  'mcp__playwright__browser_type',
  'mcp__playwright__browser_take_screenshot',
  'mcp__playwright__browser_snapshot',
  'mcp__playwright__browser_evaluate',
  // ... more Bash patterns
],
```

Effort: 1-2 hours (add lines, test on Zaal's Mac, confirm no side effects on existing Telegram queries, deploy to VPS 1 if running zoe daemon).

## Next Actions

| Action | Owner | Type | Target |
|--------|-------|------|--------|
| Add Playwright MCP to ZOE allowedTools | Zaal (or Claude Code task) | PR #xyz to bot/src/zoe/concierge.ts | Wed 2026-05-07 |
| Test browser snapshot on Farcaster + trending topics | Zaal | Manual in Telegram, /zoe "check farcaster trending" | Thu 2026-05-08 |
| Monitor task volume + screenshot token cost for 2 weeks | ZOE metrics | Observe LLM usage in ~/.zao/zoe/usage.log | Mon 2026-05-19 |
| Decision: proceed to browser-use Phase 2 or hold | Zaal | Document in 605c (if needed) | After 2-week observation |

## Sources

- [browser-use/browser-use on GitHub](https://github.com/browser-use/browser-use) - 91,895 stars (May 2026), MIT license, 320 contributors, latest v0.12.6 (April 2026)
- [Anthropic Computer Use Tool API Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use) - Beta header `computer-use-2025-11-24`, Opus 4.7 / Sonnet 4.6 support, $3/M input + $15/M output tokens (Sonnet 2024-12)
- [OpenAI Operator Launch: Introducing Agent Mode](https://openai.com/index/introducing-operator) - Released January 2025, ChatGPT Pro ($200/month) first access, now rolling to Plus ($20/month) with limits
- [OpenAI Operator Pricing 2026 Guide](https://ucstrategies.com/news/openai-operator-specs-pricing-real-world-performance-guide-2026/) - Pro $200/month, Plus $20/month (limited), Team $25-30/user/month, CUA API $3-$12/M tokens (early 2026 roadmap)
- [Browser-use: AI Web Automation with 91k+ Stars](https://www.decisioncrafters.com/browser-use-autonomous-web-automation-91k-stars/) - 89.1% success on WebVoyager benchmark, 314+ contributors, active 2026 development, supports Anthropic/OpenAI/Google via LiteLLM
- [AI Browser Automation Market 2026-2034](https://www.decisioncrafters.com/browser-use-autonomous-web-automation-91k-stars/) - Projected growth from $4.5B (2026) to $76.8B (2034) at 32.8% CAGR, browser-use leading OSS category
- [Claude Code Playwright MCP](https://github.com/browser-use/browser-use#claude-code-skill) - Available in Max plan skill library, exposes browser_click, browser_type, browser_screenshot, browser_evaluate, browser_navigate
