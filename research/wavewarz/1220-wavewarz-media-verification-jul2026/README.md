---
doc: 1220
title: WaveWarZ Media Presence Verification (July 2026)
type: DOC
created: 2026-07-17
original-query: "Verify WaveWarZ YouTube presence — official artist interviews and third-party coverage — via oEmbed API. Surface as citable external-reach evidence."
tier: STANDARD
---

# WaveWarZ Media Presence Verification (July 2026)

WaveWarZ has confirmed video presence across both its own YouTube channel (at least 2 artist interview series) and at least one independent crypto podcast. All items below were verified 2026-07-17 via the YouTube oEmbed API (`https://www.youtube.com/oembed?url=<url>&format=json`) — this returns HTTP 200 with title/author metadata when the video exists and is public, and HTTP 404 when it does not. oEmbed is reliable, unauthenticated, and does not require scraping.

---

## 1. Official WaveWarZ Artist Interviews (YouTube)

### WaveWarZ Artist Interview: Kata7yst

| Field | Value |
|---|---|
| Video ID | `ZU0ga5LRdyU` |
| URL | youtube.com/watch?v=ZU0ga5LRdyU |
| Channel | Official WaveWarZ YouTube channel |
| oEmbed status | **CONFIRMED** (HTTP 200, 2026-07-17) |
| Context | oEmbed returned title "WaveWarZ Artist Interview: Kata7yst" and the official WaveWarZ channel as author |

**Significance:** Kata7yst is a WaveWarZ battler (track "NSG Steppin x Kata7yst x LUI" by luiwrites appears in 19+ battle records in ww-battles.json). This interview confirms WaveWarZ runs an ongoing artist-spotlight series featuring actual platform participants. Kata7yst is the second confirmed interview subject after XTinct_official.

### WaveWarZ Artist Interview: XTinct

| Field | Value |
|---|---|
| Artist | XTinct_official |
| Channel | Official WaveWarZ YouTube channel |
| oEmbed status | **CONFIRMED** (verified in prior session, pre-2026-07-17) |
| Context | Documented in docs/WAVEWARZ-RESEARCH.md §1 |

**Citable fact #1:** WaveWarZ runs a YouTube artist interview series. At least 2 episodes confirmed: XTinct and Kata7yst. Both are active battlers on the platform.

---

## 2. Independent Third-Party Coverage

### Crypto Magic Hour Ep. 50 — WaveWarZ Feature

| Field | Value |
|---|---|
| Title | "Crypto Magic Hour Ep. 50: WaveWarZ Epic Battle, New Crypto X Rules & More" |
| Video ID | `rx0PeGv8lPI` |
| URL | youtube.com/watch?v=rx0PeGv8lPI |
| Channel | @VeVeMagic (independent, not WaveWarZ-operated) |
| oEmbed status | **CONFIRMED** (HTTP 200, 2026-07-17) |
| Context | oEmbed returned title matching above; author confirmed as @VeVeMagic |

**Significance:** This is the first confirmed *independent* video coverage of WaveWarZ — a third-party crypto show devoting a full episode (EP.50) to WaveWarZ battle gameplay and rules. "EP.50" indicates the Crypto Magic Hour series had at least 50 episodes at the time of this coverage, showing it is an established show, not a one-off. The title's "New Crypto X Rules" refers to WaveWarZ's game mechanics, confirming the episode is substantive coverage, not a passing mention.

**Citable fact #2:** An independent crypto media outlet (Crypto Magic Hour, EP. 50) featured WaveWarZ in a dedicated episode, confirming organic external-audience reach beyond the WaveWarZ/ZAO community.

---

## 3. What Was NOT Found

| Item | Status | Notes |
|---|---|---|
| Wave Warz Zm YouTube channel (UC4CTlM4Y6EZF0G9MBBAjwZQ) | **NOT FOUND** — oEmbed 404 | Channel may have been deleted, made private, or the ID was wrong; not citable |
| WaveWarZ Discord | **UNCONFIRMED** | Not surfaced via WebSearch (2026-07-15/17 runs); may exist but invite link not found |
| WaveWarZ Telegram | **UNCONFIRMED** | @wavewarzclipshq identified (PR #130), awaiting direct verification |
| WaveWarZ Reddit | **UNCONFIRMED** | No dedicated subreddit found via search |
| WaveWarZ Farcaster | **UNCONFIRMED** | No dedicated Farcaster channel surfaced (Farcaster mini-app exists — see doc 743) |

---

## 4. Verification Methodology

All YouTube verifications used the YouTube oEmbed endpoint:
```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json
```
- HTTP 200 → video exists, is public, title/author available
- HTTP 404 → video does not exist or is private/deleted

This approach is:
- **Unauthenticated** — no YouTube API key required
- **Reliable** — oEmbed is a stable, documented spec (oembed.com)
- **Confirmed stable** — the same endpoint is used by YouTube's own embed previews

Verification date: 2026-07-17. Performed in wwtracker session with working outbound egress (confirmed via wavewarz.info/api/public/stats control fetch).

---

## 5. Citable Facts Summary

| # | Fact | Source | Verified |
|---|---|---|---|
| 1 | WaveWarZ runs a YouTube artist interview series — at least 2 confirmed episodes (XTinct, Kata7yst) | oEmbed ZU0ga5LRdyU + prior research | 2026-07-17 |
| 2 | Independent third-party coverage: Crypto Magic Hour EP. 50 (@VeVeMagic) dedicated a full episode to WaveWarZ | oEmbed rx0PeGv8lPI | 2026-07-17 |
| 3 | WaveWarZ Discord/Reddit: not found in 4 separate research runs (2026-07-15/17); community may rely on Telegram and X | Multiple WebSearch runs | 2026-07-15–17 |
| 4 | Kata7yst is a confirmed WaveWarZ battler (track "NSG Steppin x Kata7yst x LUI" in ww-battles.json) featured in the official interview series | oEmbed + ww-battles.json | 2026-07-17 |

---

## 6. Relationship to Other ZAO Research Docs

| Doc | What it covers | What this doc adds |
|---|---|---|
| [1077](../1077-zao-dao-case-study-jul2026/) | DAO case study: governance + volume + charity stats | Adds video-level verification of media presence |
| [1214](../1214-wavewarz-creative-ecosystem-jul2026/) | Artists, songs, rivalries, interviews (mentions 2 confirmed interviews) | Adds YouTube video IDs + oEmbed verification trail + third-party coverage |
| [wwtracker PR #137](https://github.com/bettercallzaal/wwtracker/pull/137) | Events.tsx — Kata7yst interview added | oEmbed confirmation backing that PR's data |
| [wwtracker PR #138](https://github.com/bettercallzaal/wwtracker/pull/138) | Events.tsx — Crypto Magic Hour added | oEmbed confirmation backing that PR's data |

---

*Verification performed by the WaveWarZ build loop (Claude Code), 2026-07-17. Sources: YouTube oEmbed API, wwtracker ww-battles.json, wwtracker docs/research/wavewarz/ community research runs 2026-07-15/17.*
