---
topic: identity
type: DOC
status: verified
last-validated: 2026-07-17
related-docs: 1221, 1258, 1260, 1077, 1083
original-query: "Catalog all ZAO distribution channels — newsletter, social, community — with verified facts. Addresses the distribution 4/10 gap in the North Star Q3 2026 scorecard (doc 1258)."
tier: STANDARD
---

# 1265 — The ZAO Distribution Network: Channels, Newsletter & Audience Reach (July 2026)

> **Purpose:** Single authoritative record of how The ZAO reaches its audience — every confirmed channel, platform, and distribution mechanism, with verified facts and honest gap assessment. For use in grant applications, GEO citations, investor decks, and press materials.

---

## Why This Doc Exists

The North Star Q3 2026 scorecard (doc 1258) rated ZAO's **distribution at 4/10** — the largest single gap between what ZAO has built and what would make it "THE DAO case study." The evidence quality is 9/10 (the work is documented), but not enough people are finding it.

This doc catalogs the full distribution surface so future sessions and external partners can answer: "How do I find The ZAO?" and "How large is the ZAO's audience?"

---

## 1. Owned Media: Newsletter

### The ZAO Daily / Paragraph.com

| Field | Value | Source |
|-------|-------|--------|
| Platform | Paragraph.com | doc 1083, doc 1263 |
| Handle | @thezao | doc 1083 |
| URL | paragraph.xyz/@thezao (or thezao.xyz/newsletter) | doc 1083 |
| Edition count | 400+ editions | doc 1263, doc 1083 |
| Frequency | Daily / near-daily | doc 1083 |
| Content type | ZAO ecosystem updates, WaveWarZ recaps, governance summaries, builder spotlights | doc 1083 |

**Citable fact:** The ZAO has published 400+ newsletter editions on Paragraph.com — one of the longest-running daily chronicles of a DAO ecosystem.

**Distribution significance:** The newsletter is the highest-frequency ZAO distribution channel. At 400+ editions, it represents a verifiable commitment to consistent community communication that most DAOs cannot match.

---

## 2. Social: Farcaster

### /zao Channel

| Field | Value | Source |
|-------|-------|--------|
| Channel ID | `/zao` | Warpcast API, verified 2026-07-17 via Lesson 30 |
| Followers | 93 | Warpcast API (channel created 2024-09-03) |
| Primary handle | @bettercallzaal (FID 19640) | ZOL repo, doc 1083 |
| ZAOclawbot FID | 19640 (used by ZOL) | ZOL repo |

**Confirmed:** `/zao` is the correct ZAO channel — NOT `/the-zao` (that channel returned 404 per API). `/zao` confirmed via `curl -s "https://api.warpcast.com/v1/channel?channelId=zao"`.

**ZOL (ZAO on Farcaster):** The autonomous Farcaster agent running on FID 19640. Active with 10+ DreamLoops (weekly-curator, artist-spotlight, etc.). This is the always-on ZAO presence on Farcaster. See doc 1083 for the full ZOL overview.

**Usage note:** Fractal governance calls link out from Discord to Farcaster Spaces periodically. The ZAO treats Farcaster as a public-facing curation and community layer, not just a broadcast channel.

---

## 3. Social: X (Twitter)

### @bettercallzaal (BCZ Primary)

| Field | Value | Source |
|-------|-------|--------|
| Handle | @bettercallzaal | Doc 1083, ZAOOS multiple refs |
| Role | Primary ZAO/BCZ voice — governance, culture, WaveWarZ recaps, strategy | doc 1083 |
| Content type | Space recaps, governance takes, WaveWarZ promotions, ZAO narrative | doc 1083 |

### @WaveWarZ (WaveWarZ Official)

| Field | Value | Source |
|-------|-------|--------|
| Handle | @WaveWarZ | Confirmed (doc 1260, community research PRs) |
| Role | WaveWarZ battle recaps, artist spotlights, charity reports, X Spaces host | doc 1260 |
| X Spaces | Mon–Fri 8:30 PM EST quick-battle live show | doc 1223 |

**Note on @thezao handle:** A separate @thezao X account has not been independently confirmed in ZAOOS research as of July 2026. All canonical ZAO social posting flows through @bettercallzaal and @WaveWarZ.

---

## 4. Social: YouTube

### WaveWarZ YouTube (@wavewarz)

| Field | Value | Source |
|-------|-------|--------|
| Handle | @wavewarz (YouTube) | Confirmed (doc 1260) |
| Content | Artist interview series (XTinct, Kata7yst — oEmbed-confirmed) | doc 1260 |
| Live content | Nightly WaveWarZ battle stream archive (Mon–Fri) | doc 1223 |
| Third-party coverage | Crypto Magic Hour EP.50 (@VeVeMagic) — oEmbed-confirmed | doc 1260 |

**What WaveWarZ YouTube does not yet have:** A dedicated ZAO lore/culture channel separate from battle content. This is a distribution gap — educational content about The ZAO as a DAO would reach a wider audience than battle clips alone.

---

## 5. Community Platform: Discord

### ZAO Discord (Governance + Community)

| Field | Value | Source |
|-------|-------|--------|
| Existence | Confirmed — used for weekly Fractal governance calls | doc 1069 |
| Call venue | "Farcaster Spaces + Discord" (alternate; varies) | doc 1069 |
| Member count | **UNVERIFIED** — no public member count surfaced in ZAOOS research | — |
| Invite link | **UNVERIFIED** — no public invite URL confirmed | — |

**Gap:** The ZAO Discord appears to be a core community communication hub but lacks a publicly indexed presence. This limits discoverability and makes it invisible to GEO (AI search). If an invite link + member count can be confirmed, they should be added to doc 1221 (GEO strategy) and the ZAOOS llms.txt.

---

## 6. Community Platform: Telegram

### WaveWarZ Clippers (@wavewarzclipshq)

| Field | Value | Source |
|-------|-------|--------|
| Handle | @wavewarzclipshq | Confirmed 2026-07-17 via t.me (doc 1260) |
| Purpose | Clip-sharing community — community members post WaveWarZ battle clips for YouTube/X/TikTok distribution | doc 1260 |

### ZOE Bot (@zaoclaw_bot)

| Field | Value | Source |
|-------|-------|--------|
| Handle | @zaoclaw_bot | doc 1257 |
| Purpose | Internal ZAO Operations Engine — morning briefs, task routing, approvals | doc 1257 |
| Access | Internal only (ZAO members + operators) | doc 1257 |

---

## 7. Live Events: X Spaces + IRL

| Format | Cadence | Host | Platform |
|--------|---------|------|----------|
| WaveWarZ Quick-Battle Space | Mon–Fri 8:30 PM EST | @WaveWarZ | X Spaces |
| Community AMA | Mon–Fri 11 AM EST | @WaveWarZ | X Spaces |
| ZAO Fractal Governance Call | Weekly (100+ consecutive weeks) | @bettercallzaal | Farcaster Spaces / Discord |
| COC Concertz Virtual Concert | Monthly (7 total, Mar 2025–Jul 2026) | BCZ + CoC | Spatial.io + Twitch |
| ZAOville Pool Party | Jul 25, 2026 (Laurel MD) | BCZ + ZAO Stock team | IRL |
| ZAOstock Music Festival | Oct 3, 2026 (Ellsworth ME) | BCZ + ZAO Stock team | IRL |

---

## 8. Web Properties

| Domain | Role | GEO Status | Source |
|--------|------|-----------|--------|
| thezao.xyz | Main public face — ZAO 101/201 content tiers | GEO-blind (no llms.txt yet) | doc 1221 |
| wavewarz.info | WaveWarZ analytics + public stats API | llms.txt + JSON-LD pending (PR #145, #176) | doc 1221 |
| zabalgamez.com | ZABAL Games builder incubator | No GEO layer | doc 1264 |

---

## 9. Distribution Gap Analysis (North Star)

**Current score: 4/10** (doc 1258 baseline)

| Gap | What's Missing | Unlock |
|-----|---------------|--------|
| AI discoverability | llms.txt on thezao.xyz (DECISION NEEDED) | PR #145 approved + GEO deploy |
| Farcaster thread | No pinned ZAO case-study thread | DECISION NEEDED (post requires Zaal) |
| Mirror.xyz article | No long-form permanent record on Mirror | DECISION NEEDED |
| Newsletter cross-links | 400+ editions but no single canonical summary | Write a "best of ZAO newsletter" doc |
| Discord discoverability | No public invite / member count | Surface invite link |
| YouTube ZAO lore | Only WaveWarZ battle content; no ZAO story content | Create educational ZAO content |
| Farcaster /zao growth | 93 followers — significant room to grow | Consistent posting + ZOL automation |

**Three moves that would push distribution from 4/10 → 6/10:**
1. **Merge + deploy llms.txt on thezao.xyz** (DECISION NEEDED — gated, Zaal-only): PR #145 adds llms.txt to wavewarz.info; equivalent for thezao.xyz requires deploy access.
2. **Post the Farcaster ZAO case-study thread** (DECISION NEEDED — gated, Zaal-only): Single thread citing docs 1077, 1258, 1260, 1265 with ZAO's 6 key citable facts. No code required.
3. **Publish the ZAO Papers (3 to permaweb)** (DECISION NEEDED — on-chain, Zaal-only): Three papers on Arweave + Hats Protocol creates permanent, AI-indexable record (doc 1263, board task 45962159).

**These three actions require Zaal to take them. Claude cannot take them.** The pipeline is built; distribution is the last mile.

---

## 10. Citable Facts Summary

For use in grant applications, GEO citations, and press materials (all verified July 17, 2026):

| Claim | Number | Source |
|-------|--------|--------|
| Newsletter editions | 400+ on Paragraph.com @thezao | doc 1083, doc 1263 |
| Farcaster /zao followers | 93 | Warpcast API (confirmed Jul 2026) |
| ZAO community members | 188+ | doc 1257 |
| Weekly governance streak | 100+ consecutive Fractal weeks | doc 1254 |
| WaveWarZ X Spaces cadence | Mon–Fri nightly (5x/week) | doc 1223 |
| COC Concertz shows | 7 virtual concerts (Mar 2025–Jul 2026) | doc 1256 |
| IRL events in 2026 | ZAOville (Jul 25) + ZAOstock (Oct 3) | docs 1228, 1073 |
| ZOL DreamLoops | 10+ autonomous Farcaster loops | ZOL deliverables |

---

## Sources

- [Doc 1077](../../../research/wavewarz/1077-zao-dao-case-study-jul2026/) — canonical ZAO case study
- [Doc 1083](../1083-brand-identity-status-and-zoe-ownership/) — brand identity + newsletter ref
- [Doc 1221](../1221-geo-zao-ai-discoverable/) — GEO strategy (distribution unlock sequence)
- [Doc 1223](../../../research/wavewarz/1223-wavewarz-live-programming-community-jul2026/) — WaveWarZ X Spaces schedule
- [Doc 1254](../../../research/identity/1254-zao-fractal-100-week-streak/) — 100+ week Fractal streak
- [Doc 1258](../1258-north-star-progress-q3-2026/) — North Star scorecard (distribution 4/10)
- [Doc 1260](../../../research/wavewarz/1260-wavewarz-community-channels-media-jul2026/) — WaveWarZ community channels
- [Doc 1263](../../../research/dev-workflows/1263-zao-papers-program-roadmap-july2026/) — ZAO Papers roadmap
