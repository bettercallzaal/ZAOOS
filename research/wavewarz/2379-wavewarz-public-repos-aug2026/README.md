---
topic: wavewarz
type: repo-audit
status: research-complete
created: 2026-08-22
last-validated: 2026-08-22
board-task: 09dc9649-74b7-4112-aae9-be466ac1de50
related-docs: "2321-wavewarz-base-platform-handoff, 2374-farcaster-operator-crisis-aug2026, 1425-wavewarz-farcaster-miniapp-spec"
original-query: "Audit public WaveWarZ repos and deliver research doc"
tier: STANDARD
---

# 2379 - WaveWarZ Public Repo Audit (Aug 2026)

> **Purpose:** Inventory every public WaveWarZ GitHub repo, assess current state
> (production / dormant / demo), identify security issues visible from public code, and
> connect to the Farcaster operator crisis context (doc 2374) and the Farcaster miniapp
> opportunity (doc 1425). Board task 09dc9649, unscheduled. Source: GitHub API reads
> (all repos public), 2026-08-22.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The Base agentic platform (CandyToyBox/wavewarz-base) is shovel-ready but stalled for 69+ days.** It is not dead — it has open issues and was last pushed Jun 14. The gap is structural (principal-level technical seat open, not a code blocker). | wwbase README confirms: "77 days dormant. Reason is structural (the technical handoff to an AI-agent owner didn't complete), not technical." The handoff was to an AI-agent owner — that is an unusual and notable detail. |
| 2 | **The Farcaster miniapp (doc 1425) is NOT the same as CandyToyBox/wavewarz-base.** The Base repo is an agentic battle platform (AI agents as artists). The Farcaster miniapp spec is a fan-facing product (humans bet on who wins the wave war) built on the Farcaster frame/miniapp SDK. Different product, different codebase, different dependency surface. | Doc 1425 specifies Farcaster frames v2 SDK. No Farcaster miniapp code exists in any public WaveWarZ repo as of 2026-08-22. |
| 3 | **The Solana platform (wavewarz.com) is genuinely live and growing.** Stats grew significantly between the Base repo's BRIEF.md (Feb 2026 snapshot: 735 battles, 472 SOL) and the July 2026 wwbase README (1,291 battles, 878 SOL, 13.39 SOL to artists). The core product is real and has user traction. | Two independent documents (BRIEF.md from CandyToyBox/wavewarz-base, wwbase README from bettercallzaal/wwbase) cite consistent platform identity with growing numbers. |
| 4 | **CandyToyBox/wavewarz-base contains credential exposure in a public file.** `IMMEDIATE-ACTIONS.md` in the public repo contains what appears to be Coinbase CDP API credentials (API key ID + EC private key). There is a `COINBASE-CDP-V2-MIGRATION.md` file suggesting these may have been rotated, but this is not confirmed. | Security risk to flag to Zaal + Samantha. Immediate action: verify the exposed key is revoked in Coinbase CDP dashboard. |
| 5 | **The Farcaster miniapp is MORE urgent post-operator crisis, not less.** The miniapp SDK is protocol-level (not Neynar-dependent). The window before a new operator restructures the ecosystem is a competitive advantage. | Doc 2374 decision #2: "WaveWarZ miniapp is the fastest-to-ship Farcaster opportunity." No existing public repo covers this. |

## Repo Inventory (all public, as of 2026-08-22)

### 1. `bettercallzaal/wwbase` — The Base platform brief

| Field | Value |
|---|---|
| Purpose | Public landing page / brief for the WaveWarZ Base spinout. Recruiting technical co-founder. |
| Last pushed | 2026-07-27 |
| Stars / Forks | 0 / 0 |
| License | None |
| Visibility | Public |

**What's in it:** A single detailed README describing the platform mechanics, Solana production proof, Base contracts deployed on Sepolia (Feb 21, 2026), tech stack, team, open seat, and honest gaps. Deployed on Vercel. Not code — this is the pitch brief.

**Current Solana stats (from this README, July 2026):**
- 1,291 battles (165 main + 1,090 quick + 36 community)
- 878 SOL traded (~$65K)
- 13.39 SOL paid directly to artists
- Live nightly at 8:30 PM ET (YouTube + X Spaces)

**Honest gaps disclosed:**
- Base repo dormant since Feb 27 (77 days as of README write)
- BaseScan verification pending
- `.env` files hold private keys in repo (migration to secrets vault needed before external dev)
- No monitoring/alerting
- One compromised wallet from March 2026 (funds moved, documented)

### 2. `CandyToyBox/wavewarz-base` — The Base engineering repo

| Field | Value |
|---|---|
| Purpose | Full engineering repo for the WaveWarZ Base agentic battle platform |
| Last pushed | 2026-06-14 |
| Stars / Forks | 1 / 1 |
| Open Issues | 2 (#9 feat(entry-queue), #10 WvWz_DNAR) |
| License | None |
| Visibility | Public |

**Stack (verified from repo):**
- Contracts: Solidity 0.8.20, OpenZeppelin, ReentrancyGuard, EIP-2981, Foundry (134/135 tests passing)
- Frontend: Next.js 14, OnchainKit, Wagmi, Recharts, Socket.io
- Backend: Fastify 4.25, Supabase, WebSocket
- Agent trading brain: Python + FastAPI + Anthropic Claude, Vercel, GitHub Actions (5-min cron)
- Trade executors: Node + Express, Base (0x Protocol), Solana (Jupiter v6)
- x402 micropayment rails: `@coinbase/x402 v2.1` wired into Executor-Base (not yet activated)

**Deployed contracts on Base Sepolia (chain 84532, verified Feb 21, 2026):**
- `WaveWarzBase` (battle lifecycle, fee distribution): `0xa4B10AF81E3ED591A5d5b1D621bB6B76C9D4CA43`
- `WaveWarzMusicNFT` (ERC-721 artist certificates): `0x813c13d534660E85E37ee71bd3595724FC9D782A`
- `WaveWarzMarketplace` (bonding curve, settlement): `0x227a3B842d8692a5bB961395f301Eff83B0499F5`

**SECURITY FLAG — `IMMEDIATE-ACTIONS.md` credential exposure:**
This public file contains a Coinbase CDP API key ID and EC private key printed inline as "copy from .env.openclaw." The `COINBASE-CDP-V2-MIGRATION.md` file suggests a v2 migration happened (likely rotating credentials), but this must be verified. Action: check Coinbase CDP dashboard and confirm the key visible in this file is revoked. Do not quote the key contents. Zaal should alert Samantha directly.

**Open work per repo documentation:**
- BaseScan verification (first task per wwbase README)
- Secrets vault migration (1Password / AWS Secrets Manager / Doppler)
- Monitoring + alerting (Sentry + Better Stack or equivalent)
- Agent battle choreography (core product mechanic, still undefined)
- Mainnet deployment (contracts ready, needs principled go-live plan)
- x402 monetization (rails wired, pricing model open)

### 3. `bettercallzaal/wavewarzapp` — WaveWarZ Live companion app

| Field | Value |
|---|---|
| Purpose | Fan-facing companion: real-time battle notifications, spectator view, Town Square chat |
| Last pushed | 2026-06-16 |
| Stars / Forks | 0 / 0 |
| License | All rights reserved |
| Status | Demo phase — UI complete, in-memory mock data, no real auth/FCM/Cloud Functions |

**Stack:** Expo SDK 52, React Native 0.76, TypeScript strict, expo-router, Tamagui, Zustand + React Query, Phantom deeplink + tweetnacl (V1, not yet wired), Firebase (structure defined, not connected).

**What's real in demo:** Full UI on iOS/Android/web; real WaveWarZ artist roster (40 artists, Mar 2026 data); 6 demo battles; working chat (local only, rate-limited).

**What's stubbed:** Auth, FCM push, Cloud Functions, cross-device chat sync, Phantom wallet connect, live data scraper.

**Decisions still open per README:**
1. Product positioning: standalone vs folded into Intelligence dashboard
2. Data path: `/api/v1/*` on Intelligence vs own scraper Cloud Function (60s cron)
3. Push event taxonomy (4 obvious: session live/ended, battle started/settled)
4. Brand / naming
5. V1 wallet flow (Phantom + verify sig + claim page)

### 4. `bettercallzaal/wavewarz-overlay` — OBS/Restream lower-third

| Field | Value |
|---|---|
| Purpose | "Now battling" browser-source overlay for Restream/OBS |
| Last pushed | 2026-07-27 |
| Stars / Forks | 0 / 0 |
| License | None |

Simple HTML/CSS/JS with URL param support (`?left=ARTIST+A&right=ARTIST+B&sub=...`). Transparent background, gold accent, reduced-motion safe. Deployed on Vercel. This is production tooling for the live streams.

### 5. `bettercallzaal/ZAOscout` (partial relevance)

Includes WaveWarZ scrapers (stats + battles, bettercallzaal.com). Source of the no-login data extraction capability referenced in other docs. Last pushed 2026-06-19.

## Gap Analysis — What's Missing

| Gap | Impact | Source |
|---|---|---|
| Farcaster miniapp codebase | Zero public code for the miniapp (doc 1425). The most urgent Farcaster opportunity (doc 2374) has no public home yet. | No repo found |
| Solana program source (wavewarz.com) | The Solana program running production battles is not public. Risk: if the primary builders are unavailable, the live platform has no open-source audit trail. | CandyToyBox org, no Solana repo found |
| wavewarz-intelligence | Analytics/leaderboard dashboard (wavewarz-intelligence.vercel.app) referenced in wavewarzapp README but not in the bettercallzaal or CandyToyBox orgs under this name | CandyToyBox/wavewarz-intelligence not found in public search |
| Data freshness | `wavewarzapp` uses Mar 2026 roster snapshot (missing Kata7yst, BennyJ504, DCoopOfficial). No live sync path is shipped. | wavewarzapp README |

## Farcaster Context (Aug 2026)

The Farcaster operator crisis (doc 2374) does NOT affect the Base engineering repo — it has no Farcaster dependency. The miniapp opportunity (doc 1425, doc 2374) is a SEPARATE product that also hasn't been started.

WaveWarZ's Farcaster surface today:
- `/wavewarz` channel (live at farcaster.xyz, follower count unknown)
- ZOL posts cast results to Farcaster (via zol-lib.js, Neynar-dependent — see doc 2378)
- No miniapp code in any public repo

The miniapp is the missing piece and also the piece most isolated from the Neynar operator risk (frame/miniapp SDK is protocol-level).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| **URGENT:** Verify CDP credentials in IMMEDIATE-ACTIONS.md (CandyToyBox/wavewarz-base) are revoked in Coinbase CDP dashboard — alert Samantha | @Zaal | Security | ASAP |
| Start Farcaster miniapp repo (the gap with highest value per doc 2374) | @Zaal + Claude | PR/build | 2026-08-29 |
| Assess whether wavewarzapp (demo phase) should be promoted to V1 or held | @Zaal | Decision | 2026-09-05 |
| Pin x402 version in CandyToyBox/wavewarz-base if/when Base mainnet work resumes | technical co-founder | Code | When hired |
| Find and verify wavewarz-intelligence repo location and access level | @Zaal | Admin | 2026-08-27 |
| Verify BaseScan contract verification status (was pending per wwbase README) | @Zaal | Admin | 2026-08-27 |

## Sources

- [FULL] `bettercallzaal/wwbase` README (gh api readme, 2026-08-22) — platform brief, stats, stack
- [FULL] `CandyToyBox/wavewarz-base` README + BRIEF.md + IMMEDIATE-ACTIONS.md (gh api contents, 2026-08-22) — engineering detail, contracts, security finding
- [FULL] `bettercallzaal/wavewarzapp` README (gh api readme, 2026-08-22) — companion app status
- [FULL] `bettercallzaal/wavewarz-overlay` README (gh api readme, 2026-08-22)
- [FULL] GH search: `wavewarz owner:bettercallzaal` + repo metadata queries (2026-08-22)
- [INTERNAL] Doc 2321 — WaveWarZ Base platform handoff (prior audit, April 2026)
- [INTERNAL] Doc 2374 — Farcaster operator crisis + miniapp opportunity
- [INTERNAL] Doc 1425 — WaveWarZ Farcaster miniapp spec
