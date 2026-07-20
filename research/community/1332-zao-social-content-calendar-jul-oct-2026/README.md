---
topic: community/distribution
type: CALENDAR
status: actionable
created: 2026-07-17
board-task: dfbf3f0e
related-docs: 1319, 1322, 1325, 1329, 1331, 1292, 1293
owner: ZOE
---

# 1332 — ZAO Social Content Calendar + ZOE Templates (Jul–Oct 2026)

> **Purpose:** Give ZOE concrete templates so she can post autonomously without waiting for Zaal to draft every update. ZOE's Tier-1 automations (doc 1322) are ready to ship — this doc is the content layer they need.
>
> **Channels:** @bettercallzaal (X), @wavewarz (X), /zao (Farcaster)  
> **Period:** Jul 17 → Oct 3 (ZAOstock) — 11 weeks

---

## Daily Post Rhythm (ZOE Default Schedule)

| Day | Post Type | Channel | ZOE or Zaal? |
|-----|-----------|---------|--------------|
| Monday | WW weekly recap (battles + SOL + top artist) | @wavewarz | ZOE |
| Tuesday | Artist spotlight (leaderboard top performer this week) | @wavewarz | ZOE |
| Wednesday | ZAO insight (governance/IP/ecosystem angle) | @bettercallzaal | Zaal / ZOE draft |
| Thursday | ZAOstock countdown (rotating: artist hint, venue preview, ticket CTA) | @bettercallzaal | ZOE |
| Friday | WW "battle of the week" (Friday highlight from Monday–Thu battles) | @wavewarz | ZOE |
| Saturday | Open slot (Farcaster cast + POIDH bounty / community shout-out) | /zao | ZOE |
| Sunday | Rest / off (no post unless breaking news) | — | — |

---

## Template Library

### TMP-01: Monday WW Weekly Recap

```
WaveWarZ weekly update — [date range]

⚔️ [X] battles this week
💰 [Y] SOL wagered
🏆 [Artist] leads leaderboard ([W]-[L])
📊 [Z]+ total battles since launch

On-chain music battles, daily 8:30PM EST.
→ wavewarz.info

#WaveWarZ #OnchainMusic #SoundxSolana
```

*ZOE data inputs:* Pull from wavewarz.info/api/public/stats for total; diff from last week's snapshot for "this week." Pull leaderboard for top artist.

---

### TMP-02: Tuesday Artist Spotlight

```
🎤 Artist spotlight: [ARTIST NAME]

[W] wins • [L] losses • [SOL] earned onchain

"[Artist's best battle result or notable quote if available]"

Battle them at 8:30PM EST on @wavewarz
→ wavewarz.info/artists/[handle]

#WaveWarZ #[ArtistHandle]
```

*ZOE data inputs:* Rotate through leaderboard top 10, one per week. wwtracker artist pages for win/loss/SOL data.

---

### TMP-03: Wednesday ZAO Insight (5 rotating themes)

**Theme A — Governance**
```
The ZAO has run [N] consecutive weeks of Fractal governance.

No token purchase required. No whale dominance.
Governance weight = your contribution.

157 on-chain Respect holders. 505 transactions.
Building the world's most documented music DAO.

→ thezao.com | @bettercallzaal
```

**Theme B — Artist economics**
```
Spotify pays $0.004 per stream.

WaveWarZ pays artists 1.73% of every SOL bet on them.
Instantly. Onchain. Even when they lose.

9.07 ◎ paid to artists since launch.
That's 600× Spotify's rate per unit.

→ wavewarz.info/api/public/stats
```

**Theme C — IP catalog**
```
921 unique songs entered into WaveWarZ battles.

These songs are the ZAO's cultural catalog.
Each one: a documented piece of onchain IP.
Each one: a bet that this artist deserves to be heard.

→ wavewarz.info | #OnchainMusic
```

**Theme D — ZAOstock preview**
```
ZAOstock. Oct 3. Ellsworth, Maine.

8 artists. Selected by onchain battle history.
No label. No A&R. Just the community's SOL.

The first festival where the lineup was voted in by money.

Tickets → [link]
```

**Theme E — Charity angle**
```
$1,497 raised for charity through WaveWarZ Community Battles.

Two benefit rounds. On-chain proof.
HuRya Foundation is the beneficiary.

This is what music looks like when the community decides.

→ wavewarz.info
```

*ZOE schedule:* Rotate A→B→C→D→E each Wednesday. Zaal reviews drafts before post goes live (15-min approval window; auto-post after 24h if no response — configurable).

---

### TMP-04: Thursday ZAOstock Countdown

**Phase 1: Jul 17 → Aug 1 (No reveal yet)**
```
ZAOstock is Oct 3. [N] days away.

→ [Eventbrite link when live]
Ellsworth, Maine
8 artists. All via WaveWarZ onchain battles.

Stay tuned. 🎤
```

**Phase 2: Aug 4 → Sep 12 (Artist reveals)**
```
ZAOstock Artist Reveal [#N] / 8

[ARTIST NAME] is coming to Ellsworth, ME on Oct 3.

[W]-[L] WaveWarZ record. [SOL] earned onchain.
They earned this slot through battles, not connections.

Tickets → [link]
#ZAOstock
```

**Phase 3: Sep 12 → Oct 2 (Countdown)**
```
[N] days until ZAOstock.

Full lineup: [all 8 artists, abbreviated]
Oct 3 | Ellsworth, Maine | [Venue name]

[Ticket link] — [X] tickets remaining.
#ZAOstock
```

---

### TMP-05: Friday "Battle of the Week"

```
⚔️ Battle of the Week — [Artist A] vs [Artist B]

Margin: [X]% | SOL at stake: [Y] ◎
Winner: [ARTIST]

[One observation about what made this battle notable]

Watch Mon–Fri 8:30PM EST on @wavewarz
→ wavewarz.info/battles/[id if available]

#WaveWarZ #BattleOfTheWeek
```

*ZOE data inputs:* Check weekly battles for highest-SOL or closest-margin battle. wwtracker for data.

---

### TMP-06: Saturday Farcaster Community Cast

```
This week in /zao:

⚔️ [X] battles on WaveWarZ
🎤 ZAOstock countdown: [N] days
📋 Fractal week [N] highlight: [one sentence]

ZAOstock tickets → [link]
Fractal sessions: every [day] at [time]

Cast in /zao to join the conversation.
```

---

## ZAOstock Burst Events (Special Posts)

### Burst 1: Ticket Launch (Aug 1)
*@bettercallzaal + @wavewarz + /zao — same day, staggered 2hr apart*
```
ZAOstock tickets are LIVE. 🎤

Oct 3 | Ellsworth, Maine
8 onchain-battle-ranked artists
[GA price] GA / [VIP price] VIP

→ [Eventbrite link]

#ZAOstock #OnchainMusic
```

### Burst 2: Full Lineup Drop (Sep 12)
```
The ZAOstock 2026 lineup is here.

1. [Artist 1]
2. [Artist 2]
3. [Artist 3]
4. [Artist 4]
5. [Artist 5]
6. [Artist 6]
7. [Artist 7]
8. [Artist 8]

All selected through WaveWarZ onchain battles.
Oct 3 | Ellsworth, Maine
→ [ticket link]

#ZAOstock
```

### Burst 3: Day-Of Live Coverage (Oct 3)
*Zaal posts manually, ZOE queues + assists*
- 9 AM: "Today is the day. ZAOstock. Ellsworth ME."
- Each set: "[Artist] is on stage at ZAOstock. Live."
- End of show: "That's ZAOstock. [X] people. [Y] artists. Oct 3, 2026."
- Next morning: Recap post with top 3 photos/clips

---

## ZOE Operating Rules

1. **Draft-then-approve**: ZOE drafts all posts 24h in advance, sends to Zaal via Telegram for review. Auto-posts if approved or if no response after 24h (configurable per channel).
2. **Never post battle-specific data without fresh API check**: Before posting any battle/SOL/artist number, ZOE calls wavewarz.info/api/public/stats to confirm. Never use cached numbers older than 24h.
3. **ZAOstock ticket link is always current Eventbrite URL**: ZOE never hardcodes the link — always reads from a config variable set when Eventbrite goes live.
4. **Artist reveal posts coordinate with doc 1321 onboarding**: ZOE sends artist announcement only after Zaal confirms artist is confirmed in booking sheet.
5. **No post if Zaal has flagged a news event**: If ZAO or WaveWarZ has breaking news, ZOE holds scheduled posts to avoid stepping on the moment.

---

## Weekly Review Checklist (ZOE → Zaal, every Sunday)

```
📋 ZAO Weekly Social Review — [date]

Posts this week: [X] total
- @bettercallzaal: [N] posts, [X] impressions
- @wavewarz: [N] posts, [Y] impressions  
- /zao Farcaster: [N] casts, [Z] engagements

ZAOstock ticket count: [from Eventbrite API]
Newsletter subs: [from Paragraph API]
WaveWarZ total battles: [from stats API]

Upcoming this week:
- [Mon]: [post type]
- [Thu]: ZAOstock countdown day [N]
- [burst events if any]

Anything to override or customize? Reply to this message.
```

---

*Created: 2026-07-17 | ZOE automates all TMP-01 through TMP-06 | Zaal approves WED (ZAO Insight) + artist reveals | Cross-refs: doc 1322 (automation index), 1292 (X Space format), 1329 (ZAOstock promotion), 1331 (newsletter calendar)*
