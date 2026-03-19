# 65 — ZABAL Partner Ecosystem: MAGNETIQ, SongJam, Empire Builder, Clanker

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Map all ZABAL partner platforms, document what each does, and plan how to surface them inside ZAO OS for easy access and interaction

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Partner hub page** | BUILD a `/partners` or `/ecosystem` page in ZAO OS showing all ZABAL partner platforms with direct links, descriptions, and embedded feeds where possible |
| **MAGNETIQ** | LINK to the Zabal Connector hub + explain Proof of Meet. No API available — link-only integration for now. Contact tyler@magnetiq.xyz for API access. |
| **SongJam** | EMBED the ZABAL leaderboard (`songjam.space/zabal`) via iframe or link card. Contact Adam Place for API access to pull leaderboard data natively. |
| **Empire Builder** | LINK to ZABAL's empire profile. Farcaster-native, same stack as ZAO OS. Contact @glankerempire for API docs. |
| **Clanker** | DISPLAY $ZABAL token info (price, holders) via Clanker/Uniswap data. Clanker is now part of Farcaster (Neynar acquisition). |
| **Architecture** | Add partner links to both `/contribute` page AND a new `/ecosystem` section in the nav. Use `community.config.ts` for partner URLs. |

---

## The ZABAL Coordination Stack

ZABAL operates as the streaming + coordination engine for the BCZ → ZAO → WaveWarZ ecosystem. Four partner platforms form the coordination layer:

```
┌─────────────────────────────────────────────────────┐
│                  ZABAL Ecosystem                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ MAGNETIQ │  │ SongJam  │  │ Empire   │          │
│  │ Proof of │  │ Voice +  │  │ Builder  │          │
│  │ Meet     │  │ Leader-  │  │ Token    │          │
│  │ (IRL)    │  │ board    │  │ Rewards  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│       └──────────────┼──────────────┘                │
│                      │                               │
│              ┌───────┴───────┐                       │
│              │   $ZABAL      │                       │
│              │   (Base/      │                       │
│              │    Clanker)   │                       │
│              └───────────────┘                       │
└─────────────────────────────────────────────────────┘
```

---

## 1. MAGNETIQ — Proof of Meet (POM)

### What It Is

MAGNETIQ is a SaaS community engagement and monetization platform. Founded July 2022 in New York, ~5 employees. Built on the **Flow blockchain** (NBA Top Shot chain).

**Tagline:** "Your brand's digital clubhouse"

### Core Features

| Pillar | What It Does |
|--------|-------------|
| **Core Engagement** | Polls, surveys, gated content, engagement loops |
| **Co-Lab Studio** | UGC collection, co-creation tools, photo/video sharing |
| **Event Intelligence** | QR-gated content, post-event analytics, badge collection |
| **Commerce Community** | Shopify integration, rewards, revenue-driving communities |

### Proof of Meet (POM) — The ZABAL Use Case

Zaal used MAGNETIQ at ETH Boulder (web3 conference) to create the **Zabal Connector**:

1. Each event gets a unique QR code
2. Person scans QR → enters email → joins the hub
3. Gets an **event-specific badge** (digital memento on Flow blockchain)
4. Can upload selfies, answer surveys, watch intro content, browse project links
5. Zaal comes home with a **living CRM** of everyone he met, organized by event, with their submissions

**Key insight:** "Proof of Meet isn't just a digital badge. It's an intentional acknowledgement of the magic we experience when we interact with others in person."

### Team

| Person | Role | Contact |
|--------|------|---------|
| Kaylan Sliney | Co-founder & CEO | Venture lawyer, blockchain since 2017 |
| Tyler Stambaugh | Co-founder & COO | tyler@magnetiq.xyz |
| Shashank Singla | CTO | Ex-Goldman, IIT Delhi, 350M+ daily requests at paytunes |

### Technical Details

| Aspect | Detail |
|--------|--------|
| **Blockchain** | Flow (Dapper Labs chain) |
| **Wallet** | Dapper Wallet |
| **NFTs** | "Mementos" / "Magnets" — consumer-friendly NFT badges |
| **Auth** | Email-based (Web2 UX) |
| **Integrations** | Shopify, Apple/Google Wallet, QR scanning |
| **API** | No public API. Flow Developer Grant (GitHub issue #111) mentions plans for open-source developer tools. |
| **Pricing** | Not public — commission + SaaS fees + custom services |

### ZAO OS Integration Plan

| Action | Effort | How |
|--------|--------|-----|
| Link card on `/contribute` + `/ecosystem` | 30 min | `<a href="https://app.magnetiq.xyz">` to Zabal Connector |
| Display POM badges in member profiles | Requires API | Need Flow blockchain read + MAGNETIQ API access |
| Contact tyler@magnetiq.xyz for API partnership | 1 email | Ask about API, embedding, cross-chain (Flow → Optimism) |

**Gap:** MAGNETIQ is on Flow blockchain; ZAO OS is Ethereum/Optimism/Base. No native cross-chain bridge. Integration is link-based unless MAGNETIQ adds EVM support.

---

## 2. SongJam — Voice Verification + Leaderboard

### What It Is

SongJam is a **cryptographic voice verification network** and engagement platform. Built by Adam Place.

**Tagline:** "Sovereign Voices Unite — The Future of Engagement"

### Core Features

| Feature | What It Does |
|---------|-------------|
| **Leaderboard-as-a-Service** | Tracks mentions of tokens/projects across X with gamified scoring |
| **Voice Security** | Cryptographic voiceprint verification to prevent deepfakes |
| **X Spaces Integration** | DJ soundboard, AI summarization, transcript search, MP3 recording |
| **Creator Coins** | Mint coins using social data for "Mindshare Capital Markets" |
| **AI Agent Onboarding** | Tools for AI agents to join and participate in X Spaces |

### The $SANG Token

| Detail | Value |
|--------|-------|
| **Chain** | Base (Ethereum L2) |
| **Launched via** | Virtuals Protocol (AI agent token platform) |
| **Price** | ~$0.000127 |
| **Function** | Staking amplifies leaderboard scoring via multiplier |
| **Staking formula** | `1 + sqrt(Stake / 250,000)` — minimum stake 250K $SANG |
| **Virtuals listing** | [app.virtuals.io/virtuals/29671](https://app.virtuals.io/virtuals/29671) |

### ZABAL Leaderboard

**URL:** [songjam.space/zabal](https://www.songjam.space/zabal)

How it works:
1. Tracks all mentions of `@bettercallzaal` or `$ZABAL` across X in real-time
2. Operates on 24-hour rolling cycles
3. **Scoring:** Base mention activity × $SANG staking multiplier × Empire Builder booster multiplier
4. Audio mention detection in X Spaces coming soon
5. Used during the December 2025 campaign leading to $ZABAL's January 1, 2026 launch

### Adam Place (Founder)

- **X:** [@adam_songjam](https://x.com/adam_songjam)
- **GitHub:** [github.com/songjamspace](https://github.com/songjamspace) — 81 repositories
- **Background:** Web3 since Terra Luna era, built music NFT prediction market on Solana, won Polkadot ecosystem prizes
- **Other projects:** Voice vault (TEE), Emotional RAG with ArangoDB, AI agent onboarding, "2026 Music Player" (tokenizing torrenting)

### Technical Details

| Aspect | Detail |
|--------|--------|
| **GitHub** | 81 repos — TypeScript UI, Solidity contracts, Python voice vault |
| **Key repos** | `songjam-ui`, `songjam-contracts`, `songjam-site`, `voice-vault-tee-py` |
| **API** | No public API docs. Leaderboard appears to be hosted service via partnership. |
| **DEX** | $SANG trades on Virtuals Protocol (paired with $VIRTUAL) |

### ZAO OS Integration Plan

| Action | Effort | How |
|--------|--------|-----|
| Embed ZABAL leaderboard iframe | 1 hour | `<iframe src="songjam.space/zabal">` on `/ecosystem` page |
| Link card on `/contribute` | 30 min | Direct link to leaderboard |
| Pull leaderboard data natively | Requires API | Contact Adam for API access to display top contributors in ZAO OS |
| Show $SANG staking info | 1 day | Read from Base chain via Viem (ZAO OS already uses Viem) |

---

## 3. Empire Builder — Token Community Rewards

### What It Is

Empire Builder is a **gamified token community rewards platform** on Base, deeply integrated with Farcaster.

**Tagline:** "The ultimate tool for utility-pilling your tokens"

### Core Features

| Feature | What It Does |
|---------|-------------|
| **Empires** | Community hubs around ERC-20 tokens with tracking, ranking, rewards |
| **Airdrops** | Token distribution to community members |
| **Burns** | Token supply reduction mechanics |
| **Leaderboards** | Competitive engagement/ranking systems |
| **Treasuries** | Community fund management |
| **Token creation** | Launch new tokens OR migrate existing ones |
| **glonkybot** | AI agent (Claude Sonnet 3.7) that auto-deploys Clanker tokens |

### How Empires Work

1. Every Farcaster user automatically has an Empire Builder profile
2. Create an empire around an existing ERC-20 token (like $ZABAL)
3. Get 80% of trading fees for tokens created through the platform
4. Empire becomes a community hub: holders tracked, ranked, rewarded
5. **Booster multiplier** feeds into SongJam leaderboard scoring (cross-platform synergy)

### ZABAL's Empire

**URL:** [empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af](https://www.empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af)

- Wallet: `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` (Zaal's address)
- $ZABAL token: Base chain, launched via Clanker on January 1, 2026

### Technical Details

| Aspect | Detail |
|--------|--------|
| **Framework** | Next.js (same as ZAO OS) |
| **Wallet** | RainbowKit (same as ZAO OS) |
| **Chain** | Base |
| **DEX** | Uniswap V3 (Base) |
| **Farcaster** | Native integration — profiles auto-populate from Farcaster |
| **API** | No public API docs (GitBook docs down). Contact @glankerempire. |
| **Native token** | GLANKER — 100B supply, ~$63K market cap, Base chain |

### ZAO OS Integration Plan

| Action | Effort | How |
|--------|--------|-----|
| Link card to ZABAL empire | 30 min | Direct link on `/contribute` + `/ecosystem` |
| Show $ZABAL token stats | 1 day | Read from Base chain via Viem + Uniswap V3 price feed |
| Display empire leaderboard | Requires API | Contact @glankerempire for API access |
| Farcaster Mini App embed | 2 days | Empire Builder is Farcaster-native — possible Mini App integration |

**Key synergy:** Empire Builder uses Next.js + RainbowKit — identical stack to ZAO OS. Deepest integration potential of all 4 partners.

---

## 4. Clanker Protocol — AI Token Launcher

### What It Is

Clanker is an **autonomous AI agent and decentralized token launchpad** on Base. Now part of Farcaster (acquired by Neynar in January 2026).

### How It Works

1. Tag `@clanker` in a Farcaster cast with a natural language description
2. AI deploys an ERC-20 token on Base with 1B total supply + Uniswap V3 liquidity pool
3. 1% fee on trades, used to buy back and hold $CLANKER tokens

### Scale (as of March 2026)

| Metric | Value |
|--------|-------|
| Traders | 324,000+ |
| Protocol fees | $31.5M+ |
| Total trading volume | $7.62B all-time |
| Tokens created (v3.1) | 164,000+ |
| $CLANKER supply | 1,000,000 (hard cap, 98.6% circulating) |

### ZABAL + Clanker

$ZABAL was launched through Clanker on January 1, 2026. This means:
- $ZABAL is an ERC-20 on Base with a Uniswap V3 pool
- 1% trade fees flow through Clanker protocol
- Token data accessible via Clanker API / Basescan / Uniswap subgraph

### ZAO OS Integration Plan

| Action | Effort | How |
|--------|--------|-----|
| Display $ZABAL price/holders | 1 day | Read from Uniswap V3 subgraph on Base via Viem |
| Link to Clanker token page | 30 min | `clanker.world/token/{address}` |
| Show trade activity | 2 days | Basescan API or Uniswap events |

**Key advantage:** Clanker is now owned by Neynar (which ZAO OS already uses for Farcaster API). Future Neynar SDK updates may include Clanker token data natively.

---

## Codebase Status: Zero Code Integration Today

| Platform | Research Docs | Application Code |
|----------|--------------|-----------------|
| MAGNETIQ | Docs 47, 48, 50, 51 + whitepaper drafts | **None** in `src/` |
| SongJam | Docs 47, 48, 50, 51, 64 | **None** in `src/` |
| Empire Builder | Docs 50, 51 | **None** in `src/` |
| Clanker | Docs 21, 22, 55 + project-context.md | **None** in `src/` |

All four are documented in research as part of the ZABAL ecosystem but have zero presence in the actual application code.

---

## Implementation: Partner Ecosystem Page

### Quick Win: Add to `community.config.ts`

```typescript
partners: {
  magnetiq: {
    name: 'MAGNETIQ',
    description: 'Proof of Meet — IRL connection badges',
    url: 'https://app.magnetiq.xyz', // Zabal Connector hub
    contact: 'tyler@magnetiq.xyz',
  },
  songjam: {
    name: 'SongJam',
    description: 'ZABAL mention leaderboard + voice verification',
    url: 'https://www.songjam.space/zabal',
    founder: 'Adam Place',
  },
  empireBuilder: {
    name: 'Empire Builder',
    description: 'ZABAL token empire — airdrops, burns, leaderboards',
    url: 'https://www.empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  },
  clanker: {
    name: 'Clanker',
    description: '$ZABAL token launcher on Base',
    url: 'https://www.clanker.world/',
  },
  incented: {
    name: 'Incented',
    description: 'Community coordination campaigns',
    url: 'https://incented.co/organizations/zabal',
  },
},
```

### Build: `/ecosystem` Page

A new page at `src/app/(auth)/ecosystem/page.tsx` showing:

1. **Partner cards** — logo, description, direct link to ZABAL's presence on each platform
2. **$ZABAL token stats** — price, holders, 24h volume (from Uniswap V3 / Base chain)
3. **SongJam leaderboard embed** — iframe or top-5 preview
4. **Incented active campaigns** — link to current tasks
5. **MAGNETIQ Proof of Meet** — link to Zabal Connector + explanation of POM

### Add to Navigation

In `community.config.ts` nav pillars, add an "Ecosystem" section:

```typescript
{ label: 'Ecosystem', href: '/ecosystem', icon: 'Globe' }
```

---

## Rollout Priority

| Phase | What | Effort |
|-------|------|--------|
| **1 (now)** | Add partner URLs to `community.config.ts` | 15 min |
| **2 (now)** | Add partner link cards to existing `/contribute` page | 1 hour |
| **3 (this week)** | Build `/ecosystem` page with partner cards + $ZABAL stats | 1 day |
| **4 (next week)** | Embed SongJam leaderboard iframe | 2 hours |
| **5 (outreach)** | Contact tyler@magnetiq.xyz, Adam @adam_songjam, @glankerempire for API access | 3 emails |
| **6 (with APIs)** | Native leaderboard, campaign feed, POM badge display | 1-2 weeks |

---

## Sources

### MAGNETIQ
- [MAGNETIQ Homepage](https://www.magnetiq.xyz/)
- [MAGNETIQ Flow Developer Grant — GitHub](https://github.com/onflow/developer-grants/issues/111)
- [MAGNETIQ on Flowverse](https://www.flowverse.co/applications/magnetiq)
- [MAGNETIQ Terms of Service](https://www.magnetiq.xyz/terms)

### SongJam
- [SongJam Homepage](https://www.songjam.space/)
- [ZABAL Leaderboard](https://www.songjam.space/zabal)
- [SongJam GitHub (81 repos)](https://github.com/songjamspace)
- [$SANG on Virtuals Protocol](https://app.virtuals.io/virtuals/29671)
- [$SANG on CoinGecko](https://www.coingecko.com/en/coins/songjam-by-virtuals)

### Empire Builder
- [Empire Builder](https://www.empirebuilder.world/)
- [ZABAL Empire Profile](https://www.empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af)
- [GLANKER on CoinGecko](https://www.coingecko.com/en/coins/glonkybot)

### Clanker
- [Clanker Protocol](https://www.clanker.world/)
- [Clanker v4 — Bankless](https://www.bankless.com/read/clanker-v4-token-creator)
- [Farcaster Acquires Clanker — The Defiant](https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot)

### ZABAL Ecosystem
- [ZABAL Update 3 — Paragraph](https://paragraph.com/@thezao/zabal-update-3)
- [Doc 47 — ZAO Community Ecosystem](../47-zao-community-ecosystem/)
- [Doc 48 — ZAO Ecosystem Deep Dive](../48-zao-ecosystem-deep-dive/)
- [Doc 50 — The ZAO Complete Guide](../50-the-zao-complete-guide/)
- [Doc 64 — Incented + ZABAL Campaigns](../64-incented-zabal-campaigns/)
