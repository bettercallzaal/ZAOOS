# 326 -- Farcaster Agentic Bootcamp: Complete Session Guide & ZABAL Agent Swarm Extraction

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Consolidated inventory of all 10 bootcamp sessions, identify what's covered in existing docs, what's missing, and extract every technique applicable to the ZABAL agent swarm (doc 325)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Coverage status** | ALL 10 sessions are documented across docs 240, 278, 291, 316, 317, 318. No missing sessions. Doc 317 is the deepest (full transcripts for sessions 1-6), doc 316 covers sessions 6-9 with transcripts, doc 318 covers session 10 |
| **Best repo to fork** | USE `0xKoda/agent-template` -- Cloudflare Workers serverless agent with Farcaster/Neynar integration, cron scheduling, 2-tier memory, OpenRouter LLM, character.json persona. OR use `davidfurlong/farcaster-bot-template` for simpler Next.js + Neynar webhook pattern |
| **For ZABAL agents specifically** | USE the Vercel cron + Privy wallet pattern from Session 6 (doc 317). Each agent = 2 API routes. Fork the bootcamp pattern, add 0x Swap API for trading, add x402 for content commerce |
| **SIWA for agent auth** | USE `@buildersgarden/siwa` (Sign In With Agent) from Session 9 -- enables ZOE/HERALD/FLIPPER to authenticate with each other cryptographically when buying content via x402 |
| **x402 reverse proxy** | USE `builders-garden/servex-rs` -- Rust reverse proxy that turns any backend into a paid API via x402. Put this in front of publish.new content endpoints so agents pay automatically |
| **Majordomo pattern** | STUDY `builders-garden/majordomo` -- "whatever you need done, the right agent is already out there." This is an agent-to-agent task marketplace. ZABAL agents could list capabilities here |
| **MPP for live rooms** | USE MPP (Machine Payment Protocol) from Session 7 for FISHBOWLZ live room payments. Sessions = 1 signature for many transactions. Perfect for live tipping during rooms |

---

## Complete Session Inventory

| # | Date | Title | Speaker | Doc Coverage | Key Tech for ZABAL Swarm |
|---|------|-------|---------|-------------|--------------------------|
| 1 | Mar 30 | Farcaster Building Blocks | Naina Sachdev (Dev3Pack) | **240** (overview) + **317** (full transcript) | Open social graph for agent discovery. Agents = first-class FIDs |
| 2 | Mar 31 | Miniapps 101 | Lucas (Neynar) | **240** + **317** | Farcaster Studio for agent UI. Mini app as agent frontend |
| 3 | Apr 1 | Agents 101 | Jack Dishman + Grin (Clanker) | **240** + **291** + **317** | Event-driven loop (trigger->decide->act). Upstash QStash $2/mo. Idempotency keys |
| 4 | Apr 2 | Memory, Context & Reasoning | Saltorious (Lazer Tech) | **240** + **291** + **317** | 45% context window rule. Orchestrator + sub-agents. Front matter pattern. Claude Code dreaming |
| 5 | Apr 3 | Give Your Agent a Wallet | Madeleine (Privy) | **240** + **291** + **317** | Privy TEE wallets, policy engine, x402 in 5 lines, MPP sessions. KEY SESSION for ZABAL |
| 6 | Apr 6 | Build a Farcaster Agent | urbe eth (Builders Garden) | **316** + **317** | Exact Privy wallet setup steps, `npm run auto` FID registration, Vercel deploy. THE BUILD SESSION |
| 7 | Apr 7 | Embedded Capital & Agentic Commerce | Samuel Zeller | **316** | x402 protocol details, MPP (Tempo), agent-to-agent commerce patterns, passkeys. KEY SESSION for ZABAL |
| 8 | Apr 8 | Going Viral on Farcaster | Sayeed Mehrjerdian (Emerge) | **316** | Emerge viral loop, Clanker token launch lessons, "generate for a friend", agent-in-timeline |
| 9 | Apr 9 | Identity & Reputation (ERC-8004) | Vittorio Rivabella (EF) | **316** | 100K+ agents registered, 3 registries (identity/reputation/validation), SIWA auth, CROPS principles |
| 10 | Apr 10 | Multi-Agent Coordination | Cassie Heart (Quilibrium) | **318** | Softmax agent selection, 5-dimension personas, activity budgets, 90s cooldown, memory decay, HyperSnap |

---

## Comparison: Bootcamp Repos to Fork for ZABAL Agents

| Repo | Stack | Agent Type | Wallet | Cron | Memory | Farcaster | ZAO Fit |
|------|-------|-----------|--------|------|--------|-----------|---------|
| **0xKoda/agent-template** | Cloudflare Workers + TS | Multi-platform (FC/X/TG) | No (add Privy) | YES (CF crons) | 2-tier (KV, 24h + 30d TTL) | YES (Neynar) | **BEST** -- serverless, multi-platform, memory built-in |
| **davidfurlong/farcaster-bot-template** | Next.js + Neynar webhooks | Farcaster only | No | No (add Vercel cron) | No | YES | Good -- simplest starting point, add wallet + cron |
| **builders-garden/base-minikit-starter** | Next.js + Base Minikit | Mini app (not agent) | Coinbase Smart Wallet | No | No | YES | MEDIUM -- for agent frontend, not agent backend |
| **neynarxyz/farcaster-examples** | Various | Sample bots | No | No | No | YES | Reference only -- gm_bot patterns |
| **Bootcamp Session 6 fork** (urbe eth) | Vercel + Privy + Neynar | Farcaster agent | YES (Privy) | YES (Vercel) | Basic | YES | **BEST for ZABAL** -- exact pattern we need, wallet built-in |

**Winner:** Fork the Session 6 pattern (Vercel + Privy + Neynar) and add:
1. 0x Swap API for ZABAL<>SANG trades
2. x402 content purchases from publish.new
3. Supabase event logging (agent_events table from doc 325)
4. Community governance config (agent_config table)

---

## Extraction: Every Technique Applicable to ZABAL Agent Swarm

### From Session 3 (Agents 101) -- Agent Architecture

| Technique | How to Apply to ZABAL Swarm |
|-----------|-----------------------------|
| **Event-driven loop** | Each agent (ZOE/HERALD/FLIPPER) runs trigger->decide->act->repeat on Vercel cron |
| **Webhook + polling hybrid** | Primary: Vercel cron (scheduled). Secondary: Neynar webhook (event-driven when someone @mentions the agent) |
| **Idempotency keys** | Each trade gets a unique key (agent_name + date + action). Prevents double-swaps if cron retries |
| **Dead letter queue** | Failed trades go to Supabase `agent_events` with status='failed'. Admin dashboard shows failures for retry |
| **Upstash QStash** | $2/mo message queue. USE for async trade execution: cron triggers -> QStash queues trade -> worker executes. Handles retries |

### From Session 4 (Memory & Context) -- Agent Intelligence

| Technique | How to Apply |
|-----------|-------------|
| **45% context window rule** | Agent prompts stay under 45% of model context. ZABAL agents use Haiku (200K context), so ~90K token budget |
| **Orchestrator + sub-agents** | ZOE is the orchestrator. HERALD and FLIPPER are sub-agents for their domains. ZOE decides cross-agent trades |
| **Front matter on content** | All publish.new listings include front matter (title, date, price, type) so buying agents can filter without reading full content |
| **Claude Code dreaming** | Nightly compaction: each agent summarizes its day's trades, content, and state into a 200-line context file |

### From Session 5 (Agent Wallets) -- Wallet Infrastructure

| Technique | How to Apply |
|-----------|-------------|
| **Privy policy engine** | Each ZABAL agent wallet has: $5/day limit, approved contracts only (0x router, ZABAL, SANG, USDC), time windows |
| **Key quorums** | For large trades (>$5): require ZOE + HERALD co-signature. Prevents single agent from draining treasury |
| **x402 in 5 lines** | Wrap fetch with x402 payment header. Agent pays $0.001 USDC per Neynar API call, $0.05-0.25 per content purchase |
| **MPP sessions** | For FLIPPER's live room tipping: open MPP session, multiple tips without re-signing. 1 signature = many payments |

### From Session 6 (Build Agent) -- Exact Build Steps

| Step | For ZABAL Swarm |
|------|----------------|
| 1. Fork repo | Fork bootcamp agent repo, rename for each brand |
| 2. Privy wallet | Create 3 wallets in Privy dashboard (ZOE, HERALD, FLIPPER) |
| 3. Fund wallet | Send $15 ETH to each on Base |
| 4. Register FID | `npm run auto` registers Farcaster identity for each agent |
| 5. Deploy Vercel | 3 deployments: ZAO OS, COC Concertz, FISHBOWLZ |
| 6. Configure crons | 6 AM, 2 PM, 10 PM UTC in respective vercel.json |

### From Session 7 (Agent Commerce) -- x402 Trading

| Technique | How to Apply |
|-----------|-------------|
| **x402 for content sales** | Each agent lists content on publish.new behind x402 paywall |
| **Agent-to-agent commerce** | ZOE buys HERALD's show recap via x402. Transaction is real, on-chain, creates volume |
| **Dynamic pricing** | Agents adjust content prices based on demand (more purchases = higher price) |
| **Pay-per-read** | Research docs, show recaps priced at $0.05-0.25. Micro enough for agents, meaningful in aggregate |
| **`servex-rs` reverse proxy** | Builders Garden's Rust x402 proxy -- deploy in front of content API. Zero code changes to content server |

### From Session 8 (Going Viral) -- Distribution

| Technique | How to Apply |
|-----------|-------------|
| **Agent-in-timeline** | ZOE posts ZABAL trade summaries in /zao channel. HERALD posts in /cocconcertz. Educates community on agent activity |
| **"Generate for a friend"** | "I bought @herald's show recap for 10K ZABAL. Want to see it?" -- social proof + discovery |
| **Token launch timing** | ZABAL already launched (Jan 2026). No fundraising risk. Agents can freely trade and promote |
| **Push notifications** | Notify promoters when an agent buys their content. "ZOE just bought your show recap for $0.10!" |

### From Session 9 (ERC-8004) -- Agent Identity

| Technique | How to Apply |
|-----------|-------------|
| **Register on ERC-8004** | All 3 ZABAL agents register at 8004scan. Makes them discoverable to 100K+ other registered agents |
| **Reputation scoring** | Agents build reputation through successful trades and content quality. Higher rep = more external buyers |
| **SIWA auth** | Agents authenticate with each other via Sign In With Agent when making x402 purchases. Cryptographic proof of identity |
| **Validation registry** | When validation launches (end of April 2026), register agents to prove they execute trades correctly |

### From Session 10 (Multi-Agent Coordination) -- Swarm Behavior

| Technique | How to Apply |
|-----------|-------------|
| **Softmax agent selection** | When a community member asks for a trade, score all 3 agents and probabilistically select the best one |
| **Activity budgets** | ZOE: 50 actions/day, HERALD: 30/day, FLIPPER: 20/day. Prevents over-trading |
| **90-second cooldown** | No agent trades within 90 seconds of another agent's trade. Prevents appearing coordinated |
| **5-dimension personas** | ZOE: analytical/researcher. HERALD: hype/promoter. FLIPPER: casual/DJ. Each trades differently |
| **Random noise** | Add randomness to trade amounts ($0.50 +/- $0.20) and timing (cron +/- 30 min). Prevents pattern detection |
| **Memory decay** | Trades older than 7 days fade from agent context. Agents don't reference stale market data |
| **Humanization** | Agents go offline at night (no 3 AM trades). Weekend trades are smaller. Agents "rest" |

---

## What's NOT Covered (Gaps in Existing Research)

| Gap | Priority | Action |
|-----|----------|--------|
| **Session 6 exact repo URL** | LOW | The bootcamp fork repo wasn't captured. Search for `urbe eth` or `builders-garden` bootcamp starter on GitHub. The `0xKoda/agent-template` and `davidfurlong/farcaster-bot-template` serve the same purpose |
| **Neynar agent documentation** | LOW | Neynar has dedicated agent docs at `docs.neynar.com/docs/agent`. Not yet fetched. Would contain latest webhook setup + managed signer details |
| **FarHack competition details** | LOW | The bootcamp fed into FarHack Online 2026. Could be a venue to showcase ZABAL agent swarm. Not researched |
| **Farcaster Snaps** | LOW | Session 8 mentioned Snaps (embedded apps in casts) as acquisition channel. New feature, not deep-dived |

---

## Complete Doc Cross-Reference Map

| Doc | Sessions Covered | Depth | Unique Content |
|-----|-----------------|-------|----------------|
| **240** | 1-5 (overview) + 6-10 (schedule only) | Overview with architecture diagrams | First bootcamp doc, has recording/slides links for sessions 1-5 |
| **278** | All 10 (gap analysis) | Gap analysis vs ZAO | ZAO status per session, comparison tables for identity + payment standards |
| **291** | 3-5 (FISHBOWLZ lens) | Medium | FISHBOWLZ-specific agent tiers, memory patterns for audio rooms, BYOK agent design |
| **316** | 6-9 (full transcripts) | DEEP | Complete session transcripts with code examples, Privy setup steps, x402 protocol details, Emerge viral mechanics, ERC-8004 adoption numbers |
| **317** | 1-6 (full transcripts) | DEEPEST | Full transcripts with every speaker's exact words, architecture diagrams, code patterns, agent hosting comparison, memory taxonomy |
| **318** | 10 (full transcript) | DEEP | Cassie Heart's multi-agent coordination: softmax selection, persona engineering, humanization constraints, HyperSnap evaluation |

**Total coverage: 100% of sessions, with sessions 1-10 having full or near-full transcript-level detail.**

---

## ZAO Ecosystem Integration

### Files Referenced Across All Sessions

| File | Session | Relevance |
|------|---------|-----------|
| `src/lib/farcaster/neynar.ts` | 1, 3, 6 | Neynar SDK client -- base for agent webhooks |
| `src/app/api/fishbowlz/webhook/privy/route.ts` | 5, 6 | Privy webhook handler pattern |
| `src/components/fishbowlz/TipButton.tsx` | 5, 7 | Privy wallet transaction pattern |
| `community.config.ts` | 1, 8 | Farcaster channels for agent posts |
| `src/app/(auth)/ecosystem/page.tsx` | 7 | ZABAL contract address, ecosystem integrations |
| `.well-known/farcaster.json` | 2 | Mini app manifest (needed for agent mini app frontend) |
| `vercel.json` (to create) | 3, 6 | Cron schedules for ZABAL agents |

### Builders Garden Repos to Use

| Repo | Purpose for ZABAL Swarm |
|------|------------------------|
| `builders-garden/siwa` | Sign In With Agent -- agent-to-agent auth for x402 purchases |
| `builders-garden/servex-rs` | x402 reverse proxy -- put in front of content endpoints |
| `builders-garden/majordomo` | Agent task marketplace -- list ZABAL agent capabilities |
| `builders-garden/clocky` | MPP payment reference implementation (iMessage + Tempo) |

---

## Sources

- [Farcaster Agentic Bootcamp (Luma)](https://luma.com/f7ok6tbp)
- [Bootcamp Slides](https://docs.google.com/presentation/d/1_4SoUXqRukM0-saqdAkpXI6lDOMQlFCfOA15pneEuS0/edit)
- [Builders Garden GitHub](https://github.com/builders-garden)
- [0xKoda Agent Template](https://github.com/0xKoda/agent-template)
- [David Furlong Farcaster Bot Template](https://github.com/davidfurlong/farcaster-bot-template)
- [SIWA - Sign In With Agent](https://siwa.builders.garden/)
- [servex-rs - x402 Reverse Proxy](https://github.com/builders-garden/servex-rs)
- [Neynar Agent Documentation](https://docs.neynar.com/docs/agent)
- [ERC-8004 Explorer](https://8004scan.org)
- [x402 Protocol](https://www.x402.org/)
- [Doc 240 - Bootcamp Overview](../240-farcaster-agentic-bootcamp-builders-garden/)
- [Doc 278 - Bootcamp Gap Analysis](../../agents/278-agentic-bootcamp-zao-agent-squad/)
- [Doc 291 - Sessions 3-5 FISHBOWLZ](../../agents/291-farcaster-agentic-bootcamp-days-3-5/)
- [Doc 316 - Week 2 Deep Dive](../316-farcaster-agentic-bootcamp-week2-deep-dive/)
- [Doc 317 - Week 1 Transcripts](../317-farcaster-agentic-bootcamp-week1-transcripts/)
- [Doc 318 - Session 10 Cassie](../../agents/318-cassie-multi-agent-coordination-bootcamp/)
