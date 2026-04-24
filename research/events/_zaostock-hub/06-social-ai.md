# 06 — Social Media Amplification

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Pre-event drip + day-of live coverage + post-event recap
> **Payoff:** 500+ engaged pre-event followers by Oct 3, 30+ posts across 4 platforms Oct 3-4, 1-2 viral clips post-event
> **Core insight:** Magnetic portal (doc 473) handles collectible engagement. This doc handles press + growth — the external megaphone.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Pre-event countdown posts** (14 posts across 14 days, Aug 20 - Oct 3, AI-drafted from doc 473 calendar + artist bios)
2. **Day-of live photo → caption → post** (photographer uploads → Claude captions → Firefly cross-posts to Farcaster + Twitter + Bluesky in <2min)
3. **Post-event highlight reel** (24-48 hours post, 30-60 sec reel from videos + photos using iMovie + Claude direction or RunwayML)

Everything else is "nice to have" — these three give 80% of the reach with 20% of the effort.

---

## Pre-Event Countdown (14 Posts)

### Phase: Aug 20 - Oct 3 (14 days)

**Schedule:**
| Date | Post type | Hook | Platform |
|------|-----------|------|----------|
| Aug 20 | Countdown start | "Under 45 days to ZAOstock 2026" | FC + Twitter |
| Aug 23 | Artist 1 spotlight | First confirmed artist | FC + Twitter |
| Aug 26 | Sponsor reveal | Thanks message | FC + LinkedIn |
| Aug 29 | Logistics teaser | Practical info | FC + Twitter |
| Sept 1 | Artist 2 spotlight | Different vibe | FC + Twitter |
| Sept 5 | Lineup graphic | All 10 artists | FC + Twitter |
| Sept 8 | Testimonial | Past attendee FOMO | FC + Reels |
| Sept 12 | Volunteer call | Sign-up CTA | FC + Frames |
| Sept 15 | Weather/what to bring | Prep info | FC + Twitter |
| Sept 19 | Artist 3 spotlight | Diversity | FC + Twitter |
| Sept 23 | "One week!" | Countdown + logistics | FC + Twitter + email |
| Sept 26 | Artist 4 spotlight | Diversity | FC + Twitter |
| Sept 28 | Day-of logistics | Reference info | FC + Twitter + Instagram |
| Oct 1 | "48 hours!" | Engagement frame | FC + Farcaster Frame |

**Total reach:** 14 posts × 300-500 followers × 10-20% engagement = 500-1400 engaged people pre-event.

### What Claude does

**Input:** Doc 473 calendar + artist bios from `/stock/team` dashboard + past Farcaster posts about ZAO.

**Process:**
1. Claude reads the calendar entry
2. Drafts 3 options, each 2-3 sentences
3. Suggests a visual
4. Posts to Slack: #social-drafts for Zaal approval

**Example draft:**
```
Under 45 days until ZAOstock 2026 in Ellsworth, Maine.
500+ people. 10 artists. One night that proves web3 music is about community first.
---
Visual: Sunset over Franklin St Parklet
Platforms: Farcaster, Twitter
```

**Tools:**
- **Claude API** (text generation) — 14 posts × ~600 tokens = ~$0.06
- **Firefly API** — cross-platform posting (already integrated)
- **Slack bot** — draft approval workflow

**Timeline:**
- **Week of July 7:** Claude drafting pipeline
- **Week of July 28:** Draft all 14 posts
- **Aug 20:** First post live; schedule remaining 13

**Cost:** Claude $0.10

---

## Day-of Live Coverage

### Phase: Oct 3, 1pm - 9pm

**Core loop (every 30-60 min):**
1. Photographer uploads to S3
2. AI auto-tags + rates photos
3. Top photo selected (4-5 stars)
4. Claude captions: "Artist X bringing energy to 300+ ZAOstock attendees. Ellsworth, Maine, Oct 3 2026"
5. Zaal approves in Slack
6. Firefly posts to Farcaster + Twitter + Bluesky
7. Photo logged for recap

**Expected:** 10 sets of photos = 10 posts across 8 hours.

**Tools:**
- **S3 + signed URLs** (photo upload)
- **AWS Rekognition** (tagging) — $0.30
- **Claude vision** (rating + caption) — $1.50
- **Firefly API** (cross-post) — $0

**Timeline:**
- **Week of May 12:** S3 + Rekognition pipeline
- **Week of June 2:** Firefly integration
- **Sept 15:** Test with 10 real photos

**Cost:** $1.80

---

## Post-Event Highlight Reel (24-48 hours after)

### Phase: Oct 4-5, 2026

**What it is:**
30-60 second video montage: artists performing, crowd energy, sunset, volunteers, merch. Music: 30-sec clip from one artist.

Reel goes to:
- Farcaster (Frame embed)
- Twitter / X (native video)
- YouTube (Shorts)
- TikTok (optional)
- Email (newsletter)

### Tools

1. **iMovie (Mac)** + **Claude direction** (recommended)
   - DaNici or media volunteer edits in iMovie
   - Claude provides shot-by-shot direction
   - Most control + ZAO brand feel
   - ~1-2 hours work

2. **RunwayML** ($20/mo)
   - Generative video editing
   - Upload clips + photos, text prompt
   - System generates transitions + effects
   - 1-2 hours render time

3. **Opus Clip** ($30/mo)
   - TikTok/Shorts optimizer
   - Upload collection, auto-cuts best 30 sec
   - Adds subtitles + captions
   - ~30 min process

### Hybrid Approach (Recommended)

**Oct 3 evening:**
- Collect 10-15 best videos + 25-30 best photos
- DaNici or media volunteer opens iMovie
- Follows Claude's shot-by-shot direction
- Rough cut in 10-15 min

**Oct 4 morning:**
- Zaal reviews, makes 1-2 tweaks
- Approves

**Oct 4 afternoon:**
- Export MP4
- Crop for TikTok (9:16), Reels (4:5), YouTube Shorts
- Post to all platforms

**Cost:** $0 (iMovie is free; RunwayML $5 if subscribed)

**Expected impact:**
- 20-50 views Farcaster (Oct 4 evening)
- 100-200 views when shared by team
- 500+ YouTube Shorts algorithm by Oct 10
- 30-50 people add ZAOstock 2027 to calendar

---

## Cross-Platform Strategy

### Platforms (priority order)

1. **Farcaster** (home base) — posts + Frames
2. **Twitter / X** (reach) — 1-2 per day, not spam
3. **Bluesky** (community) — 1-2 posts per week
4. **Instagram** (visual) — Reels, carousel posts
5. **TikTok** (optional, youth audience)
6. **Email** (existing community) — weekly + post-event recap

### Workflow

**Pre-event (weekly):**
- Monday: Zaal approves Claude draft
- Wednesday: scheduled for Thursday 7pm ET
- Friday: email recap

**Day-of (real-time):**
- Photo upload → AI tag → Claude caption → Slack approve → Firefly post (staggered 30 min)

**Post-event:**
- Oct 4 afternoon: highlight reel published
- Oct 4 evening: email recap
- Oct 5-10: reel shares across platforms

---

## Key Decisions

| Decision | USE | DEFER | SKIP | Notes |
|----------|-----|-------|------|-------|
| Pre-event countdown (14 posts) | X | | | P0. Low effort, compound hype. |
| Day-of live photo → caption → post | X | | | P0. Real-time amplification. |
| Post-event highlight reel | X | | | P1. High ROI for 2027 attendance. |
| Farcaster Frames (polls) | | X | | P2. Nice but not critical. |
| Instagram Reels native | | X | | P2. Worth it but defer to June 2. |
| TikTok | | | X | P3. Not core audience. |
| Email newsletter | X | | | P0. Existing audience leverage. |
| Meta Ads | | | X | P4. Budget too small. Organic only. |

---

## Reality check for our scale

**Team:** Zaal (approver), photographer (capture), media volunteer (editing).

**Pre-event:** 1 post/week, Claude-drafted = no bottleneck. Zaal approves each in <5 min.

**Day-of:** 10 posts across 8 hours = 20-40 min of Zaal's time. Realistic.

**Post-event:** 1 reel, 1-2 hours media volunteer time (or 10 min if RunwayML). Realistic.

**Risk:** Zaal gets busy Oct 3, reel deferred to Oct 4-5. **Mitigation:** Recruit deputy video editor in Sept.

---

## Cost summary

| Tool | Cost | Notes |
|------|------|-------|
| Claude pre-event posts | $0.06 | 14 posts × 600 tokens |
| Claude day-of captions | $0.50 | 10 posts × 50 tokens each |
| Rekognition + vision | $1.80 | 300 photos + 50 reviews |
| Firefly | $0 | Already in use |
| Paragraph (email) | $0 | Already subscribed |
| **Total** | **~$2.50** | One-time Oct 3 peak |

---

## Timeline to ship

| Week | Owner | Task |
|------|-------|------|
| May 5-11 | Claude | Test drafting with past posts |
| July 7-13 | Claude | Draft all 14 posts |
| July 28-Aug 3 | Zaal + eng | Firefly + Slack integration |
| June 2 | Team | Recruit photographer + media volunteer |
| Sept 15 | Team | Test photo workflow |
| Oct 3 | Photographer + Zaal | Go-live: photo → post |
| Oct 4-5 | Media volunteer | Reel edit + post |

---

## This week (week of Apr 22)

1. Zaal: confirm photographer + media volunteer for Oct 3-5
2. Zaal: scan email list — weekly ZAOstock emails Sept 1-Oct 3? (Yes, use Paragraph)
3. Team: review doc 473 + this doc for content calendar gaps
4. Eng: create `/stock/social-queue` mockup

---

## Sources

- Firefly: https://firefly.com
- Paragraph: https://paragraph.xyz
- RunwayML: https://runwayml.com/
- Opus Clip: https://www.opusclip.com/
- Farcaster Frames: https://www.farcaster.xyz/developers
- AWS Rekognition: https://aws.amazon.com/rekognition/
- Claude API: https://anthropic.com/docs/build/caching

---

## Related ZAOstock docs

- [473 — Road to ZAOstock Magnetic Portal](../473-road-to-zaostock-magnetic-portal/) — collectible engagement
- [05-dayof-ai.md](05-dayof-ai.md) — incident response + photo capture
- [433 — Media Capture Pipeline Spec](../433-zao-media-capture-pipeline-spec/) — photo/video ingestion

*Amplification is about consistency + authenticity. 14 posts beat 1 viral moment.*
