---
topic: zaostock, zoe, operations, events
type: countdown-ops-guide
status: EXECUTE SEP 27 — ZOE runs this guide starting the morning after Africa Battle Week ends. Covers Sep 27 (post-ABW) through Oct 2 (ZAOstock eve). Bridges doc 1720 (Africa Battle Week live ops) and the ZAOstock day-of runbook. Picks up the ZABAL S2 Week 5 cadence from doc 1677.
last-validated: 2026-07-18
related-docs: 1720-africa-battle-week-live-ops, 1677-zabal-s2-zoe-weekly-ops-guide, 1650-zaostock-eventbrite-webhook-handler, 1659-zaostock-sponsor-activation-guide, 1675-farcaster-content-calendar-sep2026, 1704-sep1-zabal-s2-launch-day-ops
action-owner: ZOE (all posts and reminders below); Hurricane (artist logistics, ticket scan setup); Zaal (final sponsor confirmation Oct 1, approves Oct 2 eve preview post)
---

# 1722 — ZAOstock Final Week Countdown (Sep 27–Oct 2, 2026)

> **What this is:** ZOE's day-by-day ops guide for the six days between Africa Battle Week ending (Sep 26) and ZAOstock showday (Oct 3). This week is the densest pre-event window: ticket urgency peaks, sponsors need final activation briefs, ZABAL S2 Week 5 runs on Monday, and the artist/volunteer roster needs final confirmation. This doc synthesizes the final-week obligations from docs 1675 (Sep content calendar), 1677 (ZABAL S2 ops), 1659 (sponsor activation), and the Eventbrite tracker (doc 1650).
>
> **What ZOE is managing this week:**
> - Post-Africa Battle Week recap and ZAOstock CTA
> - ZABAL S2 Week 5 Monday session (Fractal crossover per doc 1677)
> - Daily ticket urgency posts escalating toward Oct 3
> - Final sponsor confirmation and activation brief delivery
> - Volunteer + artist final confirmation DMs
> - Oct 2 (eve) preview post — GATED, Zaal approves
>
> **All times ET.**

---

## Sep 27 (Saturday) — Post-Africa Battle Week Day

Africa Battle Week ended yesterday. Today is the first pure ZAOstock day.

### 9:00 AM — Africa Battle Week Recap + ZAOstock 6-Days-Out

ZOE posts to /wavewarz + /zao:
```
Africa Battle Week 2026 is done.

5 battles. 5 days.
[Total] SOL to artists and charity.
[Charity Name] received [X] SOL. On-chain.

6 days to ZAOstock.

The artists who just battled? Some are in Ellsworth Oct 3.
First international battle week in WaveWarZ history — come see what's next.

Tickets: [Eventbrite URL]
```

ZOE posts to ZABAL S2 Telegram:
```
Africa Battle Week is over.
Week 5 is Monday.

Track A: battle count check is coming. If you battled in Africa Battle Week, those count.
See you Monday at 2PM.
```

### 12:00 PM — ZAOstock Social Proof Post

ZOE posts to /zao:
```
ZAOstock is Oct 3 in Ellsworth, Maine.

What's happening:
- WaveWarZ live battles on stage
- Music from ZAO artists
- On-chain ticketing (scan in, logged)
- The ZAO community in a room together

[N] tickets sold. Room holds [capacity].
Get in: [Eventbrite URL]
```

### End of Day — Sponsor Final Check

ZOE sends Zaal Telegram:
```
ZAOstock is 6 days out.

Sponsor status check:
- Confirmed sponsors with activation brief sent: [N]
- Sponsors who haven't confirmed their attendee list or logo: [list]

Action needed: reply 'confirm' for each sponsor who's locked in.
I'll send final activation briefs to confirmed sponsors this weekend.
```

ZOE pulls sponsor data from Supabase `zaostock_sponsors` where `status = 'confirmed'` and `activation_brief_sent = false`. For each, ZOE prepares a draft activation brief (per doc 1659) and queues for send once Zaal confirms.

---

## Sep 28 (Sunday) — Sponsor Activation + Ticket Push

### 10:00 AM — Sponsor Final Activation Briefs

For each confirmed sponsor (Zaal replied 'confirm' last night):
ZOE sends sponsor their final activation brief via email. Template (per doc 1659):
```
Subject: ZAOstock Oct 3 — Your Final Activation Brief

[Sponsor Name] —

ZAOstock is 5 days away. Here's what you need to know:

**Your benefits at the event:**
[Tier-specific list from doc 1659: logo placement, verbal mention timing, on-site presence]

**Action items for you before Oct 1:**
- Send attendee names for your [N] complimentary tickets (reply to this email)
- Send final logo file if you haven't already (PNG, transparent background)
- Confirm your on-site rep (name + mobile number for event day)

**Day-of logistics:**
- Venue: [Venue address, Ellsworth ME]
- Load-in: [time] (Title/Stage sponsors) / Doors open [time] (all sponsors)
- Your contact on-site: [Zaal/Hurricane — Zaal confirms]

Questions? Reply here or text [Zaal's number — Zaal fills].
```

ZOE marks `activation_brief_sent = true` in Supabase for each sent.

### 2:00 PM — Sunday Ticket Urgency Post

ZOE posts to /wavewarz + /zao:
```
ZAOstock is in 5 days.

If you've been thinking about it: now is the time.
[N] tickets sold. Going fast.

Oct 3. Ellsworth, Maine.
WaveWarZ battles live on stage.

[Eventbrite URL]
```

### Evening — Volunteer Final Confirmation

ZOE sends DMs to all confirmed volunteers (Farcaster XMTP or Telegram):
```
ZAOstock is in 5 days.

Your role: [role from volunteer tracker]
Arrive by: [time — Zaal confirms]
Venue: [address]

Reply to confirm you're still in. If something changed, reply with details.
```

ZOE logs responses to `~/.zao/zoe/zaostock-volunteer-confirmations.jsonl`.

---

## Sep 29 (Monday) — ZABAL S2 Week 5 + ZAOstock 4-Days-Out

**Note:** Sep 29 is ZABAL S2 Week 5 (Fractal crossover). Per doc 1677, Week 5 adds a ZABAL note to the Fractal Democracy session. ZOE runs the standard ZABAL S2 Monday ops AND the ZAOstock 4-days-out post.

### 9:00 AM — ZABAL S2 Week 5 Go-Live Post

ZOE posts to /zabal (per doc 1677 Week 5 Monday go-live template):
```
ZABAL S2 Week 5.

Today: Fractal Democracy crossover.
Regular Monday session + Fractal Democracy Governance introduction.

[Join link — from Zaal]
2:00 PM ET.
```

ZOE posts to ZABAL S2 Telegram:
```
ZABAL S2 Week 5 starts in a few hours.

Track A: how many WaveWarZ battles have you completed? We're checking milestones this week.
Track B: where are you on your first ZAOOS doc? Week 5 = target for PR open.

2PM ET. [Join link].
```

### 10:00 AM — ZAOstock 4-Days-Out Post

ZOE posts to /zao:
```
ZAOstock is in 4 days.

Oct 3. Ellsworth, Maine.
Live WaveWarZ battles. ZAO music. On-chain ticketing.

[N] tickets sold.

[Eventbrite URL]
```

ZOL posts to /wavewarz (complementary):
```
WaveWarZ is going live on stage in 4 days.

ZAOstock. Oct 3. Ellsworth ME.
Come see the battles in person.

[Eventbrite URL]
```

### 1:45 PM — ZABAL S2 Session Go-Live (Week 5)

ZOE posts per doc 1677 Week 5 pattern:
- ZABAL S2 Telegram: "Week 5 starting in 15 minutes. [Join link]"
- /zabal: "ZABAL S2 Week 5 starting. Fractal Democracy governance introduction. [Join link]"

After session (~3:30PM): Zaal sends attendance list → ZOE writes to Supabase.

**Week 5 Fractal note (per doc 1677):** ZOE adds a Fractal Democracy reminder to the post-session ZABAL S2 Telegram:
```
This week's Fractal Democracy session is Thursday.
ZABAL S2 participants can attend — it's open.
Zaal will mention ZABAL S2 Week 5 in the Fractal context.
```

### 4:30 PM — ZABAL S2 Week 5 Recap

ZOE posts to /zabal + ZABAL S2 Telegram (doc 1677 post-session template):
```
ZABAL S2 Week 5 done.

[N]/[Total] attended.

Fractal Democracy intro: ZOR governance, how voting works, how it connects to ZAOstock and ZABAL S2 Track A requirements.

Week 6: [curriculum note — Zaal fills or ZOE pulls from doc 1588].
```

---

## Sep 30 (Tuesday) — 3 Days Out

### 9:00 AM — ZAOstock 3-Days-Out Post

ZOE posts to /wavewarz + /zao:
```
3 days to ZAOstock.

The lineup:
[Artist list — Zaal fills or ZOE pulls from doc 1597]

WaveWarZ battles on stage. Live payout. On-chain.

Oct 3 in Ellsworth, Maine.
[Eventbrite URL]
```

### 11:00 AM — ZABAL S2 At-Risk Check (per doc 1677 Tuesday protocol)

Per doc 1677 Week 5 at-risk check:
ZOE queries Supabase for Week 5 attendance. Participants who missed both Week 4 (Sep 22) and Week 5 (Sep 29): ZOE sends at-risk DM:
```
Hey [Name] — you've missed the last 2 ZABAL S2 sessions.

You can miss up to 3 sessions total and still graduate.
But we want to make sure you're still in.

Reply 'in' to confirm, or let me know if something changed.
```

ZOE DMs Zaal if any participant has missed 3+ sessions (graduation threshold breach).

### 2:00 PM — Volunteer Check-In

ZOE sends follow-up to any volunteer who hasn't replied to Sep 28 confirmation DM:
```
ZAOstock is 3 days away.

Haven't heard back from you yet.
Your role: [role]. Arrive by: [time].

Reply 'confirmed' or let me know if you can't make it — I need to know by tomorrow.
```

### 5:00 PM — Artist Final Check

ZOE sends DMs to all performing artists:
```
ZAOstock is 3 days away.

Your set: [time slot from doc 1597]
Venue: [address, Ellsworth ME]
Load-in: [time]
Soundcheck: [time]

Reply to confirm or if anything changed.
```

ZOE logs confirmations to `~/.zao/zoe/zaostock-artist-confirmations.jsonl`. Alerts Zaal for any artist who doesn't confirm by Oct 1.

---

## Oct 1 (Wednesday) — 2 Days Out

### 9:00 AM — ZAOstock 2-Days-Out Post

ZOE posts to /zao:
```
ZAOstock is in 2 days.

[N] tickets sold.
Venue: [address, Ellsworth ME]

This is a ZAO community event — if you've been in WaveWarZ battles, watched a Fractal session, or contributed to ZAOOS: this show is yours.

[Eventbrite URL]
```

### 10:00 AM — Final Sponsor Headcount Due

ZOE sends Zaal Telegram:
```
Oct 1 — sponsor headcount deadline.

Sponsors who haven't sent attendee names:
[List from Supabase where attendee_list_received = false]

Action: follow up with them directly or allocate their comps to walk-ins.
```

### 12:00 PM — Run-of-Show Final Version

ZOE prompts Zaal:
```
ZAOstock run-of-show: is the Oct 1 version final?

I need the confirmed set times (artist + WaveWarZ battle slots) to prep the day-of posts.
If you have changes, send them today — I'll stage all Oct 3 posts tonight.

Reply with: run-of-show: [paste] OR 'using doc 1597 as-is'
```

Once Zaal replies, ZOE stages the Oct 3 day-of posts with real times and artist names. These go into ZOE's queue for Oct 3.

### 3:00 PM — Ticket Count Post

ZOE posts to /wavewarz:
```
ZAOstock: 2 days.
[N] tickets left at the door.

Oct 3. Ellsworth, Maine.
[Eventbrite URL]
```

---

## Oct 2 (Thursday) — Eve of ZAOstock

### 10:00 AM — Fractal Reminder (per doc 1706 Thursday protocol)

ZOE posts Thursday Fractal Democracy reminder (standard protocol, doc 1706):
- Telegram + /zao Farcaster cast with session details

**ZAOstock timing conflict:** If the Fractal session overlaps with ZAOstock load-in on Oct 2, ZOE notes this in the Fractal reminder: "Note: Zaal is ZAOstock load-in today. [Other facilitator — Zaal names] is running tonight's Fractal session."

### 12:00 PM — ZAOstock Eve Social Proof

ZOE posts to /zao:
```
ZAOstock is tomorrow.

[N] tickets sold.
[N] artists confirmed.
[N] WaveWarZ battles scheduled on stage.

Ellsworth, Maine. Oct 3.

The ZAO community built this.
Come be in the room where it happens.

[Eventbrite URL]
```

### 3:00 PM — Volunteer Final Briefing

ZOE sends final briefing to all confirmed volunteers:
```
ZAOstock is TOMORROW.

Your role: [role]
Arrive at: [time]
Venue: [address]
Your on-site lead: [name + mobile — Zaal fills]

What to bring: [ID for wristband, phone for on-chain ticket scan app if applicable]

Questions? Reply here or text [lead contact].

See you tomorrow.
```

### 6:00 PM — Eve Preview Post (GATED)

**ZOE drafts and sends to Zaal for approval before posting.**

Draft:
```
Tomorrow: ZAOstock.

The first on-chain, WaveWarZ-powered music event in Maine.

Artists performing:
[Artist 1]
[Artist 2]
[Artist 3]
[+ others]

WaveWarZ live battles on stage.
ZOR holders vote. On-chain payouts.

Doors open [time]. Oct 3. Ellsworth, Maine.

Tickets (last chance): [Eventbrite URL]
```

**Zaal approves via Telegram ("post it") before ZOE sends.** This is the highest-visibility eve post of the year — do not auto-post.

### Evening — ZOE Staging Confirmation

After the eve preview post goes live, ZOE sends Zaal a Telegram:
```
ZAOstock eve ops complete.

Posts live:
- Eve preview to /zao (after your approval)
- Fractal reminder (standard Thursday)
- Volunteer final briefing sent to all [N] confirmed volunteers
- Artist confirmations: [N]/[total] replied. [Names] haven't confirmed — action?

Oct 3 posts staged in queue. Everything is ready.
```

---

## Running Ticket Urgency Cadence (All Week)

In addition to the day-specific posts above, ZOE maintains a ticket urgency cadence:

| Date | Urgency Post Channel | Message Tone |
|------|---------------------|-------------|
| Sep 27 | /wavewarz + /zao | "6 days" — Africa Battle Week ending energy |
| Sep 28 | /wavewarz | "5 days — if you've been thinking about it" |
| Sep 29 | /zao | "4 days" — lineup preview |
| Sep 30 | /wavewarz + /zao | "3 days — ticket count down" |
| Oct 1 | /wavewarz | "2 days" — last push |
| Oct 2 | /zao | "Tomorrow" — eve post (GATED) |

ZOE uses the real ticket count from Eventbrite webhook data (doc 1650) or from Zaal's confirmed count (if webhook is down).

---

## ZABAL S2 Week 5 Integration Summary

Per doc 1677, Week 5 (Sep 29) has the following special instructions:
- Fractal Democracy note added to the Monday go-live post
- Post-session ZABAL Telegram includes Fractal crossover context
- ZOE adds a note to the week 5 Friday milestone email: "ZABAL S2 participants: attend the Oct 3 ZAOstock show if you're able. Show attendance isn't a milestone, but the room will have the rest of the cohort."

---

## Failure Protocols

### Artist doesn't confirm by Oct 1
ZOE DMs Zaal with name + last contact date. Zaal calls or texts directly. If unresponsive by Oct 2 noon: Zaal decides whether to replace with a standby or proceed.

### Ticket sales below expectation (<30% capacity by Oct 1)
ZOE does NOT post the ticket count publicly if it would look bad. ZOE DMs Zaal: "Ticket count is [N] as of Oct 1 — below 30% capacity. Do you want me to pivot to a 'show up day-of' framing instead of an Eventbrite push?" Zaal decides.

### Eventbrite webhook down (can't get real ticket count)
ZOE falls back to asking Zaal: "Eventbrite webhook not returning current count. What's the current ticket number I should use in posts?" Zaal replies with count.

### Sponsor activation brief rejected (sponsor backs out)
ZOE records sponsor status as `cancelled` in Supabase. Alerts Zaal: "[Sponsor name] has backed out as of Oct 1. Their [N] comp tickets are now available as walk-ins. Action?" ZOE does NOT remove the sponsor from the program publicly — Zaal handles that conversation.

### Eve post not approved by 8 PM Oct 2
ZOE sends Zaal reminder: "Eve preview post not approved yet — it's 8PM. Should I hold until tomorrow morning (Oct 3 pre-doors) or post tonight? Reply 'morning' or 'tonight'." If no response by 10PM, ZOE holds until Oct 3 morning pre-doors.

---

## Handoff to Oct 3 Day-of

When ZOE completes the Oct 2 eve ops, the handoff is:
- All Oct 3 posts staged in queue with real times and artist names
- Volunteer + artist confirmations logged
- Sponsor activation complete
- Ticket count snapshot taken at midnight Oct 2/3 for the day-of opening post

The ZAOstock day-of runbook (if one exists) picks up at Oct 3 8AM. ZOE's Oct 3 responsibilities from this doc are complete.

---

## Sources

- `research/events/1720-africa-battle-week-live-ops/` — Sep 26 wrap post feeds directly into Sep 27 (this doc)
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 5 ops (Fractal crossover, Tuesday at-risk check)
- `research/events/1659-zaostock-sponsor-activation-guide/` — Sponsor tier benefits + activation brief template
- `research/technology/1650-zaostock-eventbrite-webhook-handler/` — Ticket count source
- `research/farcaster/1675-farcaster-content-calendar-sep2026/` — Sep 27-30 post templates
- `research/governance/1706-zoe-fractal-weekly-ops-guide/` — Thursday Fractal reminder protocol (Oct 2)
- `research/events/428-zaostock-run-of-show-program/` — Run-of-show source (Oct 1 final version)
