# 02 - Artist Discovery + Booking AI for ZAOstock

> **Status:** Active research
> **Date:** 2026-04-22
> **Festival:** Oct 3, 2026 - Franklin Street Parklet, Ellsworth ME
> **Target:** 10-artist lineup locked by Sep 3
> **Days out:** 163
> **Owner:** DCoop (music 2nd), Zaal (festival lead)

---

## The Bottleneck

The single most valuable AI capability for ZAOstock is NOT artist vetting or travel logistics — it's finding 10 artists fast. The timeline is brutal: first-contact window closes May 15, interested-confirmation window closes June 1, confirmed list v1 published June 30. That's 54 days to build a 10-artist shortlist that passes the team's bar.

Current discovery is: DCoop + Zaal mining Farcaster, Spotify playlists, and personal networks. That works for 3-4 artists. For the other 6-7, AI can run parallel discovery tracks without human bottlenecking.

---

## Discovery Strategy (14 angles)

### 1. Farcaster-Native Artist Discovery (HIGHEST PRIORITY)

**Pattern:** ZAO community + adjacent music builders on Farcaster are the easiest-to-reach artists. Neynar API query for casts mentioning music + performance + Maine yields existing relationships.

**Tools:**
- Neynar API `/search/casts` — free tier, 100 calls/day
- Neynar `/user/details` — get user metadata (bio, verified, follower count)
- Manual Farcaster search: channel `/music`, `/zealy`, `/salsa`, `/soundjam`

**Implementation:**
```
Query: casts in last 30d where 
  (text contains "music" OR "perform" OR "artist" OR "song")
  AND author.bio contains (Maine OR "folk" OR "electronic" OR "indie")
  AND author.verified_pfp = true
  
Filter by:
  - Follower count 100+
  - Has linked Spotify / Bandcamp / SoundCloud in profile
  - Engagement (replies/recasts > 10 in last month)
```

**Cost:** Free (Neynar free tier)

**Reality check:** Will yield 10-15 qualified leads. Sufficient for 50% of lineup.

**Integration:** Add `/api/stock/artist-discovery/farcaster` route that:
- Runs weekly
- Inserts discovered artists into `stock_artists` with status="wishlist"
- Tags with `source=farcaster_discovery`
- Links verified username in `socials` field

**Timeline:** Ship this week. It's the ROI leader.

---

### 2. ZAOCHELLA Miami Cipher Feed (SECOND PRIORITY)

**Pattern:** The ZAOCHELLA Miami cipher (10 artists, recorded Dec 2024, pending release) is a ready-made ZAO artist roster. Cross-promote these artists for ZAOstock, get two events per artist.

**Implementation:**
- Extract artist names from the Cipher credits (GodCloud has the metadata)
- Query Spotify / SoundCloud for each cipher artist's recent releases
- Rank by: recency, streams, Farcaster mentions

**Sources:**
- Zaal's Cipher notes
- ZAOCHELLA attendance data (doc 270, 364)
- Artist social handles from ZAO roster

**Cost:** Free

**Timeline:** This week. Already have the data.

**Reality check:** Yields 3-5 confirmed circulars. Huge PR value ("full-circle: ZAOCHELLA artists at ZAOstock").

---

### 3. Spotify API: Genre + Local Discovery

**Pattern:** ZAO community members who are published on Spotify are searchable by genre, release date, country. Filter for: folk/indie/experimental/electronic artists in Maine or with Maine connections + released in last 2 years.

**Tools:**
- Spotify Web API `/search` endpoint
- Filters: genre, country code (US-ME), isrc code
- Chartmetric for deeper A&R intel (optional)

**API quota:** 180,000 requests/hour (per app). Safe for small batch discovery.

**Pricing:**
- Spotify Web API: free (requires user OAuth login, but ZAO can register an app)
- Chartmetric Developer API: $350-500/month (overkill for 10-artist fest; skip for now)

**Reality check:** Spotify's Feb 2026 API lockdown makes deep data (artist popularity, playlists) require Extended Quota (250K MAU minimum). For ZAOstock, free tier is insufficient.

**Verdict:** DEFER. Use only if team has artists to verify, not for pure discovery.

---

### 4. Bandcamp Artist Discovery (LOW PRIORITY)

**Pattern:** Maine has a vibrant DIY music scene on Bandcamp. Scrape Bandcamp for artists tagged "Maine", "folk", "experimental", sort by recent release + play count.

**Tools:**
- `bandcamp-fetch` (open-source JavaScript library)
- `bandcamp-scraper` (npm package)
- Apify actor: Bandcamp scraper ($5-20 per actor run)

**Implementation:**
- Query artists tagged "Maine" + "folk" OR "indie" OR "electronic"
- Extract: name, bandcamp URL, recent release, play count, contact email
- Enrich with social handles via Apollo/Hunter (see angle 5)

**Cost:** $0 (open-source) or $5-20 (Apify if doing at scale)

**Reality check:** Will yield 5-10 local Maine artists. Lower quality (fewer streams) than Spotify, but authentic local discovery. Good for "bring back Maine roots" narrative.

**Verdict:** LOW PRIORITY. Use if after May 1 we need backup artists.

---

### 5. Contact Enrichment (Manager / Agent Email Finding)

**Pattern:** Once you have an artist name, find their manager's email. Apollo, Hunter, Clay all do this.

**Tools:**
- Hunter.io (finds email from domain + name)
  - Pricing: Free tier (10/month), Pro ($99/month)
- Apollo.io (B2B database + enrichment)
  - Pricing: Free tier (50/month), Pro ($49-99/month)
- Clay (AI-driven data marketplace; integrates both)
  - Pricing: Free tier + credits per data enrichment
- In-house script: Spotify artist page -> manager contact info (parse artist bios, links)

**Reality check:** Most Maine artists don't have managers. Email will be personal. Hunter/Apollo work best for touring acts with booking agents.

**Verdict:** SKIP for ZAOstock. Direct artist outreach (Farcaster DM, email from Bandcamp) is faster than enrichment.

---

### 6. Songkick + Bandsintown: Tour History

**Pattern:** Artists on these platforms link tour dates, venue history, and upcoming shows. Can filter for artists who toured Maine in past 2 years (higher chance of repeating).

**Tools:**
- Songkick API (Concerts and Festivals endpoint)
- Bandsintown API (artist events + venue data)

**API pricing:**
- Songkick: free (limited), pro plans $500+/month
- Bandsintown: free for artists, API available

**Reality check:** Neither platform has a "find touring artists in Maine" query. You'd need to:
1. Get list of Maine venues from both platforms
2. Query each venue's tour history
3. Rank artists by repeat visits

**This is a 2+ hour manual task for 10 artists. Not worth it.**

**Verdict:** SKIP. Better to ask DCoop "which artists have you seen tour Maine?"

---

### 7. AI-Assisted Artist Vetting (Music Quality Assessment)

**Pattern:** Once you have a shortlist, use LLM + music analysis to score artists on: production quality, genre fit, live-performance readiness, community engagement.

**Tools:**
- Prompt-based LLM scoring: send artist bio + Spotify link + Farcaster cast summary to Claude/GPT, get structured rubric
  - Rubric: Production Quality (1-10), Genre Fit for festival (1-10), Live Stage Fit (1-10), Community Reach (1-10)
  - Cost: ~$0.01-0.05 per artist (Claude API)
- Essentia.js (open-source audio analysis library)
  - Analyzes tempo, rhythm, mood from audio samples
  - Can download sample track, analyze locally
  - Cost: Free (CPU time)

**Implementation:**
```typescript
// Prompt template for artist vetting
const artistVettingPrompt = `
Artist: [name]
Bio: [bio from Spotify / Bandcamp]
Recent releases: [list of 3 latest tracks]
Farcaster presence: [sample of recent casts, @handle]
Festival goal: 10-artist all-day lineup at Franklin Street Parklet
Festival audience: mixed (Maine locals + ZAO community, zero blockchain knowledge required)

Score this artist 1-10 on:
1. Production quality (technical execution, mixing)
2. Genre fit (complement existing lineup)
3. Live stage readiness (can they carry 30min solo set?)
4. Community alignment (do they fit ZAO ethos?)

Output: JSON { production: N, genre_fit: N, stage_ready: N, alignment: N, reasoning: "" }
`;
```

**Cost:** ~$0.50 for 10 artists (Claude API), ~$2 if using GPT-4

**Reality check:** Works. Not a replacement for human ear — team MUST listen to 30-60sec sample before offer. But saves time on obviously unsuitable artists.

**Verdict:** DEFER until shortlist is locked (June 1). Use for final cut.

---

### 8. First-Contact Message Drafting (Personalization)

**Pattern:** For each artist, generate a personalized outreach message that references:
- Their recent release
- Why they fit ZAOstock (genre, community, Maine connection)
- What it means to play at Oct 3 event

**Tools:**
- Claude API: `messages` endpoint with artist context
- Template: "Dear [artist], we loved your [track name]. ZAOstock is..."

**Implementation:**
```typescript
const outreachTemplate = `
Generate a 3-sentence personalized outreach email for:
- Artist: [name]
- Latest release: [track title, release date]
- ZAOstock context: 10-artist festival, Oct 3, Franklin Street Parklet, Ellsworth Maine
- Festival vibe: [music-first, community-built, zero blockchain required]

Requirements:
- Mention specific track or artist achievement
- Position Oct 3 as meaningful (not just "we want you")
- Close with clear ask ("can you play?" / "interested?")
- Keep under 150 words
- Tone: friendly, not corporate

Output: raw email text, ready to paste
`;
```

**Cost:** ~$0.01 per email (Claude API, small context)

**Timeline:** May 1-15 (during first-contact window)

**Reality check:** Increases reply rate vs. generic outreach. Zaal should review / edit before sending.

**Verdict:** USE. Low cost, high ROI on reply rates.

---

### 9. Rider + Contract Intake (LLM Extraction)

**Pattern:** Artist submits PDF technical rider (gear, sound, lighting, merch). LLM extracts structured fields into `stock_artists.rider` JSON.

**Tools:**
- PyPDF2 / pdfplumber (Python, extract text from PDF)
- Claude API with `application/pdf` input (native PDF support)
- Zod schema for validation

**Implementation:**
- Artist uploads rider PDF via dashboard attachment panel (already live, doc 477)
- Trigger `/api/stock/artist-rider-intake` with file ID
- LLM extracts: stage_size, sound_requirements, lighting_needs, merch_space, special_requests, contact_phone
- Save to `stock_artists.rider` JSONB
- Flag for manual review if confidence < 0.8

**Cost:** ~$0.02 per rider (Claude PDF vision)

**Timeline:** July 1-15 (after contract issued, before tech locked)

**Verdict:** USE. Saves 15min manual per artist x 10 = 2.5 hours team time.

---

### 10. Run-of-Show Optimization (Setlist + Energy Curve)

**Pattern:** Given 10 confirmed artists, optimize:
- Set order (front, mid, close)
- Set durations (30min main stage, 15min secondary)
- Energy curve (build, peak, wind down)

**Tools:**
- Prompt-based: send artist names + genres + vibe to Claude, get optimized schedule
- Constraint: "morning = folk/ambient, afternoon = uptempo/electronic, evening = peak energy + headliner"

**Implementation:**
```typescript
const runOfShowPrompt = `
Optimize run-of-show for Oct 3 ZAOstock (all-day festival):
Artists:
1. [name - genre, vibe, set_time]
2. [name - genre, vibe, set_time]
... (10 total)

Constraints:
- Start: 12pm (lunch hour)
- End: 9pm
- 10-min changeover between sets
- Energy curve: build morning (ambient/folk), peak afternoon (uptempo), close (headliner/epic)
- Farcaster-friendly: at least 2 artists from ZAO community at key times

Output: setlist as table [order, time_start, time_end, artist, notes]
`;
```

**Cost:** ~$0.02 (single Claude request)

**Timeline:** Sep 1-10 (after all artists confirmed)

**Verdict:** USE. Saves 1 hour of manual brainstorming.

---

### 11. Travel Logistics AI (Flight + Lodging Search)

**Pattern:** For artists coming from outside Maine, estimate travel cost (flight + 3 nights lodging) and flag budget impact.

**Tools:**
- Skyscanner API / Kiwi.com API (flight search)
- Google Maps API (distance from city to Ellsworth)
- Booking.com API (lodging search, or web scrape)

**Pricing:**
- Skyscanner API: deprecated (use Kiwi.com instead)
- Kiwi.com API: $0.10-0.50 per flight search
- Google Maps: $0.007 per distance request
- Booking.com API: enterprise only, negotiate with sales

**Reality check:** For 10 artists, this is 2-3 searches if most are local. If 5 out of 10 need travel, budget cost = ~$2-5. Not critical.

**Verdict:** SKIP. Zaal can ask artists "where are you based?" and estimate manually. For out-of-state artists, offer 1 hotel room per 2 artists.

---

### 12. SMS Day-of Coordination (Twilio)

**Pattern:** Oct 3, send automated SMS reminders:
- 9am: "Load-in at 11am. Gate A. Contact: Zaal +1-xxx-xxxx"
- 11:30am: "Soundcheck in 15min"
- 30min before set: "You're on in 30min. Good luck!"
- Post-set: "Great set! Check the photo stream [link]"

**Tools:**
- Twilio Programmable Messaging (SMS)
- Scheduled delivery via `/api/sms-schedule`

**Pricing:**
- Twilio: ~$0.0075 per SMS in US
- 10 artists x 4 messages = 40 SMS = ~$0.30

**Implementation:**
```typescript
// Scheduled SMS templates
const artistDayOfSMS = {
  loadIn: "Hey [artist]! Load-in at 11am, Gate A. Contact Zaal: +1-xxx-xxxx. See you soon!",
  soundcheck: "Soundcheck in 15min at Stage A. Any questions, text Zaal.",
  preSets: "You're on in 30min. Good luck! The crowd is ready!",
  postSet: "What a set! Check photos: [link]. Follow [social] to see more."
};
```

**Timeline:** Program Sep 25, test Sep 30, go live Oct 3

**Verdict:** USE. Cheap, reduces day-of chaos.

---

### 13. Branded "Artist Packs" (Apr 21 Brainstorm Follow-up)

**Pattern:** From Apr 21 brainstorm, DCoop pitched 3-artist "brand packs" — curated groups of artists per theme (e.g., "Digital Folk", "Experimental Hardware", "Trap + Ambient"). AI can auto-generate pack pitches + social graphics.

**Tools:**
- Claude API (write pack descriptions)
- Midjourney / Dall-E (generate pack visual, optional)

**Implementation:**
```typescript
const brandPackPrompt = `
Create a "branded artist pack" for ZAOstock Oct 3:
- Artists: [artist1, artist2, artist3]
- Genres: [genre1, genre2, genre3]
- Theme name: [e.g., "Digital Folk", "Experimental Hardware"]
- Description: 2-3 sentences positioning this group for festival goers
- Social copy: 1 tweet

Output: JSON { pack_name, description, social_post, hashtags }
`;
```

**Cost:** ~$0.01 per pack (3-artist grouping x 3-4 packs = $0.03-0.04)

**Timeline:** Sep 1-10 (promote lineup)

**Verdict:** USE. Fits Apr 21 vision, low cost, high social value.

---

### 14. Post-Performance Content + Auto-Share

**Pattern:** After each artist's set, capture photo/video snippets. LLM generates captions + tags artist on Farcaster + links to their Spotify.

**Tools:**
- Photo capture (manual by crew)
- Claude API (generate captions)
- Neynar API (post cast + mention artist)

**Implementation:**
```typescript
const postPerformanceCaption = `
Photo from [artist] live at ZAOstock Oct 3, Ellsworth Maine.
Artist: [handle on Farcaster]
Genre: [genre]
Track playing: [song title, if identifiable]

Generate a 1-tweet caption (max 280 chars) + relevant hashtags.
Tone: celebratory, community-focused.
`;
```

**Cost:** ~$0.01 per post x 10 artists = $0.10

**Timeline:** Oct 3 (live during festival)

**Verdict:** USE. Builds FOMO, drives social amplification post-event.

---

## Key Decisions Table

| Dimension | Tool/Approach | Cost | Difficulty | Timeline | Verdict | Reasoning |
|-----------|---------------|------|-----------|----------|---------|-----------|
| Farcaster discovery | Neynar API search | $0 | Low | This week | USE | ROI leader. 50% of lineup sourced here. |
| ZAOCHELLA artists | Manual roster pull | $0 | Low | This week | USE | Already have data. Huge PR value. |
| Spotify discovery | Spotify Web API | $0 | Medium | DEFER | DEFER | Feb 2026 lockdown kills deep discovery. |
| Bandcamp Maine | bandcamp-fetch lib | $0-20 | Medium | May+ | DEFER | Backup discovery if needed after May 1. |
| Contact enrichment | Hunter/Apollo | $50-100/mo | Low | SKIP | SKIP | Direct outreach faster for small fest. |
| Tour history | Songkick/Bandsintown | $500+ | High | SKIP | SKIP | Manual Q to DCoop is faster. |
| Artist vetting | LLM + rubric | $0.50 | Low | June 1 | USE | Post-shortlist vetting. Not replacement for listening. |
| Outreach drafting | Claude API | $0.10 | Low | May 1-15 | USE | Increases reply rate. Low cost. |
| Rider intake | Claude PDF vision | $0.20 | Low | July 1-15 | USE | Saves 2.5 hours team time. |
| Run-of-show | Prompt-based | $0.02 | Low | Sep 1-10 | USE | Saves brainstorm time. |
| Travel logistics | Kiwi.com API | $2-5 | Low | SKIP | SKIP | Manual estimate faster for 10 artists. |
| SMS coordination | Twilio | $0.30 | Low | Oct 3 | USE | Cheap, reduces day-of chaos. |
| Brand packs | Claude API | $0.04 | Low | Sep 1-10 | USE | Fits Apr 21 brainstorm. High social value. |
| Post-perf content | Claude captions | $0.10 | Low | Oct 3 | USE | Drives social amplification. |

---

## Implementation Roadmap (170 days)

### Week 1 (Apr 22-28) - DISCOVER
- Ship `/api/stock/artist-discovery/farcaster` (Neynar query)
- Manual pull: ZAOCHELLA cipher artists
- Target: 12-15 wishlist artists in dashboard

### Week 2-3 (Apr 29-May 12) - SHORTLIST
- First contact window opens (May 1)
- Use Claude to draft 12 personalized outreach emails
- Zaal + DCoop send + track replies

### Week 4 (May 13-19) - INTERESTED
- First contact window closes (May 15)
- Interested confirmation window opens
- Analyze reply rate, prepare backup discovery (Bandcamp) if needed

### Week 5-6 (May 20-Jun 2) - CONFIRM
- Interested confirmation window closes (June 1)
- Manually vet top 10 using LLM rubric + team listening
- Propose confirmed list v1 to Zaal

### Week 7 (Jun 3-9) - PUBLISH
- Confirmed list v1 published (June 30, timeline says, but early is fine)
- Start contract issuance (July 1)
- Zaal + Tyler prepare partnership agreements + W-9s

### Week 8-10 (Jun 10-Jul 15) - CONTRACTS
- Contracts signed by Aug 1 (hard deadline)
- Tech riders submitted by Aug 15
- Build dashboard "Lockin Risk" column (red/yellow/green per milestone)

### Week 11-14 (Jul 16-Aug 15) - TRAVEL + ASSETS
- Travel locked by Aug 31
- Logos + promo assets delivered by Sep 1
- Begin LLM run-of-show optimization draft

### Week 15 (Aug 16-Sep 3) - LOCKDOWN
- Lockin deadline: Sep 3 (all items done or slot reopens)
- Final run-of-show locked Sep 10
- Generate branded artist packs for social

### Week 16+ (Sep 4+) - AMPLIFY
- Lineup reveal Sep 15 (poster + program live)
- Neynar posts + Farcaster mentions (artist auto-share)
- SMS coordination templates coded (dry-run)

### Oct 3 - FESTIVAL
- SMS reminders sent (9am, 11:30am, 30min pre-set, post-set)
- Photo capture + auto-caption posts to Farcaster

---

## Integration Points

### ArtistPipeline Dashboard (`src/app/stock/team/ArtistPipeline.tsx`)

Add these columns to the kanban:
- `source` (enum: "farcaster_discovery", "zaochella_roster", "team_request", "submission")
- `lockin_risk` (enum: "on_track", "warning", "fired", calculated from timeline milestones)
- `vetting_score` (JSON: { production: N, genre_fit: N, stage_ready: N, alignment: N })
- `rider_extracted` (boolean, links to JSONB rider data)
- `day_of_sms_sent` (datetime array, one per SMS)

### New API Routes

- `POST /api/stock/artist-discovery/farcaster` — weekly Neynar query, insert wishlist
- `POST /api/stock/artist-vetting` — LLM rubric scoring
- `POST /api/stock/artist-rider-intake` — PDF extraction + Zod validation
- `POST /api/stock/artist-runofshow` — optimized schedule generation
- `POST /api/stock/artist-sms-schedule` — Twilio SMS scheduling
- `GET /api/stock/artist-brands` — fetch generated brand packs

### Database Schema Extensions

```sql
-- Add to stock_artists table
ALTER TABLE stock_artists ADD COLUMN source TEXT;
ALTER TABLE stock_artists ADD COLUMN vetting_score JSONB;
ALTER TABLE stock_artists ADD COLUMN rider_extracted JSONB;
ALTER TABLE stock_artists ADD COLUMN day_of_sms_sent TEXT[] DEFAULT '{}';
ALTER TABLE stock_artists ADD COLUMN brand_pack_id UUID REFERENCES stock_brand_packs(id);

-- New table for brand packs
CREATE TABLE stock_brand_packs (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  social_post TEXT,
  artist_ids UUID[] REFERENCES stock_artists(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Open-Source Repos to Borrow

1. **Acai (Open Music Recommendation System)** — https://github.com/BerryAI/Acai
   - Use case: If ZAOstock expands to 30+ artists, Acai can rank artists by fit (similar genre, vibe, audience overlap)
   - Cost: Free (MIT licensed)

2. **bandcamp-fetch** — https://github.com/patrickkfkan/bandcamp-fetch
   - Use case: Mine Maine Bandcamp artists by tag
   - Cost: Free (MIT)

3. **Essentia.js** — https://github.com/mtg/essentia-js
   - Use case: Audio analysis for production quality scoring (optional, if team wants detailed beat analysis)
   - Cost: Free (AGPL)

4. **Neynar SDK (TypeScript)** — https://github.com/neynarxyz/farcaster-examples
   - Use case: Already documented. Direct Farcaster discovery.
   - Cost: Free (MIT)

5. **Awesome Music** — https://github.com/noteflakes/awesome-music
   - Use case: Curated list of music APIs, tools, resources. Reference for discovering new angles.
   - Cost: Free (reference)

---

## Cost Summary (Total AI Spend, 170 days)

| Tool | Per-unit | Quantity | Total |
|------|----------|----------|-------|
| Neynar API (free tier) | $0 | 10+ calls/week x 24 weeks | $0 |
| Claude API (artist discovery, vetting, outreach, riders, runofshow, packs, captions) | $0.01-0.05 | ~100 calls total | $2-5 |
| Twilio SMS | $0.0075 | 40 SMS (day-of) | $0.30 |
| **TOTAL** | | | **$2.30-5.30** |

Low-cost approach. No subscriptions needed.

---

## The Human Decision That AI Can't Answer

**Question:** "Which 6 artists, from a shortlist of 20, should we actually pay to play?"

This is the decision that matters. AI can:
- Find artists fast
- Draft outreach
- Score vetting rubrics
- Optimize schedules

AI cannot:
- Predict whether an artist's 30-second SoundCloud demo will translate to a 30-minute live set at a parklet in Maine
- Understand whether their vibe matches the community (ZAO members + Maine locals)
- Gauge whether they'll be a "good human" to work with (responsive, reliable, no drama)
- Make the call: "This artist is worth budget Y over budget Z"

That decision belongs to **Zaal + DCoop**, listening to full tracks, checking Farcaster history, maybe jumping on a 10min call. AI should surface the candidates fast. Humans decide.

---

## Sources

- Neynar API docs: https://docs.neynar.com/docs/how-to-get-trending-casts-on-farcaster
- Spotify Web API (Feb 2026 changes): https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Bandcamp scraping: https://github.com/patrickkfkan/bandcamp-fetch
- Chartmetric pricing: https://chartmetric.com/pricing
- Songkick API: https://www.songkick.com/developer
- Bandsintown API: https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api
- Clay / Hunter / Apollo integrations: https://www.clay.com/integrations/data-provider/apollo-io
- Twilio SMS: https://www.twilio.com/docs/messaging
- LLM music evaluation: https://arxiv.org/html/2412.06617v1
- ZAO Music entity (doc 475): /research/music/475-zao-music-entity
- ZAOstock timeline (doc 472): /research/events/472-zaostock-artist-lockin-timeline
- Artist Pipeline dashboard (src/app/stock/team/ArtistPipeline.tsx)
- Acai recommendation system: https://github.com/BerryAI/Acai

---

## Next Steps (This Week)

1. **Zaal + DCoop sync** — review Farcaster query + ZAOCHELLA roster pull
2. **Ship Neynar discovery route** — `/api/stock/artist-discovery/farcaster`
3. **Populate wishlist** — insert 12-15 artists into dashboard
4. **Parallel:** Draft outreach emails (manual Claude run, not yet automated)
5. **May 1:** First-contact window opens. Send emails. Track replies.

---

**Next dimension:** 03-volunteer-ai.md (recruitment + skill matching)
