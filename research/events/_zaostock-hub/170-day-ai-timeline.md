# 170-Day ZAOstock AI Timeline: April 23 - October 3, 2026

**Festival:** October 3, 2026 (Franklin Street Parklet, Ellsworth ME)  
**Today:** April 23, 2026  
**Days out:** 163  
**Team:** 17 contributors (Zaal lead, Candy 2nd, DCoop music 2nd, 14 active)  
**Budget:** $5-25K  
**Documentation:** All 20 AI-assist dimension docs synthesized (docs 01-20)

---

## CRITICAL PATH: 10 Must-Ship AI Wires

**These 10 wires unlock 80% of ZAOstock's operational magic. Everything else is optional.**

| Week | Wire | Dimension | Owner | Deadline |
|------|------|-----------|-------|----------|
| Week 1 (Apr 24-28) | Clay enrichment + Claude email drafting + webhook logging | Sponsor (01) | Zaal + Eng | Apr 28 |
| Week 1 (Apr 24-28) | Neynar artist discovery + ZAOCHELLA roster pull | Artist (02) | DCoop + Eng | Apr 28 |
| Week 2 (May 1-5) | Volunteer skill-matching (Claude on bios) | Volunteer (03) | Eng | May 5 |
| Week 3 (May 6-12) | Energy curve optimization (Spotify + Claude) | Run-of-Show (04) | Eng | May 12 |
| Week 3 (May 6-12) | Voice logging + triage agent setup | Day-of (05) | Eng + Zaal | May 12 |
| Week 4 (May 13-19) | Pre-event countdown drafting (14 posts) | Social (06) + Content Calendar (17) | Claude | May 19 |
| Week 6 (May 27-Jun 2) | Budget receipt OCR + variance forecasting | Budget (08) | Eng | Jun 2 |
| Week 7 (Jun 3-9) | Personalized recap post automation | Community (10) | Eng | Jun 9 |
| Week 10 (Jun 24-30) | Stage plot extraction (Claude Vision) | Run-of-Show (04) | Eng | Jun 30 |
| Week 22 (Sep 1-7) | Post-event follow-up (thank-yous + ROI reports) | Followup (20) | Zaal | Sep 7 |

**Cost (all 10 wires):** $200 Clay + $60 Deepgram + ~$30 Claude APIs + Twilio ($0.30) = **~$290 total**

---

## PHASE A: THIS WEEK (Apr 23-28) - THE 3 AI WIRES TO SET UP NOW

### What To Do Today (Apr 23)

**Single most important task:** Run Bangor Savings Bank enrichment + email draft. This is the test case.

1. **Sign up for Clay.com** ($200/mo, but do it anyway — ROI is immediate)
2. **Test Clay query:** "Bangor Savings Bank, Bangor Maine" — extract CFO/VP Marketing email
3. **Test Claude draft:** Paste the VP Marketing email + Zaal's brief into Claude, generate 3 email options
4. **Create one sponsor in SponsorCRM** with enriched data; log the outreach manually
5. **By EOD Apr 24:** Email sent to Bangor Savings Bank. One sponsor contacted.

### Week Of April 24-28 (Phase 1 Ships)

**Owner: Zaal + Engineer**

**Wires to ship:**

1. **Wire: Clay enrichment + Claude email drafting + webhook logging** (Sponsor doc 01)
   - Implement `/api/stock/team/sponsors/[id]/enrich` (Clay API)
   - Implement `/api/stock/team/sponsors/draft-email` (Claude modal)
   - Implement webhook auto-logging to `stock_contact_log` on status change
   - Test on 5 existing leads by Apr 30
   - **Cost:** Clay $200/mo, Claude $0.05 (tokens), Webhook $0
   - **Time savings:** 35 hrs over 6 months (5 hrs/sponsor × 20 leads)

2. **Wire: Neynar artist discovery + ZAOCHELLA roster pull** (Artist doc 02)
   - Implement `/api/stock/artist-discovery/farcaster` (Neynar weekly query)
   - Manually extract ZAOCHELLA cipher artists (GodCloud has the roster)
   - Insert 12-15 wishlist artists into dashboard by May 1
   - **Cost:** Neynar free tier
   - **Output:** 12-15 artists in pipeline by May 1 (target: 10 confirmed by Sep 3)

3. **Wire: Volunteer role-matching setup** (Volunteer doc 03)
   - Schema additions: `stock_volunteers` table with `ai_suggested_role` field
   - Implement `/api/stock/team/volunteers/suggest-role` (Claude Haiku on bio)
   - Wire SignUp.com account ($99/mo) for shift scheduling
   - Ready for testing with first applicant by May 7
   - **Cost:** SignUp.com $99/mo, Claude $0.02 (20 volunteers)

**Blockers resolved:** None (3 wires are independent)

**Deliverables by Apr 28:**
- Clay API key live, one sponsor enriched + emailed
- 12+ artists in ArtistPipeline dashboard (wishlist stage)
- SignUp.com account created, form configured, first volunteer test
- Webhook logging functional (manual entry shows auto-logged follow-up)

**Owner check-in:** Zaal + Engineer (30 min sync Friday Apr 26)

---

## PHASE B: MAY (May 1-31) - DISCOVERY + OUTREACH RAMP

### Week 1-2: May 1-12 (Discovery Window Opens)

**Context:** First-contact window for artists opens May 1. Must have 12 artists ready to contact.

**Wires to activate:**

1. **Artist outreach drafting** (Artist doc 02, Pattern 8)
   - Claude API: draft personalized emails to 12 artists (~$0.10 total)
   - Zaal reviews, edits, sends 12 emails May 5-8
   - Track replies in dashboard (new `stock_artist_outreach` table)

2. **Sponsor deal scoring** (Sponsor doc 01, Pattern 4)
   - Compute ICP fit scores for all 20 sponsors
   - Implement deal_score calculation SQL
   - Create "Hot Leads" dashboard widget
   - Expected: 3-5 leads marked "in_talks" by May 15

3. **Volunteer skill-matching goes live** (Volunteer doc 03)
   - First volunteers apply to public form at `/stock/apply`
   - Claude suggests role for each applicant (Haiku inference)
   - Zaal reviews + clicks to confirm
   - Expected: 5-10 volunteers assigned to roles by May 15

**Milestones:**
- 12 artists in first-contact pipeline
- 5-8 sponsors in "contacted" or "in_talks" status
- 5-10 volunteers with assigned roles

---

### Week 3-4: May 13-31 (Outreach Window Continues)

**Wires to activate:**

1. **Follow-up reminders** (Sponsor doc 01, Pattern 5)
   - Cron job checks leads "contacted" >7 days ago without response
   - Zaal gets daily 5-minute summary: "3 sponsors need follow-up"
   - No automation yet; manual nudges via email/Slack

2. **Run-of-show energy curve first pass** (Run-of-Show doc 04)
   - Implement `/api/stock/schedule/optimize-energy` (Spotify + Claude batch)
   - If 6+ artists confirmed, run first optimization
   - Output: proposed set order + energy curve graph
   - **Cost:** Spotify API free, Claude $0.02

3. **Budget receipt OCR pilot** (Budget doc 08)
   - Implement `/api/stock/budget/receipt/ocr` (Claude vision)
   - Test with 3-5 real receipts (cost ~$0.005)
   - Confirm 95%+ accuracy on vendor + amount extraction

**Blockers to watch:**
- Artist reply rate <30% by May 15 = activate Bandcamp backup discovery (defer to May 20 if needed)
- Sponsor committed amount <$5K by May 20 = escalate to Zaal for personal outreach

**Deliverables by May 31:**
- 8-10 artists confirmed as "interested" (timeline: doc 472)
- 3-5 sponsors committed or in final talks
- 15-20 volunteers assigned + shift schedule generated (SignUp.com)
- Energy curve first draft (if 6+ artists locked)

---

## PHASE C: JUNE (Jun 1-30) - ACTIVATION + FEATURE BUILD

### Week 1-2: Jun 1-15 (Dashboard + Integration Sprint)

**Wires to activate:**

1. **Stage plot extraction** (Run-of-Show doc 04, Pattern 4)
   - Implement `/api/stock/schedule/extract-stage-plot` (Claude Vision on rider PDFs)
   - Test with first rider received
   - **Cost:** Claude Vision $0.01-0.02 per rider
   - **Output:** JSON stage plot, auto-rendered diagram

2. **Day-of voice logging + triage agent** (Day-of doc 05)
   - Deepgram API key configured; ZOE `/log` command live
   - Test with mock incident logs (10-15 samples)
   - Implement `/stock/team/triage` dashboard (Slack card walls)
   - **Cost:** Deepgram $15 (300 min test budget)

3. **Budget forecasting live** (Budget doc 08)
   - Receipt OCR fully functional (tested on 10+ receipts)
   - Sponsor pipeline Bayesian forecast running weekly
   - Friday variance report mailed to team
   - **Cost:** Claude $0.01 per receipt, $0.001 per forecast run

4. **Volunteer SMS reminders configured** (Volunteer doc 03)
   - Twilio account + Slack command integration
   - Test 48h + day-before SMS templates
   - Expected: 20 volunteers confirmed + shifted by Jun 15

**Deliverables by Jun 15:**
- All 10 artists confirmed (doc 472 timeline)
- Contracts issued to 10 artists (manual DocuSign or Google Docs)
- Rider intake system live (waiting on artist PDFs from June 15 onward)
- Budget dashboard showing $15K+ committed, variance <10%

---

### Week 3-4: Jun 16-30 (Content Ramp Begins)

**Wires to activate:**

1. **Content calendar generation** (Content Calendar doc 17 + Social doc 06)
   - Claude batch generates 50+ posts for May-Oct period
   - Organize by week: artist spotlights, sponsor thanks, countdown beats
   - Export to Google Sheet, review by Zaal Jun 23
   - **Cost:** Claude $0.20 (one-time)

2. **Personalized recap framework** (Community doc 10)
   - Schema: `stock_team_recaps` table
   - Implement `/api/stock/team/[id]/recap` (Claude generation)
   - Test with 2-3 team members (won't fire until Oct 4)

3. **Final energy optimization pass** (Run-of-Show doc 04)
   - All 10 artists confirmed + bios locked
   - Run energy optimizer with constraint: optimize for full lineup
   - Output: final proposed set order + transitions
   - **Cost:** Claude $0.02

**Deliverables by Jun 30:**
- Content calendar fully drafted (50+ posts, May-Oct)
- Zaal approves/edits calendar (2-3 hour review)
- Run-of-show energy curve finalized (waiting on tech riders from July 1+)

---

## PHASE D: JULY (Jul 1-31) - ARTIST LOCKIN + LOGISTICS

### Week 1-2: Jul 1-15 (Contracts + Logistics)

**Wires to activate:**

1. **Rider intake at scale** (Artist doc 02 + Run-of-Show doc 04)
   - Artists submit tech riders (PDF or form)
   - Claude Vision extracts to JSON stage plot per artist
   - Stage plot aggregation: total cables, power, monitor needs
   - **Cost:** Claude Vision $0.15 (10 riders × $0.01)

2. **Travel logistics estimation** (Artist doc 02)
   - For out-of-state artists: estimate flight + hotel (manual lookup, no API)
   - Zaal budgets travel reimbursement ($500-1000 per artist)
   - Update budget forecast with travel line item

3. **Transition buffer calculation** (Run-of-Show doc 04, Pattern 2)
   - Implement transition rules (band-to-band 12min, DJ-to-DJ 2min, etc.)
   - Flag any schedule conflicts with <5min buffers
   - **Cost:** Free (rule engine)

**Milestones:**
- 10 artists confirmed with signed contracts (by Aug 1 hard deadline)
- All tech riders received + extracted
- Stage plot drafted (aggregate of 10 artists)

---

### Week 3-4: Jul 16-31 (Run-of-Show Finalization)

**Wires to activate:**

1. **Final run-of-show optimization** (Run-of-Show doc 04)
   - Incorporate: energy curve + transitions + WaveWarZ bracket + talks
   - Propose final set times: 12pm-9pm schedule
   - Output: printable schedule card for each artist + volunteer crew

2. **Load-in/load-out choreography** (Run-of-Show doc 04, Pattern 8)
   - Define 8am-12pm load-in sequence (3 artists, 15 min each + tech checks)
   - Define 6pm-7:30pm load-out sequence
   - Print laminated cards for artists + crew

3. **Weather contingency draft** (Run-of-Show doc 04, Pattern 7)
   - Identify Wallace Events tent as backup ($1200 contingent cost)
   - Draft replanning logic: if rain >50% probability Sep 28, move to tent
   - **Cost:** Free (decision logic)

**Deliverables by Jul 31:**
- Final run-of-show locked (wait for sign-off from Zaal + DCoop)
- Load-in cards printed (ready for Oct 1 distribution)
- Stage plot diagram + cable checklist finalized

---

## PHASE E: AUGUST (Aug 1-31) - PRE-FESTIVAL CONTENT + FINAL LOGISTICS

### Week 1-2: Aug 1-15 (Sponsor Pipeline Final Push)

**Wires to activate:**

1. **Sponsor forecasting + alerts** (Budget doc 08)
   - Weekly Friday report: "On track for $18K? Variance: +2%. Alert: none."
   - Flag any sponsors dropped from pipeline (auto-alert Zaal)
   - Identify stretch sponsors still in "proposal" stage

2. **Content calendar approval workflow live** (Content Calendar doc 17)
   - Zaal reviews 5-7 posts every Monday
   - Approves/edits in Slack (30 min/week)
   - Firefly auto-publishes Thu 7pm

3. **Artist brand packs** (Artist doc 02, Pattern 13)
   - Group artists by vibe: "Digital Folk" (3 artists), "Experimental Hardware" (3), etc.
   - Claude generates pack names + social copy
   - **Cost:** Claude $0.04 (4 packs × $0.01 per generation)

---

### Week 3-4: Aug 16-31 (Media + Volunteer Finalization)

**Wires to activate:**

1. **Photographer + media volunteer recruitment** (Social doc 06)
   - Identify 1 official photographer + 1 media volunteer (editing)
   - Brief both on workflow: capture → upload → Claude captions → Firefly post

2. **Volunteer assignment finalization** (Volunteer doc 03)
   - Run OR-Tools shift solver (final volunteer count = 20)
   - Generate PDF shift assignments (8 roles × 5 shifts)
   - Export + share with team

3. **Volunteer training drills** (Volunteer doc 03)
   - Mock incident logging (voice → Deepgram → Claude triage)
   - SMS cascade test (route message to 3 volunteer groups)
   - QR check-in dry-run (mobile scan → instant SMS confirmation)

**Deliverables by Aug 31:**
- All sponsors committed or pipeline status finalized ($18K+ target)
- 20 volunteers assigned + trained, shifts locked
- 50+ content posts scheduled through Oct 10
- Photographer + media volunteer onboarded

---

## PHASE F: SEPTEMBER (Sep 1-Oct 2) - FREEZE + DRY RUN

### Week 1-2: Sep 1-15 (Feature Freeze + Artist Hard Cutoff)

**Sep 3: Artist lockin hard cutoff** (doc 472)
- All 10 artists confirmed, contracts signed, riders in
- No new artists added; backup roster retired
- Lineup announced Sep 5 publicly

**Wires to activate:**

1. **Final run-of-show lock** (Run-of-Show doc 04)
   - All transitions verified
   - Load-in/load-out schedules printed
   - Contingency weather plan drafted (if Oct 1 forecast >50% rain)
   - **Cost:** Free

2. **Post-event analytics setup** (Analytics doc 07)
   - Schema: `stock_analytics_*` tables created
   - Typeform survey designed (5 questions, QR code + email)
   - Photographer briefed on 3 crowd-count photos (12pm, 2pm, 4pm)

3. **Volunteer final reminders scheduled** (Volunteer doc 03)
   - Sep 20: SMS "Shifts locked, you're doing [role] Oct 3"
   - Oct 1: SMS "48h reminder, parking + what to bring"
   - Oct 2: SMS "Tomorrow! Doors 11am, be early"
   - Oct 3, 9am: SMS "Good morning, team. You're live!"

**Sep 15: Feature freeze** (all technical work done)
- No new features added after this date
- Remaining 18 days = testing + dry-runs only

---

### Week 3-4: Sep 16-Oct 2 (Dry Runs + Final Prep)

**Wires to activate (testing only):**

1. **Day-of operations dry-run** (Day-of doc 05)
   - Mock incident scenario (artist delayed 20 min)
   - Voice log → triage → SMS cascade (test with 3 volunteers)
   - Verify response time <2 min from log to SMS sent

2. **Real-time schedule update testing** (Run-of-Show doc 04, Pattern 3)
   - Zaal plays MC, logs mock block starts
   - Verify delay detection + SMS routing

3. **Photo workflow dry-run** (Social doc 06)
   - Photographer uploads 10 test photos to S3
   - Claude captions + rates each
   - Firefly posts to Farcaster (test account)
   - Verify end-to-end <2 min latency

4. **Post-event report generator test** (Followup doc 20)
   - Feed mock attendance data (380 people, 5 sponsors)
   - Claude generates sample ROI report PDF
   - Verify formatting + data accuracy

**Sep 24-Oct 2: Final preparations**

- **Sep 24:** Stage plot diagram final sign-off
- **Sep 27:** All volunteers confirm attendance (final no-show identification)
- **Sep 28:** Weather.gov API polling begins (7-day forecast)
- **Oct 1:** Final weather check; if rain >50%, activate tent contingency plan
- **Oct 1:** Verify all day-of systems live (voice log, triage, SMS)
- **Oct 2:** Final crew briefing (rundown of all contingencies)

**Deliverables by Oct 2:**
- All 10 artists ready (schedules + load-in cards distributed)
- All 20 volunteers trained, shifts confirmed, SMS live
- Day-of ops (voice logging, triage, SMS) tested
- Post-event analytics ready to fire Oct 4

---

## PHASE G: FESTIVAL WEEK (Sep 28 - Oct 3) - DAY-OF EXECUTION

### Oct 3, 2026 (Festival Day)

**10am:** Setup crew arrives
- QR check-in scanner live on Zaal's phone
- Voice logging (Telegram `/log` command) tested + briefed

**11am:** Artists start load-in
- Load-in sequence begins (Artist 1, then Artist 2, etc.)
- Feedback logged in voice (any gear issues → voice log → triage → SMS to stage team)

**12pm:** Doors open
- Crowd count photo 1 (for YOLO attendance estimation)
- First post queued: "Welcome to ZAOstock 2026 [photo]"

**1pm:** First artist on stage
- Real-time block timer: MC says "Block start 1:07pm" (7 min late)
- Delay detected: SMS to affected volunteers + next 2 artists

**Throughout day:**
- Every 60 min: photographer uploads photo batch
- Claude auto-captions, rates top 3
- Firefly posts best photo to Farcaster (staggered, not spam)
- Zaal monitors triage dashboard (voice logs auto-ingested, Claude classification shown)

**6pm:** Final artist wraps
- Real-time photo sharing continues

**7pm:** Load-out begins
- Volunteers clear stage
- Voice logs any final incidents

**9pm:** Gates close
- All voice logs captured
- All photos ingested

---

## PHASE H: POST-FESTIVAL (Oct 4-Dec 31) - FOLLOW-UP + RETENTION

### Oct 4-7 (Immediate Thank-Yous)

**Wires to activate:**

1. **Personalized thank-you emails** (Followup doc 20, Pattern 1)
   - Claude generates 5 templates (attendee, artist, sponsor, volunteer, press)
   - Zaal reviews + edits (1 hour)
   - Paragraph schedules sends (staggered, 10 per day)
   - **Cost:** Claude $0.10 (templates)
   - **Output:** 250+ attendees, 10 artists, 5 sponsors, 20 volunteers, 3 journalists all thanked within 72 hours

2. **Recap posts auto-generated** (Community doc 10, Pattern 1)
   - Fetch activity log for all 17 team members
   - Claude generates 17 personalized recap posts
   - Images: Runway Gen-3 generates team member portraits
   - Post to @ZAOfestivals + email via Paragraph
   - **Cost:** Claude $0.02, Runway $0.85 (17 images × $0.05)

**Deliverables by Oct 7:**
- All thank-yous sent
- All recap posts published
- NPS survey distributed (QR + email)

---

### Oct 8-15 (Sponsor ROI Reports + Analytics)

**Wires to activate:**

1. **Sponsor ROI report generation** (Followup doc 20, Pattern 2)
   - Gather data: attendance count (YOLO photo analysis), social mentions (Neynar + X API), photo count with sponsor branding
   - Claude generates 1-page PDF per sponsor
   - Include: "Here's your ROI. Here's Year 2 pricing."
   - **Cost:** Neynar $10 (1000 mentions search), Claude $0.20 (5 reports × $0.04 each)

2. **Post-event analytics dashboard** (Analytics doc 07)
   - YOLO attendance counter on 3 crowd photos (12pm, 2pm, 4pm)
   - Estimate: 380 people ± 50 (confidence 85%)
   - Social reach: aggregate Farcaster mentions + X hashtags + Spotify if tracks released
   - Photo scoring: Claude Haiku ranks 50 photos, top 5 auto-captioned
   - **Cost:** Roboflow free tier, Claude $0.20 (photo batch scoring)

**Deliverables by Oct 15:**
- Sponsor ROI reports delivered + feedback collected
- Analytics dashboard live (attendance estimate + social reach summary)
- Top 5 hero photos auto-ranked + captioned

---

### Oct 16-31 (Content Drip + Year 2 Early-Bird)

**Wires to activate:**

1. **Weekly highlight content** (Followup doc 20, Pattern 3)
   - Week of Oct 16: 1 hero photo + 1 video clip → Claude captions → Firefly post
   - Cadence: 1 post/week through Dec 31 (12 posts total)
   - **Cost:** Claude $0.10 (12 captions × $0.01 each)

2. **Retention prediction** (Community doc 10, Pattern 2)
   - Claude segments 17 team members into cohorts (core, likely, flight-risk, unknown)
   - Generate personalized re-invite emails for each cohort
   - Send staggered: Oct 5, 12, 19, 26 (avoid blast fatigue)
   - **Cost:** Claude $0.01 (one batch segmentation)

3. **Year 2 early-bird campaign** (Followup doc 20)
   - Dec 1: Email blast "ZAOstock 2027 early-bird tickets live Dec 1-15"
   - Dec 1-15: Discord + Farcaster posts (weekly calendar draft)
   - Expected: 50+ early-bird ticket sales = $2500+ revenue signal for Year 2

**Deliverables by Oct 31:**
- Year 1 → Year 2 cohorts identified
- Top 3 "flight-risk" team members in personal calls (1 per week Oct 5-19)
- Retention prediction report delivered to Zaal

---

### Nov 1-Dec 31 (Alumni + Retrospective)

**Wires to activate:**

1. **Alumni network launch** (Community doc 10, Pattern 2)
   - Farcaster channel `@ZAOstock-alumni` created
   - Monthly recap posts (Nov 1, Dec 1) celebrating team + learnings
   - Community milestone tracking (1000 Paragraph followers, first song drops, etc.)

2. **Financial reconciliation** (Budget doc 08)
   - Aggregate all receipts, final expense total
   - Reconcile sponsor commitments vs actual payment
   - Claude generates post-event financial summary
   - **Cost:** Claude $0.05

3. **Year in Review post** (Followup doc 20)
   - Dec 31: Claude generates "2026 Year of ZAOstock" recap
   - Metrics: 380 attendees, 17 team, 10 artists, $18K raised
   - Celebrate wins + document lessons
   - Post to all platforms + newsletter

**Deliverables by Dec 31:**
- Financial reconciliation complete
- Alumni network active (monthly posts)
- Year in Review published + shared
- Year 2 planning begin (kickoff Jan 2027)

---

## TIMELINE SUMMARY TABLE

| Phase | Dates | Key Milestones | Owner | P0 Wires |
|-------|-------|----------------|-------|----------|
| **A** | Apr 23-28 | Bangor Savings outreach, 12+ artists wishlist, SignUp.com live | Zaal + Eng | Sponsor enrichment, artist discovery, volunteer matching |
| **B** | May 1-31 | 8+ artists "interested", 3-5 sponsors "in_talks", 15-20 volunteers assigned | Zaal | Artist outreach, deal scoring, Volunteer reminders |
| **C** | Jun 1-30 | 10 artists confirmed + contracts, 20 volunteers shifted, 50+ posts scheduled | Zaal + Team | Stage plots, voice logging, content calendar |
| **D** | Jul 1-31 | Tech riders in, stage plot finalized, run-of-show locked | Team | Rider intake, transitions, WaveWarZ integration |
| **E** | Aug 1-31 | $18K+ committed, artist brand packs live, volunteer training | Zaal | Sponsor final push, content approval live |
| **F** | Sep 1-Oct 2 | Feature freeze (Sep 15), artist hard cutoff (Sep 3), dry runs | Team | Analytics setup, final contingency planning |
| **G** | Oct 3 | Festival day: voice logging, real-time SMS, photo live-posting | Zaal + Volunteers | Day-of ops, incident triage, social amplification |
| **H** | Oct 4-Dec 31 | Thank-yous, ROI reports, Year 2 early-bird, alumni launch | Zaal + Claude | Recap posts, retention prediction, drip content |

---

## IF I ONLY HAVE 2 HOURS THIS WEEK

**Single highest-impact task:** Complete Bangor Savings Bank end-to-end by EOD Thursday Apr 25.

1. **30 min:** Sign up Clay.com, get API key, add to env
2. **15 min:** Search Clay for "Bangor Savings Bank VP Marketing" — screenshot email
3. **10 min:** Prompt Claude with that email + Zaal's brief → generate 3 email options
4. **10 min:** Pick best draft, Zaal reviews, minor edits
5. **10 min:** Create sponsor in SponsorCRM, log "contacted" status + email, set follow-up for May 2
6. **15 min:** Send email Friday morning (Apr 25)

**Why:** Proves entire sponsor pipeline (enrichment → drafting → logging → follow-up) works. De-risks the other 19 leads. Gives Zaal confidence in the system.

**By May 1:** Replicate for 4-5 more leads in parallel. That's your ROI proof.

---

## COST SUMMARY: ALL 10 CRITICAL WIRES

| Wire | Dimension | Cost | Timeline |
|------|-----------|------|----------|
| Clay enrichment | Sponsor (01) | $200/mo | Apr 28 |
| Claude email drafting | Sponsor (01) | $0.05 | Apr 28 |
| Webhook logging | Sponsor (01) | $0 | Apr 28 |
| Neynar discovery | Artist (02) | $0 | Apr 28 |
| Volunteer matching | Volunteer (03) | $0.02 + $99 SignUp | May 5 |
| Energy optimization | Run-of-Show (04) | $0.02 | May 12 |
| Voice logging + triage | Day-of (05) | $30 Deepgram + $2 Claude | May 12 |
| Content calendar | Social (06) + Calendar (17) | $0.20 Claude | May 19 |
| Budget OCR + forecasting | Budget (08) | $0.01 Claude + $1 Twilio | Jun 2 |
| Recap + retention | Community (10) + Followup (20) | $0.92 + $0.01 Claude | Jun 9 + Oct 4 |
| **TOTAL** | | **~$335** | **Oct 3** |

**Plus contingent costs:**
- Volunteer SMS reminders: $0.45 (60 SMS × $0.0075)
- Post-event analytics: $1.80 (Rekognition + Claude vision)
- Sponsor ROI reports: $0.20 (Claude generation)
- Stage plot extraction: $0.15 (Claude Vision × 10 riders)
- **Contingent subtotal:** ~$2.60

**GRAND TOTAL: ~$338 AI spend for 163-day festival production**

(Clay is the big item; everything else is pennies. ROI: 35+ hours saved × $50/hr = $1750+ in team time, before sponsor upside.)

---

## LAUNCH CHECKLIST

- [ ] **Today (Apr 23):** Review this timeline with Zaal (30 min sync)
- [ ] **Tomorrow (Apr 24):** Zaal starts Bangor Savings test (sign Clay, enrich, draft, send)
- [ ] **Apr 28:** Phase A complete (all 3 wires shipped + tested)
- [ ] **May 5:** Phase B Week 1 complete (artist discovery active, volunteer matching live)
- [ ] **May 12:** Energy optimizer + voice logging running
- [ ] **May 19:** Content calendar drafted, 50+ posts queued for approval
- [ ] **Jun 30:** Dashboard + integrations live, artist contracts signed
- [ ] **Aug 31:** All team assigned + trained, volunteer shifts locked, content live
- [ ] **Sep 15:** Feature freeze (no new builds after this)
- [ ] **Oct 2:** All dry-runs complete, day-of ops ready
- [ ] **Oct 3:** Festival day (all systems live)
- [ ] **Oct 4:** Thank-yous + recaps auto-generated + posted
- [ ] **Oct 15:** Sponsor ROI reports delivered
- [ ] **Dec 31:** Year in Review published, Year 2 early-bird campaign live

---

## KEY ASSUMPTIONS

1. **Artist lockin Sep 3 hard cutoff** is immovable (doc 472). If we miss it, lineup incomplete.
2. **Volunteer team = 20 confirmed by Aug 31.** Below that, Zaal + Candy need to recruit aggressively.
3. **Budget = $18K+ committed by Aug 15.** Below that, scope contracts (fewer artists, smaller stage, etc.).
4. **Zaal bandwidth = 10 hrs/week max through July, 5 hrs/week Aug-Sep.** All AI wires are "Zaal-light" (approval, not creation).
5. **No new major scope changes after May 15** (artist roster, sponsor count, volunteer team size set).
6. **Weather contingency = Wallace Events tent available, $1200 cost conditional** on Oct 1 forecast >50% rain.

---

## RELATED DOCUMENTS

- **Doc 270:** ZAOstock Planning (master budget + timeline)
- **Doc 472:** Artist Lockin Timeline (Sep 3 hard cutoff reference)
- **Doc 473:** Magnetic Portal (Tyler's content weekly drip, feeds artist discovery + sponsor spotlights)
- **Doc 476:** Apr 22 Team Recap (roster + decisions)
- **Doc 477:** Dashboard Notion-Replacement (Phase 1 shipped, Phases 2-5 mapped)
- **Docs 01-20:** All AI-assist dimension research (this timeline synthesizes all)

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 23, 2026 | Initial synthesis: 10 critical wires, 8 phases, 170-day timeline |

---

*Single source of truth for "what to build and when" from Apr 23 - Oct 3, 2026.*
*Zaal: Print this, read the "CRITICAL PATH" section daily through May 15. After that, you're in execution mode — check back weekly.*

