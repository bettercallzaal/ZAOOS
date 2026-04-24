# 16 — Weather + Logistics Contingency Planning

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Risk mitigation + real-time scenario response + automated planning
> **Payoff:** Zero firefighting mode on Oct 3; 48-hour decision window for rain/heat/cold; insurance compliance automated; team drills ready by Sept 1
> **Core insight:** Maine fall (Oct 3) means 40-50% rain probability, 50-55F overnight, 55-65F daytime. 163 days out is the window to build contingency logic. AI reads forecasts + triggers pre-written response playbooks automatically.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Weather API integration** (OpenWeather free tier → check forecast on Sept 29, Oct 1, Oct 2 at 6am) - if rain >60% confidence 3 days out, trigger "indoor pivot" workflow
2. **Contingency playbook generation** (given 10 risk scenarios, Claude drafts response plan in <5 min) - 1 PDF per scenario, printed + rehearsed by Sept 15
3. **Insurance + refund policy auto-draft** (given budget + attendance estimate, Claude generates liability language + refund terms, Zaal reviews)

Everything else in this doc is "nice to have" — these three reduce risk exposure + give team decision time with 80% payoff.

---

## The problem we're solving

Oct 3, 7am: Zaal wakes up. Forecast shows 70% rain 2-5pm. No contingency plan written. No tent vendor booked. No indoor backup found. 4 hours until volunteers arrive. Decision anxiety mode.

Without AI assist:
- Forecast arrives ad-hoc; no pre-planned decision tree
- Zaal googles "Maine event tents" at 7am; calls 5 vendors, only 2 answer
- Insurance policy language unclear on weather cancellation
- Attendees get refund requests at last minute, damage to brand trust
- Volunteer checklist doesn't include rain gear, tent setup, equipment waterproofing
- Artist riders mention "covered stage" but you haven't verified that yet
- Medical team doesn't know triage plan if stage becomes muddy + slippery

With AI assist:
- Sept 29: weather trigger fires → Claude generates 4-option scenario plan (full pivot, tent backup, partial move, hybrid)
- Zaal picks option + schedules Wallace Events tent ($1200) by email within 2 hours
- Refund policy already auto-drafted based on insurance terms; Zaal approves once, it's locked in
- Volunteer assignments auto-adjusted (rain gear crew, tent crew, etc.)
- Medical emergency protocol includes "muddy terrain injury + evacuation to covered area" response
- Oct 2 evening: mock incident drill (Claude runs scenario, team responds on Slack)
- Oct 3, 2pm: 60% rain hits. Zaal activates contingency plan from dashboard. Everyone knows what to do.

---

## Dimension breakdown

### 1. Weather API + Forecast Monitoring

**What it does:**
Automated weather polling at fixed times (Sept 29 6am, Oct 1 6am, Oct 2 6am ET) checks forecast for Franklin Street Parklet, Ellsworth ME. If any of these thresholds hit, trigger alerts + playbook generation:
- Rain probability >60%
- Temperature <40F or >85F
- Wind >25mph
- Lightning risk (NORAD alert)

**Tools:**
- **OpenWeather free tier** (1000 calls/day) — 5-day forecast, historical accuracy 85%+
- **Tomorrow.io** ($99/mo) — hyper-local (0.1 mile precision), real-time alerts for severe weather
- **Weather.gov API** (free) — NORAD integration, NWS radar data
- **Google Cloud Weather Alerts** (free) — NWS integration, SMS push

**Recommendation:** Start with OpenWeather free tier (Sept 29 + Oct 1 polls). If rain >60%, auto-escalate to Tomorrow.io 7-day refresh starting Oct 1 6pm (real-time updates every 2 hours until Oct 3, 9pm).

**Integration point:** `/stock/team/dashboard` new widget
- Current forecast (Oct 3, 2pm-5pm window)
- Threshold warnings (if rain >60%, show red banner)
- Forecast history (last 48 hours, actual vs. predicted)
- One-click: "Activate contingency: [Tent Backup]" button

**Timeline:**
- **Week of May 19:** OpenWeather API key + polling script
- **Week of June 9:** Integration test with Sept 2025 historical data (backtest the thresholds)
- **Week of August 18:** Tomorrow.io contract signed if budget allows
- **Sept 29 6am:** First poll live

**Cost:** OpenWeather free, Tomorrow.io $99/mo (optional)

---

### 2. Contingency Playbook Generation

**What it does:**
Claude reads your event spec (location, budget, team roster, artist count, expected attendance, insurance limits) + 10 risk scenarios, then generates a printed PDF playbook. Each scenario has:
- Trigger condition (e.g., "rain probability >60% by Oct 1 6pm")
- Decision tree (4-5 options with pros/cons)
- Assigned owner (Zaal or delegated role)
- Step-by-step action plan
- Communication templates (SMS/Slack/email to volunteers/artists/sponsors/attendees)
- Equipment checklists
- Timeline (when to execute each step)

**10 Risk Scenarios to generate:**

1. **Heavy Rain (60-100% chance, >0.5" in 4 hours)**
   - Option A: Full pivot indoors (Ellsworth High School gym, if available)
   - Option B: Tent + stage coverage (Wallace Events 40x60 tent, $1200)
   - Option C: Partial move (stage only indoors, crowd outdoors in rain)
   - Option D: Postpone to Oct 4 (refund policy triggered)
   - Decision owner: Zaal + sponsors by Oct 1, 6pm

2. **Cold Snap (<40F, >20mph wind)**
   - Option A: Keep outdoor, issue blankets + heat lamps
   - Option B: Move to heated venue (Ellsworth Community Center, if available)
   - Option C: Hybrid (performers indoors, crowd under heated tent)
   - Decision owner: Zaal + medical by Oct 2, noon

3. **Hot Day (>85F, no shade)**
   - Option A: Add shade structures (rent 4x pop-ups, $400)
   - Option B: Extend medical tent, add water stations
   - Option C: Shift timing (2pm start instead of 1pm, later finish)
   - Decision owner: Zaal + medical by Sept 28

4. **Artist No-Show (confirmed artist cancels 48 hours before)**
   - Option A: Promote backup artist from waitlist
   - Option B: Extend another artist's set (2 songs → 4 songs)
   - Option C: Farcaster jam session as filler (live interactive)
   - Decision owner: DCoop (music lead) by Oct 2, 4pm

5. **Stage Equipment Failure (sound system, power, lighting)**
   - Option A: Failover to backup sound (rent portable system, $300)
   - Option B: Acoustic set (artist + acoustic guitar/keys)
   - Option C: Postpone that artist's slot 30 min, troubleshoot
   - Decision owner: Candy (stage lead) + tech lead in real-time

6. **Volunteer No-Show (3+ key roles missing on morning of)**
   - Option A: Call volunteer waitlist (pre-register 5 backups by Sept 15)
   - Option B: Delegate tasks to remaining volunteers (compress roles)
   - Option C: Scale event down (reduce crowd capacity, close one vendor gate)
   - Decision owner: Zaal + volunteer lead by 7am Oct 3

7. **Attendance Overload (>150% expected, crowd exceeds 1500 people)**
   - Option A: Close gates, redirect to parking lot overflow viewing
   - Option B: Expand stage sightlines (move crowd back with signage)
   - Option C: Activate second stage / entertainment area
   - Decision owner: Zaal + crowd control lead in real-time, by 12pm

8. **Injury / Medical Emergency (broken bone, cardiac, allergic reaction)**
   - Option A: On-site triage (medical tent, supplies)
   - Option B: Call 911, locate nearest hospital (Eastern Maine Medical Center, ~20 min)
   - Option C: Helicopter rescue (if severe, Penobscot County SO coordinates)
   - Decision owner: Medic + Candy + Zaal in real-time

9. **Sound Permit Revoked (Ellsworth PD noise complaint, permit pulled)**
   - Option A: Move to nearby private venue (land owner permission pre-arranged)
   - Option B: Acoustic-only performance (no PA system)
   - Option C: Postpone to next weekend
   - Decision owner: Zaal + city liaison by 2pm if occurs

10. **Vendor / Sponsor Emergency (sponsor withdraws last-minute, vendor no-show)**
    - Option A: Substitute sponsor branding / signage
    - Option B: Scale back vendor zone, consolidate booths
    - Option C: Crowdfund missing budget gap via Farcaster
    - Decision owner: Zaal + sponsor lead by 24 hours before

**How Claude generates these:**

**Input to Claude:**
```
Event: ZAOstock 2026, Oct 3, Ellsworth ME
Location: Franklin Street Parklet (outdoor, ~10,000 sq ft)
Budget: $15K (verify from doc 270)
Attendance: 500-1000 (target 700)
Team: 17 contributors, 20-25 volunteers on day-of
Insurance: Liability $2M, weather cancellation clause TBD
Weather baseline: 40-65F, 40-60% rain probability for early Oct in Maine

Generate playbook for scenario: Heavy Rain (60-100% chance, >0.5" in 4 hours)
```

**Process:**
1. Claude reads scenario + event context
2. Generates 4-5 decision options with:
   - Pros (cost, feasibility, brand fit)
   - Cons (risk, complexity, attendee experience)
   - Required lead time
   - Estimated cost (if option chosen)
   - Owner assignment + decision deadline
3. Drafts action checklist (step 1-10)
4. Drafts 2-3 SMS/Slack message templates ("Hey volunteers, rain contingency B activated...")
5. Drafts equipment list + vendor contacts (Wallace Events, Ellsworth High, etc.)
6. Outputs as 2-page PDF per scenario

**Tools:**
- **Claude API** (text generation) — 10 scenarios × 2000 tokens each = ~$0.30
- **Weasyprint or Puppeteer** (PDF generation) — free, generates printable playbooks
- **Slack integration** — post each playbook to #contingency channel for team review

**Recommendation:** Generate all 10 playbooks by June 1. Print 2 sets (1 Zaal keeps, 1 posted in command center). Review with team in mock drills every 3 weeks starting July 1.

**Integration point:** `/stock/team/contingency` new dashboard
- Playbook library (all 10 PDFs, searchable by keyword)
- One-click activation: click "Heavy Rain" → system posts scenario to #contingency channel, tags all owners, suggests decision deadline
- Tracker: "Is heavy rain contingency active?" toggle + timestamp + approved by (Zaal)
- Related: weather forecast widget, vendor contact log, team roster with roles

**Timeline:**
- **Week of May 5:** Claude playbook prompt + template
- **Week of May 26:** All 10 playbooks generated + printed
- **Week of June 2:** Team review meeting (2 hours, all 10 scenarios)
- **July 1:** First mock drill (pick 1 scenario, team responds)
- **Aug 1:** Second mock drill (pick 2 scenarios back-to-back)
- **Sept 15:** Final mock drill + full team training

**Cost:** Claude $0.30 (one-time generation)

---

### 3. Insurance + Refund Policy Auto-Draft

**What it does:**
Given your festival budget, insurance policy terms, and attendance estimate, Claude generates:
- Weather cancellation clause (when is event deemed "cancelled"?)
- Full refund policy (if postponed to Oct 4, are all refunds issued? 50%? 0%?)
- Partial weather accommodation clause (if event happens but rain, what's attendees' recourse?)
- Liability waiver language (COVID, acts of God, medical emergencies)
- Volunteer release form (Zaal + volunteers, liability transfer)
- Artist rider amendment (what if stage is partially exposed?)

**Example output:**

```
ZAOSTOCK 2026 WEATHER POLICY

Event: ZAOstock, October 3, 2026, Franklin Street Parklet, Ellsworth, Maine

Weather Cancellation Threshold:
- Event is cancelled if NWS issues Severe Thunderstorm Warning or higher for Hancock County by 12pm Oct 3
- Event is cancelled if rain > 1" accumulated by 3pm Oct 3 (measured on-site)
- Event is postponed to Oct 4 if rain 0.5-1.0" between 1-5pm Oct 3

Refund Policy:
- Full refund if event cancelled per above
- Full refund if event postponed >7 days
- No refund if event happens with light rain (<0.5")
- No refund if event postponed <7 days (rain window Oct 4-10)

Attendee Accommodation:
- If event happens in rain: free ponchos, covered merch booth, indoor restroom tent
- If event happens in cold (<50F): free blankets, heat lamps, hot cider station

Volunteer Release:
"I acknowledge outdoor event subject to weather. I assume risk of rain, cold, wind. I agree to assist with contingency if activated."

Artist Rider Amendment:
"Stage may be partially exposed. Artist responsible for waterproofing instruments. Backup indoor space available but not guaranteed."
```

**How Claude generates this:**

**Input:**
```
Event: ZAOstock 2026
Budget: $15,000
Attendees expected: 700
Insurance: $2M liability policy (weather clause: "Acts of God covered if <$X damage")
Existing refund policy: None (draft new)
Goal: Protect brand, be fair to attendees, stay insurable
```

**Process:**
1. Claude reads insurance terms + budget constraints
2. Generates 3 policy options (Conservative, Balanced, Generous)
3. Recommends "Balanced" option for Zaal's risk profile
4. Drafts full policy text (900-1200 words)
5. Includes sample social media announcement ("Here's our weather policy...")
6. Outputs as one 2-3 page PDF

**Tools:**
- **Claude API** — $0.10 (one-time generation)
- **Slack approval workflow** — Zaal approves policy, auto-posts to community

**Recommendation:** Generate by May 12, Zaal approves by May 19, publish to website/email by June 1. Update once if insurance terms change.

**Integration point:** `/stock/team/settings` → "Policies" tab
- Weather cancellation policy (live, readable)
- Refund policy (live, readable)
- Volunteer release (downloadable PDF)
- Edit + re-approve if forecast changes

**Timeline:**
- **Week of May 5:** Claude policy prompt
- **Week of May 12:** Draft generated, Zaal reviews
- **Week of May 19:** Final, approved, published
- **Sept 28:** Last policy review before Oct 3

**Cost:** Claude $0.10 (one-time)

---

### 4. Real-Time Weather Alerts (SMS Cascade)

**What it does:**
On Sept 30 - Oct 3, weather system polls every 6 hours. If a new threshold is hit (e.g., rain goes from 40% to 75%), system sends SMS alert to Zaal + key owners (Candy stage, medical lead). Example:

```
WEATHER UPDATE: Rain forecast increased to 75% (2-5pm Oct 3). 
Reviewing contingency: Tent Backup.
Activate? Reply "YES TENT" or "HOLD" by 6pm Oct 2.
```

**Tools:**
- **Twilio SMS** ($0.01 per SMS, budget ~20 messages Sept 30 - Oct 3)
- **PagerDuty** (optional, $30/mo) — escalation if Zaal doesn't respond in 2 hours
- **Weather API** (OpenWeather free tier)

**Integration point:** `/stock/team/alerts` new tab
- SMS history (all alerts sent, timestamp, Zaal's response)
- Response tracker ("Tent Backup activated at Oct 2, 6pm by Zaal")

**Timeline:**
- **Week of June 2:** Twilio integration
- **Sept 30 6am:** First poll live

**Cost:** Twilio ~$0.20 (negligible)

---

### 5. Volunteer Rain Gear + Setup Checklist

**What it does:**
If rain contingency triggered, Claude auto-generates a volunteer task list. Example:

```
RAIN CONTINGENCY ACTIVATED: Heavy Rain

Volunteers, your assignments:

TENT CREW (5 people):
- [ ] Unload Wallace Events tent from truck (south parking lot)
- [ ] Set up 40x60 tent over stage by 12pm Oct 3
- [ ] Secure guy-lines to stakes (provided)
- [ ] Test water runoff (hose test 11am)
- [ ] Assign 1 person to monitor tent in rain

RAIN GEAR CREW (3 people):
- [ ] Distribute ponchos at gate (hand out as attendees arrive)
- [ ] Monitor merch booth for leaks
- [ ] Set up heat lamps under tent by 1pm

MEDICAL RAIN RESPONSE (2 people):
- [ ] Move medical tent to covered area (near restrooms)
- [ ] Stock extra blankets, towels
- [ ] Prepare muddy terrain slip-hazard safety brief
```

**Tools:**
- **Claude API** (task generation from scenario) — $0.05
- **Slack bot** — post checklist to #volunteers channel
- **SignUp.com** (existing volunteer tool) — auto-assign shifts based on role

**Integration point:** `/stock/team/volunteers/rain-assignments`
- Checkbox list of tasks per role
- Real-time: team checks off completed tasks on Oct 3

**Timeline:**
- **Week of June 9:** Template created
- **Week of Aug 18:** Test with past event data
- **Sept 30:** Ready to deploy if rain contingency triggered

**Cost:** Claude $0.05 (on-demand)

---

### 6. Tabletop Exercise: AI-Facilitated Scenario Drills

**What it does:**
Claude runs a mock incident scenario in Slack. Example flow:

```
9:00am Oct 3 [DRILL MODE]: Heavy rain starts at 1pm. Forecast now 80% by 3pm.

ZAAL: "Activate contingency?"

SYSTEM: "Heavy Rain contingency costs $1200 tent + 2 hours setup. 
Your decision needed by 12pm (60 min).
Option A: Tent | Option B: Acoustic | Option C: Postpone Oct 4
Reply with A, B, or C."

ZAAL: "A"

SYSTEM: "@candy-stage: Tent is GO. Wallace Events contact: 207-555-1234.
Tent arrives by 11:30am. Your team: set up by 12:30pm.
Confirm ready?"

CANDY: "Confirm. Team assembled."

SYSTEM: "@medical-lead: Muddy terrain protocol activated.
Slippery stage risk. Extra towels in medical tent.
Confirm?"

MEDICAL: "Confirm. Supplies restocked."

[Drill ends, results logged]
```

**Tools:**
- **Slack SDK** — messages + emoji reactions for quick responses
- **Claude API** — generates scenario narration based on team responses
- **Supabase** — logs drill results (response times, decision quality, gaps)

**Integration point:** `/stock/team/drills` dashboard
- Drill calendar (schedule 3 drills: July, Aug, Sept)
- Drill history (past 3 drills, results, feedback)
- One-click: "Run Heavy Rain Drill Now" button

**Timeline:**
- **Week of June 16:** Slack tabletop template
- **Week of July 7:** First drill (Heavy Rain)
- **Week of Aug 4:** Second drill (Artist No-Show + Weather combo)
- **Sept 15:** Final drill (all team members required)

**Cost:** Claude ~$0.10 per drill (3 drills × ~$0.03 each)

---

### 7. Equipment Waterproofing Checklist

**What it does:**
Claude reads artist riders + stage spec, then generates equipment-specific waterproofing checklist. Example:

```
WATERPROOFING CHECKLIST (if rain contingency triggered)

STAGE EQUIPMENT:
- [ ] Sound console: cover with plastic wrap + seal bag
- [ ] Microphone: swap to weatherproof Shure SM58 (already have 2)
- [ ] Cables: tape junction points, run under stage skirt
- [ ] Lights: check IP rating (most need plastic domes, rent 4x IP67 alternatives)
- [ ] Monitor speakers: cover with custom drapes (sourced from supply room)

ARTIST INSTRUMENTS:
- [ ] Ask each artist 48 hours before: can your instrument survive rain?
- [ ] If acoustic: provide hard case + plastic cover
- [ ] If electric: provide weatherproof case for battery amp
- [ ] If drums: cover with plastic, provide drumsticks in waterproof bag

CABLES + POWER:
- [ ] Main power feed: move to weather-safe distribution box (request from rental company)
- [ ] Extension cables: tape junction points, coil excess above ground level
- [ ] Wireless mic frequency: recheck for rain interference (may need channel adjustment)

ATTENDEE COMFORT:
- [ ] Ponchos: order 200 at $0.50 each = $100 (budget already has this)
- [ ] Towels: 50x from supplier, store in volunteer tent
- [ ] Heat lamps: rent 4x LP heaters for merch/seating areas ($200)
```

**Tools:**
- **Claude vision** (read artist riders)
- **Claude text** (generate checklist)

**Integration point:** `/stock/team/equipment` section
- Master equipment list
- Rain version (auto-generated checklist)
- Vendor contacts (replacement rentals)

**Timeline:**
- **Week of Aug 18:** Checklist generated
- **Week of Sept 15:** Reviewed with stage crew
- **Oct 2 5pm:** Final walkthrough before Oct 3

**Cost:** Claude $0.05

---

### 8. Medical Emergency Protocol (Weather-Adjusted)

**What it does:**
Claude reads event spec + existing medical brief, generates weather-specific emergency response. Example:

```
MEDICAL PROTOCOL: Heavy Rain + Cold Scenario

PRIMARY CONCERN: Slippery stage, hypothermia risk, shock from cold

TRIAGE PROTOCOL:
- Slip injury (ankle twist): move to dry medical tent, elevate, ice (wrapped in dry towel)
- Cuts (mud contamination): clean with sterile saline, extra tetanus prep available
- Hypothermia (shivering, confusion): move to heated tent, remove wet clothes, blankets, warm beverage

EVACUATION:
- Stage falls / serious injury: clear stage, call 911 immediately
- Nearest hospital: Eastern Maine Medical Center, Bangor (US-15, 20 min drive)
- Helicopter: call Penobscot County SO (911 gives coordinates)

EQUIPMENT:
- Extra blankets (20x) in medical tent
- Heated pad for cold shock victims
- AED (already on-site, test Oct 2 at 3pm)
- First aid kit + extra bandages for mud-related cuts
- Tetanus update: all volunteers confirmed up-to-date by Sept 20

COMMUNICATION:
- Medical lead: contact Zaal immediately for any serious injury
- Zaal: contact insurance carrier within 2 hours of incident
- Follow-up: incident report filed with insurance by Oct 5
```

**Tools:**
- **Claude API** — generate protocol
- **Slack** — publish to #medical team

**Timeline:**
- **Week of Aug 18:** Protocol generated
- **Week of Sept 15:** Reviewed + approved by medical team
- **Oct 2 5pm:** Final briefing before Oct 3

**Cost:** Claude $0.03

---

## Key Decisions

| Decision | USE | DEFER | SKIP | Notes |
|----------|-----|-------|------|-------|
| Weather API polling (Sept 29 + Oct 1-2) | X | | | P0. Low cost, high value decision window. |
| Contingency playbook generation (10 scenarios) | X | | | P0. De-risks Oct 3, enables drills. |
| Insurance + refund policy auto-draft | X | | | P0. Legal + brand protection. |
| Real-time SMS weather alerts | X | | | P1. Escalation for large changes. |
| Volunteer rain gear checklist | X | | | P1. Operational readiness. |
| Tabletop exercise drills (3x before Oct 3) | X | | | P1. Team confidence. |
| Equipment waterproofing checklist | X | | | P2. Stage crew prep. |
| Medical weather-adjusted protocol | X | | | P2. Safety net. |
| Crowd control muddy terrain plan | | X | | P2. Escalate if rain contingency triggered. |
| Vendor contingency (backup sound, power) | | X | | P2. May not be needed; evaluate June 1. |

---

## Reality check for our scale

**Team:** Zaal (decision-maker), Candy (stage lead), medical lead, volunteer coordinator.

**Playbook generation:** 10 scenarios, 8 hours Claude time, 2 hours printing + review. One-time.

**Drills:** 3 drills × 45 min each (July, Aug, Sept). Slack-based, no travel required.

**Oct 3 execution:** If rain contingency triggered, Zaal clicks "Activate: Tent Backup" at 12pm. SMS goes to stage crew. Tent arrives 11:30am. Setup by 12:30pm. No chaos.

**Risk:** Forecast shows rain but improves by Oct 2 evening. **Mitigation:** Cancel tent 24 hours before if forecast <40%, get full refund. Build into vendor contract now.

---

## Cost summary

| Tool | Cost | Notes |
|------|------|-------|
| Claude playbook generation | $0.30 | 10 scenarios × 2000 tokens |
| Claude policy auto-draft | $0.10 | Insurance + refund policies |
| Claude volunteer checklist | $0.05 | Rain-specific task lists |
| Claude equipment waterproofing | $0.05 | Stage crew prep |
| Claude medical protocol | $0.03 | Weather-adjusted emergency response |
| OpenWeather API | $0 | Free tier polling |
| Tomorrow.io (optional) | $99 | Only if budget allows; skip if OpenWeather sufficient |
| Twilio SMS alerts | $0.20 | ~20 messages Sept 30 - Oct 3 |
| Tent rental contingency | $1200 | Only if rain contingency triggered; not guaranteed cost |
| **Total (baseline)** | **~$0.73** | Playbooks + alerts, no tent (if not needed) |
| **Total (if rain)** | **~$1200.73** | Add tent + setup crew labor |

---

## Timeline to ship

| Week | Owner | Task |
|------|-------|------|
| May 5-11 | Claude | Playbook generation prompt |
| May 12-18 | Claude | Generate all 10 scenarios + 2 PDFs per |
| May 19-25 | Zaal + team | Review playbooks, print, annotate |
| May 26-June 1 | Zaal | Insurance policy auto-draft + review |
| June 2-8 | Zaal + insurance broker | Finalize weather clause + refund policy |
| June 9-15 | Zaal | Plan 3 mock drills (schedule in calendar) |
| July 1 | Team | First tabletop drill (Heavy Rain) |
| Aug 1 | Team | Second drill (combo scenario) |
| Sept 15 | Team | Final drill (all team required) |
| Sept 29 6am | System | OpenWeather polling live |
| Sept 30 - Oct 3 | System | Real-time alerts if thresholds hit |
| Oct 3 7am | Zaal | Final forecast review, activate contingency if needed |

---

## This week (week of Apr 22)

1. Zaal: confirm insurance policy location (email? PDF?)
2. Zaal: identify backup venues for full pivot (Ellsworth High, community center - get contact info)
3. Zaal: get Wallace Events contact (tent vendor, local to Ellsworth)
4. Team: review this doc + doc 270 (budget) for realism check
5. Eng: create `/stock/team/contingency` mockup (simple folder icon in dashboard nav)

---

## Sources

- OpenWeather API: https://openweathermap.org/api
- Tomorrow.io: https://www.tomorrow.io/weather-api/
- Weather.gov API: https://www.weather.gov/wrh/Climate
- Twilio Messaging: https://www.twilio.com/en-us/messaging/sms
- PagerDuty: https://www.pagerduty.com/
- Weasyprint: https://weasyprint.org/
- Claude API: https://anthropic.com/docs/build/api-reference
- Wallace Events (local tent vendor, Ellsworth): https://www.wallaceevents.com
- Eastern Maine Medical Center: https://www.emmc.org/
- Penobscot County Sheriff: 207-945-4636 (emergency dispatch)

---

## Related ZAOstock docs

- [270 — ZAOstock Planning](../270-zao-stock-planning/) — budget, timeline, org structure
- [425 — Dashboard UI: Lean + Kanban Patterns](../425-zaostock-dashboard-ui-lean-kanban-patterns/) — command center design
- [05-dayof-ai.md](05-dayof-ai.md) — incident response (complements this)
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/) — timing sensitive to weather shifts

*Contingency planning buys decision time. The team that plans for rain 163 days out has the luxury of calm on Oct 3.*
