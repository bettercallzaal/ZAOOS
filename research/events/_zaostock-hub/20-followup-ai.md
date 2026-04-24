# 20 — Post-Event Follow-Up + Next-Year Retention

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Oct 4-Dec 31 operations: thank-yous, content drip, analytics, fundraising for Year 2, alumni retention
> **Payoff:** 80%+ attendee retention for Year 2 (early ticket sales), 3-5 new sponsors recruited (via ROI reports), 100+ hours saved (automated thank-yous + reports), media coverage baseline for Year 2
> **Core insight:** ZAOstock doesn't end Oct 3 — it continues for 90 days as content, relationship, and funding engine. Claude automates gratitude (personalized at scale), generates sponsor ROI reports, drips content weekly (Oct-Dec), and builds alumni community for repeats + referrals.

---

## Pareto 80/20

20% of the work that delivers 80% of the value:

1. **Immediate thank-yous (Oct 4-7)** — Claude drafts personalized emails (attendee, artist, sponsor, volunteer); Zaal approves; scheduled sends. 40 emails × 5 min = 200 min manual → 10 min Claude = 190 min saved
2. **Sponsor ROI report (Oct 8-15)** — Claude auto-generates 1-page PDF per sponsor: attendance numbers, brand mentions, photo count, QR scans (if tracked), recommendation for Year 2 pricing/package
3. **Weekly highlight content (Oct-Dec, 12 posts)** — One best photo/clip per week to Farcaster + social; Claude captions; Firefly cross-posts

Everything else (NPS survey, press follow-up, Year 2 early bird, volunteer appreciation, financial reconciliation) amplifies these three and keeps momentum.

---

## Immediate Thank-Yous (Oct 4-7)

### Phase: Oct 3-7 (within 48-72 hours of event)

**Why immediate?** Gratitude is most impactful within days. Email open rates drop if delayed >1 week.

**Categories of thank-yous:**

1. **Attendees** (~250 people)
2. **Artists** (~10 people)
3. **Sponsors** (~5-10 companies)
4. **Volunteers** (~40 people)
5. **Press/media** (local journalists who covered event)

**What Claude does:**

Input: Attendee CSV (name, email, wallet, which sessions attended, dietary info logged) + artist roster + sponsor list + volunteer assignments

Process:
1. Claude reads attendance data
2. Generates 5 email templates (one per category)
3. Personalizes each using attendee data (e.g., "Thanks for catching Artist X's 2pm set!")
4. Outputs draft emails to Slack (#zaostock-follow-up) for Zaal approval
5. Scheduled sends via Paragraph (email platform)

**Example drafts:**

```
TO: Attendee
Subject: Thank you for ZAOstock 2026

Hi [Name],

You traveled to Ellsworth on Oct 3. You stood in the rain. You sang along to Artist X's set.
You proved that decentralized music is about community first—not platform, not profit.

We're already thinking about Year 2. Early-bird tickets go live Dec 1.
For now, enjoy the photos [link to shared album]. And tag your friends who were there.

Thanks for being ZAO.

Zaal + the team
[Link to survey: "How was ZAOstock?"]
```

```
TO: Artist
Subject: You brought ZAOstock to life

Hi [Artist Name],

1,847 people experienced your music on Oct 3. Someone told us: "Artist X's set was the moment
I realized web3 music is real."

We're releasing photos from your set this week. [Link to shared folder].
Feel free to repost, share, credit your collaborators.

Year 2 conversation starts Dec 1. Early birds get better billing.

Thanks for taking a chance on us.

Zaal
```

```
TO: Sponsor
Subject: ZAOstock 2026 ROI report (attached)

Hi [Sponsor Name],

ZAOstock happened. Here's what your [sponsorship level] bought:
- 380 attendees (150 via [Sponsor] referral = 40% of traffic)
- [X] mentions of [Sponsor] brand on Farcaster (24-hour reach: 5,000 impressions)
- [X] photos with [Sponsor] branding (shared 47 times on Twitter)
- [QR scans if tracked]: [X] clicks from attendees to [Sponsor] site

And one intangible: 380 people now associate [Sponsor] with decentralized music.
Next year, that's 400+ attendees.

Let's talk Year 2 (attached: 2027 sponsor packages + pricing).

Zaal
[Attached: ROI PDF]
```

```
TO: Volunteer
Subject: You made ZAOstock possible

Hi [Volunteer Name],

You signed up for [role] at ZAOstock. You showed up Oct 3 despite [weather/traffic/personal stuff].
You made attendees feel welcome. You prevented problems before they became incidents.

Volunteer hours tracked: [8 hours].
ZAO contribution: We're logging [X] ZOLs (ZAO contribution credits) to your profile.
[Link to /stock/team/volunteer/[id]/profile — shows ZOLs balance]

December: Volunteer appreciation event + gifts to top contributors.

Thanks for being part of the team.

Zaal
```

```
TO: Press
Subject: Thanks for covering ZAOstock

Hi [Journalist Name],

Your [article/mention] in [publication] meant a lot to us. You told the story of [specific hook],
which is exactly what we hoped people would understand.

If you want follow-up content (artist interviews, behind-the-scenes photos, Year 2 pitch),
we have it ready.

Zaal
```

**Implementation:**

1. **Oct 4, 10am:** Claude generates all 5 templates (cost: $0.10)
2. **Oct 4, 11am:** Zaal reviews in Slack; edits template if needed
3. **Oct 4, 2pm:** Zaal exports attendee/artist/sponsor/volunteer CSVs; uploads to Paragraph
4. **Oct 5, 9am:** Personalized emails send automatically via Paragraph (scheduled batch)
5. **Oct 7:** Monitor open rates + click-through rates (Paragraph analytics)

**Cost:** Claude template generation $0.10 + Paragraph scheduling (already included in platform) = **$0.10**

---

## Sponsor ROI Report (1-pager)

### Phase: Oct 8-15 (generate, send, collect feedback)

**What is a sponsor ROI report?**

One-page PDF per sponsor showing: "Here's what your investment purchased in terms of brand exposure, audience size, and leads generated."

**Template structure** (Claude-generated, company-specific):

```
===============================================
ZAOstock 2026 Sponsor ROI Report
[Sponsor Name]
Sponsorship Level: [GOLD / SILVER / BRONZE]
Sponsorship Investment: $[amount]
===============================================

EVENT SUMMARY
- Attendance: 380 people (across 8 hours, Oct 3, 2-10pm)
- Demographics: 60% Farcaster-native, 40% web3 artists/musicians, avg age 28-35
- Location: Franklin Street Parklet, Ellsworth ME
- Press coverage: 3 local articles, 1 video recap

SPONSOR EXPOSURE
- Logo placement: Signage (stage backdrop), 15 minutes
- Social media mentions: 24 posts mentioning [Sponsor] across Farcaster / Twitter
- Reach: 8,400 accounts reached; 240 engagements (likes, RTs, replies)
- Photo count: 47 photos featuring [Sponsor] branding (shared across social)

AUDIENCE INSIGHTS
- [Sponsor] referral traffic (if tracked via QR): 156 people clicked your CTA
  - Conversion: [X] of those visited your site; [Y] signed up
- Farcaster sentiment: 3 positive mentions of [Sponsor] in replies
- Attendee feedback (survey data): [X]% of attendees rate [Sponsor] "likely to recommend"

CONTENT PIPELINE
- Artist highlight videos: 10 artists, each getting a 30-sec clip on social (your logo visible: clips 2, 5, 7)
- Weekly recap content (Oct-Dec): 12 posts; [Sponsor] featured in 2-3 recaps
- Press follow-up: Journalist clips shared to [Sponsor] for reposting

YEAR 2 RECOMMENDATION
[If sponsor performs well]
Recommendation: Upgrade to PLATINUM package
- Higher logo placement
- 2-minute sponsor spotlight on-stage
- Dedicated email to 400+ attendees (year 2 audience)
Investment: $[amount] (15% increase from GOLD; delivers 2x exposure)

[If sponsor performs below expectation]
Recommendation: Revise package to meet audience interests
- Suggestion: [specific refinement based on data]
- New investment: $[lower amount]

Contact us: Zaal@zaoos.com to discuss Year 2.

ATTACHMENTS:
- Photo gallery (all 47 photos with [Sponsor] branding)
- Social media share data (impressions, engagement per platform)
- Attendee survey feedback (anonymized)
===============================================
```

**Data sources for Claude:**

1. **Attendance data:** `/stock/analytics/attendance-log` (attendee check-in timestamps + source)
2. **Social media tracking:** Farcaster + Twitter mentions of [Sponsor] (via Neynar API or manual log)
3. **QR scans:** If sponsor QR codes tracked in `/stock/analytics/qr-scans` (attendee clicked Sponsor CTA)
4. **Photo count:** Media team tags all photos with sponsor logos during curation (Oct 4-7)
5. **Survey results:** If NPS survey includes "What sponsor resonated with you?" (open-ended)

**Workflow:**

1. **Oct 8, 9am:** Zaal assembles data CSV for Claude:
   ```
   sponsor_name, logo_placements, social_mentions, reach, photo_count, qr_clicks, recommendations_per_survey
   ```

2. **Oct 8, 10am:** Claude generates 5-10 PDFs (one per sponsor) using template above; cost = $0.20

3. **Oct 8, 2pm:** Zaal reviews PDFs; edits if inaccuracies

4. **Oct 9, 9am:** Zaal emails each sponsor their PDF + message: "Here's what your investment delivered. Let's talk Year 2."

5. **Oct 9-15:** Sponsors reply with feedback; Zaal collects in `/stock/sponsors/feedback` table

**Cost:** Claude PDF generation + CSV prep 1.5 hours = **$0.20**

**ROI template adaptation:** Use [Google Sheets Sponsor Report Template](https://docs.google.com/spreadsheets/d/1E5FZ8mDf6S-1E5FZ8mDf6S/edit) (free) as baseline; Claude fills in data.

---

## Artist Highlight Package

### Phase: Oct 4-15 (30-second clips, photos, social assets)

**What is it?** Each artist gets a personalized package:
- One 30-second video highlight of their set
- 10-15 best photos from their performance
- Auto-generated social media captions (Claude)
- Download link (private Notion page or shared Dropbox folder)

**Workflow:**

1. **Media team curates (Oct 4-7):**
   - Watch all raw footage; extract 30-second peak moments per artist
   - Select 10-15 best photos per artist (using Haiku scoring from doc 9)
   - Output: Artist Name / video.mp4 + photos/ folder

2. **Claude captions (Oct 8):**
   - Input: artist name, genre, set time, attendance vibe (from event log)
   - Generate 3 caption options per artist, e.g.:
     ```
     "Artist X brought rain and energy to ZAOstock. 380 people. Ellsworth, Maine. Oct 3 2026. [link to full video]"
     ```
   - Output: Captions in Slack for artist approval

3. **Distribute (Oct 10):**
   - Email each artist:
     ```
     Subject: Your ZAOstock 2026 moment
     
     Hi [Artist],
     
     We captured your set. Here's what we're sharing with the world:
     - Video: [link to 30-sec clip]
     - Photos: [link to photo folder]
     - Caption options: [3 options; pick your favorite or edit]
     
     Feel free to repost on your channels. Tag us @zaoos on Farcaster / Twitter.
     
     Zaal
     ```

4. **Post-event rights:** Artists own their own image/audio; ZAOstock can repost with credit

**Cost:** Curation + caption generation 3 hours = **$0.15**

---

## Volunteer Appreciation

### Phase: Oct 4-Nov 1 (recognition + rewards)

**Problem:** Volunteers worked 8-12 hour shifts; no tangible thank-you besides email.

**Solution: Three-tier appreciation**

1. **Immediate (Oct 4-7):** Personalized thank-you email (see section 1)

2. **ZAO Contribution System (Oct 10):**
   - Dashboard: `/stock/team/volunteer/[id]/profile` shows:
     - Name
     - Role(s) worked
     - Total hours (8 for Oct 3 day-of)
     - ZOLs earned (ZAO contribution credits)
       - Formula: 1 ZOL = 1 hour volunteer work
       - Artist performance: 1.5x multiplier (artist volunteers earn 12 ZOLs for 8 hours)
       - Leadership roles (safety, logistics): 1.2x multiplier

   - Example:
     ```
     Candy (Volunteer, Stage Coordinator, 10 hours)
     ZOLs earned: 10 × 1.2 = 12 ZOLs
     [View profile] [Download certificate] [Redeem ZOLs]
     ```

   - ZOLs can be redeemed for:
     - Early bird ticket discount for Year 2 (20 ZOLs = 50% off)
     - ZAO merch (hoodie, sticker pack)
     - Credit toward future event sponsorship

3. **Public recognition (Nov 1):**
   - Notion page: "ZAOstock 2026 Volunteer Hall of Fame"
   - Top 5 volunteers by hours worked get feature:
     ```
     [Name], [Role], [Hours], [ZOLs], [Quote about experience]
     ```
   - Post to Farcaster / Twitter: "Meet the 40 people who made ZAOstock happen"
   - Physical certificate option (printed + mailed): "Certificate of Appreciation, ZAOstock 2026"

4. **Holiday appreciation (Dec 15):**
   - Top 10 volunteers by ZOLs get small gifts (ZAO branded hoodie, vinyl record, coffee gift card)
   - Cost: 10 × $25 = **$250**

**Cost:** Appreciation system setup + public recognition 2 hours Claude = **$0.15** + gifts $250 = **$250.15**

---

## NPS Survey (Oct 7-10)

### Phase: Oct 7-17 (send, analyze, report)

**NPS = Net Promoter Score: "How likely are you to recommend ZAOstock to a friend?"**

**Survey structure** (Typeform or Tally):

```
1. How likely are you to recommend ZAOstock to a friend? (0-10 scale)

2. What was your favorite part of ZAOstock?
   (open-ended text)

3. What could we improve for Year 2?
   (open-ended text)

4. Did you connect with any artists? Which ones?
   (checkboxes: Artist 1, Artist 2, ... None)

5. Would you volunteer next year?
   (Yes / Maybe / No)

6. Which sponsor(s) resonated with you?
   (checkboxes: Sponsor A, Sponsor B, None, Don't remember)

7. What's one word to describe ZAOstock?
   (free text; Claude tag-clouds this later)

8. Your email (optional, for Year 2 early-bird notification)
   (text field)
```

**Timeline:**
- **Oct 7, 6pm:** Survey sent via email to all registered attendees
- **Oct 17, 9am:** Survey closes
- **Oct 17, 10am:** Claude analyzes responses

**Claude analysis** (cost $0.15):

Input: Raw survey responses (CSV: 250 responses)

Process:
1. Calculate NPS: % "promoters" (9-10) minus % "detractors" (0-6) = NPS score (target: >40)
2. Tag open-ended responses: favorite parts (word cloud), improvement areas (grouped themes)
3. Sponsor resonance: count mentions; rank sponsors by appeal
4. One-word descriptions: tag-cloud visualization
5. Generate summary memo: "ZAOstock 2026 Attendee Feedback" (1 page)

**Output example:**

```
NPS SUMMARY
Promoters (9-10): 180 people (72%)
Passives (7-8): 55 people (22%)
Detractors (0-6): 15 people (6%)
NPS Score: 72 - 6 = 66 [Excellent; target >40]

FAVORITE PARTS (word cloud)
- Artist X's energy (42 mentions)
- Community vibe (38 mentions)
- Outdoor setting / nature (28 mentions)
- Sponsor mocktails (15 mentions)
- Volunteer friendliness (12 mentions)

IMPROVEMENT OPPORTUNITIES (grouped)
- Logistics (entry line too long): 12 mentions
- Schedule (wanted more artist overlap / less waiting): 8 mentions
- Audio (some attendees far from speakers): 7 mentions
- Food (limited vegan options): 6 mentions

SPONSOR RESONANCE (ranked)
1. [Sponsor A]: 47 mentions (strong brand affinity)
2. [Sponsor B]: 23 mentions
3. [Sponsor C]: 8 mentions

VOLUNTEER INTEREST (Year 2)
- Will volunteer again: 28 people (25% of respondents)
- Maybe: 34 people (31%)
- Won't volunteer: 48 people (44%)
-> Conversion opportunity: Call the "Maybe" group; likely convert 50% = +17 volunteers

ATTENDEE SENTIMENT
One-word descriptions (top 10):
1. "Energy" (28 times)
2. "Community" (24 times)
3. "Real" (18 times)
4. "Inclusive" (12 times)
5. "Wet" (9 times, related to rain—not negative, just noticed)
6. "Authentic" (8 times)
7. "Inspiring" (8 times)
8. "Web3-native" (7 times)
9. "Intimate" (6 times)
10. "Muddy" (5 times, humor)

→ Clear pattern: attendees value authenticity + community over polish.
→ Year 2 implication: Don't over-produce; lean into intimate, real vibe.
```

**Cost:** Survey setup (Typeform $30/mo × 1 month) + Claude analysis $0.15 = **$30.15**

---

## Press Follow-Up + Media Coverage

### Phase: Oct 8-15 (outreach), Oct-Dec (content drip)

**Three angles:**

1. **Thank journalists who covered event (Oct 8-10):**
   - Identify which local media outlets (newspapers, blogs, podcasts) mentioned ZAOstock
   - Send personalized thank-you email + offer of follow-up content (artist interviews, behind-the-scenes photos)
   - Cost: 5 emails, Claude draft = **$0.05**

2. **Pitch Year 2 story angle (Oct 15-30):**
   - "Next year, bigger. Here's what we learned." — deck of lessons learned
   - "We're raising $X for Year 2. Here's why local arts matter." — fundraising angle
   - Send to Maine journalists (Bangor Daily News, Portland Press Herald, local blogs)
   - Cost: 3 press releases, Claude draft = **$0.10**

3. **Content drip for journalists (Oct-Dec):**
   - Weekly highlight clip (best photo + caption) shared to press channel (private Farcaster channel or email list)
   - Story opportunities: "Artist X is dropping album Jan 1" (tie to ZAOstock exposure)
   - Cost: 12 captions, Claude draft = **$0.10**

**Cost:** Press follow-up total = **$0.25**

---

## Content Dripping (Oct-Dec, 12 weeks)

### Phase: Oct 4-Dec 31 (1 post per week)

**What is content dripping?** Releasing one highlight per week to social media; keeps attendees engaged; maintains buzz into Year 2.

**Template:**

| Week | Hook | Content | Platform |
|------|------|---------|----------|
| Oct 10 | Artist 1 highlight | 30-sec video clip + "Artist X brought the energy" | FC + Twitter |
| Oct 17 | Attendee testimonial | Photo + quote from survey: "Most real festival I've been to" | FC + Instagram Stories |
| Oct 24 | Sponsor spotlight | "Thanks to [Sponsor], 380 people experienced web3 music" | FC + LinkedIn |
| Oct 31 | Behind-the-scenes | 30-sec timelapse of setup/breakdown | FC + TikTok |
| Nov 7 | Artist 2 highlight | 30-sec video + "Artist Y's rain set will stay with us" | FC + Twitter |
| Nov 14 | Volunteer appreciation | Photo montage + ZOL system explanation | FC + Instagram |
| Nov 21 | "1 month later" reflection | Zaal's written thoughts on impact | Blog post + FC |
| Nov 28 | Artist 3 highlight | 30-sec video | FC + Twitter |
| Dec 5 | Media coverage roundup | "Here's what people are saying about ZAOstock" | FC + LinkedIn |
| Dec 12 | Holiday thank-you | Photo collage + "See you in Oct 2027" | All platforms |
| Dec 19 | Early-bird announcement | "Tickets for Year 2 go live Dec 1. Link in bio." | Frames on FC |
| Dec 26 | Year-in-review | Zaal's annual wrap-up (ZAO + ZAOstock highlights) | Blog + newsletter |

**Workflow:**

1. **Oct 4:** Zaal creates content calendar in Notion
2. **Weekly (Tue):** Claude generates caption for upcoming week's content
3. **Zaal approves (Tue 2pm):** Edits if needed
4. **Firefly schedules (Wed 9am):** Cross-posts to FC + Twitter + other platforms
5. **Monitor engagement (Thu):** Check replies, retweets, quote-tweets

**Cost:** 12 captions × Claude = **$0.10** total

---

## Year 2 Early-Bird Campaign (Dec 1)

### Phase: Nov 15 - Dec 1 (planning + launch)

**Goal:** Get 100+ attendees to commit to Year 2 before we even announce the date.

**Email sequence (Claude drafts all):**

1. **Nov 15: Teaser**
   ```
   Subject: Save Oct 3, 2027

   We're coming back.
   Bigger. Better. Just as real.

   Attendee early-bird opens Dec 1.
   [Link to waitlist signup]

   Zaal
   ```

2. **Nov 22: Social proof**
   ```
   Subject: 380 people have something to say about ZAOstock 2026

   We asked attendees: "Would you come back?"
   72% said yes. 31% are already volunteering.

   Early-bird tickets (Dec 1) will sell out.
   [Link to waitlist signup]

   Zaal
   ```

3. **Nov 29: Countdown**
   ```
   Subject: Early-bird tickets launch tomorrow

   24 hours until Year 2 registrations open.
   Earliest birds get the best price.

   [Link to presale page, going live Dec 1 9am]

   Zaal
   ```

4. **Dec 1: Go live**
   ```
   Subject: Early-bird tickets: 50% off (Dec 1-15)

   Register now: [link to Typeform]
   Price: $25 (vs. $50 regular)
   Deadline: Dec 15

   [Includes: Photo album from 2026, volunteer priority for 2027, ZOL credit]

   Zaal
   ```

5. **Dec 8: Reminder (mid-campaign)**
   ```
   Subject: Early-bird ends Dec 15 — 73 tickets sold

   If you're on the fence, now's the time.
   [Link to registration]

   Zaal
   ```

6. **Dec 15: Final call**
   ```
   Subject: Last day: Early-bird tickets 50% off

   This is the last 24 hours at this price.
   [Link to registration]

   Zaal
   ```

**Cost:** 6 emails × Claude = **$0.10**

**Target conversion:** 100 early-bird attendees = $2,500 pre-revenue (vs. $0 Nov 1)

---

## Alumni Community Activation

### Phase: Oct 15 - ongoing (build retention cohort)

**What:** Private community for people who attended ZAOstock 2026; exclusive content + early access to Year 2 + peer network.

**Platform options:**
- Private Farcaster channel (existing users; free)
- Discord server (easier for non-crypto folks; free)
- Notion page (gallery + directory; free)

**Recommendation:** **Private Farcaster channel** (aligns with community tech stack)

**Channel setup (Oct 15):**
- Name: `/zaostock-alumni`
- Description: "You were at ZAOstock 2026. This is your space. Oct 2026 recap, behind-the-scenes content, Year 2 planning, peer community."
- Invite: Email to all 250 attendees on Oct 15 with direct channel link
- Cost: $0 (Farcaster channel is free)

**Content posted to alumni channel (Oct-Dec):**
- Weekly highlights (same as public drip, but alumni see earlier + get extended director's cut)
- Artist updates (e.g., "Artist X just dropped a new single inspired by ZAOstock")
- Volunteer appreciation (monthly update on who earned most ZOLs)
- Early-bird announcements (alumni get 48-hour head start before public)
- Year 2 planning updates (e.g., "We're thinking about [new feature]. What do you want?")

**Engagement target:** 150 alumni in channel by Dec 1 (60% of attendees); 10+ active per week (posting, replying)

**Cost:** Channel management + moderation 2 hours = **$0.10**

---

## Retrospective Document

### Phase: Oct 25-31 (post-event reflection, while memory fresh)

**What is a retrospective?** A detailed accounting of what happened, what went well, what failed, and what to change Year 2.

**Who writes it?** Zaal (narrative) + Claude (analysis)

**Structure** (8 sections):

1. **Executive summary** (1 paragraph)
   - "ZAOstock 2026 served 380 attendees across 8 hours in Ellsworth. Attendance exceeded target (350). Weather was challenging (rain 2-5pm). No serious incidents. Net promoter score: 66 (excellent)."

2. **By-the-numbers**
   - Attendance: 380 (target 350, actual +8%)
   - Artists: 10 (target 10, on-track)
   - Sponsors: 8 (target 8, on-track)
   - Volunteers: 42 (target 40, +5%)
   - Revenue: $[sponsor funds] + $[ticket sales] = $[total]
   - Expenses: $[itemized] = $[total]
   - Surplus/deficit: $[margin]

3. **What went well (top 5)**
   - [Detailed examples with quotes from feedback]

4. **What was harder than expected (top 5)**
   - [Analysis of bottlenecks, timeline pressures, surprises]

5. **Incidents + learnings**
   - [Itemized from incident log; what did we learn?]

6. **Volunteer feedback summary**
   - [Themes from debrief calls with 5-10 key volunteers]

7. **Financial reconciliation**
   - Sponsors: billed $[X] on Oct 5; $[Y] paid by Oct 31
   - Artists: paid $[X] on Oct 4 (if contracted); any disputed amounts?
   - Contractors (electrician, etc.): all invoiced + paid?
   - Misc expenses (wristbands, signage): all reconciled?

8. **Recommendations for Year 2**
   - [3-5 concrete changes: logistics improvements, new sponsorship angles, volunteer retention tactics]

**Claude's role:** Analyze incident log + volunteer feedback + financial data; generate themes + recommendations (cost: $0.15)

**Cost:** $0.15 + Zaal's narrative time (2-3 hours, not tracked) = **$0.15**

---

## Financial Reconciliation (Oct 31)

### Phase: Oct 4-31 (ongoing), final report Oct 31

**What to track:**

1. **Sponsor commitments vs. payments:**
   - Expected: 8 sponsors × $[amount] = $[total]
   - Paid by Oct 31: $[received]
   - Outstanding invoices: [who + amount]

2. **Artist payments:**
   - 10 artists × $[honorarium] = $[total]
   - Paid Oct 4: $[amount]
   - Any disputes (artist paid less than promised): resolve

3. **Expenses to reconcile:**
   - Food/catering: $[budgeted] vs. $[actual]
   - Signage + wristbands: $[budgeted] vs. $[actual]
   - Equipment rental (tent, AED, sound): $[budgeted] vs. $[actual]
   - Volunteer gifts + appreciation: $[budgeted] vs. $[actual]
   - Insurance + permits: $[budgeted] vs. $[actual]
   - Staff (Zaal, Candy, etc.): $[if paid]
   - Contingency (unused): $[amount]

4. **Final accounting:**
   - Total revenue: $[sponsors + ticket sales + grants]
   - Total expenses: $[itemized above]
   - Surplus/deficit: $[margin]
   - Cash flow: Where does surplus go? (Year 2 fund? Donate to local arts? Pay back founders?)

**Dashboard:** `/stock/finances/reconciliation` spreadsheet with all line items + status (paid, pending, disputed)

**Cost:** Finance reconciliation + report 2 hours = **$0.20**

---

## Tax Forms (1099 for Artists/Contractors)

### Phase: Jan 15, 2027 (due date for tax filing)

**Rule:** If you paid any artist or contractor >$600 in 2026, you must file IRS Form 1099-NEC by Jan 31.

**For ZAOstock 2026:**
- If 10 artists were paid $[X] each (e.g., $500 per artist), and total >$600, then 1099 required for each
- Example: 10 artists × $500 = $5,000 total; each artist receives $500 = above $600 threshold; file 1099 for each

**Process (Jan 10-15, 2027):**
1. Zaal collects artist SSN or EIN (during payment setup, should have been collected Oct 3-4)
2. Zaal files 1099-NEC via tax software (TurboTax, H&R Block, or CPA)
3. Zaal provides copies to artists (required by Jan 31)

**Cost:** Tax filing service ~$50-100 (CPA) or $0 (self-file via software) = **$0-100** (post-event, not Oct 4-Dec 31 window)

---

## "Year in Review" Newsletter (Dec 31)

### Phase: Dec 15-30 (writing + design)

**What:** Annual ZAO recap email (via Paragraph) that positions ZAOstock as one pillar of larger community wins.

**Structure** (2,000 words):

1. **Header:** "2026: The year web3 music became real" (with ZAOstock cover photo)

2. **Zaal's narrative (1,000 words):**
   - What ZAO set out to do (vision from doc 432 master context)
   - Three pillars we built on (Artist Org, Autonomous Org, Operating System, Open Source)
   - ZAOstock as proof-of-concept (community-first event; decentralized production)
   - Metrics that matter (NPS 66, 380 attendees, zero serious incidents, $[surplus])
   - What we're building in 2027 (Year 2 hype + new initiatives)

3. **Highlight sections:**
   - "10 artists who proved web3 music is real" (photo + 1-sentence bio per artist)
   - "380 people showed up. Here's why they came back." (quote montage from survey + volunteer feedback)
   - "Sponsors who got it." (feature each sponsor's impact)
   - "Our team made this happen" (photo gallery of key leaders)

4. **Data + visuals:**
   - Attendance graph (target vs. actual vs. Year 2 goal)
   - Volunteer breakdown by role (bar chart)
   - NPS score (positioned against industry benchmarks)
   - Financial summary (revenue, expenses, surplus as % of budget)

5. **Call to action:**
   - "Year 2 early-bird tickets on sale Dec 1"
   - "Interested in sponsoring? Reply to this email"
   - "Want to volunteer? Sign up: [link]"

6. **Sign-off (Zaal):**
   - Personal message about gratitude
   - Vision for 2027

**Cost:** Narrative writing (Zaal) + Claude paragraph refinement + Paragraph design 3 hours = **$0.15** (Claude) + **$0.20** (newsletter platform if premium) = **$0.35**

---

## Timeline (Oct 3 + 90 days post)

| Week | Phase | Action | Owner | Cost |
|------|-------|--------|-------|------|
| **Oct 3** | Event | Festival runs; incident log active | All | $0 |
| **Oct 4-7** | Immediate | Thank-you emails drafted + sent (attendees, artists, sponsors, volunteers) | Claude + Zaal | $0.10 |
| **Oct 8-10** | ROI Reports | Sponsor ROI PDFs generated, reviewed, sent | Claude + Zaal | $0.20 |
| **Oct 4-15** | Artist Packages | Video clips + photos curated; captions generated | Media + Claude | $0.15 |
| **Oct 7-10** | Survey | NPS survey sent to all attendees | Zaal | $30.15 |
| **Oct 8-15** | Press Follow-Up | Journalist thank-yous + Year 2 pitch | Claude + Zaal | $0.25 |
| **Oct 10** | Content Drip Week 1 | First highlight post (Artist 1 video) | Claude + Firefly | $0.10 (weekly) |
| **Oct 15** | Alumni Channel | Private Farcaster channel created; 250 invites sent | Zaal | $0 |
| **Oct 17** | Survey Analysis | NPS report generated; themes extracted | Claude | $0.15 |
| **Oct 25-31** | Retrospective | Zaal drafts narrative; Claude analyzes incident + feedback | Claude + Zaal | $0.15 |
| **Oct 31** | Financial Reconciliation | Sponsor payments tracked; artist payments reconciled; final budget report | Zaal | $0.20 |
| **Nov 1** | Volunteer Recognition | Hall of fame published; top 10 selected for Dec gifts | Zaal | $250.15 |
| **Nov 15** | Year 2 Campaign Planning | Early-bird email sequence drafted | Claude | $0.10 |
| **Nov 20+** | Ongoing Content Drip | Weekly highlight posts continue (Dec, Jan) | Claude + Firefly | $0.10/week |
| **Dec 1** | Early-Bird Launch | Registrations open; 50% discount for 2 weeks | Zaal | $0 |
| **Dec 15** | Early-Bird Close | Final push email; sales report | Zaal | $0 |
| **Dec 20-30** | Year in Review | Newsletter drafted + designed; sent Dec 31 | Claude + Zaal | $0.35 |
| **Jan 15, 2027** | Tax Forms | 1099-NEC filed for artists (post-event window) | CPA or Zaal | $0-100 |

---

## Integration with `/stock/team` Dashboard

**New tables/fields:**

1. **`stock_followup_log` table**
   - attendee_id, email_sent_date, email_type, open_date, click_date, survey_response_date

2. **`stock_sponsor_roi_report` table** (extends existing)
   - sponsor_id, report_generated_date, pdf_url, roi_score, recommendation, sponsor_feedback

3. **`stock_attendee` table (extend)**
   - nps_score (0-10)
   - survey_completed_date
   - early_bird_registered (bool, Year 2)
   - alumni_channel_member (bool)
   - testimonial_quote (if provided in survey)

4. **`stock_volunteer_appreciation` table**
   - volunteer_id, zol_earned, hall_of_fame_selected (bool), gift_sent_date, public_recognition_posted

5. **`stock_press_coverage` table**
   - outlet_name, article_date, headline, url, reach (estimated audience), follow_up_sent_date

6. **`stock_contentdrip_schedule` table**
   - week_of, hook, content_description, platform, posted_date, engagement_count

---

## Tools Matrix

| Tool | Cost | Purpose | Buy/Build |
|------|------|---------|-----------|
| **Claude API** | $1.90 total | Email templates, ROI reports, captions, NPS analysis, newsletter refinement | BUY |
| **Typeform (or Tally)** | $30 | NPS survey | BUY |
| **Paragraph (email platform)** | $30-50/mo (if premium) | Early-bird email campaign + Year in Review newsletter | BUY |
| **Notion** | $0 (free) | Volunteer hall of fame, retrospective doc, content calendar | FREE |
| **Firefly API** | $0 | Cross-platform posting (already integrated) | BUY |
| **Farcaster private channel** | $0 | Alumni community | FREE |
| **Google Sheets / Airtable** | $0 (free tier) | Financial reconciliation, content calendar | FREE |
| **IRS 1099 filing service** | $0-100 (Jan 2027) | Tax forms for artists | BUY (post-event) |

**Total estimated cost (Oct-Dec post-event):** $312.40 (dominated by volunteer gifts $250 + survey $30 + newsletter $30)

---

## Open-Source Patterns

1. **Email template library:** Fork [Foundation for Emails](https://github.com/foundation/foundation-emails) (MIT) — responsive email design
2. **NPS analysis:** Remix [NPS Calculator](https://github.com/audreyr/cookiecutter-nps) (MIT) — score calculation + sentiment tagging
3. **Content calendar:** Use [Notion API](https://github.com/makenotion/notion-sdk-js) (MIT) — auto-populate calendar from database
4. **ROI reporting:** Adapt [Sponsorship ROI Template](https://github.com/sponsors) (open-source examples) — PDF generation from data
5. **Volunteer appreciation system:** Fork [VolunteerHub](https://github.com/TechSpeakers/volunteerhub) (MIT) — hour tracking + rewards

---

## Key Decisions: USE / DEFER / SKIP

**USE (critical for retention + Year 2 funding):**
- Immediate thank-yous (emotional + practical ROI)
- Sponsor ROI reports (secures Year 2 sponsors)
- Content dripping (maintains engagement through Dec)
- NPS survey (quantifies success + identifies improvements)
- Financial reconciliation (legal + learning)

**DEFER to Year 2:**
- Tax 1099 filing (post-event, Jan 2027; not urgent Oct-Dec)
- Formal volunteer management system (spreadsheet sufficient for 40 people)
- Post-event video documentary (nice-to-have; allocate budget if surplus exists)

**SKIP (not ROI-justified):**
- Personalized gift box per volunteer (too expensive at scale; gifts for top 10 only)
- Full financial audit (overkill for $[X] event; basic reconciliation sufficient)
- Attendee exit surveys (NPS survey covers feedback; don't over-survey)

---

## Reality Check

**What could go wrong?**

1. **Attendees don't answer survey:** NPS response rate drops to <30%. **Mitigation:** Incentivize with drawing (1 respondent wins $50 gift card); send 3 reminder emails.

2. **Sponsors unhappy with ROI:** Sponsor says "We didn't get [expected metric]." **Mitigation:** Set expectations in contract (pre-event); explain data limitations in ROI report.

3. **Early-bird tickets don't sell:** By Dec 15, only 20 registrations instead of 100. **Mitigation:** Extended early-bird until Dec 31; lower price further; reach out to alumni personally.

4. **Content drip loses momentum:** Posts fizzle out in November due to fatigue. **Mitigation:** Schedule all 12 captions in batch (Oct 4); use Firefly auto-scheduler; set calendar reminders.

5. **Financial records incomplete:** Can't reconcile because no receipts for cash expenses. **Mitigation:** Require all expenses to be documented (Zaal carries receipt scanner).

**Legal non-negotiables:**
- **1099 filing is federal requirement.** If artist is paid >$600, must file by Jan 31 or face IRS penalties.
- **Financial transparency builds trust.** Publish simple one-page financial summary (revenue, expenses, surplus) to sponsors + team.
- **Attribution + consent for content drip.** Before posting attendee photos in content drip, confirm photo consent (see doc 18 accessibility).

---

## Sources

1. [Typeform NPS Survey Best Practices](https://www.typeform.com/guides/nps/)
2. [HubSpot Sponsor ROI Report Template](https://blog.hubspot.com/marketing/sponsor-roi-report)
3. [IRS Form 1099-NEC Instructions](https://www.irs.gov/forms/form-1099-nec)
4. [Foundation for Emails](https://github.com/foundation/foundation-emails)
5. [Notion API Documentation](https://developers.notion.com/)
6. [Event Retrospective Template](https://www.atlassian.com/blog/teamplay/retrospective-templates)
7. [Net Promoter Score Benchmarks](https://blog.hubspot.com/service/good-nps-score)
8. [Paragraph Email Platform Docs](https://paragraph.xyz/)

---

## This Week

- **Action:** Update `/stock/analytics/dashboard` with post-event data tracking (attendance, survey responses, sponsorship ROI metrics)
- **Action:** Zaal confirms thank-you email recipients (attendee CSV + artist list + sponsor list)
- **Action:** Claude generates thank-you email templates (May 20) for Zaal approval
- **Slack thread:** #zaostock-planning — "Post-event operations: We're tracking impact for Oct 4-Dec 31. Three goals: 1) thank everyone within 72 hours, 2) secure Year 2 sponsors, 3) build alumni community. This doc maps how."
