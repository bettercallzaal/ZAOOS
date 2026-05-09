---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 625, 468, 584
tier: STANDARD
---

# 626 - Empire Builder + ZABAL Empire: POIDH submitter airdrop architecture

> **Goal:** Map Empire Builder's API + contract surface and design a BCZ webpage that scrapes POIDH submitter wallets, displays a leaderboard, and bulk-airdrops ZABAL via the existing $ZABAL Empire (run by Adam / SongJam at `songjam.space/zabal`). Companion to doc 625 (POIDH playbook).

> **Trigger:** 2026-05-09 ask from Zaal: "make a basic webpage for POIDH submissions, connect Farcaster wallet via Hats, give each submitter a 1, send everyone who submitted some ZABAL". Bounty 1151 (BCZ YapZ Ep 17 clip task, 0.0105 ETH on Base, 2 participants so far) is the seed dataset.

> **Architecture confirmed 2026-05-09 (mid-session correction):** Direction is REVERSED from initial draft. Empire Builder pulls FROM BCZ (not BCZ pushes TO Empire Builder). Mechanism = **API-sourced Leaderboard** via `POST /api/leaderboards/apiLeaderboards` with `apiEndpoint` pointing to a public BCZ JSON URL returning `[{address, score}]`. Empire Builder refreshes the leaderboard, applies ZABAL boosters, distributes. BCZ does not need an Empire Builder API key. Zaal hands Empire Builder team the BCZ URL and they configure the leaderboard from their side. SHIPPED 2026-05-09: `bettercallzaal.com/poidh.html` (UI) + `bettercallzaal.com/poidh-leaderboard.json` (feed). "Haatz" clarified = free Neynar API for Farcaster wallet -> handle resolution, not Hats Protocol.

## Architecture (Confirmed - REVERSE of initial draft)

```
                         POIDH submitters
                                |
                                v
                  PoidhV3 contract on Base + UI
                                |
                                v
                    BCZ scrape / curate manually
                                |
                                v
       bettercallzaal.com/poidh-leaderboard.json   <-- public feed
           [ {address, score}, ... ]                   (no auth needed)
                                |
                                v   (Empire Builder refresh polls this URL)
                                |
                  Empire Builder apiLeaderboards
                                |
                                v
                $ZABAL Empire on Base (Adam owns)
                                |
                                v   apply boosters, refresh leaderboard
                                v   bulk-distribute ZABAL on schedule
                                |
                                v
                       Submitter wallets receive ZABAL
```

Zaal does NOT call Empire Builder API. Zaal hands the BCZ URL to Empire Builder team (or to Adam who configures the apiLeaderboard on the $ZABAL Empire). EB pulls the JSON on every refresh.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Integration direction** | REVERSED from typical webhook patterns: Empire Builder PULLS from BCZ via apiLeaderboards. Use `POST /api/leaderboards/apiLeaderboards` with body `{tokenAddress, apiEndpoint, name, description, applyBoosters: true, signature, message, signerAddress}`. The `apiEndpoint` field = `https://bettercallzaal.com/poidh-leaderboard.json`. Refresh via `PATCH /api/leaderboards/refresh/apiLeaderboards`. Empire Builder team / $ZABAL Empire guardian configures this once; ongoing cost = zero for BCZ. |
| **Empire to use** | USE existing $ZABAL Empire (deployed via Empire Builder, leaderboard at `songjam.space/zabal`). Adam/SongJam owns it. DO NOT deploy a duplicate Empire for ZAO/BCZ - it splits liquidity + brand. |
| **JSON feed format (CONFIRMED)** | Empire Builder expects `[{ "address": "0x...", "score": <number> }, ...]`. Address = wallet, score = numeric. EB applies boosters on top during refresh if `applyBoosters: true`. Sample feed shipped at `bettercallzaal.com/poidh-leaderboard.json`. |
| **API surface (BCZ does NOT call this)** | Empire Builder REST endpoints documented at `https://www.empirebuilder.world/api/...` with `X-API-Key`. Read endpoints (`/api/personal-stats/`, `/api/leaderboard/`) returned `{balance, boostedBalance, boost, rank, activeBoosterIds[]}`. Bulk-send via `/api/distribute/...`. Useful only if BCZ later wants to display ZABAL stats per submitter inline. Phase 1 ships without this. |
| **POIDH data source** | SCRAPE on-chain. POIDH v3 contract emits events for bounty claims; index via Base RPC (Alchemy/Ankr/free public RPC). NO documented POIDH REST API as of 2026-05-09 - the website itself is Next.js client-rendered fetching from internal endpoints. Reverse-engineer via DevTools Network tab OR read PoidhV3 contract events directly. |
| **Submitter "1" semantics** | TWO interpretations to confirm with Zaal: (a) "1 Hat" via Hats Protocol = role NFT each submitter holds (heavy infra, ~2-day build); (b) "1 booster" via Empire Builder = a custom booster ID applied to each submitter address that multiplies their leaderboard score. (b) is lighter, native to Empire Builder, ships in hours. RECOMMEND (b) unless Zaal wants the cross-platform-portable Hats role. |
| **Wallet connect surface** | USE `@farcaster/miniapp-sdk` (already loaded in BCZ index.html for the Farcaster mini app context) to get the Farcaster user's verified address inside the mini app. OUTSIDE the mini app, fall back to wagmi + Coinbase Smart Wallet for browser users. |
| **"Hats" interpretation** | LIKELY Hats Protocol (hatsprotocol.xyz) - on-chain role NFTs (ERC-1155). On Base, deployed at `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`. Tree creation = ~$5 gas + ~10 min setup. Each submitter mints a hat = 1 transaction per address. ALTERNATIVELY "haatz" could be a typo / slang for the booster system - confirm with Zaal. |
| **Page hosting** | ADD `bettercallzaal.com/poidh.html` as a third static page alongside `index.html` and `nexus.html`. Pure HTML + CDN-loaded JS (Empire Builder API client + viem for any chain reads). Match BCZ's existing dark + orange/cyan/gold aesthetic. No build step. |
| **Bulk airdrop trigger** | DO NOT auto-airdrop. Page = read-only display + admin-only "Trigger Distribution" button gated by Zaal's wallet signature. Manual trigger calls Empire Builder bulk-send endpoint with the submitter list. Reasons: (1) prevents Sybil farming via spam submissions, (2) keeps Zaal in the loop on amounts, (3) Empire Builder API key MUST stay server-side, not exposed in static page. |
| **Server-side bridge** | NEEDED for the airdrop trigger because Empire Builder API key cannot live in static HTML. OPTIONS: (a) Cloudflare Worker (~10 lines, free tier covers this), (b) Vercel serverless function, (c) Supabase Edge Function. RECOMMEND Cloudflare Worker - matches BCZ's static + zero-build philosophy. Read endpoints CAN be called direct from page if they're public; airdrop write must be proxied. |
| **Sybil protection** | REQUIRE that submitter wallet has on-chain proof of POIDH claim NFT for the relevant bounty. Read PoidhClaimNFT contract on Base, verify wallet holds claim NFT for bounty 1151 (or `/a/thezao` album). No claim NFT = no leaderboard entry. Empire Builder boost only applied after on-chain verification. |
| **Phase 1 scope (ship this week)** | Static page that (1) reads bounty 1151 + ZAO album submitters from PoidhV3 contract on Base, (2) displays leaderboard ranked by submission count + linked submission images, (3) shows ZABAL Empire booster status per address via Empire Builder API. NO airdrop button yet - that's Phase 2. |

---

## Part 1 - Empire Builder Mechanics (Confirmed 2026-05-09)

### What it is

**Empire Builder** = `empirebuilder.world` - a permissionless platform that lets any ERC-20 token gain leaderboard + booster + treasury infrastructure. You either deploy a brand-new Clanker token + Empire combo OR attach an Empire to an existing ERC-20.

Three ecosystem entry points:
1. **Web app** at `empirebuilder.world` - Connect wallet, browse Empires, migrate existing tokens, create new Empires
2. **GitBook docs** at `empire-builder.gitbook.io/empire-builder-docs` - human-readable reference + dynamic `?ask=` query for AI-style answers
3. **API** at `https://www.empirebuilder.world/api/...` - REST, JSON, X-API-Key auth

### Empire = ERC-20 + Leaderboard contract

| Component | What it does |
|-----------|--------------|
| ERC-20 token | Any existing or Clanker-launched token; the "currency" of the Empire |
| Empire contract | Wraps the token; manages up to 50 leaderboards per token (`uint8 leaderboardId`) |
| Booster system | Multipliers applied per address based on holdings, NFT ownership, custom rules |
| Treasury | Empire-owned wallet that can distribute, burn, and authorize tokens |
| Guardian | Owner role + co-guardian addresses for treasury operations |

### API endpoints (verified)

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/personal-stats/<empire-token-address>` | POST | Get rank, balance, boost, activeBoosterIds for one address | Confirmed via GitBook example |
| `/api/leaderboard/<empire-token-address>` | (assumed GET/POST) | Get full leaderboard | Per docs: "Get Leaderboard By Empire" |
| `/api/empires` | GET | Paginated empire list | "Get Empires" |
| `/api/empires/top` | GET | Top forged empires | "Get Top Empires" |
| `/api/distribute/<empire-token-address>` | POST (auth-gated) | Bulk send tokens to leaderboard | "Distribute Tokens (Bulk Send)" - exact path TBD; verify in console |
| `/api/empires/deploy` | POST | Deploy Empire for existing ERC-20 | "Deploy Empire for Existing Token" |
| `/api/clanker/deploy-with-empire` | POST | Combined Clanker + Empire deploy | "Deploy Token with Attached Empire" |

### Contract reads (Empire contract on Base)

```solidity
getLeaderboard(uint8 leaderboardId) returns (LeaderboardEntry[])
getAllowedTokens() returns (address[])
```

These are FREE to call via any Base RPC - no API key needed. For BCZ static page, this is the cheap path: skip Empire Builder API entirely and read ZABAL Empire's leaderboard directly via viem + a public Base RPC.

### Auth model

- **Read endpoints** - Some are public, some require X-API-Key. Treat all as needing key until verified otherwise.
- **Write endpoints** (deploy, distribute, burn) - ALWAYS require X-API-Key + signed tx via the Empire's owner/guardian wallet.

### Known integrations

- **Songjam $SANG** - launched on Empire Builder, leaderboard powers SongJam product
- **$ZABAL Empire** - active at `songjam.space/zabal`, deployed via Empire Builder. 24H / 7D / All-time views. Stake multiplier requires 250k SANG min stake. Empire multiplier flows through Empire Builder Booster
- **BizarreBeasts ($BB)** - example Empire featured in docs, contributed real-world use case content
- **Loans on Base** - newest empire as of ZABAL AMA 2 (2026), Adam demoed creating it during the space

---

## Part 2 - $ZABAL Empire Ground Truth

### Where it lives

| Surface | URL |
|---------|-----|
| Leaderboard UI (canonical) | https://songjam.space/zabal |
| ZABAL home / creative hub | https://zabal.art/ |
| Empire Builder canonical | https://empirebuilder.world (search "ZABAL") |
| Token contract address | TBD - get from `empirebuilder.world/<zabal-address>` page or songjam.space/zabal |

### Multiplier stack

Per ZABAL AMA 2 transcript:

| Multiplier | Formula | Source |
|------------|---------|--------|
| Stake multiplier | `1 + sqrt(stakeAmount / 250000 SANG min)` | SongJam staking contract |
| Empire multiplier | Pulled from Empire Builder Booster system | Empire Builder |
| Total points | base balance x stake x empire | Combined onchain + offchain |

### Who owns it

Adam (SongJam founder, ZABAL stakeholder) runs the SANG Empire AND the ZABAL Empire (separate but linked tokens). Zaal coordinates strategy + content sprints + community. Adam controls the Empire's owner/guardian wallet - he is the person who can call `distributeTokens` on the ZABAL Empire contract, OR Zaal can be added as a co-guardian to do it independently.

### What ZAO does today on it

Per ZABAL AMA 2: content sprints. Members create content about ZABAL, submit it, then ZAO Respect-holders vote (on Songjam OR Empire Builder OR Incented). Voting weighted by Respect.

This POIDH-airdrop integration extends the model: instead of voting, the trigger is **on-chain proof of POIDH bounty submission** = automatic ZABAL distribution.

---

## Part 3 - POIDH Data Source (No Public API)

POIDH does not document a public REST API as of 2026-05-09. Three viable data paths:

### Path A: Reverse-engineer poidh.xyz internal API (FAST)

POIDH is a Next.js app. Open DevTools Network tab on any bounty page (e.g. `poidh.xyz/base/bounty/1151`). The client makes XHR/fetch calls to internal endpoints like `/api/bounty/[chainId]/[bountyId]` and `/api/album/[name]/bounties`. These return JSON. Cache + use them.

**Risk:** undocumented API can change without notice. Add caching layer + log when responses break.

### Path B: PoidhV3 contract events on Base (DURABLE)

Contract: `picsoritdidnthappen/poidh-contracts` (GitHub). Read events like `BountyCreated`, `ClaimSubmitted`, `ClaimAccepted`. Filter by issuer = `@thezao` wallet OR by bounty ID.

```typescript
// pseudocode
const claims = await viem.getContractEvents({
  address: POIDH_V3_BASE,
  eventName: 'ClaimSubmitted',
  args: { bountyId: 1151n },
  fromBlock: 'earliest',
});
const submitters = [...new Set(claims.map(c => c.args.claimer))];
```

This is the bulletproof path. Slower to write but doesn't break when POIDH changes their UI.

### Path C: Album scrape via OG image meta

`poidh.xyz/a/thezao` returns `<meta property="og:image" content=".../api/og/album?album=thezao&...participants=0xAAA,0xBBB&...">`. The `participants` query param IS the submitter list, comma-separated 0x addresses. Scrape this for a quick MVP.

**Verified 2026-05-09:** bounty 1151 OG image had `participants=0x7234c36a71ec237c2ae7698e8916e0735001e9af,0x4200ac338555e25b20c8fe82ac02a5c8d4e5a5b4` - 2 submitters confirmed.

### Recommended

**Phase 1 (this week):** Path C - parse OG meta for fast MVP, no on-chain calls. Low cost.
**Phase 2 (production):** Path B - read PoidhV3 events for accurate, real-time submitter list with Sybil protection (verify claim NFT held).

---

## Part 4 - Hats Protocol Integration (If Confirmed)

### What Hats is

Hats Protocol (`hatsprotocol.xyz`) - on-chain ERC-1155 role NFTs in a tree structure. Each "hat" represents a role. Wearers can be granted/revoked. Hats are non-transferable.

### On Base

| Contract | Address |
|----------|---------|
| Hats core | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| Hats SDK | npm `@hatsprotocol/sdk-v1-core` |
| App UI | `app.hatsprotocol.xyz` |

### Tree design for ZAO POIDH

```
ROOT: ZAO Top Hat (admin, wearer = Zaal)
 └─ Child: POIDH Submitter Hat (id: e.g. 0x...0001)
     - Wearer count: unlimited
     - Eligibility: address holds PoidhClaimNFT for /a/thezao bounty
     - Toggle: never expires (or 365d)
     - Mutability: mutable (can be edited)
     - Image: ZAO chevron + camera icon
```

### Cost

| Action | Cost (Base) |
|--------|-------------|
| Create top hat | ~0.0001 ETH (~$0.25) one-time |
| Create child hat | ~0.0001 ETH one-time |
| Mint hat to address | ~0.00005 ETH per address |
| Read hat (check wearer) | FREE (view function) |

For 100 POIDH submitters, total mint cost ~0.005 ETH = ~$12. Cheap.

### Why it matters (if Zaal confirms)

A hat = portable proof of "I submitted to ZAO POIDH". Other apps can read this and grant access (e.g. ZAO Stock priority entry, fractal call invite, future airdrops). Empire Builder booster is ZABAL-specific; Hats are ecosystem-wide.

### When NOT to use Hats

If Zaal just wants the leaderboard + ZABAL airdrop and nothing else, skip Hats. Empire Builder's native booster system covers it. Hats only justifies the cost when you want the role to be portable across surfaces.

---

## Part 5 - BCZ Webpage Spec (`bettercallzaal.com/poidh.html`)

### Goal

Single static HTML page on bettercallzaal.com that:
1. Reads ZAO POIDH album submitters
2. Shows leaderboard (submission count + linked claim images)
3. (Phase 2) Connects Farcaster wallet, lets Zaal trigger ZABAL airdrop

### Sections

```
┌─────────────────────────────────────────────────┐
│  ZAO POIDH LEADERBOARD                          │
│  (BCZ orange/cyan/gold dark theme)              │
├─────────────────────────────────────────────────┤
│  Top stat row:                                  │
│  [Total Submissions] [Total ETH Paid Out]       │
│  [Active Bounties] [Unique Submitters]          │
├─────────────────────────────────────────────────┤
│  Featured: Bounty 1151 (BCZ YapZ Ep 17)        │
│  - Embedded POIDH frame OR linked image         │
│  - Live submitter count + thumbnails            │
├─────────────────────────────────────────────────┤
│  Leaderboard table:                             │
│  Rank | Wallet | FC handle | Submissions | ZABAL│
│   1   | 0x7234 | @user1    |     5       | 250  │
│   2   | 0x4200 | @user2    |     3       | 150  │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  [Admin only] Trigger ZABAL distribution        │
│  (Visible only when connected wallet = Zaal)    │
└─────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Choice | Reason |
|-------|--------|--------|
| HTML/CSS | Hand-written, BCZ palette | Match existing site |
| Wallet connect | `@farcaster/miniapp-sdk` (in mini app) + viem (browser) | Already loaded in BCZ index |
| FC handle resolver | Neynar `getUserByVerifiedAddress` | Have ZAO Neynar API key already |
| POIDH data | Phase 1: parse `/a/thezao` OG meta. Phase 2: PoidhV3 events via Base RPC | Cheap MVP, durable v2 |
| Empire Builder data | `https://www.empirebuilder.world/api/personal-stats/<zabal>` | Per address; cache for 60s |
| Airdrop trigger | Cloudflare Worker proxying Empire Builder bulk-send endpoint | Hides API key |
| ZABAL token math | Read `getLeaderboard()` from ZABAL Empire contract | Free RPC call |

### Files

```
bettercallzaal.com/
├── poidh.html              # NEW - this page
├── poidh-worker.js         # NEW - CF Worker source (deploy separately)
├── index.html              # untouched
├── nexus.html              # add link to /poidh.html
└── assets/
    └── poidh-icon.svg      # NEW - small page icon
```

### Phase 1 ship (1-2 days)

- [ ] Build static `poidh.html` with hardcoded bounty 1151 data + 2 known submitters
- [ ] Hook up Neynar handle resolver for the 2 addresses
- [ ] Layout + dark theme polish
- [ ] Deploy via git push to BCZ main
- [ ] Add link from nexus.html

### Phase 2 ship (1 week)

- [ ] Cloudflare Worker for Empire Builder API proxy
- [ ] Read PoidhV3 events on Base for live submitter list
- [ ] Show ZABAL Empire stats per submitter (rank, boost, balance)
- [ ] Admin-only "Trigger Airdrop" button gated by Zaal's wallet signature
- [ ] Sybil protection: verify claim NFT held before counting submission

### Phase 3 ship (optional, 1 week)

- [ ] Hats Protocol integration if Zaal confirms portable role intent
- [ ] Mint POIDH Submitter Hat per verified submitter
- [ ] Public hat-wearers list as alternative leaderboard view

---

## Part 6 - Bounty 1151 Specifics (Live Reference)

| Field | Value |
|-------|-------|
| URL | https://poidh.xyz/base/bounty/1151 |
| Title | "Find your favorite clip from BCZ YapZ Ep 17 (Hannah / Farm Drop) and post it to either X, Instagram, or YouTube with a written comment about what it says to you." |
| Chain | Base (chainId 8453) |
| Reward | 0.0105 ETH (~$24.30 at $2313.69 ETH price embedded in OG) |
| Participants (verified 2026-05-09) | 2 wallets: `0x7234c36a71ec237c2ae7698e8916e0735001e9af`, `0x4200ac338555e25b20c8fe82ac02a5c8d4e5a5b4` |
| OG image API | `https://poidh.xyz/api/og/bounty?title=...&amount=10500000000000000&chainId=8453&participants=0x7234...,0x4200...` |
| Sub-album | `/a/thezao` (verify) |

This is the seed dataset for Phase 1 MVP.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Empire Builder API base URL | `https://www.empirebuilder.world/api/...` |
| Auth method | `X-API-Key` header (request from team via @glankerempire) |
| Empire leaderboard cap | 50 leaderboards per Empire (`uint8 leaderboardId`) |
| Hats Protocol on Base | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| Hats child hat creation cost | ~0.0001 ETH (~$0.25) |
| Hats mint per address cost | ~0.00005 ETH (~$0.12) |
| ZABAL Empire URL | https://songjam.space/zabal |
| ZABAL stake minimum | 250,000 $SANG (Adam's stake-multiplier formula) |
| Stake multiplier formula | 1 + sqrt(stakeAmount / 250k SANG min) |
| Bounty 1151 reward | 0.0105 ETH on Base |
| Bounty 1151 participants (2026-05-09) | 2 unique wallets |
| ETH price embedded in POIDH OG | $2313.69 (as of 2026-05-09) |
| Phase 1 build est | 1-2 days |
| Phase 2 build est | 1 week |
| Phase 3 (Hats) build est | 1 week |
| BCZ existing pages | 2 (`index.html`, `nexus.html`) |
| BCZ index.html size | 50319 bytes (1378 lines) |
| BCZ nexus.html size | 33784 bytes |

---

## Comparison: Distribution Mechanism Options

| Option | Setup time | Per-recipient cost | Cross-platform portable | Sybil resistance |
|--------|-----------|--------------------|-----------------------|------------------|
| **Empire Builder bulk-send** | Same day (request API key) | Gas split across batch | NO (ZABAL only) | Token-gated by Empire rules |
| **Hats Protocol mint** | 1 hour (set up tree) | ~$0.12/address | YES (ERC-1155, all of Ethereum) | Hat eligibility module |
| **Manual ETH transfers** | Already doable | Per-tx gas | N/A | Trust Zaal's curation |
| **Direct ERC-20 transfers** | Hour | Per-tx gas | N/A | Trust Zaal's curation |
| **Merkle drop** (custom contract) | 2-3 days | Cheap per claim | Limited | Strong (commit-reveal) |

For ZAO POIDH airdrop primary: **Empire Builder bulk-send + Empire Builder booster on submitters' addresses**. Add **Hats Protocol** only if portable cross-platform role is desired.

---

## ZAO Ecosystem Integration

Touchpoints:
- `bettercallzaal.com/poidh.html` (NEW) - this page
- `bettercallzaal.com/nexus.html` - add a "POIDH Leaderboard" tile linking to /poidh.html
- `community.config.ts` (ZAO OS) - reference ZABAL Empire URL + token address
- `bots/poidh/` (per doc 468) - bot can post airdrop notifications
- `bots/poidh/bounty-generator.mjs` (per doc 625) - 18 bounty templates feed page's "active bounties" section

Related docs:
- Doc 625 - POIDH x ZAO bounty playbook (operational, sister doc)
- Doc 468 - POIDH Farcaster bot architecture
- Doc 584 - ZABAL Nexus link inventory (where this page goes in nav)

External integrations to confirm:
- Adam (SongJam) - confirm Zaal wants co-guardian on $ZABAL Empire OR Adam triggers airdrops on Zaal's behalf
- Empire Builder team (`@glankerempire` on X / Farcaster) - request X-API-Key for ZAO/BCZ
- Hats Protocol (only if Phase 3 confirmed) - app.hatsprotocol.xyz tree builder

---

## Sources

- [Empire Builder home](https://empirebuilder.world) - confirmed live, "From Dream to Empire", Vercel-hosted Next.js
- [Empire Builder Docs (GitBook)](https://empire-builder.gitbook.io/empire-builder-docs) - API surface, contract reads/writes, ecosystem participation
- [Empire Builder API: personal-stats endpoint](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/get-leaderboard-stats-for-single-address-within-empire) - confirmed POST + X-API-Key + JSON body pattern
- [Empire contracts read functions](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/contracts/empire-contracts-read) - getLeaderboard, getAllowedTokens
- [ZABAL Empire on songjam.space](https://songjam.space/zabal) - confirmed live, 24H/7D/All views, multiplier formulas
- [ZABAL.art creative hub](http://zabal.art/) - confirmed Empire Builder integration
- [ZABAL AMA 2 transcript (AlphaGrowth)](https://alphagrowth.io/spaces/zabal-ama-2-rugged-twice-to-start) - context on Adam, Loans on Base demo, content sprint mechanic
- [POIDH bounty 1151](https://poidh.xyz/base/bounty/1151) - seed dataset, OG meta confirmed 2 participants
- [Hats Protocol docs](https://docs.hatsprotocol.xyz) - Base contract address, SDK
- [PoidhV3 contracts repo](https://github.com/picsoritdidnthappen/poidh-contracts) - event surface for on-chain reads
- [Bountycaster](https://bountycaster.xyz) - alternative bounty surface, off-chain trust
- ZAO internal: doc 625 (playbook), doc 468 (bot architecture), `community.config.ts`

Verified URLs 2026-05-09: empirebuilder.world HTTP 200, empire-builder.gitbook.io HTTP 200, songjam.space/zabal HTTP 200, poidh.xyz/base/bounty/1151 HTTP 200, zabal.art HTTP 200.

---

## Also See

- [Doc 625 - POIDH x ZAO bounty playbook](../../community/625-poidh-zao-bounty-playbook/) - operational layer (what to post, prize curves)
- [Doc 468 - POIDH Farcaster bot architecture](../../agents/468-zao-farcaster-hub-poidh-hypersub-dual-hub/) - automation layer
- [Doc 584 - ZABAL Nexus link inventory](../../business/584-zabal-nexus-link-inventory/) - where /poidh.html slots in BCZ nav

---

## Implementation Status (2026-05-09)

| Task | Status | Notes |
|------|--------|-------|
| Phase 1 `poidh.html` shipped on bettercallzaal.com | DONE | Dark theme matching nexus.html, stats row, featured bounty 1151, leaderboard table, how-it-works section, API hook documentation w/ copy button |
| `poidh-leaderboard.json` shipped at root | DONE | Compatible with Empire Builder apiLeaderboards format |
| nexus.html updated with leaderboard link | DONE | Listed under "The ZAO" alongside POIDH album |
| BCZ git push -> auto-deploy via main | DONE | Live at bettercallzaal.com/poidh.html |
| "Haatz" clarification | RESOLVED | = free Neynar API. Page links submitter wallet to Farcaster profile via farcaster.xyz/~/profile?address=... query (no key needed for the public profile route). |
| Hats Protocol integration | DROPPED | Was not what Zaal meant; Phase 3 of original plan deleted. |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send `https://bettercallzaal.com/poidh-leaderboard.json` URL to Empire Builder team / $ZABAL Empire guardian (Adam) for apiLeaderboards configuration | @Zaal -> @Adam / @glankerempire | DM | Today |
| Confirm $ZABAL Empire token address + leaderboard ID once apiLeaderboard is created | @Zaal | DM | This week |
| Update `poidh-leaderboard.json` as new POIDH bounties land submitters (or build automation) | @Zaal | File edit / Phase 2 | Ongoing |
| Phase 2 - replace static JSON with PoidhV3 event indexer (Cloudflare Worker reads Base RPC, returns live JSON) | @Zaal | New CF Worker | Next 2-3 weeks |
| Phase 2.5 - resolve submitter wallets to Farcaster handles via Neynar free tier and embed in JSON feed | @Zaal | Worker addition | Phase 2 |
| Phase 3 - Sybil protection: only count addresses with verified PoidhClaimNFT for ZAO album bounties | @Zaal | Worker addition | After Phase 2 |
| Re-validate Empire Builder apiLeaderboards endpoint in 30 days | @Zaal | Doc update | 2026-06-09 |
