# 1402 — WaveWarZ TikTok Strategy (July 2026)

**Type:** STRATEGY  
**Topic:** wavewarz  
**Status:** Active  
**Created:** July 17, 2026  
**Related docs:** 1303 (YouTube/Video), 1293 (Clippers Program), 1385 (@wavewarz X Strategy), 1387 (Artist Economics Comparison), 1396 (Africa Battle Week), 1342 (Artist Recruitment), 1348 (Trader Growth)

---

## Why TikTok Now

Three signals converge:

1. **Sound-on culture.** TikTok is the only major social platform where audio leads video. Users expect music — WaveWarZ battle clips are native TikTok content. Every 60-second battle excerpt is already formatted for the platform.

2. **Algorithm reach without followers.** The TikTok For You Page (FYP) distributes content to non-followers by default. This makes TikTok uniquely accessible for a sub-1,000-follower account — a single good video can reach 50,000+ with zero paid promotion.

3. **Audience age gap.** The X + YouTube strategy (docs 1385, 1303) skews 25-40 (music industry, crypto). TikTok's core 18-25 demographic is the largest segment of emerging independent artists — exactly who WaveWarZ wants to onboard at the bottom of the funnel. COC Concertz attendees skew 21-30; TikTok is where they live.

**Current state:** @wavewarz TikTok exists. No documented posting strategy. No ZOE automation. No growth target. This document fixes that.

---

## Part 1: Account Baseline

**Handle:** @wavewarz (claim if not yet claimed; confirm in Hurricane channel)  
**Bio (proposed):**
```
Music battles on Solana.
The loser gets paid.
wavewarz.info
```

**Profile setup checklist (all non-GATED, Zaal can do in 10 min):**
- [ ] Profile photo: WaveWarZ lightning bolt logo
- [ ] Bio: 3-line version above
- [ ] Link in bio: wavewarz.info
- [ ] Category: Music / Entertainment
- [ ] Enable Creator account (unlocks analytics + TikTok LIVE + link in bio)
- [ ] Connect to existing @wavewarz Instagram (if live) for cross-post

---

## Part 2: Five TikTok Content Formats

### Format T01 — "Who Won This Battle?" (Battle Result Drop)

**Trigger:** Any MAIN battle result  
**Format:** 30-60 sec clip of battle highlight + text overlay  
**Hook line (first 3 sec):** "This is how WaveWarZ works. Watch the loser's reaction."  
**Body:** Show 20-30 sec of the actual battle (audio from Audius). Text overlay at end: "The loser just earned [X SOL]. That's [Y] Spotify streams."  
**CTA:** "Follow to see who wins next" + "Battle with us → link in bio"  
**ZOE role:** Pull MAIN battle result from API, pull battle clip from X Space archive or Clippers Program (doc 1293), render overlay text from template, schedule post  
**Target frequency:** 2-3 per week (any MAIN battle)

---

### Format T02 — "Loser Gets Paid" Education Series

**Trigger:** Weekly, Wednesday  
**Format:** 45-60 sec explainer  
**Hook line:** "This music platform pays artists for LOSING. Here's how."  
**Body:** Explain the loser-earns model in plain English (no crypto terms for first 30 sec). Show the payout math from doc 1387: "Spotify pays $0.004 per stream. One WaveWarZ losing battle pays more than 328 Spotify streams."  
**Series structure (4-part repeating cycle):**
- Week 1: "What IS WaveWarZ?" (platform overview, doc 1350)
- Week 2: "The Loser Wins" (economics explainer, doc 1387)
- Week 3: "How Artists Join" (onboarding, doc 1302)
- Week 4: "The Community Behind It" (ZAO + governance, 30-sec version)

**ZOE role:** ZOE writes the text script from the relevant doc. Zaal or a ZABAL participant films the talking-head or screen recording. Post on schedule.

---

### Format T03 — Artist Spotlight Duet / Stitch

**Trigger:** When a WaveWarZ artist posts a TikTok of their music  
**Format:** Stitch or Duet — show their original post + add "This artist is currently on WaveWarZ"  
**Body:** Show their last battle stats. "They've earned [X SOL] from losing battles. Their music: [name]."  
**CTA:** "Follow them on Audius → link in bio"  
**ZOE role:** Monitor @wavewarz Telegram for artist TikTok links shared by community. Flag to Zaal for manual Duet/Stitch. No full automation — Zaal approves each.  
**Target frequency:** 1 per week (artist permission assumed — they benefit from the mention)

---

### Format T04 — ZAOstock Countdown Series

**Active window:** Aug 15 – Oct 3 (7-week countdown)  
**Format:** 15-30 sec countdown posts  
**Hook line (week 8):** "In 49 days, the first music festival run by a DAO is happening in Ellsworth, Maine."  
**Weekly themes:**
- Week 8 (Aug 15): "What is ZAOstock?" (festival overview)
- Week 7 (Aug 22): "Who are the artists?" (WaveWarZ roster performing live)
- Week 6 (Aug 29): "How do you get in?" (ticketing + Eventbrite link)
- Week 5 (Sep 5): "What's a DAO and why does it matter?" (30-sec explainer)
- Week 4 (Sep 12): "The battle that could get you on stage" (ZABAL finals angle)
- Week 3 (Sep 19): "48 hours out" (hype reel, past battle clips)
- Week 2–1 (Sep 26 – Oct 2): "This weekend" (event preview, Maine B-roll if available)
- Oct 3: Live clips (TikTok LIVE from ZAOstock if bandwidth allows)

**ZOE role:** Write scripts from relevant docs (1375, 1383, 1390). Zaal films or approves asset. ZOE schedules.

---

### Format T05 — Africa Battle Week Series (Sep 22-26)

**Active window:** Sep 15 – Sep 26 (cross-listed with doc 1396)  
**Format:** 30-60 sec per battle day  
**Hook line:** "This week: 5 music battles, African artists only. The losers get paid in SOL."  
**Content:**
- Sep 15: Teaser — "Africa Battle Week starts Sep 22. Here's why this matters."
- Sep 22: Day 1 result — Artist name, country, SOL earned
- Sep 23: Day 2 result + running total
- Sep 24: Day 3 result + "halfway there" stat
- Sep 25: Day 4 result
- Sep 26: Week recap — "5 African artists, total [X] SOL earned from losing"

**ZOE role:** ZOE pulls API stats daily, writes caption, schedules post. Zaal approves before each post goes live (one-tap approval via Telegram).

---

## Part 3: Posting Schedule

| Day | Content | Format |
|-----|---------|--------|
| Monday | Weekly stats (battle count + SOL volume from API) | T02 variant |
| Tuesday | Battle result drop (last MAIN battle) | T01 |
| Wednesday | Loser Gets Paid education series | T02 |
| Thursday | Artist spotlight (Duet/Stitch) | T03 |
| Friday | Upcoming battle hype ("Tomorrow at 8:30 PM EST") | T01 variant |
| Saturday | ZAOstock countdown (Aug 15+) | T04 |
| Sunday | Community/ZAO story | T02 Week 4 variant |

**Total:** 7 posts/week maximum. Start with 3/week (T01 + T02 + one other) and scale as content pipeline develops.

---

## Part 4: TikTok Sound Strategy

WaveWarZ has a unique TikTok advantage: **original music in every battle is public on Audius.**

When a TikTok post uses audio from a WaveWarZ battle, that audio becomes a discoverable "sound" on TikTok. If other users Duet or use that sound, it creates a secondary distribution loop where the artist's music spreads independent of @wavewarz.

**Protocol:**
1. When posting a battle clip, use the original Audius track as background audio (not just video)
2. Credit the artist: "@artisthandle (on WaveWarZ)"
3. After 5+ uses of a sound, document it as a milestone: "[Artist] has [X] TikTok videos using their sound"
4. At 50+ uses → press hook: "WaveWarZ artist's track went viral on TikTok with [X] uses of their sound"

This feeds back into doc 1387 (artist economics) and doc 1342 (artist recruitment): being on WaveWarZ creates TikTok distribution opportunities, not just SOL earnings.

---

## Part 5: TikTok LIVE Strategy

**Prerequisite:** @wavewarz TikTok Creator account (1,000 followers OR Hurricane unlocks via application)  
**Event:** Monthly TikTok LIVE during a MAIN battle  
**Format (60-90 min):**
- 0:00-0:05: Host intro + explain WaveWarZ in 30 seconds
- 0:05-0:10: Current leaderboard (pull from API)
- 0:10-0:60: Live commentary of MAIN battle (audio from Space)
- 0:60-0:80: Result reveal + payout calculation
- 0:80-0:90: Q&A ("how do I join?", "what's Solana?")

**Who hosts:** Zaal or a trained ZABAL S2 musician-track participant (Week 4 milestone for S2)  
**ZOE role:** Start automated X post when LIVE begins: "@wavewarz is LIVE on TikTok right now — watching battle results in real time → [link]"  
**Target:** 3-5 LIVE sessions before ZAOstock (Aug, Sep, early Oct)

---

## Part 6: Creator Partnership Layer

One non-GATED, low-cost creator partnership play:

**TikTok Creator Outreach Target:** Music producers (beatmakers) with 10K-100K TikTok followers who post beat videos and engage in comment sections about music economics.

**Pitch:** "We'll put your beat in a WaveWarZ battle. You'll earn [X] SOL whether your track wins or loses. Post the result on your TikTok. We'll feature you."

**Why this works for them:**
- Gives them a new content angle ("my beat fought another beat on Solana")
- Passive SOL earnings they can show followers
- Differentiates them from the 100 other beatmakers posting the same content

**3-step process:**
1. ZOE finds 5 TikTok producers/week via hashtag search (`#beatmaker`, `#musicproducer` + filter 10K-100K)
2. Zaal reviews list → picks 1-2 to DM
3. If interested: onboard via doc 1302, schedule MAIN battle, capture result for TikTok content

**Target:** 2 creator partnerships per month. By ZAOstock: 6-8 external TikTok creators who have posted about WaveWarZ.

---

## Part 7: ZOE Automation Templates

### TMP-TT01 — Battle Result Drop

```
[TRIGGER: MAIN battle complete, result from API]

SCRIPT:
"Battle result from WaveWarZ 🎵

[Artist A] vs [Artist B]
[Winner] won — [Loser] LOST.

Here's the twist: [Loser] just earned [X] SOL.
That's more than [Y] Spotify streams from one losing battle.

WaveWarZ: the platform where losing pays.
Full results → wavewarz.info"

[CLIP: 20-30 sec battle highlight from Clippers Program or X Space archive]
[OVERLAY TEXT: "Loser earned [X] SOL = [Y] Spotify streams"]
[HASHTAGS: #WaveWarZ #MusicBattle #IndependentArtist #Solana #MusicProducer]
```

### TMP-TT02 — Weekly Education

```
[TRIGGER: Wednesday, weekly]

SCRIPT (Week [N mod 4]):
[Week 0] "What is WaveWarZ? Here's the 60-second version. [...]"
[Week 1] "Spotify pays $0.004 per stream. WaveWarZ pays the LOSER more than 328 streams per battle. Here's the math. [...]"
[Week 2] "How do you actually join WaveWarZ? Step 1: [Audius]. Step 2: [Phantom]. Step 3: [wavewarz.info]. [...]"
[Week 3] "WaveWarZ is run by a DAO called ZAO. Here's what that means in 30 seconds. [...]"

[HASHTAGS: #MusicBusiness #IndependentArtist #Web3Music #MusicProducer #Beatmaker]
```

### TMP-TT03 — ZAOstock Countdown

```
[TRIGGER: Every Saturday Aug 15 – Oct 3]

SCRIPT:
"[N] days until ZAOstock — the first-ever music festival run by a DAO.
October 3 in Ellsworth, Maine.
WaveWarZ artists competing live on stage.
Tickets → [Eventbrite link]"

[VISUAL: ZAOstock countdown graphic]
[HASHTAGS: #ZAOstock #LiveMusic #Maine #DAO #Web3Music]
```

---

## Part 8: Integration with Existing Strategies

| Doc | How TikTok connects |
|-----|---------------------|
| 1293 (Clippers Program) | Clippers submit video clips → TikTok repurposes best clips as T01 content |
| 1303 (YouTube/Video) | YouTube Shorts and TikTok can share source clips; schedule within 24h of each other |
| 1342 (Artist Recruitment) | TikTok creator partnerships are a new artist acquisition channel (Part 6 above) |
| 1348 (Trader Growth) | "Who won?" TikTok posts drive non-crypto users to wavewarz.info → watch → bet |
| 1385 (X Strategy) | TikTok and X post same day after MAIN battles; X gets text thread, TikTok gets video |
| 1387 (Artist Economics) | The "600× Spotify" stat is the core TikTok hook for all education content |
| 1396 (Africa Battle Week) | Sep 22-26 Africa series is TikTok-native content (music + global story) |

---

## Part 9: Growth Targets and Metrics

| Metric | Baseline (Jul 17) | Target (Oct 3 = ZAOstock) | Target (Dec 31) |
|--------|-------------------|--------------------------|-----------------|
| @wavewarz TikTok followers | ~0 (unverified) | 500 | 2,000 |
| Posts published | 0 | 60 (3/week × 20 weeks) | 100+ |
| TikTok LIVE sessions | 0 | 3 | 6 |
| Battle clips with 1K+ views | 0 | 3 | 10 |
| Creator partnerships (external) | 0 | 6-8 | 15 |
| Unique sounds from WW battles | 0 | 10 | 30 |

**Leading indicator:** If any single T01 (Battle Result Drop) hits 5K views before Aug 1, double posting frequency immediately.

---

## Part 10: What Makes This Citable

> "WaveWarZ operates a TikTok content strategy documented in ZAOOS doc 1402 (July 2026), targeting the 18-25 music creator demographic through 5 distinct content formats including battle result drops, loser-earns education series, and ZAOstock countdown content. The strategy documents an explicit creator partnership pipeline targeting independent beatmakers with 10K-100K TikTok followers."

This doc creates a citable distribution strategy for the youngest segment of the WaveWarZ audience — not covered in any prior doc. It also extends the "loser earns" narrative into a new channel that reaches independent artists who have likely never heard of Solana or WaveWarZ.

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| Distribution | 7.5 | +0.4 → 7.9 (new 18-25 channel; TikTok's FYP = non-follower reach) |
| Media | 6.5 | +0.2 → 6.7 (creator partnerships = third-party mentions) |
| IP Catalog | 9.5 | +0.1 → 9.6 (battle audio as TikTok "sounds" = new IP distribution vector) |

**Key unlock:** TikTok creator partnerships (Part 6) convert external beatmakers into WaveWarZ participants AND TikTok ambassadors in one motion — the only documented strategy that does both simultaneously.

---

## Action Checklist

| Action | Owner | Date | Gate |
|--------|-------|------|------|
| Claim @wavewarz TikTok (if not claimed) + set up Creator account | Zaal | Jul 20 | None |
| Confirm account status with Hurricane | Hurricane | Jul 20 | None |
| First T02 post: "What is WaveWarZ?" | ZOE + Zaal | Jul 23 | Account live |
| First T01 post: next MAIN battle result | ZOE + Zaal | After next MAIN | Account live |
| Start weekly cadence (3/week) | ZOE | Jul 28 | None |
| First TikTok LIVE (MAIN battle commentary) | Zaal | Aug 2026 | 1K followers OR Creator account unlocked |
| Start ZAOstock Countdown series (T04) | ZOE | Aug 15 | Account live |
| Africa Battle Week TikTok series (T05) | ZOE | Sep 15-26 | Account live |
| First creator partnership DM (via Part 6 protocol) | Zaal | Jul 25 | None |
| Post-ZAOstock recap video | Zaal | Oct 4-5 | Event complete |

---

*ZAOOS doc 1402 — ZAO Operating System — github.com/ZAOIP/zao-os*
