# 316 - Farcaster Agentic Bootcamp Week 2: Budget-Friendly Agent Dev Stack

> **Status:** Research complete (updated with session transcripts)
> **Date:** April 10, 2026
> **Goal:** Deep dive into Week 2 sessions (April 6-10) of the Builders Garden Farcaster Agentic Bootcamp - agent setup, x402/MPP payments, viral distribution, ERC-8004 identity/reputation, multi-agent coordination with Quilibrium. Focus on budget-friendly dev options for ZAO OS.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent wallet provider** | USE Privy for agent wallet setup - the bootcamp's actual approach. Privy dashboard + SDK creates wallet, funds it, registers Farcaster ID + signer in one `npm run auto` script. Coinbase AgentKit is a free alternative but Privy is what the bootcamp teaches |
| **Agent payments (x402)** | USE x402 for Neynar API reads/writes - agent pays per-call from Privy wallet, no API key needed. For streaming/batched payments, WATCH MPP (Machine Payment Protocol) from Tempo - session-based auth means 1 signature for multiple transactions |
| **Agent identity (ERC-8004)** | USE ERC-8004 for ZOE's on-chain identity + reputation. 100,000+ registered agents, Ethereum Foundation backed, SIWA (`@buildersgarden/siwa`) for auth. Farcaster social graph augments reputation score. Register at 8004scan |
| **Viral distribution** | STUDY Emerge's pattern: agent in timeline replies, personalized tagging ("generate for a friend"), push notifications, token incentives for early users. ZOE can replicate: tag @zoe in /zao channel, agent replies with miniapp |
| **Agent deployment** | USE Vercel serverless (webhook + cron) over VPS - cheaper, only computes when triggered. Two endpoints: webhook for event-driven activation, cron for scheduled tasks |
| **Multi-agent coordination** | WATCH Quilibrium (Session 10, Cassie) but BUILD simple coordination now - Supabase as shared state between ZOE and sub-agents |
| **MPP vs x402** | USE x402 for high-volume single transactions (HTML standard, all browsers). USE MPP for streaming/continuous payments (sessions = 1 sig for many txns). MPP is centralized (4 nodes) - tradeoff |
| **FarHack competition** | INVESTIGATE entering FarHack Online 2026 with ZOE as the submission. Bootcamp projects compete there - visibility + feedback for free |

## Bootcamp Overview

| Detail | Value |
|--------|-------|
| Event | Farcaster Agentic Bootcamp |
| Dates | March 30 - April 10, 2026 (2 weeks) |
| Format | Online, free |
| Participants | 238 builders |
| Hosts | Builders Garden + Dev3Pack + Urbe Hub (Rome-based web3 community) |
| Competition | FarHack Online 2026 (ends ~10 days after bootcamp) |
| Slides | [Google Slides](https://docs.google.com/presentation/d/1_4SoUXqRukM0-saqdAkpXI6lDOMQlFCfOA15pneEuS0/edit) |

### Corrected Week 2 Schedule

| Date | # | Title | Speaker | Actual Topic |
|------|---|-------|---------|-------------|
| Apr 6 | 6 | Build a Farcaster Agent | urbe eth | Hands-on: fork repo, Privy wallet, Neynar signer, Vercel deploy, OpenRouter LLM |
| Apr 7 | 7 | Embedded Capital & Agentic Commerce | Samuel Zeller | x402, MPP (Tempo), Open Wallet Standard, passkeys, agent commerce patterns |
| Apr 8 | 8 | Going Viral on Farcaster | Sayeed Mehrjerdian (ATown / Emerge) | Emerge's viral loop: agent-in-timeline, personalized tagging, token incentives, Clanker SDK |
| Apr 9 | 9 | Identity & Reputation (feat. 8004) | Vittorio Rivabella (Ethereum Foundation) | ERC-8004 identity/reputation/validation registries, 100K+ agents, CROPS principles |
| Apr 10 | 10 | Multi-Agent Systems & Coordination | Cassie Heart (Quilibrium) | (Transcript pending) |

## Session 6: Build a Farcaster Agent (April 6)

**Speaker:** urbe eth (Builders Garden)
**Format:** Hands-on live coding

### What Was Actually Built

A complete Farcaster agent deployed to Vercel in one session:

1. **Fork the repo** - Open-source Neynar agent repository
2. **Privy wallet setup** - Dashboard + SDK (not Ethers)
3. **Fund wallet** - Small ETH on Base, auto-bridges to Optimism for Farcaster registry
4. **Register agent** - `npm run auto` creates Farcaster ID + signer key + first cast
5. **Deploy to Vercel** - Serverless with 2 API endpoints
6. **Test** - Agent replies to mentions on Farcaster

### Architecture: Vercel Serverless (Not VPS)

| Component | Purpose | Cost |
|-----------|---------|------|
| **Webhook endpoint** | Neynar calls this when events occur (mentions, keywords, cast.created) | Free (Vercel) |
| **Cron endpoint** | Scheduled tasks (post every hour, daily digest) | Free (Vercel) |
| **OpenRouter** | LLM API gateway for response generation | Pay-per-use |
| **Neynar x402** | Pay-per-call for posting and reading content | ~$0.001/call |
| **Privy wallet** | Holds funds, signs transactions | Free dashboard |

**Key insight from urbe eth:** "Deploying the agent to Vercel in a serverless environment so that it only computes when needed is a cheaper approach than a 24/7 VPS setup."

### Privy Setup Steps (Exact Process from Session)

```bash
# 1. Get app ID + secret from Privy dashboard → .env
# 2. Create authorization key "agent demo" → get private key + owner ID
# 3. Create wallet
npm run create-privy-agent-wallet
# Output: wallet address + wallet ID → .env

# 4. Fund wallet with ETH on Base (small amount)
# Script auto-bridges to Optimism + swaps some to USDC on Base for x402

# 5. Register Farcaster account
npm run auto
# This: bridges funds → registers FID → adds signer key → publishes first cast

# 6. Deploy to Vercel
npm run deploy
```

### Agent vs Human on Farcaster

**No technical distinction.** An agent account is identical to a human account on-chain. The difference is purely reputational - agents must build reputation like any new account. The Neynar score helps filter bad actors.

### ZAO OS Application

**Switch ZOE from VPS to Vercel serverless:**
- Current: OpenClaw on VPS ($6/mo, always running)
- Better: Vercel webhook + cron (free tier, only runs when triggered)
- Files: New `src/app/api/agents/webhook/route.ts` + `src/app/api/agents/cron/route.ts`

## Session 7: Embedded Capital & Agentic Commerce (April 7)

**Speaker:** Samuel Zeller (early Farcaster FID ~2000, "type-coding extensively with coding models for 6 months")

### The Problem

No standard for online payments suitable for agents. Credit card fees make sub-10-cent transactions impractical. Agents accessing a single news article shouldn't pay subscription prices.

### x402 Protocol

| Aspect | Detail |
|--------|--------|
| Backed by | Coinbase |
| How it works | Client requests resource -> Server responds 402 -> Client signs payment on-chain -> Server delivers resource |
| Supported by | All major browsers, Farcaster mini apps |
| Transaction cost | Near-zero fees on-chain |
| Best for | High-volume individual transactions |

### Machine Payment Protocol (MPP) - NEW (Not in Prior Research)

| Aspect | Detail |
|--------|--------|
| Created by | Tempo (new L1 blockchain, partnered with Stripe) |
| Key innovation | **Sessions** - authorize once, make multiple payments without re-signing |
| Best for | Streaming payments, live content, batched compute access |
| Limitation | **Centralized - only 4 nodes** (vs Farcaster's decentralized nodes) |
| Advantage over x402 | No repeated signing + gas fees for continuous use cases |

**When to use which:**
- **x402:** High-volume users, one-off transactions, HTML standard (all browsers + wallets)
- **MPP:** Continuous use cases (betting during a football game, streaming, batched API calls) where session primitive eliminates repeated signing

### Farcaster as the Perfect Agent Platform

Samuel's argument for why agents belong on Farcaster:
1. **Every user has a built-in wallet** - unlike X or Bluesky
2. **Agents aren't second-class citizens** - no bot flagging like X
3. **Social graph mitigates spam** - Neynar score filters bad actors
4. **Mini apps = distribution + social layer** - x402/MPP handle payments

### Agent Commerce Patterns (From Session)

| Pattern | Description | ZAO Relevance |
|---------|-------------|---------------|
| **Pay-per-read content** | Agent charges for articles/analysis | ZOE could charge for exclusive research/analysis |
| **Dynamic price curves** | Pricing based on social graph position | Higher Respect = lower prices for ZAO members |
| **Agent-to-agent commerce** | Agents buying compute/API calls from each other | ZOE buying inference from Hyperbolic via x402 |
| **Real-life goods** | Agents pay for physical delivery (flowers example) | ZAO merch ordering via agent |
| **Task markets** | Jobs monitored by a judging agent to prevent fraud | Governance task delegation |
| **Auto smart contract factory** | Agent iteratively writes + judges contracts | Could auto-deploy ZOUNZ governance proposals |

### Open Wallet Standard & Passkeys

- Passkeys simplify wallet setup for agents (no seed phrases)
- Device-tied, created via biometrics
- Recovery challenge if device lost and not synced
- Quilibrium uses same approach (passkeys, no traditional wallets)

## Session 8: Going Viral on Farcaster (April 8)

**Speaker:** Sayeed Mehrjerdian (ATown), founder of Emerge
**Product:** Emerge - launched September 2025, rapidly became one of the most popular Farcaster apps

### Emerge's Viral Loop (Concrete Mechanics)

```
1. User tags @emerge agent on timeline with a prompt
2. Agent fetches user's PFP + prompt
3. Processes with LLM (Gemini) + image gen (Nano Banana)
4. Creates AI content workflow
5. Agent replies IN THE FEED with the miniapp
6. Others see → pay $0.25 to run same prompt with THEIR PFP
7. Original creator earns from each use
8. Loop repeats
```

### Key Viral Mechanics

| Mechanic | How It Works | ZAO Application |
|----------|-------------|-----------------|
| **Agent-in-timeline** | Bot replies in feed (not DM), educating others on how to interact | ZOE replies to /zao casts with miniapp links |
| **"Generate for a friend"** | Pay $0.25 to create output for another user | "Dedicate a song to @friend" - personalized artist recommendation |
| **Push notifications** | Recipient gets notified when someone creates content for them | "@artist, someone played your track 100 times" |
| **Personalized tagging** | Tags must involve personalized content (not spam) | ZOE tags artists when their music trends |
| **Group content** | Multi-user creations (group photos) compound sharing | "ZAO Fractal group photo" - tags all participants |
| **Token incentives** | 20% of workflow token supply allocated to early users | Respect-weighted early adopter rewards |

### Token Launch Lessons (Critical for ZAO)

**What worked:** Launching a Clanker token bootstrapped Emerge - generated fees, funded the project, attracted Clanker ecosystem users.

**What went wrong:** "Launching the token made it very difficult to raise venture capital. Investors used the existing token's market cap to price the company." Sayeed said knowing the long-term impact, they likely would have waited.

**ZAO takeaway:** SKIP early token launches for fundraising flexibility. Use Respect (non-financial reputation) instead.

### Tech Stack

| Component | Tool | Why |
|-----------|------|-----|
| LLM | Google Gemini | $100K in Google credits |
| Image gen | Nano Banana | Quality + speed |
| Workflow | Comfy UI | Complex multi-step: user intent -> reference images -> structured JSON -> generation |
| Moderation | Gemini built-in | Minimal custom guard rails needed |
| Token | Clanker SDK | One-click token launch for content workflows |

### Future: Snaps as Acquisition Channel

Farcaster Snaps (embedded apps in casts) can serve as a **preview** experience that redirects users to the full mini app. Example: "telephone" game where an image is continuously remixed by users in the timeline.

## Session 9: Identity & Reputation with ERC-8004 (April 9)

**Speaker:** Vittorio Rivabella, Ethereum Foundation (Decentralized AI team)
**NOT:** "Miniapp Notifications & Sharable Moments" (that was incorrectly listed)

### Why AI + Ethereum

The Ethereum Foundation's DAI team sees AI agents as **new economic participants** that need infrastructure traditional systems can't provide:
- Agents can't use UIs
- Agents can't securely use passwords
- Agents can't open bank accounts
- Agents can't rely on traditional legal contracts
- Agents can't build reputation in traditional systems

### ERC-8004: Three Registries

| Registry | Purpose | Status |
|----------|---------|--------|
| **Identity** | Register agents on-chain (like Farcaster profiles for agents) | Live on mainnet (Jan 2026) |
| **Reputation** | Aggregate scores from user feedback + automated "watchtowers" | Live |
| **Validation** | Verify agents execute inference as advertised (correct model, correct hardware) | Launching end of April 2026 |

### ERC-8004 Adoption Numbers

| Metric | Value |
|--------|-------|
| Testnet launch | September 2025 |
| Mainnet launch | January 2026 |
| Registered agents | 100,000+ |
| Monthly active agents | 20,000+ |
| Enterprise interest | Visa, GoDaddy mentioned |

### How Reputation Works

```
Agent registers on-chain → exposes endpoints (APIs, A2A servers, ENS names)
                                    ↓
Users/agents interact → leave feedback scores
                                    ↓
Watchtowers (automated) → check uptime, latency, return value correctness
                                    ↓
Reputation score aggregated → higher score = more discoverable
                                    ↓
Service providers use score for access control (Visa restricts low-score agents)
```

### CROPS Principles (Ethereum Foundation's AI Vision)

| Principle | Current AI Reality | CROPS Goal |
|-----------|-------------------|------------|
| **C**ensorship Resistance | Centralized, can be shut down | Agents run on decentralized infra |
| **O**pen Source | Closed models (GPT, Claude) | Open models + open infrastructure |
| **P**rivacy | Data harvested by AI companies | Privacy-preserving inference |
| **S**ecurity | Prompt injection, hallucination | Verifiable execution via TEE |

### ERC-8004 + Farcaster Integration

**Bidirectional augmentation:**
- Farcaster social graph augments ERC-8004 reputation (connection history, engagement quality)
- ERC-8004 identity augments Farcaster profiles (verified capabilities, reputation scores)
- Farcaster IDs can be included in the ERC-8004 service field
- Reputation scores enable access control (e.g., only agents with score >80 can post in /zao)

### ERC-8004 + x402 Connection

ERC-7542 (x402) payment transaction hashes link to reputation data points, providing context for scores. When an agent pays for a service and rates it, the payment proves the interaction was real.

### Registration Process

1. Connect wallet at 8004scan website
2. Provide: name, endpoints, skills
3. Pay registration fee
4. Agent is discoverable across all supported chains (multi-chain abstraction layer)

### ZAO OS Integration Plan

| Action | Benefit |
|--------|---------|
| Register ZOE on ERC-8004 | ZOE becomes discoverable to other agents |
| Add Farcaster social graph as reputation input | ZOE's /zao engagement history boosts reputation |
| Use reputation for access control | Only high-reputation agents can interact with ZAO governance |
| Wire SIWA (`@buildersgarden/siwa`) for auth | ZOE authenticates with other services cryptographically |

## Session 10: Multi-Agent Systems & Open Coordination (April 10)

**Speaker:** Cassie Heart (Quilibrium)
**Status:** Transcript pending - Cassie's session on Quilibrium's decentralized compute for multi-agent coordination.

See [Doc 314](../../infrastructure/314-quilibrium-network-comprehensive-deep-dive/) for comprehensive Quilibrium research that provides context for this session.

## Comparison: Full Stack Costs (Updated with Session Details)

| Component | Traditional | Budget Stack (Bootcamp) | Savings |
|-----------|-------------|------------------------|---------|
| Agent wallet | Privy (free dashboard, funded wallet) | Same - Privy is the bootcamp's choice | $0 |
| Agent hosting | VPS ($6-50/mo, always on) | **Vercel serverless (free tier, webhook + cron)** | $6-50/mo |
| LLM API | OpenAI/Claude direct ($20+/mo) | **OpenRouter (pay-per-use gateway)** | Variable |
| Farcaster API | Neynar Starter ($99/mo) | **x402 pay-per-call (~$0.001)** | $89/mo |
| Farcaster reads | Neynar | **haatz.quilibrium.com (free)** | $99/mo |
| Agent identity | Custom auth | **ERC-8004 + SIWA (free, MIT)** | Dev time |
| Streaming payments | N/A | **MPP sessions (1 sig, many txns)** | Gas fees |
| **Total** | **$150-250/mo** | **$0-20/mo** | **$130-230/mo** |

## ZAO OS Integration Roadmap (from Bootcamp Learnings)

| Priority | Action | Source Session | Files Affected |
|----------|--------|---------------|----------------|
| **P0** | Fork bootcamp agent repo, set up Privy wallet for ZOE | Session 6 | New `src/lib/agents/wallet.ts` |
| **P0** | Deploy ZOE webhook + cron to Vercel (not VPS) | Session 6 | New `src/app/api/agents/webhook/route.ts`, `cron/route.ts` |
| **P0** | Register ZOE on ERC-8004 via 8004scan | Session 9 | New `src/lib/agents/identity.ts` |
| **P1** | Wire SIWA auth for agent-to-agent interactions | Session 9 | `@buildersgarden/siwa` middleware |
| **P1** | Implement Emerge-style viral loop (ZOE replies in /zao timeline) | Session 8 | Agent webhook handler |
| **P1** | Add x402 pay-per-call for Neynar writes | Session 7 | `src/lib/farcaster/neynar.ts` |
| **P2** | Evaluate MPP for streaming payments (fractal meetings, live rooms) | Session 7 | New payment integration |
| **P2** | Build "generate for a friend" style personalized notifications | Session 8 | Notification system |
| **P3** | Explore Snaps as miniapp acquisition channel | Session 8 | New snap components |
| **P3** | Multi-agent coordination (await Session 10 transcript) | Session 10 | Agent orchestration |

## Cross-Reference with Existing Research

| Doc | Overlap | What This Doc Adds |
|-----|---------|-------------------|
| **240** | Bootcamp overview + Week 1 | Actual session transcripts with specific techniques, code patterns, and speaker insights |
| **278** | Gap analysis (ERC-8004, x402, miniapp) | ERC-8004 has 100K+ agents (much more mature than expected), MPP as new payment option, Emerge's viral mechanics |
| **280** | FID registration + x402 deep dive | Privy-based registration flow (simpler than direct on-chain), OpenRouter as LLM gateway |
| **314** | Quilibrium comprehensive | Session 10 context - Cassie's multi-agent coordination vision |
| **304** | haatz free API | Budget optimization - haatz + x402 + Vercel = near-zero costs |

## Sources

- [Farcaster Agentic Bootcamp (Luma)](https://luma.com/f7ok6tbp)
- [Bootcamp Slides](https://docs.google.com/presentation/d/1_4SoUXqRukM0-saqdAkpXI6lDOMQlFCfOA15pneEuS0/edit)
- Session 6 Transcript (Gemini meeting notes) - urbe eth, Build a Farcaster Agent
- Session 7 Transcript (Gemini meeting notes) - Samuel Zeller, Embedded Capital & Agentic Commerce
- Session 8 Transcript (Gemini meeting notes) - Sayeed Mehrjerdian (ATown), Going Viral / Emerge
- Session 9 Transcript (Gemini meeting notes) - Vittorio Rivabella (Ethereum Foundation), ERC-8004
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [8004scan - Agent Registry Explorer](https://8004scan.org)
- [SIWA - Sign In With Agent](https://siwa.builders.garden/)
- [SIWA npm package (@buildersgarden/siwa)](https://www.npmjs.com/package/@buildersgarden/siwa)
- [Privy Agentic Wallets Docs](https://docs.privy.io/recipes/agent-integrations/agentic-wallets)
- [x402 Protocol](https://www.x402.org/)
- [Tempo / MPP (Machine Payment Protocol)](https://tempo.xyz)
- [Emerge on Farcaster](https://warpcast.com/emerge)
- [Neynar Agent Documentation](https://docs.neynar.com/docs/agent)
- [OpenRouter LLM Gateway](https://openrouter.ai/)
- [Quilibrium Docs](https://docs.quilibrium.com/docs/protocol/overview/)
