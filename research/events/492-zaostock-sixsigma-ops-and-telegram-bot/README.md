# 492 - Six Sigma Ops Framework + ZAOstock Team Telegram Bot

> **Status:** Research complete
> **Date:** 2026-04-24
> **Days until ZAOstock:** 162 (Apr 24 - Oct 3, 2026)
> **Team:** 17 contributors, solo Zaal operator with uneven availability
> **Cost:** $0 incremental beyond minimal-budget-stack.md ($25 total AI spend)

---

## Overview

This doc answers the operational question every AI-assisted event must solve: **"How do we run 162 days with lean discipline while keeping a distributed team aligned?"** 

Two parts:
1. **Part 1:** Concrete Six Sigma + Lean framework adapted for ZAOstock — 12 tools, each with specific dashboards, cadences, owners, and success metrics
2. **Part 2:** Telegram bot spec (Hermes-powered local LLM) as the async team channel, keeping Zaal in the loop without requiring real-time standups

---

## PART 1: SIX SIGMA / LEAN OPERATIONS FOR 162 DAYS

### Part 1 Key Decisions Table

| Decision | Recommendation | Owner | Cost |
|----------|---|---|---|
| DMAIC phases on all 20 workstreams | USE — label each kanban column with DMAIC stage (Define → Measure → Analyze → Improve → Control). Schema: status enum. | Zaal | $0 |
| CTQ trees for 10 critical workstreams | USE — define Quality for Sponsors, Artists, Volunteers, Run-of-show, Budget, Day-of, Media, Content, Safety, Follow-up. Live in dashboard "Success Criteria" tab. | Zaal | $0 |
| Value Stream Map for 3 core flows | USE — end-to-end timeline + touchpoints for Sponsor, Artist, Volunteer flows. Model in `research/events/492/flows/` as .md docs + Mermaid diagrams. | Eng | $0 |
| Kanban WIP limits | USE — Sponsors in_talks cap 8, Artists contacted cap 15, Todos in_progress cap 3 per person. Dashboard warns yellow >cap. | Zaal | $0 (UI component) |
| Andon cord (visual mgmt) | USE — top dashboard card shows red if ANY: sponsor overdue, artist missing rider, volunteer shift uncovered, budget line >20% over, timeline blocked. Green = all clear. | Eng | $0 |
| 5-Whys + A3 template | USE — stored template in `stock_incidents` table. When incident marked red, prompt asks for 5-whys walk. Root cause saved. | Eng | $0 |
| Gemba walks (async) | USE — daily 10am EST prompt to all users: "What moved? What's blocked?" Replies go to `stock_activity_log`. Zaal reads async digest 8am EST. | Telegram bot (Part 2) | $0 |
| Control charts (weekly sparklines) | USE — 5 metrics: sponsor commits/week, artist pipeline velocity, volunteer signups/week, $ variance, todo burndown %. Render on Home tab. | Eng | $0 |
| Takt time targets | USE — 10 artists by Sep 3 (132 days) = 1 artist / 13 days. $15K target / 162 days = $92/day pace. 20 volunteers / 162 days = 1 / 8 days. Show actual vs target on Home tab. | Zaal | $0 |
| Heijunka (load leveling) | USE — max WIP per role: Zaal 8, Candy/DCoop 5, Advisors 3, members 3, new members 1. Enforce via UI warning + weekly check. | Dashboard | $0 |
| Standardized Work (7 checklists) | USE — checkboxes in meeting notes + task templates. Onboarding, weekly meeting, close sponsor, book artist, day-of runbook, incident 5-whys, post-event follow-up. | Zaal | $0 |
| Kaizen loops (weekly retro) | USE — Thu 6pm EST async retro via Telegram bot. 3 prompts: worked, blocked, 1 experiment next week. Zaal reviews Fri AM. | Telegram bot (Part 2) | $0 |

---

## The 12 Six Sigma / Lean Tools (Detailed Specs)

### 1. DMAIC Phases Across All 20 Workstreams

Apply Toyota's DMAIC to every kanban column. Each status = a phase.

**Define → Measure → Analyze → Improve → Control** maps to:
- Sponsor: Lead (D) → Contacted (M) → In Talks (A) → Committed (I) → Paid (C)
- Artist: Wishlist (D) → Contacted (M) → Interested (A) → Confirmed (I) → Booked (C)
- Volunteer: Applied (D) → Reviewed (M) → Matched (A) → Confirmed (I) → Shift Assigned (C)
- Todo: To Do (D) → In Progress (M/A) → Done (I/C)
- Timeline: Pending (D) → In Progress (M/A) → Done (I) → Locked (C)
- Budget: Projected (D) → Committed (M) → Actual (I/C)

**Dashboard integration:** Each card shows kanban column color-coded to phase. Drag = phase advancement.

**Cadence:** Continuous (every time someone drags a card).

**Owner:** All (team drags cards), Zaal reviews velocity.

**Success metric:** Sponsor entry moves through all 5 phases by Sep 1 (120 days). If stuck in Analyze >14 days, escalate.

---

### 2. CTQ (Critical-to-Quality) Trees

Define what "done" means for each critical workstream. Display on Home tab.

| Workstream | CTQ (Definition of "Done") | How We Measure | Threshold | Alert if |
|---|---|---|---|---|
| **Sponsors** | $15K committed by Sep 1 (9 sponsors, avg $1.7K), all 3 tracks represented, zero declines after commit | Weekly $ total + track diversity count | 10 sponsors min, 0 post-commit declines | <$10K by Aug 15 |
| **Artists** | 10 confirmed by Sep 3, all riders on file, travel booked for non-local | Confirmed count + rider upload % + travel_booked count | 10 confirmed, 100% rider, 80%+ travel | <8 by Aug 15 |
| **Volunteers** | 20 confirmed, all 8 shift-role combos covered, zero no-shows day-of | Confirmed count + shift coverage map | 20 min, all shifts ≥1 person | <15 by Sep 15 |
| **Run-of-Show** | Zero delays >5 min, artist start times hit within 2 min, energy curve smooth (no >2min gaps between sets) | Incident log on Oct 3, timestamps | All artists start within window | >2 incidents flagged |
| **Budget** | Net positive or break-even, no line item >2 standard deviations over projection | Weekly variance report (actual vs committed vs projected) | Variance <10% overall | Any line >2σ over |
| **Day-of Oct 3** | Zero P0 incidents (artist no-show, safety, vendor fail), all 10 artists played, weather contingency deployed if needed | Incident severity log + artist completion list | 0 P0s, 10/10 artists | Any P0 incident |
| **Media** | 100+ photos captured, 1 highlight reel (5 min) edited + posted by Oct 5 | Photo count in Supabase, reel uploaded | 100+ photos, reel live | <75 photos by Oct 4 |
| **Content** | Zero silent days Aug 20-Oct 3 (post to @ZAOfestivals 3x/week min), all team posts recasted | Activity log + recast count | 3 posts/week, recasts by others | No posts >7d |
| **Safety** | Zero preventable incidents, 100% insurance on file, wristband system ready Oct 1, volunteer safety briefing 100% attended | Incident severity log, insurance check, setup checklist | 0 preventable, 100% insurance, 20/20 briefed | >1 incident, missing insurance |
| **Follow-up** | 100% sponsor ROI reports sent by Oct 20, NPS >50 from artists/sponsors, thank-you gifts sent | Sent count, NPS average, gift tracking | 100% sent, NPS avg ≥50, gifts ≥8 | NPS <40 |

**Dashboard integration:** "Success Criteria" tab shows all 10 CTQs with real-time progress bars.

**Cadence:** CTQs reviewed weekly at Tuesday meeting. Metrics auto-updated from dashboard data.

**Owner:** Each workstream lead owns their CTQ (Zaal for most, DCoop music, Candy ops).

---

### 3. Value Stream Map for 3 Core Flows

End-to-end timing + value-add vs waste.

#### Sponsor Flow: Identify → Commit → Paid (30-90 days)

```
STEP 1: IDENTIFY (0-5 days)
   Input: Zaal / Finance team brainstorm
   Value: List candidate sponsors from Ellsworth + ecosystem
   Touchpoints: Hunter.io lookup (5 min), Farcaster search, Discord notes
   Waste: Duplicate lookups, old contact info
   Output: 20-30 leads in "Lead" status
   Success: Valid email/phone for 95% of leads

STEP 2: ENRICH (5-10 days)
   Input: 20-30 leads
   Value: Add decision-maker name, 2-sentence "why them" rationale, find personal connection
   Touchpoints: LinkedIn search, sponsor history research, Farcaster deep dive
   Waste: Manual concatenation, typing same emails
   Output: Enriched lead row: name, contact, track fit, $tier estimate
   Success: All leads have contact email + "why them" note

STEP 3: DRAFT + SEND (10-20 days)
   Input: Enriched leads
   Value: Personalized pitch email, brand deck link
   Touchpoints: Claude draft (5 min), Zaal review (10 min), personalize, send
   Waste: Zaal hand-writing all emails, sending from ZAO address
   Output: Email sent, logged in contact_log with date + reply status
   Success: Send rate 100%, reply rate >30%

STEP 4: FOLLOW-UP (20-40 days)
   Input: Replied leads + non-replied after 7d
   Value: Warm follow-up call (by Tyler/Finance) or 2nd email
   Touchpoints: Slack DM, phone call log (manual notes in contact_log), meeting booked
   Waste: Deals dying from no follow-up; lost momentum
   Output: Call happened or 2nd email sent, next action logged
   Success: 80% of "contacted" have follow-up within 14d

STEP 5: CALL (40-65 days)
   Input: Responded sponsors + scheduled calls
   Value: 30-min call (Tyler or Zaal), understand needs, positioning
   Touchpoints: Zoom/phone, notes captured, ask for $ / terms
   Waste: Back-and-forth email before call, unclear ask
   Output: Call notes, deal status updated to "in_talks", draft commitment terms
   Success: All 15-20 engaged sponsors get a call; 50% → in_talks

STEP 6: NEGOTIATE (50-75 days)
   Input: In-talks sponsors
   Value: Finalize $ amount, sponsorship package, deliverables (booth, logo placement, mention)
   Touchpoints: Email loops, maybe 2nd call, Google Doc agreement draft
   Waste: Unclear packages, chasing paperwork
   Output: Deal summary + sponsorship tier locked (e.g., $5K = Mainstage Sponsor)
   Success: All in_talks get terms drafted; 70% agree

STEP 7: CONTRACT (75-85 days)
   Input: Agreed sponsors
   Value: Legal agreement signed (or simple email confirmation)
   Touchpoints: HelloSign / Google Docs signature flow, invoice generated
   Waste: Waiting for signatures, losing paper docs
   Output: Signed contract + invoice in stock_attachments
   Success: 100% of committed sponsors have signed + invoice

STEP 8: INVOICE (85-90 days)
   Input: Signed sponsors
   Value: Invoice generated + sent, payment terms clear
   Touchpoints: PDF invoice (Claude Vision generates from template), email sent, logged in budget
   Waste: Manual invoicing, unclear payment dates
   Output: Invoice in contact_log; payment date set to 30d before Oct 3
   Success: 100% invoiced by Aug 25

STEP 9: PAID (85-90+ days)
   Input: Invoiced sponsors
   Value: Money received, sponsor marked "paid", budget updated
   Touchpoints: Check in, ACH transfer, manually log in budget_entries (or API hook)
   Waste: Deals "committed" but never funded; uncertainty day-of
   Output: Sponsor marked "paid"; amount reflected in budget_entries
   Success: 90% paid by Sep 25 (9d before event)

CALENDAR: 30 days (Jan outreach) → 90 days (Sep paid)
TARGET TAKT: 1 sponsor every 8d (162 days / 20 leads = 8.1d)
```

**Dashboard integration:** Timeline tab shows "Days to Oct 3" + current step for each sponsor. Card color shifts through DMAIC phases.

**Cadence:** Updated weekly; Tyler reviews Mon AM to prioritize next week's calls.

**Owner:** Tyler (Finance lead), Zaal final approval.

---

#### Artist Flow: Discover → Booked → Travel Locked (60-120 days)

```
STEP 1: DISCOVER (0-10 days)
   Input: ZAO genre preferences, Farcaster + personal networks
   Value: Identify 15-20 artist candidates across local/virtual/ecosystem tracks
   Touchpoints: Neynar search, ZAOCHELLA roster review, curator tips
   Waste: Stale contact info, artists already committed elsewhere
   Output: 15+ artists in "Wishlist" status
   Success: Mix across tracks and genres; all have Farcaster or email

STEP 2: SHORTLIST (10-20 days)
   Input: 15+ wishlist
   Value: Filter to 12 "real" targets (feasible logistics, fit genre/theme)
   Touchpoints: Zaal + DCoop review, listen to samples, check travel logistics
   Waste: Contacting someone unavailable; wasting contact
   Output: 12 artists marked "shortlisted" (internal tag, not a status)
   Success: All 12 have confirmed email + travel location

STEP 3: FIRST CONTACT (20-40 days)
   Input: 12 shortlist
   Value: Warm outreach (Claude draft, DCoop review, personalized send)
   Touchpoints: DM or email, 2-3 day response window, reply logged
   Waste: Cold emails; no context; high rejection
   Output: Contact sent, reply tracked in contact_log
   Success: >60% reply rate

STEP 4: INTERESTED (40-60 days)
   Input: Replied artists
   Value: Pitch (set time, vibe, audience size, travel help offered)
   Touchpoints: Call or follow-up email (Claude draft), artist sees opportunity fit
   Waste: Artist unsure of commitment; silence
   Output: Artist says "interested" or "declined"
   Success: >70% of contacted → interested

STEP 5: CONFIRM (60-80 days)
   Input: Interested artists
   Value: Booking confirmed (date lock, fee, deliverables: bio, photo, socials)
   Touchpoints: Contract sent (HelloSign or Google Docs), signed, fee agreed
   Waste: Handshake but no paper; fee disputes day-of
   Output: Contract signed, status "confirmed", fee logged in budget
   Success: 100% of interested → confirmed with paper

STEP 6: RIDER (80-100 days)
   Input: Confirmed artists
   Value: Technical rider (stage plot, audio inputs, lighting, backline) on file
   Touchpoints: Email rider template, artist fills out, PDF uploaded to stock_attachments
   Waste: Day-of surprises; missing technical needs; artist frustration
   Output: Rider PDF in stock_attachments, stage plot extracted via Claude Vision
   Success: 100% of confirmed have rider ≤30d before event

STEP 7: TRAVEL (100-110 days)
   Input: Confirmed + riders received
   Value: Travel booked (for non-local), hotel/parking/transport locked
   Touchpoints: Zaal or DCoop offers to help, artist confirms flights + lodging
   Waste: Last-minute cancels; "I can't make it" day-before
   Output: travel_booked = true, travel_from city recorded, notes has bookings confirmation
   Success: 100% non-local artists booked + paid travel by Sep 10

STEP 8: ASSETS (110-125 days)
   Input: Confirmed + travel booked
   Value: Artist photo + logo + bio + socials for promotions
   Touchpoints: Email reminder, artist uploads to Farcaster or sends link, Zaal curates + posts
   Waste: Missing assets; last-minute scrambles; low-quality promotions
   Output: Assets in stock_artists row (photo_url, logo_url, bio)
   Success: 100% assets locked by Sep 20

CALENDAR: May 1 (discover) → Sep 15 (booked) = 137 days
TARGET TAKT: 1 artist / 13 days (target Sep 3 hard lock; 15 days slack)
```

**Dashboard integration:** ArtistPipeline tab shows each artist's status + days since last update. Red card if rider overdue.

**Cadence:** Updated weekly by DCoop; Zaal reviews velocity vs Sep 3 deadline Wed AM.

**Owner:** DCoop (Music lead), Zaal final call.

---

#### Volunteer Flow: Apply → Shift Locked → Showed Up (30-60 days)

```
STEP 1: RECRUIT (0-30 days)
   Input: ZAO network + community signal (public /apply form)
   Value: Identify 25-30 candidate volunteers
   Touchpoints: Farcaster posts, Discord, ZAO member DMs, VolunteerRoster public form
   Waste: Same volunteers apply twice; unclear roles; no follow-up
   Output: 25-30 volunteers in VolunteerRoster, status "applied"
   Success: Diversity of roles (setup, checkin, water, content, safety, etc.)

STEP 2: MATCH ROLE (30-40 days)
   Input: 25-30 applied
   Value: Claude suggests best-fit role (setup/checkin/water/safety/content) based on bio + prior experience
   Touchpoints: Claude Haiku inference on volunteer bio, Zaal clicks "confirm"
   Waste: Manual assignment; forcing misfit volunteers; burnout day-of
   Output: Each volunteer has role suggestion + Zaal confirmation
   Success: All 25-30 have assigned role; no "unassigned" left

STEP 3: CONFIRM (40-50 days)
   Input: 25-30 with assigned roles
   Value: Volunteer confirms commitment, gets shift time + day-of logistics
   Touchpoints: Telegram bot /confirm command or dashboard toggle, SMS confirmation
   Waste: Volunteers flake; no awareness of shift time
   Output: confirmed = true, shift assigned (early/block1/block2/teardown/allday)
   Success: 20 confirmed out of 30 (67% conversion); all 8 shift-role combos covered

STEP 4: SHIFT SCHEDULE (50-55 days)
   Input: 20 confirmed
   Value: Shift times locked, communicated to volunteers, calendar published
   Touchpoints: OR-Tools optimization run (min conflicts), team approval, SMS sent to all volunteers
   Waste: Chaos; conflicts; double-booked slots
   Output: shift + shift_time finalized; SMS sent
   Success: 100% volunteers know their shift time; calendar published to ZAO

STEP 5: REMINDERS (55-162 days)
   Input: Confirmed volunteers
   Value: 48h and day-before SMS reminders (Twilio automation)
   Touchpoints: Cron job fires SMS at 48h and 24h before shift, replies logged
   Waste: No-shows; volunteers forget
   Output: SMS sent; click-through confirms attendance
   Success: <10% no-show rate

STEP 6: CHECK-IN (Oct 3, dawn)
   Input: Expected volunteers
   Value: Badge scan or verbal confirmation at gate; assign actual start time
   Touchpoints: Zaal / Candy at gate with tablet, barcode scan or clipboard
   Waste: No-show surprises; missing volunteers block setup
   Output: check_in_time logged per volunteer; immediate escalation if shift uncovered
   Success: All 20 checked in by 8am; zero critical shifts uncovered

STEP 7: SHIFT COMPLETION (Oct 3, all day)
   Input: Checked-in volunteers
   Value: Volunteer completes shift; notes on performance logged
   Touchpoints: Shift lead (e.g., Tyler for safety) marks "done" + notes, volunteer points awarded
   Waste: Lost feedback; no record of who did what
   Output: shift completed = true, notes on performance, ZAOfestivals points earned
   Success: 100% completion; no incidents during shift

STEP 8: THANK YOU (Oct 4-7)
   Input: 20 completed volunteers
   Value: Personal thank-you, photo from event, future opportunity mention
   Touchpoints: Custom email (Claude draft), physical thank-you gift if budget allows
   Waste: Volunteers feel used; no loop back for Year 2
   Output: Thank-you email sent, gift logged
   Success: NPS >50 from volunteers; >50% willing to repeat next year

CALENDAR: Apr 24 (open apply form) → Sep 28 (final shift schedule) = 157 days
TARGET TAKT: 1 volunteer / 8 days
```

**Dashboard integration:** VolunteerRoster tab shows recruitment waterfall + shift coverage heat map. Red = uncovered shift.

**Cadence:** Updated weekly; check-in surge Oct 1-3 (multiple times daily).

**Owner:** Zaal + Candy.

---

### 4. Kanban WIP Limits

Display soft-cap warnings on dashboard. Yellow card = approaching limit. Red = over limit.

| Tab | Column | Soft Cap | Why | Alert |
|---|---|---|---|---|
| **Sponsors** | In Talks | 8 | Can't close >3-5 per week realistically; hoard = failed deals | Yellow at 7, Red at 9+ |
| **Artists** | Contacted | 15 | 12-week window; too many active conversations disperse focus | Yellow at 12, Red at 16+ |
| **Artists** | Interested | 10 | Pipeline funnel; can't confirm >2-3/week; over-commit = broken promises | Yellow at 8, Red at 11+ |
| **Todos** | In Progress (per person) | 3 | Context switching kills focus; Zaal especially (will attempt 8-10 without limit) | Yellow at 3, Red at 4+ |
| **Timeline** | Blocked | 0 | Any blocked item is operational pain; escalate immediately | Red at 1+ |

**Dashboard integration:** Each column header shows "3/8" count. Hover = tooltip explaining "this soft-cap prevents context switching."

**Cadence:** Continuous (auto-calculated on every drag).

**Owner:** Team (self-enforcing via visual signal).

**Success metric:** Sponsors in_talks doesn't stay >8 for >5 consecutive days; Artists contacted doesn't spike above 15 until May 15.

---

### 5. Andon Cord (Visual Management - Red Light/Green Light)

Top of Home tab: **One status card** that goes RED if ANY of these trigger:

| Condition | Threshold | Action if Red |
|---|---|---|
| Sponsor last_contacted_at > 14 days old while status = "in_talks" | >1 sponsor | Zaal gets morning alert; review for follow-up |
| Artist status = "confirmed" AND needs_travel = true AND travel_from is NULL or empty | Overdue by 30+ days before event | Escalate to Zaal; DCoop outreach |
| Volunteer shift UNCOVERED within 30 days of Oct 3 | 1+ shifts with 0 assigned volunteers | CRITICAL; Zaal + Candy activate backup recruitment |
| Budget line item actual > projected by 20%+ | 1+ line items | Finance team (Tyler) review; cut or fundraise |
| Timeline item status = "blocked" | 1+ items | Escalate same day; owner + Zaal sync |
| Media photos captured (as of Sep 25) | <50 photos | Alert Content lead to capture more |

**Dashboard integration:** Single card at top of Home tab:
- GREEN: All clear ✓
- YELLOW: 1-2 minor thresholds approaching
- RED: 1+ critical thresholds breached (show which ones below the card)

Clicking RED shows detail + suggested action.

**Cadence:** Auto-updated (every DB write); Zaal checks 8am + 6pm daily.

**Owner:** Zaal (reads alerts); responsible team lead (acts).

---

### 6. 5-Whys + A3 Problem-Solving Template

When an incident goes RED or a blocker appears, prompt operator to fill in root cause analysis.

**Template stored in `stock_incidents` table:**

```
Incident: [what happened]
Severity: P0 (blocker) / P1 (urgent) / P2 (normal) / P3 (nice to fix)

First Why: Why did [incident] happen?
  [operator writes]

Second Why: Why did [first why] happen?
  [operator writes]

Third Why: Why did [second why] happen?
  [operator writes]

Fourth Why: Why did [third why] happen?
  [operator writes]

Fifth Why: Why did [fourth why] happen?
  [operator writes]

ROOT CAUSE STATEMENT: [synthesized 1-2 sentence root cause]

IMMEDIATE ACTION: [what to do right now to contain]

SYSTEMIC FIX: [what process change prevents recurrence]

OWNER: [who implements systemic fix]

DUE: [date for fix to land]
```

**Example:** Artist no-shows for confirming travel.

```
Incident: Artist X said they'd confirm travel by July 15, didn't follow up by Aug 15
Severity: P1 (confirmed artist overdue on rider; risk to lineup)

First Why: Why didn't artist X confirm?
  They said "I'll call you next week" and that conversation fell off the radar.

Second Why: Why did it fall off the radar?
  We logged the call in notes, but didn't create a calendar reminder or follow-up task.

Third Why: Why didn't we create a reminder?
  Process says "log all calls in contact_log" but doesn't say "create reminder 3d after call if no confirmation."

Fourth Why: Why no reminder process?
  When we designed the contact_log table, we didn't anticipate multi-day follow-up loops.

Fifth Why: Why didn't we anticipate multi-day follow-up?
  We're learning as we go; no systemic process existed for artist follow-up in Year 1.

ROOT CAUSE STATEMENT: No automated follow-up reminder for artists who say "I'll confirm next week" — creates passive dependency on human memory.

IMMEDIATE ACTION: Manual SMS to Artist X: "Hey, confirming your travel for ZAOstock Oct 3?" with YES/NO reply.

SYSTEMIC FIX: Add "follow_up_reminder_date" column to stock_artists; after a call is logged, set reminder to 3d out; cron job sends SMS 48h before; log reply in contact_log.

OWNER: Engineer

DUE: Aug 1 (retroactively, to prevent day-of surprises)
```

**Dashboard integration:** New "Incidents & Learnings" tab shows all incidents + their root causes. Sortable by severity + date. Serves as institutional memory.

**Cadence:** Triggered by RED Andon or end-of-meeting debrief. Target: fill in within 1 hour of incident.

**Owner:** Incident reporter (often Zaal); owner implements fix.

---

### 7. Gemba Walks (Async Daily Standup)

**Gemba = "real place" in Japanese. Walk the factory floor, see actual state, not the report.**

For ZAOstock, "floor" = the dashboard. Daily async prompt via Telegram bot.

**10am EST every weekday (Apr 24-Oct 3):**

Telegram bot sends to all team members:
```
[MORNING GEMBA 🔍]

Quick check-in: what moved this week? what's blocked?

/gemba  ← reply format

"What moved: [brief status update]
What's blocked: [any red flags?]"
```

Replies logged to `stock_activity_log` with `action='gemba_reply'`. Zaal reads aggregated digest 8am EST next day.

**Aggregate digest (generated by bot, sent to Zaal):**
```
GEMBA DIGEST — Friday Apr 26

WHAT MOVED:
- Sponsors: Tyler closed Bangor Savings (in_talks → committed, $3K)
- Artists: DCoop confirmed 2 artists; 8 now interested
- Volunteers: 5 new applications; 3 matched to roles
- Todos: 7 done, 3 still in_progress (tracking normally)

WHAT'S BLOCKED:
- Budget: Missing 1 receipt for catering quote (Tyler owns, due Mon)
- Timeline: Run-of-show approval pending (Zaal review, blocking artist set times)
- Volunteers: 1 critical shift (Setup 6-8am) still uncovered

KEY SIGNALS:
- Sponsor pace: 1.5 commits/week (target 1; ahead of takt!)
- Artist velocity: 2 confirmed/week (target 1; ahead; Sep 3 looks solid)
- Volunteer gap: 20 confirmed, need 5 more for 100% coverage
```

**Dashboard integration:** "Activity Log" tab auto-displays gemba replies + aggregated digest. Searchable by week.

**Cadence:** Daily prompt; Zaal digest Fri AM (after all Wed-Fri replies come in).

**Owner:** Telegram bot (auto-prompt); all team (reply); Zaal (review).

---

### 8. Control Charts (Weekly Sparklines)

5 mechanical metrics displayed as mini line charts on Home tab. Track pace vs target.

| Metric | Target | Formula | Frequency | Alert if |
|---|---|---|---|---|
| **Sponsor $ Committed (weekly)** | $92/day sustained = $644/week | SUM(amount_committed) WHERE updated_at in [last 7d] | Weekly Fri | <$500 two weeks running |
| **Artist Pipeline Velocity** | 1 artist/13d = 0.077/day | (wishlist→contacted count) / 7 days | Weekly Fri | <0.05/day (falling behind) |
| **Volunteer Signups (weekly)** | 1 signup/8d = 0.125/day | COUNT(volunteers WHERE created_at in [last 7d]) | Weekly Fri | <0.1/day (pace dropping) |
| **Budget Line Variance (%)** | <10% overall | SUM(abs(actual-projected)) / SUM(projected) | Weekly Fri | >15% (slipping) |
| **Todo Burndown (%)** | >80% done rate | COUNT(todos WHERE status='done') / COUNT(todos total) | Weekly Fri | <70% (overload) |

**Chart style:** Sparkline (tiny 100px × 30px line chart) + current week value in big number. Green if on track, Yellow if approaching threshold, Red if below.

**Dashboard integration:** 5 sparklines side-by-side on Home tab, updated auto-Fri 5pm EST.

**Cadence:** Weekly (Fri); Zaal reviews Sat AM before week planning.

**Owner:** Eng (auto-calc); Zaal (reads).

---

### 9. Takt Time Targets

**Takt = "beat" — the pace at which work must flow to meet deadline.**

**ZAOstock Takt Rates (based on 162 days → Oct 3):**

| Workstream | Target | Formula | Current Pace | Status (as of Apr 24) |
|---|---|---|---|---|
| **Sponsors** | $15K by Sep 1 (131 days) | $15K / 131 = $114/day | $0 (day 1) | STARTING |
| | **$ / week sustained** | $114 × 7 = $798/week | Target |  |
| **Artists** | 10 confirmed by Sep 3 (132 days) | 10 / 132 = 0.076/day = 1/13d | 0 (day 1) | STARTING |
| | **# artists/week** | ~0.76/week | 0 (first week is discovery) |  |
| **Volunteers** | 20 confirmed by Sep 28 (157 days) | 20 / 157 = 0.127/day = 1/8d | 0 (form not live yet) | STARTING |
| | **# volunteers/week** | ~0.9/week | TBD next week |  |
| **Budget Items** | All contractors + vendors committed by Aug 25 (124 days) | ~3 vendors/week | TBD (sponsor funding unlocks this) | DEPENDENT |

**How to use:** Plot actual vs takt on control chart (metric #3 above). If actual < takt for 2 weeks, escalate to Zaal.

**Dashboard integration:** Home tab shows "Takt vs Actual" comparison for each workstream. Green = on pace, Yellow = slipping, Red = urgent.

**Cadence:** Weekly tracking (Fri).

**Owner:** Zaal (reads); responsible lead (responds if slipping).

---

### 10. Heijunka (Load Leveling)

Prevent anyone from overloading. Enforce WIP cap per role.

**Max Active Todos by Role:**

| Role | Max In Progress | Why | How to Enforce |
|---|---|---|---|
| Zaal (Lead) | 8 | Can appear to do 15 but actually context-switches. 8 = real capacity. | UI shows count; yellow at 7, red at 9+. Weekly Fri check. |
| Candy (2nd, Ops) | 5 | Divides time across volunteer coordination + budgets. | Same UI. |
| DCoop (2nd, Music) | 5 | Artist outreach + music curation. | Same UI. |
| Tyler / Craig / Fellenz (Advisory) | 3 | Part-time; other commitments. Don't overcommit. | Manual check at start of week. |
| Regular Member | 3 | Focus. | UI warning. |
| New Member / Starter | 1 | Onboarding, learning curve. | UI enforces (cannot drag >1 todo). |

**Dashboard integration:** Each person's Home tab shows "WIP: 3/8" count + a warning if over. Popup suggestion: "Consider finishing one of these before starting a new task."

**Cadence:** Checked weekly Fri (Zaal review); continuous warnings via UI.

**Owner:** Zaal (enforces culture); team (respects limits).

**Success metric:** No individual stays >cap for >3 days; sprint velocity stable week-to-week.

---

### 11. Standardized Work (7 Checklists)

Templates for recurring processes. Store in `stock_meeting_notes` + new `stock_checklists` table.

#### Checklist 1: New Team Member Onboarding
```
Onboarding Checklist
Name: [new member]
Scope: [ops/music/picks]

[ ] Send 4-letter login code + dashboard URL (zaoos.com/stock/team)
[ ] Schedule 15-min sync call (Zoom, Zaal)
[ ] Review "Your Scope" document (ops/music/picks role definition)
[ ] Bio Editor: upload photo + bio (3 sentences max)
[ ] Brand logo URL (personal or project logo)
[ ] Intro post drafted on @ZAOfestivals (Zaal curates, member approves, team recasts)
[ ] First task assigned (small, clearable within 2 days)
[ ] Slack/Discord invite to team channels
[ ] Weekly sync time confirmed (1st Tuesday 10am EST)

Sign-off: [date completed]
```

#### Checklist 2: Weekly Tuesday Meeting Runbook (10am EST, 30-60 min)
```
Weekly Meeting Runbook
Date: [Tue date]
Attendees: [names/Zoom link shared]

PRE-MEETING (Zaal, 30 min before)
[ ] Compile gemba digest (from Telegram activity log)
[ ] Pull fresh metrics (sponsor $, artist count, volunteer signups, variance, burndown)
[ ] Flag any RED Andon items
[ ] Sort agenda by priority (blockers, wins, decisions needed)

DURING (moderator = Zaal)
[ ] Check-in round (each person: 1 win, 1 blocker, 1 upcoming) — 10 min
[ ] Review Andon + control charts — 5 min
[ ] Decisions needed (sponsor finders split, shirt design, etc.) — 10 min
[ ] Next week's priorities (each team commits to 1 deliverable) — 5 min
[ ] Closing (1 experiment/kaizen suggestion for next week) — 5 min

POST-MEETING (Zaal, 15 min after)
[ ] Meeting notes typed into dashboard (Meeting Notes tab)
[ ] Action items extracted (owner, due date)
[ ] Send async digest to Slack (for those who couldn't attend)
[ ] Quote-cast drafted for @ZAOfestivals recap (optional)
```

#### Checklist 3: Closing a Sponsor (in_talks → paid)
```
Closing a Sponsor
Prospect: [name]
Amount: $[X]
Track: local/virtual/ecosystem

STEP 1: CONFIRM COMMITMENT (verbal)
[ ] Call or video with decision-maker
[ ] Confirm $ amount, sponsorship package, logo placement, booth type (if applicable)
[ ] Confirm no blockers (budget approval, finance dept sign-off)
[ ] Estimated close date (usually <7d after call)

STEP 2: SEND CONTRACT + INVOICE
[ ] Draft sponsorship agreement (Google Docs template)
[ ] Fill in: company name, contact, amount, deliverables, payment date
[ ] Generate invoice (PDF) via Claude Vision (amount + date due = 30d before Oct 3)
[ ] Send via email; request signature within 3 business days

STEP 3: FOLLOW UP (if no signature within 3d)
[ ] Slack or email reminder
[ ] Quick call if needed ("Hey, just checking in, any questions on the agreement?")

STEP 4: SIGNED
[ ] Move sponsor to "committed" status (in Kanban)
[ ] Save signed contract + invoice in stock_attachments (entity_type='sponsor', kind='contract')
[ ] Update amount_committed in row
[ ] Post social thanks: "Big thanks to [Sponsor] for supporting ZAOstock!" recast

STEP 5: PAYMENT RECEIVED
[ ] Check bank or ACH confirmation
[ ] Move sponsor to "paid" status
[ ] Update amount_paid in row
[ ] Sponsor dashboard shows GREEN
[ ] File receipt in stock_attachments (kind='invoice')

Timeline: Verbal commit → Paid = 7-14 days
```

#### Checklist 4: Booking an Artist (interested → confirmed)
```
Booking an Artist
Artist: [name]
Genre: [genre]
Track: local/virtual/ecosystem

STEP 1: CONFIRM INTEREST
[ ] Artist replied "yes" or accepted verbal pitch
[ ] Set time locked: 20-min set (default) or custom length (ask artist)
[ ] Fee confirmed: free, travel grant, or cash fee
[ ] Artist understands vibes + audience

STEP 2: SEND CONTRACT
[ ] Contract template: artist name, set date/time, fee, deliverables (bio, photo, socials, rider)
[ ] Send via HelloSign or Google Docs (request signature in 5 business days)
[ ] Note in contact_log: "Contract sent [date]"

STEP 3: COLLECT DELIVERABLES
[ ] Request bio (3-4 sentences), photo (high res), logo URL, Farcaster handle
[ ] Request rider PDF (stage plot, audio inputs, backline needs, technical notes)
[ ] Store in stock_attachments (entity_type='artist', kind='rider')

STEP 4: CONFIRM TRAVEL
[ ] If non-local: offer to book/reimburse travel (flights, lodging, parking)
[ ] Confirm travel_from city, flight times, hotel, arrival/departure dates
[ ] set needs_travel = false once booked

STEP 5: MOVE TO CONFIRMED
[ ] Contract signed + fees logged in budget_entries
[ ] All deliverables collected (bio, photo, rider on file)
[ ] Travel booked (if applicable)
[ ] Move artist to "confirmed" status in Kanban
[ ] Post social: "[Artist] joining ZAOstock Oct 3! Bio: [truncated]" (recast by Zaal)

STEP 6: SET ORDER
[ ] After 8+ artists confirmed, run energy curve optimization
[ ] Propose set order to DCoop; finalize by Aug 25
[ ] Update set_order column; post draft schedule to /stock/program

Timeline: First contact (May 1) → Confirmed + booked (Aug 15) = ~3.5 months per artist
```

#### Checklist 5: Day-of Runbook (Oct 3, 6am-11pm)
```
ZAOstock Oct 3 Runbook (Day-of)

PRE-EVENT (Oct 2, 4pm)
[ ] Weather check (OpenWeather API + Weather.gov). Contingency ready if >60% chance rain?
[ ] All 20 volunteers checked in (SMS + dashboard confirmation)
[ ] All 10 artists confirmed arrival (call or SMS check, 6pm Oct 2)
[ ] Incident response team briefed (Zaal, Tyler, Candy, 1 backup)
[ ] Wristbands + signage printed and at venue
[ ] Backup power, sound, internet tested

DAWN (6-8am, Oct 3)
[ ] Setup crew checks in (volunteer gate)
[ ] Stage erected + sound check + lighting test
[ ] Incident response table staffed (Zaal, Tyler, Candy)
[ ] Medical kit + safety equipment on-site
[ ] Gate opens 8am; first volunteer shift begins

MORNING (8am-12pm)
[ ] Artist arrivals logged (check_in_time). SMS to any not arrived by 10am.
[ ] Run-of-show timeline live on dashboard (set times, artists in order)
[ ] First 3 artists on deck (stage setup per rider, sound check, intro)
[ ] Incident log open (voice or text logging available; Zaal triages)
[ ] Media capture (photographer + videographer + social poster online)

MIDDAY (12pm-6pm)
[ ] Continuous artist flow (set → set with 2-3 min break between)
[ ] Volunteer shift rotations (Block 1 → Block 2 transitions smooth)
[ ] Food/water service running smoothly
[ ] Incident response handles real-time issues (artist no-show? → backup? Sound fail? → IT on it)
[ ] Social media updates (photos, highlights, quotes from crowd)

EVENING (6pm-11pm)
[ ] Last 2 artists + cypher finale
[ ] Winding down vendor booths + volunteering transitions to teardown crew
[ ] Incident log finalized (did anything break? lessons for Year 2?)
[ ] Photo + video delivery to cloud (Supabase Storage)
[ ] Volunteer thank-yous given at gate

POST-EVENT (11pm+)
[ ] Teardown complete; venue cleaned; equipment secured
[ ] Incident log submitted to Zaal
[ ] Attendance count + rough analytics logged
[ ] Photos + video backed up
[ ] Team debriefed (async via Telegram next day AM)

Success Criteria:
- 0 P0 incidents (artist no-show, safety, vendor fail)
- All 10 artists completed their sets on time
- Zero volunteer no-shows (all 20 showed up; covered shifts)
- 100+ photos captured; video clips usable
- Positive incident feedback (no major complaints; 1-2 minor hiccups is normal)
```

#### Checklist 6: Handling an Incident (5-Whys Template)
[See Section 6 above — repeat the template]

#### Checklist 7: Post-Event Follow-up (Oct 4-31)
```
Post-Event Follow-up & Retention
Timeline: Oct 4 (day after) → Oct 31 (4 weeks out)

WEEK 1 (Oct 4-11)
[ ] Send photo gallery + video highlights to all volunteers, artists, sponsors (link shared on Farcaster)
[ ] Post event recap on @ZAOfestivals (photos, stats, shout-outs)
[ ] Thank-you posts for each sponsor (quote-cast from main ZAO account)
[ ] Thank-you emails to all artists (personalized, mention performance moment)
[ ] Thank-you gifts sent to volunteers (TBD if budget allows; at least email recognition)

WEEK 2 (Oct 12-18)
[ ] Sponsor ROI reports sent (attendance #, brand mentions, recast engagement, media placements)
[ ] NPS survey sent to artists + sponsors (Tally form, 2-min survey)
[ ] Media produced: highlight reel cut + posted to YouTube
[ ] Internally: team retro (async doc or 30-min call). What worked? What didn't? Ideas for Year 2.

WEEK 3-4 (Oct 19-31)
[ ] Pay remaining artist fees + volunteer appreciation bonuses (if budget allows)
[ ] Archive all photos/video/media to long-term storage (Dropbox or external drive backup)
[ ] Year 2 planning begins (doc 270 review, team asks "shall we do this again?")
[ ] Lessons doc written (things that worked well, things to improve)

Success Criteria:
- 100% sponsors receive ROI report
- NPS >50 (artists + sponsors feedback)
- 80%+ of volunteers say "yes" to repeat next year
- Lessons doc informs Year 2 planning
```

**Dashboard integration:** "Checklists" tab (or link from each related tab) shows checklist template + ability to create instance (check off boxes, date completed).

**Cadence:** Referenced as needed (weekly meeting every Tue; sponsor closing ad-hoc; day-of Oct 3; incident immediate; post-event starting Oct 4).

**Owner:** Process owner (Zaal for most); each lead for their checklist.

---

### 12. Kaizen Loops (Weekly Async Retro)

**Kaizen = "change for the better" (Toyota's continuous improvement culture).**

Every Thu 6pm EST (async Telegram prompt). Team replies within 24h. Zaal reviews Fri AM and captures learnings.

**Prompt (sent via Telegram):**
```
[THURSDAY KAIZEN - CONTINUOUS IMPROVEMENT]

What's one thing we got right this week? And one experiment we should try next week?

Format:
/kaizen
"WORKED: [brief win]
BLOCKED: [one problem]
EXPERIMENT: [one thing to try next week]"
```

**Expected outputs:** 12-17 replies (team + advisors).

**Aggregated Kaizen Report (generated Fri AM by bot, sent to Zaal):**
```
KAIZEN DIGEST — Friday Apr 26

WHAT WORKED (Wins This Week)
- Sponsor outreach: Bangor Savings committed quickly (clear pitch + personal connection worked)
- Artist discovery: ZAOCHELLA roster pull gave us 8 instant credible candidates
- Volunteer apply form: 5 applications in first week; quality bios

WHAT BLOCKED (Problems This Week)
- Timeline approval: Run-of-show still under review (Zaal bottleneck; need decision)
- Contact logging: 3 sponsors contacted but no follow-up log (process unclear)
- Budget spreadsheet: Tyler needs better visibility into committed vs projected (manual pull is tedious)

EXPERIMENTS TO TRY NEXT WEEK
- Zaal: Pick 1 hour Tue to finalize run-of-show schedule (unblock artists)
- Contact logging: Create Slack shortcut for quick contact-log entry (less friction)
- Budget: Auto-sync budget entries from Supabase to Google Sheets (reduce manual work)

MOMENTUM
- Sponsor pace: 1.5 / week (target 1; AHEAD)
- Artist discovery: 8 candidates in 1 week (solid start)
- Volunteer applications: 5 (target 0.9/week at this stage; AHEAD)

NEXT WEEK PRIORITIES
- Finalize run-of-show (Zaal)
- First artist outreach calls (DCoop)
- Budget spreadsheet improvement (Engineer)
```

**Dashboard integration:** "Learnings & Kaizen" tab auto-displays weekly aggregates + searchable by topic. Serves as institutional memory for Year 2.

**Cadence:** Every Thu 6pm, aggregated Fri AM.

**Owner:** Telegram bot (prompt); Zaal (aggregates).

**Success metric:** 3+ experiments tried/landed per month; team morale stays high (no burnout signals in kaizen replies).

---

## Part 1 Summary: The Dashboard "Home" Tab

Everything above → One unified Home tab showing:

```
┌─────────────────────────────────────────────┐
│ ZAOstock Command Center                     │
│ 162 Days Out (Apr 24 → Oct 3)              │
├─────────────────────────────────────────────┤
│ [ANDON CORD] 🟢 ALL CLEAR                   │
│   Sponsors on pace · Artists ahead · No blockers
├─────────────────────────────────────────────┤
│ TAKT TRACKING                               │
│ Sponsors: $2,450/$15,000 (16% of target)   │
│ Artists: 0/10 confirmed (on track)         │
│ Volunteers: 0/20 confirmed (too early)     │
├─────────────────────────────────────────────┤
│ CONTROL CHARTS                              │
│ Sponsor $/week: ▁▁▁▂▄ (0 so far)           │
│ Artist velocity: ▁▂▃▄▅ (0 so far)          │
│ Volunteer signups: ▁▃▅▇█ (5 this week)     │
│ Budget variance: ▂▂▂▂▂ (stable)            │
│ Todo burndown: █████ (70% done)            │
├─────────────────────────────────────────────┤
│ MY WIP                                      │
│ Zaal: 2/8 todos (on track)                 │
│ Candy: 1/5 todos (on track)                │
│ [More team members...]                     │
├─────────────────────────────────────────────┤
│ NEXT 3 PRIORITIES                           │
│ 1. Finish run-of-show draft (Zaal, due Wed)│
│ 2. Artist outreach calls (DCoop, due Fri)  │
│ 3. Volunteer matching (Eng, due Sun)       │
├─────────────────────────────────────────────┤
│ THIS WEEK'S KAIZEN                          │
│ Experiment: Auto-sync budget sheet (Engineer)
│                                             │
└─────────────────────────────────────────────┘
```

---

## PART 2: ZAOSTOCK TEAM TELEGRAM BOT (HERMES-POWERED)

### Part 2 Key Decisions Table

| Decision | Recommendation | Owner | Cost | Risk |
|---|---|---|---|---|
| **Bot LLM** | USE **Hermes + Qwen3.6-27B** locally on VPS (see doc 483). Fallback to Claude Haiku for hard reasoning. | Zaal + Eng | $0 (VPS CPU already paid) | Hermes lies differently than Claude; always pair with human review for critical decisions |
| **Language** | USE TypeScript (Node 22). Consistent with ZAO OS codebase. | Eng | $0 | Team can contribute to bot code |
| **Telegram library** | USE `grammy` (typed, lightweight, actively maintained). | Eng | 0 | grammy is 1 dependency; minimal surface area |
| **Host location** | USE Hostinger VPS 1 (31.97.148.88, already running ZOE + OpenClaw). New Docker container. | Ops | $0 incremental | VPS CPU limited; start with local Hermes only, scale fallback to Claude if needed |
| **Memory layer** | USE honcho (per doc 483) for per-user conversation history. Store in Supabase (`bot_conversations` table). | Eng | $0 | honcho is simple; can be replaced later with more sophisticated memory |
| **Voice transcription** | USE `whisper.cpp` locally (free, offline). For pilot phase (week 1-2 with Zaal only), manual transcription acceptable. | Eng | $0 early; $2-5 Haiku if automatic | Pilot shows value; upgrade to automatic transcription in Phase 2 |
| **Auth flow** | USE 4-character code verification. First-time user DMs bot → bot asks for code → verifies against `stock_team_members` → writes `telegram_id` → locked. | Eng | $0 | Code collision risk low; 26^4 = 456k combos; 17 users = negligible |
| **Privacy** | USE sender-scoped queries (all Supabase reads filtered by actor_id or role check). No teammate contact logs shared outside their own. | Eng | $0 (query design) | Private data exposure = CRITICAL risk; rigorous scoping before ship |
| **Rate limiting** | USE 20 commands/min per user (Telegram API built-in + custom rate limiter). | Eng | $0 | Prevents abuse; allows normal workflow |
| **Webhook vs polling** | USE Telegram webhook (cleaner, real-time) if we host a public IP. Otherwise polling every 5sec (cost: CPU, acceptable for 17 users). | Eng | $0 | Webhook requires stable public IP or Cloudflare tunnel; polling is fallback |
| **Rollout phase 1** | SHIP TO ZAAL ONLY (week of Apr 24-28). Prove value before onboarding team. | Zaal | $0 | Early feedback loop; adjust UX based on Zaal's usage |
| **Rollout phase 2** | ONBOARD Candy + DCoop + Tyler (3 power users, May 1-7). | Zaal | $0 | Fast feedback; smaller group; reduces confusion |
| **Rollout phase 3** | ALL 17 teammates (May 15 onward). | Zaal | $0 | By then, bot is stable; clear docs + short onboarding |

---

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Telegram Bot Layer                                          │
├─────────────────────────────────────────────────────────────┤
│ @ZAOstockTeamBot                                            │
│ (registered via @BotFather)                                │
│                                                              │
│ Webhook (public IP + /api/stock/team/bot-webhook) or       │
│ Polling (every 5sec, local process)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Telegram Bot API (grammy)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Logic Layer (Node.js 22, TypeScript)                   │
├─────────────────────────────────────────────────────────────┤
│ Input routing:                                              │
│   - Slash commands (/status, /mytodos, /gemba, etc.)      │
│   - Natural language ("I called Bangor Savings Bank")      │
│   - Voice notes (accept, save to Storage, transcribe)      │
│   - Message reactions (quick replies)                      │
│                                                              │
│ LLM dispatcher:                                             │
│   - Intent detection (Hermes on local)                     │
│   - Tool routing (whitelist + arg validation)             │
│   - Fallback to Claude Haiku for complex reasoning        │
│   - Response generation                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    Hermes/Qwen3 │ Claude Haiku│ Supabase REST
     (local)     │     (API)    │
          │       │            │
          ▼       ▼            ▼
┌──────────────────────────────────────────┐
│ Data + Memory Layer                      │
├──────────────────────────────────────────┤
│ Supabase PostgreSQL + honcho memory      │
│ Tables:                                  │
│   - stock_team_members (+ telegram_id)  │
│   - stock_activity_log (bot writes)     │
│   - stock_contact_log (from bot input)  │
│   - stock_todos, stock_sponsors, etc.   │
│   - bot_conversations (honcho memory)   │
│   - bot_rate_limits (20 commands/min)   │
└──────────────────────────────────────────┘
```

---

### V1 Scope (Ship Week of Apr 24-28, Zaal Only)

**Single goal: Prove that async team comms via Telegram reduce email friction + keep Zaal looped into team activity.**

#### Slash Commands (Read-Only MVP)

1. **`/status`** — snapshot of this week
   - Input: (none; auto-scoped to user's team)
   - Output: 
     ```
     ZAOstock Status (Week of Apr 21)
     
     Sponsors: 3 contacted, 1 in talks, $0 committed
     Artists: 8 wishlist, 0 contacted
     Volunteers: 0 applied
     
     Next 3 overdue:
     • Call Bangor Savings VP (contacted Apr 21, no reply)
     • Run-of-show approval (due Apr 24 for artist sets)
     • Volunteer form QA (due Apr 26)
     ```
   - Hermes route (simple query formatting)

2. **`/mytodos`** — todos assigned to sender
   - Input: (none; auto-filtered to user)
   - Output:
     ```
     Your Todos (Zaal)
     
     In Progress (2/8):
     ☐ Run-of-show draft (due Wed Apr 24)
     ☐ Sponsor outreach follow-ups (due Fri Apr 26)
     
     To Do (6):
     ☐ Artist confirmation calls (due Fri Apr 26)
     [...]
     ```
   - Hermes route (query + format)

3. **`/mycontributions`** — activity log for sender (last 7 days)
   - Input: (none)
   - Output:
     ```
     Your Week (Zaal)
     
     Mon Apr 21: Contacted Bangor Savings Bank (sponsor)
     Tue Apr 22: Approved run-of-show v1 (timeline)
     Wed Apr 23: Onboarded 2 new volunteers (volunteers)
     ```
   - Hermes route (query + format)

4. **`/gemba`** — daily standup prompt
   - Input: (none; triggers form)
   - Output:
     ```
     Gemba Walk — What moved? What's blocked?
     
     Reply with:
     "What moved: [brief update]
      What's blocked: [any issues?]"
     ```
   - Stores reply in stock_activity_log (action='gemba_reply')
   - Hermes route (just prompt; accept free-form text)

5. **`/agenda next`** — preview next Tuesday meeting
   - Input: (none)
   - Output:
     ```
     Next Meeting: Tue Apr 28, 10am EST
     
     Likely topics:
     • Run-of-show final approval
     • Sponsor finders fee (Finance team vote)
     • Shirt design + budget
     
     Suggest a topic: reply "AGENDA: [topic]"
     ```
   - Hermes route (pull from meeting_notes table draft + Andon alerts)

6. **`/note <text>`** — add line to next meeting notes
   - Input: text after command (e.g., "/note We should consider live art installation")
   - Output:
     ```
     Note added to Tue Apr 28 meeting:
     "[Zaal] We should consider live art installation"
     ```
   - Stores in stock_meeting_notes.notes (append)
   - Hermes route (validation + DB write)

7. **`/help`** — list all commands
   - Input: (none)
   - Output: Full command list + brief description
   - Hermes route (static template)

#### Natural Language (MVP: Contact Log Entry)

User sends: *"I just had a call with Sarah at Bangor Savings Bank. They want to sponsor the main stage, $3K, but need a logo mockup sent by Friday."*

Bot flow:
1. **Intent detection** (Hermes): "This is a sponsor contact log entry"
2. **Extraction** (Hermes): sponsor_name="Bangor Savings Bank", contact_name="Sarah", action="call", details="Sponsor main stage, $3K, needs logo mockup by Fri"
3. **Clarification** (Hermes asks):
   - "Did they commit to $3K, or is that their budget ceiling?"
   - "Should I log this as 'in_talks' status, or are they still deciding?"
4. **User replies:** "Committed to $3K" and "Yes, mark as in_talks"
5. **Write** (Hermes → Supabase):
   - Create/update stock_sponsors row (status="in_talks", amount_committed=3000, contact_name="Sarah")
   - Create stock_contact_log entry (action="call", notes="Logo mockup needed by Friday")
   - Create stock_activity_log (action='bot_write', field_changed='status', old_value='lead', new_value='in_talks')
6. **Respond:** "Sponsor updated! Bangor Savings Bank now in talks for $3K (main stage). Reminder: logo mockup due Fri."

**Hermes vs Claude decision point:** If the user's message is ambiguous (e.g., "They want money"), use Claude Haiku to disambiguate. Otherwise, Hermes handles the call.

#### Voice Notes (Stub for V1)

User sends voice note (10 sec): *"Just confirmed Artist X for Oct 3, they'll bring a guitarist, travel from Boston, costs $300."*

V1 flow:
1. Bot saves voice note to Supabase Storage (`stock/voice-notes/[date]-[user].m4a`)
2. Bot replies: "Voice note saved. Transcript coming soon — for now, can you paste the text?"
3. User pastes: "Artist X confirmed, guitarist backup, Boston travel, $300 fee"
4. Bot treats it like natural language above (same Hermes extraction flow)

(In Phase 2, integrate whisper.cpp for automatic transcription.)

---

### Phase 1 Rollout (Apr 24-28, Zaal Only)

#### Step 1: Register bot with Telegram (Apr 24, 30 min)
```bash
# Talk to @BotFather on Telegram
/newbot
# Follow prompts, get API token
# Name: "ZAOstock Team Bot" or "Team ZAOstock"
# Handle: @ZAOstockTeamBot

# Save token to env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

#### Step 2: Deploy bot code to VPS (Apr 24-25, 2-3 hours)
```
New files to create:
- src/lib/agents/zaostock-bot/types.ts (types for all commands + natural lang intents)
- src/lib/agents/zaostock-bot/hermes-client.ts (Hermes/Qwen3.6 local API client)
- src/lib/agents/zaostock-bot/claude-fallback.ts (Claude Haiku fallback)
- src/lib/agents/zaostock-bot/auth.ts (telegram_id verification, 4-char code lookup)
- src/lib/agents/zaostock-bot/commands.ts (slash command handlers)
- src/lib/agents/zaostock-bot/natural-lang.ts (free-form text parsing + Hermes dispatch)
- src/lib/agents/zaostock-bot/db-writers.ts (Supabase writes, activity log)
- src/app/api/stock/team/bot-webhook/route.ts (Telegram webhook endpoint, or polling fallback)
- infra/docker/zaostock-bot.Dockerfile (build + run on VPS)

Modifications:
- scripts/stock-schema.sql: ADD stock_team_members.telegram_id (BIGINT UNIQUE, nullable)
- scripts/stock-schema.sql: ADD bot_conversations table (honcho memory)
- scripts/stock-schema.sql: ADD bot_rate_limits table (20 cmd/min tracking)
```

#### Step 3: Zaal adds themselves to bot (Apr 24-25, 5 min)
```
1. Start chat with @ZAOstockTeamBot
2. Bot: "Hi Zaal! First-time setup. What's your 4-letter dashboard code?"
3. Zaal: "ZAAL" (or whatever code is in the system)
4. Bot verifies in stock_team_members.name="Zaal" + sets telegram_id = [Zaal's TG user ID]
5. Bot: "Verified! You're all set. Try /status or /help"
```

#### Step 4: Zaal tests for 3 days (Apr 24-27)
- `/status` daily → see if accuracy improves as team updates dashboard
- `/mytodos` → verify filter works
- `/gemba` → reply daily, see if gemba digest makes sense Fri AM
- Free-form: "I called Bangor Savings" → verify contact log entry works

#### Step 5: Gather feedback (Apr 27-28)
- Async doc: "What worked with the bot? What's confusing? Missing feature?"
- Decision: ship to team (if Zaal says "yes") or iterate (if "needs work")

---

### Phase 2 Rollout (May 1-15, Zaal → Candy + DCoop + Tyler)

- Onboard 3 power users (same 4-char code flow)
- Gather feedback (daily)
- Resolve bugs / UX friction
- Solidify natural language intent detection (Candy's contact-logging style differs from Zaal's)

### Phase 3 Rollout (May 15 onward, All 17 teammates)

- Broadcast: "Bot available for all. DM for your code."
- Standardized onboarding doc (1-page)
- Weekly Telegram commands in team meeting ("Use /gemba on Thursdays")

---

### Safety + Privacy Guardrails

**Secret Hygiene (per `.claude/rules/secret-hygiene.md`):**

1. **No API keys in model context.** All Hermes prompts are deterministic dispatchers: "If user says X, call function Y with arg Z." No raw secret access.

2. **Whitelisted tool dispatcher:**
   ```typescript
   const allowedTools = {
     'read_my_todos': { table: 'stock_todos', scope: 'owner_id=?', user: getCurrentUser() },
     'read_my_contact_log': { table: 'stock_contact_log', scope: 'actor_id=?', user: getCurrentUser() },
     'write_sponsor': { table: 'stock_sponsors', requires_role: 'member_or_above' },
     // ... no direct SQL; only whitelisted functions
   };
   ```

3. **Rate limiting:** 20 commands/min per user (Telegram built-in + custom), prevents bot abuse.

4. **All queries scoped by actor:** No teammate sees another's private contact logs unless explicitly shared or they're lead.
   ```typescript
   // WRONG
   SELECT * FROM stock_contact_log;
   
   // RIGHT
   SELECT * FROM stock_contact_log WHERE actor_id = $1;
   ```

5. **Pre-ship audit:** Before Phase 2, scan code for hardcoded secrets, unscoped queries, logging sensitive data.

---

### Cost Estimate (Part 2)

| Item | Cost | Notes |
|---|---|---|
| **Hermes + Qwen3.6-27B** | $0 | Local on existing VPS CPU |
| **Claude Haiku fallback** | $0.50–$1.50 / month | 50-100 fallback calls × $0.003 = $0.15-0.30/week. Expect ~10% of requests to fallback. |
| **Supabase Storage** (voice notes) | $0 incremental | Already using for stock attachments; voice notes are marginal. |
| **Telegram Bot API** | $0 | Free tier, unlimited messages. |
| **whisper.cpp** | $0 | Open-source, runs locally. OR: Claude Haiku Vision ($0.003/image, ~5 voices/week = $0.08/mo). |
| **honcho memory** | $0 | Open-source package. |
| **grammy** | $0 | Open-source Telegram client. |
| **Total incremental** | **~$1-2 / month** | All-in cost for V1-V3 (through Oct). Negligible. |

---

### Risks + Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| **Hermes goes rogue on tool calls** (calls wrong function, passes bad args) | CRITICAL | Deterministic dispatcher + whitelist. Hermes only suggests action; human-defined functions execute. Test 10 scenarios pre-ship. |
| **Privacy breach** (bot leaks contact log to wrong teammate) | CRITICAL | All queries scoped by actor_id. Code review before Phase 2. |
| **VPS CPU maxes out** (Hermes inference slow during high load) | MEDIUM | Start with local Hermes only; if latency >10sec for simple queries, route to Claude Haiku fallback. Monitor metrics daily. |
| **Rate limiting too aggressive** (Zaal can't send >20 cmds/min) | LOW | Unlikely in practice (Zaal's natural pace ~5-10 cmds/day). Can raise to 100/min if real bottleneck. |
| **Telegram webhook unreliable** | MEDIUM | Use polling fallback (every 5sec) if webhook fails. Polling adds ~1% CPU cost; acceptable. |
| **Team confused by bot** | MEDIUM | Clear /help + 1-pager onboarding. Only roll out to power users first (Zaal, Candy, DCoop). |
| **Bot doesn't understand intent** | MEDIUM | Fallback: ask clarifying questions. Hermes good enough for 80% of inputs; 20% need follow-up. Better than manual work. |

---

### Integration with Part 1 (Six Sigma Ops)

The Telegram bot **powers** several Six Sigma tools:

| Tool | Bot Role |
|---|---|
| **Gemba Walks** | Daily 10am prompt → replies logged to stock_activity_log → Zaal reads digest Fri AM |
| **Kaizen Loops** | Thu 6pm prompt → team replies "WORKED/BLOCKED/EXPERIMENT" → bot aggregates Fri AM |
| **Andon Alerts** | Bot monitors stock_* tables for RED conditions (overdue sponsor, uncovered shift, blocked timeline); pushes alert to Zaal when triggered |
| **Control Charts** | Bot auto-calculates weekly metrics ($ committed, artist velocity, etc.); renders sparklines for Home tab |
| **Contact Log** | Natural language input → bot writes stock_contact_log + stock_activity_log; time-saver for Zaal |
| **Meeting Notes** | /note command → append to stock_meeting_notes; /agenda → preview next Tue meeting |

---

## SUMMARY: ONE-WEEK ROLLOUT PLAN

### Week of Apr 24-28 (This Week)

**Zaal's Three Six Sigma Habits (Immediate, Tomorrow):**
1. **Review Takt targets** (5 min) — understand that $114/day sponsor pace + 0.076 artists/day + 0.127 volunteers/day are the "heartbeats" of the operation
2. **Set up Andon cord** (10 min) — ask Engineer to add the red-light card to Home tab; commit to checking it 8am + 6pm daily
3. **Run first Gemba walk** (10 min) — Telegram bot sends prompt Thu AM; Zaal replies what moved + what's blocked

**Engineer's Three Code Habits (This Week):**
1. **Register Telegram bot** (30 min) — @BotFather, get token, add env var
2. **Build bot V1 skeleton** (6 hours) — stub out slash commands + natural language intent router
3. **Deploy to VPS in Docker** (2 hours) — new container alongside ZOE, test /status + /mytodos with Zaal

**Bot MVP Scope (Ship to Zaal by Apr 28):**
- `/status` — weekly snapshot
- `/mytodos` — todo list (read-only)
- `/gemba` — standup prompt (write to activity log)
- `/help` — command list
- Natural language: one sponsor contact-log entry (end-to-end test)
- Auth: 4-char code verification flow

**Decision for Zaal before we code:**
> **Question: For the natural language parsing (e.g., "I just called Bangor Savings"), should we route to Hermes (local, fast, cheaper) or Claude Haiku (reliable but API calls)?**
>
> - **Hermes route:** Fast local inference (~1-2 sec), zero API cost, but hallucinates (says "in_talks" when user said "not interested")
> - **Claude Haiku route:** Reliable, but ~$0.003 per message, latency ~2-3 sec (Anthropic API round-trip)
>
> **Recommendation:** Hermes for structured extraction (contact name, action, notes), Claude Haiku for ambiguity resolution (user said "they want money" — is that committed or budget?). Hybrid approach.

---

## Part 1 & 2 Integration: The Complete System

**Zaal's dashboard shows:**
1. **Home tab** (Six Sigma tools): Andon cord + takt + control charts + WIP + next priorities + kaizen this week
2. **Activity tab** (from bot): gemba replies + bot writes + team contributions
3. **Incidents & Learnings tab** (from Part 1): all red-light situations + root causes + systemic fixes
4. **Checklists tab** (from Part 1): runbooks for onboarding, weekly meeting, closing sponsor, booking artist, day-of, incident 5-whys, post-event
5. **Team tab** (from Part 1): heijunka load leveling (WIP per person), meeting agenda

**Zaal's Telegram bot provides:**
- Daily standup prompts (gemba, kaizen)
- Morning alerts (Andon red, metrics slipping)
- Natural language intake (contact logs, todos, notes)
- Evening digest (what moved this week, pace vs takt, next week priorities)

**Result:** Async, lean, low-friction team operations. Zaal never alone. Team always in the loop. No daily standups eating time.

---

## ZAO Ecosystem Integration

### New Files to Create

```
research/events/492-zaostock-sixsigma-ops-and-telegram-bot/
  README.md ← YOU ARE HERE
  flows/
    sponsor-flow.md (Value Stream Map detail)
    artist-flow.md (Value Stream Map detail)
    volunteer-flow.md (Value Stream Map detail)
  checklists/
    onboarding.md
    weekly-meeting.md
    close-sponsor.md
    book-artist.md
    day-of-runbook.md
    incident-5whys.md
    post-event-followup.md

src/lib/agents/zaostock-bot/
  types.ts
  hermes-client.ts
  claude-fallback.ts
  auth.ts
  commands.ts
  natural-lang.ts
  db-writers.ts

src/app/api/stock/team/
  bot-webhook/route.ts (new)

infra/docker/
  zaostock-bot.Dockerfile (new)

scripts/
  stock-schema-update-bot.sql (new; adds telegram_id + bot_conversations + bot_rate_limits)
```

### Schema Additions

```sql
-- scripts/stock-schema-update-bot.sql
ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS bot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID REFERENCES stock_team_members(id),
  telegram_user_id BIGINT NOT NULL,
  context JSONB DEFAULT '{}',  -- honcho memory
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bot_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  command_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (telegram_user_id)
);
```

### Dependencies to Add

```json
{
  "dependencies": {
    "grammy": "^1.24.0",
    "zod": "^3.22.0",
    "honcho": "^0.5.0"
  }
}
```

### Env Vars to Add

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_BOT_WEBHOOK_URL=https://zaoos.com/api/stock/team/bot-webhook  (or leave empty for polling)
HERMES_LOCAL_URL=http://localhost:11434/api/generate  (Ollama or llama.cpp endpoint)
```

---

## Open-Source References

**Hermes + Local LLMs:**
- [Nous Research Hermes](https://nousresearch.com/hermes) — instruction-tuned model family
- [r/hermesagent](https://www.reddit.com/r/hermesagent/) — community patterns
- [ollama](https://ollama.ai/) — local model runner (or llama.cpp)
- [honcho](https://honcho.dev/) — memory management for agents

**Telegram:**
- [grammy](https://grammy.dev/) — TypeScript Telegram bot framework
- [Telegram Bot API](https://core.telegram.org/bots/api)

**Lean / Six Sigma:**
- [The Goal — Goldratt](https://www.goodreads.com/book/show/113934.The_Goal) — theory of constraints, takt time
- [Lean Software Development — Poppendieck](https://www.pearson.com/en-us/subject-catalog/p/lean-software-development-an-agile-toolkit/P200000003437) — WIP limits, value stream mapping
- [The Kaizen Way — Laraia/Moody/Hall](https://www.routledge.com/The-Kaizen-Way-One-Company-One-Year-100-000-Ideas/Laraia-Moody-Hall/p/book/9780071372755) — continuous improvement culture
- [Gemba Walks — Liker/Meier](https://www.routledge.com/The-Lean-Manager-A-Novel-of-Lean-Transformation/Liker-Meier/p/book/9780071496032) — walking the floor

**Dashboards & Visual Management:**
- [Andon systems overview — LSSSimplified](https://lsssimplified.com/lean-six-sigma-glossary/andon-board/)
- [Kanban WIP limits — Kanban.University](https://kanban.university)
- [Value Stream Mapping — ASQ](https://asq.org/quality-resources/value-stream-mapping)

**Festival Operations:**
- [Birding Man Festival (doc 418)](../418-birding-man-festival-analysis/) — peer event analysis
- [ZAOstock planning (doc 270)](../270-zao-stock-planning/) — original timeline + scope

---

## Cost Verification (Against minimal-budget-stack.md)

| Component | Cost | Allocation |
|---|---|---|
| **Hermes + Qwen3.6-27B** | $0 | Local inference on existing VPS CPU (Hostinger KVM 2 already paid) |
| **Claude Haiku fallback** | ~$1-2 total | 100+ fallback calls × $0.003 = ~$0.30/month through Oct |
| **Telegram Bot API** | $0 | Free, unlimited messages |
| **Supabase** | $0 incremental | Already paying; bot tables are negligible storage |
| **Development time** | N/A | Eng bandwidth (sprint cost, not cash) |
| **TOTAL INCREMENTAL COST** | **~$2** | Fits under $25 AI budget for entire festival |

---

## Success Metrics (How to Know It's Working)

### Part 1 (Six Sigma) Success:
- [ ] Andon cord never stays RED for >1 business day (Zaal acts on alerts)
- [ ] Sponsor velocity stays ≥ takt ($114/day) through Aug 31
- [ ] Artist pipeline hits 10 confirmed by Sep 3 (hard deadline)
- [ ] Zero timeline items blocked (or blocked <48h before resolution)
- [ ] Team WIP stays within heijunka limits (no one overloaded)
- [ ] Kaizen loop generates 2-3 implemented experiments per month
- [ ] Post-event: 100% sponsors get ROI reports; NPS >50 from artists+sponsors

### Part 2 (Telegram Bot) Success:
- [ ] Zaal uses bot 3+ times daily (measured by command count in db)
- [ ] Gemba replies captured from all 17 teammates by May 15 (adoption >90%)
- [ ] 80%+ of contact-log entries come from bot (vs manual entry)
- [ ] Bot fallback rate <20% (Hermes handles 80% of intents without Claude)
- [ ] Zero privacy incidents (queries properly scoped, no cross-user leaks)
- [ ] Day-of Oct 3: zero critical information lost (all incident logs captured)
- [ ] Post-event: team feedback is "bot saved us time" (NPS >60)

---

## Timeline: 162 Days to Oct 3

| Week | Part 1 (Six Sigma) | Part 2 (Bot) | Deliverables |
|---|---|---|---|
| **Week 1 (Apr 24-28)** | Andon cord live, Takt targets published, gemba 1st run | Bot V1 to Zaal only (/status, /mytodos, /gemba, natural-lang stub) | Home tab + Telegram bot MVP |
| **Week 2-3 (May 1-12)** | Sponsor CTQ + Value Stream Maps documented, control charts auto-calc | Phase 2: onboard Candy+DCoop+Tyler, test contact-log natural-lang | Value Stream doc + 3-user bot test |
| **Week 4-6 (May 13-Jun 2)** | Kanban WIP limits enforced, Heijunka load tracking live, Kaizen loop stable | Phase 3: all 17 teammates onboarded, voice note stub ready | 5 out of 7 checklists live |
| **Jun-Aug** | All 12 Six Sigma tools humming, Incidents logged + root causes captured, Kaizen experiments landing weekly | Bot running steady, whisper.cpp for voice transcription, Telegram daily prompts automated | Institutional learning accumulating |
| **Sep 1-3 (Artist Lockdown)** | CTQ dashboard shows real-time status, Andon cord RED if any critical miss | Bot integral to day-of prep (confirm volunteers, artist arrivals, incident logging) | Oct 3 Runbook ready |
| **Oct 3 (Day-of)** | All tools operational, incident log live, decisions made in real-time via bot | Bot active all day, incident triage via Telegram, photos logged on-the-fly | Zero surprise downtime |
| **Oct 4-31 (Post-Event)** | Root causes analyzed, Kaizen experiments from Oct 3 incidents reviewed, Year 2 lessons captured | Post-event follow-up logs via bot, NPS survey captured, bot archived until Year 2 | Year 2 planning informed by data |

---

## Final Note: This Is a Process, Not a Tool

The Six Sigma framework + Telegram bot work together as a **management OS** for distributed, bandwidth-limited teams. The bot is infrastructure; the framework is culture.

**What makes this work:**
1. Zaal checks Andon 2x daily (8am, 6pm) — 5 min each, discipline matters
2. Team replies to gemba + kaizen prompts (Thu 6pm) — takes 2 min, async works
3. Weekly meeting (Tue 10am) — reviews metrics, makes decisions, commits to priorities
4. Incident 5-whys (immediate after incident) — prevents same failure twice
5. Post-event retro (Oct 4+) — captures learning for Year 2

**Without discipline: nothing happens.** With discipline: 17-person team runs like 5-person startup, at cost of $2 in AI spend + 3-4 hours/week of Zaal's time on ops (vs 15+ hours without the system).

---

## Revised Hub Link + Index

Next: Update `/Users/zaalpanthaki/Documents/ZAO OS V1/research/events/_zaostock-hub/README.md` to add:

```
| # | Dimension | Status |
|---|-----------|--------|
| 492 | **[Six Sigma Ops + Team Telegram Bot](../492-zaostock-sixsigma-ops-and-telegram-bot/)** | done |
```

And `/Users/zaalpanthaki/Documents/ZAO OS V1/research/events/README.md` index.

