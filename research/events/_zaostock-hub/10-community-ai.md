# 10 — Community Building, Retention & Alumni Network

> **Status:** Research iteration 10 - ready to ship
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Days out:** 163
> **Scope:** AI-assisted community engagement, personalized post-festival recaps, Year 1→2 retention, sentiment monitoring, reward distribution, and drip education

---

## Pareto 80/20

**Top pattern:** Auto-generate personalized recap posts for each teammate 48 hours post-festival. One line per scope + one highlight per role. Post to Farcaster channel + email. Captures momentum when people are still talking about it.

**One integration to wire:** Supabase activity log (already exists in `/stock/team` dashboard) + Claude API for recap generation + Farcaster SDK for auto-posting.

---

## Current State

- Farcaster channel `@ZAOfestivals` active, 80+ followers
- 17 active contributors across 3 scopes: ops, music, design
- Paragraph newsletter "Year of the ZABAL" going out weekly (260 subs)
- 320+ research docs in library; knowledge graph active
- No post-festival follow-up automation or retention tracking
- No sentiment monitoring across Discord/Telegram/Farcaster signals
- Reward points system (ZAOfestivals Points) not yet integrated

**Files to extend:**
- `src/app/stock/team/PersonalHome.tsx` — add "Your ZAOstock recap" section
- `src/app/api/stock/team/[id]/recap` — POST route to generate + queue recap post
- `src/app/api/stock/team/retention/year2-predict` — cohort analysis for Year 2 invites
- `scripts/stock-sentiment-monitor.ts` — daily Farcaster/Discord/Telegram crawl

---

## 1. Personalized Post-Festival Recap Posts

### Why It Matters

163 days of effort. Two hours on stage. Each teammate deserves a spotlight moment that surfaces their exact contribution. Personalized recaps (auto-generated from activity log + role) convert one-time volunteers into ZAO evangelists.

**Example:**
- **Ops:** "Zaal + Candy managed 200 RSVPs, 17 sponsors, 14 volunteers. 8 last-minute artist swaps handled in 72 hours."
- **Music:** "DCoop locked in 5 artists (SongJam network), coordinated 2 acoustic blocks, coached 3 first-time stage performers."
- **Design:** "Merch branding (vinyl labels, stickers) designed and printed 500 units. Visual identity consistent across 40+ posts."

### Implementation

**Tech stack:**
- Supabase `stock_activity_log` (timestamps, action types, user_id, scope_id)
- Claude API for personalization and highlight extraction
- Farcaster SDK for auto-posting + Paragraph for newsletter backup
- Store recap text + image in `stock_team_recaps` table

**Prompt template:**
```
You are a festival production historian. Generate a brief, celebratory recap of a team member's contribution.

Team member: {name}
Scope: {scope} (ops/music/design)
Role: {role} (lead/2nd/member/advisory)
Activities (from Oct 1-Oct 4):
{activity_log_summary}

Key metrics:
- Decisions made: {count}
- People coordinated: {count}
- Hours contributed: {total}
- Problem solved: {incident_count}

Output a 3-sentence recap that feels authentic + specific. Use 1-2 exact names or metrics.
Format: "{name} on {scope}: [sentence 1]. [sentence 2]. [sentence 3]"
```

**API endpoint (new):**
```
POST /api/stock/team/[id]/recap
{
  "team_member_id": "uuid",
  "period": "full-festival" | "oct3-only"
}
=> { recap_text, image_prompt, farcaster_draft, email_draft }
```

**Workflow:**
1. Oct 4, 8am: batch job runs `generate_all_recaps()`
2. For each of 17 teammates: fetch activity log, generate recap, draft Farcaster post + image prompt
3. Image prompt sent to Runway Gen-3 (1 image per teammate)
4. Recap posted to `@ZAOfestivals` with image + @mention
5. Email copy queued to Paragraph "This week in recap"
6. Recap text stored in `PersonalHome` for that user to view

**Database schema:**
```sql
CREATE TABLE stock_team_recaps (
  id UUID PRIMARY KEY,
  team_member_id UUID REFERENCES stock_team(id),
  scope TEXT,
  role TEXT,
  recap_text TEXT,
  image_url TEXT,
  farcaster_cast_hash TEXT,
  email_sent_at TIMESTAMP,
  reactions_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cost:** 17 recaps × $0.001 per Claude call + 17 × $0.05 Runway image = $0.92.

**Pareto win:** One day's work today saves 8 hours of manual "thank you" messages. Doubles retention signal.

---

## 2. Year 1 → Year 2 Retention Prediction & Personal Re-invite

### Why It Matters

Best time to lock Year 2 team is Oct 4-20 (honeymoon phase). ML clustering on 17 members finds who's "likely to return" vs "needs re-recruitment."

### Implementation

**Tech stack:**
- Claude API for cohort segmentation
- Supabase for historical team data (participation, sentiment, hours)
- Paragraph email + Farcaster DM for outreach

**Metrics for scoring:**
- Attendance day-of (8am check-in)
- Hours logged (Supabase activity)
- Photo count (visibility in media pipeline)
- Incident resolutions (safety/supplies/logistics)
- Social engagement (retweets, casts about ZAOstock)
- Advisory feedback (Candy, Tyler, Craig notes)

**Prompt template:**
```
Given these ZAOstock contributors, predict Year 2 return likelihood (0-100):

{csv: name, role, scope, hours, incidents_resolved, social_mentions, advisor_notes}

Output JSON array:
[
  {
    "name": "string",
    "return_likelihood": 0-100,
    "persona": "core" | "likely" | "flight-risk" | "unknown",
    "re_invite_angle": "one-sentence hook"
  }
]

Core: 90-100 (never let go)
Likely: 70-89 (personal ask works)
Flight-risk: 50-69 (needs special incentive)
Unknown: <50 (new or low visibility)
```

**API endpoint (new):**
```
POST /api/stock/team/retention/year2-predict
=> { cohorts: [core, likely, flight_risk, unknown], re_invite_templates }
```

**Workflow:**
1. Oct 5, 10am: batch job runs `predict_year2_cohorts()`
2. Segments 17 into 4 buckets (e.g., core=[Zaal, Candy, DCoop], likely=[8], flight-risk=[3], unknown=[2])
3. Generate personalized re-invite email for each:
   - **Core:** "You're leading Year 2. Here's what's next..."
   - **Likely:** "We need you back. Last year you crushed [scope]. This year: [new role]."
   - **Flight-risk:** "Your [specific skill] unlocked something. Come deeper into [new initiative]."
4. Candy/Zaal review, pick top 3 "flight-risk" for personal calls
5. Queue emails weekly (Oct 5, 12, 19, 26) to avoid blast

**Database schema:**
```sql
CREATE TABLE stock_team_retention_cohorts (
  id UUID PRIMARY KEY,
  team_member_id UUID,
  assessment_date DATE,
  return_likelihood INT,
  persona TEXT,
  re_invite_angle TEXT,
  email_sent_at TIMESTAMP
);
```

**Cost:** One batch Claude call = $0.01.

**Pareto win:** Identifies flight-risk early. One personal call per person = 15 min × 3 = 45 min total. Catch 2-3 back.

---

## 3. NPS Survey + Sentiment Analysis

### Why It Matters

Post-festival NPS identifies net promoters (9-10) vs detractors (0-6). Auto-analysis of free-text reveals friction: "artist delay killed energy" vs "merch line too long" vs "vibes unmatched."

### Implementation

**Tech stack:**
- Typeform or Tally for NPS survey (quick, mobile-friendly)
- Claude API for free-text sentiment + theme extraction
- Supabase for scoring + visualization

**Survey questions:**
```
1. How likely 0-10 would you recommend ZAOstock to a friend?
2. What was the highlight?
3. What would improve Year 2?
4. Will you volunteer again? Yes / Maybe / No
5. Best memory or moment?
```

**Prompt template:**
```
Analyze open-ended NPS response:

Response: {open_text}
NPS score: {0-10}

Extract:
{
  "sentiment": "promoter" | "passive" | "detractor",
  "themes": ["artist-energy", "logistics", "community", "food", "sound", "crowd", "schedule"],
  "highlight_quote": "verbatim if present",
  "pain_point": "one sentence if mentioned",
  "intention": "yes-return" | "maybe-return" | "no-return"
}
```

**API endpoint (new):**
```
POST /api/stock/analytics/nps/analyze-batch
{ responses: [{ id, text, score }] }
=> { nps_score, promoters, detractors, themes_ranked, pain_points }
```

**Workflow:**
1. Oct 4, 3pm: Farcaster channel posts: "How was ZAOstock? 30-sec survey [LINK]"
2. Oct 4-10: collect 15-25 responses (60-75% response rate target)
3. Oct 11: batch analyze with Claude
4. Oct 15: post recap to Farcaster: "67 NPS. Top 3 themes: artist lineup, volunteer coordination, sound clarity."
5. Themes feed into Year 2 planning (doc 270 update)

**Database schema:**
```sql
CREATE TABLE stock_analytics_nps (
  id UUID PRIMARY KEY,
  survey_id TEXT,
  respondent_name TEXT,
  score INT,
  raw_text TEXT,
  sentiment TEXT,
  themes TEXT[], -- JSON array
  pain_points TEXT,
  intention TEXT,
  created_at TIMESTAMP
);
```

**Cost:** Typeform free tier (up to 100 responses) or Tally free. Claude batch = $0.03.

**Pareto win:** 20 minutes of analysis reveals top 2-3 fixes for Year 2. Quantifiable proof of success.

---

## 4. Drip Education for New Members (Farcaster + Email)

### Why It Matters

Year 2 recruitment starts Nov 1. 5-email onboarding sequence teaches how ZAOstock works: scope structure, decision-making, ZAO mission, festival roadmap.

### Implementation

**Tech stack:**
- Paragraph email template library
- Farcaster channel `@ZAOfestivals` for public recaps (same 5 themes)
- Supabase `stock_onboarding_emails` queue

**5-email sequence (Nov 1 - Nov 30):**

1. **Welcome (Nov 1):** "You're part of ZAOstock! Here's what we're building" + mission video (60 sec)
2. **Scopes (Nov 8):** "Pick your lane: ops, music, or design. Here's what each does" + team profiles
3. **Decision-making (Nov 15):** "How we make decisions. Consensus culture + async channels" + 2 case studies (artist roster change, sponsor terms)
4. **Festival roadmap (Nov 22):** "Oct 3 = this is what's happening [timeline]" + roles your scope will fill
5. **Get involved (Nov 29):** "Ready? First step is a 30-min coffee chat. [SCHEDULING LINK]"

**Prompt template (for email personalization):**
```
Write a warm, 200-word onboarding email for a new ZAOstock contributor.

New member name: {name}
Scope interest: {ops | music | design}
Background: {brief}

Email topic: {topic_number} (1-5)
Topic details: {email_sequence[topic]}

Tone: insider, encouraging, casual (like Zaal talking to a friend)
Include: 1 specific example, 1 call-to-action
```

**API endpoint (new):**
```
POST /api/stock/onboarding/email/queue
{
  "team_member_id": "uuid",
  "scope": "ops" | "music" | "design",
  "sequence_number": 1-5
}
=> { email_html, scheduled_send_date }
```

**Workflow:**
1. Oct 25: Candy + Zaal review Year 2 recruit list (15-20 targets)
2. Oct 27: add all to `stock_onboarding_queue`
3. Nov 1-30: batch job sends personalized sequence (one per week)
4. Parallel: same 5 topics posted to Farcaster `@ZAOfestivals` (Monday 9am) for public version
5. Nov 30: all recruits receive "ready?" email

**Database schema:**
```sql
CREATE TABLE stock_onboarding_queue (
  id UUID PRIMARY KEY,
  team_member_id UUID,
  scope TEXT,
  sequence_number INT,
  email_html TEXT,
  scheduled_send_at TIMESTAMP,
  sent_at TIMESTAMP
);
```

**Cost:** Paragraph free (unlimited email).

**Pareto win:** Scalable onboarding. One prompt template × 5 topics = 5 emails. Add 20 people, run batch, done.

---

## 5. Farcaster Channel Automation (Mentions + Highlights)

### Why It Matters

2,000+ Farcaster accounts see `@ZAOfestivals` posts. Auto-reply to common mentions ("How do I apply?" → [FORM]) + highlight top casts weekly (social proof).

### Implementation

**Tech stack:**
- Farcaster API (webhooks on channel mentions)
- Claude API for intent detection + response generation
- Neynar for feed analytics

**Common patterns:**
- "How do I volunteer next year?" → template response + signup link
- "This was amazing" → auto-thank + recast
- "Can we do this monthly?" → template about roadmap
- Artist asks → refer to `/stock/artist-intake`

**Prompt template (intent detection):**
```
Classify Farcaster mention intent:

Cast: {cast_text}
Author: {username}

Intent: "how-to-apply" | "thank-you" | "feature-request" | "question" | "spam"

If intent matches known pattern, generate brief response (280 char max):
{response_template}
```

**API endpoint (new, webhook receiver):**
```
POST /api/stock/social/farcaster-mention-webhook
{
  "cast_hash": "string",
  "author_fid": "number",
  "text": "string"
}
=> { intent, response_draft, auto_post: boolean }
```

**Workflow:**
1. Oct 4-Dec 31: Farcaster webhook listens to `@ZAOfestivals` mentions
2. For each mention: run intent classifier
3. If high-confidence match (>0.85):
   - Auto-reply with template
   - Log to Supabase (Zaal can review dashboard)
4. Weekly: run `aggregate_top_casts()` (most likes/recasts in `@ZAOfestivals`)
   - Generate highlight post: "Top moments from ZAOstock"
   - Include 3-5 casts + engagement metrics
   - Post to channel

**Database schema:**
```sql
CREATE TABLE stock_social_mentions (
  id UUID PRIMARY KEY,
  cast_hash TEXT,
  author_fid INT,
  author_username TEXT,
  intent TEXT,
  response_drafted TEXT,
  response_posted BOOLEAN,
  posted_at TIMESTAMP
);
```

**Cost:** Neynar API free tier (10k calls/month).

**Pareto win:** Frees Zaal from 2-3 daily replies. Auto-highlight drives FOMO among extended network.

---

## 6. Alumni Network + Year-Round Content

### Why It Matters

ZAOstock exists one day. Community lives all year. Post-festival content (monthly recaps, artist updates, contributor spotlights) keeps momentum between editions.

### Implementation

**Tech stack:**
- Supabase for alumni contacts + interests
- Paragraph for monthly "State of ZAO" email
- Farcaster channel for weekly artist spotlights
- Research library (320+ docs) as knowledge base

**Year-round content calendar:**
- **Oct 4-31:** Festival recap phase (personal posts + NPS analysis)
- **Nov:** Scope retrospectives ("Music ops vs design: what we learned")
- **Dec:** Holiday recap + Year 2 teaser
- **Jan-Aug:** Monthly artist spotlight + contributor highlight (alternating)
- **Sep:** Year 2 preview + early recruitment

**Prompt template (monthly recap):**
```
Generate a 200-word ZAOstock month recap for {month}.

Events that happened: {list}
Key decisions: {list}
Upcoming milestones: {list}
Contributor highlights: {names}

Tone: Build-in-public + insider. Include 1 metric (e.g., "16 artist conversations", "4 sponsor agreements signed"), 1 quote, 1 preview.
```

**API endpoint (new):**
```
POST /api/stock/alumni/monthly-recap
{ month: "november", events: [...], decisions: [...] }
=> { email_html, farcaster_posts: [...] }
```

**Workflow:**
1. First of month: Candy gathers events/decisions/highlights
2. Claude generates email + 2-3 Farcaster posts
3. Paragraph queues email to 200 alumni (opted in Oct 4)
4. Posts go to `@ZAOfestivals` over first week
5. Any artist featured gets personal DM with their post

**Database schema:**
```sql
CREATE TABLE stock_alumni_subscribers (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  scope TEXT,
  subscribed_at TIMESTAMP,
  last_email_opened TIMESTAMP
);
```

**Cost:** Paragraph free + Farcaster free.

**Pareto win:** 30 minutes of monthly curation keeps 200 people warm. Year 2 recruit pool pre-qualified.

---

## 7. Community Milestone Celebrations (Auto-Post)

### Why It Matters

When ZAO hits 250 members (March 2026), 350 members (June 2026), 500 members (Sep 2026), momentum is real. Auto-post celebration to `@ZAOfestivals` + Paragraph + email.

### Implementation

**Tech stack:**
- Supabase monitoring ZAO member count (pulled weekly from Farcaster)
- Claude API for celebration message generation
- Runway Gen-3 for milestone graphic
- Farcaster SDK for auto-post

**Milestones to track:**
- ZAO member count: 250, 350, 400, 500
- ZAOstock volunteer count: 15, 25
- Festival days attended: 500, 1000, 2000
- Artist performances: 10, 25, 50

**Prompt template:**
```
Generate a celebratory Farcaster post for a ZAO milestone.

Milestone: {ZAO hit 350 members | ZAOstock attracted 25 volunteers}
Date: {date}
Context: {what this represents in ZAO mission}

Post (max 280 char):
- Open with energy ("We did it!" or "Another milestone")
- Name the number + what it represents
- Forward-looking: "Here's what's next"
- Include 1 thank-you to a specific person
- CTA: "Help us reach [next milestone]"
```

**API endpoint (new):**
```
POST /api/stock/community/milestone-check
=> { milestone_hit: boolean, milestone_name, celebration_post, image_prompt }
```

**Workflow:**
1. Weekly (Sunday): cron job runs `check_milestones()`
2. If milestone crossed: generate post + image
3. Zaal approves in dashboard
4. Post to `@ZAOfestivals` + email to alumni
5. Log in `stock_community_milestones` table

**Database schema:**
```sql
CREATE TABLE stock_community_milestones (
  id UUID PRIMARY KEY,
  milestone_name TEXT,
  threshold INT,
  current_count INT,
  hit_date TIMESTAMP,
  post_hash TEXT,
  reactions_count INT
);
```

**Cost:** Farcaster free + Runway $0.05 per image = $0.05 per milestone.

**Pareto win:** Celebrates progress publicly. FOMO effect drives new signups.

---

## 8. Sentiment Monitoring (Friction Early-Warning)

### Why It Matters

If there's tension (sponsor payment delayed, artist dropped, volunteer conflict), Discord/Telegram/Farcaster talk about it first. Daily sentiment scan flags negativity for Zaal to address proactively.

### Implementation

**Tech stack:**
- Neynar API for Farcaster mentions
- Discord API for channel scrape (with permission)
- Telegram API for group messages (bot reads only)
- Claude API for sentiment classification

**Signals to monitor:**
- Negative keywords: delay, cancel, missing, conflict, problem, frustrated
- Tone shift: decrease in enthusiastic language week-over-week
- Mention spikes: if person X mentioned 5 times in 2 days (possible friction)

**Prompt template:**
```
Analyze sentiment in ZAOstock team communication (Farcaster, Discord, Telegram).

Recent messages (48h):
{messages}

Extract:
{
  "overall_sentiment": "positive" | "neutral" | "negative",
  "friction_score": 0-100,
  "pain_points": [string],
  "people_involved": [name],
  "recommended_action": "string"
}

If friction_score > 50, flag for Zaal review.
```

**API endpoint (new):**
```
POST /api/stock/team/sentiment-scan
=> { overall_sentiment, friction_score, pain_points, action_items }
```

**Workflow:**
1. Daily 10pm: cron job runs `daily_sentiment_scan()`
2. Scrapes Farcaster mentions, Discord #zaostock, Telegram ZAOstock group (last 24h)
3. Claude analyzes, generates report
4. If friction_score > 50: send Zaal Telegram alert: "Possible tension detected. See dashboard."
5. Dashboard shows top 3 pain points + recommended action
6. Zaal reviews, decides: proactive outreach or let it settle

**Database schema:**
```sql
CREATE TABLE stock_team_sentiment_logs (
  id UUID PRIMARY KEY,
  scan_date DATE,
  overall_sentiment TEXT,
  friction_score INT,
  pain_points TEXT[],
  people_flagged TEXT[],
  zaal_acknowledged BOOLEAN,
  action_taken TEXT,
  logged_at TIMESTAMP
);
```

**Cost:** Neynar free, Discord/Telegram API free.

**Pareto win:** Catches 1-2 conflicts early. Saves time on resolution.

---

## 9. Reward Distribution Automation (Points → Unlock)

### Why It Matters

ZAOfestivals Points earned during festival (attendance, contributions, social engagement). Points unlock: "Merch bundle", "Free ticket Year 2", "Name on plaque", "Speak at next event."

### Implementation

**Tech stack:**
- Supabase `stock_team_points` ledger (activity → points)
- Claude API for unlockable item suggestions
- Email + dashboard for point balance visibility

**Points earning rules (set during festival):**
- Attendance (8am check-in): +5 points
- Shift completion (4+ hours): +10 points
- Incident resolved: +15 points
- Photo/content created (3+): +10 points
- Social engagement (5+ mentions): +5 points
- Sponsor interaction (successful pitch/close): +20 points

**Unlockable rewards (tiered):**
- 25 points: ZAOstock merch bundle (sticker, vinyl)
- 50 points: Free ticket to Year 2 ZAOstock
- 75 points: Name featured in Year 2 program
- 100+ points: Speaking slot at Year 2 opening remarks

**Prompt template (for dynamic unlockables):**
```
Given a team member's point total + scope + role, suggest 3 meaningful rewards.

Member: {name}
Scope: {ops | music | design}
Role: {lead | 2nd | member}
Total points: {number}
Preferences (if known): {preferences}

Suggest:
[
  { item: "description", points_cost: number, reason: "why this fits" }
]

Rewards should feel personal, not transactional. Ops-lead might value early-stage feedback. Music-lead might want production credit.
```

**API endpoint (new):**
```
POST /api/stock/rewards/suggest-unlockables
{ team_member_id: "uuid" }
=> { current_points, redeemable_items: [...], next_milestone }
```

**Workflow:**
1. Oct 3: activity log records all points-earning events
2. Oct 4, 11am: batch job calculates final point totals for all 17 members
3. Oct 4: dashboard shows each person their balance + 3 suggested unlockables
4. Oct 4-10: people click to "redeem" (Zaal approves)
5. Oct 11: Candy fulfills merch orders, books Year 2 seats, designs plaques
6. Dec 1: any Year 2 speaking slots locked in

**Database schema:**
```sql
CREATE TABLE stock_team_points (
  id UUID PRIMARY KEY,
  team_member_id UUID,
  activity_type TEXT,
  points INT,
  earned_at TIMESTAMP
);

CREATE TABLE stock_team_unlockables (
  id UUID PRIMARY KEY,
  team_member_id UUID,
  item_name TEXT,
  points_cost INT,
  redeemed_at TIMESTAMP,
  fulfilled_at TIMESTAMP
);
```

**Cost:** Merch + Year 2 tickets come from existing budget (doc 270). Points system = free.

**Pareto win:** Gamification increases Year 2 commitment. 2-3 people who were "maybe" become "yes."

---

## Integration with /stock/team Dashboard

**PersonalHome component updates:**

```tsx
// New sections on user's profile:
- "Your ZAOstock Recap" (post-festival, Oct 4)
- "Points Balance" (real-time, shows unlockables)
- "Year 2 Interest" (form to indicate intent)
- "Sentiment check" (monthly digest email opt-in)
- "Alumni network" (invite to Farcaster channel)

// New admin buttons (Zaal only):
- [Generate All Recaps] — run batch for 17 people
- [Predict Year 2] — cohort analysis
- [Send NPS Survey] — batch Typeform URLs
- [Queue Onboarding] — bulk add to 5-email flow
- [Sentiment Scan] — run daily analysis
- [Milestone Check] — detect + celebrate
- [Point Ledger] — view all activities + unlockables
```

**Database schema additions:**
```sql
ALTER TABLE stock_team ADD COLUMN (
  year2_interest TEXT ('yes', 'maybe', 'no'),
  estimated_return_likelihood INT,
  nps_sentiment TEXT,
  total_points INT DEFAULT 0,
  alumni_opt_in BOOLEAN DEFAULT true
);

-- Recap table (already defined above)
-- Retention cohorts table (already defined above)
-- NPS table (already defined above)
-- Onboarding queue (already defined above)
-- Sentiment logs (already defined above)
-- Points ledger (already defined above)
-- Milestones (already defined above)
```

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Recap timing | Oct 4 (48h post) | Honeymoon phase. Activity fresh, people still talking. |
| Retention prediction | Claude + manual Zaal review | Fast signal. Zaal makes final calls (not AI). |
| NPS survey | Typeform (not SurveyMonkey) | Mobile-first, free tier, Farcaster embed works. |
| Education sequence | 5-email, weekly cadence | Drip avoids overwhelm. Monthly = too sparse. |
| Sentiment monitoring | Daily, friction >50 alerts | Proactive > reactive. Catch conflicts early. |
| Points system | Activity-based (not arbitrary) | Earned, not given. Drives accountability. |
| Milestone automation | Weekly check | Scales to 500-1000 members without overhead. |

---

## 170-Day Timeline

| Week | Action | Owner |
|------|--------|-------|
| Apr 23 (this week) | Schema design + Supabase migrations | Zaal |
| May 1 | Recap generation API + prompt tested | Eng |
| May 8 | Batch recap + image generation working | Eng |
| May 15 | NPS survey drafted + Typeform account ready | Zaal |
| Jun 1 | Retention prediction logic live | Eng |
| Jul 1 | 5-email sequence templates written | Zaal |
| Jul 15 | Sentiment monitoring script live (test mode) | Eng |
| Aug 15 | Points ledger + rewards UI functional | Eng |
| Sep 1 | Milestone tracking live | Eng |
| Sep 15 | Alumni subscriber list built | Candy |
| Oct 3, 6pm | Festival ends; activity log locked |  |
| Oct 4, 8am | Batch: recaps, image generation, posts | Auto |
| Oct 4, 3pm | NPS survey posted to Farcaster | Zaal |
| Oct 11, 9am | Retention cohorts + re-invite emails sent | Zaal |
| Oct 15 | NPS analysis + themes summary posted | Zaal |
| Nov 1 | Onboarding sequence starts for Year 2 recruits | Auto |
| Dec 1-15 | Monthly recaps + alumni emails start | Candy |
| Jan+ | Year-round alumni content + spotlights | Candy |

---

## Open-Source Repos to Borrow

1. **Claude AI + Next.js Templates**
   - https://github.com/vercel/ai
   - Streaming + batch inference patterns
   - Cost: Free (MIT)

2. **Farcaster SDK (TypeScript)**
   - https://github.com/farcasterxyz/hub-monorepo
   - Post to channel, webhook handling
   - Cost: Free (MIT)

3. **Typeform + Next.js Integration**
   - https://github.com/typeform/embed-sdk
   - Embedded surveys, response webhooks
   - Cost: Free (MIT)

4. **Neynar Feed API Examples**
   - https://github.com/neynar-xyz/sdk-examples
   - Mention scraping, sentiment analysis
   - Cost: Free API (with rate limits)

5. **Runway Gen-3 Image Generation (Node SDK)**
   - https://github.com/runwayml/sdk-js
   - Batch image generation from prompts
   - Cost: $0.05 per image

6. **Paragraph Email Templates**
   - https://paragraph.xyz (built-in templates)
   - Cost: Free tier (unlimited email)

---

## Reality Check for Our Scale

- **17 teammates** = batch operations trivial. No complex scheduling needed.
- **163 days out** = 5+ months to build. Phases 1-3 ship by Jul 1 (done before artist crunch Sep 1).
- **Small team** = sentiment monitoring is overhead if no conflicts. START with optional daily log, escalate to automated after Sep 1.
- **Post-festival urgency** = Oct 4-15 is critical. Recap posts + NPS must fire. Priority.
- **Year 2 baseline** = assume 30-40% return. Personalized re-invite + reward points could push 50-60%.

**If we had 100+ teammates:** Implement full sentiment dashboard. At 17, spot-checking + Zaal's intuition + weekly team call = better ROI.

---

## Trap to Avoid

**Over-automating sentiment:** If you send Zaal a "friction alert" every time someone says "that was chaotic," he tunes it out. Set threshold = truly concerning signals only (repeated negative mentions OR escalating tone shift). Start at friction_score > 70, tune down after Oct 4 debrief.

---

## Sources

1. [Farcaster Hub + Webhook Documentation](https://docs.farcaster.xyz/hubble/hubble-examples)
2. [Neynar Feed API Guide](https://docs.neynar.com/reference/feed-endpoints)
3. [Typeform Response Analysis + Webhooks](https://developer.typeform.com/webhooks/)
4. [Paragraph Newsletter Best Practices](https://paragraph.notion.site/newsletters-guide)
5. [Festival Attendee Sentiment Analysis (EventBrite)](https://www.eventbrite.com/blog/survey-sentiment-analysis)
6. [Gamification in Events (Event Manager Blog)](https://www.eventmanagerblog.com/event-gamification)
7. [Post-Event Retention Strategies (MeetingPlay)](https://www.meetingplay.com/blog/event-retention)

---

## Related ZAO Research

- [270 — ZAOstock Planning](../270-zao-stock-planning/)
- [274 — ZAOstock Team Deep Profiles](../274-zao-stock-team-deep-profiles/)
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/)
- [476 — Apr 22 Team Recap](../476-zaostock-apr22-team-recap/)
- [477 — Dashboard 170-Day Build](../477-zaostock-dashboard-notion-replacement/)
