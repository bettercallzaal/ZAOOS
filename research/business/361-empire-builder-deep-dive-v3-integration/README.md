# 361 - Empire Builder Deep Dive: V3 Features, Distribution, and ZAO Integration Strategy

> **Status:** Research complete
> **Date:** 2026-04-15
> **Goal:** Comprehensive understanding of Empire Builder's features, V3 API endpoints, distribution mechanics, and how ZAO can maximize the integration for ZABAL rewards (including RaidSharks raid-to-ZABAL pipeline)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Distribution model | USE manual distribution by Zaal via Empire Builder UI - top 50 raiders weekly from RaidSharks CSV export. No API complexity needed for v1 |
| Empire Builder V3 API | INVESTIGATE with Adrian - V3 adds distribute, burn, and leaderboard query endpoints. Get API docs + sandbox access post-Farcon |
| empireMultiplier as trust signal | USE - already flowing through SongJam leaderboard into `src/components/respect/SongjamLeaderboard.tsx:13`. Range 4.0-8.6x. Higher multiplier = more skin in game |
| Automated distribution (future) | USE Empire Builder V3 distribute endpoint via BANKER agent when API docs available. Batch send to 50+ wallets weekly |
| Burn integration | USE V3 burn endpoint for 1% auto-burn on VAULT/BANKER/DEALER agent trades. Needs whitelisted caller from Adrian |
| Webhook receiver | BUILD `/api/empire-builder/webhook` route to receive staking/burn/distribute events and update Supabase |
| iframe embed | KEEP current embed at `src/app/(auth)/ecosystem/page.tsx:78` pointing to ZABAL profile. Works but loads slow (client-rendered React app) |
| Whitelabel/custom leaderboard | INVESTIGATE - ask Adrian about branded ZABAL leaderboard within Empire Builder, showing holders + stakers |

## What Empire Builder Is

Gamified token community rewards platform on Base, deeply integrated with Farcaster. Built by Adrian (@glankerempire). Same stack as ZAO OS (Next.js + RainbowKit).

**Core concept:** Every ERC-20 token can have an "Empire" - a community hub with tracking, ranking, airdrops, burns, and rewards. Every Farcaster user automatically has an Empire Builder profile.

## Features

### Current (V2)

| Feature | What It Does |
|---------|-------------|
| **Empires** | Community hubs around ERC-20 tokens - holders tracked, ranked, rewarded |
| **Airdrops** | Token distribution to community members |
| **Burns** | Token supply reduction mechanics |
| **Leaderboards** | Competitive engagement/ranking by holdings + activity |
| **Treasuries** | Community fund management |
| **Token creation** | Launch new ERC-20 tokens, get 80% of trading fees |
| **Token migration** | Migrate existing tokens to Empire Builder ecosystem |
| **glonkybot** | AI agent (Claude Sonnet 3.7) that auto-deploys Clanker tokens |
| **Booster multiplier** | Cross-platform multiplier that feeds into SongJam leaderboard scoring |
| **Farcaster native** | Profiles auto-populate from Farcaster identity |

### V3 (Shipping for Farcon - Confirmed from Adrian call prep)

| Feature | What It Enables for ZAO |
|---------|------------------------|
| **Distribute API** | Programmatic ZABAL distribution to contributors (COC promoters, fractal participants, raiders) |
| **Burn API** | Auto-burn 1% on every agent trade (VAULT/BANKER/DEALER) |
| **Leaderboard query API** | Pull multiplier data by token contract address into ZAO OS |
| **Webhook/event feed** | Trigger downstream logic on staking, burn, distribute events |
| **Agent-callable endpoints** | Allow on-chain agents to call distribute/burn without human in loop |
| **Custom leaderboard** | Branded ZABAL leaderboard inside Empire Builder |

### Questions for Adrian (from call prep, some may be answered)

1. Auth model - API key, wallet sig, or OAuth? Rate limits?
2. Burn endpoint - accepts `from` address + `amount`? Whitelisted caller needed?
3. Distribute endpoint - single or batch recipients? Gas abstraction?
4. Leaderboard API - query by token contract (`0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`)?
5. Webhooks - POST to URL, or polling?
6. Custom leaderboard - self-serve or manual setup?
7. iframe embed - add `www.` prefix, or new V3 URL?
8. Farcon timeline - hard ship date?

## Comparison: ZABAL Distribution Methods

| Method | Empire Builder (manual) | Empire Builder V3 API | Incented Campaigns | Direct on-chain (Viem) | SongJam Leaderboard |
|--------|------------------------|----------------------|-------------------|----------------------|-------------------|
| **Effort** | 5 min/week | 1 hour setup, then automated | Campaign setup needed | Contract interaction code | Read-only |
| **Cost** | Gas per distribution | Gas + API overhead | Campaign stake required | Gas only | Free |
| **Tracking** | Empire Builder leaderboard | Empire Builder leaderboard + webhook | Incented dashboard | Basescan only | SongJam dashboard |
| **Batch support** | Yes (UI) | Yes (API, confirm with Adrian) | Per-campaign | Custom contract | N/A |
| **ZOL integration** | Manual CSV | Automated via webhook | Separate system | Custom | Via empireMultiplier |
| **Best for** | v1 manual rewards | v2 automated agent rewards | Community-driven bounties | Custom logic | Scoring/multiplier data |

## The Multiplier System

### How empireMultiplier Works

Empire Builder assigns a booster multiplier to users based on their engagement with an empire (staking, holding, activity). This multiplier feeds into SongJam's scoring:

```
totalPoints = pointsWithoutMultiplier * stakingMultiplier * empireMultiplier
```

| Field | Range | Source |
|-------|-------|--------|
| `empireMultiplier` | 4.0x - 8.6x | Empire Builder - based on holdings + staking |
| `stakingMultiplier` | 2.1x - 3.0x | SongJam - SANG staking (sqrt formula) |
| `pointsWithoutMultiplier` | varies | SongJam - raw engagement score |

### Data Flow

```
Empire Builder (on-chain staking)
  --> empireMultiplier calculated
  --> SongJam Cloudflare Worker fetches multiplier
  --> Leaderboard aggregated with all point types
  --> ZAO OS reads via /api/songjam/leaderboard
  --> Displayed in SongjamLeaderboard.tsx
```

## ZAO Ecosystem Integration

### What's Already Built

| Touchpoint | Location | Status |
|------------|----------|--------|
| Ecosystem page iframe | `src/app/(auth)/ecosystem/page.tsx:78` | Live - ZABAL profile embedded |
| EcosystemPanel partner card | `src/components/ecosystem/EcosystemPanel.tsx:25` | Live - expandable iframe |
| SongJam leaderboard reading empireMultiplier | `src/components/respect/SongjamLeaderboard.tsx:13,119` | Live - displays Nx multiplier |
| Config entry | `community.config.ts:166` | Live - name, description, URL |
| Middleware whitelisting | `src/middleware.ts` | Live |
| Portal destination | `src/lib/portal/destinations.ts` | Live |

### ZABAL Token Details

| Detail | Value |
|--------|-------|
| Contract | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base) |
| Launched | January 1, 2026 via Clanker |
| Chain | Base (Ethereum L2) |
| Zaal's wallet | `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` |
| Empire profile URL | `empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` |
| SANG staking contract | `0x4C143539356444ABA748b8523A39D953f24D8d80` (Base) |

### RaidSharks --> Empire Builder Pipeline

The complete raid-to-ZABAL flow (from Doc 360):

```
ZAO content published to X (via broadcast.ts)
  --> RaidSharks raid in Telegram (t.me/thezao)
  --> Members engage on X (like=2pts, repost=3pts, comment=4pts)
  --> Leaderboard tracks engagement all week
  --> Weekly: Zaal exports CSV, takes top 50
  --> Zaal distributes ZABAL via Empire Builder UI
  --> Recipients see rewards on Empire Builder leaderboard
  --> empireMultiplier increases for active stakers
  --> SongJam leaderboard reflects higher multiplier
  --> ZAO OS SongjamLeaderboard.tsx shows updated rankings
```

### V3 Automated Pipeline (Future)

```
RaidSharks API (points per user per week)
  --> ZAO OS /api/raids/distribute route
  --> Normalize points, calculate ZABAL amounts
  --> Call Empire Builder V3 distribute endpoint (batch)
  --> Webhook fires back to /api/empire-builder/webhook
  --> Supabase logs distribution event
  --> Farcaster cast announces weekly raid rewards
```

### Agent Integration (Future)

Three ZAO agents with Privy TEE-secured wallets:

| Agent | Empire Builder Use |
|-------|-------------------|
| VAULT | Treasury management - could call distribute for contributor rewards |
| BANKER | Liquidity + distribution - primary caller for raid rewards |
| DEALER | Trading + burns - call burn endpoint for 1% auto-burn on trades |

**Desired burn flow:**
```
DEALER executes trade on Base
  --> Calculate 1% burn amount
  --> Call Empire Builder V3 burn endpoint
  --> Log burn event to Supabase
  --> Broadcast to /zao Farcaster channel
```

### Empire Builder vs. Other ZABAL Partner Platforms

| Platform | Role in ZABAL Stack | Data ZAO OS Reads |
|----------|--------------------|--------------------|
| **Empire Builder** | Token rewards, staking, distribution, burns | empireMultiplier (via SongJam) |
| **SongJam** | Voice engagement, leaderboard scoring | totalPoints, farcasterPoints, tlPoints, songjamSpacePoints, all multipliers |
| **MAGNETIQ** | IRL Proof of Meet badges | None (no API, link-only) |
| **Incented** | Community campaigns + bounties | None (separate UI at incented.co/organizations/zabal) |
| **Clanker** | Token launch origin | ZABAL token exists because of Clanker |
| **ZOUNZ** | Nouns DAO NFT auctions | On-chain via Nouns Builder contracts |

### Technical Synergy

Empire Builder runs Next.js + RainbowKit on Base - identical stack to ZAO OS. This means:
- Shared chain (Base) - no bridge needed
- Shared wallet standard (RainbowKit/wagmi)
- Shared social layer (Farcaster)
- Shared identity (Farcaster FID auto-populates)
- V3 API integration = deepest partner integration possible

### Implementation Priority

| Priority | Action | Effort | Depends On |
|----------|--------|--------|------------|
| **Now** | Manual ZABAL distribution via Empire Builder UI (top 50 raiders) | 5 min/week | RaidSharks CSV export |
| **After Adrian confirms V3** | Build `/api/empire-builder/webhook` route | 2 hours | V3 webhook spec |
| **After V3 API docs** | Build `/api/raids/distribute` auto-distribution | 4 hours | V3 distribute endpoint docs |
| **After V3 burn endpoint** | Wire DEALER agent 1% auto-burn | 2 hours | V3 burn endpoint + whitelisting |
| **After V3 leaderboard API** | Pull empire data natively (replace SongJam passthrough) | 3 hours | V3 leaderboard query endpoint |
| **After custom leaderboard** | Branded ZABAL leaderboard in Empire Builder | Adrian setup | Adrian self-serve or manual |

## Key Numbers

| Metric | Value |
|--------|-------|
| Empire Builder native token (GLANKER) | 100B supply, ~$63K market cap |
| empireMultiplier range | 4.0x - 8.6x |
| Trading fee for created tokens | 80% to creator |
| ZABAL contract | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| SANG minimum stake | 50,000 tokens |
| SANG optimal stake | 500,000 tokens |
| SongJam leaderboard API | `songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2` |

## Sources

- [Empire Builder](https://empirebuilder.world) - main platform
- [ZABAL Empire Profile](https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af) - Zaal's empire
- [Doc 065 - ZABAL Partner Ecosystem](../community/065-zabal-partner-ecosystem/) - original partner research
- [Doc 348 - SongJam Points System Deep Dive](../community/348-songjam-points-system-deep-dive/) - multiplier mechanics
- [Doc 360 - RaidSharks Telegram Engagement](../cross-platform/360-raidsharks-telegram-engagement-strategy/) - raid-to-ZABAL pipeline
- [Adrian Call Prep](../../docs/call-prep/2026-04-13-adrian-empire-builder.md) - V3 API questions + integration plan
- [ZABAL Update 3 (Paragraph)](https://paragraph.com/@thezao/zabal-update-3) - Empire Builder + SongJam integration announcement
