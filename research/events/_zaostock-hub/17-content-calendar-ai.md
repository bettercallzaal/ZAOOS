# 17 — Content Calendar Generation + Cross-Platform Amplification

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Pre-event content drip + day-of amplification + post-event recap narrative
> **Payoff:** 70+ posts across 163 days, tuned per platform, zero blank days, 500+ pre-event engaged followers, 20+ post-event viral moments
> **Core insight:** ZAO community is Farcaster-native. Content calendar generation auto-drafts 50+ posts from artist bios + sponsor list + event milestones, Zaal approves them 2x/week, Firefly cross-posts to 4 platforms simultaneously.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Content calendar generation** (163 days, Claude reads doc 473 magnetic portal + artist roster, auto-drafts 50+ posts organized by week) - artist spotlights, sponsor thanks, countdown beats
2. **Cross-platform adaptation** (same post, tuned for Farcaster (1k char limit, cast frames) vs X (280 char, hashtags) vs LinkedIn (500 char, B2B tone) vs IG (2k char, hashtags)) - Firefly API handles posting to all 4 simultaneously
3. **Weekly approval workflow** (Monday: Zaal reviews 5-7 scheduled posts, approves with 1-click, Firefly publishes Thu 7pm ET) - bottleneck is Zaal's time, not tool limitations

Everything else is "nice to have" — these three give 500-1000 weekly engaged followers with 90 min of Zaal's time per week.

---

## The problem we're solving

Apr 22: Zaal realizes he has 163 days to Oct 3. He's built a 17-person team, but social amplification is a gaping hole. Without a content calendar:
- Zaal posts ad-hoc (maybe 2-3 times/week), mostly about other ZAO topics, not ZAOstock
- Sponsors are never thanked publicly; they feel invisible; second year sponsorship at risk
- Artists are spotlit once (maybe) instead of built as narrative arcs
- Countdown goes silent Aug 20 - Sept 15 (no content for 4 weeks)
- Oct 3 evening: 50 photos from photographers + ZAO community, but no strategy to compile + share them
- Oct 4-5: deafening silence. No "thank you" narrative. Next year, people forgot what ZAOstock was.

With AI assist:
- May 5: Claude generates 50+ post options (artist spotlights, sponsor thanks, logistics tips, countdown beats)
- May 12: Zaal reviews 5-7/week in Slack, approves with thumbs-up
- Thu 7pm: Firefly auto-publishes to Farcaster + X + Bluesky + LinkedIn (tuned per platform)
- Aug 20 - Oct 3: zero blank days. Community sees 3-4 ZAOstock posts every week, building FOMO + hype
- Oct 3 5pm: photographer uploads first photo set to S3. Claude captions 10 photos in <2 min. Firefly posts. Engagement spike.
- Oct 4 9am: Zaal drafts post-event recap (Claude suggestions provided). Posted. Attendees share to their networks.
- Oct 10: highlight reel goes viral on YouTube Shorts. 100+ shares. Next year's ticket demand increases.

---

## Dimension breakdown

### 1. Content Calendar Generation (50+ Posts, 163 Days)

**What it does:**
Claude reads:
- Doc 473 (Magnetic Portal weekly themes)
- Artist roster (10 artists, bios from `/stock/team`)
- Sponsor list (20 sponsors from doc 270)
- Event milestones (May 15: artist lineup locked, July 1: volunteer signup opens, Sept 1: ticket sale, Oct 3: festival)
- "Year of the ZABAL" newsletter themes (existing Paragraph integration)

Then Claude generates a calendar of 50+ posts, one per week + extra content nodes:

**Post types (7 categories, ~50 posts total):**

1. **Artist Spotlights (10 posts, one per artist, spread over May-Sept)**
   - "Meet Artist #1: [Name], who's bringing [vibe] to ZAOstock. Hear their latest on Spotify [link]. Oct 3 only."
   - 2-3 sentence vibe capture, Spotify link, Instagram handle, TikTok if applicable
   - Each artist featured once in "prime real estate" week (high-follower growth window)

2. **Sponsor Thanks + Integration (10 posts, one per sponsor tier, spread May-Sept)**
   - Tier 1 (Bangor Savings): "ZAOstock is powered by Bangor Savings. Big thanks for supporting independent artists in Maine."
   - Tier 2 (mid-tier): shorter + visual
   - Tier 3 (local): community angle
   - Each post links to sponsor website, mentions their industry

3. **Countdown + Urgency Beats (10 posts, scheduled T-90, T-60, T-30, T-14, T-7, T-3, T-1, day-of + post-event)**
   - "90 days until ZAOstock. Early bird ticket ends May 31."
   - "One week out. 700 people. 10 artists. Ellsworth, Maine. Oct 3."
   - Visual: countdown graphic (can auto-generate with Haiku)

4. **Community Progress + Behind-The-Scenes (8 posts, every 3 weeks)**
   - "ZAOstock crew meeting recap: lineup locked, volunteer team growing, stage design approved"
   - Celebrate team milestones (1000 Paragraph followers, $10K in sponsorships, 500 early ticket sales)
   - Photo: Zaal + team in planning session (humanizes leadership)

5. **Logistics + Practical Info (8 posts, target Sept 1-Oct 3)**
   - "What to bring: weather gear for Maine fall, comfortable shoes (dirt/grass terrain), your Farcaster vibe"
   - "Parking: Franklin Street lot (free), overflow valet option, wheelchair accessible"
   - "Artists & friends: your run-of-show sheet is live on /stock/team. Check your slot."

6. **Paragraph Newsletter Promotion (4 posts, weekly integration)**
   - "This week on Year of the ZABAL: ZAOstock artist interviews, team updates, next-gen music economy. Subscribe for daily."
   - Link to Paragraph subscribe page

7. **Social Proof + Testimonials (4 posts, user-generated content)**
   - "ZAO Summer Series attendees: 'Best music community I've found on chain.' - @alexf"
   - Retweet past attendee love, build FOMO

**How Claude generates these:**

**Input to Claude:**
```json
{
  "event": "ZAOstock 2026",
  "date": "Oct 3, 2026",
  "days_out": 163,
  "artists": [
    { "name": "Artist 1", "vibe": "experimental electronic", "spotify": "https://..." },
    { "name": "Artist 2", "vibe": "folk-trap fusion", "spotify": "https://..." },
    ...
  ],
  "sponsors": [
    { "name": "Bangor Savings", "tier": 1, "industry": "finance", "logo_url": "..." },
    { "name": "Local Venue", "tier": 3, "industry": "hospitality", "logo_url": "..." },
    ...
  ],
  "milestones": [
    { "date": "May 15", "milestone": "Artist lineup locked" },
    { "date": "July 1", "milestone": "Volunteer signup opens" },
    { "date": "Sept 1", "milestone": "Ticket sales live" },
    { "date": "Oct 3", "milestone": "Festival day" }
  ],
  "magnetic_portal_themes": [
    "Week of May 5: Intro to ZAOstock vision",
    "Week of May 12: Artist ecosystem deep dive",
    "Week of May 19: Fan stories + onboarding",
    ...
  ]
}
```

**Process:**
1. Claude generates 50+ post drafts organized by week
2. Each post: headline + body (platform-agnostic first), platform-specific versions below
3. Suggests visual (Haiku-generated, stock photo URL, or "designer needed")
4. Estimates reach (followers × engagement % = expected impressions)
5. Outputs as spreadsheet: date | post_type | headline | body | platforms | visual | notes

**Example output:**

```
Date: May 12, 2026
Post Type: Artist Spotlight
Headline: "Meet Artist #1: Kaliedhoscope"

PLATFORM-AGNOSTIC:
Kaliedhoscope is bringing experimental electronic vibes to ZAOstock.
Find them on Spotify: [link]
Instagram: @kaliedhoscope_music
Oct 3, Ellsworth Maine. The convergence is coming.

FARCASTER (280 char limit, no link shortening needed):
Kaliedhoscope is bringing experimental electronic to ZAOstock.
Find them on Spotify [link]. Oct 3, Ellsworth Maine.

X (280 char + hashtags):
Kaliedhoscope: experimental electronic fusion.
Hear them on Spotify [link]. Oct 3 Ellsworth ME.
#ZAOstock #FarcasterNative #IndieMusic

LINKEDIN (500 char, B2B angle):
[Skip this post, not relevant for finance audience]

INSTAGRAM (2k char, emoji, hashtags):
Introducing Kaliedhoscope - one of 10 artists bringing experimental vibes to ZAOstock 2026.
Listen now: [Spotify link]
Instagram: @kaliedhoscope_music

Visual: Haiku-generated album art mashup OR stock photo of electronic studio setup
Reach estimate: 300 followers × 8% engagement = 24 likes/retweets
```

**Tools:**
- **Claude API** (batch generation) — 50 posts × 800 tokens each = ~$0.20
- **Google Sheets API** (output) — calendar exported as .csv for easy editing
- **Slack integration** — post to #social-drafts every Monday for Zaal approval

**Recommendation:** Generate calendar by May 5. Zaal reviews May 12 (approve/reject/edit). Schedule all 50+ posts in Firefly by May 26. Then weekly approval: Monday reviews next 5-7, Thursday at 7pm auto-publishes.

**Integration point:** `/stock/social-queue` (new dashboard, Phase 5 item from doc 477)
- Calendar view: May - Oct, each post visible
- Approval status: [PENDING ZAAL] [APPROVED] [PUBLISHED] [UNDERPERFORMED]
- One-click edit: Zaal changes copy, re-approves
- One-click delay: move post to next available slot
- Analytics: past posts sorted by engagement

**Timeline:**
- **Week of May 5:** Claude generation prompt
- **Week of May 12:** All 50+ posts generated, Zaal reviews
- **Week of May 19:** Final edits, Firefly integration test
- **Week of May 26:** All posts scheduled in Firefly (May 5 - Oct 10)
- **Every Monday**: Zaal reviews next 5-7 pending posts, approves in <10 min
- **Every Thursday 7pm:** Firefly auto-publishes approved posts

**Cost:** Claude $0.20 (one-time generation), Firefly $0 (already in use)

---

### 2. Cross-Platform Adaptation

**What it does:**
Same post, tuned for each platform's culture + constraints. Claude generates all 4 versions simultaneously.

**Platform rules:**

**Farcaster** (Primary home base)
- 1000 char limit (but keep <280 for readability)
- Frames okay (polls, links, mini-apps)
- Tone: web3-native, community-first, casual
- Hashtags: optional (use for artist names, #ZAOstock)
- Best time to post: 7-10pm ET (US prime time)
- CTA style: "Cast, reply, frame this"

**X / Twitter** (Reach + news cycle)
- 280 char (or 500 with media)
- Hashtags essential (#ZAOstock #FarcasterNative #Maine #IndieMusic)
- Tone: newsy, urgent, shareable
- Links shortened (X shortens them auto)
- Media essential (photos >> text-only)
- Best time: 8-10pm ET, 8am ET
- CTA style: "RT if you're going. Like if you're hyped."

**Bluesky** (Community alignment)
- Similar to Twitter, more intentional
- Fewer ads, more curation
- Hashtags okay but not required
- Tone: authentic, less salesy
- Threads (quote-post chains) work well
- CTA: "Join us Oct 3"

**LinkedIn** (B2B + professional positioning)
- 1300 char limit
- Tone: professional, insights, impact-focused
- Hashtags okay (#EventMarketing #IndieMusic #WebThree)
- Posts: long-form or visual carousel
- CTA: "Comment below: will you attend?"
- Best audience: sponsors, event industry, music biz

**Example cross-platform adaptation:**

```
ORIGINAL (Claude draft):
"Kaliedhoscope is bringing experimental electronic to ZAOstock.
Spotify: [link]. Oct 3, Ellsworth Maine."

FARCASTER:
"Kaliedhoscope is bringing experimental electronic to ZAOstock.
Spotify: [link]
Oct 3, Ellsworth Maine. The convergence is coming. Cast this."

X:
"Kaliedhoscope x ZAOstock 2026. Experimental electronic fusion.
Hear them on Spotify [link]
Oct 3 in Ellsworth Maine.
#ZAOstock #IndieMusic #FarcasterNative"

BLUESKY:
"Kaliedhoscope bringing experimental electronic to ZAOstock.
One of 10 artists. Oct 3, Ellsworth Maine.
[Spotify link]"

LINKEDIN:
"Kaliedhoscope is one of 10 independent artists performing at ZAOstock 2026,
a community-driven music festival in Ellsworth, Maine.
This event showcases the convergence of web3 music, decentralized communities,
and independent artistic expression.
Interested in sponsoring the next ZAOstock? DM us."
```

**How Claude does this:**

**Input:**
```
Post: "Meet Artist #1: Kaliedhoscope"
Base copy: "Kaliedhoscope is bringing experimental electronic to ZAOstock.
Spotify: [link]. Oct 3, Ellsworth Maine."

Generate platform-specific versions for:
- Farcaster (web3 tone, <1000 char)
- X (urgent tone, hashtags, 280 char)
- Bluesky (authentic tone, <280 char)
- LinkedIn (professional tone, <1300 char, B2B angle)
```

**Process:**
1. Claude reads base post + platform rules
2. Generates 4 versions with tone shift
3. Checks character limits, hashtag optimization
4. Suggests visual per platform (video for TikTok, carousel for IG, etc.)
5. Outputs as table: Platform | Copy | Hashtags | Visual | Reach Estimate

**Tools:**
- **Claude API** (adaptation) — 50 posts × 4 platforms × 200 tokens = ~$0.10
- **Firefly API** (posting) — cross-platform scheduling + publishing

**Recommendation:** Generate alongside content calendar (same API call). Firefly posts all 4 simultaneously on Thursday 7pm ET.

**Integration point:** `/stock/social-queue` → each post card shows all 4 versions, click to expand

**Timeline:**
- **Week of May 5:** Claude platform-adaptation prompt
- **Week of May 12:** Test with 5 sample posts
- **Week of May 19:** All 50+ adapted, final review
- **Week of May 26:** Live in Firefly

**Cost:** Claude $0.10 (included in calendar generation)

---

### 3. Weekly Approval Workflow

**What it does:**
Every Monday, Slack bot posts a "Social Queue" reminder to Zaal:

```
ZAOstock Social Queue (week of May 26):

5 posts pending approval:
[ ] Mon May 26: "Artist spotlight: Kaliedhoscope" (3 min read)
[ ] Tue May 27: "Volunteer signup now open" (2 min read)
[ ] Wed May 28: "Sponsor feature: Bangor Savings" (3 min read)
[ ] Thu May 29: "Countdown: 127 days!" (1 min read)
[ ] Fri May 30: "Paragraph recap: this week in ZAOstock" (2 min read)

Total time: <15 min
Approve: thumbs-up each post
Edit: click "✏️ Edit" to change copy
Reject: click "❌ Reject" to remove
Reschedule: click "📅 Reschedule" to move to next week

Approved posts publish Thu 7pm ET to Farcaster, X, Bluesky, LinkedIn.
```

**How it works:**

1. **Monday 9am:** Slack bot posts reminder
2. **Monday 9-2pm:** Zaal reviews 5 posts in Slack threads (one thread per post, Claude-generated summary + all 4 platform versions visible)
3. **Monday 2pm:** Zaal approves all 5 (or edits + re-approves)
4. **Thursday 7pm:** Firefly publishes all approved to 4 platforms

**Workflow states:**

- **PENDING_ZAAL**: awaiting approval
- **APPROVED**: ready to publish
- **SCHEDULED**: approved, queued for Thursday 7pm
- **PUBLISHED**: live on all 4 platforms
- **UNDERPERFORMED**: published, <5% engagement (flag for Zaal review)

**Tools:**
- **Slack SDK** — bot posts reminder + threads per post
- **Supabase** — stores post metadata + approval status
- **Firefly API** — auto-publishes Thursday 7pm if APPROVED status

**Integration point:** `/stock/social-queue` dashboard
- Calendar view (May - Oct)
- Approval status per post
- Slack link to review thread
- Click to view all 4 platform versions

**Timeline:**
- **Week of May 19:** Slack bot + approval workflow built
- **Week of May 26:** First approval round live (5 posts)
- **Every Monday through Oct 3:** weekly cycle repeats

**Cost:** Slack SDK $0, Firefly $0

---

### 4. Day-of Content: Real-Time Photo → Caption → Post

**What it does:**
Oct 3, 1pm - 9pm. Photographer uploads photos to S3. Claude auto-captions. Firefly posts within <2 minutes.

**Workflow:**

1. **1:15pm**: Photographer uploads 10 photos (artist 1 soundcheck) to S3
2. **1:16pm**: AWS Lambda triggers Claude vision
3. **1:17pm**: Claude captions 10 photos:
   ```
   Photo 1: "Artist 1 soundcheck energy. Oct 3 ZAOstock, Franklin Street Parklet, Ellsworth Maine."
   Photo 2: "Crowd building. 300+ already here. The vibe is starting."
   ...
   ```
4. **1:18pm**: Zaal approves captions in Slack (or auto-approve if engagement score >7/10)
5. **1:19pm**: Firefly posts to Farcaster + X + Bluesky + LinkedIn

**Expected:** 8-10 photo drops across Oct 3, 1pm-9pm = 80-100 photos = 80-100 posts = constant engagement stream

**Tools:**
- **S3 + signed URLs** (photo upload)
- **AWS Lambda** (trigger on upload)
- **Claude vision** (caption + engagement score) — $0.01 per photo
- **Slack SDK** (approval workflow)
- **Firefly API** (auto-post)

**Integration point:** `/stock/team/photos` tab in dashboard
- Live photos uploaded (grid view)
- Captions + scores (click to edit)
- Posted status (green checkmark if live)

**Timeline:**
- **Week of May 12:** Lambda + Claude vision integration
- **Week of June 2:** Firefly auto-post integration
- **Sept 15:** Test with 10 real photos from past event
- **Oct 3 1pm:** Go-live

**Cost:** Claude vision ~$0.80 (100 photos × $0.01 per caption)

---

### 5. Post-Event Content: Recap Narrative (Oct 4-5)

**What it does:**
Oct 4 morning, Zaal has 800+ photos + 20+ video clips. Claude generates:
- 1 "thank you" post (to volunteers, artists, sponsors, attendees)
- 1 "by the numbers" recap (attendees, artists, sponsors, social reach)
- 1 "best moments" visual recap (highlight reel script + captions)
- 1 "next year" teaser post
- 5-10 "shout-out" posts (volunteer + artist spotlights, thank the crew)

**Example outputs:**

```
THANK YOU POST:
"ZAOstock 2026 is in the books. 
700+ people. 10 artists. One night that proved web3 music is about community first.
Big thanks to our volunteers, sponsors, and the crew that made this happen.
Ellsworth, you were incredible.
Oct 3 was just the beginning. See you Oct 4, 2027.
#ZAOstock #Ellsworth #IndieMusic"

BY THE NUMBERS:
"ZAOstock 2026 by the numbers:
700+ attendees
10 artists across 8 hours
20 volunteers
$50K in community sponsorships
500+ Farcaster followers (pre-event)
2000+ social impressions (day-of)
99% attendee satisfaction (NPS survey)

Next: full recap + financial transparency report by Nov 1.
#ZAOstock"

NEXT YEAR TEASER:
"ZAOstock 2027 is already being planned.
Bigger. Better. More artists.
The convergence continues.
Mark your calendar: Oct 2, 2027.
Subscribe to Year of the ZABAL for updates.
#ZAOstock2027"
```

**How Claude generates:**

**Input:**
```
Event: ZAOstock 2026, Oct 3, Ellsworth ME
Attendance: ~750 (final count)
Artists: 10, all performed
Volunteers: 22 showed up
Sponsors: 20
Weather: light rain 2-4pm, handled well with tent contingency
Incidents: 2 minor (one sprained ankle, one lost wallet - both resolved)
Social reach: 2400 impressions on day-of, 15% engagement
Feedback: 47 NPS survey responses, avg 47

Generate:
- 1 thank you post
- 1 by-the-numbers post
- 1 next year teaser
- 5 shout-out posts (pick top 5 volunteers/artists)
```

**Process:**
1. Claude reads event metrics + feedback
2. Generates 7-8 recap posts with tone + gratitude
3. Suggests visual per post (group photo, numbers graphic, artist highlight)
4. Outputs as template: date | post_type | headline | body | platforms | visual

**Tools:**
- **Claude API** — $0.10 (recap generation)
- **Paragraph** — email recap + archive

**Integration point:** `/stock/social-queue` → "Post-Event" section
- Recap posts ready for approval
- Click to publish individual posts Oct 4-10
- Export full recap as PDF for archive

**Timeline:**
- **Oct 3 9pm:** Zaal drafts rough notes (attendees, mood, standout moments)
- **Oct 4 9am:** Claude generates 7-8 recap posts
- **Oct 4 10am:** Zaal approves + publishes
- **Oct 4-5:** shout-out posts published daily
- **Oct 10:** final recap post + next year teaser

**Cost:** Claude $0.10

---

### 6. Content Performance Tracking

**What it does:**
Every post automatically logs:
- Platform (Farcaster, X, Bluesky, LinkedIn)
- Post date + time
- Engagement (likes, retweets, replies, impressions)
- Conversion (clicks to ticket page, clicks to Paragraph signup)
- Performance score (engagement % × audience size = impact points)

**Dashboard shows:**
```
Social Performance: ZAOstock 2026

Top Posts:
1. "Artist spotlight: Kaliedhoscope" (45 likes, 12 retweets, 340 impressions)
2. "Countdown: 90 days!" (38 likes, 8 retweets, 290 impressions)
3. "Volunteer signup now open" (22 likes, 5 retweets, 180 impressions)

Platform breakdown:
Farcaster: 600 impressions, 8% engagement
X: 800 impressions, 5% engagement
Bluesky: 200 impressions, 9% engagement
LinkedIn: 300 impressions, 3% engagement

Underperforming posts (engagement <3%):
- "Logistics: parking info" (2.1% engagement)
- "Sponsor feature: mid-tier" (2.8% engagement)

Action: Consider removing logistics/sponsor posts in future; boost artist + countdown content.
```

**Tools:**
- **Neynar API** (Farcaster analytics)
- **X API** (Twitter analytics)
- **Bluesky SDK** (engagement data)
- **LinkedIn API** (impressions + clicks)
- **Supabase** (log + aggregate)
- **Metabase** (dashboard visualization)

**Integration point:** `/stock/analytics/social` tab
- Timeline view (May - Oct)
- Platform breakdown
- Post-level detail (click post to see all metrics)
- Recommendations (AI suggests which post types to increase)

**Timeline:**
- **Week of June 9:** API integrations + data pipeline
- **Week of June 30:** Dashboard mockup
- **Week of July 14:** Live tracking (after first posts published)
- **Weekly:** Zaal reviews insights (every Monday)

**Cost:** APIs $0 (free tier), Metabase $0 (self-hosted)

---

### 7. Paragraph Newsletter Integration

**What it does:**
ZAO already runs "Year of the ZABAL" daily newsletter on Paragraph. Content calendar includes weekly Paragraph promotion posts + newsletter content itself.

**Workflow:**

Every Friday:
1. Claude reads that week's Paragraph newsletter (Zaal writes it)
2. Claude generates 1-2 social posts teasing the newsletter
3. Posts go to `#social-drafts` for Zaal approval
4. Published Fri 5pm, newsletter drops Sat 6am

**Example:**
```
PARAGRAPH NEWSLETTER (Sat, June 7):
Title: "Artists x Web3: 5 conversations shaping ZAOstock 2026"
Content: Interviews with 2 ZAOstock artists, music industry insights, FarcasterNative stats

SOCIAL TEASE (Fri 5pm):
"In this week's Year of the ZABAL newsletter:
5 conversations with artists shaping the future of web3 music.
Plus: the numbers behind ZAOstock's artist discovery.
Subscribe for daily insights. [link]
#FarcasterNative"
```

**Tools:**
- **Paragraph API** (read latest newsletter)
- **Claude** (generate social tease)
- **Firefly** (cross-post)

**Integration point:** `/stock/social-queue` shows Paragraph integration indicator
- Link to latest newsletter
- Auto-generated social tease

**Timeline:**
- **Week of May 26:** Paragraph API integration
- **June 7:** First newsletter tease live
- **Every Friday:** weekly integration

**Cost:** Paragraph $0 (existing), Claude $0.01 per post

---

### 8. Evergreen vs Event-Specific Content Mix

**Strategy:**

Over 163 days, content should be:
- **60% event-specific** (ZAOstock artist spotlights, sponsor features, countdown, logistics, volunteer stories)
- **30% community evergreen** (Year of the ZABAL themes, web3 music insights, independent artist shout-outs, farcaster community vibes)
- **10% personal brand** (Zaal's takes on music, culture, building in public, fractal participation updates)

**Content calendar enforces this split:**
- 30+ event-specific posts (artists, sponsors, countdown, logistics)
- 15+ community posts (evergreen, cross-posted to other ZAO accounts)
- 5+ personal brand posts (Zaal's voice, building in public)

**Tools:**
- **Claude API** (categorizes posts, audits mix)
- **Slack reminder** (every Monday: "This week's content mix: 65% event, 30% community, 5% personal. Good balance.")

**Timeline:**
- **Week of May 5:** Claude audit + categorization
- **Ongoing:** weekly check (Monday reminder)

**Cost:** Claude $0 (included)

---

## Key Decisions

| Decision | USE | DEFER | SKIP | Notes |
|----------|-----|-------|------|-------|
| Content calendar generation (50+ posts) | X | | | P0. De-risks 163-day drip. |
| Cross-platform adaptation (4 platforms) | X | | | P0. Firefly handles posting; Claude handles copy. |
| Weekly approval workflow (Monday reviews) | X | | | P0. Bottleneck is Zaal's time, not tools. |
| Day-of real-time photo → caption → post | X | | | P1. Constant engagement Oct 3. |
| Post-event recap content (7-8 posts) | X | | | P1. Narrative closure. |
| Performance tracking + analytics | X | | | P2. Informs 2027 strategy. |
| Paragraph newsletter integration | X | | | P1. Existing audience leverage. |
| Evergreen vs event-specific mix audit | X | | | P2. Brand balance. |
| Farcaster Frames (polls, interactive) | | X | | P2. Nice but not critical for reach. |
| Instagram Reels native | | X | | P2. Worth it post-Oct 3 for 2027 growth. |
| TikTok content strategy | | | X | P3. Not core audience (YET). |
| Meta Ads retargeting | | | X | P4. Budget too small. Organic only. |

---

## Reality check for our scale

**Team:** Zaal (approver/editor), photographer (capture), ZAO community (organic shares).

**Pre-event:** 50 posts across 163 days = ~3 posts/week. Zaal reviews 5-7 per week (Monday) in <15 min. No bottleneck.

**Day-of:** 10 photo drops × 10 photos each = 100 posts. Claude auto-captions in <2 min per batch. Zaal approves in 2-3 min per batch. Realistic.

**Post-event:** 7-8 recap posts over Oct 4-5. Zaal writes rough notes; Claude drafts; Zaal approves. 1-2 hours total. Realistic.

**Risk:** Zaal gets busy mid-event Oct 3; real-time posting delays. **Mitigation:** Pre-approve 20 generic caption templates (Claude) + recruit co-approver (media volunteer) by Sept 1.

---

## Cost summary

| Tool | Cost | Notes |
|------|------|-------|
| Claude content calendar generation | $0.20 | 50 posts × 800 tokens |
| Claude cross-platform adaptation | $0.10 | Included in generation |
| Claude day-of photo captions | $0.80 | 100 photos × $0.01 per caption |
| Claude post-event recap | $0.10 | 7-8 posts × ~100 tokens |
| Claude Paragraph tease (weekly) | $0.05 | 17 weeks × $0.003 per post |
| Firefly API (cross-posting) | $0 | Already in use |
| Paragraph newsletter | $0 | Already subscribed |
| Neynar + X API (analytics) | $0 | Free tier sufficient |
| **Total** | **~$1.25** | One-time through Oct 10 |

---

## Timeline to ship

| Week | Owner | Task |
|------|-------|------|
| May 5-11 | Claude | Content calendar generation (50+ posts) |
| May 12-18 | Claude | Cross-platform adaptation (Farcaster, X, Bluesky, LinkedIn) |
| May 19-25 | Zaal + team | Review all 50+, final edits, schedule in Firefly |
| May 26-June 1 | Firefly + Slack | Integration: approval workflow + auto-posting |
| June 7 onwards | Zaal + Claude | Every Monday: review + approve 5-7 posts for Thu 7pm publish |
| June 2 | Photographer | Recruit + brief on S3 upload process |
| July 1 onwards | System | Day-of photo → caption → post workflow live (weekly test) |
| Sept 15 | Team | Mock Oct 3 content flow (simulate 30 photo uploads) |
| Oct 3 1pm-9pm | Photographer + Zaal | Go-live: real-time posting Oct 3 |
| Oct 4 9am | Claude | Generate recap posts |
| Oct 4 10am | Zaal | Approve + publish recap posts |
| Oct 4-5 | Zaal | Publish shout-out posts (2-3 per day) |

---

## This week (week of Apr 22)

1. Zaal: confirm doc 473 (Magnetic Portal) + artist roster + sponsor list are complete + accurate
2. Zaal: audit existing Farcaster posts (last 90 days) — what content resonated? (share insights)
3. Zaal: confirm Paragraph newsletter schedule (every day? weekly?) + current subscriber count
4. Team: review this doc for gaps + feasibility
5. Eng: create `/stock/social-queue` mockup (calendar view + approval workflow)

---

## Sources

- Claude API: https://anthropic.com/docs/build/api-reference
- Firefly API: https://firefly.com/
- Paragraph: https://paragraph.xyz
- AWS Lambda: https://aws.amazon.com/lambda/
- Neynar API: https://www.neynar.com/docs/api/v1
- X API: https://developer.twitter.com/en/docs/api
- Bluesky SDK: https://github.com/bluesky-social/atproto/
- LinkedIn API: https://learn.microsoft.com/en-us/linkedin/marketing/
- Metabase: https://www.metabase.com/
- Supabase: https://supabase.com/

---

## Related ZAOstock docs

- [473 — Road to ZAOstock Magnetic Portal](../473-road-to-zaostock-magnetic-portal/) — weekly themes + collectible engagement
- [06-social-ai.md](06-social-ai.md) — social amplification (related, focus on reach)
- [270 — ZAOstock Planning](../270-zao-stock-planning/) — sponsor list, artist roster
- [433 — Media Capture Pipeline Spec](../433-zao-media-capture-pipeline-spec/) — photo ingestion
- [477 — Dashboard Notion-Replacement 170-Day Build](../477-zaostock-dashboard-notion-replacement/) — `/stock/team` data source

*Content consistency wins. 50+ posts over 163 days beats 5 viral moments. Build the audience slowly, authentically, week by week.*
