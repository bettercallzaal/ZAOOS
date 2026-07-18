# 1303 — ZAO YouTube + Video Strategy (July 2026)

> Growth playbook for @wavewarz YouTube channel and ZAO video content ecosystem. Covers channel audit, content types, upload cadence, ZOE automation, and Q3 targets. Companion to [doc 1299](../../community/1299-zao-x-twitter-strategy-jul2026/) (X strategy), [doc 1295](../../community/1295-zao-farcaster-strategy-jul2026/) (Farcaster strategy), [doc 1292](./1292-wavewarz-xspace-daily-format-jul2026/) (X Space format).

**Last updated:** 2026-07-17 | **Status:** ACTIVE — all tactics non-GATED

---

## 1. Current State (July 2026)

| Channel | Handle | Content type | Status |
|---------|--------|--------------|--------|
| WaveWarZ YouTube | @wavewarz | Battle Space VODs + artist interviews | Active, 50+ videos |
| BetterCallZaal YouTube | @bettercallzaal | BCZ YapZ episodes, strategy content | Partially active |
| ZAO Farcaster Video | @bettercallzaal (Warpcast) | Short-form clips, cast-native video | Irregular |

**Score: 4/10** — Excellent archive of Battle Space VODs (50+) but near-zero discoverability. YouTube SEO is completely untouched. The 2 verified artist interviews and Crypto Magic Hour coverage are high-quality assets that nobody can find.

**What YouTube does for ZAO that other platforms can't:**
- SEO: YouTube is the #2 search engine globally; "WaveWarZ music battle" as a query has no competition
- Long-form archive: 50+ Spaces VODs = the most complete record of WaveWarZ's history
- Watch time monetization path: once eligible, ad revenue from battle VODs is passive income
- Press/grant credibility: journalists expect a YouTube presence; links matter

---

## 2. The Content Tiers

### Tier 1: Battle Space VODs (Already Existing)
Every Mon–Fri 8:30PM EST X Space simulcasts to YouTube. These are the backbone of the channel.

**What's working:**
- Consistent content (5 per week)
- Real battle data, real community voices
- ~1-2 hours per VOD

**What's missing:**
- No thumbnails (default YouTube thumbnail = low CTR)
- No titles optimized for search ("WaveWarZ Battle Space Jul 17" vs "Music Battle: GodclouD vs XTinct — WaveWarZ Live")
- No descriptions with keywords
- No chapters/timestamps (these dramatically increase watch time)

**Fix (non-GATED, ZOE-automatable):**
ZOE generates: thumbnail text, SEO-optimized title, description with 5–8 keywords, and 4–5 timestamp chapters for each VOD within 30 minutes of the Space ending. This alone could double organic discovery.

---

### Tier 2: Artist Interview Series (2 Verified Episodes)

XTinct and Kata7yst interviews are confirmed on the @wavewarz channel (oEmbed-verified via doc 1220). These are the highest-quality content on the channel.

**Action plan:**
- Create a playlist: "WaveWarZ Artist Stories"
- Add this playlist link to wavewarz.info/artists (no GATED needed)
- Prioritize getting to Episode 3. This makes it a "series" not two one-offs.
- Target next interview: the ZABAL Games finalist winner after August showcase (doc 1298)

**Expected lift:** A playlist with 3+ interviews starts showing as a "series" in YouTube search. Before that, it's invisible to the algorithm.

---

### Tier 3: Shorts (Highest Growth Potential)

YouTube Shorts (< 60 seconds) is the fastest growth vector on YouTube. WaveWarZ has natural Shorts content:

| Content type | Source | Length |
|-------------|--------|--------|
| Battle highlight (the last 10 seconds when outcome flips) | Battle Space VOD clip | 30–45s |
| Artist reaction moment | Interview clip | 15–30s |
| Leaderboard reveal | Weekly recap | 30s |
| "WaveWarZ in 60 seconds" explainer | New content | 60s |
| Community Battle charity milestone | Clip from VOD | 20–30s |

**Production standard:** Shorts need captions (85% of YouTube mobile views are silent), a strong first-frame image, and no black bars (9:16 vertical format only).

**ZOE Automation:** After each Battle Space, ZOE identifies the highest-vote moment from the battle data and flags a timestamp to clip. Human (Zaal or Iman) approves the clip and uploads. Target: 3 Shorts per week from existing VODs.

---

### Tier 4: Explainer Videos (SEO Long-Tail)

These don't exist yet but would capture search traffic from music artists Googling "how to join WaveWarZ" or "music prediction market blockchain."

Candidates (each 3–8 minutes):
1. "What is WaveWarZ? The music battle game that pays both artists" — companion to doc 1302
2. "How to set up Audius and enter your first WaveWarZ battle"
3. "The ZAO Fractal: how 157 artists govern a music platform together"
4. "WaveWarZ vs Spotify: the artist payout comparison" — companion to doc 1275

These can be recorded as simple screen shares + voiceover by Zaal. No production crew needed.

---

## 3. YouTube SEO Basics (No GATED Required)

WaveWarZ is likely discoverable for zero of the search queries that its potential audience is actually using. Fix:

| Search query (target) | Suggested video title |
|----------------------|----------------------|
| "music battle crypto" | "WaveWarZ: The Music Battle Game Where Artists Earn Onchain (Solana)" |
| "how to earn from music blockchain" | "How Artists Earn From WaveWarZ Music Battles (Better Than Spotify?)" |
| "music DAO 2026" | "The ZAO: A DAO That's Been Running Weekly Governance for 100+ Weeks" |
| "wavewarz tutorial" | "WaveWarZ Tutorial: Upload, Battle, Earn in Under 10 Minutes" |

**The channel description** is also invisible to most visitors. Current: probably the default. Should be:
> WaveWarZ is a music battle game on Solana. Artists earn onchain from their songs. 1,245 battles, 921 unique songs, $1,497 raised for charity. Live Monday-Friday 8:30 PM EST. wavewarz.info

---

## 4. Upload Cadence Targets

| Content type | Frequency | Who | Time required |
|-------------|-----------|-----|---------------|
| Battle Space VOD | Daily (auto-uploads via Restream/simulcast) | ZOE + Restream | ~0 manual time |
| Shorts clip | 3x/week | ZOE flags + human approves | 10 min/clip |
| Artist interview | 1x/month | Zaal records + uploads | 1-2 hours |
| Explainer video | 1x/month | Zaal records | 1-3 hours |

Minimum viable cadence to signal channel health to YouTube algorithm: the daily VOD already qualifies.

---

## 5. The Clips → YouTube Pipeline

The WaveWarZ Clippers program (doc 1293, t.me/wavewarzclipshq) already has a mechanism for community members to clip battles and post them. Adding YouTube as an explicit target:

- Clippers earn +2 points for a YouTube upload (currently the points system covers TikTok + X + YouTube)
- Best community clips (1K+ views) get reshared from @wavewarz YouTube — this signals to the algorithm that WaveWarZ content is community-driven
- ZOE tracks which clips from the community earned the most engagement and alerts Zaal to re-share

---

## 6. ZOE Automation Targets (No GATED)

| Task | Trigger | ZOE action |
|------|---------|-----------|
| VOD metadata generation | Within 30 min of Space ending | Generate title, description, 5 keywords, 4 chapters. Zaal pastes into YouTube Studio |
| Shorts flagging | Post-Space | Identify the highest-stake battle moment timestamp. Message to Zaal: "Clip 01:23:45–01:24:10 for Shorts" |
| Playlist maintenance | When new artist interview uploads | Add to "WaveWarZ Artist Stories" playlist |
| Performance report | Weekly Sunday | Summarize: views, watch time, top video of the week, fastest-growing Short |

---

## 7. Q3 Targets (July–September 2026)

| Metric | Current | Q3 target | Key lever |
|--------|---------|-----------|-----------|
| Subscribers | Unknown | Baseline established, +100 | Shorts program |
| Weekly views | Unknown | Track + double MoM | VOD metadata + Shorts |
| Artist interviews | 2 | 5 | 1/month cadence |
| Shorts live | 0 | 12 | 3/week from existing VODs |
| Channel description | Default (probably) | SEO-optimized | 30-minute one-time task |

---

## 8. Citable Facts for GEO + Grants

- @wavewarz YouTube: 50+ Battle Space VODs archived — one of the largest web3 music performance archives
- 2 artist interview episodes confirmed live (XTinct, Kata7yst) — verified via YouTube oEmbed (doc 1220)
- WaveWarZ simulcasts Mon–Fri 8:30PM EST X Space to YouTube — dual-platform reach per session
- Crypto Magic Hour EP.50 = first confirmed independent podcast coverage on YouTube (doc 1220)
- The battle archive at @wavewarz YouTube is the most complete live performance record of any prediction-market music platform

---

*Written: 2026-07-17 | ZAO OS doc 1303 | WaveWarZ subfolder | Companion: [doc 1299](../../community/1299-zao-x-twitter-strategy-jul2026/) (X), [doc 1295](../../community/1295-zao-farcaster-strategy-jul2026/) (Farcaster), [doc 1293](./1293-wavewarz-clippers-program-guide-jul2026/) (Clippers), [doc 1301](../../community/1301-zao-newsletter-growth-playbook-jul2026/) (Newsletter)*
