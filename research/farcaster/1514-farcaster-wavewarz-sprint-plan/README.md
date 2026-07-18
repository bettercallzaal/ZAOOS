# 1514 — /wavewarz Farcaster Channel Sprint Plan (Jul 18 – Oct 3, 2026)

**Type:** SPRINT-PLAN  
**Topic:** Farcaster  
**Status:** START NOW — 11-week sprint. ZOE executes most posts; Zaal reviews weekly.

---

## Sprint Goals

By ZAOstock (Oct 3):
- /wavewarz followers: 200+ (from current baseline)
- /wavewarz average impressions per cast: 500+
- At least 1 cast that breaks 5K impressions (COC #7 result or ZAOstock announcement)
- WaveWarZ Mini App published (doc 1480 — Phase 1)
- /wavewarz channel becomes the primary Farcaster source for WaveWarZ battle results

---

## Posting Cadence

| Frequency | Type | Who |
|---|---|---|
| After every MAIN battle | Battle result cast | ZOE (from API) |
| Weekly (Thursday) | Governance session recap | ZOE |
| Weekly (Monday) | "This week in WaveWarZ" | ZOE |
| On COC show days | Pre-show + result cast | ZOE |
| Jul 21 | ZAOstock Eventbrite launch | Zaal |
| Aug 1 | Mirror Article 1 post | ZOE |
| Aug 15 (if COC #8) | COC #8 show day cast | ZOE |
| Sep 26 | Africa Battle Week cast | ZOE |
| Oct 1–3 | ZAOstock countdown casts | ZOE (3 casts) |

---

## Paste-Ready Cast Templates

### Battle Result Cast (After Every MAIN Battle)
```
WaveWarZ MAIN battle result.

Winner: [WINNER HANDLE] (+[WIN SOL] ◎)
Loser: [LOSER HANDLE] (+[LOSE SOL] ◎ — yes, even the loser earns)

Battle ID: [ID]
Total pool: [TOTAL SOL] ◎

/wavewarz #WaveWarZ
```

### Governance Recap (Every Thursday After Session)
```
ZAO governance week [N].

[Top agenda item from this week's session]
Session [X] of the streak. 64+ consecutive weeks.

Full record: [ZAOOS link]

/wavewarz /zao
```

### COC #7 Result (Post Today, Jul 18)
```
COC Concertz #7 just wrapped.

First time WaveWarZ battle was voted on live by a streaming audience.

Result: [WINNER] beat [LOSER]. [WINNER] earned [SOL] ◎. [LOSER] earned [LOSER SOL] ◎.

COC #8: [DATE PENDING]
ZAOstock: Oct 3, Ellsworth ME

/wavewarz /coc
```

### ZAOstock Announcement (Jul 21)
```
ZAOstock is real.

Saturday, October 3 · Ellsworth, Maine

Live music + WaveWarZ battle + DAO governance vote from the audience.

RSVP: [Eventbrite URL]

The DAO goes IRL. /wavewarz
```

### ZAOstock Countdown Casts (Oct 1–3)

**Oct 1:**
```
2 days until ZAOstock.

64 governance sessions online. 1 session IRL — Oct 3.

RSVP still open: [Eventbrite URL]

/wavewarz
```

**Oct 2:**
```
Tomorrow: ZAOstock.

Ellsworth, Maine · 2PM EST

The audience IS the vote. You're not watching — you're governing.

/wavewarz
```

**Oct 3:**
```
Today is ZAOstock.

Doors: 2PM · Location: [Venue], Ellsworth ME

If you're here: DM @bettercallzaal
If you're watching: follow /wavewarz for live updates

Let's go.
```

### Africa Battle Week (Sep 26)
```
Africa Battle Week.

Today's battle: [Africa/diaspora artists vs TBD]

Community-voted. ZOR holders chose the artists. Winner earns. Loser earns.

ZAOstock is Oct 3. This is week 1 of 2.

/wavewarz
```

### COC #8 Show Day (Pre-Show, ~1h Before)
```
COC Concertz #8 starts in 1 hour.

Month 8 of the streak.

WaveWarZ battle vote goes live at [TIME]. Stream: [Spatial/Twitch link]

/wavewarz /coc
```

### Mirror Article 1 (Aug 1)
```
"The Loser Earns: How ZAO Built a Music Economy Where Losing Pays"

New article on Mirror. 1,245 battles. 64 governance weeks. ZAOstock Oct 3.

[Mirror URL]

/wavewarz
```

---

## Mini App Angle (Farcaster-Native WaveWarZ)

The WaveWarZ Farcaster Mini App (doc 1480, Phase 1) would allow Farcaster users to:
- See the current live MAIN battle
- Vote directly from a Farcaster cast
- View their battle history and earnings

**Phase 1 target: in-app battle viewing** (no voting yet — read-only).
**Phase 2: voting from Farcaster** (after Mini App spec confirmed with Neynar/Arthur — doc 1503 DM #3).

When the Mini App is live, every battle result cast can link directly to the Mini App frame, driving votes and engagement without leaving Farcaster.

---

## Channel Growth Tactics

### 1. Battle-to-Cast Automation
ZOE watches the WaveWarZ API for MAIN battle completions and auto-drafts the result cast template. Zaal approves before posting (or ZOE posts directly after confirmed ZOE autonomy).

### 2. Reply to Relevant Casts
ZOE monitors for casts mentioning "music battle", "WaveWarZ", "on-chain music", or "DAO" on Farcaster and drafts a reply (Zaal approves before sending).

### 3. Cross-Promote with /music, /web3, /dao Channels
Post one cross-cast per week in `/music` or `/dao` channel when there's a natural hook (milestone, COC show, Africa Battle Week).

### 4. Engage ZOR Holders on Farcaster
Pull ZOR holder addresses → check if any have linked Farcaster accounts → ZOE drafts personal "you're a ZAO voter, here's what happened this week" cast.

### 5. ZAOstock Pre-Event Thread
1 week before ZAOstock: post a 5-cast thread in /wavewarz covering the history, the artists, the vote format, and the charity. Pin to channel.

---

## ZOE Automation Notes

ZOE should:
- Check WW API at end of each governance session for new MAIN battle results
- Draft battle cast from template, send to Zaal for approval via Telegram
- Auto-post after Zaal sends "👍" in the ZOE Telegram thread
- Track /wavewarz follower count in the 7PM EOD report (doc 1499) weekly

Follower count API: Farcaster follower count can be fetched from Neynar API (`/v2/farcaster/channel?id=wavewarz`) — ZOE should add this to the 7PM report.

---

## Milestone Tracking

| Milestone | Target Date | Signal |
|---|---|---|
| /wavewarz 50 followers | Aug 1 | Post: "50 people watching WaveWarZ on Farcaster" |
| /wavewarz 100 followers | Sep 1 | Post: "100 Farcaster watchers before ZAOstock" |
| /wavewarz 200 followers | Oct 3 (ZAOstock) | Feature in ZAOstock stage announcement |
| Mini App Phase 1 live | Aug 15 | Announce in /wavewarz with frame link |
| First cast with 5K+ impressions | by Sep 1 | ZAOstock announcement or COC #7/8 result |

---

## Related Docs

- 1480 — WaveWarZ Farcaster Mini App Spec (Phase 1 build plan)
- 1499 — ZOE Daily Ops Report (follower count tracked here weekly)
- 1503 — Jul 25 Partner DM Pack (DM #3 = Neynar/Arthur for Mini App)
- 1502 — COC #7 Post-Show Pack (Farcaster cast is Post 5 in that doc)
- 1511 — COC #8 Date Announcement Pack (Farcaster cast template included)
- 1498 — Africa Battle Week Vote Protocol (Farcaster cast included)
- 1508 — ZAOstock Eventbrite Launch Pack (Farcaster announcement post included)
