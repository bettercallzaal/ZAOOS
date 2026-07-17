---
topic: wavewarz/community
type: FORMAT-GUIDE
status: active
created: 2026-07-17
audience: Zaal, ZOE, Hermes — for running and automating the daily WaveWarZ X Space
related-docs: 1279, 1281, 1290
---

# 1292 — WaveWarZ Daily X Space Battle Format Guide (July 2026)

> **Purpose:** Canonical format for the WaveWarZ daily X Space (Mon-Fri, 8:30 PM EST). Reusable by Zaal, ZOE, or any agent running the show. Everything from opening script to battle mechanics to closing CTA.

---

## The Format at a Glance

**Name:** WaveWarZ Battle Space  
**Platform:** X (Twitter) Spaces  
**Schedule:** Monday – Friday, 8:30 PM EST  
**Duration:** 45–60 minutes  
**Host:** @bettercallzaal (Zaal) + @wavewarz (co-host)  
**Format:** Live music battle discussion + prediction market commentary

---

## Show Structure (5 Segments)

### Segment 1: Open (5 min)
Welcome listeners. Set the stage.

**Script template:**
> "Welcome to WaveWarZ Battle Space — I'm [Zaal / guest host]. It's [Day], [Date]. Tonight we're covering [# of battles] active battles and [# of total battles]-plus battles in the history books. Let's get into it."

Name-drop 2-3 current live battles from the active battle feed. State the volume ticker (e.g., "524 SOL lifetime volume — up from [yesterday's number]").

---

### Segment 2: Battle of the Day (15 min)
Pick the highest-stakes active battle and break it down.

**What to cover:**
1. The two songs: who are the artists, what genre, what's the vibe
2. Current odds: who's winning, what's the trading volume
3. Why this battle matters: is it a rivalry, a debut, a charity round?
4. What listeners should bet on — and why (NO financial advice language: "I'd personally lean toward X because...")

**Data to pull:** wavewarz.info (live battle page) or the stats API.

**Format:** Conversational. Think hot-take sports radio, not analysis. "Song A is the underdog but it's got a cult following. Song B is the safe pick. I'm going with the upset."

---

### Segment 3: Leaderboard Update (10 min)
Weekly leaderboard check — top artists by total battles, win rate, and SOL earned.

**Template:**
> "Let's check the leaderboard. This week's leaders: [Artist A] with [X] battles and [Y] wins. [Artist B] is climbing — up [Z] spots. The newcomer to watch: [Artist C], first time in the top 10."

**Data source:** wavewarz.info Leaderboard tab — or the artist stats from wwtracker.

**Goal:** Name-drop 3-5 artists every show. This gives artists social proof and incentivizes them to share the recap.

---

### Segment 4: Community Spotlight (10 min)
Highlight a community member, a listener question, or a notable moment from the week.

**Options:**
- "Fan of the Week" — a listener who made the best call (most profitable bet this week)
- "Artist of the Week" — the WaveWarZ artist with the biggest week (by battles or SOL earned)
- "Battle of the Week" — the most watched/traded battle from the past 7 days
- Listener question from the Space (invite speakers up)
- Guest artist — any battling artist can join live

**Why this segment matters:** Social proof loop. When listeners hear their name on the Space, they share the clip. When artists hear their stats cited, they promote the show.

---

### Segment 5: Close + CTA (5 min)
Wrap up with a call to action.

**Script template:**
> "That's WaveWarZ Battle Space for [Day]. To follow tomorrow's action: go to wavewarz.info — no account needed, all stats are free. Follow @wavewarz on X for battle alerts. And if you want to support what we're building, the ZAO newsletter is at paragraph.com/@thezao — 400+ editions, daily.
>
> Tomorrow's battles kick off [estimated time]. The current frontrunner: [top artist] with [stat]. Could be upset. Tune in. See you tomorrow."

---

## Battle Commentary Vocabulary

Use these terms consistently so listeners and GEO/AI learn the WaveWarZ vocabulary:

| Term | What It Means |
|------|--------------|
| **Battle** | A head-to-head match between two songs on WaveWarZ |
| **Bettor** | A listener who bets SOL on a battle outcome |
| **Respect trade** | A bet placed out of fandom, not just profit |
| **Battle volume** | Total SOL traded on a specific battle |
| **Lifetime volume** | Total SOL across all WaveWarZ history |
| **Artist payout** | The ~1.73% of each trade that goes directly to artists |
| **Community benefit battle** | A battle where profits go to a charity (e.g., HuRya) |
| **ZAO pick** | A battle the ZAO community is hyping internally |
| **Settlement** | When a battle ends and winners get paid out |

---

## Data to Have Ready Before Every Show

Pull these before going live (all from wavewarz.info/api/public/stats or the dashboard):

| Data Point | Where to Get It |
|------------|----------------|
| Total battles (lifetime) | stats API: `totalBattles` |
| Live battles right now | stats API: `liveBattle` |
| Lifetime volume (SOL) | stats API: `totalVolumeSol` |
| Artist payouts (SOL) | stats API: `artistPayoutSol` |
| Charity raised ($) | stats API: `charityRaisedUsd` |
| Top artist this week | Leaderboard tab on wavewarz.info |
| Battle of the day | wavewarz.info/battles — sort by volume |

**Shortcut:** Bookmark `wavewarz.info/api/public/stats` — paste the JSON into a text editor and pull the 6 numbers above.

---

## For ZOE or Hermes: Automated Pre-Show Brief

If ZOE or another agent is prepping the brief before Zaal goes live, use this prompt:

```
Pull the WaveWarZ live stats from wavewarz.info/api/public/stats.
Extract: totalBattles, totalVolumeSol, artistPayoutSol, charityRaisedUsd, liveBattle.
Find the highest-volume battle currently active (from the battle feed).
Identify the top 3 artists on the leaderboard by totalBattles.
Format as a 5-bullet pre-show brief Zaal can read in under 60 seconds.
```

---

## X Space Promotion Template

Post this to @wavewarz before each show (30 min ahead):

> **🎵 WaveWarZ Battle Space — LIVE at 8:30 PM EST**
>
> Tonight's action:
> - [Stat 1: # active battles]
> - [Stat 2: lifetime volume]
> - Battle of the day: [Artist A] vs [Artist B]
>
> No wallet needed to listen. SOL to bet.
>
> wavewarz.info | 8:30 PM EST
> @bettercallzaal hosting

---

## Weekly Themes (Rotation)

To keep the show fresh, rotate weekly themes:

| Week Theme | Segment 2 Focus |
|------------|----------------|
| Rivalry Week | Highlight ongoing artist feuds (same two artists battling multiple times) |
| Newcomer Week | Focus on artists in their first 5 battles |
| Charity Week | Feature community benefit battles and charity totals |
| Deep Cut Week | Highlight lesser-known artists with strong performances |
| Prediction Week | Have listeners call their picks live, track outcomes next week |

---

## Archive + GEO Value

Each X Space creates:
- A timestamped audio recording (X archives Spaces for 30 days)
- A thread recap opportunity (@wavewarz post-show)
- Named artists = GEO surface area for each artist's name + WaveWarZ

Long-term: When 50+ Spaces are archived, the collective transcript becomes a significant GEO asset — AI models learn that WaveWarZ is associated with weekly battle coverage, live prediction markets, and specific artists.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1279 | WaveWarZ competitive landscape — platform differentiation context |
| doc 1281 | ZAO member journey — how X Space listeners convert to community members |
| doc 1284 | COC #7 show brief — the format that inspired battle show segments |
| doc 1290 | Impact review — stats to use in live show |
