# ZOE Integration: 20 AI Dimensions for ZAOstock

> **Doc:** zoe-integration.md
> **Status:** Shipping plan + cron map
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **ZOE model:** Telegram-native single agent, two brains (Haiku daily + Opus for heavy lifting), Claude API + Supabase admin access
> **VPS:** 31.97.148.88 (primary), can SSH + execute scripts
> **Command layer:** Telegram bot + HTTP webhooks + cron jobs (5 daily)

---

## How ZOE Fits In

ZOE is ZAOstock's **operations dispatcher**. Instead of 17 humans tracking 20 dimensions separately, ZOE runs 5 cron jobs + responds to 5 Telegram commands to surface the critical state of the festival pipeline. ZOE reads Supabase, calls Claude API for analysis, writes activity logs, and alerts the command team via SMS/Telegram when something needs immediate attention.

No new infrastructure. ZOE already has: Telegram API, Anthropic SDK (Haiku/Sonnet/Opus routing), Supabase admin client, Twilio SMS, SSH to prod. This doc wires ZOE into each of the 20 dimensions.

---

## ZOE's ZAOstock Role Map

### 5 Daily Cron Jobs (set at VPS startup)

| Job | Cron | What ZOE Does | Outputs | Priority |
|-----|------|---------------|---------|----------|
| **Morning Sponsor Check** | 06:00 EST daily | Queries `stock_sponsors` table: due-date overdue, no-contact-in-7d, committed-but-unpaid. Ranks by $impact. | Telegram to Zaal: "3 sponsors need follow-up this week (total $8K at risk)" + dashboard link | P1 |
| **Midday Artist Status** | 12:00 EST daily | Queries `stock_artists`: confirmed vs. wishlist, any missing contact info, contracts unsigned, travel requests pending | Telegram: "6 of 10 lineup locked. 3 pending rider confirmation by May 1." | P1 |
| **Afternoon Pipeline Forecast** | 15:00 EST daily | Reads stock_timeline + stock_action_items: which milestones are 5 days out? what's blocking next week? | Telegram: "Decision on merch quantities needed by Thu (blocks ordering). 4 volunteer slots still open." | P2 |
| **Evening Meeting Prep** | 17:30 EST Tue/Thu | Reads last week's stock_action_items (overdue), stock_decisions (unresolved), stock_timeline. Generates next meeting's agenda. | Telegram + Zaal's Google Calendar description auto-updated with 5-item agenda | P2 |
| **Weekly Retro** | 06:00 EST Mon | Compiles last week's activity: sponsors moved, artists locked, decisions made, action items completed/overdue. | Telegram: weekly standup report (Zaal shares in team call or Discord) | P3 |

### 5 Telegram Commands (Zaal or Candy trigger anytime)

| Command | What ZOE Does | Returns | Use Case |
|---------|-------------|---------|----------|
| `/stock sponsor status` | Lists all sponsors by stage (lead/contacted/in_talks/committed/paid/declined), last_contacted_at, $ amount | Card per sponsor group: "6 in pipeline ($14K), 2 committed ($8K), 1 declined" | Weekly checkpoint, before outreach sprint |
| `/stock artist status` | Lists confirmed vs. pending artists, missing info flags (contract/rider/travel), conflicts | Card: "7 locked, 2 pending rider, 1 missing email" | Music decision meetings, lineup anxiety check |
| `/stock blockers` | Reads stock_action_items WHERE status = 'blocked' + stock_decisions WHERE resolved = false | "3 blockers: merch design, sound tech contract, sponsor logo assets. Est. unblock Thu." | Mid-sprint triage, before meetings |
| `/stock forecast [days:7]` | Reads stock_timeline: what's due in next N days? Auto-flags critical path items (can't defer) | "7 days: sponsor payments ($5K due), artist confirmations (4 still pending), volunteer scheduling opens" | Zaal's daily sync with Candy/DCoop |
| `/stock incident` | During festival (Oct 3 only): reads voice logs from Telegram, auto-triages by severity, posts cards to team | Telegram thread: "[CRITICAL] stage audio cut — suggest backup gen, page Candy" (auto-mention) | Day-of ops only |

### Emergency Day-Of Role (Oct 3, 9am-9pm)

ZOE becomes the **festival command center**:

1. **Voice logging:** Volunteers send `/log` voice messages to ZOE. ZOE transcribes (Deepgram API), auto-parses, appends to `stock_incident_logs` table.
2. **Incident triage:** Every voice log + manual Slack message feeds Claude triage (cached roster of who's responsible for what). Returns severity + suggested owner + action.
3. **SMS alert cascade:** Zaal or duty manager reviews triage cards in Telegram. Clicks "Alert" → auto-sends SMS to specific groups (stage crew, gates, medical, all).
4. **Activity logging:** Every event (artist loaded, stage clear, medical incident, crowd milestone) auto-logs to timeline for post-event debrief.
5. **Missing person + emergency escalation:** If `incident_type` = 'medical' or 'missing_person', auto-page on-site medic + Zaal via Telegram + SMS in parallel.

---

## 20 Dimensions: ZOE Integration Map

### 01 - Sponsor Outreach Automation

**ZOE's role:** Monitor sponsor pipeline. Alert Zaal when leads stall. Auto-log outreach attempts.

**Trigger:** Morning cron (06:00 daily) + manual `/stock sponsor status`

**What ZOE reads:**
- `stock_sponsors` table: all 20 leads
  - Stage: lead, contacted, in_talks, committed, paid, declined
  - last_contacted_at, reason_for_outreach, estimated_amount
- `stock_activity_log` (sponsor events): email_sent, call_made, meeting_booked

**What ZOE writes:**
- `stock_activity_log` entry on manual Telegram signal (Candy posts "emailed sponsor X"), auto-logs timestamp
- Prometheus metric: daily "leads in pipeline" gauge
- Telegram to Zaal: morning summary "3 leads need follow-up (last contact >7d ago)"

**ZOE's prompt (Haiku, 500 tokens):**
```
You are a festival sponsor scout. Here are 20 potential sponsors for ZAOstock 
(Oct 3, Franklin Street Parklet, Ellsworth ME, $5-25K ask).

Read the sponsor pipeline:
[INSERT sponsor_leads JSON: name, company, track, stage, last_contacted_at, amount]

For each sponsor in 'lead' or 'contacted' stage with last_contacted_at > 7 days ago:
1. Suggest the next outreach (email? phone? LinkedIn? Farcaster?)
2. Estimate likelihood they'll commit (high/medium/low) based on giving history
3. Rank by impact (total $ at risk)

Output:
- Hot sponsors (top 3 to focus on this week)
- Follow-up strategy for each
- Estimated pipeline health (% to goal)
```

**Integration code path:**
```
POST /api/stock/team/sponsors/log-outreach
Body: { sponsorId, eventType: 'email_sent' | 'call_made' | 'meeting_booked', notes? }
-> Auto-creates stock_activity_log entry
-> Triggers ZOE Telegram notification to command team
```

**What to wire this week:**
- `/stock sponsor status` Telegram command (query + format sponsor data)
- Morning cron job (06:00 EST) to call ZOE sponsor check

**What to defer to May:**
- Clay.com integration (prospect enrichment + ICP scoring) — wire when 1st new lead added
- Webhook auto-logging (manual Telegram command works first, then automate)

**What to skip:**
- Multi-channel follow-up (Instantly, Reply.io) — manual email first, revisit if team burns out

---

### 02 - Artist Discovery + Booking

**ZOE's role:** Track artist pipeline. Alert on missed deadlines (contact window closes May 15). Remind of confirmations due (June 1).

**Trigger:** Midday cron (12:00 daily) + `/stock artist status` command

**What ZOE reads:**
- `stock_artists` table: 10-artist target
  - Status: wishlist, contacted, in_talks, confirmed, declined
  - Deadline: first_contact_window (May 15), confirmation_due (June 1), contract_due (July 1)
  - Social links: Farcaster, Spotify, Bandcamp, email
- `stock_contracts` table: signed, pending_signature, rejected

**What ZOE writes:**
- Telegram reminder: "2 days left to contact remaining artists (3 slots open). First contact window closes May 15."
- `stock_activity_log`: artist_contacted, artist_interested, contract_signed
- Prometheus gauge: lineup_confirmation % (how many of 10 locked?)

**ZOE's prompt (Haiku, 400 tokens):**
```
You are a music curator for ZAOstock. Here's the lineup status (10-artist target).

Current artists:
[INSERT confirmed + in_talks artists with status + contact date]

Deadlines:
- May 15: stop contacting new artists (confirmation window opens)
- June 1: all confirmations must be finalized
- July 1: all contracts signed
- Sep 3: hard cutoff (artist roster locked)

For each artist still in 'wishlist' or 'contacted':
1. Is deadline at risk? (days until May 15)
2. What's the next action? (send contract? follow-up call? Farcaster DM?)
3. Backup plan: if they decline, who's the replacement?

Output:
- Lineup status (X of 10 confirmed)
- Critical path (what must happen this week to stay on schedule)
- Replacement candidates (1-2 per declined artist, if any)
```

**Integration code path:**
```
POST /api/stock/team/artists/log-event
Body: { artistId, eventType: 'contacted' | 'interested' | 'contract_signed' | 'declined', details }
-> stock_activity_log entry
-> Triggers ZOE Telegram notification

GET /api/stock/team/artists/farcaster-discovery (weekly job)
-> Runs Neynar query (casts + bio matching)
-> Inserts new artists into stock_artists with source='farcaster'
-> ZOE posts Telegram: "[DISCOVERY] 7 new Farcaster artists found, check stock_artists"
```

**What to wire this week:**
- `/stock artist status` Telegram command
- Farcaster discovery route (weekly batch job, insert into DB, notify ZOE)
- Midday cron job

**What to defer to May:**
- Spotify API integration (genre/local discovery) — wait for free tier confirmation
- Manager enrichment (Hunter/Apollo) — direct Farcaster DM faster

---

### 03 - Volunteer Recruitment + Matching

**ZOE's role:** Track volunteer signups. Match skills to roles. Alert when understaffed.

**Trigger:** Afternoon cron (15:00 daily) + `/stock blockers` (if volunteer slots shown as critical)

**What ZOE reads:**
- `stock_volunteers` table: name, email, skills (stage, sound, gates, merch, medical, crowd control), availability
- `stock_roles` table: stage_lead (1), sound_tech (2), gates_captain (2), merch_manager (1), medical (1), crowd_control (4), setup_crew (5) = 16 core roles
- `stock_action_items` WHERE category='volunteer_recruitment': status, due_date

**What ZOE writes:**
- Telegram alert: "4 volunteers confirmed, 12 slots open. Critical: sound tech (0/2) and medical (0/1)."
- `stock_activity_log`: volunteer_signup, role_assigned
- Prometheus gauge: volunteer_coverage % (slots_filled / slots_needed)

**ZOE's prompt (Haiku, 350 tokens):**
```
ZAOstock needs 16 volunteers on Oct 3. Here's the current roster.

Roles + coverage:
[INSERT roles table: name, needed_count, assigned_count, critical: bool]

Volunteers:
[INSERT volunteer table: name, skills, availability_dates]

1. Which roles are understaffed? Rank by criticality (stage > gates > merch > setup).
2. Can any volunteers do multiple roles? Suggest role assignments.
3. What's missing? (specific skills you need to recruit for)
4. Estimated coverage in 2 weeks? 4 weeks? (trend)

Output:
- Coverage summary (X of 16 slots filled)
- Role assignments (recommended matches)
- Critical skill gaps (must recruit)
- Timeline to full coverage
```

**Integration code path:**
```
POST /api/stock/team/volunteers/signup
Body: { name, email, skills[], availability[] }
-> Inserts stock_volunteers
-> ZOE scores against open roles
-> Telegram suggestion: "Jane signed up (sound + stage skills). Assign to sound_tech or backup_stage?"

POST /api/stock/team/volunteers/[id]/assign-role
Body: { roleId }
-> Updates stock_volunteer_assignments
-> stock_activity_log entry
```

**What to wire this week:**
- Volunteer signup form (embed in `/stock/team`)
- Role matching prompt (Haiku, cache the role definitions)

**What to defer to June:**
- Volunteer training tracking (shift scheduling, shifts worked) — wire in July

---

### 04 - Run-of-Show Optimization

**ZOE's role:** Check artist set times against stage logistics. Alert on conflicts (load-in overlap, sound check time, transitions too tight).

**Trigger:** Afternoon cron (15:00 daily, after artist confirmations locked)

**What ZOE reads:**
- `stock_runofshow` table: artist_id, stage_load_in_time, set_start, set_end, next_artist_load_in, transition_break
- `stock_artists.travel_arrival_time` (when they arrive on-site)
- `stock_timeline`: sound_check_opens, doors_open, festival_end

**What ZOE writes:**
- Telegram alert: "2 artists have overlapping load-in windows (Artist 2 arrives 12:30, Artist 3 loads 12:00). Suggest 15-min buffer."
- `stock_runofshow.conflict_flags` JSON: list of timing issues
- `stock_activity_log`: runofshow_optimized_at timestamp

**ZOE's prompt (Haiku, 400 tokens):**
```
ZAOstock stage schedule (Franklin Street Parklet, ~200 cap, 1 stage).

Artists (in order):
[INSERT runofshow table: artist, load_in_time, set_start, set_end, next_artist_load_in]

Rules:
- Minimum transition: 15 min between sets (teardown + soundcheck)
- Load-in buffer: 30 min before set (setup time)
- Sound check: 20 min per artist (concurrent with last artist's set? or after?)
- Dinner break: 2pm-3pm (no artists)

Check for conflicts:
1. Any overlapping load-in or sound check times?
2. Any transitions < 15 min?
3. Artist travel arrival conflicts (e.g. Artist 2 arrives 2:45, needs to go on 3:15)?

Output:
- Revised schedule (if conflicts exist)
- Risk flags (e.g. "tight transition for Artist 4, soundcheck cuts close to set")
- Dinner break placement (recommend 2-3pm)
```

**Integration code path:**
```
POST /api/stock/team/runofshow/generate
Body: { artists_confirmed: [] }
-> Claude generates initial schedule
-> Checks for conflicts
-> stock_runofshow table populated
-> ZOE posts Telegram: "[SCHEDULE] 10-artist lineup scheduled. 0 conflicts. Check dashboard."

POST /api/stock/team/runofshow/[artistId]/adjust-time
Body: { newLoadInTime, reason }
-> Updates timing
-> Triggers ZOE conflict check
-> Returns updated schedule + any new conflicts
```

**What to wire this week:**
- Run-of-show table schema (artist, timing, transitions)
- ZOE conflict-check prompt

**What to defer to July:**
- Dinner break automation (coordinate with catering schedule)
- Sound tech notes per artist (load-in vs. soundcheck vs. set needs)

---

### 05 - Day-Of Coordination + Incident Response

**ZOE's role:** THE command center on Oct 3. Voice logging, incident triage, SMS cascades, activity timeline.

**Trigger:** 08:00-21:00 on Oct 3 only (Telegram bot listens for voice messages + commands)

**What ZOE reads (Oct 3 only):**
- `stock_incident_logs` (real-time voice transcripts + manual Slack messages)
- `stock_roles_assignment` (who's in charge of what today?)
- `stock_timeline` (critical windows: doors open 1pm, first artist 1pm, peak crowd 5pm, cleanup 8pm)

**What ZOE writes:**
- `stock_incident_logs` table: voice_transcript, speaker_id, timestamp, classified_type (vendor, stage, medical, crowd, weather)
- `stock_incident_triage` table: incident_id, severity, suggested_owner, action, resolved_at
- SMS via Twilio: alert groups (stage_crew, gates, medical, all)
- Telegram thread (activity feed): chronological log for post-event debrief

**ZOE's prompt (Sonnet, 1000 tokens cached):**
```
You are the festival command center for ZAOstock, Oct 3, 2026.

Your roster:
- Stage lead: Candy (stage transitions, artist load-in)
- Music director: DCoop (artist issues, sound engineer)
- Gates/crowd: Alex (capacity, entry/exit, traffic)
- Merch: Shawn (merch booth, cashier)
- Medical: [On-site medic] (injuries, emergencies)
- Overall: Zaal (decisions, sponsor VIPs, escalations)

Phone numbers: [CACHE THIS: role -> phone mapping]

Incident types:
- CRITICAL: injury/medical, stage power, artist no-show, weather >80% rain, capacity >150%, sound loss
- HIGH: stage delay >5min, vendor ETA overdue >30min, gate line >20min, missing person report
- MEDIUM: equipment swap needed, timing shift <5min, crowd question
- INFO: status updates ("artist loaded", "stage clear")

When you receive a voice log or Slack message:
1. Extract the incident: type, severity, impact (timing? safety? budget?)
2. Suggest owner (who's responsible?)
3. Suggest action (what do they do in next 2 min?)
4. Recommend SMS alert group (all? stage? gates?)

Example:
Input: "Vendor gate: two trucks backed up, ETA 15 min, can we delay artist load-in?"
Output: 
  severity: HIGH
  type: vendor
  owner: Alex
  action: Check load-in time with Candy, confirm backup plan with vendor
  alert_group: stage_crew, gates
  sms: "Vendor delay 15min. Alex checking with Candy on artist load-in adjustment."
```

**Integration code path:**
```
# Voice logging (Telegram)
/log [voice message] -> Deepgram transcribe -> POST /api/stock/incident/log
Body: { speaker_id, transcript, timestamp }
-> stock_incident_logs entry
-> Triggers ZOE triage

# Manual incident (Slack or Telegram)
/incident [severity] [type] [description] -> POST /api/stock/incident/create
Body: { severity, incident_type, description, speaker_id }
-> stock_incident_logs entry
-> Triggers ZOE triage

# Triage output
GET /api/stock/incident/triage-queue
-> Returns severity-ordered list of untriaged incidents
-> Zaal/Candy reviews in Telegram thread
-> Click "Alert" -> POST /api/stock/incident/[id]/alert
Body: { groups: ['stage_crew', 'gates'], message: "Vendor delay confirmed..." }
-> Twilio SMS sent to group phone numbers

# Activity logging (event completed)
POST /api/stock/incident/[id]/resolve
Body: { status: 'resolved', resolution_time }
-> Updates timeline
-> Telegram: "Incident closed: vendor delay resolved in 12 min"
```

**What to wire THIS WEEK (May):**
- Deepgram integration (voice transcription API)
- ZOE triage prompt (Sonnet, 1000-token cache)
- Telegram voice logging endpoint
- SMS alert groups configuration

**What to test in June:**
- Mock incident drills with Zaal + Candy (2-3 scenarios)
- Walkie-talkie protocol (how do volunteers report?)
- SMS delivery (confirm all numbers work)

---

### 06 - Social Media Amplification

**ZOE's role:** Log social media posts. Track engagement. Alert on viral moments (live).

**Trigger:** `/stock social status` command (Zaal queries anytime) + cron at 20:00 (post-event daily summary)

**What ZOE reads:**
- `stock_social_posts` table: content, platform, publish_time, url
- Farcaster API: reactions, recasts, replies (via Neynar)
- X API: likes, retweets, replies

**What ZOE writes:**
- `stock_activity_log`: post_published, viral_moment (if engagement >100 in first hour)
- Telegram alert: "Sponsor spotlight post hit 150 likes in 1 hour. Share to team?"
- Prometheus gauge: social_reach (weekly impressions)

**ZOE's prompt (Haiku, 300 tokens):**
```
ZAOstock social media summary (week of [date]).

Posts published:
[INSERT social_posts: content_snippet, platform, publish_time, reactions_24h, reach]

Engagement rules:
- Viral: >100 reactions in first hour (repost, celebrate)
- Good: 50-100 reactions (normal, expected)
- Low: <50 reactions (may need boost or timing adjustment)

For each post this week:
1. Engagement tier (viral / good / low)
2. Best time to reshare? (if low engagement)
3. Topic that resonated (for future posts)

Output:
- Weekly social summary (total reach, top post, trends)
- Recommendations for tomorrow (what to post about)
```

**Integration code path:**
```
POST /api/stock/team/social/publish
Body: { content, platforms: ['farcaster', 'x', 'youtube'], schedule_at? }
-> Publishes to Neynar (Farcaster) + X API
-> stock_social_posts entry
-> Tweets back URL to team

GET /api/stock/team/social/analytics
Query: ?start_date=2026-04-20&end_date=2026-04-27
-> Returns weekly summary with Farcaster + X metrics
-> ZOE posts daily summary at 20:00 to Telegram
```

**What to wire by May 1:**
- Social post logging route (publish + track)
- Neynar + X API integration (read reactions)
- Daily summary cron at 20:00

**What to defer to June:**
- Engagement scoring (which topics resonate?)
- Auto-repost of viral moments

---

### 07 - Post-Event Analytics

**ZOE's role:** After Oct 3, compile event data for debrief. ROI on sponsors, artist performance, volunteer hours, social impact.

**Trigger:** Oct 4, 06:00 — automatic post-event report

**What ZOE reads:**
- `stock_incident_logs` (all day-of activity from Oct 3)
- `stock_sponsors` (who paid, who didn't, $ total)
- `stock_social_posts` (total reach, engagement)
- `stock_volunteers` (hours worked, roles)
- `stock_attendance` (estimate: gate count + early feedback)

**What ZOE writes:**
- `stock_event_report` (new table): json blob with full summary
- Telegram: 10-minute post-event report (Zaal can share in Discord)
- CSV export: attendee feedback, volunteer hours, social metrics

**ZOE's prompt (Sonnet, 800 tokens):**
```
Post-event debrief for ZAOstock (Oct 3, 2026, Franklin Street Parklet).

Key metrics to extract:
[INSERT incident_logs, sponsor log, social posts, volunteer_assignments]

Report structure:
1. By the numbers (attendance, sponsors, artists, volunteers)
2. Highlights (best moments, social wins, smooth ops)
3. Challenges (incidents, missed goals, lessons learned)
4. Finance summary (revenue vs. budget)
5. Social impact (reach, engagement, sentiment)
6. Recommendations for next year

Output: 500-word narrative report + JSON summary
```

**Integration code path:**
```
POST /api/stock/event/finalize (triggered Oct 4, 06:00)
Body: { event_date: '2026-10-03' }
-> Aggregates all tables
-> Calls Claude report generation
-> Stores in stock_event_report
-> Exports CSV to Google Drive
-> Telegram: "Post-event report ready. Download CSV or read full report in dashboard."
```

**What to wire before Oct 3:**
- Attendance counter (gate / scan integration, or manual tally)
- Incident log completeness (make sure all day-of activity is logged)

---

### 08 - Budget Forecasting + Variance Tracking

**ZOE's role:** Weekly budget health check. Alert if spending tracks over budget. Forecast cash runway.

**Trigger:** Cron at 07:00 every Friday (weekly burn check)

**What ZOE reads:**
- `stock_budget` table: category, allocated, spent_to_date, committed (pending invoices)
- `stock_expenses` table: vendor, amount, date, status (draft, submitted, paid)
- `stock_timeline`: key payment dates (artist deposits, venue, catering)

**What ZOE writes:**
- Telegram alert: "On pace to spend $18K (budget $20K). 3 payments pending ($3K)."
- `stock_activity_log`: budget_alert, variance_flagged
- Prometheus gauge: budget_variance % (spent / allocated)

**ZOE's prompt (Haiku, 350 tokens):**
```
ZAOstock budget health check (week of [date]).

Budget allocation:
[INSERT budget table: category, allocated, spent_to_date, committed]

Spending to date: $X (Y% of budget)
Time remaining: 163 days

Forecast questions:
1. Are we on pace? (spend rate)
2. What's committed but not paid? (risk)
3. What's left to spend on? (artist deposits, catering, insurance, misc)
4. Runway to Sep 3 (hard cutoff for final spend)?

Output:
- Budget health (on pace / at risk / over)
- Pending payments ($ amount, due date)
- Recommendations (defer anything? accelerate fundraising?)
```

**Integration code path:**
```
POST /api/stock/team/expenses/submit
Body: { vendor, amount, category, receipt_url }
-> stock_expenses entry
-> Triggers ZOE budget check (if over budget, Telegram alert)

GET /api/stock/team/budget/status
-> Returns current allocation, spent, variance
-> ZOE posts Friday 07:00 summary to Telegram
```

**What to wire by May:**
- Expense submission form (embed in `/stock/team`)
- Budget variance prompt (Haiku, cached budget structure)

---

### 09 - Media Production Assist

**ZOE's role:** Log photos/videos. Auto-tag moments. Suggest best shots for social.

**Trigger:** Oct 3 during event + manual `/stock media` command

**What ZOE reads:**
- `stock_media` table: photo_url, timestamp, photographer, tags, caption
- `stock_incident_logs` (what was happening at each time?)

**What ZOE writes:**
- `stock_media.auto_tags`: 'artist_2_set', 'crowd_peak', 'sponsor_vip', 'stage_transition'
- Telegram: "Best 5 photos from 4-6pm (peak crowd). Ready to post?"
- CSV export: all media with captions, tags, copyright info

**ZOE's prompt (Haiku, 300 tokens):**
```
Photo curation for ZAOstock social (Oct 3, 2026).

Available photos:
[INSERT media table: timestamp, tags, description]

Festival timeline:
[INSERT runofshow: artist, set_time]

Rank photos by:
1. Emotional impact (artist energy, crowd joy, sponsors visible)
2. Composition (good framing, lighting, faces)
3. Social relevance (highlight diverse artists, community feel, sponsors)

Output:
- Top 5 for Instagram (suggested captions)
- Top 3 for Farcaster (brief hooks)
- Top 1 for hero banner (next-year marketing)
```

**Integration code path:**
```
POST /api/stock/team/media/upload
Body: { photo_url, timestamp, photographer }
-> stock_media entry
-> ZOE tags + suggests caption (Haiku)
-> Telegram: "New photo from 4:15pm (Artist 2 set). Caption: '[SUGGESTION]'. Edit or approve?"

GET /api/stock/team/media/best-of?start_time=...&end_time=...
-> Returns curated list with captions
-> Zaal copies + pastes to Farcaster/X
```

**What to wire by Sep:**
- Media upload endpoint (S3 + Supabase metadata)
- Photo tagging prompt (Haiku, linked to runofshow)

---

### 10 - Community Building + Retention

**ZOE's role:** Track community engagement before/after festival. Alert if momentum dips.

**Trigger:** Cron at 08:00 Mondays (weekly community health check)

**What ZOE reads:**
- `stock_community_activity` table: farcaster_casts, discord_messages, email_opens
- `stock_volunteers` (who's engaged? who's quiet?)
- `stock_audience_survey` (are people excited about Oct 3?)

**What ZOE writes:**
- Telegram alert: "8 new community signups this week. Momentum strong."
- `stock_activity_log`: community_pulse_check
- Prometheus gauge: community_engagement (weekly active users)

**ZOE's prompt (Haiku, 300 tokens):**
```
Community health check for ZAOstock (week of [date]).

Engagement metrics:
- Farcaster: X new casts mentioning ZAOstock
- Discord: X new messages, Y active members
- Email: X opens on latest newsletter
- Volunteers: X new signups, Y active contributors

Trend:
- Growing (excitement increasing)
- Stable (steady interest)
- Declining (need re-engagement)

For community health:
1. Engagement trend (up / stable / down)
2. Who's active? Who's quiet?
3. Next engagement opportunity (remind about registration? ask for help?)

Output:
- Community pulse (1-line vibe)
- Trend (week-over-week)
- Action (next community touch)
```

**Integration code path:**
```
GET /api/stock/team/community/pulse
-> Aggregates Farcaster casts (Neynar), Discord activity (API), email opens (SendGrid)
-> ZOE analyzes weekly
-> Telegram: "Community momentum: strong (12 new mentions, 8 signups). Keep content flowing."
```

**What to wire by June:**
- Community activity tracking (Neynar, Discord API, SendGrid)
- Weekly pulse cron

---

### 11 - Contributor Onboarding + Task Matching

**ZOE's role:** Assign newcomers to tasks. Track skill growth. Alert if someone's stuck.

**Trigger:** New volunteer signup + weekly `/stock contributors` check

**What ZOE reads:**
- `stock_volunteers` (skills, availability, hours contributed)
- `stock_action_items` (who's assigned? who's stuck?)
- `stock_roles` (what skills do we need?)

**What ZOE writes:**
- Telegram DM to new volunteer: "Welcome! We need help with [X, Y, Z]. Which interests you?"
- `stock_volunteer_assignments`: skill match + task assignment
- `stock_activity_log`: volunteer_onboarded, task_assigned

**ZOE's prompt (Haiku, 300 tokens):**
```
Volunteer onboarding for ZAOstock.

New volunteer:
[INSERT volunteer profile: name, email, skills, availability]

Open roles:
[INSERT stock_roles: needed, unfilled, skill_match%]

Matching logic:
1. Which role matches their skills best?
2. Can they learn on the job?
3. How many hours can they contribute?

Output:
- Recommended role (reason)
- Onboarding task (first thing to do)
- Buddy assignment (experienced volunteer to mentor them)
```

**Integration code path:**
```
POST /api/stock/team/volunteers/onboard
Body: { volunteerId, firstTaskId }
-> ZOE generates welcome message + task assignment
-> Telegram to volunteer: "Welcome [name]! Your first task: [task]. Questions? Ask in #zaostock Discord."
-> stock_volunteer_assignments entry
```

**What to wire by May:**
- Onboarding prompt (Haiku, cached role definitions)
- Telegram welcome message dispatch

---

### 12 - Meeting Facilitation + Note-Taking

**ZOE's role:** Auto-summarize meetings. Extract decisions + action items. Send Telegram reminders.

**Trigger:** After each Tuesday/Thursday meeting + `/stock meeting status` command

**What ZOE reads:**
- `stock_meeting_transcripts` (Google Meet -> Deepgram)
- `stock_meeting_summaries` (Claude-generated summaries)
- `stock_action_items` (decisions + owners + due dates)

**What ZOE writes:**
- `stock_action_items` table: auto-populates from transcript
- Telegram reminders at -48h and -24h before due date
- `stock_decision_log` (doc 13 input)

**ZOE's prompt (Haiku, 400 tokens):**
```
Meeting summarizer for ZAOstock team calls.

Transcript:
[INSERT Deepgram transcript: speakers, text, timestamps]

Attendees: [list]
Duration: [X min]

Extract:
1. DECISIONS: What did we decide? (phrase as "We decided to X")
2. ACTION ITEMS: Who does what by when?
3. OPEN QUESTIONS: What still needs deciding?
4. TONE: Energized? Stressed? Aligned?

Output: JSON with structured items
```

**Integration code path:**
```
POST /api/stock/team/meetings/[id]/summarize
Body: { transcript_id, meeting_date }
-> Claude summarizes (Haiku)
-> Extracts action_items + decisions
-> stock_action_items + stock_decision_log entries
-> Telegram to action item owners: "You have a due task: [task] by [date]. Confirm?"

Cron 07:00 daily:
-> Checks stock_action_items WHERE due_date = today + 1 or today + 2
-> Telegram to owner: "Reminder: [task] due [date]"
```

**What to wire by May 5:**
- Deepgram + meeting transcription integration
- Summary + action extraction prompt (Haiku)
- Telegram reminder cron

---

### 13 - Decision Tracking + Action Item Extraction

**ZOE's role:** Log all decisions. Track resolution status. Alert on open decisions blocking work.

**Trigger:** `/stock blockers` command (shows unresolved decisions) + cron at 15:00 daily

**What ZOE reads:**
- `stock_decisions` table: decision_text, proposed_by, decision_date, resolved, resolution
- `stock_action_items` (which items are blocked waiting on a decision?)

**What ZOE writes:**
- Telegram alert: "3 open decisions blocking 7 action items. Decide: shirts, catering menu, sponsor tier names."
- `stock_activity_log`: decision_made, decision_resolved
- Prometheus gauge: decision_backlog (unresolved decisions)

**ZOE's prompt (Haiku, 300 tokens):**
```
Decision health check for ZAOstock.

Open decisions:
[INSERT stock_decisions WHERE resolved = false]

Blocked action items:
[INSERT action_items WHERE blocked_by_decision_id IS NOT NULL]

Analysis:
1. Which decisions are blocking the most work?
2. How long have they been open?
3. Who needs to decide? (missing input?)

Output:
- Critical path decisions (must resolve this week)
- Recommendations (what info is missing? who to ask?)
```

**Integration code path:**
```
POST /api/stock/team/decisions/create
Body: { decision_text, proposed_by, due_date }
-> stock_decisions entry
-> Links to any stock_action_items with blocked_by = true

POST /api/stock/team/decisions/[id]/resolve
Body: { resolution_text, resolved_by }
-> Updates stock_decisions.resolved = true
-> Auto-unblocks related action_items
-> Telegram: "Decision resolved: [text]. Unblocked [X] tasks."

GET /api/stock/team/blockers
-> Returns unresolved decisions + blocking count
-> Zaal can call `/stock blockers` anytime
```

**What to wire by May 1:**
- Decision log table schema
- Blocker query + Telegram command

---

### 14 - Artist Rider + Contract Intake

**ZOE's role:** Track contracts. Flag missing info. Auto-remind of deadlines.

**Trigger:** `/stock rider status` command + cron at 10:00 daily

**What ZOE reads:**
- `stock_contracts` table: artist_id, contract_status (draft, sent, signed, archived), unsigned_date, missing_fields
- `stock_rider_items` (tech requirements, catering, lodging)

**What ZOE writes:**
- Telegram alert: "4 artists missing signed contracts. Follow up by May 20."
- `stock_activity_log`: contract_sent, contract_signed
- Telegram to artist: "We need your signature on the ZAOstock contract. [link]"

**ZOE's prompt (Haiku, 300 tokens):**
```
Artist contract tracker for ZAOstock.

Confirmed artists:
[INSERT stock_artists WHERE status = 'confirmed']

Contract status:
[INSERT stock_contracts: artist, status, date_sent, missing_fields]

Deadlines:
- Contracts signed: July 1 (hard cutoff)
- Riders submitted: July 15

Action:
1. Who needs a contract sent? (not yet sent)
2. Who hasn't signed? (sent, but not signed, >7 days)
3. Who's missing rider info? (signed, but no rider details)

Output:
- Summary (X signed, Y pending, Z overdue)
- Follow-up list (order by urgency)
```

**Integration code path:**
```
POST /api/stock/team/contracts/generate
Body: { artistId }
-> Generates artist contract from template
-> stock_contracts entry (status='draft')
-> Sends Telegram + email to artist: "Please review and sign: [DocuSign link]"

Webhook on DocuSign:
POST /api/stock/team/contracts/signed
Body: { contractId, signed_date }
-> Updates stock_contracts.status = 'signed'
-> stock_activity_log entry
-> Telegram: "Contract signed! Check riders checklist."
```

**What to wire by June 1:**
- Contract generation (template + DocuSign integration)
- Rider tracking table
- Cron reminder for unsigned contracts

---

### 15 - Sponsor Package Pricing + Competitive Analysis

**ZOE's role:** Monitor sponsor tier pricing. Suggest adjustments if sponsors hesitate. Benchmark against other festivals.

**Trigger:** `/stock pricing` command (manual check) + cron at 14:00 daily (if sponsor tier requests stall)

**What ZOE reads:**
- `stock_sponsor_tiers` table: tier_name, price, benefits, target_count, committed_count
- `stock_sponsors` (who committed at which tier? who declined at which tier?)

**What ZOE writes:**
- Telegram alert: "Mid tier ($12K) has only 1 taker. Recommend lowering to $10K or adding benefits."
- `stock_activity_log`: pricing_adjusted
- Prometheus gauge: tier_fill_rate % (committed / target per tier)

**ZOE's prompt (Haiku, 250 tokens):**
```
Sponsor pricing health for ZAOstock.

Sponsor tiers:
[INSERT sponsor_tiers: name, price, benefits, target, committed]

Decision history:
[INSERT sponsors that declined, reason if known]

Analysis:
1. Which tiers are over-subscribed? (more than target)
2. Which tiers have zero interest? (no takers)
3. Price elasticity: who declined and at what tier?

Output:
- Pricing recommendations (adjust tier price? add benefits?)
- Competitive positioning (are we in line with similar festivals?)
```

**Integration code path:**
```
GET /api/stock/team/sponsors/pricing-analysis
-> ZOE analyzes tier fill rate
-> Telegram: "Premium tier 100% full ($25K). Mid tier 20% full ($12K). Suggest: move 1 prospect from Premium down to Mid by adding X benefit."
```

**What to wire by June:**
- Sponsor tier fill rate tracking
- Pricing analysis prompt (Haiku)

---

### 16 - Weather + Logistics Contingency Planning

**ZOE's role:** Monitor Oct 3 forecast. Alert if rain likely. Trigger contingency checklists.

**Trigger:** Cron at 06:00 daily from Sep 20 onwards (4 days before festival)

**What ZOE reads:**
- Weather API (OpenWeather): temperature, precipitation %, wind
- `stock_contingency_plans` table: rain, heat, power outage, artist no-show
- `stock_timeline`: critical windows (doors 1pm, peak 5pm, cleanup 8pm)

**What ZOE writes:**
- Telegram alert: "60% rain chance Oct 3, 2-5pm. Activate tent deployment plan. Assign tarps: [list]."
- `stock_activity_log`: contingency_triggered
- Prometheus gauge: weather_risk (rain%, wind speed)

**ZOE's prompt (Haiku, 300 tokens):**
```
Weather contingency for ZAOstock (Oct 3, 2026, Franklin Street Parklet).

Forecast (latest):
[INSERT weather: temp, precip%, wind, source]

Contingency plans:
[INSERT plans: rain (tents, tarps, generators), heat (water, shade), wind (secure stage)]

Decision thresholds:
- Rain >70%: activate full tent coverage
- Rain 40-70%: prepare tents, but don't deploy yet
- Temp >85F: set up water stations
- Wind >15mph: secure loose elements

Output:
- Risk level (low / moderate / high)
- Recommended prep (what to do in next 24h)
- Checkpoints (when to reassess)
```

**Integration code path:**
```
Cron 06:00 daily (Sep 20 - Oct 3):
-> GET weather API
-> ZOE analyzes vs. contingency plans
-> Telegram to command team: "Weather update: [risk level]. Activate: [plan]. Check at [time]."

Manual trigger:
/stock weather -> Returns current forecast + recommended activations
```

**What to wire by Sep 1:**
- Weather API integration (OpenWeather free tier)
- Contingency plan table (rain, heat, power, artist issues)
- Weather cron + alert prompt

---

### 17 - Content Calendar Generation

**ZOE's role:** Auto-draft social content calendar. Suggest posts. Track published content.

**Trigger:** Cron at 09:00 every Monday (weekly content plan) + `/stock content` command

**What ZOE reads:**
- `stock_timeline` (what's happening this week?)
- `stock_action_items` (team accomplishments to celebrate?)
- `stock_sponsors` (new sponsors, tier updates to highlight)
- Past `stock_social_posts` (what topics resonated?)

**What ZOE writes:**
- `stock_content_calendar` table: post_date, platform, topic, status (draft, approved, published)
- Telegram thread: weekly content plan with 5 post ideas + copy + hashtags
- Zaal edits + approves, then posts to Farcaster/X via webhook

**ZOE's prompt (Haiku, 400 tokens):**
```
Content calendar generator for ZAOstock.

This week's milestones:
[INSERT stock_timeline: what's due? what's happening?]

Recent wins:
[INSERT action_items completed + social posts with engagement]

Audience interests (past data):
[INSERT top topics from past posts: artist spotlights, sponsor features, volunteer stories]

Generate 5 posts for this week:
1. One artist spotlight (who's confirmed this week?)
2. One sponsor feature (who just committed?)
3. One volunteer story (who went above and beyond?)
4. One community ask (volunteers? survey? feedback?)
5. One timeline update (what's next?)

Output: JSON array with post_text, platform, hashtags, publish_time
```

**Integration code path:**
```
Cron 09:00 Mondays:
-> ZOE generates content calendar for week
-> Posts Telegram thread with 5 draft posts
-> Zaal reacts with checkmark (approve) or pencil (edit)
-> Approved posts auto-schedule to stock_content_calendar

POST /api/stock/team/social/publish-calendar
Body: { calendar_id }
-> Publishes all approved posts on schedule
-> Tracks in stock_social_posts
```

**What to wire by May:**
- Content calendar table schema
- Weekly generation prompt (Haiku)
- Social publishing integration (Neynar + X API)

---

### 18 - Accessibility Compliance

**ZOE's role:** Remind of captions, ADA logistics, accessible design. Alert if compliance gaps found.

**Trigger:** `/stock accessibility` command (manual check) + cron at 13:00 Fridays (compliance reminder)

**What ZOE reads:**
- `stock_media` (photos tagged? captions written?)
- `stock_venue_access` (parking, ramps, bathrooms, accessible camping info captured?)
- `stock_accessibility_checklist` (stage height, ASL interpreter booked, captions prepared?)

**What ZOE writes:**
- Telegram alert: "8 social posts without captions. Add by end of week for accessibility."
- `stock_activity_log`: accessibility_checked
- Checkbox: ASL interpreter confirmed? Accessible parking signage printed?

**ZOE's prompt (Haiku, 250 tokens):**
```
ADA compliance check for ZAOstock.

Venue logistics:
[INSERT: parking (accessible spots), ramps, bathrooms, seating]

Media:
[INSERT: photos without captions, videos without transcripts]

Personnel:
[INSERT: ASL interpreter confirmed? Medical staff? Accessibility coordinator?]

Checklist items:
- Photo captions (for social + accessibility)
- Video transcripts (for live stream, if any)
- Signage (accessible parking, bathrooms, accessible camping)
- Staffing (ADA coordinator assigned?)

Output:
- Compliance score (X/10)
- Critical gaps (must fix)
- Nice-to-haves (if time/budget)
```

**Integration code path:**
```
POST /api/stock/team/media/caption
Body: { mediaId, caption_text, alt_text }
-> Updates stock_media.caption + alt_text
-> Removes from "unaccounted" list

GET /api/stock/team/accessibility/compliance-check
-> Returns checklist status
-> Zaal can review anytime or view Friday summary
```

**What to wire by Aug:**
- Accessibility checklist table
- Compliance check prompt (Haiku)

---

### 19 - Safety + Emergency Prep

**ZOE's role:** Monitor incident logs during festival. Alert on safety patterns. Pre-festival checklists.

**Trigger:** Oct 3 (during event, same as incident triage) + cron at 11:00 Sundays (safety prep check)

**What ZOE reads:**
- `stock_incident_logs` (medical, crowd, weather, security issues)
- `stock_safety_plan` (evacuation routes, medical protocols, weather thresholds)
- `stock_volunteers` (who's trained in first aid? crowd control?)

**What ZOE writes:**
- Telegram alert (during event): "3rd minor injury reported. Medical protocol OK? Supplies replenished?"
- `stock_activity_log`: safety_incident_logged
- Pre-event checklist: "Insurance certificate on file? Permits printed? Liability coverage confirmed?"

**ZOE's prompt (Sonnet, 500 tokens):**
```
Safety coordinator for ZAOstock (Oct 3, 2026).

Safety plan:
[INSERT: evacuation routes, medical protocols, weather thresholds, emergency numbers]

Incidents (live):
[INSERT: medical, security, weather issues from Oct 3 logs]

Pre-event (Sep 25-Oct 2):
- Insurance verified?
- Permits + licenses on file?
- Medical staff briefed?
- Crowd control trained?
- Emergency contacts posted?

Pattern detection:
1. Is there a trend in incidents? (medical hotspot? crowd control area?)
2. Are protocols being followed?
3. What's the next escalation if pattern continues?

Output:
- Safety status (all clear / watch / alert)
- Incident summary (if any patterns)
- Pre-event checklist (items needed before Oct 3)
```

**Integration code path:**
```
POST /api/stock/incident/[id]/classify-safety
Body: { incident_id, safety_category: 'medical' | 'crowd' | 'weather' | 'security' }
-> Adds to safety incident log
-> ZOE monitors patterns in real-time
-> Telegram: "4th crowd control incident in last hour (all near vendor booths). Deploy extra volunteer at [location]?"

Cron 11:00 Sundays (Sep 25-Oct 2):
-> Safety checklist pre-event review
-> Telegram: "Safety prep: [checklist]. All items done?"
```

**What to wire by Sep 1:**
- Safety plan table (protocols, thresholds)
- Safety incident classification
- Pre-event checklist cron

---

### 20 - Post-Event Follow-Up + Next-Year Retention

**ZOE's role:** After festival, send thank-you messages. Collect feedback. Begin next-year planning.

**Trigger:** Oct 4 onwards (post-event follow-up sequence)

**What ZOE reads:**
- `stock_event_report` (post-event data)
- `stock_volunteers` (who attended, hours worked, performance)
- `stock_sponsors` (who paid, who came to event, satisfaction)
- `stock_audience_feedback` (survey responses, sentiment)

**What ZOE writes:**
- Telegram/email thank-yous to sponsors, artists, volunteers
- Survey responses analyzed (Sentiment, NPS, next-year interest)
- `stock_community_activity` (re-engagement posts for next-year buzz)
- Early-bird interest list for 2027 festival

**ZOE's prompt (Sonnet, 600 tokens):**
```
Post-event retention strategy for ZAOstock (Oct 4 onwards, 2026).

Event debrief:
[INSERT: attendance, budget, social reach, incident summary]

Stakeholder feedback:
[INSERT: sponsor satisfaction, artist feedback, volunteer feedback, attendee survey]

Retention goals:
- 90% of sponsors for next year
- 100% of artists (lock early)
- 80% of volunteers (some may not return)
- Social audience growth (20% week-over-week)

Follow-up sequence:
1. Thank-you email (day 1, Oct 4)
2. Quick feedback survey (day 3, Oct 6) - "would you return next year?"
3. Highlight reel (day 5, Oct 8) - best photos + video clips
4. Next-year interest check (day 14, Oct 18) - "want to help plan 2027?"

Output:
- Personalized messages (per sponsor/artist/volunteer)
- Survey distribution plan
- Re-engagement timeline
- Early-bird retention targets
```

**Integration code path:**
```
POST /api/stock/event/follow-up/send-thanks
Body: { recipients: 'sponsors' | 'artists' | 'volunteers' | 'attendees' }
-> ZOE generates personalized thank-you messages
-> Sends via Telegram (team) + email (external)
-> stock_activity_log entry

POST /api/stock/event/feedback/collect
Body: { survey_type: 'sponsor' | 'artist' | 'volunteer' | 'attendee' }
-> Creates Typeform/Supabase survey
-> Distributes via email + Telegram
-> Collects responses

GET /api/stock/event/retention-analysis (Oct 18 onwards)
-> Analyzes survey responses
-> Identifies who's interested in next year
-> Telegram: "15 sponsors + 8 artists already interested in 2027. Early commitments available."
```

**What to wire by Oct 5:**
- Thank-you message templates (sponsor, artist, volunteer, attendee)
- Feedback survey setup
- Post-event follow-up cron

---

## Priority: What to Wire This Week (Apr 24-May 1)

**TIER 1: P0 (Massive ROI, must ship):**

1. **Sponsor pipeline monitoring** (`/stock sponsor status` Telegram command + 06:00 cron)
   - Reads stock_sponsors table
   - Alerts on stalled leads (no contact >7d)
   - 30 mins to wire

2. **Artist status tracker** (`/stock artist status` Telegram command + Farcaster discovery route)
   - Reads stock_artists, auto-discovers via Neynar
   - Alerts on contract deadlines (May 15, June 1)
   - 45 mins to wire (Neynar API integration + prompt)

3. **Meeting transcription + summary** (Deepgram + Claude post-meeting)
   - Google Meet → S3 → Deepgram → Claude summary → stock_action_items
   - Extract decisions + action items
   - 2 hours to wire (new tables, webhook, prompts)

**TIER 2: P1 (High ROI, ship in first 2 weeks of May):**

4. **Day-of incident triage** (Oct 3 voice logging + triage dashboard)
   - Telegram voice logging endpoint
   - ZOE triage prompt (Sonnet, 1000-token cache)
   - SMS alert cascade (Twilio)
   - 3-4 hours to wire (but can test in June)

5. **Budget variance tracking** (weekly Telegram alert at 07:00 Fridays)
   - Expense submission form + budget health check
   - 1 hour to wire

6. **Action item reminder bot** (Telegram nudges at -48h and -24h)
   - ZOE cron reads stock_action_items table
   - Sends reminders to owners
   - 30 mins to wire

**TIER 3: P2 (Nice-to-have, ship by June):**

7. Volunteer onboarding + skill matching
8. Social media engagement tracking
9. Content calendar generation
10. Accessibility checklist

---

## Top 3 Cron Jobs by Value

### 1. Morning Sponsor Check (06:00 daily)

**Output:** Telegram to Zaal with one-line status: "3 sponsors at risk ($8K), 2 need follow-up this week."

**Code (40 lines):**
```typescript
// Cron: 06:00 EST daily, triggered by /vps infrastructure
// Runs: FROM sponsors; WHERE stage IN ('lead', 'contacted') AND last_contacted_at < NOW - 7d

const sponsors = await supabase.from('stock_sponsors')
  .select('*')
  .in('stage', ['lead', 'contacted'])
  .lte('last_contacted_at', sevenDaysAgo);

const riskByAmount = sponsors
  .sort((a, b) => (b.estimated_amount || 0) - (a.estimated_amount || 0))
  .slice(0, 5);

const telegramMessage = `
Morning sponsor check:
- ${riskByAmount.length} leads need follow-up (${riskByAmount.map(s => s.name).join(', ')})
- Total at risk: $${riskByAmount.reduce((sum, s) => sum + (s.estimated_amount || 0), 0)}K

Action: Review top 3 and send outreach today.
Dashboard: [link to /stock/team/sponsors]
`;

await zoe.telegram.send(telegramMessage, zaalChatId);
```

**Why it matters:** Sponsors are the budget. If a lead goes cold for >7 days, momentum dies. This catches drift before it becomes a problem. Zaal can triage 3 calls in 15 mins, vs. spending 30 mins manually reviewing the table.

---

### 2. Midday Artist Status (12:00 daily)

**Output:** Telegram: "8 of 10 artists confirmed. 1 pending contract, 1 pending travel. May 15 first-contact window closing in 23d."

**Code (50 lines):**
```typescript
// Cron: 12:00 EST daily
// Reads: stock_artists (all), stock_contracts (linked)

const artists = await supabase.from('stock_artists').select('*');
const contracts = await supabase.from('stock_contracts').select('*');

const confirmed = artists.filter(a => a.status === 'confirmed').length;
const pending = artists.filter(a => a.status === 'in_talks').length;
const declined = artists.filter(a => a.status === 'declined').length;

const missingInfo = artists.filter(a => {
  const contract = contracts.find(c => c.artist_id === a.id);
  return !contract || contract.status !== 'signed';
});

const daysToFirstContactDeadline = Math.floor(
  (new Date('2026-05-15').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
);

const telegramMessage = `
Artist status update:
- Confirmed: ${confirmed} of 10
- Pending: ${pending}
- Declined: ${declined}
- Missing contracts: ${missingInfo.length}

Next deadline: First-contact window closes in ${daysToFirstContactDeadline} days.

Action: ${missingInfo.length > 0 ? `Follow up on: ${missingInfo.map(a => a.name).join(', ')}` : 'All on track!'}
`;

await zoe.telegram.send(telegramMessage, zaalChatId);
```

**Why it matters:** Artists have hard deadlines (May 15 = stop contacting new ones). This one-line pulse keeps the deadline visible. Without it, Zaal discovers on June 15 that they're short 3 artists.

---

### 3. Afternoon Pipeline Forecast (15:00 daily)

**Output:** Telegram: "Blockers this week: merch quantities (blocks printing), sound contract (blocks tech rider). 2 decision-points need locking by Thu."

**Code (60 lines):**
```typescript
// Cron: 15:00 EST daily
// Reads: stock_timeline (next 7d), stock_action_items (overdue + due soon), stock_decisions (unresolved)

const now = new Date();
const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

const timelineItems = await supabase
  .from('stock_timeline')
  .select('*')
  .gte('due_date', now.toISOString())
  .lte('due_date', next7Days.toISOString());

const actionItemsBlocked = await supabase
  .from('stock_action_items')
  .select('*')
  .eq('status', 'blocked')
  .lte('due_date', next7Days.toISOString());

const unresolved = await supabase
  .from('stock_decisions')
  .select('*')
  .eq('resolved', false)
  .lte('due_date', next7Days.toISOString());

const forecast = {
  milestones: timelineItems.length,
  blockers: actionItemsBlocked.length,
  decisions: unresolved.length,
  criticalPath: [...timelineItems, ...actionItemsBlocked, ...unresolved]
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3),
};

const telegramMessage = `
Week ahead forecast (${timelineItems.length} milestones):
${forecast.criticalPath.map(item => `- ${item.title} (due ${new Date(item.due_date).toDateString()})`).join('\n')}

Blockers: ${unresolved.length} decisions need locking.
Action: Review critical path, lock decisions by Thu so other work can unblock.
`;

await zoe.telegram.send(telegramMessage, zaalChatId);
```

**Why it matters:** This answers Zaal's daily question: "What must happen this week?" By surfacing blockers, ZOE saves Zaal from task paralysis. "Oh right, we can't schedule volunteers until we know how many merch tables we need." This nudge prevents Friday panic.

---

## Summary

ZOE transforms from a single Telegram interface into a **distributed operations system**. Instead of Zaal checking 6 different spreadsheets, he gets 1 Telegram message per day with the 3 most important metrics:

- Sponsors at risk?
- Artists on track?
- What blocks progress?

The 5 Telegram commands give Zaal fine-grained control when he needs detail. The day-of incident triage (Oct 3) turns festival ops from chaos to calm. All built with existing infrastructure (Supabase, Claude API, Twilio, Telegram).

Total engineering lift: ~20 hours this month to ship the P0 tier. Everything else is May/June/Sept work that doesn't block festival planning.
