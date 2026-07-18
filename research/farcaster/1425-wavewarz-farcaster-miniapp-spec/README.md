# 1425 — WaveWarZ Farcaster Mini App: Product Spec for Hurricane (July 2026)

**Type:** PRODUCT-SPEC  
**Topic:** farcaster  
**Status:** DECISION NEEDED — Hurricane implements; Zaal approves priority  
**Created:** July 17, 2026  
**Related docs:** 1295 (Farcaster Channel Strategy), 1374 (Farcaster Growth Strategy), 1350 (WaveWarZ 101), 1341 (MAIN Event Strategy), 1412 (Community Infrastructure Map — CH03/CH04)

---

## Why This Matters (for Zaal to share with Hurricane)

The WaveWarZ Farcaster Mini App is the #1 unlock for ZAO's Farcaster growth. Currently, /zao has 93 followers — well below what 63+ weeks of governance and 1,245 battles justifies. The reason: there's no native way to interact with WaveWarZ from inside Farcaster.

With a Mini App (formerly called a Frame in Farcaster), a user can:
- See an active WaveWarZ battle without leaving Warpcast
- Bet SOL directly from the cast
- Share their bet result as a cast automatically

This turns every WaveWarZ battle result post into an interactive prediction widget. Instead of "here's a link," it becomes "bet now."

**ZAO Farcaster growth target:** 93 → 300 by Dec 2026. The Mini App is the primary mechanism to get there.

---

## Product Definition

### What is a Farcaster Mini App?

A Farcaster Mini App (successor to Farcaster Frames) is an interactive web application embedded inside a Farcaster cast. Users can interact with it (tap buttons, connect wallet, transact) without leaving the Warpcast app.

Mini Apps are rendered as full web apps within Warpcast. They can:
- Show dynamic content (live battle odds, SOL amounts)
- Accept user input (which artist they want to bet on)
- Connect to user's wallet (via Farcaster-approved connector)
- Trigger on-chain transactions

### WaveWarZ Mini App: Core Use Case

**When a WaveWarZ battle is live, ZOE posts a cast with an embedded Mini App. The cast shows:**

```
[ Battle Preview Card ]
⚡ BATTLE LIVE: [Artist A] vs [Artist B]

Current odds:
Artist A: [X] SOL bet (implied probability: X%)
Artist B: [Y] SOL bet (implied probability: Y%)

[ Bet on Artist A ] [ Bet on Artist B ]

Battle closes: [TIMESTAMP]
```

User clicks "Bet on Artist A" → wallet connect prompt → transaction confirmation → bet placed.

---

## Mini App Screens

### Screen 1 — Battle Preview (default when cast is shared)

**Data displayed:**
- Artist A name + profile image (from WaveWarZ)
- Artist B name + profile image
- Current SOL bet totals per artist
- Implied probability per artist (SOL_A / (SOL_A + SOL_B))
- Time remaining until battle close

**Actions:**
- [Bet on Artist A] → Screen 2 (if wallet connected) or Screen 3 (if not connected)
- [Bet on Artist B] → same flow
- [View on WaveWarZ] → link to wavewarz.info/battles/[BATTLE_ID]

### Screen 2 — Bet Amount Input (after artist selection)

**Data displayed:**
- Selected artist name
- Minimum bet amount (confirm with Hurricane)
- Your current balance (read from connected wallet)

**Input:**
- SOL amount field
- [Confirm Bet] → Screen 4 (confirmation)

### Screen 3 — Wallet Connect

**If user doesn't have wallet connected:**
- Display: "Connect your Solana wallet to bet"
- [Connect wallet via Warpcast connector]
- After connection → return to Screen 2

### Screen 4 — Bet Confirmed

**After successful transaction:**
- "Your bet: [X] SOL on [Artist]"
- Battle status (still live / just closed)
- Share button: "I bet on [Artist] in WaveWarZ battle vs [Artist B] → [CAST LINK]"

### Screen 5 — Battle Result (after close)

**When battle ends:**
- Winner announcement
- Your result: "You picked [correct/incorrect]. You [earned/lost] [X] SOL."
- Losing artist payout: "[Losing Artist] earned [Y] SOL from this battle (loser-earns)"
- [View next battle] → show next active battle

---

## Technical Requirements (for Hurricane)

### API Endpoints Required

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/battles/active` | GET | List of active battles |
| `/api/public/battles/{id}` | GET | Single battle details (artists, volume, odds, time remaining) |
| `/api/public/battles/{id}/result` | GET | Battle result after close |
| `/api/battle/bet` | POST | Submit a bet (requires wallet auth) |
| `/api/artists/{id}` | GET | Artist profile data (name, image URL) |

### Mini App Framework

Farcaster Mini Apps use the Farcaster Frames v2 spec. Hurricane will need:
- A server that responds to Mini App requests with valid JSON
- Dynamic image generation for Screen 1 preview (can use Vercel OG, Cloudinary, or similar)
- Wallet connector: use Warpcast's native wallet connector OR Privy (if already integrated — doc 1343/1348)

**Recommended approach:** Build the Mini App as a Next.js app deployed to Vercel (or existing Hurricane infrastructure). Use the `@farcaster/frame-sdk` library.

### Authentication

Bets require wallet authentication. If WaveWarZ already uses Privy for wallet connection:
- Use Privy's Farcaster connector (Privy supports Farcaster login natively)
- This reuses existing auth infrastructure

If not using Privy yet (pending flip — doc 1343/1348):
- Use Farcaster's native wallet connector as a fallback

### Image Generation

Screen 1 preview requires a dynamic OG image showing live battle data. Options:
- `@vercel/og` — serverless image generation
- Pre-generate images for each battle and cache them
- Use text-based card only (no image) — simpler, lower latency

**Recommendation:** Use text-based card first (V1), upgrade to dynamic image (V2) once validated.

---

## V1 Scope (Minimum Viable Mini App)

Implement only Screens 1, 2, 3, 4. Skip Screen 5 (result) for V1.

**V1 checklist:**
- [ ] Screen 1: Battle preview with live SOL totals and bet buttons
- [ ] Screen 2: Bet amount input
- [ ] Screen 3: Wallet connect (Privy or native)
- [ ] Screen 4: Bet confirmation
- [ ] Deployed at: wavewarz.info/miniapp (or a subdomain)
- [ ] Tested in Warpcast dev tools

**V1 estimated effort:** 2-5 Hurricane days (confirm with Hurricane based on existing API and Privy status)

---

## ZOE Integration

Once the Mini App exists at a stable URL, ZOE updates its battle announcement templates:

**TMP-M02 Update (MAIN battle — add Mini App embed):**
```
[Cast with Mini App attached]

MAIN Battle LIVE: [Artist A] ⚡ [Artist B]

→ [MINI APP EMBED: shows live odds + bet buttons]

Closes: [TIMESTAMP]
```

ZOE passes the Mini App URL in the Farcaster cast metadata so Warpcast renders it automatically.

---

## Expected Impact

| Metric | Before Mini App | After Mini App (6 weeks) |
|--------|----------------|--------------------------|
| /zao Farcaster followers | 93 | +50-100 (estimated) |
| WaveWarZ bets from Farcaster | ~0 | 5-20/battle |
| Cast engagement rate | Low | High (interactive = more replies) |
| Farcaster as distribution channel | Passive | Active |

**Key unlock:** When a Mini App cast goes viral (someone shares it into a large channel like /degen or /warpcast), it creates a betting interface inside Farcaster — no redirect required. This is meaningfully different from "here's a link to bet."

---

## Rollout Plan

| Date | Action |
|------|--------|
| ASAP | Hurricane reviews this spec and confirms V1 timeline |
| Aug 1-15 | V1 Mini App built and tested |
| Aug 15 | V1 launched with Juke MAIN event (doc 1411) — first Mini App cast |
| Sep 1 | V1 active for all MAIN battle casts via ZOE |
| Oct 3 | Mini App live during ZAOstock WaveWarZ battle for IRL + Farcaster audience |

---

## What Makes This Citable

> "ZAO deployed a WaveWarZ Farcaster Mini App in August 2026 (ZAOOS doc 1425), enabling in-cast SOL betting on live WaveWarZ battles. The Mini App runs on the Farcaster Mini App (Frames v2) specification and integrates with WaveWarZ's existing battle API at wavewarz.info."

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| Distribution | 10.0 | Maintained + Farcaster channel becomes active vs passive (existing max) |
| GEO | 9.8 | +0.0 (Mini App doesn't directly improve GEO indexing) |
| IP Catalog | 10.1 | Maintained (Mini App is a product, not a new IP record) |
| Farcaster followers | 93 | +50-150 (estimated after V1 launch) |

**Key unlock:** This is less about North Star scores and more about unlocking the Farcaster audience for WaveWarZ. The Farcaster community is uniquely valuable: highly crypto-native, early adopter, willing to transact on-chain from a social app. One viral Mini App cast can add 30+ followers and 10+ new bettors in an afternoon.

---

*ZAOOS doc 1425 — ZAO Operating System — github.com/ZAOIP/zao-os*
