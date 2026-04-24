# 07 - Post-Event Analytics + Attribution

> **Status:** AI-assist research for ZAOstock
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Ellsworth ME · 163 days out
> **Goal:** Design analytics dashboard + data capture to measure ZAOstock impact, sponsor ROI, and artist visibility, feeding post-event reports back to sponsors and team learning

---

## Executive Summary: 80/20 Moves

**Top 3 AI wires to ship first:**

1. **RSVP-to-attendance matcher** (Claude vision on crowd photos + YOLO detector) - correlate stock_volunteers + event_rsvps to actual count, gives sponsors immediate "show rate" proof
2. **Multi-source engagement indexer** (Neynar API + X API v2 + post-event survey → Claude synthesis) - aggregate all touchpoints (Farcaster mentions, X hashtags, Spotify streams if music dropped, form responses) into one post-event report
3. **Photo batch visual scorer** (Claude Haiku vision in parallel) - ingest all media from stock_attachments, auto-rank by "most shareable" + generate captions for 5-10 hero shots within 48 hours of festival

**Skip these (vanity/overkill at our 50-150 person scale):**
- Complex cohort ML (who came back from 2025 event) - we're year 1, no historical baseline yet
- Weather impact modeling - single-day event, limited data points
- Predictive attendance forecasting - better solved with simple rolling average + Bayesian update from sponsor pipeline

---

## Problem Statement

ZAOstock will host 50-150 people (estimate from comparable Ellsworth events + Birding Man baseline). After the event, sponsors want proof: "How many people came? Where were they from? Did they engage? What was sentiment?" Today that's manual survey + anecdotal feedback.

We need a **post-event analytics layer** that:
- Counts actual attendance (not RSVP count)
- Attributes attendance to sponsors (Magnetic portal QR → brand loyalty)
- Aggregates social reach (posts, mentions, streams, sentiment)
- Produces a sponsor-facing PDF report within 48-72 hours
- Feeds learnings into Year 2 ZAOstock planning

**Key constraints:**
- Small sample (50-150 people), not 5000. Bayesian priors matter more than BigData.
- No historical ZAO event data yet. Can only compare to external benchmarks (Birding Man from doc 418, other Ellsworth events).
- Sponsor list likely 3-7 partners. ROI report needs to be simple, not overwhelming.
- Team is small (17 active). Manual tagging / survey distribution must be lightweight.

---

## Key Decisions & Recommendations

| Decision | Choice | Why |
|----------|--------|-----|
| Attendance counting | Hybrid: YOLO crowd detector on 5-10 photos + manual sampling | Two photos at 12pm, 2pm, 4pm by official videographer. Claude vision runs `inference.roboflow.com` Crowd Counter API on each. Report average ± margin of error. Manual count on arrival + departure gates (2 people = ~5 min) as backup. |
| RSVP attribution | Farcaster FID + wallet from event_rsvps → match to Magnetic portal + wallet-connected sponsor perks | See doc 476 (sponsor scavenger hunt). If attendee came via Magnetic QR + spent USDC, that's sponsor attribution. |
| Social engagement | Neynar API (Farcaster) + X API v2 (Twitter) + Spotify API (if any tracks released) | Query: mentions of #ZAOstock, #Art of Ellsworth, artist names, 3 days pre + 7 days post. Track impressions, engagement rate, sentiment (Claude classifies replies). |
| Survey method | Typeform or Tally, 5 questions, QR at exit + email followup | Questions: 1) Overall experience (NPS), 2) Which artist was your favorite, 3) Will you come back to a ZAO event?, 4) What sponsor activated for you?, 5) Email + wallet (optional, for Year 2 targeting) |
| Sentiment analysis | Claude Haiku on sample of Farcaster replies + survey free-text | Batch 50 replies at $0.01 per 1K input tokens. 5 categories: positive, neutral, negative, question, spam. |
| Photo scoring | Claude Haiku vision on batch of stock_attachments (all approved media) | For each: "Is this photo shareable on social media? Rate 1-5." Run in parallel across 10 photos at a time. Rank results, auto-caption top 5. |
| Report distribution | PDF via sponsor portal + email + Farcaster channel post | Tailored per sponsor: their logo on cover, their attributed attendees + engagement data in section 2, recommendations for Year 2 in section 3. |
| Cost model | ~$30-50 post-event analytics spend (Claude API + APIs) | Crowd Counter API: $0-5 (included in free tier), Neynar: $10 (first 1000 /feed calls free, then $0.01/call after), X API v2 Academic: free, Typeform: free tier, Claude API: ~$20-30 for 1000+ batch photo inferences + survey text analysis. Spotify API: free. |
| Timeline | Begin survey design now, capture RSVP data from day 1, run analytics 48h post-festival | Oct 3 evening: videographer uploads photos to stock_attachments. Oct 4 9am: run YOLO + survey distribution. Oct 5 5pm: compile report. Oct 6 morning: deliver to sponsors. |

---

## Integration Points: Dashboard & Database

**Existing foundation (doc 477):**
- `stock_rsvps` table: FID, wallet, timestamp, sponsor_source
- `stock_volunteers` table: volunteer_id, role, hours, status
- `stock_attachments` table: file_url, uploader_fid, caption, approval_status (Phase 1 shipped in doc 477)

**New tables + API routes to add:**

```sql
-- Post-event analytics
CREATE TABLE stock_analytics_attendance (
  id UUID PRIMARY KEY,
  method TEXT, -- 'yolo_photo', 'manual_gate', 'survey_response'
  count INT,
  confidence_pct INT, -- e.g., 85
  sampled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE stock_analytics_social (
  id UUID PRIMARY KEY,
  platform TEXT, -- 'farcaster', 'x', 'spotify'
  metric TEXT, -- 'mentions', 'impressions', 'reach', 'streams'
  count INT,
  sentiment_positive INT,
  sentiment_neutral INT,
  sentiment_negative INT,
  sampled_date DATE,
  query_tag TEXT, -- '#ZAOstock', artist name, etc.
  created_at TIMESTAMPTZ
);

CREATE TABLE stock_analytics_sponsor_attribution (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES stock_sponsors,
  attendee_fid INT,
  attendee_wallet TEXT,
  attribution_method TEXT, -- 'magnetic_qr', 'usdc_spend', 'survey_response'
  engagement_points INT, -- sum of actions attributed to sponsor
  created_at TIMESTAMPTZ
);

CREATE TABLE stock_analytics_photo_scores (
  id UUID PRIMARY KEY,
  attachment_id UUID REFERENCES stock_attachments,
  shareability_score INT, -- 1-5
  auto_caption TEXT,
  ranked_position INT,
  created_at TIMESTAMPTZ
);

CREATE TABLE stock_post_event_surveys (
  id UUID PRIMARY KEY,
  respondent_fid INT,
  respondent_email TEXT,
  overall_nps INT,
  favorite_artist TEXT,
  return_interest BOOLEAN,
  sponsor_engaged TEXT,
  free_text TEXT,
  created_at TIMESTAMPTZ
);
```

**API routes (to add to `/api/stock/`):**

```
POST /api/stock/analytics/attendance
  - Input: method, count, confidence, notes
  - Creates stock_analytics_attendance record
  - Triggers: recompute attendance_estimate in stock_events

PATCH /api/stock/analytics/attendance/:id
  - Update count, confidence as manual counts come in

POST /api/stock/analytics/social/sync
  - Calls Neynar API + X API v2 for mentions
  - Parses results, runs Claude sentiment on sample
  - Creates stock_analytics_social records

POST /api/stock/analytics/photos/score
  - Input: batch of attachment IDs
  - Calls Claude Haiku vision on each
  - Stores shareability_score, auto_caption
  - Returns ranked list for team

POST /api/stock/analytics/surveys/import
  - Pulls Typeform/Tally webhook data
  - Creates stock_post_event_surveys records
  - Runs Claude Haiku NLP on free_text (sentiment, intent)

GET /api/stock/analytics/report/:sponsor_id
  - Generates JSON: sponsor name, attributed headcount, engagement metrics, sentiment summary
  - Returns as JSON (then frontend renders + PDFs)
```

**Dashboard additions to `/stock/team`:**

- **Analytics Card** (new tab): Shows attendance estimate, confidence band, social reach summary, top 3 photos
- **Sponsor ROI View**: For each sponsor, shows headcount + engagement. Link to full report PDF.
- **Post-Event Survey Results**: Chart of NPS, favorite artist breakdown, return interest %.

---

## Reference Tools & Open Source

**Attendance Counting:**
- [Roboflow Crowd Counter](https://github.com/roboflow/supervision) — YOLO wrapper, works on static images. Python + API. $0-5 depending on volume. Model: `roboflow/crowd-counting-v2`
- [MediaPipe Solutions](https://github.com/google/mediapipe) — Open source pose detection, can count people via upper body keypoints. No cost.
- [OpenCV background subtraction](https://docs.opencv.org/3.4/d1/dc5/tutorial_background_subtraction.html) — Old-school but effective for static-camera crowd estimation. No cost.

**Social Engagement:**
- [Neynar API](https://docs.neynar.com/) — Farcaster mentions, user profiles, casts (free tier: 1000 calls/day)
- [X API v2](https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query) — Tweet search, academic access free. Query: `("ZAOstock" OR "#ZAOstock") -is:retweet` 
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) — Track releases, artist streams, playlist adds. Free tier OK.

**Survey & Sentiment:**
- [Typeform API](https://www.typeform.com/developers/) — Pull responses programmatically, free tier
- [Tally webhooks](https://tally.so/) — Even lighter, direct webhook to our DB
- Claude Haiku (in-house) — Classify survey sentiment, extract themes, generate summaries

**Photo Curation:**
- [Roboflow Autodistill](https://github.com/roboflow/autodistill) — Auto-label images with Claude, build custom models. $0-50 depending on volume.
- [Clarifai](https://www.clarifai.com/) — Image tagging + moderation. Free tier up to 5000 images/month.
- [AWS Rekognition](https://aws.amazon.com/rekognition/) — Similar but paid.

**Report Generation:**
- [Puppeteer](https://github.com/puppeteer/puppeteer) — Headless Chrome, render HTML → PDF. Open source.
- [ReportLab](https://www.reportlab.com/) — Python library, generate PDFs programmatically. Open source.
- [Mermaid.js](https://mermaid.js.org/) — Embed charts in Markdown or HTML, auto-render to images.

---

## Data Flow: 7 Days Before to 7 Days After

```
Oct 1 (Mon): Setup
  - Deploy survey (Typeform QR codes printed, arrive at venue Oct 2)
  - Brief videographer: "Take 1 photo at 12pm, 2pm, 4pm for crowd count"
  - Set up Magnetic portal if not done (see doc 476)

Oct 3 (Wed): Festival Day
  - 12:00-17:30: Continuous capture (stock_attachments receives photos/video)
  - 16:00: Survey QR at exit + emailed to all RSVPs with farcaster_fid on file
  - 18:00: Videographer uploads final photos to stock_attachments

Oct 4 (Thu): First-pass analysis
  - Morning: Run `/api/stock/analytics/attendance` with 3 crowd photos + manual gate count
  - Morning: Run `/api/stock/analytics/photos/score` to rank all media
  - Morning: Run `/api/stock/analytics/social/sync` to pull Farcaster + X mentions (3-day lookback)

Oct 5 (Fri): Synthesis + report
  - Morning: Pull Typeform/Tally results, run sentiment on free-text
  - Morning: Run `/api/stock/analytics/sponsor_attribution` to match attendees to sponsors
  - Afternoon: Generate sponsor reports (tailored PDF per partner)
  - Evening: Post summary to Farcaster channel

Oct 10 (Wed): 1-week reflection
  - All stakeholders read report, comment in Discord
  - Compile learnings for Year 2 planning doc

Oct 15+: Archive
  - Move all analytics data to research/ folder for post-mortem
  - Create "ZAOstock Year 1 Post-Event Report" doc (public)
```

---

## Cost Breakdown

| Item | Est. Cost | Notes |
|------|-----------|-------|
| Crowd Counter API (Roboflow) | $0-5 | Free tier covers ~5 inference calls |
| Neynar API (Farcaster sentiment + reach) | $10 | Free tier covers 1000 calls; we use ~20 |
| X API v2 (Twitter search) | $0 | Academic access, free |
| Spotify API (track metadata) | $0 | Free tier |
| Claude Haiku (batch photo + survey analysis) | $20-30 | ~1000 images @ 15KB avg = ~15M tokens input, sentiment on 50 survey responses = ~2K tokens. Total: ~0.02-0.03 per call, 1000 calls = $0.02-0.03/call * 1000 = $20-30 |
| Typeform | $0 | Free tier (25 responses) |
| Puppeteer (report PDF generation) | $0 | Open source, self-hosted |
| **Total** | **~$30-50** | Well within pilot budget |

---

## Success Metrics

By Oct 10, 2026:

1. **Attendance accuracy**: Published attendance estimate ± margin of error (target: 10% margin) vs. actual manual count
2. **Survey completion**: ≥30% of attendees respond (50-100 person event, want 15-30 responses)
3. **Social reach**: Published total Farcaster impressions + X reach from festival mentions (target: ≥1000 impressions)
4. **Photo archive**: ≥30 photos approved + ranked by shareability (target: 5+ "hero shots" for Year 2 marketing)
5. **Sponsor attribution**: ≥5 attendees matched to each sponsor (validates Magnetic portal + sponsor booths)
6. **Report delivery**: Sponsor PDF delivered within 72h of festival
7. **Team learning**: 3+ specific actions identified for Year 2 (e.g., "open ceremony at 12:00 pulled 20% of crowd early, schedule it later next year")

---

## Timeline to Ship

**This week (Apr 23-25):**
- Finalize survey questions in Typeform (Candy or volunteer)
- Generate QR codes, print + laminate (1 for exit, 1 for email follow-up)
- Create API skeleton: `/api/stock/analytics/attendance`, `/api/stock/analytics/photos/score`

**By Sep 15 (2 weeks pre-festival):**
- Test Roboflow crowd detection on sample park photos
- Test Neynar + X API queries with dummy hashtags
- Brief videographer on photo timing (12pm, 2pm, 4pm)

**By Oct 2 (1 day pre-festival):**
- Deploy all API routes
- Load survey URL into Typeform integration
- Print QR codes, prepare sponsor report template

**Oct 4-10 (post-festival):**
- Run analytics per data flow above
- Compile + deliver sponsor reports

---

## What This Feeds Into

- **Doc 270 (ZAOstock Planning)**: Year 2 budget + timeline refinement
- **Doc 274 (Team Profiles)**: Updated role definitions for analytics lead (DCoop / Candy for Year 2)
- **Doc 477 (Dashboard)**: Phase 3 expansion to include analytics views
- **Public post-mortem**: Doc to publish for community, "How many? Who came? What's next?"

---

## Open Questions

1. **Consent**: Do we need explicit photo consent from attendees for crowd counting via YOLO? (Recommend: yes, add to waiver/survey)
2. **Sponsor confidentiality**: Should individual sponsor ROI be private or shared with other sponsors? (Recommend: private, only team sees)
3. **Artist metrics**: Should we track which artists got most Farcaster mentions? How to attribute artist-specific social reach? (Recommend: yes, useful for artist recruitment Year 2)
4. **Year 2 comparison**: Should we freeze "ZAOstock Year 1" baseline now so Year 2 comparisons are meaningful? (Recommend: yes, save all Oct 2026 data as immutable archive)

---

## Sources

- [Roboflow Blog: Crowd Counting](https://blog.roboflow.com/crowd-counting-video-analytics/)
- [Neynar API Documentation](https://docs.neynar.com/)
- [X Academic Research Access](https://developer.twitter.com/en/products/twitter-api/academic-research)
- [Birding Man 2025 Analysis](../418-birding-man-festival-analysis/) — comparable small festival, used manual surveys only
- [ZAO Media Capture Pipeline Spec](../433-zao-media-capture-pipeline-spec/) — upstream; feeds attachment data
- [ZAOstock Dashboard Notion-Replacement Build](../477-zaostock-dashboard-notion-replacement/) — Phase 1 shipped, this doc extends with analytics views
