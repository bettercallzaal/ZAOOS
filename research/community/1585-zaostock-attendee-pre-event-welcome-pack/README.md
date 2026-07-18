# 1585 — ZAOstock Attendee Pre-Event Welcome Pack (ZOE Automation Spec)

**Type:** OPERATIONS-SPEC  
**Topic:** Community  
**Status:** ACTIVE — ZOE sends welcome pack sequence starting Sep 19 (T-14 days before Oct 3). This doc is ZOE's standing instruction for the full attendee communication arc from RSVP confirmation through day-of.

---

## Overview

Every ZAOstock attendee gets a 4-message ZOE sequence: welcome → logistics brief → WaveWarZ primer → day-of reminder. All messages go via Telegram (for community members with Telegram handles) or Eventbrite email (for all ticket holders). This doc specifies the exact content for each message and the trigger dates.

**Attendee sources:**
1. Eventbrite ticket holders (GA free + Supporter $20 + VIP from doc 1365)
2. ZAO Telegram community members who RSVP'd (cross-reference Eventbrite)
3. ZABAL S2 participants (all attend ZAOstock as part of cohort)
4. ZOR holders (all notified; governance session runs at ZAOstock Sep 25 preview session)

---

## Message 1: RSVP Confirmation (Immediate — fires when RSVP confirmed on Eventbrite)

**Channel:** Eventbrite automated email (ZOE configures Eventbrite confirmation email text)  
**Trigger:** Eventbrite RSVP confirmation  
**Audience:** All ticket holders

**Subject:** "You're in — ZAOstock is October 3 in Ellsworth, ME"

**Body:**
```
Hey [First Name],

You're registered for ZAOstock 2026.

📅 When: Saturday, October 3, 2026
📍 Where: [Venue Name + Address], Ellsworth, Maine
🎟️ Your ticket: [Ticket Type — GA / Supporter / VIP]
🎵 What happens: Live music battles, on-chain governance vote, charity fundraiser

Here's what makes ZAOstock different:

The audience votes on the music battles in real time at wavewarz.info.
Whoever wins, the losing artist gets paid on-chain — automatically, from the stage.

If you've never seen money move on a blockchain from a live music vote, 
you're about to.

→ Spread the word: [Eventbrite link]
→ Join the ZAO Telegram: t.me/[ZAO Telegram link]
→ Follow the updates: @wavewarz on X

See you October 3.

— Zaal + the ZAO team
```

---

## Message 2: Logistics Brief (Sep 19 — T-14 Days)

**Channel:** Telegram DM (ZOR holders + ZABAL S2 + Telegram community) + Eventbrite email blast  
**Trigger:** ZOE scheduled post — Sep 19  
**Audience:** All registered attendees

**Subject (email):** "ZAOstock is 2 weeks away — here's what to know"

**Telegram version:**
```
ZAOstock is 2 weeks away 🗓️

📍 [Venue Name], [Address], Ellsworth ME
🚗 Parking: [parking details — Zaal fills]
🕐 Doors: [time — Zaal fills]
🎵 First set: [time — Zaal fills]
🏁 End: [time — Zaal fills]

What to bring:
• Your phone (you'll vote on wavewarz.info during the main battle)
• Cash or card (for merch — if applicable)
• An open mind about who's getting paid tonight

Full schedule drops Sep 26.

Questions? Reply here or Telegram t.me/[ZAO Telegram].
```

**ZOE task (Sep 12 — 1 week before this send):**
- Ping Zaal: "Need venue address, parking, and door/set times for ZAOstock Sep 19 logistics DM"
- Confirm venue details are in doc 1524 (ZAOstock day-of protocol) and pull from there

---

## Message 3: WaveWarZ Primer (Sep 26 — T-7 Days)

**Channel:** Telegram DM + Eventbrite email  
**Trigger:** ZOE scheduled post — Sep 26  
**Audience:** All registered attendees

**Subject (email):** "Before ZAOstock — 2 minutes on how WaveWarZ works"

**Body:**
```
One week to ZAOstock 🎵

Here's how the main event works, so you're not confused when it happens live:

WaveWarZ is a music battle platform. Two artists battle. The audience votes.
Here's the twist: the LOSER gets paid.

On-chain. Automatically. In real time. From the stage.

On October 3, you'll:
1. Go to wavewarz.info on your phone
2. Vote for the artist you think the ZAO community will crown the winner
3. Watch the payout happen live on the screen

You don't need crypto. You don't need a wallet. You just need to vote.

(If you DO have a Phantom wallet — you can participate as a trader 
and earn from the outcome. Come find Zaal at ZAOstock if you want to set this up.)

WaveWarZ stats, so you know this is real:
• [totalBattles] battles completed
• [totalVolume] SOL in total wagers (~$[USD])
• [artistPayouts] SOL paid to losing artists ($[USD])

[ZOE fills brackets from /api/public/stats on Sep 26]

See you next Saturday.
```

**ZOE task (Sep 26):** Pull `/api/public/stats` → fill brackets → send to all attendees via Telegram + Eventbrite email.

---

## Message 4: Day-Of Reminder (Oct 3 — 8:00 AM)

**Channel:** Telegram DM + Eventbrite email  
**Trigger:** ZOE scheduled post — Oct 3, 8:00 AM  
**Audience:** All registered attendees

**Subject (email):** "Today is ZAOstock 🎵 — here's everything"

**Body:**
```
Today is ZAOstock 🎵

📍 [Venue Name], [Address], Ellsworth ME
🕐 Doors: [time]
🎵 First set: [time]
🏁 End time: [time]

Your full schedule for today:
• [Support artist 1] — [time]
• [Support artist 2] — [time]
• Community Charity Battle — [time] (100% of wagers go to [charity])
• WaveWarZ MAIN Battle — [time] (the live on-chain vote)
• [Additional sets — Zaal fills]

How to vote live:
→ Go to wavewarz.info on your phone
→ Vote when Zaal announces "polls are open"
→ Watch the payout happen in real time

Post photos: tag @wavewarz and @bettercallzaal
Use: #ZAOstock

Can't make it? We'll post the result tonight.

See you there 🙏

— Zaal
```

**ZOE task (Oct 2 — day before):** Ping Zaal for final set times + charity name to fill into this template. Send final template to Zaal for approval at 7 PM Oct 2.

---

## ZABAL S2 Attendee Sub-Sequence

ZABAL S2 participants (Sep 1–Nov 21 cohort) get an additional ZAOstock-specific message:

**Channel:** ZABAL S2 Telegram group  
**Trigger:** ZOE scheduled — Sep 29 (T-4 days)

```
ZABAL S2 cohort — ZAOstock is in 4 days 🗓️

ZAOstock is a ZABAL milestone. Here's what it means for you:

• ZAOstock attendance = 1 milestone credit (doc 1567 Supabase tracker)
• If you've completed your ZAOOS doc, bring the URL — we may cite you from stage
• ZABAL S2 members get early entry if space allows — arrive by [early entry time]

Supabase attendance tracking:
ZOE will mark your attendance after the event. 
If you're remote, watch the X Space at @wavewarz — ZOE will tag remote attendees.

Build or break — see you Saturday.
```

---

## ZOR Holder Sub-Sequence

ZOR holders get a governance-specific pre-event message:

**Channel:** ZOR holder direct X DMs (from doc 1559 ZOR holder DM list) + Telegram  
**Trigger:** ZOE scheduled — Sep 30 (T-3 days)

```
ZOR Holder — ZAOstock Governance Note

Two things happen at ZAOstock that need your vote:

1. ZAOstock Preview Governance Session (Sep 25 — Thursday before the festival):
   Fractal Democracy session. Respect scores recorded on OREC.
   Show up Thursday at [time + link] if you haven't already.

2. ZAOstock MAIN Battle (Oct 3):
   You vote in person at the venue OR remote via wavewarz.info.
   Your ZOR holder vote counts in the WaveWarZ governance record.

From doc 1565 (Fractal Democracy Facilitator Guide) — the Sep 25 session 
is the formal governance session for ZAOstock. Attendance earns Respect score.

See you Thursday + Saturday.
```

---

## Post-Event Follow-Up (Oct 4)

**Channel:** Telegram DM + Eventbrite email  
**Trigger:** ZOE scheduled — Oct 4, 10:00 AM  
**Audience:** All registered attendees

**Subject:** "ZAOstock recap + what's next"

```
ZAOstock happened 🎵

[ZOE fills]:
• Battle result: [Winner] vs [Loser] — [Loser] earned [payout SOL] on-chain
• Charity raised: [amount SOL / USD] for [charity name]
• Total attendance: [headcount from doc 1576 checklist]

Thank you for being part of this.

What's next from ZAO:
• COC Concertz continues monthly — next show [date from doc 1511]
• ZABAL S2 continues through November 21
• WaveWarZ battles continue daily at wavewarz.info

ZAOstock 2027 planning starts Nov 2026. If you want to help build it:
→ Join the ZAO Telegram: t.me/[ZAO Telegram link]
→ ZOR token = governance vote: [ZOR info link]
→ ZAOOS research archive: github.com/bettercallzaal/ZAOOS

Thanks for being ZAO 🙏

— Zaal
```

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| Eventbrite RSVP confirmed | Send Message 1 (RSVP confirmation) via Eventbrite email |
| Sep 12 | Ping Zaal for venue address + logistics details for Sep 19 send |
| Sep 19 | Send Message 2 (logistics brief) via Telegram + Eventbrite email blast |
| Sep 26 | Pull `/api/public/stats` → fill brackets → send Message 3 (WaveWarZ primer) |
| Sep 29 | Send ZABAL S2 sub-sequence to ZABAL S2 Telegram group |
| Sep 30 | Send ZOR holder governance sub-sequence via X DMs + Telegram |
| Oct 2, 7:00 PM | Send day-of template draft to Zaal for final fill-in + approval |
| Oct 3, 8:00 AM | Send Message 4 (day-of reminder) via Telegram + Eventbrite email |
| Oct 4, 10:00 AM | Pull battle result + charity total → send post-event follow-up |
| Oct 4, 10:30 AM | Update ZAOOS docs 1559 + 1570 + 1576 with ZAOstock stats |

---

## Attendee List Management (ZOE Supabase)

ZOE maintains an attendee list in Supabase (`zaostock_2026_attendees`) with:

| Field | Source |
|---|---|
| `name` | Eventbrite registration |
| `email` | Eventbrite registration |
| `ticket_type` | GA / Supporter / VIP |
| `telegram_handle` | Collected via Telegram welcome DM (ask in Message 1 CTA) |
| `is_zabal_s2` | Cross-reference `zabal_s2_participants` table (doc 1567) |
| `is_zor_holder` | Cross-reference ZOR holder list (from doc 1559 ZOR holder DM list) |
| `attended` | ZOE marks TRUE after Oct 3 |
| `milestone_credit` | ZABAL S2 milestone tracked in `zabal_s2_milestones` (doc 1567) |

**Hurricane build checklist:**
- [ ] `zaostock_2026_attendees` Supabase table + Eventbrite webhook (Aug 15)
- [ ] ZOE read access to table for scheduled message sends (Sep 1)
- [ ] ZABAL S2 cross-reference query (Sep 1)

---

## Related Docs

- 1524 — ZAOstock Day-Of Protocol (venue logistics + full day-of runsheet source)
- 1562 — ZAOstock Sponsor Activation Playbook (partner comms happening same week)
- 1567 — ZABAL S2 Participant Tracker Spec (Supabase schema for attendee milestone credit)
- 1564 — ZAO Community Spotlight Program (ZAOstock window Aug 18–Sep 29 spotlights)
- 1365 — ZAOstock Ticketing Strategy (GA / Supporter / VIP tiers this doc references)
- 1576 — COC #8 Show Day Operations Checklist (parallel ops reference for live battle execution)
- 1574 — ZAO Newsletter Paragraph + ZOE Integration (ZAOstock recap → Newsletter Issue 3, Oct 5)
