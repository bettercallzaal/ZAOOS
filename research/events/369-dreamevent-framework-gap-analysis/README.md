# 369 - DreamEvent.ai Framework: What ZAO Stock Is Missing

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Reverse-engineer DreamEvent.ai's event planning framework to find gaps in ZAO Stock planning

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Narrative arc** | CREATE a guest experience narrative for ZAO Stock - arrival to departure, emotional journey, not just a schedule |
| **Visual design system** | CREATE a color palette, typography, decor direction doc BEFORE the brand kit. DaNici needs this as a brief. |
| **Food/bev plan** | DEFINE the food experience - not just "food trucks." What's the vibe? What fits the festival? |
| **Run-of-show** | BUILD a minute-by-minute run of show, not just "12pm-6pm with DJs between." Who does what when. |
| **Guest experience mapping** | MAP the full attendee journey: how they hear about it, arrive, park, enter, eat, watch, interact, leave, share |
| **Staffing assignments** | ASSIGN specific people to specific time blocks on event day, not just "volunteers" |
| **Post-event plan** | DEFINE what happens in the 48 hours after - content push, thank-yous, debrief, data collection |

---

## Framework Comparison: DreamEvent vs. ZAO Stock

### 1. NARRATIVE & THEME

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Event theme/concept | Full theme generation with narrative arc | "Community-built outdoor music festival" | PARTIAL - have the tagline, missing the narrative arc (the emotional journey from arrival to departure) |
| Story/why | Baked into concept | "Zaal bought a house here" + "annual ZAO meeting" | PARTIAL - have the personal story, need it written as a pitch narrative |
| Guest experience vision | Detailed description of what attendees feel/do | Not documented | GAP - no guest experience vision doc |

**What we're missing:** A written narrative arc for the day. Not the schedule - the FEELING. Example:
> "You arrive at the Parklet at noon. The first thing you hear is a DJ set floating across Franklin Street. Picnic tables are full. The smell of wood-fired pizza from Fogtown drifts over. You grab a coffee from Precipice. The first artist takes the stage at 12:30..."

This is what turns a "day of music" into an experience people remember and tell others about.

### 2. PROGRAMMING / RUN OF SHOW

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Minute-by-minute schedule | Full run-of-show with activity sequences | "10 artists, equal sets, DJs between, 12pm-6pm" | GAP - no actual run-of-show with time blocks |
| Transitions | How you move between segments | Not documented | GAP |
| Non-music programming | Activities beyond the stage | Not documented | GAP - what happens besides watching music? |
| MC/host plan | Who introduces artists, keeps energy | Not documented | GAP |

**What we're missing:** A real run-of-show. Example:

| Time | Stage | Activity | Person |
|------|-------|----------|--------|
| 11:00 | Setup | Sound check, stage setup | Ops team |
| 11:45 | Open | Doors open, DJ warmup begins | Stilo World |
| 12:00 | Stage | Welcome + MC intro | Zaal |
| 12:10 | Stage | Artist 1 set (25 min) | TBD |
| 12:35 | Stage | DJ transition (10 min) | Stilo World |
| 12:45 | Stage | Artist 2 set (25 min) | TBD |
| ... | ... | ... | ... |
| 5:30 | Stage | Final artist set | TBD |
| 5:55 | Stage | Closing remarks + thank-yous | Zaal |
| 6:00 | Move | Walk to Black Moon (30 sec) | Everyone |
| 6:15 | Black Moon | After-party begins | Steve Peer hosts |

### 3. FOOD & BEVERAGE

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Menu concept | Full F&B plan with visual previews | "Food trucks, Fogtown pizza nearby" | GAP - no defined food experience |
| Beverage plan | Drink options, bar setup | "Black Moon has craft beer" | GAP - is there a bar at the Parklet? Just water? |
| Dietary considerations | Allergies, vegan, etc. | Not documented | GAP |
| Water/hydration | Stations, availability | Not documented | GAP - 6 hours outdoors in October needs water |

**What we're missing:** A food plan that's part of the experience, not an afterthought. Questions to answer:
- Is there a bar at the Parklet or just at Black Moon after?
- Water station? Who provides it?
- Are food trucks confirmed or just hoped for?
- Budget for artist/team meals?

### 4. VISUAL DESIGN

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Color palette | Generated with theme | ZAO navy/gold exists, no festival-specific palette | PARTIAL |
| Typography | Font selections | Not documented for festival | GAP |
| Decor direction | What the space looks like, feel | Not documented | GAP - what does the Parklet LOOK like on event day? |
| Signage plan | Wayfinding, branding, sponsor visibility | Not documented | GAP |
| Stage design | What the stage looks like | Not documented | GAP |
| Photo backdrop | Where people take photos to share | Not documented | GAP - this drives social sharing |

**What we're missing:** A visual brief for DaNici. Not just a logo - what does the SPACE look like? Banners? Signage? Stage backdrop? Photo spot?

### 5. GUEST MANAGEMENT

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| RSVP/ticketing | Invitation + RSVP tracking | RSVP form on /stock page (Supabase) | COVERED |
| Arrival experience | How guests enter, first impression | Not documented | GAP |
| Wayfinding | How guests find parking, venue, food, bathrooms | Not documented | GAP |
| Accessibility | ADA, mobility, sensory | Not documented | GAP |
| Departure | How the event ends, what guests take home | Not documented | GAP |

**What we're missing:** A guest journey map:
1. **Hear about it** - social media, press, MCW listing, word of mouth
2. **RSVP** - zaoos.com/stock form (have this)
3. **Arrive** - where do they park? How do they find Franklin St?
4. **Enter** - is there a check-in? Do they get a wristband? POAP scan?
5. **Orient** - where's the stage, food, bathrooms, water?
6. **Experience** - watch music, eat, meet people, buy merch
7. **Capture** - where do they take photos? What's shareable?
8. **Leave** - how does the event end? Walk to Black Moon? What do they take home?
9. **Share** - what do they post? What hashtag? Where's the recap?
10. **Return** - how do you keep them engaged for Year 2?

### 6. BUDGET MANAGEMENT

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Budget by category | Auto-generated breakdown | budget.md with categories | COVERED |
| Targets vs. actuals | Tracking actual spend | Not tracked yet (nothing spent) | FUTURE |
| Revenue tracking | Income by source | Listed in budget.md but no tracking | GAP - need a live revenue tracker |

### 7. STAFFING & OPERATIONS

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Staff assignments by time block | Who does what, when | Teams defined, no time-block assignments | GAP |
| Volunteer roles | Specific job descriptions | "15-20 volunteers" but no role definitions | GAP |
| Day-of communication | How team communicates during event | Not documented | GAP - walkie-talkies? Group chat? |
| Emergency plan | What if someone gets hurt, weather, power failure | Weather backup (tent) mentioned, no emergency plan | GAP |

### 8. VENDOR COORDINATION

| Dimension | DreamEvent Covers | ZAO Stock Has | Gap |
|-----------|------------------|---------------|-----|
| Vendor list with status | Tracked by category | vendors.md exists | COVERED |
| Vendor contracts | Agreements, terms | Not documented | GAP |
| Load-in/load-out schedule | When vendors arrive, set up, leave | Not documented | GAP |

### 9. POST-EVENT (DreamEvent doesn't cover this well either)

| Dimension | ZAO Stock Needs | Status |
|-----------|----------------|--------|
| Content push (photos, video, recap) within 48 hours | Mentioned in press timeline | PARTIAL |
| Thank-you messages to sponsors, artists, volunteers | Not documented | GAP |
| Debrief with team | Not documented | GAP |
| Data collection (attendance count, social reach, revenue) | Not documented | GAP |
| Year 2 planning trigger | "Start planning Year 2" in timeline | PARTIAL |

---

## The 10 Things ZAO Stock Should Build Next (From This Analysis)

1. **Guest Experience Narrative** - the emotional arc of the day, written as a story
2. **Minute-by-Minute Run of Show** - every time block, every person, every transition
3. **Visual Design Brief for DaNici** - not just a logo, but what the SPACE looks like
4. **Guest Journey Map** - arrival to departure, 10 steps
5. **Food & Beverage Plan** - specific trucks/partners, water station, artist meals
6. **Staffing Grid** - who does what, which hours, day-of communication plan
7. **Volunteer Role Definitions** - specific jobs with descriptions
8. **Signage & Wayfinding Plan** - parking, venue, food, bathrooms, stage, photo spot
9. **Emergency/Contingency Plan** - weather, medical, power, no-show artist
10. **Post-Event Playbook** - content push, thank-yous, debrief, data, Year 2 trigger

---

## What DreamEvent Gets Right That We Should Steal

1. **Start with the feeling, not the logistics.** Their first output is a narrative arc, not a task list. We jumped straight to teams and tasks.
2. **Visual design is a first-class concern.** They generate mood boards before vendor lists. We have no visual brief.
3. **The guest IS the product.** Every dimension is oriented around the attendee experience. Our planning is oriented around team operations.
4. **Budget is live, not a static doc.** Targets vs. actuals tracked in real-time. Our budget.md is a snapshot.
5. **Run-of-show is the backbone.** Not the timeline (months out) - the actual minute-by-minute day-of plan.

---

## Comparison: Event Planning Completeness

| Dimension | DreamEvent | ZAO Stock | Notion (if added) |
|-----------|-----------|-----------|-------------------|
| Theme/narrative | 10/10 | 4/10 | 6/10 (manual) |
| Run of show | 9/10 | 2/10 | 7/10 (timeline view) |
| Food/bev | 8/10 | 2/10 | 5/10 (database) |
| Visual design | 9/10 | 3/10 | 5/10 (mood board page) |
| Guest journey | 7/10 | 3/10 | 6/10 (manual) |
| Budget tracking | 8/10 | 5/10 | 7/10 (table) |
| Staffing/ops | 7/10 | 4/10 | 7/10 (assignments) |
| Vendor mgmt | 7/10 | 5/10 | 7/10 (database) |
| RSVP/ticketing | 6/10 | 7/10 | 5/10 |
| Team collaboration | 5/10 | 6/10 | 9/10 |
| Web3/onchain | 0/10 | 8/10 | 0/10 |
| Community governance | 0/10 | 9/10 | 0/10 |

**ZAO Stock's biggest gaps: narrative (4/10), run-of-show (2/10), food (2/10), visual design (3/10)**
**ZAO Stock's biggest strengths: Web3 (8/10), governance (9/10), RSVP (7/10)**

---

## ZAO Ecosystem Integration

- Guest experience narrative: write as `ZAO-STOCK/planning/experience.md`
- Run of show: write as `ZAO-STOCK/planning/run-of-show.md`
- Visual brief: write as `ZAO-STOCK/planning/visual-brief.md`
- Guest journey map: add to `ZAO-STOCK/planning/experience.md`
- Staffing grid: write as `ZAO-STOCK/planning/staffing.md`
- Emergency plan: write as `ZAO-STOCK/planning/contingency.md`

---

## Sources

- [DreamEvent.ai](https://dreamevent.ai/)
- [AI Event Planning Tools 2026 - Unite.AI](https://www.unite.ai/best-ai-tools-for-event-planning/)
- [How to Use AI for Event Planning - Whova](https://whova.com/blog/ai-event-planning/)
- Existing ZAO Stock planning docs: `ZAO-STOCK/planning/`, `ZAO-STOCK/standups/dashboard.md`
