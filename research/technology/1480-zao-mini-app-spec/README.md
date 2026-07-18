# 1480 — ZAO Farcaster Mini App: Product Specification (Jul 2026)

**Type:** PRODUCT-SPEC  
**Topic:** Technology  
**Status:** SEND TO NEYNAR/ARTHUR BY JUL 25 (doc 1463). Phase 1 target: Aug 15. This is the canonical spec document.

---

## Overview

The ZAO Mini App is a Farcaster-native mini application that brings WaveWarZ live battle voting into Farcaster casts. Users can vote on active WaveWarZ battles, see live stats, and trigger ZOR token interactions — all without leaving Farcaster.

**Why this matters:**
- Farcaster frames/mini apps = highest engagement surface in web3 social (2026)
- Every WaveWarZ battle announcement becomes an interactive vote, not just a text cast
- ZOR holders can participate in Community Battle proposals from Farcaster
- ZAOOS doc 1473 committed to frame integration after Mini App Phase 1 (Aug 15)

---

## Scope: Three Phases

### Phase 1 (Target: Aug 15) — Battle Vote Frame
A Farcaster mini app frame that shows a live WaveWarZ battle and lets users cast a vote (predict the winner).

**What it does:**
- Displays artist A vs artist B with battle stats (SOL pool, time remaining)
- Two buttons: [Vote Artist A] / [Vote Artist B]
- On vote: confirms vote, shows current vote distribution
- Links to full battle on wavewarz.info

**What it does NOT do (Phase 1):**
- No wallet connection (votes are off-chain signals, not on-chain bets)
- No ZOR gating
- No ZOR token interaction

**Why Phase 1 is off-chain votes only:** Easiest to build, no crypto onboarding friction, immediately deployable. Demonstrates demand. Phase 2 adds on-chain.

---

### Phase 2 (Target: Oct 3 / ZAOstock) — On-Chain Voting + ZOR Integration
Connects Farcaster user's wallet. Actual WaveWarZ prediction market interaction.

**What it adds:**
- Wallet connect (Privy or direct)
- Real on-chain bet placement (SOL)
- ZOR holder badge (displays ZOR balance, unlocks special vote button)
- Community Battle proposal voting (ZOR holders only)

---

### Phase 3 (Target: Q1 2027) — Full ZAO Dashboard
Full mini app experience for ZAO community management.

**What it adds:**
- Governance session reminder and RSVP
- ZAOstock event hub (RSVP, schedule, battle results)
- Personal ZOR balance + Respect score display
- Artist earnings leaderboard

---

## Phase 1 Technical Specification

### Frame Architecture

Farcaster Mini Apps use the Frames v2 spec (updated early 2026). Key endpoints:

**Frame URL:** `https://wavewarz.info/frame/battle/{battle_id}`

**Frame metadata (in `<head>` of wavewarz.info battle pages):**
```html
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="https://wavewarz.info/frame/battle/{id}/image" />
<meta property="fc:frame:button:1" content="Vote {ARTIST_A}" />
<meta property="fc:frame:button:2" content="Vote {ARTIST_B}" />
<meta property="fc:frame:post_url" content="https://wavewarz.info/frame/battle/{id}/vote" />
```

**Dynamic image generation (GET `/frame/battle/{id}/image`):**
Returns a 1200×630 PNG (standard Farcaster frame size) with:
- Artist A name + photo (from Audius) on left
- Artist B name + photo on right
- Current SOL pool size
- Time remaining in battle
- Current vote distribution (if voted: show live %)
- ZAO/WaveWarZ branding

**Vote handler (POST `/frame/battle/{id}/vote`):**
- Receives Farcaster frame action payload
- Extracts: FID (Farcaster user ID), button_index (1=A or 2=B)
- Stores vote in Supabase: `{fid, battle_id, choice, timestamp}`
- Returns updated frame image showing vote confirmation + current %

### Data Sources

| Data | Source |
|---|---|
| Battle list (current active battles) | `wavewarz.info/api/public/stats` |
| Artist names + battle IDs | WaveWarZ API (Hurricane provides endpoint) |
| Artist photos | Audius API (pull by handle) |
| SOL pool size | WaveWarZ API |
| Time remaining | WaveWarZ API |
| Vote storage | Supabase (new table: `frame_votes`) |
| Vote tallies | Supabase COUNT by battle_id + choice |

### Supabase Schema (new table)

```sql
CREATE TABLE frame_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL,
  battle_id TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fid, battle_id)  -- one vote per FID per battle
);
```

---

## ZOE Integration Protocol

When ZOE posts a MAIN battle announcement on Farcaster (after Phase 1 is live):

**Pre-Phase 1 cast format (current):**
```
WaveWarZ MAIN Battle: [ARTIST_A] vs [ARTIST_B]
Pool: X SOL | Closes: [DATE]
→ wavewarz.info/battles/[ID]
```

**Post-Phase 1 cast format (after Aug 15):**
```
WaveWarZ MAIN Battle: [ARTIST_A] vs [ARTIST_B]
Pool: X SOL | Closes: [DATE]

Vote in this cast 👇
[FRAME EMBED — vote button appears inline]
```

ZOE sends the cast URL with `embeds=[frame_url]` to the Farcaster API (Neynar `/v2/cast`).

---

## Hurricane's Build Requirements

The following items require Hurricane (WaveWarZ platform engineer) to implement or expose:

1. **API endpoint for active MAIN battles** — needs a list of `{battle_id, artist_a, artist_b, sol_pool, closes_at}` for current active MAIN battles. If this already exists in the public stats API, confirm the exact endpoint and schema.

2. **Frame metadata on battle pages** — Hurricane adds `fc:frame` meta tags to `wavewarz.info/battles/{id}` pages.

3. **Frame image generation** — Hurricane builds the image endpoint OR Zaal builds it externally (Next.js image generation on ZAOOS or a Vercel function).

4. **Vote handler** — Hurricane or Zaal builds POST endpoint that stores votes and returns updated frame.

**DECISION NEEDED:** Does Hurricane build the frame infra on wavewarz.info, or does Zaal build it as a separate Next.js app (e.g., on Vercel) that calls the WaveWarZ API? Recommendation: Zaal builds externally first (faster, no impact on production site), then Hurricane can fold it in later.

---

## Neynar / Arthur DM (Send Jul 25)

Send this DM to Arthur at Neynar by Jul 25 (from doc 1368, partner DM pack):

```
Hey Arthur —

Following up on the ZAO Mini App conversation. I've written a full spec for the Phase 1 
Farcaster battle vote frame. Here's the plan:

Phase 1 (Aug 15): Vote frame on active WaveWarZ MAIN battles — Farcaster users vote 
on the winner, we surface live % in the cast. Off-chain votes, no wallet required.

Phase 2 (ZAOstock Oct 3): On-chain integration + ZOR holder features.

A few questions for you:
1. Any gotchas with Farcaster Frames v2 spec we should know about?
2. Does Neynar have a recommended image generation approach for frames?
3. Can you amplify our first Mini App cast when we go live Aug 15?

Full spec in our research archive: [ZAOOS link to this doc 1480]

Thanks — Zaal
```

---

## Success Metrics (Phase 1)

By Sep 1 (2 weeks post-launch):

| Metric | Target |
|---|---|
| Casts with frame embeds | ≥ 5 (one per MAIN battle) |
| Total frame votes | ≥ 100 |
| Unique FIDs voting | ≥ 50 |
| /wavewarz channel followers (per doc 1473) | On track for 200 by Sep 1 |
| Neynar amplification (Arthur recast) | At least 1 recast from Arthur |

---

## Related Docs

- 1463 — Neynar/Arthur DM + Mini App Brief (background; send Jul 25)
- 1473 — Farcaster /wavewarz Channel Plan (frame integration on every MAIN cast post-Phase 1)
- 1427 — WaveWarZ API Documentation (data endpoints for frame)
- 1350 — WaveWarZ Platform Explainer 101 (what the frame represents)
- 1469 — WaveWarZ Platform State Snapshot (frame drives new traffic to platform)
- 1368 — Partner Outreach DM Pack (Arthur/Neynar DM template Jul 25)
