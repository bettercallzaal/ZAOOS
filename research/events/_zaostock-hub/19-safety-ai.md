# 19 — Safety + Emergency Prep

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Risk assessment, incident response, crowd safety, emergency protocols, volunteer training
> **Payoff:** Zero fatalities, zero preventable injuries, legal liability minimized, attendee confidence (safe space for marginalized community)
> **Core insight:** At 200-500 attendees outdoors in Maine October, seven categories of risk dominate: weather (cold, rain), crowd (bottlenecks, alcohol), electrical (stage power), medical (first aid access), fire (propane cooking), minor protection (if under-18), and incident tracking (learn post-event). Claude automates risk assessment, incident triage, and post-event debrief analysis.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Pre-event risk assessment** (Claude runs through 20 common festival risks; outputs risk register + mitigation checklist)
2. **Emergency contact database + incident response chain** (who to call for what; escalation rules; dashboard incident logger)
3. **Volunteer safety briefing + day-of checklist** (printed 1-page quick-ref for all 40+ volunteers; Zaal-led 15-min training Sep 25)

Everything else (AED placement, crowd counting, weather monitoring, post-event debrief) amplifies these three and makes recovery faster. These three alone prevent 80% of predictable incidents.

---

## Pre-Event Risk Assessment (Claude)

### Phase: May 20 - Jun 10 (risk identification + mitigation plan)

**What Claude does:**

Claude analyzes ZAOstock context (outdoor, 200-500 attendees, Ellsworth ME, Oct 3, Franklin Street Parklet, music festival, 17 staff, no dedicated safety lead yet) and outputs:

1. **Risk register:** 20 identified risks with probability (high/medium/low) + impact (critical/major/minor)
2. **Mitigation checklist:** 1 action per risk; owner assigned; timeline
3. **Escalation decision tree:** "If [scenario] happens, call [person]; they call [agency]"

**Sample Claude-generated risk register:**

```
RISK: Alcohol service without bartender certification
Probability: Medium (likely if wine/beer sponsor involved)
Impact: Critical (liability for drunk attendees, liability for minors)
Mitigation: 
  - Confirm all bartenders have TIPS/ABC certification by Sep 15
  - Wristband system for 21+ (enforced ID check)
  - No unsupervised alcohol supply; 1 bartender per 100 attendees
  - Signage: "If you're under 21, we have mocktails"
Owner: Zaal
Timeline: Sep 1 (contact bartender agency)

---

RISK: Lightning strike during performance
Probability: Low (Oct 3, 10% chance of thunderstorm in Ellsworth)
Impact: Critical (death, cardiac arrest)
Mitigation:
  - Monitor weather.gov every 6 hours starting Sep 25
  - If lightning risk rises: pause outdoor performance; move to covered area
  - First-aid station stocked with AED
  - Announce in pre-event email: "We will pause for safety if lightning detected"
Owner: Zaal / weather monitor
Timeline: Sep 25 (weather protocol drafted) + Oct 3 (monitor live)

---

RISK: Crowd crush at narrow entry/exit
Probability: Medium (Franklin St Parklet is semi-enclosed)
Impact: Critical (trampling, panic, injury)
Mitigation:
  - Venue walkthrough (Jun 3): measure entry/exit widths; identify bottlenecks
  - If any exit < 4 feet, add temporary ramp/path
  - Max occupancy sign: "400 people max for safety"
  - 2 volunteers stationed at each exit during peak hours (5pm-8pm)
  - Announce evacuation plan at 2pm and 6pm
Owner: Candy (venue logistics)
Timeline: Jun 3 (measurements) + Jul 1 (signage ordered)

...19 more risks (fire, electrical, medical, minor protection, lost attendees, etc.)
```

**Implementation workflow:**
1. Zaal creates `/stock/safety/risk-register` doc (Google Sheets or notion)
2. Claude auto-generates risk register in markdown
3. Team reviews; Zaal assigns owners; timeline added
4. Weekly check-in: "How many risks mitigated this week?"

**Cost:** Claude API + tool use (risk assessment function) ~15 min = **$0.10**

---

## Emergency Contact Database

### Phase: Jun 10 - Jun 20 (research + setup); ongoing updates

**What we need:** A single source of truth for "who do I call if X happens?"

**Spreadsheet structure** (`/stock/safety/contacts`):

| Scenario | Contact Name | Role/Agency | Phone | Email | Notes |
|----------|--------------|------------|-------|-------|-------|
| Medical emergency (ambulance) | Ellsworth Fire Dept | Dispatch | 911 | — | Also sends paramedics |
| Serious injury (trauma) | Eastern Maine Medical Center | Trauma center | 911 | — | 15 min drive from venue |
| Electrical emergency | Ellsworth Public Works | Line crew | 207-669-6600 | — | For downed power lines |
| Propane leak | Ellsworth Fire (HAZMAT) | HAZMAT response | 911 | — | Also check: propane vendor emergency line |
| Weather severe (tornado) | National Weather Service | Forecast + warning | 207-688-3210 | — | Calls to 911 if tornado warning |
| Lost child | Ellsworth Police Dept | Dispatch | 911 | — | Child safety protocol |
| Assault/violence | Ellsworth Police Dept | Patrol | 911 | — | Officer on-site if concern pre-event |
| Alcohol-related emergency | Fire Dept (intoxicated) | Paramedics | 911 | — | Assess if medical or police follow-up |
| Crowd panic/crush | Ellsworth Police | Crowd management | 911 | — | Request additional units if 500+ people |
| Heat exhaustion | First aid station lead | On-site medical | [volunteer] | — | Cool down in shade; if worsens, 911 |
| Allergen exposure | First aid station lead | On-site medical | [volunteer] | — | EpiPen ready; 911 if anaphylaxis |
| Generator failure (stage power) | Stage lead | Backup power | [walkie-talkie] | — | Manual shutdown; wait 30 sec; restart |
| Audio/visual malfunction | Tech lead | Troubleshoot | [walkie-talkie] | — | If <2 min, proceed; if >2 min, announce delay |
| Severe weather (snow, freezing rain) | Zaal + venue contact | Event cancellation | [lead numbers] | — | Decision by Oct 1 (48 hours prior) |
| Attendee medical disclosure (allergy, seizure) | Accessibility lead + First aid | Coordination | [venue lead] | — | Review dietary/accessibility log before event |
| Gate-crasher / security concern | Ellsworth Police | Patrol | 911 or on-site officer | — | If pre-contracted officer assigned |
| Lost and found | Volunteer lead | Item log | [walkie-talkie] | — | Hold 30 days; photos + description logged |
| Post-event injury report | Zaal | Event liability | — | Email to event insurance | Document within 24 hours |
| Insurance claim | Event liability provider | Claims agent | [policy number] | [agent email] | Certificate of Insurance from venue required |
| Media inquiry (incident) | Zaal + comms lead | Public messaging | — | Email + Farcaster | No comment until facts confirmed |

**Dashboard integration:** 
- `/stock/safety/contacts` - read-only table for all volunteers (printed, laminated pocket card)
- `/stock/safety/emergency-log` - incident logger with pre-filled contact escalation

**Cost:** Spreadsheet setup 30 min Claude = **$0.05**

---

## AED + First-Aid Station

### Phase: Jul 1 - Aug 15 (sourcing, placement, training)

**AED (Automated External Defibrillator):**

Cardiac arrest can strike anyone. AED + CPR saves lives. At 200-500 outdoor attendees, probability of cardiac event = ~1/500 (low) but impact is critical.

**What to do:**
1. **Rent or borrow AED:** Contact Ellsworth Hospital or local EMS; many lend for free. Cost if purchase: $1,200-2,000; if rent: $50-100
2. **Placement:** Stage-right area, near first-aid station, clearly marked with large sticker
3. **Training:** Find 1-2 volunteers with CPR/AED certification (Red Cross course, 4 hours, $100/person); have them on-site Oct 3
4. **Signage:** Large yellow AED sticker + "CALL 911 FIRST, THEN USE AED"

**First-aid kit essentials:**
- Sterile gauze pads (for cuts)
- Antihistamine (Benadryl, for minor allergic reactions)
- EpiPen (for anaphylaxis; confirm expiration date Sep 25)
- Pain relievers (ibuprofen, acetaminophen)
- Elastic bandages (ankle/wrist sprains)
- Thermometer (heat exhaustion diagnosis)
- Antibiotic ointment
- Tweezers (splinter removal)
- Scissors, tape
- Incident report notebook (paper + pen; photo-documented later)

**First-aid station staffing:**
- 1 certified first-aider on-site 2pm - 10pm Oct 3
- 1 backup (trained wilderness first aid minimum)
- Training: Red Cross First Aid certification ($100/person, 8 hours) or Wilderness First Responder ($300, 16 hours)

**Cost:** AED rental $75 + first-aid kit $150 + CPR training 2 × $100 = **$425**

---

## Crowd Safety + Max Occupancy

### Phase: Jun 3 - Jul 1 (venue assessment + signage)

**Venue walkthrough (Jun 3):**

Zaal + Candy walk Franklin Street Parklet and measure:
1. Entry/exit dimensions (width, any steps?)
2. Stage area dimensions + access points
3. Audience area (open or fenced?)
4. Bottlenecks (narrow passages?)
5. Emergency exit routes (2+ required by fire code)

**Output:** Annotated photos + checklist.

**Max occupancy calculation:**

Fire code rule: 1 person per 7 sq ft (for outdoor standing room). Franklin St Parklet is ~2,500 sq ft usable; max capacity = 2,500 / 7 = **357 people**.

**Safety measures:**
- Print large sign: "MAX OCCUPANCY 400 PEOPLE FOR SAFETY"
- Volunteers count attendees every 30 min (via smartphone counter app)
- If approaching 380, close entry gates; accept no more RSVPs after Sep 25
- Announce capacity in pre-event email: "We cap attendance at 400 to keep everyone safe"

**Crowd management day-of:**
- 2 volunteers at each exit (2 exits minimum)
- 1 volunteer scanning QR code at entry (attendance tracking + occupancy count)
- Radios (walkie-talkie) between volunteers + stage manager
- If panic detected: staff trained to calm, guide to exits, call 911

**Cost:** Signage $30 + volunteer training 2 hours = **$30.10**

---

## Alcohol Service Compliance

### Phase: Jun 1 - Aug 1 (if alcohol is served)

**Key question:** Will ZAOstock serve alcohol?

- **If NO alcohol:** Skip this section; just prevent outside bottles (door staff checks)
- **If YES wine/beer:** Must follow Maine Liquor Licensing Rules

**If YES — required actions:**

1. **Bartender certification:** All bartenders must have TIPS (Training for Intervention Procedures) or ABC (Alcohol Beverage Control) certification. Maine requires this for anyone serving alcohol. Cost: $25 online course, 2-3 hours.

2. **Wristband system:**
   - Volunteer at entry checks ID; if 21+, give gold wristband
   - Bartender checks wristband before pouring
   - Cost: 500 wristbands × $0.05 = $25

3. **Limit per person:** Standard is 2 drinks max per person per event

4. **No self-service:** Attendees cannot bring/drink outside alcohol; volunteers enforce at entry (bag check)

5. **Announcement:** "We serve wine and beer to 21+ only. Mocktails available for all ages. If you're feeling drunk, please sit down and we'll help. We want everyone safe."

6. **Post-event reporting:** If anyone under 21 received alcohol, or if drunk person caused incident, must report to Maine Liquor Licensing within 24 hours

**Cost:** Bartender certification $100 (if not pre-existing) + wristbands $25 = **$125** (only if alcohol served)

---

## Minor Protection Protocol

### Phase: Jun 15 - Aug 1 (if under-18 attendees expected)

**Key question:** Will ZAOstock have under-18 attendees?

- **If NO:** Skip this section
- **If YES:** Need chaperone protocol

**If YES — required actions:**

1. **Registration form:** "Age of attendee: [field]"
2. **Chaperone requirement:** If under-18 not accompanied by guardian, cannot enter
3. **Wristband system:** Under-18 get NAVY wristband (different from 21+ GOLD); volunteers know not to sell alcohol to NAVY
4. **Designated chaperone area:** Seating near stage (good sight lines) for guardians + kids
5. **Signage:** "Under-18 attendees must be accompanied by a guardian (18+)"
6. **Incident protocol:** If adult found alone with unrelated minor, escalate to Ellsworth Police (safeguarding concern)

**Cost:** Signage + wristbands $50 + volunteer training 1 hour = **$50.10**

---

## Weather Safety Protocol

### Phase: Sep 1 - Oct 3 (ongoing monitoring)

**October in Maine:** Average temp 45-55F, 30% chance of rain, <1% chance of tornado.

**Risk categories:**

| Weather | Risk | Mitigation |
|---------|------|-----------|
| Heavy rain | Mud, slip hazards, hypothermia risk | Tent coverage (see phase 4); encourage attendees to wear layers in pre-event email |
| Cold (below 40F) | Hypothermia, especially for thin/elderly | Heaters near seating; hot beverages available |
| Wind (>20 mph) | Stage structure instability | Check stage anchors Sep 30; if wind advisory issued, delay start or cancel |
| Lightning | Cardiac arrest, death | Monitor weather.gov; if lightning risk >30%, pause outdoor acts; move to covered area |
| Flooding | Venue inaccessible | Check venue drainage Sep 20; if heavy rain forecast, consider alternative date (TBD by Sep 28) |

**Monitoring workflow:**
- **Sep 25 - Oct 3:** Zaal checks weather.gov every 6 hours
- **Oct 1:** Final weather decision: "Go" or "Move to backup date" (if alternate venue identified)
- **Oct 3, 2pm:** Final check 2 hours before start
- **Oct 3, during event:** Monitor hourly; announce if weather worsens

**Public announcement:**
- Pre-event email (Oct 1): "Weather update: [forecast]. We will proceed unless lightning risk rises. Tent coverage provided. Bring a jacket!"
- Day-of (if changes): Announce on Farcaster + SMS: "Weather update: [new conditions]. [Any schedule adjustments]"

**Cost:** Weather monitoring $0 (weather.gov free); tent rental ~$500 (if not pre-contracted) = **$500** (contingency)

---

## Fire Safety (Propane, Cooking, Generators)

### Phase: Jul 15 - Aug 15 (vendor vetting + placement planning)

**Three fire risks at outdoor festivals:**

1. **Propane use (if food truck/grill present):**
   - Confirm propane vendor is licensed + insured
   - Propane tanks must be > 10 feet from stage/audience
   - Tank secured (chained to concrete block)
   - Vendor carries CO2 extinguisher + knows shut-off procedure
   - No smoking within 20 feet of propane

2. **Cooking:**
   - Grill/fryer must be tended at all times (never left unattended)
   - Fire extinguisher (ABC class) within 5 feet of cooking area
   - No cooking near dry brush or tent fabric
   - Grease trap emptied before event

3. **Generators (for stage power):**
   - Generator > 20 feet from audience (noise + exhaust)
   - No refueling while running
   - Fuel stored separately (> 50 feet away)
   - CO detector deployed (if enclosed generator housing)

**Dashboard integration:** `/stock/safety/fire-safety` checklist with sign-offs from food vendor + tech lead

**Cost:** Fire extinguisher $50 × 2 locations = **$100**

---

## Electrical Safety

### Phase: Jul 1 - Aug 15 (stage power planning)

**Stage power risks:**
- Wet cables (rain, condensation) cause shock hazard
- Overloaded circuits cause fires
- Voltage drop causes audio/lights to fail mid-performance

**Mitigation:**
1. **Licensed electrician:** Hire for stage power setup + safety check (Sep 20 dress rehearsal)
2. **Weatherproof cables:** All outdoor stage cables rated for wet conditions (UL listing check)
3. **Ground fault circuit interrupter (GFCI):** All outdoor outlets GFCI-protected (breaker cuts power if leak detected)
4. **Backup generator:** Stage has 2-stage power (main from venue outlet + backup generator) in case of brownout
5. **Post-event inspection:** Electrician confirms all cables safe to pack (no damage/fraying)

**Cost:** Licensed electrician 4 hours = **$500** (Sep 20 setup + Oct 3 day-of)

---

## Sound Level Monitoring

### Phase: Aug 1 - Oct 3 (equipment + testing)

**Risk:** Prolonged exposure >85 dB causes hearing damage. OSHA limit is 85 dB for 8 hours.

**Mitigation:**
1. **Decibel meter:** Buy or rent ($30-100)
2. **Test Sep 17 + Sep 25:** Measure sound level at stage front, middle audience, rear (using full-volume test)
3. **Target:** Keep peak <90 dB at 50 feet (audience area); stage can be louder
4. **Day-of monitoring:** Tech lead checks meter every 30 min; if >92 dB, reduce stage volume 2-3 dB
5. **Earplugs:** Free earplugs at registration desk; announce: "We care about your hearing. Take earplugs, we want you back next year"

**Cost:** Decibel meter $60 + earplugs 500 × $0.05 = **$85**

---

## Lost and Found Workflow

### Phase: Oct 3 (day-of), Oct 4-31 (post-event)

**Problem:** Small outdoor festivals always have lost items (phones, jackets, glasses, wallets).

**Solution:**

1. **On-site registration:** Volunteer at information desk collects lost items
2. **Photo intake:** Every item photographed + logged with:
   - Item description
   - Where found (stage area? entrance? seating?)
   - Time found
   - Attendee who found it (name, Farcaster handle, email)

3. **Dashboard:** `/stock/safety/lost-and-found` table with fields above + photo

4. **Post-event (Oct 4-31):**
   - Search attendee email for item description + "lost and found"
   - Email matching attendees: "We found [item] at ZAOstock. Is it yours? Describe it."
   - Hold 30 days; if unclaimed, donate to Ellsworth community center or discard

5. **Policy announcement:** "Lost and found at registration desk. Found an item? Turn it in. Describe yours and ask."

**Cost:** Dashboard table + volunteer training 30 min = **$0.05**

---

## Incident Reporting Chain

### Phase: Jul 1 - Aug 1 (setup); Oct 3 (use)

**What's an incident?**
- Injury (cut, sprain, allergic reaction, heat exhaustion)
- Conflict (verbal, pushing, violence)
- Property damage (tent ripped, stage light broken)
- Medical emergency (heart attack, seizure, anaphylaxis)
- Loss of child / missing person
- Intoxication causing disturbance
- Assault / crime

**Incident reporting workflow:**

1. **On-site (Oct 3):**
   - Volunteer notices incident
   - Calls safety lead (Zaal or designated lead) via walkie-talkie
   - Safety lead assesses: medical? legal? crowd risk?
   - If medical: call 911
   - If legal (crime): call police (911)
   - If crowd risk (panic): announce pause/evacuation
   - If minor (small sprain): first aid station handles

2. **Dashboard log** (within 1 hour of incident):
   - Volunteer fills out `/stock/safety/incident-report`:
     - What happened (free text)
     - When (exact time)
     - Where (location on venue map)
     - Who involved (names, emails, emergency contact if injured)
     - Witnesses (names, contact)
     - Action taken (first aid? police? medical?)
     - Outcome (resolved? ongoing? escalated?)
     - Photo (if non-sensitive)

3. **Escalation rules (Claude logic):**
   ```
   If injury level = "critical" → email Zaal + insurance carrier within 2 hours
   If injury level = "serious" → email Zaal within 4 hours
   If police involved → email Zaal + insurance within 1 hour
   If minor (first aid only) → log for post-event review only
   ```

4. **Post-event (Oct 4):** Zaal reviews all incidents; if any pattern or liability concern, contacts insurance company

**Cost:** Incident report form + dashboard table + alert rules 2 hours Claude = **$0.15**

---

## Insurance Review

### Phase: May 1 - Jun 1 (pre-event), Oct 5 (post-event claim window)

**Key documents:**
1. **Event liability insurance:** Festival needs $1M+ coverage for bodily injury + property damage
   - Zaal confirms with insurance broker (Bangor or Portland area)
   - Cost: $1,000-5,000 depending on attendance estimate
   - Document: Certificate of Insurance (shared with venue)

2. **Venue certificate of insurance:** Venue must carry liability insurance; request copy for Zaal's records

3. **Artist/performer insurance:** If artists bring their own liability coverage (e.g., pyrotechnics, rigging), request certificates

4. **Post-event claim window:** If any injury/incident occurs Oct 3, insurance company must be notified within 30 days

**Dashboard:** `/stock/safety/insurance` with file uploads (certificate, policy summary, claims contacts)

**Cost:** Event liability insurance estimate $2,000-3,000 (not Claude; Zaal's responsibility) = **$0** (Claude-assisted)

---

## Volunteer Safety Training

### Phase: Sep 20 - Sep 30 (briefing + practice)

**What volunteers need to know:**

1. **Zaal leads 30-min training call (Sep 25):**
   - Risk register overview (20 risks, what to watch for)
   - Emergency contact card walkthrough (memorize: 911 for serious stuff)
   - Incident reporting demo (how to fill out form)
   - Scenario practice: "Attendee collapses. What do you do?" (Answer: 1. Call 911, 2. Get AED, 3. Notify safety lead, 4. Log incident)

2. **Printed pocket card (laminated):**
   - QR code → digital version of emergency contacts
   - Top 5 scenarios + action (medical, fire, violence, lost person, drunk person)
   - Safety lead phone number (Zaal)
   - Slack channel (#zaostock-safety)
   - Walkie-talkie channel assignment

3. **Day-of briefing (Oct 3, 1pm before doors open):**
   - 15-min meeting with all 40+ volunteers
   - Weather update
   - Crowd forecast (expected 300-400 people)
   - Any changes from Sep 25 training
   - Q&A

**Cost:** Training facilitation + printed cards 2 hours Claude = **$0.15**

---

## Post-Event Debrief + Analysis

### Phase: Oct 4-8 (within 5 days of event)

**What Claude does:**

1. **Debrief survey (sent to team Oct 4):**
   - What went well?
   - What was harder than expected?
   - Any incidents or safety concerns?
   - Volunteer feedback on protocols
   - Attendee feedback (if collected via post-event NPS)

2. **Claude analyzes:**
   - Incident patterns ("two sprain injuries, both near stage")
   - Bottlenecks identified (volunteers mention entry was congested)
   - Risk register accuracy (which risks materialized? which were overblown?)
   - Recommendations for Year 2

3. **Output: Post-Event Safety Report** (1-page markdown)
   - What happened on Oct 3 (summary of incidents, attendance, weather)
   - What worked well (3 things)
   - What to improve (3 things)
   - Updated risk register for Year 2 (based on actual events)

**Cost:** Debrief survey design + analysis 1 hour Claude = **$0.10**

---

## Security Assessment

### Phase: Jun 15 - Jul 15 (decision point)

**Question:** Do we need security personnel at ZAOstock?

**Factors:**
- Attendance: 200-500 (medium risk)
- Community: ZAO artists (low violence risk; collaborative community)
- Alcohol service: If yes, security reduces drunk-incident risk
- Location: Franklin St Parklet (public space, moderate foot traffic)

**Options:**

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **No security** | $0 | Budget-friendly; trusting vibe | Risk if conflict escalates; untrained volunteers may not handle well |
| **1 off-duty police officer** | $400-600 | Professional; can arrest if needed; deters violent crime | May feel heavy-handed; bad press if police involved |
| **2 security guards (private firm)** | $600-1,000 | Non-lethal, trained in de-escalation | Cost; may be overkill for our community |
| **Trained volunteer + de-escalation** | $200 (train 2-3 volunteers in de-escalation) | Budget-friendly; community-aligned; trains volunteers | Risk if situation exceeds volunteer training |

**Recommendation for ZAOstock 2026:** Skip formal security; instead, train 2-3 volunteers in de-escalation (Zaal's choice based on community vibe + alcohol decision). If alcohol served, revisit; consider 1 off-duty officer.

**De-escalation training:** 4-hour workshop, $100-150 per person. Examples: Crisis Text Line, Conflict Resolution International.

**Cost:** De-escalation training 2-3 volunteers = **$300-450** (optional)

---

## Timeline (170 days out + post-event)

| Week | Phase | Action | Owner | Cost |
|------|-------|--------|-------|------|
| **May 6** | Foundation | Assign safety lead; create risk register template | Zaal | $0 |
| **May 20** | Risk Assessment | Claude generates risk register; team reviews + assigns owners | Claude (API) | $0.10 |
| **Jun 1** | Insurance | Request quotes from 3 brokers; confirm alcohol service (yes/no) | Zaal | $0 |
| **Jun 3** | Venue Assessment | Walk Franklin St Parklet; measure entry/exit/occupancy | Candy | $0 |
| **Jun 10** | Emergency Contacts | Build contact database (911, police, hospital, utility companies) | Claude (template) | $0.05 |
| **Jun 15** | Weather Protocol | Draft weather monitoring checklist + contingency dates | Zaal | $0 |
| **Jun 20** | Security Decision | Decide: need off-duty officer or volunteer de-escalation | Zaal | $0 |
| **Jul 1** | Signage + Max Occupancy | Order "Max 400 people" sign; test occupancy counter app | Tyler | $30 |
| **Jul 1** | First Aid + AED | Contact hospital/EMS for AED loan; order first-aid kit | Candy | $425 |
| **Jul 15** | Fire Safety | Vet food vendor; confirm propane safety plan | Zaal | $0 |
| **Jul 15** | Sound Monitoring | Buy/rent decibel meter; order earplugs | Tyler | $85 |
| **Aug 1** | Alcohol Compliance (if YES) | Bartender TIPS certification; wristband order | Zaal | $125 |
| **Aug 1** | Minor Protocol (if under-18) | Add registration form age field; chaperone signage | Zaal | $50 |
| **Aug 15** | Electrical Safety | Hire licensed electrician for Sep 20 dress rehearsal | Zaal | $500 |
| **Sep 1** | Incident Report System | Deploy `/stock/safety/incident-report` dashboard table | Claude (API) | $0.15 |
| **Sep 15** | Volunteer Training Materials | Print pocket cards; write scenario scripts | Claude (design) | $50 |
| **Sep 20** | Dress Rehearsal | Electrician tests stage power; sound check at full volume | Tech lead + electrician | $0 |
| **Sep 25** | Volunteer Training Call | 30-min Zoom; cover all 20 risks + incident reporting | Zaal | $0 |
| **Sep 30** | Final Safety Walkthrough | Confirm AED placement, fire extinguishers, exits, capacity signs | Candy | $0 |
| **Oct 1** | Weather Decision | Final call: proceed or move date? | Zaal | $0 |
| **Oct 3** | Day-of Ops | Safety lead on-site; incident logger active; monitors checked | Zaal + team | $0 |
| **Oct 4-8** | Post-Event Debrief | Survey team; Claude analyzes incidents; report generated | Claude (API) | $0.10 |

---

## Integration with `/stock/team` Dashboard

**New tables/fields:**

1. **`stock_safety_risks` table**
   - id, risk_name, probability (high/medium/low), impact (critical/major/minor), mitigation, owner, timeline, status

2. **`stock_safety_contacts` table**
   - id, scenario, contact_name, role, phone, email, notes

3. **`stock_incident_report` table**
   - id, incident_type, time, location, description, people_involved, witnesses, action_taken, outcome, photos, created_by, created_date

4. **`stock_safety_checklist` table**
   - task, owner, deadline, completed, notes (e.g., "AED placement confirmed", "Fire extinguishers positioned", "Volunteer training done")

---

## Tools Matrix

| Tool | Cost | Purpose | Buy/Build |
|------|------|---------|-----------|
| **Claude API** | $0.50 total | Risk assessment, incident triage, debrief analysis, training materials | BUY |
| **Event liability insurance** | $2,000-3,000 | Legal coverage for bodily injury + property damage | BUY (broker) |
| **AED rental** | $75 | On-site defibrillator | RENT (hospital/EMS) |
| **First-aid kit** | $150 | Sterile supplies, antihistamines, earplugs | BUY (Amazon) |
| **CPR/AED certification** | $200 (2 volunteers) | Volunteer training | BUY (Red Cross) |
| **Fire extinguishers** | $100 | 2x ABC class for cooking/stage areas | BUY (hardware store) |
| **Decibel meter** | $60 | Sound level monitoring | BUY |
| **Earplugs** | $25 | 500 pairs for hearing protection | BUY |
| **Signage (max occupancy)** | $30 | Capacity limit visible | BUY (local printer) |
| **Wristbands (alcohol/age)** | $50 | 21+ verification (if alcohol served) | BUY |
| **Licensed electrician** | $500 | Stage power safety + weather-resistant setup | BUY (Sep 20 + Oct 3) |
| **Volunteer training (optional de-escalation)** | $300-450 | De-escalation workshop (if no security hired) | BUY (training org) |
| **Weather monitoring** | $0 | weather.gov free access | FREE |
| **Walkie-talkies (if not pre-owned)** | $200-400 | Team communication day-of | BUY or BORROW |

**Total estimated cost (baseline):** $4,000-6,000 (dominated by insurance $2-3K + electrician $500)

---

## Open-Source Patterns

1. **Risk assessment template:** Adapt [NIST Cybersecurity Framework Risk Assessment](https://csrc.nist.gov/publications/detail/sp/800-30/rev-1) — translate cyber risks to physical event risks
2. **Incident tracking:** Fork [Open Incident Management](https://github.com/OpenIncident/OpenIncident) — web-based incident logger
3. **Volunteer coordination:** Remix [Signupgenius open-source](https://github.com/andreyDev/volunteer-management) — scheduling + task assignment
4. **Emergency contact cards:** Use [CardJS](https://github.com/jaysalvat/card) — generate PDF pocket cards from spreadsheet
5. **Weather alerts:** Script [NOAA API](https://www.weather.gov/documentation/services-web-api) (free, public) — auto-email weather updates to team

---

## Key Decisions: USE / DEFER / SKIP

**USE (non-negotiable):**
- Pre-event risk assessment (prevents surprises)
- Emergency contact database (saves lives in crisis)
- Incident reporting system (legal protection + learning)
- Volunteer safety briefing (trains team for scenarios)
- Event liability insurance (legal requirement)
- Fire extinguishers + AED (critical safety infrastructure)

**DEFER to Year 2:**
- Formal security personnel (if incidents occur in 2026, reconsider)
- De-escalation training for all volunteers (do 2-3 key people in 2026; expand Year 2)
- Real-time crowd counting system (manual checklist works; AI crowd counters are nice-to-have)
- Post-event video incident review (paper logs sufficient for 2026)

**SKIP (not our responsibility):**
- OSHA compliance audits (only required if we employ >11 people; we're volunteer-run)
- Environmental health inspections (venue + food vendor responsibility)
- Liability waivers (liability insurance covers us; waivers provide extra legal layer but not required at our scale)

---

## Reality Check

**What could go wrong?**

1. **Incident occurs, not logged:** Months later, attendee sues ZAOstock; no incident report to defend. **Mitigation:** Enforce real-time logging; volunteers trained.

2. **Insurance lapses:** Claim filed Oct 15; policy expired Oct 3. **Mitigation:** Confirm policy in writing by Oct 1; keep proof in `/stock/safety/insurance`.

3. **Volunteer gets injured while helping:** Is volunteer covered by ZAOstock insurance? **Mitigation:** Confirm with insurance broker; may need separate volunteer liability rider ($100-200 add-on).

4. **Weather forecast wrong:** Tornado appears unexpectedly; evacuation panic. **Mitigation:** Emergency text alert system (Twilio) can send "EVACUATE NOW" to all attendees; requires pre-event SMS opt-in.

5. **Alcohol incident:** Someone under 21 drinks; bartender didn't check wristband. **Mitigation:** Train bartender + periodic volunteer spot-checks of wristband enforcement.

**Legal non-negotiables:**
- **Event liability insurance is mandatory.** Without it, Zaal + team are personally liable for any injury.
- **Incident documentation is critical.** If an injury occurs and no report exists, legal defense is weak.
- **Consent + photo releases protect attendees** (see doc 18 accessibility). Combined with incident reports, creates comprehensive duty-of-care record.
- **Alcohol service requires TIPS certification** (if served). Maine law + liability insurance requirement.

---

## Sources

1. [NIST Risk Management Framework](https://csrc.nist.gov/publications/detail/sp/800-30/rev-1) — enterprise risk assessment (adaptable to events)
2. [OSHA Event Safety Checklist](https://www.osha.gov/sites/default/files/publications/OSHA3152.pdf)
3. [Maine Liquor Licensing Rules](https://www.maine.gov/ifw/licensing/summaries)
4. [CDC Emergency Preparedness + Response](https://www.cdc.gov/cpr/infographics/cpr-steps.htm)
5. [FM Global Loss Prevention Data Sheets](https://www.fmglobal.com/) — propane, electrical, fire safety
6. [NOAA Weather API](https://www.weather.gov/documentation/services-web-api) — real-time weather
7. [Red Cross First Aid + CPR Certification](https://www.redcross.org/take-a-class)
8. [RID CPR/AED Certification Maine](https://www.maine.gov/dhhs/ems/licensure)

---

## This Week

- **Action:** Assign safety lead (suggest Candy, given accessibility + volunteer experience)
- **Action:** Zaal creates `/stock/safety/risk-register` doc (spreadsheet)
- **Action:** Claude generates risk register (May 20)
- **Action:** Contact Ellsworth Fire Dept for AED loan availability
- **Slack thread:** #zaostock-planning — "Safety lead assigned. Pre-event risk assessment underway. Any safety concerns or past incident patterns? Share your thoughts."
