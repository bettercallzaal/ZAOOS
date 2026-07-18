---
topic: zaostock, zoe, operations, events
type: post-event-ops-guide
status: EXECUTE OCT 4 — ZOE begins this sequence the morning after ZAOstock (Oct 3). Covers Oct 4-7. Bridges the ZAOstock showday into the post-event debrief, sponsor reporting, ZABAL S2 continuity, and content repurposing window.
last-validated: 2026-07-18
related-docs: 1722-zaostock-final-week-countdown, 1677-zabal-s2-zoe-weekly-ops-guide, 1650-zaostock-eventbrite-webhook-handler, 1659-zaostock-sponsor-activation-guide, 1710-zao-h2-milestone-tracker, 1693-zao-newsletter-issue-2-aug2026
action-owner: ZOE (all posts and reports below); Hurricane (media asset delivery, WaveWarZ battle stats); Zaal (approves sponsor metrics report and newsletter Issue 3 outline, debrief interview for content)
---

# 1727 — ZAOstock Post-Event Ops (Oct 4-7, 2026)

> **What this is:** ZOE's complete post-event ops guide for the four days after ZAOstock. Oct 3 is the show. Oct 4-7 is the debrief, recap content, sponsor reporting, ZABAL S2 Week 6 setup, and newsletter pipeline. This doc covers what ZOE does after the room clears — every task from immediate social recap to sponsor metrics delivery.
>
> **What happened Oct 3:** ZAOstock ran. Battles happened. Artists performed. On-chain ticketing was live. The ZAO community was in a room together for the first time.
>
> **What ZOE is managing Oct 4-7:**
> - Immediate post-show social recap posts
> - Attendee count + battle stats pull from Eventbrite and WaveWarZ
> - Sponsor metrics report (delivered by Oct 7)
> - ZABAL S2 Week 6 Monday setup (Oct 6)
> - ZAO H2 milestone tracker update (doc 1710)
> - Newsletter Issue 3 outline (ZAOstock recap issue)
>
> **All times ET.**

---

## Oct 4 (Sunday) — Morning After

### 9:00 AM — Immediate Recap Post

ZOE posts to /wavewarz + /zao:
```
ZAOstock happened yesterday.

[N] people showed up to Ellsworth, Maine.
[N] WaveWarZ battles live on stage.
[Total] SOL wagered. [Total] SOL to artists.
[Charity name]: [X] SOL from Africa Battle Week.

First on-chain music event in Maine.
First time the ZAO community was in a room together.

Photos and video coming.
```

ZOL posts to /zabal:
```
ZAOstock: complete.

ZABAL S2 Track A — the artists on that stage battled their way there.
Track B — the docs you wrote helped ZOE run it.

Week 6 is Monday.
```

### 10:00 AM — Stats Pull

ZOE pulls the following stats and logs to `~/.zao/zoe/zaostock-actuals.jsonl`:

**From Eventbrite (doc 1650 webhook or manual export):**
```json
{
  "date": "2026-10-03",
  "tickets_sold": null,
  "tickets_scanned": null,
  "unique_attendees": null,
  "revenue": null
}
```

**From WaveWarZ (Hurricane provides):**
- Number of battles completed on stage
- Total SOL wagered
- Total SOL to artists (all participants)
- SOL to losing artists via loser-earns mechanic
- Highest single battle SOL amount

**From ZOR holder vote (doc 1643):**
- Charity name
- Charity SOL amount
- Charity payout tx hash (already confirmed Sep 26)

ZOE sends Hurricane a Telegram:
```
ZAOstock is done — great show.

I need the official stats for the recap and sponsor report:
1. Number of WaveWarZ battles completed on stage
2. Total SOL wagered across all battles
3. Total SOL to artists
4. Highest single battle SOL amount

Reply with these numbers and I'll handle the rest.
```

If Hurricane doesn't respond by noon: ZOE DMs Zaal to manually retrieve from WaveWarZ admin.

### 12:00 PM — Photo/Video Capture Inventory

ZOE sends Zaal Telegram:
```
ZAOstock media inventory:

What we have (confirm):
- [ ] Photo set from event
- [ ] Video clips from battles
- [ ] Any stream archive (if streamed)
- [ ] Artist photos

I need the first batch by Oct 5 to prep:
- Newsletter Issue 3 header image
- Sponsor metrics report attachments
- Social media recap posts

Where are the files? (Drive link, Dropbox, etc.)
```

### 2:00 PM — ZABAL S2 Post-ZAOstock Post

ZOE posts to ZABAL S2 Telegram:
```
ZAOstock is behind us.

If you attended yesterday: you were part of something the community built.
If you watched online: the recap thread is on Farcaster (/zao).

Week 6 is Monday. See you at 2PM.
Track A: if you battled at ZAOstock, that counts toward your milestone.
```

---

## Oct 5 (Monday) — ZABAL S2 Week 6 + Sponsor Metrics Start

### 8:00 AM — Stats Confirmation

If Hurricane sent stats on Oct 4: ZOE prepares the sponsor metrics report skeleton.
If stats not received: ZOE follows up with Hurricane and DMs Zaal.

ZOE updates doc 1710 (ZAO H2 milestone tracker) with ZAOstock actuals once confirmed. New entries for Oct snapshot:
- Battle count (total to date, including ZAOstock on-stage battles)
- SOL distributed to artists (cumulative)
- ZAOstock attendee count (new category)

### 9:00 AM — Sponsor Thank-You (First Wave)

ZOE sends thank-you email to each confirmed sponsor:
```
Subject: Thank you — ZAOstock Oct 3 was a success

[Sponsor Name] —

ZAOstock happened.

[N] people in the room. [N] WaveWarZ battles on stage. [X] SOL to artists.
The ZAO community built this show, and your support made it possible.

Your metrics report is coming by Oct 7 — it'll include attendee count, social media reach, and your specific benefit delivery confirmation.

Thank you.

— Zaal and the ZAO team
```

### ZABAL S2 Week 6 Session (1:45 PM go-live)

Per doc 1677 Week 6 standard Monday ops:

**9:00 AM — Go-live post:**
ZOE posts to /zabal:
```
ZABAL S2 Week 6.

Today: ZAOstock debrief. What happened, what the data showed, what Track A artists learned from the on-stage battles.

2:00 PM ET.
[Join link]
```

ZOE posts to ZABAL S2 Telegram:
```
ZABAL S2 Week 6 today — ZAOstock debrief.

Track A: if you battled at ZAOstock, share your experience in the session.
Track B: if you documented the event, your doc notes are valid content for a ZAOOS PR.

2PM ET. [Join link].
```

**1:45 PM — go-live reminder:** Standard ZABAL S2 Monday reminder (doc 1677).

**Session content (for Zaal to confirm):** ZAOstock debrief — what the metrics showed, what worked, what to improve for Year 2. Track A battle review (any ZAOstock battles count toward the 5-battle requirement). Track B: event documentation as a ZAOOS doc opportunity.

**~3:30 PM:** Attendance list from Zaal → ZOE writes to Supabase.

**4:30 PM:** Session recap post (doc 1677 post-session template):
```
ZABAL S2 Week 6 done.

[N]/[Total] attended.

ZAOstock debrief: [N] people in the room, [N] battles, [X] SOL to artists.
Track A: ZAOstock battles count toward your 5-battle milestone. Submit via @zaoclaw_bot.
Track B: document what you saw. That's a ZAOOS doc opportunity right there.

Week 7: [curriculum note — eligibility check week per doc 1677].
```

---

## Oct 6 (Tuesday) — Sponsor Metrics Report Draft

### 10:00 AM — Sponsor Metrics Pull

ZOE pulls the following for each sponsor tier:

**All Sponsors:**
- Event attendance: [N] attendees
- Social media reach: posts mentioning sponsor name/handle on /zao + /wavewarz (ZOE counts from Farcaster)
- Verbal mention: confirmed (Zaal confirms during sponsor debrief)

**Title Sponsor ([Name] — $2.5K tier):**
- Logo placement: banner confirmed in photos (ZOE asks Zaal for photo link showing banner)
- Emcee mention: time of mention in recording (if video archived)
- 10 complimentary tickets: actual attendee scan-in count from Eventbrite export

**Stage Sponsor ([Name] — $1K tier):**
- Stage branding: confirmed in photos
- 5 complimentary tickets: actual scan-in count

**Community Sponsor ([Name] — $500 tier):**
- Program placement: confirmed
- 3 complimentary tickets: actual scan-in count

ZOE drafts the sponsor metrics report (one per sponsor, per doc 1659 format):

```
ZAOstock Oct 3 — Sponsor Metrics Report
Prepared for: [Sponsor Name]
Date: October 6, 2026

EVENT OVERVIEW
Total attendees: [N]
WaveWarZ battles completed on stage: [N]
Total SOL to artists: [X]
Africa Battle Week charity payout: [Y] SOL to [Charity Name]

YOUR BENEFITS DELIVERED
[Tier-specific checklist — each line: ✓ Delivered / ✗ Not delivered / ~ Partial]

REACH
Posts mentioning [Sponsor Name] on /zao and /wavewarz: [N]
Newsletter Issue 2 (Sep 1, 2026) subscriber count at send: [N]
Farcaster cast impressions (estimated): [N]

COMPLIMENTARY TICKETS
Tickets reserved for [Sponsor Name]: [N]
Tickets scanned in at event: [N]

NEXT STEPS
Newsletter Issue 3 (ZAOstock recap issue): [expected send date]
Year 2 planning: Zaal will reach out for early partner renewal conversation by [date]

Questions? Reply to this email or text [Zaal's number].
```

ZOE sends draft report to Zaal for approval:
```
ZAOstock sponsor metrics reports ready for your review.

[N] sponsors have reports drafted.

I need:
1. Confirmation of verbal mention times (or a timestamp in the video)
2. Your approval before I send

Reply 'send reports' when ready.
```

**GATED:** ZOE does not send sponsor reports until Zaal approves.

### 2:00 PM — ZABAL S2 At-Risk Check (Week 6, per doc 1677)

ZOE queries Supabase for any participant who missed Week 5 (Sep 29) and Week 6 (Oct 6). If missed 2 consecutive: at-risk DM sent.

---

## Oct 7 (Wednesday) — Sponsor Reports Sent + Newsletter Outline

### Morning — Sponsor Reports Send (after Zaal approval)

ZOE sends all sponsor metrics reports via email.
Logs to `~/.zao/zoe/zaostock-sponsor-reports.jsonl`:
```json
{"date": "2026-10-07", "sponsor": "[name]", "sent_at": "[timestamp]", "report_version": "v1"}
```

Marks `metrics_report_sent = true` in Supabase `zaostock_sponsors`.

### 11:00 AM — Newsletter Issue 3 Outline (ZAOstock Recap)

ZOE sends Zaal a Newsletter Issue 3 outline for review:
```
Newsletter Issue 3: ZAOstock Recap
Proposed send date: Oct 15, 2026

Sections:

1. ZAOstock in numbers
   - [N] attendees, [N] battles, [X] SOL to artists
   - [Charity payout with tx hash]

2. Photos + video highlight reel
   - [3-5 best photos from event — link to Drive]
   - [Video highlight clip if available]

3. ZABAL S2 Week 6 spotlight
   - Artist who battled at ZAOstock and their ZABAL S2 milestone count
   - Builder who submitted their first PR during the event week

4. What's next
   - ZABAL S2 continues through Nov 21
   - COC #9 planning (COC #8 was Aug 15 — what's the cadence?)
   - ZAOstock Year 2 teaser (one sentence)

5. Zaal personal note
   [ZOE leaves blank — Zaal writes]

Subject line options:
A. "ZAOstock happened. Here's the data."
B. "The community showed up. [N] people in Ellsworth."
C. "What ZAOstock proved."

Reply 'outline approved' or with edits.
```

**GATED:** Newsletter Issue 3 draft does not begin until Zaal approves the outline.

### 2:00 PM — Public Stats Post (Final)

ZOE posts the confirmed ZAOstock stats to /zao (once all stats are confirmed and Zaal approves):
```
ZAOstock 2026: final numbers.

[N] people showed up.
[N] WaveWarZ battles on stage.
[X] SOL wagered. [Y] SOL to artists.
[Z] SOL to [Charity Name] from Africa Battle Week.

Ellsworth, Maine. Oct 3.

See you next year.
```

---

## ZAO H2 Milestone Tracker Update (doc 1710)

ZOE runs the Oct monthly pull for the ZAO H2 milestone tracker on Oct 1 (per doc 1710 schedule). After ZAOstock on Oct 3, ZOE adds a special event entry:

```
ZAOstock Oct 3 actuals (added post-event):
- Attendees: [N]
- WaveWarZ battles on stage: [N]
- SOL wagered: [X]
- SOL to artists: [Y]
- Charity payout: [Z] SOL to [Name]
```

ZOE sends Zaal a citable fact update for grants and press (per doc 1710 citable sentence template):
```
New citable facts for grants/press:

"ZAO's inaugural ZAOstock festival (Ellsworth, Maine, Oct 3, 2026) drew [N] attendees, featured [N] live WaveWarZ battles, and distributed [X] SOL to artists via on-chain payouts."

"Africa Battle Week (Sep 22-26, 2026) sent [Z] SOL to [Charity Name] in a transparent, on-chain community governance transaction — the first ZAO community-voted charity payout."
```

---

## Failure Protocols

### Stats not received from Hurricane by Oct 5 noon
ZOE DMs Zaal: "No WaveWarZ battle stats from Hurricane as of Oct 5. I can send sponsor reports with attendance stats only and note WW stats 'to be updated.' Or I can wait 24h. Your call." Zaal decides.

### Eventbrite export fails (can't get attendee count)
ZOE uses the scan count from the ticket-scan app (if Hurricane tracked on-site). Fallback: Zaal's on-site headcount estimate. Log the source in the sponsor report: "Attendee count source: [Eventbrite / on-site scan / estimate]."

### No media assets received by Oct 5
ZOE sends sponsor thank-you without photos. Notes in the Oct 6 sponsor metrics report: "Photo/video assets in progress — a supplemental post with media will follow by Oct 10." Zaal must provide media or ZOE waits.

### Sponsor disputes their benefit delivery
ZOE does not respond to sponsor directly. ZOE forwards the message to Zaal: "[Sponsor name] is questioning [specific benefit]. The report says [what we delivered]. How should I respond?" Zaal handles the sponsor conversation.

### Newsletter Issue 3 outline not approved by Oct 9
ZOE sends Zaal a reminder Oct 9: "Issue 3 outline sent Oct 7 — haven't heard back. Reply 'approved' or with edits. Target send Oct 15." If not approved by Oct 11, ZOE pushes newsletter send date to Oct 20 and notes the delay.

---

## Summary: ZOE Timeline Oct 4-7

| Date | ZOE Task |
|------|---------|
| Oct 4 | Immediate recap post to /wavewarz+/zao+/zabal. Stats pull request to Hurricane. Media inventory DM to Zaal. ZABAL S2 post-ZAOstock Telegram post. |
| Oct 5 | Stats confirmation (follow up Hurricane/Zaal if needed). ZABAL S2 Week 6 session ops (go-live, reminder, attendance, recap). Sponsor thank-you emails (first wave). |
| Oct 6 | Sponsor metrics report drafting. All-sponsor report draft sent to Zaal for approval (GATED). ZABAL S2 at-risk check (Tuesday). |
| Oct 7 | Sponsor metrics reports sent (after Zaal approval). Newsletter Issue 3 outline sent to Zaal (GATED until approved). Public final stats post (after Zaal approval). |

---

## Sources

- `research/events/1722-zaostock-final-week-countdown/` — Oct 2 eve ops (feeds this doc)
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 6 Monday ops (ZAOstock debrief session), Tuesday at-risk check
- `research/events/1659-zaostock-sponsor-activation-guide/` — Sponsor tier benefits + metrics report framework
- `research/technology/1650-zaostock-eventbrite-webhook-handler/` — Attendee count data source
- `research/technology/1710-zao-h2-milestone-tracker/` — Monthly stats pull + citable claims update
- `research/community/1693-zao-newsletter-issue-2-aug2026/` — Newsletter send protocol (Issue 3 follows same approval flow)
