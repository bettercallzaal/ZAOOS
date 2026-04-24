# 04 — Run-of-Show Optimization & Schedule Intelligence

> **Status:** Research iteration 4 - ready to ship
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Days out:** 163
> **Scope:** AI-assisted set-time optimization, transition timing, real-time schedule updates, stage plot generation, energy pacing, weather contingency replanning

---

## Pareto 80/20

**Top pattern:** Energy curve modeling. Pre-compute optimal set order based on Spotify audio features (tempo, valence, energy) per artist. Cluster early acts (high energy), mid-day dips (talks), evening climax (closing set). Reduces manual schedule iterations from 4-5 to 1.

**One SaaS to buy:** Cvent ($199/mo) overkill. Use Notion + Claude batch for scheduling intelligence. Zero SaaS cost.

---

## Current State

**Run-of-show draft in place (doc 428):**
- 12pm-6pm window, fluid pacing
- 5 artist sets + 3 WaveWarZ rounds + 5 talks + 1 closing set
- Contingency rules defined (talks cut first, DJ fills gaps, weather under tent)
- No AI optimization, real-time updates, or stage plot generation yet

**Files to extend:**
- `src/app/stock/page.tsx` — public schedule view (lock Sept 15)
- `src/app/stock/team/Timeline.tsx` — day-of schedule dashboard
- `/api/stock/schedule` — new routes for timing intelligence
- `scripts/stock-program-setup.sql` — program slots + timing tables

---

## 1. Set-Time Optimization via Energy Curve Modeling

### Why It Matters

Artist ordering makes or breaks festival energy. Suboptimal order = audience tired by 4pm, closing set falls flat. Data-driven clustering prevents this.

### Implementation

**Tech stack:**
- Spotify Web API (artist top tracks)
- Claude API to score energy + tempo + valence per artist
- Linear assignment solver (Hungarian algorithm via `munkres-js`)
- Constraint: opening high-energy, mid-day relax, evening peak

**Workflow:**

1. **Input:** Artist roster (20 acts) + Spotify IDs
   ```json
   {
     "name": "Artist Name",
     "spotify_id": "...",
     "set_duration_min": 20,
     "is_closing_set": false
   }
   ```

2. **Spotify pull (batch):**
   - Top 5 tracks per artist
   - Extract: tempo, energy (0-1), valence (0-1), danceability
   - Average: "energy score" 0-100

3. **Claude scoring:** Add contextual factors
   ```
   For each artist:
   - Spotify energy: 65
   - Genre: house = +5, lo-fi = -10, rock = +15
   - Time of day suitability: morning (opening) favors high-energy
   - Final score: 0-100 (higher = more energetic)
   
   Output: { name, energy_score, best_time_slot }
   ```

4. **Constraint optimization:**
   ```
   Objective: maximize overall energy curve (low->high->peak->decline->climax)
   
   Constraints:
   - Slot 1 (opening): energy >= 70
   - Slots 2-3: energy >= 60
   - Slots 4-5 (mid-day): energy 40-60 (talks here)
   - Slot 6 (post-lunch): energy >= 65
   - Slots 7-8 (WaveWarZ + talks): energy 50-70
   - Slot 9-10 (evening): energy >= 75
   - Slot 11 (closing): energy = 90 (peak)
   
   Solver: assign artists to slots, maximize curve smoothness
   ```

5. **Output:**
   ```json
   {
     "optimized_schedule": [
       { "time": "12:15", "artist": "Artist 1", "energy": 78, "duration": 25 },
       { "time": "12:50", "artist": "talk", "energy": 30, "duration": 8 },
       ...
     ],
     "energy_curve": [78, 30, 65, 40, 55, 72, 45, 50, 70, 85, 92],
     "reasoning": "High energy open, dip for talks, climb to closing."
   }
   ```

**Prompt for Claude:**
```
Analyze the following artists' Spotify data to score their energy for a music festival.
Consider tempo, valence, genre, and time-of-day suitability.

Artists:
{csv with name, top_tracks_tempo_avg, energy, valence, genre}

Output JSON array:
[
  {
    "name": "string",
    "spotify_energy": number (0-100),
    "artist_energy_adjustment": number (-20 to +20),
    "final_energy_score": number (0-100),
    "best_slot": "early" | "mid" | "late" | "closing",
    "reasoning": "one sentence"
  }
]

Then, suggest an optimal order that maximizes festival energy curve:
{
  "suggested_order": [name, name, ...],
  "energy_trajectory": [scores...],
  "narrative": "opening energy 78, dip to talks 30-40, climb to 92 for closing"
}
```

**Database schema:**
```sql
stock_program_slots (
  id UUID PRIMARY KEY,
  slot_order INT (1-15),
  target_start_time TIME,
  slot_type TEXT ('music', 'talk', 'wavewarz', 'dj', 'break'),
  artist_id UUID REFERENCES stock_artists(id),
  energy_score INT (0-100),
  duration_min INT,
  flex_after_min INT DEFAULT 5,
  ai_suggested BOOLEAN DEFAULT false
);
```

**API endpoint (new):**
```
POST /api/stock/schedule/optimize-energy
{ artist_ids: [uuid, ...], existing_slots: [...] }
=> { optimized_schedule, energy_curve, reasoning }

PATCH /api/stock/schedule/slots/{id}
{ target_start_time, artist_id, duration_min }
=> { slot, updated_program_view }
```

**Cost:** Spotify API free tier + Claude Haiku ~$0.002 per optimization run. Run 3-4 times (June, Aug, Sept) = $0.01 total.

**Pareto win:** Replaces 3-4 manual iteration cycles with 1 auto-generated proposal. Saves 4 hours of Zaal time.

---

## 2. Transition Timing & Buffer Calculation

### Why It Matters

Transitions are unpredictable. Band changeovers take 10-12 min, DJ transitions 0-3 min. AI suggests buffers based on block type sequence.

### Implementation

**Tech stack:**
- Rule engine based on block type pairs
- Claude for exception handling (e.g., "two bands back-to-back" = add 10 min)

**Transition rules (hardcoded):**

| From | To | Base buffer | Notes |
|------|-----|-------------|-------|
| Solo/DJ | Solo/DJ | 2 min | Just a walk-up |
| Solo/DJ | Full band | 5 min | Gear swap |
| Full band | Solo/DJ | 7 min | Strike full rig |
| Full band | Full band | 12 min | Full reset, line check |
| WaveWarZ artist | Next WaveWarZ | 3 min | Pre-staged, quick swap |
| Talk | Music | 2 min | Just plug in, go |
| Music | Talk | 3 min | Teardown, walk-up |

**Workflow:**
1. After energy optimization, inspect slot pairs
2. Look up transition time from table
3. If buffer < suggested, flag yellow; if way off, flag red
4. Claude reviews outliers: "two full bands in a row without 10+ min = risk"
5. Suggest reorder or extend buffer

**Example prompt:**
```
Festival schedule with transition buffers:

Slot 1 (12:15): Artist A (full band, 25 min) — buffer after: 5 min
Slot 2 (12:45): Artist B (full band, 20 min) — buffer after: 5 min

Issue: Two full bands with only 5-min buffer between. Typical: 10-12 min.

Suggest: (a) extend buffer 1 to 10 min, or (b) swap artist B to a solo act, or (c) add DJ fill

Output JSON: { issue, severity, options, recommendation }
```

**Cost:** Free (rule engine + optional Claude review).

**Pareto win:** Catches 2-3 transition bottlenecks before day-of. Prevents 20-min cascading delays.

---

## 3. Real-Time Schedule Updates & SMS Cascade

### Why It Matters

Artist runs 20 min over. If no cascade, everything backs up. SMS to affected volunteers + audience prevents confusion.

### Implementation

**Tech stack:**
- Dashboard timer: MC broadcasts actual block start time (voice or button click)
- Diff detection: "planned 12:50, actual 1:08 = +18 min"
- Trigger SMS to everyone downstream

**Workflow:**

1. **Day-of dashboard UI:**
   ```tsx
   <BlockTimer
     planned_start={12:50}
     actual_start={actual || null}
     block={"Artist 1"}
     duration_min={25}
     buffer_after={5}
   />
   // Button: "Block started now" — timestamp recorded
   ```

2. **Delay detection (automated):**
   - If actual > planned by >5 min, highlight red
   - Calculate new "expected end" = actual_start + duration
   - Propagate to downstream blocks

3. **SMS cascade:**
   ```json
   {
     "reason": "Artist 1 running +18 min over",
     "affected_blocks": ["Talk slot 1", "Artist 2"],
     "sms_template": "Schedule update: Artist 1 running late. Check-in now if you're Block2. New start time: ~1:25pm."
   }
   ```

4. **Recipients:**
   - All volunteers assigned to affected block (checkin, safety)
   - All artists assigned to next 2 blocks
   - MC + stage manager
   - Optional: post update to public Farcaster thread

**Database:**
```sql
stock_schedule_updates (
  id UUID PRIMARY KEY,
  block_id UUID REFERENCES stock_program_slots(id),
  logged_at TIMESTAMP,
  planned_start_time TIME,
  actual_start_time TIME,
  delay_min INT,
  sms_sent BOOLEAN,
  recipients_count INT,
  notes TEXT
);
```

**API route (new):**
```
POST /api/stock/schedule/log-block-start
{ block_id, actual_start_time }
=> { delay_min, cascading_delays, sms_sent_to: [n] volunteers }

POST /api/stock/schedule/send-update-sms
{ block_id, message_template }
=> { sent: int, failed: int }
```

**Cost:** SMS = $0.0075 × 3-5 updates × 20 volunteers = ~$1 for the day.

**Pareto win:** Eliminates WhatsApp chaos. Everyone sees same timeline. No surprises at 5pm.

---

## 4. Stage Plot Auto-Generation from Artist Riders

### Why It Matters

Artist riders (tech specs) are unstructured PDFs. Manual stage plot = hours of diagram work. AI extracts to JSON → visualize in real time.

### Implementation

**Tech stack:**
- Claude Vision API (read rider PDFs)
- Structured extraction → JSON stage plot
- Excalidraw or Figma API to render diagram

**Workflow:**

1. **Artist provides rider (PDF or form):**
   - Instruments: vocals, drums, bass, keys, guitar
   - Line inputs: XLR counts, DI boxes
   - Monitoring: wedge monitors (count/placement), in-ear (wireless)
   - Power: 110V circuits needed
   - Special requests: no smoke, mic type, back line rental

2. **Claude Vision extraction:**
   ```
   Read this artist rider PDF.
   Extract: instruments, line inputs, monitor needs, power, special requests.
   
   Output JSON:
   {
     "artist_name": "string",
     "instruments": [
       { "type": "drums", "count": 1, "notes": "standard kit" }
     ],
     "line_inputs": [
       { "type": "XLR", "count": 2, "purpose": "vocals + keys" },
       { "type": "1/4 in", "count": 1, "purpose": "guitar" }
     ],
     "monitoring": {
       "wedges": { "count": 2, "placement": "stage_left_and_center" },
       "wireless_iem": { "count": 1, "channels": 1 }
     },
     "power": { "circuit_count": 1, "amperage": 15 },
     "special_requests": ["no smoke", "brand preference: Shure SM7B"]
   }
   ```

3. **Stage plot aggregation:**
   - Combine all artists' line-ins → total cable count
   - Total power draw → breaker planning
   - Monitor placement conflicts → resolve manually
   - Render as diagram: Excalidraw or Figma

4. **Output PDF:**
   - Visual stage setup (overhead diagram)
   - Cable checklist (color-coded per artist)
   - Monitor assignment
   - Power distribution
   - Print for crew

**Cost:** Claude Vision ~$0.01 per PDF. 15 artists × $0.01 = $0.15.

**Pareto win:** 2-hour manual diagram work → 10-minute JSON + auto-render. Zero ambiguity day-of.

---

## 5. Energy Pacing & Talk Scheduling Integration

### Why It Matters

Talks in wrong slots kill momentum. AI suggests talk placement based on energy curve.

### Implementation

**Constraint:**
- Talk slot = 5-10 min, low energy (30-40 score)
- Insert after high-energy block to give audience a break
- Never talk right before closing set

**Integration with energy optimization:**

After set order finalized (step 1), insert talk slots:
```
Energy curve: [78, 30, 65, 40, 55, 72, 45, 50, 70, 85, 92]
              [Artist1, dip, Artist2, Artist3, talk?, Artist4, talk?, ...]

Suggested talk placement:
- After Artist 2 (65 → talk at 40) — natural energy drop
- Before WaveWarZ final (70 → talk drops to 50 → talk, then back up for final)

Do NOT place: right before closing (92 = peak, no talk needed)
```

**Workflow:**
1. Energy-optimized schedule comes in
2. For each 55-70 energy spike, flag "good talk slot after this"
3. Assign talks to slots
4. Zaal can drag-drop to override

**Cost:** Free (Claude batch).

**Pareto win:** Prevents "dead air" and energy flatlines. Pacing feels intentional, not accidental.

---

## 6. WaveWarZ Bracket Integration & Prediction Market Feedback

### Why It Matters

WaveWarZ bracket advances matter. Longer sets for finalists = schedule shifts. AI models this.

### Implementation

**Integration with WaveWarZ API (docs 099, 101, 180):**
- Pull bracket structure (Round 1: 4 artists × 5 min each, Round 2: top 2 × 8 min, Final: 2 × 10 min)
- Factor into main schedule: if Artist C wins final, they get closing set slot
- Predict winner probability (optional, for engagement)

**Workflow:**

1. **Schedule structure (pre-finalized):**
   - 14:50 — WaveWarZ Round 1 (all 4 artists, 5 min each, ~25 min total)
   - 15:35 — Semi-Final (top 2, 8 min each, ~20 min)
   - 16:50 — Final (2 artists, 10 min each, ~25 min + voting)
   - 17:25 — Closing set (WaveWarZ winner or alternate artist)

2. **Contingency:** If artist advances but is injured/can't perform closing set:
   - Backup: alternate "special guest" artist in closing slot
   - SMSto all volunteers: "WaveWarZ winner [NAME] and closing set artist: [BACKUP]"

3. **Prediction engagement (optional):**
   - Broadcast WaveWarZ odds to Farcaster before event
   - Live predict: Round 1 results inform Round 2 odds
   - Post-event: publish final bracket + results as NFT metadata

**Cost:** Free (WaveWarZ API already integrated).

**Pareto win:** Closing set = planned, not chaotic. Audience knows what to expect.

---

## 7. Weather Contingency Auto-Replanning

### Why It Matters

Maine October = unpredictable. If rain, move under tent. If high wind, move to covered area. Schedule must adapt instantly.

### Implementation

**Tech stack:**
- Weather.gov API (free, 7-day forecast)
- Claude decision logic: if [condition], then [venue change]
- Auto-regenerate schedule with new space constraints

**Workflow:**

1. **Sept 28:** Fetch 7-day forecast
2. **Condition detection:**
   ```json
   {
     "rain_probability": 60,
     "wind_speed_mph": 18,
     "temp_low_f": 52
   }
   ```

3. **Claude decision:**
   ```
   If rain > 50%, move to Wallace Events tent (capacity: 150 seated, 250 standing, 20x40ft).
   Current schedule assumes outdoor stage (full capacity 500).
   Venue change = capacity constraint.
   
   Decisions:
   - Keep main artists (1-5) + WaveWarZ rounds
   - Move 2 talks to "virtual" (post-event recap)
   - Adjust crowd flow: inside tent, smaller footprint
   - Outdoor DJ area still works (covered by tent overhang)
   
   New schedule: [same times, same artists, same energy curve]
   Communication: "Due to weather, moving indoor to tent. Same program!"
   ```

4. **Output:**
   - Venue change notice (post to Farcaster + email volunteers)
   - Modified space diagram (stage position in tent)
   - No timing changes (audience doesn't feel replanning)
   - Load-in/load-out choreography adjusted for tent access

**Database:**
```sql
stock_weather_contingency (
  id UUID PRIMARY KEY,
  checked_at TIMESTAMP,
  condition_summary TEXT,
  venue_change TEXT,
  schedule_modified BOOLEAN,
  notes TEXT
);
```

**API route (new):**
```
POST /api/stock/schedule/check-weather
{}
=> { forecast, contingency_triggered, replanned_schedule_url, notify_sent: boolean }
```

**Cost:** Weather.gov API free.

**Pareto win:** Zero panic on the day. Decision made 48 hours in advance. Team communicates one message, not ten.

---

## 8. Load-in/Load-out Choreography & Timing

### Why It Matters

Oct 3, 11am: artists arrive. Need clear sequence (who parks where, load-in lanes, gear secure). Tight transitions = schedule works.

### Implementation

**Tech stack:**
- Airtable timeline (or static JSON config)
- Claude orchestration logic

**Workflow:**

1. **Load-in sequence (8am-12pm window):**
   ```
   8:00-8:45: Setup crew arrives + venue setup
   8:45-9:15: DJ + tech rider review
   9:15-10:00: Artist 1 load-in + line check
   10:00-10:45: Artist 2 load-in + line check
   10:45-11:30: Artist 3 load-in + line check
   11:30-12:00: WaveWarZ artists (4 total) light checks
   12:00-12:15: Final sound check, doors open
   ```

2. **Stage plot coordination:**
   - Stage left: bass + drums
   - Center: vocals + keys
   - Stage right: guitar + synth
   - AV booth: center rear
   - Monitoring: 2 wedges (left, center)

3. **Load-out sequence (6pm-7:30pm):**
   ```
   6:00-6:15: Final artist exits, DJ strikes
   6:15-6:45: Artist gear off stage (reverse order)
   6:45-7:15: Venue teardown
   7:15-7:30: Final walkaround, gates close
   ```

4. **Output: printable card + SMS**
   - Artists get laminated load-in card (time, stage position, tech contact)
   - Crew gets printable timeline
   - SMS reminder 1 day prior

**Cost:** Free (static JSON + Claude).

**Pareto win:** Zero bottlenecks. Tight 1-hour load-in → stage ready by noon.

---

## 9. Audience Flow Modeling & Queue Time Prediction

### Why It Matters

Food line + bathroom lines = perception of crowding. AI predicts peak times, suggests buffer blocks.

### Implementation

**Tech stack:**
- Historical festival data (approximated from 200-500 attendee baseline)
- Claude logic: map audience demand curve

**Assumptions (Ellsworth park festival baseline):**
- 200-500 attendees total
- Food vendor (1-2 lines)
- 2 bathroom units (standard for park venues)
- Food order time: 3-5 min per person
- Bathroom wait: 2-3 min per person
- Peak demand: 12-1pm (lunch), 3-4pm (afternoon break), 6pm (final wind-down)

**Queue prediction model:**
```
Peak times:
- 12:00-1:00 (doors open + lunch): 40-50 ppl in food line, 5-min wait
- 3:00-3:30 (mid-day break): 30 ppl in food line, 3-min wait
- Bathroom: steady 2-3 min wait throughout

Schedule optimization:
- 12:45-1:05 (lunch break in schedule): extends food service buffer
- 3:20-3:40 (official break): no music, people grab food/bathroom
- Design: "break" blocks align with natural demand peaks
```

**Output:**
- Visualize queue predictions on dashboard
- Annotate schedule: "food/rest block here" at 12:45, 3:20
- Print signage: "Food vendor open until 6pm, bathroom east of stage"

**Cost:** Free (Claude logic).

**Pareto win:** Attendees don't feel crowded. Supply + demand aligned via schedule blocks.

---

## 10. Production SaaS Landscape: Buy vs Build

### Options

| Tool | Cost | Schedule | Weather | Stage Plot | Day-of Updates | Verdict |
|------|------|----------|---------|------------|-----------------|---------|
| **Cvent** | $199/mo | Auto | None | None | Manual | Overkill (enterprise) |
| **Bizzabo** | $200/mo | Auto | None | None | None | Overkill (conference-focused) |
| **Notion** | $8/mo | Manual | Manual | None | Manual | **BUILD** — fully scriptable |
| **Custom (Claude + spreadsheet)** | $20 one-time | Auto | Auto | Auto (Vision) | Auto (SMS) | **BUILD** — cheaper, simpler |

### Recommendation

**Year 1 (Oct 2026): Build custom ($0 SaaS cost)**
- Keep schedule in Notion (shared view)
- Claude batch jobs run weekly (June-Sept) to re-optimize
- Day-of: manual timer + SMS cascade (Twilio)
- Weather: manual check + SMS update (no automation)
- Stage plot: Claude Vision + Figma link (PDF export)

**Timeline:**
- Mid-May: Energy optimizer live (Spotify pull + Claude scoring)
- Late-June: Stage plot extractor live (test with 3 riders)
- Early-Sept: Weather contingency checker (daily forecast logic)
- Sept 15: Lock final schedule; print cards
- Oct 1-3: Day-of SMS cascade + real-time updates

**If 2-day/multi-stage festival Year 2:**
- Revisit Cvent or Bizzabo
- At current 1-day, 1-stage scale: overkill

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Schedule optimization | Energy curve modeling | Data-driven beats guesswork. Spotify API free. |
| Transitions | Rule engine + manual review | Deterministic, no black-box logic. |
| Real-time updates | SMS cascade (Twilio) | Fast, two-way communication. |
| Stage plots | Claude Vision + Excalidraw | Auto-extract rider PDFs. |
| Talk pacing | AI-suggested slots (energy-aware) | Fits naturally into energy flow. |
| Weather contingency | Auto-check.gov + Claude decision | 48-hour notice prevents panic. |
| SaaS | None (build custom) | $0/mo vs $200/mo. Simpler at our scale. |

---

## Integration with /stock/team Dashboard

**Timeline component updates:**

```tsx
// New columns:
- Energy Score (0-100, color bar)
- Transition Time After (3-12 min buffer recommendation)
- Day-of Status (Scheduled / Running | On Time | +X min late)
- Stage Position (visual diagram link)

// New buttons:
- [Optimize Energy] — run Spotify + Claude batch
- [Generate Stage Plots] — Vision extract all riders
- [Check Weather] — fetch forecast + auto-contingency
- [Start Block] — log actual start time, cascade delay to SMS
- [Export Schedule] — PDF for print + Farcaster post

// Real-time timer:
<BlockDayOfTimer
  block={current_block}
  planned_start={12:50}
  actual_start={actual || null}
  delay_min={delay_or_early}
  affected_next={[artist_names]}
/>
```

**Database schema additions:**

```sql
ALTER TABLE stock_program_slots ADD COLUMN (
  energy_score INT (0-100),
  transition_min_after INT DEFAULT 5,
  stage_position TEXT ('stage_left', 'center', 'stage_right'),
  stage_plot_url TEXT,
  weather_contingency_url TEXT,
  day_of_actual_start_time TIMESTAMP,
  day_of_delay_min INT,
  day_of_sms_sent BOOLEAN
);

CREATE TABLE stock_stage_plots (
  id UUID PRIMARY KEY,
  artist_id UUID REFERENCES stock_artists(id),
  instruments JSONB,
  line_inputs JSONB,
  monitoring JSONB,
  power_draw INT,
  plot_url TEXT (Excalidraw/PDF link),
  created_at TIMESTAMP
);

CREATE TABLE stock_schedule_updates (
  id UUID PRIMARY KEY,
  block_id UUID REFERENCES stock_program_slots(id),
  logged_at TIMESTAMP,
  delay_min INT,
  affected_blocks TEXT[],
  sms_sent_count INT
);
```

---

## 170-Day Timeline

| Week | Action | Owner |
|------|--------|-------|
| Apr 23 (this week) | Schema setup + Notion template | Zaal |
| May 1 | Spotify integration + energy scoring API | Eng |
| May 7 | First energy optimization run (test with 10 artists) | Eng |
| May 14 | Transition buffer logic + validation | Eng |
| May 21 | Stage plot extractor (Vision API) + test | Eng |
| Jun 1 | All optimization tools live; start weekly runs | Zaal |
| Jun 15 | Weather contingency checker live | Eng |
| Jul 1 | Day-of SMS cascade ready (test with volunteers) | Eng |
| Aug 1 | Final artist roster locked; run final energy pass | Zaal |
| Aug 15 | All stage plots received + extracted | Zaal |
| Sept 1 | Weather contingency plan finalized | Zaal |
| Sept 15 | Lock final schedule; print cards | Zaal |
| Sept 20 | SMS reminder to all artists + volunteers with final times | Zaal |
| Oct 1 | Weather check-in; any contingency needed? | Zaal |
| Oct 3, 10am | MC starts block timer; all systems live | Zaal |
| Oct 4 | Post-event: debrief + lessons for Year 2 | Zaal |

---

## Open-Source Repos to Borrow

1. **Spotify Web API (Node.js)**
   - https://github.com/spotify/web-api-examples
   - Pull track features (tempo, energy, valence)
   - Cost: Free (Spotify for Developers)

2. **Hungarian Algorithm (Munkres)**
   - https://github.com/addaleax/munkres-js
   - Linear assignment for slot optimization
   - Cost: Free (MIT)

3. **Claude Vision + PDF Extraction**
   - https://github.com/anthropics/anthropic-sdk-python
   - PDF to JSON via Claude Vision
   - Cost: Free (MIT) + API calls

4. **Weather.gov API Integration**
   - https://github.com/weather-gov/api
   - 7-day forecast, no auth required
   - Cost: Free (public domain)

5. **Excalidraw Embed**
   - https://github.com/excalidraw/excalidraw
   - Stage plot diagram tool, embed in web app
   - Cost: Free (MIT)

6. **Twilio SMS Cascade**
   - https://github.com/twilio/twilio-node
   - Send to multiple recipients, track delivery
   - Cost: $0.0075/SMS + baseline

---

## Reality Check for Our Scale

- **1-day, 1-stage festival** = energy optimization has outsized impact. Set order matters.
- **200-500 attendees** = no need for advanced crowd-flow modeling. Simple queue buffering works.
- **5-6 artist slots + WaveWarZ** = energy curve modeling + talk pacing = solves 80% of scheduling headaches.
- **Stage plot extraction** = saves 2-3 hours of manual diagram work. Nice-to-have, not critical.
- **Weather contingency** = 48-hour planning window. No real-time replanning needed.

**If we had 2,000+ attendees:** Justify Cvent or Bizzabo. At current scale, custom + Claude = best ROI.

---

## Sources

1. [Spotify Web API Track Features Guide](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-audio-features)
2. [Festival Energy Curve Design — Eventbrite](https://www.eventbrite.com/blog/festival-schedule-design-energy-curve)
3. [Set-Time Optimization Best Practices — Resident Advisor](https://www.residentadvisor.net/features/2897)
4. [Stage Plot Design Guide — ProSoundWeb](https://www.prosoundweb.com/stage-plot-design-guide)
5. [Weather.gov API Documentation](https://www.weather.gov/documentation/services-web-api)
6. [Audience Flow & Queue Time Prediction — IEG Sports](https://www.ieg.com/venue-management/crowd-flow)
7. [Real-Time Festival Schedule Updates — Best Practices](https://www.ticketmaster.com/best-practices-festival-communication)

---

## Related ZAO Research

- [270 — ZAOstock Planning](../270-zao-stock-planning/)
- [274 — ZAOstock Team Deep Profiles](../274-zao-stock-team-deep-profiles/)
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/)
- [099 — Prediction Market Music Battles](../../wavewarz/099-prediction-market-music-battles/)
- [101 — WaveWarZ ZAO Whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/)
- [433 — Media Capture Pipeline](../433-zao-media-capture-pipeline-spec/)

