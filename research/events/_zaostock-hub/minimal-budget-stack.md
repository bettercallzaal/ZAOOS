# Minimal Budget Stack — Come In Under Budget

> **Mandate:** ZAOstock has to come in under $5-25K budget. Every AI tool subscription burns budget that should go to artists/tents/food.
> **Target AI spend for 163 days:** under $25 total.
> **Rule:** if there's a free or near-free alternative that does 80% of the job, use that.

This doc OVERRIDES the buy-list in `tools-matrix.md`. Re-read this first; ignore any paid SaaS recommendation in the dimension docs unless flagged here.

---

## The actual stack (total: <$25 for entire festival)

| Tool | Cost | Replaces | Coverage |
|------|------|----------|----------|
| **Claude API** (your existing key) | ~$5 total | Lavender, Regie.ai, Gong | ALL email drafting, summaries, triage, captions, extraction, analysis |
| **Supabase** (already paying for ZAO OS) | $0 incremental | SignUp.com, Volunteer Local, CRM SaaS | Volunteer roster, sponsor CRM, artist pipeline, everything dashboard does |
| **Neynar free tier** (300 req/day) | $0 | Chartmetric, artist discovery SaaS | Farcaster-native artist + volunteer + sponsor discovery |
| **Spotify Web API** | $0 | Chartmetric | Artist audio features for run-of-show energy curve |
| **Twilio** pay-as-you-go | ~$5-10 total | SMS platforms | Day-of volunteer SMS cascade (~50-100 messages × $0.0079) |
| **Hunter.io free tier** (25 lookups/mo) | $0 | Clay ($200/mo), Apollo | Sponsor email lookups — we only have 20 leads total, free tier covers it |
| **Google Meet native recording + captions** | $0 | Otter, Fathom, Fireflies | Meeting transcripts — export caption, feed to Claude |
| **Whisper via Claude Haiku** OR browser Speech Recognition API | $0-2 total | Deepgram ($38) | Voice-note-to-text for incident logging on Oct 3 |
| **iMovie + Claude direction** | $0 | Runway ($30-50), Descript | Highlight reel post-event |
| **ffmpeg** (local) | $0 | Opus Clip, Submagic | Video clipping for artist 30-sec reels |
| **Tally free tier** | $0 | Typeform ($30) | NPS survey post-event |
| **OpenWeather free tier** (1000 calls/day) | $0 | Tomorrow.io, Visual Crossing | Weather monitoring Sep 25 onward |
| **Weather.gov** (US federal, no key needed) | $0 | Same as above | Backup weather source |
| **Firefly** (ZAO already uses) | $0 | Buffer, Hootsuite | Cross-post to Farcaster + X |
| **Paragraph** (ZAO already uses) | $0 | Substack, Mailchimp | Email newsletter |
| **Google Sheets + Claude** | $0 | QuickBooks, Xero | Budget tracking (already have BudgetTracker in dashboard — this is backup) |
| **Discord + Telegram** (ZAO already uses) | $0 | Slack | Team comms |
| **Supabase Storage** (already paying) | $0 incremental | Dropbox, S3 separate | All attachments (decks, riders, photos) |
| **OR-Tools** (Python/Google) | $0 | Timefold, OptaPlanner | Volunteer shift optimization |
| **HelloSign free tier** (3 docs/mo) | $0 | DocuSign ($15/mo) | Artist contract signatures |
| **pdfplumber + pdfkit** (npm) | $0 | AWS Textract | Rider PDF parsing + invoice generation |

**Grand total projected AI spend: $10-25 across all 163 days.**

---

## What we are NOT buying and why

| Tool | Monthly | Why we skip |
|------|---------|-------------|
| Clay.com | $200 | 20 sponsor leads total; Hunter free tier + manual Farcaster search covers it. Revisit if we hit 100+ leads for Year 2. |
| SignUp.com | $99 | Our own dashboard has VolunteerRoster table. Building on Supabase = $0 incremental. |
| Deepgram Nova | $38 (25 meetings) | Google Meet native captions + Claude = free. Meeting transcripts don't need studio-quality ASR at our scale. |
| Runway Gen-3 | $30-50 | Post-event reel can be cut in iMovie in 2 hours. Runway saves maybe 45 min. Not worth the spend if budget is tight. |
| Descript | $12-24/mo | ffmpeg + Claude directions handle the editing we need. |
| Typeform | $30/mo | Tally does the same thing free with a ZAO-branded URL. |
| DocuSign | $15/mo | HelloSign free tier covers 3 docs/mo. 10 artists × 1 contract each = 10 docs. Start in May to spread across 6 months × 3 free = 18. Fits. |
| Lavender / Regie.ai | $30-50/mo | Claude API does personalization for pennies. |
| Gong / Chorus | $100+ /mo | 0 outbound sales calls at our scale. Skip entirely. |
| Otter / Fathom / Fireflies | $10-20/mo | Meeting notes are ~3/month. Google Meet + Claude = free. |
| Buffer / Hootsuite | $15+/mo | Firefly already covers cross-post. |
| Chartmetric | $140/mo | Our artist discovery is Farcaster-native + personal relationships. Not chart-driven. |
| QuickBooks / Xero | $25+/mo | We have BudgetTracker in dashboard. Google Sheets as backup. |
| Tomorrow.io / Visual Crossing | $50-100/mo | OpenWeather + Weather.gov free tiers are enough. |
| Hunter.io paid | $49+/mo | Free tier = 25 lookups/mo. We have 20 total leads. Fits. |
| Roboflow / YOLO hosted | $50+/mo | Skip crowd counting entirely. Manual headcount at gates + wristband counter is enough for Year 1. |

---

## Pareto 80/20 — the 4 wires that do 80% of the work

1. **Claude API for all drafting** — sponsor emails, artist outreach, meeting summaries, captions, incident triage. Total Claude spend for 163 days: ~$5.
2. **Supabase dashboard** — every CRM/pipeline/roster lives here. No SaaS needed.
3. **Neynar + Farcaster** — artist + volunteer + sponsor discovery. Free.
4. **Twilio SMS** — day-of coordination. ~$10 for entire event.

**Everything else is optional.** The festival runs if these 4 work.

---

## What to still test before spending anything

Even for the $25 stack, validate each tool against our specific use case before wiring:

- **Hunter.io free tier:** does 25 lookups/mo actually cover our 20 sponsor leads? (Yes, unless we need to re-enrich. Stay under the limit by doing lookups only once per company.)
- **Google Meet caption export:** test once with a team meeting to confirm the export workflow.
- **Whisper via Claude Haiku:** for incident voice-logging — test one voice note end-to-end before Oct 3.
- **HelloSign free tier:** does it handle our artist contract? Test with 1 artist in June before relying on it for all 10.

---

## Budget impact

If budget is the tight constraint ($5-25K total including venue, artists, tents, food):

| Line item | Full stack | Minimal stack | Savings |
|-----------|-----------|---------------|---------|
| AI tooling over 6 months | $1,400 | $25 | **$1,375** |
| % of $10K budget | 14% | 0.25% | 13.75 points back to the event |

**That $1,375 = 3-4 more artist fees, a better tent package, or just cash buffer for day-of surprises.**

---

## If things change

Revisit paid tools ONLY when:
- Sponsor pipeline grows past 50 leads (then Clay is worth it)
- Meeting volume grows past 10/month (then Deepgram/Otter worth it)
- Volunteer roster grows past 50 (then SignUp.com worth it)
- Festival becomes annual with 1000+ attendees (then Runway reel + higher-tier weather + proper CRM worth it)

None of those apply in Year 1.

---

## The revised "this week" list (zero additional cost)

1. **Sponsor outreach** — Hunter free tier lookup for Bangor Savings VP Marketing. Claude drafts email. Send by EOD Fri Apr 24. Log in SponsorCRM.
2. **Artist discovery** — Neynar query for Farcaster music handles tagged ZAO. Drop 15 candidates into ArtistPipeline wishlist.
3. **Volunteer recruitment** — post /stock/apply link on Farcaster + Discord. No SaaS needed; our dashboard handles intake.

All three: **$0 spent**. Same outcome as the paid stack, slower on maybe 2 of the 3.

---

## Reality check

The paid stack optimizes for Zaal's time (saving ~80 hours). The minimal stack optimizes for cash.

At $50/hr fully-loaded cost of Zaal's time, $1,375 saved = 27.5 hours of Zaal time you can spend on things AI can't do: calls with artists, walking the venue with Steve Peer, hugs with Tyler/DCoop/team, the actual content.

Paying $1,375 for 80 hours of automation vs keeping the cash and spending 27.5 hours manually drafting emails is a **break-even tradeoff** — AND the manual work creates better relationships because artists + sponsors can tell when a human wrote the email vs when Claude did.

**Recommendation: go minimal stack until something clearly breaks. Upgrade one tool at a time only when pain is real.**
