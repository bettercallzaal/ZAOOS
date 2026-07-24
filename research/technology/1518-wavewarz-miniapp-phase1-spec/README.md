# 1518 — WaveWarZ Mini App Phase 1 Deployment Spec

**Type:** TECH-SPEC  
**Topic:** Technology  
**Status:** BUILD NOW — Hurricane to ship Phase 1 by Aug 15. This spec is the handoff doc.

---

## Phase Scope

### Phase 1 (Ship by Aug 15): Battle Viewer
A read-only Farcaster Mini App that shows the current WaveWarZ battle state. No voting — just data display.

**User sees:**
- Current live MAIN battle (if any): artists, vote counts, SOL pool, time remaining
- Last completed MAIN battle: winner, loser, SOL earned by each
- Platform summary tile: total battles, total SOL, artist payout total

**User does not do (Phase 1):** vote, connect wallet, sign transactions

### Phase 2 (Sep target): Battle Voter
Adds voting functionality:
- Connect wallet (Phantom/Solana wallet)
- Cast vote for active battle
- View own vote history and earnings

### Phase 3 (Oct target): Full Integration
- ZOR holder governance interface
- Community battle proposals
- ZABAL S2 participant tracking

---

## Technical Stack

### Farcaster Snaps / Mini App Framework
The Mini App should be built as a **Farcaster Snap** (also called "Mini App" or "Frame") using the Frames v2 specification. It lives at a URL and is embedded in Farcaster casts.

**Framework options (choose one):**
- **Option A: frames.js** (recommended) — open-source Frames SDK, supports Next.js, well-documented
- **Option B: @coinbase/onchainkit** — includes Mini App utilities, integrates with Base
- **Option C: Raw fetch** — low-level HTML + Next.js API routes, maximum control

**Recommendation: frames.js on Next.js** — Hurricane likely already knows Next.js, and frames.js has extensive examples.

### Hosting
**Vercel** (free tier is sufficient for Phase 1)
- Deploy from GitHub repo
- Add environment variables for WaveWarZ API base URL
- Set up custom domain path: `miniapp.wavewarz.info` or `wavewarz.info/miniapp`

**Domain setup:**
- Current: wavewarz.info hosted on [Hurricane's setup — check]
- Add subdomain or path route for Mini App
- Vercel auto-deploys on push to main branch

---

## API Endpoints (WaveWarZ Public API)

All data for Phase 1 comes from the public WaveWarZ API. No authentication needed.

### Primary Endpoint
```
GET https://wavewarz.info/api/public/stats
```

**Response (Jul 2026 format — verified 2026-07-24):**
```json
{
  "updatedAt": "2026-07-24T17:36:58.703Z",
  "solPriceUsd": 73.87,
  "volume": {
    "totalSol": 878.30,
    "last7dSol": 355.36
  },
  "liveBattle": null,
  "artistPayouts": {
    "totalSol": 13.40
  },
  "traderClaims": {
    "totalSol": 381.20,
    "withdrawalCount": 1526
  },
  "platformRevenue": {
    "totalSol": 20.04
  },
  "battles": {
    "total": 1289,
    "mainEvents": 51,
    "mainBattles": 165,
    "quickBattles": 1088,
    "communityBattles": 36
  }
}
```

### Live Battle Endpoint (if available)
Check if `wavewarz.info/api/public/battles/live` or similar exists — if yes, use it for the "current battle" tile. If not, the Phase 1 app shows only historical stats.

**ZOE can verify:** `fetch('https://wavewarz.info/api/public/stats')` — confirm endpoint returns JSON.

---

## Mini App UI Spec (Phase 1)

### Screen 1: Platform Dashboard (Default View)
```
┌─────────────────────────────────────┐
│  🎵 WaveWarZ                        │
├─────────────────────────────────────┤
│  Total Battles: 1,289               │
│  Volume: 878.30 ◎                   │
│  Artist Payouts: 13.40 ◎            │
├─────────────────────────────────────┤
│  [ Last Battle ]                    │
│  [Artist A] beat [Artist B]         │
│  Winner: +0.042 ◎ · Loser: +0.012 ◎│
├─────────────────────────────────────┤
│  [See Live Battle] [RSVP ZAOstock]  │
└─────────────────────────────────────┘
```

### Screen 2: Live Battle View (if live battle exists)
```
┌─────────────────────────────────────┐
│  🔴 LIVE BATTLE                     │
├─────────────────────────────────────┤
│  Artist A                           │
│  Votes: 42  ████████░░             │
│                                     │
│  vs                                 │
│                                     │
│  Artist B                           │
│  Votes: 28  ██████░░░░             │
├─────────────────────────────────────┤
│  Pool: 0.42 ◎                       │
│  Closes in: 2h 14m                  │
├─────────────────────────────────────┤
│  [Vote on wavewarz.info →]          │
└─────────────────────────────────────┘
```

Note: Phase 1 does NOT have in-app voting — the [Vote] button opens wavewarz.info in browser.

### Screen 3: ZAOstock CTA (Oct 1-3 special mode)
During the 3 days before ZAOstock, replace the dashboard with:
```
┌─────────────────────────────────────┐
│  ZAOstock: [N] days away            │
│  October 3 · Ellsworth, Maine       │
├─────────────────────────────────────┤
│  [RSVP Now: wavewarz.info/zaostock] │
└─────────────────────────────────────┘
```

---

## Hurricane's Build Tasks

From doc 1503 (DM #7 to Hurricane, Jul 25):

**Task 1: Mini App Phase 1 Vercel Setup**
- Create new Next.js project using frames.js template
- Connect to GitHub repo (create `wavewarz-miniapp` or add to existing repo)
- Deploy to Vercel
- Test: Farcaster cast with the Mini App frame URL should embed in Warpcast

**Task 2: llms.txt deploy**
- Add `/llms.txt` route to wavewarz.info (or miniapp subdomain)
- Content: ZAO/WaveWarZ description for AI crawlers
- See doc 1438 for llms.txt content spec

**Task 3: Eventbrite link on homepage**
- Add ZAOstock RSVP button to wavewarz.info homepage
- Links to: [Eventbrite URL from doc 1508]
- Placement: above the fold or in the hero section

---

## Testing Checklist

Before Aug 15 launch:

- [ ] Mini App URL loads in browser: `https://[domain]/miniapp`
- [ ] Farcaster cast with Mini App URL: open in Warpcast, confirm frame embeds
- [ ] Stats display correctly (compare to wavewarz.info/api/public/stats)
- [ ] Mobile layout: test on iPhone + Android via Warpcast
- [ ] [Vote] button redirects to wavewarz.info (not broken link)
- [ ] [RSVP ZAOstock] button links to Eventbrite URL
- [ ] Stats auto-refresh or show timestamp ("Last updated: X min ago")

---

## Launch Protocol

**On Aug 15:**
1. Hurricane confirms Mini App URL is live and passes testing checklist
2. Zaal announces in /wavewarz channel on Farcaster (doc 1514 cast template)
3. ZOE updates doc 1499 (ZOE daily ops): add Mini App URL to the 7PM EOD report
4. Post on X @wavewarz: "WaveWarZ is now on Farcaster. Open in Warpcast: [URL]"
5. Add Mini App URL to doc 1483 (press kit) and doc 1480 (Mini App spec)

---

## Neynar/Arthur Consultation (Doc 1503 DM #3)

Before finalizing the Mini App spec, ZOE or Zaal should confirm with Arthur (Neynar) that:
- The Mini App Snaps architecture supports the use case (battle voting view)
- There are no limits on external data fetches within Snaps
- The Farcaster Mini App discovery mechanism is clear (what channels show frames?)

Send DM on Jul 25 per doc 1503, get response before starting Phase 2 voting implementation.

---

## Related Docs

- 1480 — WaveWarZ Mini App Spec (earlier full spec — this doc is Phase 1 execution detail)
- 1514 — /wavewarz Farcaster Sprint Plan (launch announcement uses this Mini App)
- 1503 — Jul 25 Partner DMs (DM #3 = Neynar, DM #7 = Hurricane build tasks)
- 1438 — llms.txt Deployment Guide (Hurricane Task 2)
- 1508 — ZAOstock Eventbrite Launch Pack (Eventbrite URL for Mini App CTA)
- 1499 — ZOE Daily Ops Report (add Mini App URL to 7PM report after launch)
