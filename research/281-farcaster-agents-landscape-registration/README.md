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
