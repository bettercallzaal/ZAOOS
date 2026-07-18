# 1524 — ZAOstock Day-Of Festival Operations Protocol (Oct 3, 2026)

**Type:** OPERATIONS-PROTOCOL  
**Topic:** Events  
**Status:** BUILD BY SEP 26 — circulate to all roles 1 week before ZAOstock. Use alongside doc 1479 (Eventbrite guide) and doc 1516 (ZAOville pool party dry run).

---

## Overview

ZAOstock is October 3, 2026 in Ellsworth, Maine. This doc covers the day-of operations protocol: who is responsible for what, when, in what order. It is designed so ZOE can run the digital layer without Zaal's attention while Zaal runs the IRL show.

**Format:** Outdoor festival with live music, WaveWarZ MAIN battle on stage, live ZOR holder governance vote, and charity payout announced from stage.

---

## Roles on Oct 3

| Role | Person | Responsibilities |
|---|---|---|
| Festival Director | Zaal | IRL decisions, artist relations, MC, governance vote announcement |
| Digital Operations | ZOE | Social posts, real-time WW stats, Telegram updates, vote tallying |
| Tech / A/V | Hurricane (remote) | WaveWarZ interface on projected display, vote UI, API uptime |
| Venue Liaison | [HoE contact] | Sound, power, permits, food vendor coordination |
| Stage Manager | [TBD] | Artist lineup, set transitions, timing |
| Photography | [TBD] | Photos + short video for social (within 2 hours of each set) |

---

## Pre-Show Timeline (Oct 3, Morning)

| Time | Action | Owner |
|---|---|---|
| 8:00 AM | Arrive at venue, walkthrough with HoE liaison | Zaal |
| 8:30 AM | Sound check: PA, wireless mic, WaveWarZ audio | Venue team + Hurricane remote |
| 9:00 AM | Projected display test: WaveWarZ battle interface visible from audience | Hurricane remote |
| 9:30 AM | ZOR holder voting UI test: confirm vote endpoint active | Hurricane remote |
| 10:00 AM | Artist green room check-in: confirm both MAIN artists present | Stage manager |
| 10:30 AM | ZOE pre-show post: "ZAOstock starts in X hours" (X + Telegram + Farcaster) | ZOE |
| 11:00 AM | Eventbrite RSVP final count to Zaal via Telegram | ZOE |
| 11:30 AM | Final sound check with artists | Venue team |
| 12:00 PM | Doors open | All roles |

---

## Show Run of Show (Oct 3)

| Time | Event | Owner | ZOE Action |
|---|---|---|---|
| 12:00 PM | Doors open, ambient WaveWarZ stats on display | Hurricane | ZOE posts "doors open" to X + Telegram |
| 12:30 PM | Opening set: [Artist 1] | Stage manager | ZOE posts artist intro |
| 1:30 PM | Set 2: [Artist 2] | Stage manager | ZOE posts photo from set 1 |
| 2:30 PM | Break: ZAO governance moment | Zaal (MC) | ZOE posts "governance moment starting" |
| 2:35 PM | Zaal introduces WaveWarZ battle format to crowd | Zaal | — |
| 2:40 PM | MAIN Battle: [Artist A] vs [Artist B] — battle opens | Hurricane activates | ZOE posts battle open (artist names, pool size, loser-earns hook) |
| 2:45 PM | ZOR holder governance vote opens (remote + IRL) | Hurricane activates | ZOE posts vote open with instructions |
| 3:00 PM | Vote closes (15 min window) | Hurricane closes | ZOE posts "vote closed — tallying" |
| 3:05 PM | Zaal announces vote result from stage | Zaal | ZOE posts result + payout amounts |
| 3:10 PM | WaveWarZ battle resolves; both artist payouts confirmed on-chain | Hurricane confirms | ZOE posts final payouts with on-chain tx links |
| 3:15 PM | Zaal announces charity recipient (chosen by ZOR vote if applicable) | Zaal | ZOE posts charity payout announcement |
| 3:30 PM | Set 3: [Artist 3] | Stage manager | ZOE posts battle recap thread (X) |
| 4:30 PM | Set 4: [Artist 4 or Headliner] | Stage manager | ZOE posts mid-show stats |
| 5:30 PM | Closing remarks: Zaal | Zaal | — |
| 5:45 PM | Outro: ZABAL S2 + COC #9 announce from stage | Zaal | ZOE posts ZABAL S2 open enrollment link |
| 6:00 PM | Show end | — | ZOE posts wrap post (all channels) |

---

## ZOE Post Templates (Oct 3)

### Doors Open (12:00 PM)
```
ZAOstock is live.

Doors open. Ellsworth, Maine. 

64 weeks of onchain governance. 1,245 battles. $104K volume.
Today the audience votes IRL.

#ZAOstock #WaveWarZ
```

### Battle Open (2:40 PM)
```
LIVE NOW: WaveWarZ MAIN battle at ZAOstock.

[Artist A] vs [Artist B].
[Pool size] SOL in the pool.
The loser still gets paid. Always.

ZOR holders: vote now → [voting link]
```

### Charity Payout Announcement
```
The crowd voted.

[Charity name] receives [amount] SOL in tonight's ZAOstock charity battle.

Voted on-chain by [N] ZOR holders.
Verified at [tx link].

This is what ZAO is for.
```

### Wrap Post (6:00 PM)
```
ZAOstock 2026 is a wrap.

[N] people. [N] bands. 1 live onchain governance vote.
[Amount] SOL to the losing artist.
[Amount] SOL to [charity].

Next up: COC #9 [date].
ZABAL S2 applications open now.

Thank you Ellsworth.
```

---

## WaveWarZ Battle Day-Of Technical Checklist

Hurricane confirms each item before 10:00 AM:

- [ ] WaveWarZ API healthy: `wavewarz.info/api/public/stats` returns 200
- [ ] MAIN battle created and visible in the interface
- [ ] Projected display shows battle UI legibly from 20+ feet
- [ ] ZOR holder vote endpoint active and tested
- [ ] Voting link shared with ZOE for post templates
- [ ] Payout confirmation flow tested (small test tx)
- [ ] Backup plan: if API goes down, Zaal narrates from mobile app

---

## ZOR Holder Voting Protocol (IRL)

- ZOR holders attending in person: open voting link on phone, vote during the 15-minute window
- Remote ZOR holders: ZOE posts vote link to X + Telegram + Farcaster at 2:45 PM
- Minimum threshold: vote is valid with ≥3 unique wallets
- Hurricane monitors vote contract in real time and signals Zaal when to close (via Telegram DM)
- Results are announced by Zaal from stage; Hurricane confirms on-chain simultaneously

---

## Charity Payout Protocol

- Charity is pre-confirmed by Sep 15 (added to Eventbrite page)
- Wallet address verified by Zaal + Hurricane before Oct 3
- Charity representative ideally present at venue (doc 1446 covers charity selection)
- ZOE posts on-chain tx confirmation immediately after payout
- Citable moment: "ZAOstock audience voted which artist's battle winnings went to [charity name]"

---

## Escalation Matrix (Day-Of)

| Issue | Who handles | Fallback |
|---|---|---|
| WW API down | Hurricane (remote) | Zaal narrates from mobile; ZOE posts "technical difficulties" |
| Vote contract fails | Hurricane | Zaal collects manual show of hands; records separately |
| Artist no-show | Zaal + stage manager | Replace with DJ set; COC battle postponed to COC #9 |
| Projected display fails | Hurricane + venue tech | Run battle on Zaal's laptop, narrate to crowd |
| Weather (outdoor venue) | Zaal + HoE liaison | Indoor fallback room at [venue]; post update by 10 AM |

---

## Post-Show Protocol (Oct 3, Evening)

| Action | Owner | Deadline |
|---|---|---|
| Upload photos to X + Farcaster + Telegram | Photographer + ZOE | Within 2 hours of show end |
| Post on-chain battle recap (ZOE thread) | ZOE auto | Within 30 min of show end |
| ZOE captures: attendance, battles, payout amounts, charity total | ZOE | EOD report Oct 3 |
| Zaal sends thank-you DMs to all performing artists | Zaal | Oct 4 morning |
| ZAOOS post-show debrief doc created | ZOE (draft) + Zaal (review) | Oct 5 |
| Charity payout on-chain confirmed + tweeted | ZOE | Within 24h |
| Update docs 1483 (press kit) + 1469 (WW snapshot) with ZAOstock data | ZOE | Oct 4 |
| Send Bankless/Decrypt + Hypebot follow-up with ZAOstock recap link | Zaal | Oct 5 |
| Newsletter Issue 3: ZAOstock recap (Paragraph) | ZOE draft + Zaal sends | Oct 7 |

---

## What to Track on the Day (ZOE Metrics Log)

| Metric | Target | Source |
|---|---|---|
| Attendance (IRL) | 50+ | Stage manager headcount |
| Unique ZOR voters | 10+ unique wallets | Vote contract |
| MAIN battle pool size | — | WW API |
| Total SOL to both artists | — | WW API |
| Charity amount | — | WW API or manual |
| X impressions (day-of) | 5,000+ | X Analytics |
| Farcaster casts (day-of) | 10+ | Neynar |
| Eventbrite RSVP count | 100+ | Eventbrite dashboard |

---

## Dry Run: ZAOville Pool Party (Jul 25)

Doc 1516 covers the ZAOville Pool Party (Jul 25) as a ZAOstock dry run. Key items to test Jul 25 and apply to Oct 3:
- PA outdoor sound quality at [venue address]
- WaveWarZ audio during a battle (wireless mic pickup)
- Audience engagement with on-screen vote
- ZOR holder vote IRL timing (does 15 min feel right?)

---

## Related Docs

- 1479 — ZAOstock Eventbrite Guide (ticket structure + Fractured Atlas unlock)
- 1516 — ZAOville Pool Party Protocol (Jul 25 dry run)
- 1481 — Jul 21 Launch Day Protocol (pre-ZAOstock milestone)
- 1446 — ZAOstock Charity Selection (pre-confirm charity by Sep 15)
- 1458 — COC #8 Show Brief (same format, smaller scale)
- 1499 — ZOE Daily Ops Report Spec (ZOE tracks all day-of metrics)
- 1483 — ZAO Master Press Kit (update with ZAOstock data Oct 4)
- 1518 — WaveWarZ Mini App Phase 1 Spec (Hurricane tech handoff — active Oct 3)
