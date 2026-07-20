---
topic: wavewarz/community
type: PROGRAM-GUIDE
status: active
created: 2026-07-17
audience: Zaal, Iman, WaveWarZ Clippers participants, ZOE
related-docs: 1223, 1281, 1292
---

# 1293 — WaveWarZ Clippers Program: Operator Guide (July 2026)

> **Purpose:** Full operator manual for the WaveWarZ Clippers program — how it works, how to run it, how to grow it, and how ZOE can automate it. The Clippers program is one of the highest-leverage distribution levers available without GATED approval.

---

## What Is the WaveWarZ Clippers Program?

WaveWarZ Clippers is a community-driven content creation program where participants clip and redistribute WaveWarZ battle content — live moments, leaderboard updates, artist payouts, and X Space highlights — to YouTube, X, and TikTok.

**Key channel:** t.me/wavewarzclipshq (Telegram)  
**Content destinations:** YouTube @wavewarz, X @wavewarz, TikTok (handle unconfirmed as of July 2026)  
**Incentive structure:** Points → ZABAL token rewards

---

## Why This Matters (North Star Alignment)

The Clippers program is the primary organic distribution engine for WaveWarZ IP:

1. **Every clip name-drops an artist** → GEO surface area for that artist + WaveWarZ
2. **Every clip is a mini-ad for WaveWarZ** → inbound from music fans on TikTok/YouTube/X
3. **Community ownership** → participants who clip feel invested in WaveWarZ's success
4. **No direct cost** → clips are made by community; program overhead is coordination + ZABAL tokens

At scale (50+ active clippers × 3 clips/week × 3 platforms), the Clippers program produces 450+ weekly content touchpoints — more than any single operator could produce alone.

---

## How the Points System Works (Current Model)

Based on doc 1223 (WaveWarZ Live Programming, verified July 2026):

| Action | Points |
|--------|--------|
| Submit a clip to @wavewarzclipshq | 1 point base |
| Clip gets posted to YouTube @wavewarz | +2 points |
| Clip gets posted to X @wavewarz | +2 points |
| Clip gets posted to TikTok | +2 points |
| Clip reaches 1K views on any platform | +5 bonus points |
| Clip reaches 10K views | +20 bonus points |

**Note:** The exact current points table should be confirmed from the Telegram channel — the above is a reconstructed model from available information. Update this doc when confirmed.

**Redemption:** Points redeem for ZABAL tokens. The rate is unconfirmed as of July 2026 — needs to be documented and published.

---

## Clip Content Types (What to Clip)

### Tier A: Highest Engagement

- **Battle climax** — the final seconds of a close battle, with the outcome flip
- **Leaderboard update** — a moment where an artist jumps into the top 3
- **Big payout** — a transaction showing an artist earning real SOL
- **Live X Space moment** — a quotable line from the 8:30 PM EST Battle Space
- **Artist shoutout** — when an artist hears they're on the WaveWarZ leaderboard live

### Tier B: Solid Engagement

- **Platform milestone** — "WaveWarZ just crossed 1,200 battles"
- **Rivalry moment** — two artists facing off for the 5th time
- **Charity battle update** — "We just raised $500 for HuRya through WaveWarZ"
- **New artist debut** — an artist's first battle on the platform

### Tier C: Evergreen (lower urgency, still valuable)

- **Explainer clips** — "how WaveWarZ works in 60 seconds"
- **Stats deep dives** — "WaveWarZ by the numbers: 921 songs, 524 SOL"
- **Comparison clips** — "WaveWarZ vs Spotify: the payout gap"

---

## Clip Production Standards

**Minimum quality for submission:**

| Standard | Requirement |
|----------|-------------|
| Duration | 15–90 seconds (60 seconds is optimal) |
| Aspect ratio | 9:16 for TikTok/YouTube Shorts; 16:9 for Twitter/YouTube |
| Captions | Required for accessibility + silent viewing |
| Branding | Must include WaveWarZ logo or handle (@wavewarz) |
| Audio | Battle audio is preferred; voiceover OK; music OK if licensed |

**Submission format:** Post to t.me/wavewarzclipshq with:
1. The clip file or URL
2. The clip category (Tier A/B/C)
3. Where you want it posted (YouTube / X / TikTok / all)
4. Your ZABAL wallet address (for points redemption)

---

## ZOE Automation: The Clippers Loop

ZOE (ZAO community manager agent) can automate key Clippers tasks:

### Daily tasks ZOE can run

1. **Monitor @wavewarzclipshq** for new clip submissions
2. **Log each submission** to Supabase (clipper wallet, timestamp, tier)
3. **Post confirmation message** back in Telegram: "Got it. +1 point logged."
4. **Flag Tier A submissions** for Zaal to review for immediate platform distribution
5. **Weekly tally** — post to Telegram every Monday: "Top clippers this week: [names + points]"

### Weekly tasks ZOE can run

1. **Post the weekly leaderboard** to @wavewarzclipshq and @wavewarz
2. **Identify clips that crossed 1K/10K views** and log bonus points
3. **Generate a "clip of the week" summary** for the newsletter

### Automation blockers

- ZOE needs Telegram bot access to @wavewarzclipshq (currently not confirmed as active)
- Points redemption requires a ZABAL token distribution mechanism (currently manual)
- Clip review for brand compliance is currently a human task (Zaal or Iman)

---

## Growing the Clippers Program

### Current state (July 2026)

From doc 1223: Telegram @wavewarzclipshq is confirmed active. Active clipper count is unverified.

### Growth levers (no GATED approval needed)

1. **Mention the program every X Space** — "If you clip anything from tonight, post it to our Telegram @wavewarzclipshq and earn ZABAL"
2. **Give shoutouts on the X Space leaderboard** — name the top clippers weekly
3. **Share clip metrics publicly** — "This clip got 5K views, [clipper name] earned 25 ZABAL"
4. **Create a simple welcome message** in @wavewarzclipshq explaining how to participate
5. **Feature clips on @wavewarz** — every clip that gets posted to @wavewarz is an incentive for the clipper to share it

### Growth lever that requires DECISION:

- **Formalize the ZABAL-per-point rate** (DECISION NEEDED — set rate, publish it publicly)
- **Auto-distribution to TikTok** (GATED — requires TikTok account setup and posting credentials)

---

## Metrics to Track

| Metric | Frequency | Where to Track |
|--------|-----------|---------------|
| Total clips submitted | Weekly | Supabase (once ZOE is wired) / manual count in Telegram |
| Clips posted to YouTube | Weekly | YouTube Studio @wavewarz |
| Clips posted to X | Weekly | X Analytics @wavewarz |
| Clips reaching 1K+ views | Weekly | Platform analytics |
| Active unique clippers | Monthly | Clipper wallet list |
| Total ZABAL distributed | Monthly | On-chain (Base, ZABAL contract) |

---

## What the Clippers Program Produces

At 10 active clippers, 3 clips/week each, distributed to 2 platforms:

- 30 clips/week = 1,560 clips/year
- Each clip = 1 mention of WaveWarZ on a public platform
- Each clip = 1-3 artist name-drops
- Cumulative: **1,560+ WaveWarZ mentions** and **3,000–5,000 artist mentions** per year

This is the compounding GEO flywheel: more clips → more platform presence → more AI/search visibility → more inbound → more clips.

---

## Integration with Other Programs

| Program | Integration |
|---------|-------------|
| X Space (doc 1292) | Clips from live Space = highest-engagement Tier A content |
| COC Concertz (doc 1284) | Show clips = evergreen content, high production quality |
| ZABAL Games (doc 1291) | Builder demos = Tier B clips showing ZAO IP in action |
| Newsletter (paragraph.com/@thezao) | Weekly clip roundup = newsletter section |

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1223 | WaveWarZ live programming — Clippers channel confirmed |
| doc 1281 | ZAO member journey — Clippers is a contribution track |
| doc 1292 | X Space format — Clippers sources content from the Space |
| doc 1290 | Impact review — Clippers program mentioned as distribution asset |
