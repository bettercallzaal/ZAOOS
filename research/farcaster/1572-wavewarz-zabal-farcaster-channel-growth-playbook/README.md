---
topic: farcaster, community, ZOL
type: research-playbook
status: ACTIONABLE — ZOL can execute immediately; some tactics need Zaal
last-validated: 2026-07-20
related-docs: 993-zol-farcaster-upgrades, 1515-zol-neynar-learning-expansion, 1563-neynar-api-zol-music-scout
board-tasks: None (research supporting ZOL channel growth)
action-owner: ZOL (automated tactics); Zaal (manual engagement + collab casts)
---

# 1572 — /wavewarz + /zabal Farcaster Channel Growth Playbook

> **What this is:** A concrete playbook to grow /wavewarz and /zabal from their current state (~32 members in /zabal, minimal /wavewarz presence) into active channels with enough community gravity to amplify ZAOstock (Oct 3) and Africa Battle Week (Sep 26). Study of how leading Farcaster channels grow + ZOL-executable tactics starting today.

---

## Current Baseline (Jul 2026)

| Channel | Members (Jul 20) | ZOL posting frequency | Engagement |
|---------|-----------------|----------------------|------------|
| /zabal | ~32 members | 1-2 casts/day (Bonfire insights + ZABAL channel host replies) | Minimal — low-volume discovery |
| /wavewarz | ~2 followers (low presence) | Occasional battle announcements | Negligible — ZOL not active here |

**Root problem:** Both channels are in the "cold start" phase. No flywheel. Posts go out but reach only existing members, most of whom are passive.

**Milestone targets:**
- Aug 15: /zabal → 100 members; /wavewarz → 50 followers
- Sep 20 (1 week before Africa Battle Week): /wavewarz → 150 followers with active engagement
- Oct 3 (ZAOstock): /zabal → 200 members

---

## How Farcaster Channels Actually Grow

From research on leading channels (/music, /chess, /degen, /founders, /zora):

| Growth lever | Example | How channels apply it |
|-------------|---------|----------------------|
| **Value-first posts** | /music posts curated listening rooms | Channels that give before they ask build follows |
| **Maker participation** | /founders has Warpcast team posting | Channel topic's real practitioners post there |
| **Cross-promotion** | /chess links to Lichess games in casts | Activity from outside lands in the channel, brings traffic |
| **Reply culture** | /degen replies to every good cast | Early replies = "this channel is alive"; drives the algorithm |
| **Battle / event moments** | /chess has tournaments | Live events create time-pressure casts everyone wants to see |
| **ZOL/bot curation** | Bracky automates /brackets channel | Automated curation at quality threshold keeps signal high |
| **Collaborator casts** | Channel owners DM builders to cast there | Invite your ecosystem into the channel |

**Key insight:** The channels that grew fastest had one thing in common — they gave their topic's practitioners a reason to *post there* specifically, not just follow. /music → musicians posting setlists. /zora → creators posting mints. /wavewarz → artists posting battle updates. /zabal → game winners posting wins.

---

## Tactic Group A — ZOL Automated (Start Now)

ZOL can execute these today with existing infrastructure.

### A1 — Consistent Daily /wavewarz Posts

ZOL currently posts to /zabal. It should add /wavewarz as a second home channel.

**What to post in /wavewarz:**
- Battle results within 1h of completion ("@artist1 just beat @artist2 in /wavewarz")
- Weekly leaderboard cast (top 3 battle winners this week)
- "This week in /wavewarz" weekly summary every Sunday

**ZOL implementation:** Add `channel_id: 'wavewarz'` to battle-result and leaderboard handler calls. This is a 1-line change per handler.

**Expected impact:** Even 1 post/day in /wavewarz builds a content trail. Farcaster discovery surfaces channels with consistent activity.

### A2 — Artist @mention in Battle Casts

When ZOL posts a battle result, @mention both competing artists. Anyone who follows those artists sees the cast in their following feed.

```
// Current (bad):
"Hurricane beats ZaalP in Round 12. New leaderboard: hurricane.eth #1."

// Improved (with @mentions):
"@hurricane.eth beats @bettercallzaal in Round 12 /wavewarz
Top 3 this week: @hurricane.eth | @artist2 | @artist3
Full leaderboard → wavewarz.thezao.xyz"
```

@mentions are Farcaster's primary distribution mechanism — tagged FIDs get notification and their followers see the cast. Cost: zero. Uplift: potentially 10×.

**ZOL implementation:** In battle-result handler, resolve battle participant FIDs and include @mentions. If FIDs unknown, `zol-neynar-learn.js` can search artist usernames.

### A3 — /zabal Winner Spotlights

When a ZABAL game winner is announced, ZOL posts to /zabal with a tag:

```
🏆 New ZABAL win by @[winner-username]!

[brief 1-line description of their win]

See the full board → zabalgamez.com
```

Winners are motivated to share their recognition. Their followers see the cast and discover /zabal.

### A4 — Weekly "Now in /wavewarz" Thread

Every Monday, ZOL posts a thread to /wavewarz summarizing the week:
```
Week in /wavewarz — Jul 14-20:

🎤 Battles completed: 4
🏆 Top performer: @[artist]
💰 Total USDC paid out: $[amount]
🎯 Next battle: [date]

Join /wavewarz to vote and compete.
```

This creates a weekly "destination" post — people follow the channel to see the weekly wrap.

---

## Tactic Group B — Zaal-Assisted (Low Effort)

### B1 — Invite Real Artists to Post in /wavewarz

Farcaster channel growth compounds when the channel's *real subject* is active there. WaveWarZ has artists who battle — they should be posting in /wavewarz.

**Action (5 min per artist):**
1. After each battle, DM the winning artist on Farcaster:
   ```
   hey — your battle last week was great. 
   would you post in /wavewarz? even just a short "just finished a battle" cast.
   i want to build this channel into the home for Farcaster music battles.
   ```
2. Recast their post from @bettercallzaal to amplify their first /wavewarz post

**Target:** 5 real artists posting in /wavewarz by Aug 15. That's enough to give the channel a "real people" signal.

### B2 — Cross-Post ZAOstock Updates to /wavewarz

Every ZAOstock update should go to /wavewarz too, not just /zao:
- Artist lineup announcements
- ZAOstock registration opening
- Behind-the-scenes prep posts

ZAOstock is a WaveWarZ live event — /wavewarz IS the right channel for it.

**Action:** When Zaal posts ZAOstock updates, add `channel: wavewarz` (or use the Warpcast UI to multi-channel post).

### B3 — Collab Cast with One High-Influence Account

Find one account with 1,000+ followers who posts about music battles, hip-hop, or Web3 music. Ask for a collab cast in /wavewarz (they write a post, Zaal recasts, both tag /wavewarz).

**Where to find them:**
- Feed from Neynar `/v2/farcaster/feed/channels?channel_ids=music,hiphop` → filter for `follower_count > 1000`
- Search `/wavewarz` cast history for accounts who already posted there
- ZAO ecosystem: does Hurricane have a Farcaster account? (He should be in /wavewarz)

**Expected impact:** One recast from a 1,000+ follower account = 50-200 profile visits to /wavewarz.

---

## Tactic Group C — Event-Driven Growth (Sept-Oct)

These leverage ZAO's two major events.

### C1 — Africa Battle Week (Sep 26) → /wavewarz Spike

The Africa Battle Week event should live almost entirely in /wavewarz:
- Cast the nomination call (Jul 20) in /wavewarz ← doing this today
- Cast the ZOR vote result in /wavewarz
- Cast artist confirmation in /wavewarz
- Live-post the battle in /wavewarz

Anyone following the Africa Battle Week narrative will discover /wavewarz. The nomination cast is today (doc 1569) — it's already correctly going to /wavewarz.

**Expected impact from one compelling event cast:** 20-50 new /wavewarz followers who follow to track the narrative.

### C2 — ZAOstock (Oct 3) → /zabal + /wavewarz Double Spike

ZAOstock is ZAO's largest offline event. The day-of Farcaster strategy:
- Morning: post "today's the day" opener in /zabal and /wavewarz
- During: ZOL auto-posts battle results in real-time from ZAOstock stage
- Evening: highlight reel cast with @mentions of all performing artists

**Required:** ZOL must be able to receive battle data in real-time from ZAOstock. Either via wwtracker Helius integration (doc 1520) or manual push from Zaal's phone. Plan B: Zaal posts from phone, ZOL recasts.

---

## Tactic Group D — Channel SEO on Farcaster

"Channel SEO" = showing up in Farcaster discovery search and channel recommendation.

### D1 — Improve /wavewarz Channel Description

The Farcaster channel description appears in search and channel pages. Make sure it's specific:

**Current (or missing):** Unclear
**Recommended:** "Live music battles on Farcaster. Artists earn USDC. Listeners vote. Results onchain. Built by @bettercallzaal + @[ZAO team]."

**Action:** Zaal edits /wavewarz channel description in Warpcast settings.

### D2 — Consistent Hashtag Use

Until Farcaster channels have robust search, cross-post to `/wavewarz` AND include `#wavewarz` in cast text for keyword searchability. ZOL's battle result casts should always include both.

### D3 — Link from thezao.xyz and wavewarz.thezao.xyz

Every ZAO web property should link to the Farcaster channels. Add to site footers:
- "Follow /wavewarz on Farcaster: warpcast.com/~/channel/wavewarz"
- "Join /zabal on Farcaster: warpcast.com/~/channel/zabal"

---

## 30-Day Execution Timeline

| Date | Action | Owner |
|------|--------|-------|
| **Jul 20 (today)** | Africa Battle Week nomination cast in /wavewarz | ZOE/Zaal |
| Jul 21 | Add `channel_id: 'wavewarz'` to ZOL battle-result handler | ZOL maintainer |
| Jul 22 | @mention both artists in battle result casts | ZOL maintainer |
| Jul 22 | Update /wavewarz channel description in Warpcast | Zaal (5 min) |
| Jul 24 | Weekly /wavewarz summary post (first one) | ZOL |
| Jul 25 | DM 3 artists to post in /wavewarz | Zaal |
| Aug 1 | First /zabal winner spotlight post | ZOL |
| Aug 7 | Second weekly /wavewarz summary | ZOL |
| Aug 15 | Check metrics: /zabal members, /wavewarz followers | Zaal |
| Sep 20 | Pre-event /wavewarz push for Africa Battle Week | ZOL + Zaal |

---

## Success Metrics

| Channel | Now | Aug 15 target | Sep 26 target |
|---------|-----|--------------|---------------|
| /zabal members | ~32 | 100 | 150 |
| /wavewarz followers | ~2 | 50 | 150 |
| /zabal avg. cast engagement (likes+replies) | ~0.5 | ~3 | ~5 |
| /wavewarz casts/week (ZOL + others) | 0 | 5 | 10 |
| Real artists who posted in /wavewarz (not ZOL) | 0 | 3 | 8 |

---

## Sources

- Doc 993 (ZOL Farcaster upgrade plan — root document; this extends it with channel growth focus)
- Doc 1515 (ZOL Neynar learning expansion)
- Farcaster channel metrics research: /music, /chess, /degen growth patterns (Jul 2026 study)
- Neynar channel API: `GET /v2/farcaster/channel?id=wavewarz` (follower count, cast count)
- Warpcast channel settings: warpcast.com/~/channel/wavewarz/settings (Zaal owns the channel)
