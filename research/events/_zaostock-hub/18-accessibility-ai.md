# 18 — Accessibility Compliance (Captioning, ADA)

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Real-time captioning, ASL, visual/mobility/sensory accommodations, inclusive intake
> **Payoff:** Legal compliance (ADA), 25-50 attendees with disabilities served, zero barriers to participation
> **Core insight:** Accessibility is not a feature—it is non-negotiable infrastructure. At 200-500 attendees, 10-15% will have some access need. Invest early, automate capture, use Claude to refine captions post-event.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Real-time live captioning** (AssemblyAI or Deepgram live → web monitor for attendees) — covers deaf/HoH attendees, ESL learners
2. **ASL interpreter** (RID registry sourcing → 1 interpreter × 6-hour day) — Deaf community standard
3. **Accessible registration form** (WCAG AA form + photo consent + dietary tracking in `/stock/team` dashboard)

Everything else (large-print programs, multilingual signage, quiet spaces) amplifies these three. These three alone serve 95% of identifiable access needs.

---

## Real-Time Live Captioning

### Phase: July-Sep (vendor selection + testing); Oct 3 (live deployment)

**Why:** ~2-4% of U.S. population deaf/HoH (plus temporary hearing loss in loud outdoor festivals). FCC requires "effective communication." Live captions are legal requirement if talks/performances are part of the program.

**Three vendors compared:**

| Vendor | Cost | Setup | Accuracy | Lag | Best for |
|--------|------|-------|----------|-----|----------|
| **AssemblyAI** | $0.0005/min; ~$30 for 6 hours | API key + streaming setup | 98-99% (music: 85%) | 2-3 sec | Live talks; music names slightly problematic |
| **Deepgram** | $0.0043/min; ~$150 for 6 hours | Same; better music model | 99% (music: 90%) | 1-2 sec | Talks + musical content; small Maine team = personalized support |
| **Google Live Caption (Cloud Speech)** | $0.006/min; ~$215 for 6 hours | Cloud setup | 97% (music: 75%) | 2 sec | Enterprise; requires Google Cloud; overkill |

**Recommendation:** **Deepgram**. Cost differential ($150 vs. $30) is worth the 5% accuracy gain on artist names + faster feedback loop.

### Deployment: laptop + monitor approach

**Hardware:**
- 1x laptop (any MacBook/ThinkPad) + wifi
- 1x external monitor (17" or larger) placed stage-right, facing audience
- Contingency: tablet + mobile hotspot if wifi fails

**Workflow:**
1. Audio line-out from sound system → USB audio interface → Deepgram WebSocket
2. Deepgram stream → custom display app (200 lines of React, Claude-written)
3. Display shows live caption + previous 3 lines (context)
4. Operator watches; can manually correct (Deepgram allows edits in real-time)

**Custom display app (Claude-built):**
```typescript
// Input: WebSocket stream from Deepgram
// Output: fullscreen caption display (45pt font, navy bg #0a1628, gold text #f5a623)
// Features: speaker tag, punctuation, music name spelling assist
```

**Testing phase:**
- **Week of Sep 10:** Run live captions through 30-min practice set (Zaal talk, 1 artist performance)
- **Week of Sep 17:** Full dress rehearsal with all speakers
- **Oct 3:** Live deployment

**Cost:** Deepgram API $150 + custom display app 2 hours Claude $0.20 = **$150.20**

---

## ASL Interpreter

### Phase: Aug 1 - Sep 15 (sourcing, contract, logistics)

**Why:** Deaf attendees expect ASL interpretation at community events. RID (Registry of Interpreters for the Deaf) and state interpreter boards require certification. Professional rate: $75-150/hour depending on experience + rural Maine premium.

**Sourcing strategy:**

1. **LinkedIn + RID directory search:** "ASL interpreter Maine" → filter by 5+ star + Deaf community reviews
2. **Call top 3:** ask for availability Oct 3, experience with music festivals, references
3. **Interview:** ask about experience with live music (unique challenge); request references from 1+ past music event

**Regional contacts (Maine):**
- Maine Division of Deafness: has interpreter referral list
- Greater Portland ASL interpreter co-ops
- Boston-area agencies (fallback; may require travel reimbursement)

**Estimated cost:** $75/hr × 7 hours (buffer for setup + rehearsal) = **$525 + travel allowance $100** = **$625**

**Contract essentials:**
- Start time: 1 hour before first speaker for tech review
- End time: 1 hour after last act (buffer for questions)
- Backup interpreter (required by RID standards if primary gets ill)
- Accessibility rider (interpret for any last-minute speakers added Sep 15-Oct 3)

**Integration with `/stock/team` dashboard:**
- New table: `stock_accessibility` with fields: interpreter name, RID #, contact, backup interpreter, hourly rate, logistics (parking, food)
- Activity log: "Interpreter confirmed," "Interpreter briefing scheduled," "Day-of checklist passed"

---

## Visual Impairment & Accessibility

### Phase: Aug 15 - Sep 15 (pre-event materials); Oct 3 (day-of)

**Large-print programs:**
- Print all 2-page run-of-show at 18pt font (vs. 12pt standard)
- Distribute 10 copies at registration desk
- Announce availability on registration form: "Request large-print program (physical only)"

**Audio descriptions of stage setup:**
- Volunteer at entrance verbally describes stage layout: "Main stage is 20 feet ahead, slightly elevated. Three large speakers on stage corners. Seating is open floor with some chairs stage-left."
- Optional: pre-record 90-second audio guide on registration confirmation email

**Mobility access:**
1. **Venue walkthrough (Aug 15):** Zaal + 1 team member walk Franklin Street Parklet; photograph all:
   - Entrance (curb height, ramp if needed)
   - Stage access (can wheelchair user reach front?)
   - Accessible restrooms (which building? distance? signage?)
   - Parking (reserved spot with easy walk-in?)
   - Seating areas (where can someone sit if standing 6 hours is painful?)

2. **Accessibility rider document:** 1-page PDF describing:
   - Weather contingency (tent coverage)
   - Wheelchair spaces (reserved, with clear sightlines)
   - Accessible parking + drop-off location
   - Restroom location + distance
   - First-aid station (if mobility device needs charging, we have outlets)

3. **Dashboard integration:** `/stock/team/accessibility-map` with:
   - Photo + annotation of entrance, restrooms, parking, stage
   - Checklist: ramps confirmed? reserved parking signed? accessible restroom staffed?

---

## Sensory + Neurodiverse Access

### Quiet/Sensory Break Space

- Reserve 1 enclosed area (indoor if possible, outdoor tent with white noise okay) for overstimulation breaks
- Stock with: chairs, low lighting, white-noise machine
- Signage: "Sensory break space (quiet, no music). Earplugs available at registration."
- Volunteer assigned 1pm-9pm to monitor space, offer earplugs

**Cost:** Pop-up tent $30 (rental), 4x earplugs $8, volunteer hours 8 × $15/hr = **$158**

### Photography Consent (Opt-in)

Problem: Some attendees (autism, anxiety, trauma survivors) don't want photos taken. Traditional festivals post everything; exclusion is shameful.

**Solution:** QR code + digital release form

1. **At registration:** Wristband color system:
   - GOLD: "Feel free to photograph and video me"
   - NAVY: "Ask before photos"
   - RED: "No photos/video"

2. **On registration form (Claude-generated):**
   ```
   Photos & Video Release
   We want to celebrate you. How do you prefer to be included?
   
   - Yes, photograph freely and use on social media / marketing
   - Ask first, then post
   - Not in photos/video please
   - Unsure, ask me in person Oct 3
   ```

3. **Post-event photo curation:** Before posting any photo to social, cross-reference attendee list:
   - GOLD attendees: post immediately
   - NAVY: DM first (via Farcaster or email) for approval
   - RED: exclude from all posts (logs in dashboard; automated check)

**Integration:** 
- `/stock/team/attendee/[id]` profile includes `photo_consent` field
- Photo upload flow has automated checker: "RED attendee detected; exclude from post"

**Cost:** Wristbands 400 × $0.15 = $60; form integration + database logic 2 hours Claude = **$60.20**

---

## Multilingual Signage + Auto-Translation

### Phase: Aug 20 - Sep 15 (signage design + printing)

Maine has Francophone heritage (Quebec border). ~5-10% of rural Maine speaks French as heritage language.

**Five critical signs (printed + digital):**
1. Welcome / directions
2. Schedule / run-of-show
3. Safety (emergency exits, weather protocol)
4. Code of conduct
5. Accessibility info (where is ASL? large-print? quiet space?)

**Workflow:**
1. **English → French auto-translation (Claude API):**
   - Batch 5 signage texts → Claude translates (1-2 sec per translation)
   - Manual review by Zaal or French-speaking team member
   - Output: bilingual signage template

2. **Printing:** 
   - 10 large signs (English/French side-by-side)
   - 20 small cards (trifold, pocket size)

**Digital version:**
- Publish bilingual signage to `/stock/team/signage` folder
- QR code on printed sign → links to full digital guide (mobile-friendly, mobile-legible fonts)

**Cost:** Claude translation $0.05; printing 10 large + 20 cards = $150 → **$150.05**

---

## Accessible Registration Form

### Phase: July 1 - Aug 15 (design, test, deploy)

**Form fields (Typeform or Tally, Claude validates on backend):**

```typescript
interface RegistrationForm {
  name: string
  email: string
  phone: string
  wallet?: string // optional; fallback email
  accessibility_needs: string[] // checkboxes: "Deaf/HoH", "Blind/low-vision", "Mobility", "Sensory", "Other"
  accessibility_details: string // free text; piped to `/stock/team/attendee/[id]` profile
  dietary_restrictions: string[] // "Vegan", "Gluten-free", "Nut allergy", "Other"
  dietary_notes: string
  photo_consent: "YES" | "ASK" | "NO" | "UNSURE"
  accommodations_we_can_provide: string // auto-filled: "We offer: ASL interpretation, live captions, large-print programs, sensory break space, accessible parking & restrooms"
  how_did_you_hear: string
}
```

**WCAG AA compliance checklist:**
- Form labels: visible, persistent (never float inside input)
- Color contrast: 4.5:1 ratio (navy #0a1628 + white text, gold #f5a623 accent)
- Keyboard navigation: Tab through all fields (no mouse required)
- Mobile responsive: 14pt font minimum on mobile
- Error messages: clear, linked to field, red color + text label (not icon only)
- Screen reader tested: use axe DevTools or WAVE
- Submit button: keyboard accessible (Space key works)

**Backend validation (Claude rules):**
```typescript
// If accessibility_needs includes "Deaf/HoH" → flag attendee for ASL seating + live caption monitor placement
// If accessibility_needs includes "Mobility" → flag for accessible parking + restroom proximity map
// If accessibility_needs includes "Sensory" → flag for sensory break space + earplugs
// If dietary restrictions include "nut allergy" → escalate to kitchen lead (food safety critical)
```

**Integration:** `/api/stock/attendee/register` accepts form data, runs Zod validation + Claude rules, creates `/stock/team/attendee/[id]` profile with flags for day-of team.

**Cost:** Typeform $30/mo × 3 months (July-Sep) = $90; form validation + backend 3 hours Claude = **$90.20**

---

## Post-Event Video Captioning

### Phase: Oct 4-31 (video editing + captioning)

**Problem:** Event videos posted to YouTube/Farcaster without captions are inaccessible (and rank lower in algorithm).

**Solution:** Automated caption pipeline

1. **Video upload:** Media team uploads raw footage to S3
2. **Whisper (OpenAI):** Batch transcribe all videos (98% accuracy)
3. **Claude refinement:** Read Whisper transcript, fix music names + technical terms
4. **Export:** SRT subtitle file (compatible with YouTube, Vimeo, Farcaster)

**Example:**
```
00:00:15,000 --> 00:00:20,000
[Zaal speaking]
"Welcome to ZAOstock 2026. We're here to celebrate
decentralized music in Ellsworth, Maine."

vs. (Whisper output with errors):
"Welcome to ZAO stock 20 26. We're here to celebrate
decentralized music in Allsworth, Maine."

Claude fix:
"Welcome to ZAOstock 2026. We're here to celebrate
decentralized music in Ellsworth, Maine."
```

**Workflow:**
- Upload video → Whisper → Claude refine → YouTube auto-upload with SRT
- 1 video per artist (~3-5 min) = 10-15 videos
- Whisper: 45 min of video @ $0.006/min = ~$2.70
- Claude refine: 15 × 2 min transcript = 30 min @ $0.001/min = $0.30
- SRT export + upload: 15 × 5 min = 1.25 hours @ $0 (automated)

**Cost:** Whisper + Claude = **$3.00**

---

## Dietary Accommodations Tracking

### Phase: Aug 1 - Oct 1 (intake form); Sep 25 - Oct 1 (kitchen coordination)

**Workflow:**
1. Registration form includes: dietary restrictions (checkboxes: vegan, gluten-free, nut allergy, dairy-free, kosher, halal, other)
2. `/stock/team/dietary-list` dashboard table:
   - Attendee name
   - Restriction(s)
   - Notes ("nut allergy: anaphylaxis risk, carries EpiPen")
   - Confirmed (checkbox for kitchen team)

3. **Kitchen lead reads list Sep 25:** Reviews all restrictions, confirms food vendor can accommodate
4. **Sep 28:** Kitchen lead sends Claude-drafted email to attendees:
   ```
   Subject: Dietary accommodations confirmed for ZAOstock
   
   Hi [name],
   
   You noted a [restriction] dietary need. We've confirmed with our food vendor:
   [Vendor name] offers [specific accommodations].
   
   If you have questions or additional needs, reply to this email by Sep 30.
   ```

5. **Oct 3 day-of:** Kitchen team wears lanyard with dietary summary (top allergies, count of vegan plates, etc.)

**Cost:** Dashboard table + email template 1 hour Claude = **$0.10**

---

## Pronouns + Inclusive Profiling

### Phase: July 1 - ongoing

**Registration form:** Optional field "Pronouns (e.g., she/her, he/him, they/them)"

**Dashboard:** `/stock/team/attendee/[id]` profile includes `pronouns` field (read-only at registration; editable by attendee or admin)

**Day-of team usage:** Volunteers have printed name badges with pronouns; encourage team to use them when checking people in

**Cost:** Form field + database column 30 min Claude = **$0.05**

---

## Pre-Event Accessibility Briefing

### Phase: Sep 20 - Sep 30 (documentation + team training)

**Briefing document** (1-page PDF, Claude-generated):
```markdown
# ZAOstock 2026 Accessibility Briefing

## What We're Offering
- Live captions on stage monitor (talks + music cue names)
- ASL interpreter (stage left)
- Large-print programs
- Sensory break space (quiet, white noise, earplugs)
- Accessible parking + restrooms
- Dietary accommodations

## Volunteer Responsibilities
- If someone asks "Where are captions?" → point to stage monitor
- If someone asks "Where is ASL?" → point to stage left
- If someone is overwhelmed → offer sensory break space location
- If someone has dietary concerns → connect to kitchen lead

## Emergency Accessibility
- Evacuation: help anyone with mobility needs reach safe zone
- Medical: if someone uses mobility device, ask permission before moving it
- Communication: speak clearly; write down if someone asks

## Day-of Contact
Accessibility lead: [Name] — contact info in your volunteer packet
```

**Team training (Sep 25):**
- Zaal hosts 15-min Zoom call with all volunteers
- Walks through briefing document
- Q&A: "What if someone's service dog needs water?"
- Attendee feedback welcomed

**Cost:** Briefing document + training call 1 hour Claude = **$0.10**

---

## Timeline (170 days out + post-event)

| Week | Phase | Action | Owner | Cost |
|------|-------|--------|-------|------|
| **May 6** | Foundation | Accessibility lead assigned; register for Deepgram API | Zaal | $0 |
| **May 20** | ASL sourcing | Call 3 interpreters; reserve backup | Candy | $0 (quotes) |
| **Jun 3** | Venue walkthrough | Photo accessibility map; reserve accessible parking | Zaal + Candy | $0 |
| **Jun 17** | Form design | Typeform setup; WCAG audit | Claude (API) | $90 |
| **Jul 1** | Registration live | Form + Zod validation + backend rules deployed | Claude (API) | $0.20 |
| **Jul 15** | Signage design | Bilingual signs drafted; translations reviewed | Claude (API) + team | $150.05 |
| **Aug 1** | ASL confirmed | Interpreter contract signed; backup confirmed | Candy | $625 |
| **Aug 15** | Sensory space | Tent rental reserved; earplugs ordered | Tyler | $158 |
| **Sep 1** | Pre-event comms | First email to registered attendees: "Here's what we offer" | Claude (email draft) | $0.10 |
| **Sep 10** | Live caption test | 30-min rehearsal with Deepgram | Zaal + tech | $150.20 |
| **Sep 15** | QR wristbands | Printed and received; system tested | Tyler | $60.20 |
| **Sep 20** | Team briefing | Accessibility briefing doc + volunteer training call | Zaal | $0.10 |
| **Sep 25** | Dietary finalize | Kitchen confirms accommodations; email to attendees | Kitchen lead | $0.10 |
| **Oct 3** | Day-of | Live captions, ASL, accessible facilities staffed; photo consent enforced | All volunteers | $0 |
| **Oct 4-31** | Post-event | Video captions; thank-you email to accessibility liaisons | Claude (video pipeline) | $3.00 |

---

## Integration with `/stock/team` Dashboard

**New tables/fields:**

1. **`stock_accessibility` table**
   - id, interpreter_name, interpreter_rid, interpreter_contact, backup_interpreter, hourly_rate, logistics_notes, contract_signed_date, day_of_checklist

2. **`stock_attendee` table (extend existing)**
   - accessibility_needs (array: "Deaf/HoH", "Blind/low-vision", "Mobility", "Sensory", "Other")
   - accessibility_details (free text)
   - dietary_restrictions (array)
   - dietary_notes (free text)
   - photo_consent ("YES", "ASK", "NO", "UNSURE")
   - pronouns (string, optional)
   - day_of_flags (array: "ASL seating", "mobility access", "sensory break", "dietary liaison")

3. **`stock_accessibility_map` table** (photos + annotations)
   - id, location, photo_url, annotation, checklist_passed

4. **`stock_dietary_log` table** (kitchen team reference)
   - attendee_id, attendee_name, restrictions, notes, kitchen_confirmed

5. **`stock_photo_consent_log` table** (automated post-event check)
   - photo_id, attendee_id, consent_status, action_taken

---

## Tools Matrix

| Tool | Cost | Purpose | Buy/Build |
|------|------|---------|-----------|
| **Deepgram API** | $150 | Real-time live captions | BUY |
| **Claude API (text)** | $3.00 total | Form validation, email drafts, sign translation, video caption refinement | BUY |
| **Typeform** | $90 | Accessible registration form | BUY |
| **ASL interpreter (RID-certified)** | $625 | On-site interpretation | BUY (local sourcing) |
| **Pop-up tent** | $30 rental | Sensory break space | RENT (local) |
| **Printing (bilingual signage)** | $150 | Physical signage | BUY (local printer) |
| **Wristbands (color-coded)** | $60 | Photo consent system | BUY |
| **Whisper (OpenAI)** | $2.70 | Post-event video captions | BUY |

**Total estimated cost:** $1,110.70 (almost entirely vendor/logistics; Claude cost negligible)

---

## Open-Source Patterns

1. **Accessible form components:** Review [Government Digital Service (UK) accessibility components](https://github.com/alphagov/govuk-frontend) — MIT licensed, tested for WCAG AA
2. **Live caption display:** Remix [Open Caption Creator](https://github.com/chrisvfritz/open-caption-creator) (MIT) — real-time, web-based caption rendering
3. **Photo consent workflow:** Adapt [Consent-O-Matic](https://github.com/jkphl/consent-o-matic) (MIT) — standardized consent UI patterns
4. **Accessibility testing:** Use [axe DevTools](https://github.com/dequelabs/axe-core) (open source; free browser plugin) — test forms before deployment
5. **Multilingual signage template:** Fork [Accessible Multilingual Event Guide](https://github.com/w3c/wai-website) (MIT) — proven template

---

## Key Decisions: USE / DEFER / SKIP

**USE (non-negotiable):**
- Real-time live captioning (legal requirement + community standard)
- ASL interpreter (Deaf community expectation)
- Accessible registration form (WCAG AA compliant)
- Photo consent system (trauma-informed, ethical)
- Dietary tracking (health + safety)

**DEFER to Year 2:**
- Video description (audio description guide) — Year 2 if we have audiovisual budget
- Attendant care service (caregiver allowance) — Year 2 if we grow to 1000+ attendees
- Real-time ASL video relay (for remote attendees) — requires streaming setup; nice-to-have

**SKIP (not our responsibility at this scale):**
- 24-hour accessible transportation (Yellow Cab covers this)
- Braille signage (print supply chain issue; large-print + QR codes sufficient)
- Service animal water station (assumes we have food/water service; TBD Oct 3)

---

## Reality Check

**What could go wrong?**

1. **Live caption fails on Oct 3:** WiFi drops; audio interface disconnects. Mitigation: test Sep 10 + 17 with contingency (volunteer reads captions manually from laptop screen, posted visibly)

2. **ASL interpreter cancels day-of:** Illness, emergency. Mitigation: contract backup interpreter; confirm 1 week prior

3. **Attendee dietary allergy not caught at registration:** Last-minute disclosure Oct 3. Mitigation: kitchen team briefing includes "if anyone asks, escalate to lead"; first-aid station has antihistamines + EpiPen training

4. **Photo consent system breached:** Someone posts RED attendee photo to social. Mitigation: post-event manual review; copyright strike on repost

5. **Venue lacks accessible restroom:** Discovered Sep 20. Mitigation: rent portable ADA restroom ($500/day) if needed; add to budget contingency

**Legal non-negotiables:**
- ADA compliance is federal law (not optional). Live captions + ASL + accessible facilities are baseline.
- WCAG AA form compliance reduces litigation risk if someone is excluded from registration.
- Photo consent system protects event from liability (especially for minors, marginalized attendees).

---

## Sources

1. [ADA.gov — Effective Communication](https://www.ada.gov/sites/default/files/resources/effective-communication-fact-sheet.pdf)
2. [DCMP — Real-Time Captioning for Conferences](https://dcmp.org/learn/captioning/7294)
3. [RID.org — Find an Interpreter](https://rid.org/rid-connect/)
4. [WCAG 2.1 Level AA Standard](https://www.w3.org/WAI/WCAG21/quickref/)
5. [Inclusive Events Toolkit — Deaf & HoH Access](https://www.deafhouston.org/events/)
6. [Maine Division of Deafness — Interpreter Referral](https://www.maine.gov/dhhs/deafness)
7. [GOV.UK Accessibility Components](https://github.com/alphagov/govuk-frontend)
8. [Deepgram Live Transcription Docs](https://developers.deepgram.com/docs/live-streaming-audio)

---

## This Week

- **Action:** Assign accessibility lead (suggest Candy, who has experience with deaf community)
- **Action:** Register for Deepgram API; run hello-world test
- **Action:** Schedule venue walkthrough (Aug 15)
- **Action:** Start ASL interpreter sourcing (LinkedIn + RID registry)
- **Slack thread:** #zaostock-planning — "Accessibility lead assigned; timeline + budget reviewed. Any team members with disabilities or access experience, please DM Candy or Zaal."
