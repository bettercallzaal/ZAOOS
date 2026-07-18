# 1692 — WaveWarZ Farcaster Mini App Spec (Build Target 2026)

**Type:** BUILD-SPEC  
**Topic:** Technology  
**Status:** PLANNING — Listed as OP RF use-of-funds item (doc 1470). Hurricane build target Q4 2026. ZOE uses it for battle share frames. This doc is the design spec for the engineering team.

---

## What This Is

A Farcaster Mini App (formerly Frames v2) that lets users:
1. View live and recent WaveWarZ battles
2. Share a battle card to any Farcaster cast
3. Vote in an active WaveWarZ battle directly from Farcaster (via wallet connection)
4. See real-time payout when a battle settles

**Why Farcaster over a standalone page:**
- Farcaster's Mini App standard embeds interactive apps inside casts — no link-out friction
- The `/wavewarz` and `/zao` Farcaster channels are already active communities
- Battle result frames go viral organically in the channels artists use
- ZOR holders are disproportionately on Farcaster
- Farcaster's Warpcast mobile client supports Mini Apps natively (iOS + Android)

---

## User Flows

### Flow 1: Battle Share Card (ZOE posts)

When a WaveWarZ battle settles, ZOE automatically posts a Mini App frame to `/wavewarz`:

```
[Artist A] vs [Artist B]
SETTLED

[Artist A] won
[Artist B] earned [X] SOL — automatic

[Watch Replay] [View Stats] [Share]
```

The frame is a Mini App — tapping "Watch Replay" opens a full battle card with:
- Artist names + Audius handles
- Battle duration
- Final vote split (% for each artist)
- Payout amounts (winner traders / losing artist / winning artist)
- Solana TX link

### Flow 2: Live Battle View

During an active battle, ZOE posts a frame with:
- Live vote split bar (updates every ~30 seconds via API polling)
- Time remaining
- Current total SOL staked
- "Vote now →" button (opens Mini App with wallet connect)

### Flow 3: In-Frame Voting

The Mini App allows ZOR holders or any Farcaster user to:
1. Connect wallet (Phantom, via WalletConnect)
2. Select artist to back
3. Choose stake amount in SOL
4. Sign and broadcast transaction

**Technical note:** WaveWarZ voting is on Solana. Farcaster is Ethereum-native. The Mini App uses WalletConnect with Solana chain selection — this is supported in Farcaster frames via the `wallet_sendTransaction` action on Solana.

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frame standard | Farcaster Mini App (v2) — `@farcaster/frame-sdk` |
| Frontend | Next.js (extends existing zaoos.com / wavewarz.info) |
| API data | wavewarz.info/api/public/stats + battle endpoints |
| Wallet | WalletConnect v3 + Solana chain |
| Hosting | Vercel (existing) |
| Caching | Redis or Supabase for battle state (avoid hot-path API hammering) |

### Key Endpoints Used

| Data | Endpoint |
|------|---------|
| All battles | `wavewarz.info/api/public/stats` |
| Active battles | `wavewarz.info/api/public/battles?status=active` |
| Battle detail | `wavewarz.info/api/public/battles/{id}` |
| Settlement data | On-chain TX via Helius RPC |

### Frame Metadata

Every Mini App frame needs an `fc:frame` meta tag in the HTML head:

```html
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="https://wavewarz.info/api/frame/battle/{id}/image" />
<meta property="fc:frame:button:1" content="View Battle" />
<meta property="fc:frame:button:1:action" content="launch_frame" />
<meta property="fc:frame:button:1:target" content="https://wavewarz.info/frame/battle/{id}" />
```

### Dynamic Battle Image Generation

Each battle needs a unique OG image for the frame. Generate server-side with `@vercel/og` or `satori`:

```
POST /api/frame/battle/{id}/image
→ Returns: PNG (1200×630)
  - ZAO Black background #0A0A0A
  - Artist A name (left) vs Artist B name (right)
  - Vote split bar (WaveWarZ Blue #0047FF / Battle Red #FF2D2D)
  - Status: LIVE / SETTLED
  - Total SOL staked
```

---

## Build Phases

### Phase 1: Read-Only Battle Cards (Ship by Sep 1, 2026)

**Scope:**
- Auto-generated battle image (satori)
- Static frame: "View Battle" → battle detail page on wavewarz.info
- ZOE posts frame after every battle settlement

**Hurricane build targets:**
- `GET /api/frame/battle/{id}/image` — OG image generator
- `/frame/battle/{id}` — Mini App route with frame metadata
- ZOE trigger: after battle settlement event, compose frame cast

**Effort:** ~2-3 days engineering

### Phase 2: Live Battle Frames (Ship by Oct 1, 2026)

**Scope:**
- Live vote split polling (30-second refresh via client-side fetch)
- Time remaining display
- "Vote now →" deep-link to wavewarz.info (not in-frame yet — link-out is acceptable)

**Effort:** ~1 day on top of Phase 1

### Phase 3: In-Frame Voting (Post-ZAOstock, Q4 2026)

**Scope:**
- `wallet_sendTransaction` for Solana within the Mini App
- Full voting flow without leaving Farcaster
- ZOR holder badge (shows "ZOR Holder" badge if user holds ZOR on Optimism)

**Dependencies:**
- WalletConnect Solana support in Warpcast (confirm support before building)
- Helius webhook for real-time settlement events
- Supabase session management

**Effort:** ~5-7 days engineering

---

## ZOE Integration

After every WaveWarZ battle settles:

1. ZOE receives Helius webhook (or polls WW API every 5 min)
2. ZOE calls `POST /api/frame/battle/{id}/image` to pre-generate the image (cache for 24h)
3. ZOE composes the cast:

```
Battle settled.

[Artist A] won.
[Artist B] earned [X] SOL — automatic.

Open on Farcaster: [frame URL]
wavewarz.info
```

4. ZOE casts to `/wavewarz` channel

**ZOE post types using the Mini App frame:**
- Battle settlement recap (every battle, Phase 1)
- MAIN battle announcement (for COC Concertz MAIN battles, include ZOR holder vote link)
- Weekly stats summary (every Sunday, summary frame with WW API stats)

---

## Africa Battle Week Frame Campaign (Sep 22-26)

During Africa Battle Week, ZOE runs a daily frame campaign:

Each day (Sep 22-26):
- Morning: "Today's Africa Battle Week battles are live" frame
- After each settlement: battle result frame
- Evening: daily stats summary frame

All frames include: "Africa Battle Week. Loser earns. Automatic."

---

## Design Spec

**Frame image dimensions:** 1200×630 (standard OG)  
**Background:** ZAO Black `#0A0A0A`  
**Primary text:** ZAO White `#F5F5F5`  
**Artist A color:** WaveWarZ Blue `#0047FF`  
**Artist B color:** Battle Red `#FF2D2D`  
**SOL payout highlight:** Earn Green `#00CC66`  
**Font:** Space Grotesk (matches ZAO visual identity, doc 1627)  
**Logo:** ZAO wordmark top-left, WaveWarZ wordmark top-right

**Battle card layout:**
```
┌──────────────────────────────────────────────┐
│  ZAO                              WaveWarZ   │
│                                              │
│  [Artist A]          vs          [Artist B]  │
│                                              │
│  ██████████████████░░░░░░░░░░░░░░░░░░░░░░░  │
│  62%                                    38%  │
│                                              │
│  SETTLED                    0.42 SOL total   │
│  Artist A won               [Artist B]: EARNED 0.021 SOL │
│                                              │
│  wavewarz.info                               │
└──────────────────────────────────────────────┘
```

---

## OP Retro Funding Context

The WaveWarZ Farcaster Mini App is listed as a use-of-funds item in the ZAO OP RF application (doc 1470):

> "WaveWarZ Farcaster Mini App — bringing on-chain battle voting and settlement visibility into the Farcaster ecosystem natively."

Building this creates:
1. A distribution surface native to Optimism's primary social layer (Farcaster)
2. ZOR holder visibility (on-chain Optimism identity surfaced in Farcaster)
3. A cited "use of funds" deliverable for the OP RF application

**Citation after ship:** "ZAO deployed a WaveWarZ Farcaster Mini App (Phase 1) enabling battle result frames in the /wavewarz channel, reaching [N] Farcaster followers with on-chain settlement data."

---

## Related Docs

- 1644 — WaveWarZ On-Chain Settlement Mechanics (the canonical mechanics reference)
- 1675 — Farcaster Content Calendar Sep 2026 (cadence for ZOE posts using frames)
- 1627 — ZAO Visual Identity Spec (design tokens for frame images)
- 1652 — ZAO GEO FAQ Content Spec (Hurricane build companion)
- 1470 — OP RF Submission Guide (mini app = use-of-funds deliverable)
- 349 — ZABAL Staking Mini App Options (related Farcaster Mini App research)
