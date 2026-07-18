# 1473 — Farcaster /wavewarz Channel: Content Plan + Growth Strategy (Jul 2026)

**Type:** CHANNEL-STRATEGY  
**Topic:** Farcaster  
**Status:** ACTIONABLE — ZOE executes posting; Zaal approves template changes

---

## Overview

/wavewarz is ZAO's Farcaster channel for the WaveWarZ music battle platform. This doc defines what goes in /wavewarz, who manages it, how ZOE automates it, and how to grow it into the primary web3-native audience for WaveWarZ.

**Channel:** /wavewarz (Farcaster)  
**Handle:** @wavewarz  
**Current use:** Battle announcements, results, platform updates  
**Target:** 500 followers by ZAOstock Oct 3; 50 avg impressions/cast

---

## /wavewarz vs Other Channels

| Channel | What It's For | Who Posts |
|---|---|---|
| /wavewarz (Farcaster) | WaveWarZ battles, platform stats, artist spotlights — web3-native audience | ZOE (automated) + Zaal (strategic) |
| @wavewarz (X/Twitter) | Same content, but X-formatted for broader music industry reach | ZOE (automated) |
| /zao (Farcaster) | ZAO governance, community, broader ZAO ecosystem | ZOE + Zaal |
| ZAO Main Telegram | Inner circle notifications only | ZOE |
| WaveWarZ Clippers Telegram | High-signal results only | ZOE |

**Rule:** /wavewarz is the web3-native home for WaveWarZ. Post everything WaveWarZ there. Post only the most notable WaveWarZ content to /zao (don't flood the governance channel with battle results).

---

## Content Calendar for /wavewarz

### Recurring Content (ZOE Automated)

| Cadence | Content Type | Template Source |
|---|---|---|
| Every MAIN battle | Battle announcement cast (with frame if Mini App ready, doc 1463) | doc 1385 TMP-WW01 |
| Every MAIN battle close | Battle result cast (winner + loser earnings) | doc 1385 TMP-WW02 |
| Weekly (Monday) | Platform stats snapshot (pull from /api/public/stats) | doc 1385 TMP-WW05 |
| Monthly | Top artist spotlight (rank by SOL volume) | New template below |
| COC show nights | Battle live alert + result | doc 1371 |
| Major milestones | 1,500 battles, 600 SOL volume (doc 1426) | doc 1426 TMP-M1500 |

### Non-Recurring Content (Zaal Posts)

| Trigger | Content |
|---|---|
| ZAOstock announcement (Jul 21) | ZAOstock cast featuring WaveWarZ live battle at the festival |
| New artist joins WaveWarZ | Artist spotlight cast (2-sentence intro + battle history) |
| Africa Battle Week (Sep 15-26) | Daily international cast (ZAO × RAM Africa collab, doc 1373) |
| Press coverage (Hypebot/W&M) | Quote-cast from the article with WaveWarZ angle |
| 1,500 battles milestone | Long cast (doc 1426 templates) |

---

## New Template: Monthly Artist Spotlight

```
🎤 WaveWarZ Artist Spotlight — [MONTH] 2026

[ARTIST_HANDLE] is [#N] on the WaveWarZ leaderboard this month

📊 [BATTLE_COUNT] battles this month
💰 [SOL_VOLUME] SOL in volume
🎵 Audius: [AUDIUS_LINK]

Battle [ARTIST_HANDLE] at wavewarz.info
```

*ZOE: pull top artist by monthly volume from API; send on the 1st of each month.*

---

## Farcaster Frame Integration (Post Mini App Launch)

Once the Farcaster Mini App (doc 1463) is live (Phase 1 target: Aug 15), ZOE includes a frame in every MAIN battle announcement cast:

**Frame = live battle vote widget embedded in the cast.**

Cast flow:
```
ZOE posts battle announcement cast
  → fc:frame meta tag embedded
  → Shows Artist A vs Artist B with pool sizes
  → Buttons: [Vote Artist A] [Vote Artist B] [View on WaveWarZ]
  → Click → deep links to wavewarz.info/battles/[ID]
```

This turns every /wavewarz battle cast into an interactive vote — increasing engagement rate 5-10x vs static casts.

**Target metrics after Mini App launch:**
- Battle announcement casts: > 50 frame impressions each
- Click-through rate: > 10% to wavewarz.info
- New WaveWarZ registrations from Farcaster: > 20/month

---

## Engagement Rules for ZOE

**In /wavewarz, ZOE:**
- DOES reply to questions about "what is WaveWarZ?" with a 2-sentence explanation + link
- DOES like casts that tag @wavewarz with positive WaveWarZ content
- DOES NOT engage in debates about crypto or governance (redirect to /zao)
- DOES NOT recast content from users ZAO hasn't vetted (avoid association risk)
- DOES cast quick battle results only when volume exceeds 5 SOL (filter noise)

**Escalate to Zaal:**
- Any cast claiming ZAO/WaveWarZ is a scam or rug
- Any cast from an artist asking about joining WaveWarZ
- Any cast from a journalist or publication asking about WaveWarZ
- Any cast proposing a collaboration or partnership

---

## /wavewarz Growth Strategy

### Phase 1 (Jul–Sep 2026): Content Volume
Goal: Establish /wavewarz as the most consistent WaveWarZ content source on Farcaster.
- Post every MAIN battle (currently ~2-3/week)
- Post weekly stats every Monday
- Post Africa Battle Week daily casts Sep 15-26 (2 weeks of daily content = 10+ casts)
- Target: 200 followers by Sep 1

### Phase 2 (Sep–Oct 2026): Distribution Events
Goal: Convert one big moment into a follower spike.
- Sep 1 ZAOstock lineup reveal — post WaveWarZ stage battle announcement via /wavewarz
- Sep 15 Africa Battle Week kickoff — announce via /wavewarz + tag co-creators
- Oct 3 ZAOstock live — real-time casts from the stage
- Target: 350 followers by ZAOstock (Oct 3)

### Phase 3 (Oct–Dec 2026): Community
Goal: Turn /wavewarz into a community, not just a broadcast channel.
- Enable artist recasting: encourage WaveWarZ artists to recast their own battle results
- Weekly community question (e.g., "who should battle next?")
- ZAOstock recap engagement: ask /wavewarz followers "best moment from ZAOstock?"
- Target: 500 followers by Dec 31

---

## /wavewarz vs /cocconcertz Channel Split

Both channels live on Farcaster and are operated by ZAO. Here's the content split:

| Content | /wavewarz | /cocconcertz |
|---|---|---|
| WaveWarZ battles (all) | ✅ Yes | ❌ No (floods the show channel) |
| COC Concertz show events | ✅ Yes (WaveWarZ angle) | ✅ Yes (show-level content) |
| Battle during COC show | ✅ Yes | ✅ Yes (both channels) |
| ZAOstock WaveWarZ stage battle | ✅ Yes | ✅ Yes (event-level) |
| ZABAL musician WW battle | ✅ Yes | ❌ No |
| Platform stats (weekly) | ✅ Yes | ❌ No |

---

## ZOE Channel Config

ZOE uses Neynar's `@wavewarz` managed signer to post to /wavewarz. Key config:
- Signer: @wavewarz FID (confirm with Hurricane)
- Channel: `/wavewarz`
- Cross-post rule: all /wavewarz MAIN battle casts also post to @wavewarz X (same content, adapted format)
- No cross-posting between /wavewarz and /zao automatically (ZOE manually selects what's worth both channels)

---

## Related Docs

- 1463 — WaveWarZ Farcaster Mini App Product Spec (frame/mini app spec — Phase 1 Aug 15)
- 1425 — WaveWarZ Farcaster Miniapp Spec (earlier spec, farcaster topic)
- 1441 — ZAO Farcaster Channel Growth Strategy (all channels overview)
- 1412 — ZAO Community Infrastructure Map (channel health status)
- 1385 — ZOE Social Media Playbook (battle announcement templates)
- 1371 — COC Show-Night Live Social Playbook (COC show casts)
- 1373 — ZAO × RAM Africa Battle Week (Sep 2026 content)
