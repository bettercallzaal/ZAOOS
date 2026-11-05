---
topic: farcaster
type: research-report
status: research-complete
last-validated: 2026-10-31
original-query: "Map Farcaster agents landscape, compare registration methods, find cheapest path for CASTER (reconstructed)"
tier: production
---

# 281 — Farcaster Agents Landscape & Registration Paths: The Complete Picture

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Map every active Farcaster agent, understand how they registered, find the cheapest proven path for CASTER

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Registration path** | USE the `rishavmukherji/farcaster-agent` toolkit — `npm run auto` does everything in one command for ~$1 on Optimism. MIT licensed, proven, uses ethers.js. |
| **Alternative path** | If farcaster-agent doesn't work, USE fid-forge Stripe checkout ($2) — it works, we already have a registration ID (`reg_mnmcfhzitsgnrfwn`). The x402 path is broken but Stripe is fine. |
| **Signer type** | USE self-managed signer (Ed25519 keypair we control) — no Neynar dependency for signing. We can still use Neynar API for reading/webhooks. |
| **Ongoing API calls** | USE Neynar x402 ($0.001/call) for hub access — the $2 USDC already on Base covers 2,000 casts. No subscription needed. |
| **Webhook setup** | USE Neynar webhooks for @zaocaster mentions — free with API key, fires to our existing API infrastructure at zaoos.com |
| **DON'T over-engineer** | SKIP ERC-8004 registration for now — only 20K agents registered, ecosystem is early. Get the FID first, add ERC-8004 later. |
| **Funding** | SEND ~$1-2 ETH to Optimism for the wallet. NOT $10. The farcaster-agent toolkit needs $0.50-1.00 total. |

## Comparison of Registration Methods

| Method | Cost | Complexity | Time | Proven? | ZAO Fit |
|--------|------|-----------|------|---------|---------|
| **farcaster-agent toolkit** | ~$1 ETH on Optimism | Low — `npm run auto` | 5 min | YES — MIT, documented | **BEST** |
| **fid-forge Stripe** | ~$2 card payment | Low — pay link | 2 min | YES — we have a reg ID | **BACKUP** |
| **fid-forge x402** | ~$2 USDC on Base | BROKEN | N/A | NO — empty 402 body | SKIP |
| **Neynar API** | $5+ ETH on Optimism | Medium — 5 API calls | 10 min | YES — official | OVERKILL |
| **Direct on-chain** (DIY) | ~$7 ETH on Optimism | High — manual contracts | 30 min | YES — protocol level | OVERKILL |
| **Warpcast app** (manual) | Free | Trivial — browser | 2 min | YES | NOT PROGRAMMATIC |

## Active Farcaster Agents (15+ documented)

### Tier 1 — High Profile ($1M+ volume or 10K+ followers)

| Agent | What It Does | How Registered | Autonomy | Revenue |
|-------|-------------|----------------|----------|---------|
| **Clanker** (@clanker) | Deploys ERC-20 tokens on Base when mentioned | Managed signer (Neynar-owned) | Fully autonomous | $7M+ fees, $1B+ volume |
| **AIXBT** (@aixbt) | Crypto market intel, monitors 400+ sources | Virtuals Protocol | Fully autonomous | Token-gated terminal ($600K+ AIXBT) |
| **Aether** (@aether) | AI art, NFT mints, treasury management | Developer deployed | Semi-autonomous | $254K+ treasury from 466K NFT mints |

### Tier 2 — Community Agents

| Agent | What It Does | Community |
|-------|-------------|-----------|
| **AskGina** (@askgina.eth) | On-chain search, summons @paybot/@bountycaster | General FC |
| **mfergpt** | Community ambassador, Q&A | $MFER |
| **Elefant** (@elefant) | Community ambassador | $BLEU |
| **Bankr** | On-chain AI assistant | General FC |
| **Bracky** | Sports betting | Sports |
| **Caster Agent** (@casteragents) | AI companion, commands, token sends | /caster channel |
| **Neynar AI** | Protocol trend analysis | Neynar internal |
| **Noicebot** | Incentivized campaign distribution | Growth |

### Tier 3 — Utility Bots

| Agent | Command | Function |
|-------|---------|----------|
| **@remindme** | "@remindme 3 days" | Reminder scheduler |
| **@bountybot** | "@bountybot $50 do X" | Bounty creation |
| **@mintit** | "@mintit" on any cast | Mint cast as NFT |
| **@perl** | "@perl Category" | Save cast to collection |

### Key Pattern
Every successful agent follows the same architecture:
```
FID + Signer → Neynar Webhook (mentions) → Server processes → Neynar API (reply/action)
```
None of them use x402 for registration. They all registered via Neynar managed signers or direct on-chain, then use webhooks for event-driven responses.

## How Agents Actually Communicate

There is **no agent-to-agent protocol** on Farcaster. Agents talk through the same channels as humans:

1. **Public casts + mentions** — Agent A mentions @AgentB, AgentB's webhook fires (this is how Aether + Clanker created $LUM)
2. **Neynar webhooks** — register for mention/reply events, server processes and responds
3. **Direct casts** — private messages via Neynar API
4. **XMTP** — E2E encrypted messaging (some agents accessible via XMTP)

ACP (Agent Communication Protocol) and Google's A2A merged under Linux Foundation but are NOT used on Farcaster yet. Expected Q4 2026 at earliest.

## x402 Reality Check

| Metric | Value | Source |
|--------|-------|--------|
| Ecosystem valuation | ~$7 billion | x402.org |
| Daily volume | ~$28,000 | CoinDesk |
| Solana transactions | 35M+ | Stellar blog |
| Real commercial demand | "just not there yet" | CoinDesk, March 2026 |

**Major supporters:** Coinbase, Cloudflare, Google, Vercel, Nous Research, Stellar
**Reality:** Infrastructure exists but adoption is minimal. Neynar hub is the primary real consumer. $0.001/call works but volume is tiny.

**For ZAO:** x402 is useful for per-call Neynar hub access (avoiding subscriptions) but don't build a business model around it yet.

## What 1 Storage Unit Gets You

| Resource | Limit |
|----------|-------|
| Casts | 5,000 |
| Reactions | 2,500 |
| Links (follows) | 2,500 |
| Profile data | 50 entries |
| Verifications | 50 |
| Duration | 1 year |

CASTER posting 5 casts/day = 1,825/year. 5,000 limit is plenty.

## The Simplest Path for CASTER (Updated)

**Option A — farcaster-agent (~$1, fully automated):**
1. Send ~$2 ETH to `0x3D04...` on **Optimism** (buffer for gas)
2. Clone farcaster-agent, run `PRIVATE_KEY=0x... npm run auto "hi, i'm here to start sharing more of what the ZAO is building"`
3. It registers FID, adds signer, posts welcome cast — all in one command
4. Save credentials, configure CASTER agent on VPS

**Option B — fid-forge Stripe ($2, we already started):**
1. Open the Stripe checkout link (already generated, reg ID: `reg_mnmcfhzitsgnrfwn`)
2. Pay ~$2 with a card
3. Run `npx tsx scripts/register-caster-fid.ts --continue`
4. Script signs EIP-712 transactions, polls for completion, saves credentials

**Option C — Just register on Warpcast (free, 2 min):**
1. Go to warpcast.com, create account with the agent wallet
2. Pick username "zaocaster"
3. Export the signer credentials
4. This is literally what Clanker did before getting acquired

## ZAO OS Integration

### Existing Files
- `scripts/register-caster-fid.ts` — current script (needs fixing for on-chain path)
- `scripts/generate-wallet.ts` — already generated wallet `0x3D04...`
- `src/lib/farcaster/neynar.ts` — Neynar SDK client for API calls
- `community.config.ts` — app FID 19640 (will add CASTER FID here after registration)
- `.caster-registration.json` — saved fid-forge state (reg_mnmcfhzitsgnrfwn)

### Files to Create After Registration
- `src/app/api/webhooks/caster/route.ts` — webhook receiver for @zaocaster mentions
- `.caster-credentials.json` — FID, signer keys, custody address (gitignored)

### Post-Registration Checklist
1. Set profile (display name, bio, pfp) via hub messages
2. Register username "zaocaster" via fnames.farcaster.xyz
3. Set up Neynar webhook for mentions
4. Configure CASTER agent on VPS with FID + signer UUID
5. Test: draft a post, get Zaal's approval, post it

## Updated 2026-10-31

**Source method:** GitHub fetch (FULL) + WebSearch snippets (UNVERIFIED where noted). Direct fetches of neynar.com, farcaster.xyz, blockeden.xyz, theblock.co, infoq.com, arxiv.org, fidforge.11211.me, and x402.org were blocked by the session's network policy; facts from those sources are marked UNVERIFIED.

### 1. ERC-8004: Ecosystem No Longer "Early" - Reconsider the Skip Recommendation

**Original doc (May 2026):** "only 20K agents registered, ecosystem is early. Get the FID first, add ERC-8004 later."

**Current state (Oct 2026):** UNVERIFIED (search snippets only; could not full-fetch registries)
- Multiple independent search results report 1.33-1.53 million ERC-8004 registered agents across 24 chains as of Oct 23-24, 2026. Sources cited: agenteconomy.to, 8004scan (via search snippet from github.com/sudeepb02/awesome-erc8004 and agentcast-ai repo).
- An AIXBT agent tweet (x.com/aixbt_agent/status/1997737391055118796, UNVERIFIED) cited "1M+ registered agents processing $250M weekly flows."
- A June 2026 arXiv paper (2606.12128v1, UNVERIFIED - host blocked) studying the first 10,000 Ethereum mainnet agents found only 67 expose service records and only 628 receive reputation feedback -- registration numbers significantly overstate operational agents.
- **AgentCast** (800works / Termo.ai skill): a new tool that crosslinks ERC-8004 Identity Registry registrations to Farcaster accounts by wallet address, allowing automatic indexing when the same wallet holds both identities (UNVERIFIED, search snippet).

**Updated recommendation:** The "skip ERC-8004" call is likely stale given reported scale, but verify operational-agent numbers before committing effort. If CASTER uses the same wallet for both FID registration and ERC-8004, AgentCast can index it automatically at zero cost.

### 2. x402: From "Demand Not There Yet" to Foundation Stage

**Original doc (May 2026):** Cited CoinDesk March 2026 "just not there yet." Recommended for Neynar per-call only.

**Current state (Oct 2026):** UNVERIFIED (could not full-fetch primary sources)
- x402 was donated to the Linux Foundation as the x402 Foundation on approximately April 2, 2026, with reported members including AWS, Cloudflare, Anthropic, Circle, Stripe, Visa, Mastercard, and Microsoft (sources: theblock.co, blockeden.xyz -- hosts blocked, snippets only).
- Coinbase reported in April 2026: 165 million cumulative transactions, approximately $50M volume, 69,000 active AI agents using x402 (source: blockeden.xyz snippet, UNVERIFIED).
- Cloudflare added x402 to its Agents SDK and MCP integrations, and opened a waitlist for a Monetization Gateway (source: search snippet, UNVERIFIED).
- The Neynar hub x402 pricing (0.001 USDC per call on Base for submitMessage) is confirmed current per Neynar's published docs (search snippet, partial).

**Updated take:** x402 moved from "interesting but minimal" to "Linux Foundation standard with major cloud players." For ZAO the Neynar path ($0.001/call) remains unchanged. The broader signal is that x402 is now infrastructure, not a bet.

### 3. ACP/A2A: Still Not on Farcaster

**Original doc:** "ACP and Google's A2A merged under Linux Foundation but are NOT used on Farcaster yet. Expected Q4 2026 at earliest."

**Current state (Oct 2026):**
- IBM's ACP project merged into Google's A2A under the Linux Foundation (confirmed via IBM Research project page, FULL search snippet from research.ibm.com -- host blocked; UNVERIFIED).
- No search results connect ACP or A2A to Farcaster. A direct search for "ACP agent communication protocol Farcaster 2026 Q3 Q4" returned zero Farcaster-related hits.
- We are now in Q4 2026 and no Farcaster ACP adoption has materialized. The "Q4 2026 at earliest" prediction appears to have been optimistic; the timeline has slipped.

### 4. farcaster-agent Toolkit: Still Valid, One Known Fix

**Original doc:** Recommended as primary path (~$1, `npm run auto`).

**Current state (Oct 2026):** CONFIRMED via GitHub FULL fetch.
- Repository github.com/rishavmukherji/farcaster-agent is live: 42 stars, 4 open PRs, 1 open issue.
- Active fix: upgrade `@farcaster/hub-nodejs` to 0.15.9 or later to resolve an "invalid hash" error on message submission. Without this version the registration will fail at the cast step.
- Neynar hub now explicitly requires x402 payment header on submitMessage because public hubs lag on syncing new FIDs. This matches the original doc's Neynar-x402 recommendation.
- **No commit dates available from the GitHub fetch**; last activity level is UNVERIFIED.

### 5. Base App: Farcaster Sign-In Removed After April 9, 2026

**Confirmed via Base documentation (FULL fetch from docs.base.org):** After April 9, 2026, the Base App treats every app as a standard web app. Farcaster sign-in and FID-based identity are no longer available inside the Base App. Developers are pointed to wagmi, viem, and SIWE instead.

This does not affect Option A (farcaster-agent) or Option B (fid-forge Stripe) since both register on-chain directly. It removes one discovery path for agents that had been discoverable through Base App's mini-app frame, including any that used Farcaster manifest-based sign-in inside the Base App context.

### 6. fid-forge: Status UNVERIFIED

Could not fetch fidforge.11211.me (host blocked by network policy). Status of the Stripe checkout backup path (reg_mnmcfhzitsgnrfwn) is unverified as of this update.

### Summary of Recommendations Changes

| Recommendation | Previous (May 2026) | Updated (Oct 2026) |
|---|---|---|
| Skip ERC-8004 | Yes - only 20K agents | Reconsider - 1M+ reported, but operational count is much lower |
| x402 for Neynar | Yes ($0.001/call) | Still valid; x402 is now a Linux Foundation standard |
| farcaster-agent toolkit | Primary path | Still valid; pin hub-nodejs to 0.15.9+ |
| ACP/A2A on Farcaster | Expected Q4 2026 | Not arrived; timeline slipped past Q4 2026 |
| fid-forge backup | YES (Stripe) | UNVERIFIED - could not reach service |

## Sources

- [Neynar: Building AI Agents on Farcaster](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [Neynar: x402 Vision](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)
- [Neynar: Create New Account](https://docs.neynar.com/docs/how-to-create-a-new-farcaster-account-with-neynar)
- [Neynar: Which Signer](https://docs.neynar.com/docs/which-signer-should-you-use-and-why)
- [Farcaster Docs: Create Account](https://docs.farcaster.xyz/developers/guides/accounts/create-account)
- [Farcaster Docs: ID Gateway](https://docs.farcaster.xyz/reference/contracts/reference/id-gateway)
- [farcaster-agent toolkit (MIT)](https://github.com/rishavmukherji/farcaster-agent)
- [fid-forge API](https://fidforge.11211.me/)
- [Caster Agents Framework V3](https://github.com/casteragents/Caster-Agents-Framework-V3)
- [CoinDesk: x402 Demand](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)
- [Farcaster Free Registration](https://phemex.com/news/article/farcaster-opens-free-account-registration-eliminates-5-fee-30024)
- [a16z Awesome Farcaster](https://github.com/a16z/awesome-farcaster)
- [Farcaster Mini Apps: Agent Checklist](https://miniapps.farcaster.xyz/docs/guides/agents-checklist)

**Added 2026-10-31 (search snippets / UNVERIFIED unless noted):**
- [farcaster-agent toolkit on GitHub](https://github.com/rishavmukherji/farcaster-agent) (FULL fetch 2026-10-31)
- [Base App: Migrate to Standard Web App](https://docs.base.org/apps/guides/migrate-to-standard-web-app) (FULL fetch 2026-10-31)
- [Cloudflare + Coinbase launch x402 Foundation - The Block](https://www.theblock.co/post/372064/cloudflare-coinbase-launch-x402-foundation) (UNVERIFIED - host blocked)
- [Cloudflare + AWS x402 micropayment - InfoQ July 2026](https://infoq.com/news/2026/07/cloudflare-aws-x402-micropayment/) (UNVERIFIED - host blocked)
- [x402 Protocol: 154 Million AI Agent Transactions - BlockEden](https://blockeden.xyz/blog/2026/04/01/x402-protocol-http-402-ai-agent-commerce-stablecoin-payments/) (UNVERIFIED - host blocked)
- [x402 Linux Foundation enterprise standard - BlockEden](https://blockeden.xyz/blog/2026/04/03/x402-linux-foundation-enterprise-ai-agent-payment-standard-stablecoin/) (UNVERIFIED - host blocked)
- [Awesome ERC-8004 list](https://github.com/sudeepb02/awesome-erc8004) (search snippet only)
- [AgentCast skill - Termo.ai](https://termo.ai/skills/agentcast) (search snippet only)
- [ERC-8004 arXiv study (2606.12128v1)](https://arxiv.org/html/2606.12128v1) (UNVERIFIED - host blocked)
- [AIXBT tweet on ERC-8004 1M+ agents](https://x.com/aixbt_agent/status/1997737391055118796) (UNVERIFIED - not fetched)
- [IBM ACP merged into A2A - IBM Research](https://research.ibm.com/projects/agent-communication-protocol) (UNVERIFIED - host blocked)
- [Neynar: Autonomous Farcaster Agent docs](https://docs.neynar.com/docs/autonomous-farcaster-agent) (search snippet only)
