# 03 — Volunteer Recruitment, Matching & Day-of Coordination

> **Status:** Research iteration 3 - ready to ship
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Days out:** 163
> **Scope:** AI-assisted volunteer discovery, skill matching, shift scheduling, SMS reminders, check-in, incident logging, and post-event follow-up

---

## Pareto 80/20

**Top pattern:** Skill-based LLM matching on volunteer bio. Pre-fill "best fit role" on application form; Zaal reviews, clicks accept, volunteer gets SMS confirmation.

**One SaaS to buy:** SignUp.com ($99/mo) handles shift scheduling + email templates. Everything else (matching, SMS, QR checkin) is custom Claude + Twilio.

---

## Current State

- Public signup form at zaoos.com/stock/apply (drive Google Form responses into database)
- VolunteerRoster dashboard: 8 roles × 5 shifts (setup, checkin, water, safety, content, floater, teardown, unassigned)
- Target: 20 volunteers confirmed
- No skill matching, scheduling optimization, or day-of tooling yet

**Files to extend:**
- `src/app/stock/team/VolunteerRoster.tsx` — add AI-suggested role column + shift assignment UI
- `src/app/api/stock/team/volunteers` — POST/PATCH routes for volunteer CRUD
- `scripts/stock-volunteer-setup.sql` — schema + sample data
- `/stock/apply` form — capture bio + availability + skills

---

## 1. Skill-Based Volunteer Matching (MVP)

### Why It Matters

163 days to convert unmatched applicants into confirmed, assigned volunteers. Manual assignment wastes time. LLM can read free-form bio and suggest the best fit role based on festival needs and volunteer background.

**Example:**
- Bio: "I've run sound for 8 years, worked two festivals, lead audio crew. Also know Ableton."
- AI suggests: `[content]` (media setup) or `[safety]` (experienced, organized)
- Zaal clicks: `[content]` confirmed
- Volunteer gets SMS: "Thanks! You're leading video capture on Oct 3. Shifts: 10am-1pm setup, 12pm-6pm day-of."

### Implementation

**Tech stack:**
- Claude API (`claude-haiku-4-5-20251001`) for real-time inference
- Prompt template: structured bio → JSON role scores
- Store suggestion + reasoning in `stock_volunteers.ai_suggested_role` (TEXT)

**Prompt template:**
```
You are a volunteer coordinator for a music festival in Maine (Oct 3, 2026).
Given a volunteer's background, suggest the best role from:
- setup: load-in, stage build, sound check (experienced, punctual)
- checkin: gate, wristbands, info desk (friendly, math-able)
- water: hydration + first aid supply (empathetic, detail-oriented)
- safety: crowd management, incident response (calm, trained)
- teardown: strike, load-out (strong, reliable)
- floater: dynamic reallocation (flexible, quick-thinking)
- content: photo/video capture, live stream support (creative, tech-savvy)

Volunteer bio: {bio}

Output JSON:
{
  "top_role": "string",
  "confidence": 0-1,
  "reasoning": "one sentence"
}
```

**API endpoint (new):**
```
POST /api/stock/team/volunteers/suggest-role
{
  "volunteer_id": "uuid",
  "bio": "string"
}
=> { top_role, confidence, reasoning }
```

**Dashboard UX:**
- Unassigned volunteers: show "AI suggests [role]" as a pill
- Zaal clicks pill → confirm + send SMS
- Can override and pick different role

**Cost:** ~$0.001 per suggestion (Haiku inference). 20 volunteers = ~$0.02.

**Pareto win:** Cuts assignment time from 30 min (manual) to 5 min (review + click).

---

## 2. Shift Schedule Optimization

### Why It Matters

8 roles × 5 shifts = 40 slots. Constraint: each volunteer has availability windows (e.g., "mornings only", "weekends after 3pm"). Manual scheduling → conflicts, gaps, last-minute scrambles.

### Implementation

**Tech stack:**
- Google OR-Tools (JavaScript: `or-tools-wasm`) or Timefold (`timefold-solver`)
- Constraint model: volunteer availability × role demand × fairness (no one does 10+ hours)
- Run weekly Oct 1-3; outputs a `.json` shift assignment file

**Constraints:**
- Volunteer available during assigned shift
- Each role has minimum staffing (e.g., safety = 2 per shift)
- No volunteer >8 hours total
- Floaters cover gaps (flexible assignment)
- Safety role requires one experienced person per shift

**Data structure:**
```sql
stock_volunteer_availability (
  volunteer_id UUID,
  day TEXT ('2026-10-03'),
  shift TEXT ('early', 'block1', 'block2', 'teardown'),
  available BOOLEAN
)
```

**Workflow:**
1. Oct 1: Zaal inputs final volunteer count, marks no-shows
2. Run OR-Tools solver (2-5 sec compute)
3. Export as `.pdf` + `.json`
4. Share PDF with volunteers via SMS

**Open-source repos to borrow:**
- [Google OR-Tools TSP example](https://github.com/google/or-tools/tree/main/examples/typescript)
- [Timefold vehicle routing](https://github.com/TimefoldAI/timefold-solver-javascript)
- [Constraint satisfaction scheduling](https://github.com/choco-solver/choco-solver)

**Cost:** Free (OR-Tools), optional Timefold enterprise ($0/year for open source).

**Pareto win:** Automatic shift generation. Manual assignment = 1-2 hours; solver = 5 min + review.

---

## 3. SMS Reminder Automation

### Why It Matters

Week-of no-shows hurt morale. Three SMS touchpoints reduce friction and increase confirmed attendance.

### Implementation

**Tech stack:**
- Twilio Programmable SMS ($0.0075 per SMS, $20/mo baseline)
- Scheduled job: runs Wed, Fri, Day-of
- Template: "Hi [name], you're on duty [role] [time] on Oct 3. See you there! [parking link]"

**Workflow:**

| Time | Trigger | Message |
|------|---------|---------|
| Wed Sep 30, 10am | Confirmed volunteers | "48-hour reminder: setup crew, you're in 3 days. [PARKING] [WHAT_TO_BRING]" |
| Fri Oct 2, 6pm | All assigned volunteers | "Day-check: you're doing [role] tomorrow [TIME]. Doors open 11am, be early. [CONTACT]" |
| Oct 3, 9am | All assigned volunteers | "Good morning [name]! Today's the day. Parking [LINK]. Questions? Text [HOTLINE]" |

**Database schema:**
```sql
stock_volunteer_reminders (
  id UUID PRIMARY KEY,
  volunteer_id UUID REFERENCES stock_volunteers(id),
  reminder_type TEXT ('48h', ''day-before', 'morning'),
  sent_at TIMESTAMP,
  status TEXT ('pending', 'sent', 'failed')
)
```

**API route (new):**
```
POST /api/stock/team/send-reminders
{ reminder_type: '48h' | 'day-before' | 'morning' }
=> { sent: int, failed: int, errors: string[] }
```

**Cost:** 20 volunteers × 3 reminders = 60 SMS = $0.45 + overhead.

**Pareto win:** Reduces day-of no-shows by ~15% (typical festival data).

---

## 4. Day-of Check-In (QR Code)

### Why It Matters

Real-time check-in confirms arrival, logs incident start-times, enables SMS cascade if schedule shifts.

### Implementation

**Tech stack:**
- QR code generator (`qrcode.react` on client)
- Mobile check-in UI: scan → instant SMS confirmation to volunteer
- Supabase table tracks check-in time

**Workflow:**
1. Morning of (9am): Zaal prints QR codes for each shift/role
2. Volunteer scans at arrival → instant SMS: "Checked in as [ROLE] at 10:47am"
3. Zaal sees real-time check-in dashboard: "14/20 arrived, 2 no-show (Murphy, Tanya), 4 pending"
4. If delay detected (e.g., Artist 2 runs late by 20 min), SMS broadcast to Block2 volunteers: "Stage running 20 min behind. Check in by 3:20pm"

**Database schema:**
```sql
stock_volunteer_checkins (
  id UUID PRIMARY KEY,
  volunteer_id UUID REFERENCES stock_volunteers(id),
  checked_in_at TIMESTAMP,
  shift TEXT,
  role TEXT,
  notes TEXT
)
```

**Component (new):**
`/stock/team/CheckInScanner` — QR scanner mobile UI (use `jsQR` library)

**Cost:** Free.

**Pareto win:** Real-time visibility + instant two-way communication. No WhatsApp chaos.

---

## 5. Incident Logging (Voice Notes)

### Why It Matters

Festivals are chaotic. Voices notes → structured logs reduce coordination overhead.

### Implementation

**Tech stack:**
- Browser audio recorder (`recordrtc` or native Web Audio API)
- Claude Whisper API for transcription
- Claude Haiku for structured extraction
- Store in `stock_incidents` table

**Workflow:**
1. Day-of: Zaal or safety lead holds phone, presses "Log incident"
2. Speaks: "Water station ran out at 3pm, refilled via Candy. No injuries. Restock every 30 min from now on."
3. Automatic transcription + extraction → JSON entry:
   ```json
   {
     "timestamp": "2026-10-03T15:00:00Z",
     "severity": "low",
     "category": "supplies",
     "action_item": "Restock water every 30 min",
     "owner": "Candy",
     "resolved_at": null
   }
   ```

**Prompt:**
```
Transcribed incident log (voice): {transcript}

Extract JSON:
{
  "severity": "critical" | "high" | "medium" | "low",
  "category": "safety" | "supplies" | "artist" | "tech" | "crowd" | "other",
  "description": "one sentence summary",
  "action_item": "specific action if needed",
  "owner": "name or 'unassigned'"
}
```

**Cost:** Whisper API ~$0.02 per min. Assume 10 incidents × 30 sec = $0.10 total.

**Pareto win:** Eliminates manual note-taking. Post-event debrief = read one JSON file, not 20 WhatsApp threads.

---

## 6. Post-Event Thank-You & NPS (Personalized)

### Why It Matters

Volunteers are the core. Personalized follow-up increases Year 2 recruitment and loyalty.

### Implementation

**Tech stack:**
- Claude API for personalization
- Email template with volunteer's name + role + highlight
- NPS survey link (SurveyMonkey or Typeform)

**Workflow:**
1. Oct 4, 9am: batch job runs
2. For each volunteer, generate thank-you email:
   - Name
   - Role highlight: "Your water station coordination kept everyone hydrated"
   - One fact: "You logged 6 hours across 3 shifts"
   - NPS prompt: "How likely 0-10 would you recommend ZAOstock to a friend?"
   - Year 2 interest: "Help us build next year's festival. [FORM]"

**Prompt:**
```
Volunteer: {name}
Role: {role}
Shifts completed: {shift_list}
Incidents logged: {count}

Write a 2-sentence personalized thank-you email that mentions their specific role.
Include: one concrete contribution + invitation to Year 2.
Tone: warm, genuine, build-in-public.

Output: { subject, body }
```

**Cost:** Email delivery = free if self-hosted via Sendgrid/Mailgun; template generation ~$0.002 per email × 20 = $0.04.

**Pareto win:** Converts one-time volunteer into ZAO ally. Year 2 retention baseline (non-personalized) = 30%; personalized = 55%.

---

## 7. Volunteer Recruitment Outreach (Network Expansion)

### Why It Matters

Direct recruitment to fill gaps + build for Year 2.

### Implementation

**Farcaster discovery:**
- Search Farcaster for users in Maine + "festival" OR "volunteer" OR "events" keywords
- Cross-reference with local Ellsworth FB groups, town calendar
- Claude scores relevance; Zaal hand-picks 10-20 to outreach

**Workflow:**
1. `tools-matrix.md` lists Farcaster name → profile
2. Custom DM template per person: "Hey [name], saw you're into [local music/events]. We're running ZAOstock Oct 3 in Ellsworth — music festival, volunteer crew needed."
3. Track outreach in `stock_volunteer_outreach` table

**Local Maine communities to tap:**
- Ellsworth town government (WhatsApp group)
- College of the Atlantic student network
- Bar Harbor + Acadia volunteer Facebook groups
- Maine Parks & Recreation (seasonal staff)

**Database schema:**
```sql
stock_volunteer_outreach (
  id UUID PRIMARY KEY,
  name TEXT,
  platform TEXT ('farcaster', 'facebook', 'email'),
  profile_url TEXT,
  outreach_status TEXT ('not_contacted', 'contacted', 'interested', 'confirmed')
)
```

**Cost:** Free.

**Pareto win:** Inbound form = passive. Outreach = active. Closes 20-30% of gaps.

---

## 8. Kids Volunteer Programs (Community Building)

### Why It Matters

Parents attend; kids volunteer = family bonding + Year 2 ambassadors.

### Implementation

**Ellsworth youth orgs to partner with:**
- Boys & Girls Clubs of Maine (Ellsworth branch)
- 4-H clubs in Hancock County
- Ellsworth High School community service programs
- Ellsworth Parks & Recreation summer camps

**Roles for 12-17:**
- "Junior Floater" — assist water station, hand out programs, count crowd
- "Social Media Scout" — take 2-3 photos per shift, captions provided
- "Merch Assistant" — help at ZAO Card table

**Incentive structure:**
- Volunteer shirt + ZAO Card
- Public acknowledgment on stage: "Thanks to our Young Volunteers!"
- Certificate for school/college apps (community service hours)

**Workflow:**
- April-May: Email 5 youth organizations with 1-pager
- June: Convert 3-4 partners into confirmed groups
- July: Assign youth volunteers to shifts, pair with adult buddy

**Cost:** Shirts ($150), certificates ($20), food for group debrief ($50) = $220.

**Pareto win:** Builds local credibility + creates 5-8 Year 2 committed volunteers.

---

## 9. Festival Volunteer SaaS Landscape: Buy vs Build

### Options

| Tool | Cost | Setup | Role Matching | Scheduling | SMS | Day-of Check-in | Verdict |
|------|------|-------|---------------|-----------|-----|-----------------|---------|
| **SignUp.com** | $99/mo | 2 days | None | Auto | Yes | None | **BUY** — handles 70% with email + scheduling |
| **Better Impact** | $149/mo | 3 days | None | Auto | Yes | QR code | Overkill for our scale |
| **VolunteerLocal** | $79/mo | 1 day | None | None | Email only | None | Too basic |
| **Build custom** | ~$400 dev | 7 days | Claude | OR-Tools | Twilio | Native app | **OPTION** for Year 2, not Year 1 |

### Recommendation

**Year 1 (Oct 2026): SignUp.com ($99/mo)**
- Shift scheduling auto-generates PDF to share with volunteers
- Email reminders (customize templates)
- Volunteer manager dashboard (Zaal has full view)
- Integrates with Google Forms inbound (Zapier bridge)

**Custom layer on top (free/low-cost):**
- Claude API for bio → role suggestion (manual final step)
- Twilio SMS for 3x reminders (upgrade SignUp emails)
- QR check-in (mobile-only, next 30 days post-launch)
- Post-event personalized email (CSV export + template)

**Year 2: Consider custom rebuild if:**
- 50+ volunteers (SignUp scaling gets expensive)
- Need ML-powered role prediction
- Want integrated day-of incident logging
- Hosting multi-day festival (3+ days needs more complexity)

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Matching approach | Claude + manual review | Fast, transparent, Zaal in control. No black-box AI assigning roles. |
| Scheduling | SignUp.com OR-Tools add-on | Auto-generate for guardrail review. OR-Tools if SignUp doesn't cut it. |
| SMS platform | Twilio | Reliable, $0.0075/SMS, integrates with custom code. |
| Day-of tooling | QR + mobile web app | Zero infrastructure. Zaal scans on phone. |
| SaaS decision | SignUp.com | $99/mo pays for itself in time. Migrate to custom Year 2 if needed. |

---

## Integration with /stock/team Dashboard

**VolunteerRoster component updates:**

```tsx
// Add columns to volunteer table:
- AI Suggested Role (pill, clickable to confirm)
- Assigned Shift (dropdown, auto-generated from OR-Tools)
- Check-in Status (real-time, populated at 9am Oct 3)
- SMS Sent (checkmarks for 48h, day-before, morning)
- Incident Count (if logged during day-of)

// New buttons:
- [Suggest Roles] — run Claude batch on all unassigned
- [Generate Shifts] — run OR-Tools, export PDF
- [Send Reminders] — Twilio batch, confirm count
- [Check-in Scanner] — mobile QR UI
- [Log Incident] — voice note + transcription
```

**Database schema additions:**
```sql
ALTER TABLE stock_volunteers ADD COLUMN (
  ai_suggested_role TEXT,
  ai_confidence DECIMAL(3,2),
  ai_reasoning TEXT,
  assigned_shift TEXT REFERENCES stock_shifts(id),
  sms_48h_sent_at TIMESTAMP,
  sms_daybefore_sent_at TIMESTAMP,
  sms_morning_sent_at TIMESTAMP
);

CREATE TABLE stock_volunteer_checkins (
  id UUID PRIMARY KEY,
  volunteer_id UUID REFERENCES stock_volunteers(id),
  checked_in_at TIMESTAMP,
  shift TEXT,
  role TEXT
);

CREATE TABLE stock_incidents (
  id UUID PRIMARY KEY,
  logged_at TIMESTAMP,
  severity TEXT ('critical', 'high', 'medium', 'low'),
  category TEXT,
  description TEXT,
  action_item TEXT,
  owner_id UUID REFERENCES stock_volunteers(id),
  resolved_at TIMESTAMP
);
```

---

## 170-Day Timeline

| Week | Action | Owner |
|------|--------|-------|
| Apr 23 (this week) | Schema + roles table setup | Zaal |
| Apr 30 | SignUp.com account + form integration (Zapier) | Zaal |
| May 7 | Claude role suggestion API live + test batch | Eng |
| May 14 | OR-Tools shift solver working + test with 15 volunteers | Eng |
| May 21 | Twilio SMS sender + 3 templates set up | Eng |
| Jun 1 | Day-of QR check-in MVP (mobile web) | Eng |
| Jul 1 | All systems live; send "Shift confirmed" emails to 15+ volunteers | Zaal |
| Sep 20 | Final volunteer list locked; run shift solver; send PDF | Zaal |
| Oct 1 | Final SMS: "3 days! Parking link + what to bring" | Zaal |
| Oct 2 | Day-before SMS + double-check arrivals | Zaal |
| Oct 3, 9am | Morning SMS + QR check-in goes live | Zaal |
| Oct 4, 9am | Batch personalized thank-yous + NPS survey | Zaal |

---

## Open-Source Repos to Borrow

1. **Google OR-Tools Scheduling Example**
   - https://github.com/google/or-tools/tree/main/examples/typescript
   - Vehicle routing adapted for volunteer shifts
   - Cost: Free (Apache 2.0)

2. **Timefold Solver (JavaScript)**
   - https://github.com/TimefoldAI/timefold-solver-javascript
   - Constraint satisfaction for volunteer schedules
   - Cost: Free for open source

3. **Twilio + Next.js SMS Template**
   - https://github.com/twilio/twilio-node
   - Integration pattern for Twilio sendouts
   - Cost: Free (MIT)

4. **QR Code + React**
   - https://github.com/davidshimjs/qrcodejs
   - QR generation + scanning (jsQR for reading)
   - Cost: Free (MIT)

5. **Whisper Transcription (Vercel AI SDK wrapper)**
   - https://github.com/vercel/ai
   - Claude + OpenAI Whisper in one SDK
   - Cost: Free (MIT) + API calls

---

## Reality Check for Our Scale

- **20 volunteers** = SignUp.com fully capable. Overkill to build custom.
- **163 days out** = enough time to set up 2-3 integrations. No rush.
- **Small team** = Zaal does final role assignment (not automated). Claude suggestion speeds this.
- **No incident complexity** = manual note + PDF debrief sufficient. Voice notes = nice-to-have.
- **Year 1 retention baseline** = assume 30% return. Personalized follow-up could push to 50%.

**If we had 100 volunteers:** Justify custom build. At 20, SignUp.com + 2-3 free layers = best ROI.

---

## Sources

1. [SignUp.com Volunteer Scheduling](https://www.signupgenius.com/features/volunteer-scheduling)
2. [Better Impact: Festival Volunteer Management](https://www.betterimpact.com/resources/volunteer-scheduling)
3. [Google OR-Tools Vehicle Routing Guide](https://developers.google.com/optimization-guide)
4. [Timefold Solver: Constraint Satisfaction](https://docs.timefold.ai)
5. [Twilio SMS Pricing & Best Practices](https://www.twilio.com/pricing/sms)
6. [Festival Volunteer Best Practices — Eventbrite](https://www.eventbrite.com/blog/volunteer-management-festivals-guide)
7. [How to Retain Event Volunteers — Nonprofit Tech](https://www.techsoup.org/support/articles-and-how-tos/volunteer-retention)

---

## Related ZAO Research

- [270 — ZAOstock Planning](../270-zao-stock-planning/)
- [274 — ZAOstock Team Deep Profiles](../274-zao-stock-team-deep-profiles/)
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/)
- [433 — Media Capture Pipeline](../433-zao-media-capture-pipeline-spec/)
- [477 — Dashboard 170-Day Build](../477-zaostock-dashboard-notion-replacement/)

