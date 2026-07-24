# 1463 — WaveWarZ Farcaster Mini App: Product Spec

**Type:** PRODUCT-SPEC  
**Status:** DECISION NEEDED — share with Neynar (Arthur) via DM on Jul 25; Hurricane builds  
**Related:** 1368 (partner DMs — Neynar DM Jul 25), 1343 (partner activation — Neynar role), 1427 (API docs — Mini App uses these endpoints), 1456 (Jul 25 action wave)

---

## Purpose

A Farcaster Mini App (formerly Frames v2) allows WaveWarZ to be embedded natively in Farcaster casts. Users can:
- See live battle stats without leaving Warpcast
- Vote on a WaveWarZ battle directly from a Farcaster cast
- View battle results inline

**Why this matters:**
- Farcaster /wavewarz has ~[X] followers (ZOE: pull current count)
- Neynar is the infrastructure layer for Farcaster frames/mini apps
- Arthur from Neynar is a warm contact (doc 1343/1368)
- Mini App = every ZOE battle post becomes a live, interactive component

---

## Core Use Cases (Priority Order)

### Use Case 1: Live Battle Vote Widget (MVP)
**What it shows when opened from a ZOE battle announcement cast:**
- Battle name: "[Artist A] vs [Artist B]"
- Vote count: "143 votes cast"
- Artist A: photo/name/WW stats, vote button
- Artist B: photo/name/WW stats, vote button
- Live bet pool: "Artist A pool: 12.3 SOL | Artist B pool: 8.7 SOL"
- "Both artists earn from this battle" — the loser-earns hook
- CTA: "Vote on wavewarz.info" (deep link)

**Triggers:**
- ZOE posts a battle announcement cast → includes Mini App frame
- User opens cast → sees live vote widget
- Taps vote → routes to wavewarz.info battle page (no in-app wallet transaction yet)

### Use Case 2: Platform Stats Widget
**What it shows when embedded in a ZAO/ZOE statistics post:**
- Live stat pull from `/api/public/stats`
- "1,289 battles | 878 SOL | $988 to losing artists (Jul 2026)"
- Rolling ticker of recent MAIN battle results
- CTA: "See all battles on wavewarz.info"

### Use Case 3: Battle Result Display
**What it shows after a battle closes:**
- Winner highlighted, loser highlighted as "earned [X] SOL"
- Both tracks linked (Arweave permalink)
- Next battle CTA: "Vote in the next battle"

---

## Technical Spec

### API Endpoints Used (from doc 1427)

```
GET /api/public/stats
→ battles, volume, artist_payouts, trader_claims

GET /api/battles (list)
→ battle_id, artist_a, artist_b, status, created_at

GET /api/battles/:id
→ full battle details including vote counts and pool sizes

GET /api/battles/:id/result (after close)
→ winner, loser earnings, trader claims
```

### Frame / Mini App Architecture

```
Entry: Farcaster cast with fc:frame meta tag
↓
Initial render: battle widget (server-rendered, no auth required)
↓
User interaction:
  - "Vote for Artist A" → deep link to wavewarz.info/battle/:id (Privy wallet connect)
  - "View on WaveWarZ" → full battle page
  - "See all battles" → wavewarz.info homepage
↓
Neynar webhook (optional for ZOE):
  - trigger: user opens frame
  - action: log impression, optionally ZOE posts "X people viewed this battle"
```

### Authentication

- **Phase 1 (MVP):** No wallet auth in mini app. Vote button = deep link to wavewarz.info. User authenticates via Privy on wavewarz.info.
- **Phase 2:** Farcaster-native auth (SIWF) allows viewing wallet-specific stats (user's battle history, earnings) directly in mini app
- **Phase 3:** In-app SOL betting via embedded wallet (requires Coinflow/Privy integration in mini app context)

### Privy dependency

Phase 1 doesn't require Privy in the mini app — just a deep link.  
Phase 2-3 require Privy embedded wallet in Farcaster mini app context. Hurricane checks if Privy supports this (related to Privy flip decision — doc 1343, gated).

---

## Neynar Integration Points

Neynar provides:
1. **Frame analytics**: impressions, clicks, conversions per cast
2. **Webhook events**: user_interacted_with_frame → ZOE can react in real time
3. **Frame validation**: Neynar validator confirms frame spec compliance
4. **Managed signers**: ZOE can post casts with frames without managing its own Farcaster key

**What to ask Arthur (Jul 25 DM):**
1. Can Neynar managed signers post casts with Mini App frames embedded?
2. Does Neynar support the Farcaster Mini App spec (not just frames v1)?
3. Is there an easy SDK for Hurricane to get started? (docs link)
4. Can we get Neynar analytics on our frame impressions?
5. Status of WaveWarZ Base integration (from doc 1343 — any progress?)

---

## Hurricane Build Order

**Phase 1 (MVP — ship by Aug 15):**
- [ ] Create `app.json` manifest for Mini App
- [ ] Build server-side render of battle widget (Next.js route at `/api/frame/battle/:id`)
- [ ] Return `fc:frame` meta tags pointing to battle data from `/api/public/stats`
- [ ] Wire ZOE to include frame URL in every battle announcement cast
- [ ] Test in Warpcast frame validator

**Phase 2 (Sep 1 target — ZABAL S2 launch):**
- [ ] Platform stats widget (static frame, refreshes on open)
- [ ] Battle result frame (auto-generates after battle close)
- [ ] Neynar webhook → ZOE Telegram alert when frame hits 50 impressions

**Phase 3 (ZAOstock Oct 3 — live battle):**
- [ ] Live battle result cast with frame update in real time
- [ ] "You voted!" confirmation state (after SIWF)

---

## ZOE Integration (Post-Build)

**ZOE automatically includes frame in:**
- Every battle announcement cast (doc 1385 TMP-WW-01 template)
- Every MAIN battle post
- Weekly stats drops (frame shows current platform stats)
- COC show night battle posts

**Sample ZOE cast with frame (X analogue, no frame there):**
```
WaveWarZ battle live now 🎵

[ARTIST A] vs [ARTIST B]
vote + earn on wavewarz.info/battle/[ID]

[frame:wavewarz.info/api/frame/battle/[ID]]
```

---

## Success Metrics

| Metric | Target (3 months post-launch) |
|--------|------------------------------|
| Frame impressions per cast | >50 avg |
| Click-through to wavewarz.info | >10% |
| New WaveWarZ registrations from Farcaster | >20/month |
| ZOE casts including frame | 100% of battle announcements |

---

## Relationship to ZAO North Star

- **Distribution +0.3**: Every ZOE Farcaster post becomes interactive; passive scrollers become active voters
- **WaveWarZ +0.2**: Farcaster community (music + crypto overlap) is core WW audience
- **Technology +0.1**: Mini App is a citable technical artifact ("WaveWarZ has a Farcaster Mini App with live battle data")
- **Media +0.1**: Neynar partnership = another partner activation for press kit
