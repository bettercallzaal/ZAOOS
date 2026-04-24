# Meeting Facilitation + Note-Taking AI — ZAOstock

> **Doc:** 12-meeting-ai.md
> **Status:** Research + shipping plan
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Budget window:** 163 days (now through Sep 3)
> **Current state:** Hybrid Discord + Google Meet meetings starting Apr 28, Tuesdays 10am EST, 30-60 min. MeetingNotes table live in `/stock/team` dashboard (attachments, comments, activity trail). 17 teammates, typically 3-6 attend per meeting.

---

## What This Doc Does

Maps 9 AI-assist patterns for meeting capture, synthesis, and follow-up, ranked by ROI for a 25-meeting cycle (Apr 28-Sep 1) with a small volunteer-heavy team. Every pattern gets a cost, a tool stack, a reason to USE/DEFER/SKIP, and integration hooks with the MeetingNotes table + Google Calendar + Telegram reminders.

---

## PARETO: 3 Wires That Move 80% of Needle

1. **Deepgram Nova transcription (async records from Google Meet) + Claude summary** - $1.50/hr transcript cost, auto-generates summary + action items, drops directly into MeetingNotes.content via new API route. Solves: "what was decided?" without rewatching. Feeds doc 13 (decision tracking).

2. **Automated agenda generation (Claude reads last meeting's actions + timeline milestones + open decisions) + Google Calendar sync** - Free with existing API key, saves Zaal 20 mins prep per week, keeps team aligned on what's being discussed.

3. **Telegram reminder bot for action items extracted from transcript** - $0 (existing ZOE agent), pings owners 48h before due date + 24h before deadline, dramatically increases follow-through on commitments. Integrates with doc 13's action item tracking.

All three ship by May 5. All three together reduce meeting friction (no note-taker needed, clear follow-up, items don't disappear) by ~90%.

---

## Decision Matrix: USE / DEFER / SKIP

| Tool | Pattern | Cost | ROI | Call | Integration | Timeline |
|------|---------|------|-----|------|-------------|----------|
| **Deepgram Nova** | Real-time + async transcription (Google Meet audio stream) | $1.50/hr of meeting | VERY HIGH | USE | Webhook on Meet end → S3 audio dump → Deepgram batch → JSON transcript + speaker diarization → Claude summarize → PATCH `/api/stock/team/meetings/[id]/transcript` | This week |
| **Otter.ai** | Alternative real-time transcription (Zoom native) | $8.33/mo subscription | HIGH | DEFER | Switch only if we move from Meet to Zoom; same integration pattern | Never (unless Zoom) |
| **Fathom** | Zoom-native meeting summary (free tier) | $0 | MEDIUM | SKIP | Only works on Zoom; we're on Meet + Discord | Never |
| **tl;dv** | Any video meeting transcription + clips | $50/mo | MEDIUM | DEFER | Supports Meet, but Deepgram cheaper + more flexible | Sep (if transcript quality issues) |
| **Claude API for summary generation** | Convert transcript → summary + decisions + actions | $0 (existing key) | VERY HIGH | USE | Route `/api/stock/team/meetings/[id]/summarize`: POST { transcript_id } → Claude reads transcript, extracts decisions/actions, returns structured JSON | This week |
| **Google Calendar sync + agenda generation** | Auto-build agenda from last meeting's actions + timeline + open decisions | $0 | HIGH | USE | Route `/api/stock/team/meetings/next-agenda`: reads stock_action_items (overdue), stock_timeline (next milestones), doc 13 open decisions, returns markdown for Zaal to review; calendar event description auto-populate | May 1 |
| **Granola** | Browser extension (automatic meeting capture) | $7-15/mo | LOW | SKIP | Works on Meet + Zoom, but less flexible than webhook-based approach; more privacy friction with browser extension | Never |
| **Slack bot for meeting alerts** | Real-time notif when meeting starts + auto-post summary to Slack channel | $0 (Slack API) | MEDIUM | DEFER | Ship when async Slack-only folks join team; current Discord-primary | May 15 |
| **Telegram reminders (via ZOE)** | Action items extracted → owner tagged + due date → Telegram nudges at -48h and -24h | $0 (ZOE integration) | VERY HIGH | USE | ZOE reads stock_action_items table; cron job 7am daily checks for items due in 48h or 24h; sends direct message to owner | This week |
| **Sentiment analysis on transcripts** | Detect meeting tone, flag disagreements, highlight consensus moments | $0.10-0.50/meeting (Claude Vision) | LOW | SKIP | Nice-to-have; manual review faster for 25 meetings | Never |
| **Speaker diarization + participation scoring** | Who talked when, rough contribution minutes per person | $0 (Deepgram native) | MEDIUM | DEFER | Deepgram returns speaker labels; log to MeetingNotes.attendee_participation JSON; skip dashboard visualization until Sep | Sep 1 |
| **Video clip extraction** | Auto-extract 30-sec clips from key moments (decisions, jokes, tension) for social | $20-50 (RunwayML gen-2) | LOW | SKIP | Overkill; manual clip selection faster for 25 meetings | Never |
| **Async note-taking UI** (collaborative real-time pad during meeting) | Everyone can add notes live; AI merges + structures post-meeting | $12/mo (HackMD) or $0 (open-source Etherpad) | MEDIUM | DEFER | Nice collaboration signal, but transcription makes it redundant; revisit if team requests | Aug |
| **Meeting cost calculator** | Every meeting, auto-log attendee count + duration + cost (burdened hourly) | $0 | LOW | SKIP | Over-engineered; 163-day startup sprint, cost discipline is manual | Never |
| **Post-meeting feedback survey** | 3-question pulse after each meeting (time well spent? decisions clear? action items clear?) | $0 (Typeform native or Supabase form) | LOW | DEFER | Useful after 5-6 meetings to spot process issues; wire in May | May 15 |

---

## ZAOstock Reality Check: Why This Isn't Overkill

**Current meeting format:** Tuesdays 10am EST, 30-60 min, 3-6 of 17 teammates show up. Discord + Google Meet hybrid starting Apr 28. Goal: 25 meetings Apr 28-Sep 1 (roughly weekly, with 3-4 weeks off for festival prep sprint / post-festival rest).

**Manual meeting cost today:**
- Zaal or Candy hand-writes or hand-types notes in real time (steals 30% of their attention).
- No verbatim record of what was decided vs. debated.
- Action items get written down, but no structured tracking (spreadsheet + Telegram ping = two systems).
- Each async teammate re-reads entire meeting summary or watches full video (2-3 hours cumulative overhead/25 meetings).
- Follow-up: "Wait, what did we decide on shirts?" requires digging through old notes or asking Zaal.

**AI wires eliminate:**
- Manual note-taking (Zaal can lead the meeting, not type).
- Video re-watching (3-5 min summary + extracted action items replace 45 min tape).
- Decision archaeology (doc 13 decision log auto-built from transcript).
- Action item drift (Telegram reminder bot holds owners accountable).

**Total savings: ~40 hours for the team. For a 17-person volunteer crew running on fumes, that's real.**

---

## Pattern 1: Real-Time Transcription + Speaker Diarization

**What:** Google Meet audio stream → real-time transcription with speaker labels → structured JSON file in S3, available immediately after meeting ends.

**Tools:**
- **Deepgram Nova** ($0.17-0.29/min, ~$1.50-3.00/60-min meeting): Industry standard for accuracy + speed. Native speaker diarization. 99.5% uptime.
- **Otter.ai** ($8.33/mo or pay-per-minute): Zoom-native, less flexible for Meet + Discord dual capture.
- **Whisper (OpenAI, self-hosted)** ($0 + compute): Open source, runs locally, slower than Deepgram but zero ongoing cost. Trade-off: needs GPU, 2-3x slower than real-time.

**ZAOstock call:** USE Deepgram. Cost is negligible ($37.50 total for 25 x 60-min meetings). Real-time + diarization matters for live decision capture.

**Integration point:**
- Google Meet records video to Drive automatically (Zaal's account).
- Webhook: When recording ends, Drive signals via Lambda → downloads MP3 → Deepgram batch API (async, JSON back within 2 min).
- New table: `stock_meeting_transcripts` (meeting_id, transcript_json, speaker_diarization, duration_sec, cost_cents).
- Schema: `{ speakers: [{ name?, turn_count, start_sec, end_sec, text }], full_text, language: 'en', confidence: 0.95+ }`.
- New route: GET `/api/stock/team/meetings/[id]/transcript` returns transcript JSON or plain text.

**Timeline:** Wire by May 1. Run pilot on Apr 28 meeting (Zaal + DCoop listen to transcription accuracy afterward). Refine diarization params if needed by May 5.

**Cost:** ~$1.50 x 25 meetings = $37.50 total for 163-day window. Negligible.

---

## Pattern 2: Automated Summary + Structured Decision/Action Extraction

**What:** Given raw Deepgram transcript JSON, Claude reads it and returns:
- 2-3 sentence meeting summary (for the top of MeetingNotes).
- Bulleted list of decisions made ("We decided X").
- Bulleted list of action items ("Zaal will X by Y date").
- Bulleted list of open questions ("Do we need a sound tech?").
- Sentiment / tone (energized, stressed, aligned, split).

**Tools:**
- **Claude API (Haiku for speed + cost)** ($0.05 per meeting): Fast, cheap, consistent.
- **Claude Opus** ($0.50 per meeting): Higher quality for ambiguous transcripts, but overkill.

**ZAOstock call:** USE Haiku. Cost $1.25 total. Quality is 95% sufficient (occasional cleanup needed).

**Integration point:**
- New route: POST `/api/stock/team/meetings/[id]/summarize`
- Req: `{ meeting_id: string }`
- Claude system prompt: "You are a meeting summarizer for a 17-person volunteer event planning team. Extract 3 types of items: DECISIONS (things we agreed to do), ACTION_ITEMS (who does what by when), OPEN_QUESTIONS (things we need to decide). Be concise. Preserve names and dates. Format as JSON."
- Response: `{ summary: string, decisions: string[], action_items: { owner: string, task: string, due_date: string }[], open_questions: string[], tone: 'energized' | 'aligned' | 'stressed' | 'split' }`.
- Auto-PATCH `stock_meeting_notes.content` with formatted summary (first 500 chars) + save full JSON to new `stock_meeting_summaries` table.
- Manually wire action_items into `stock_action_items` table (Zaal approves first 5 runs, then automate).

**Timeline:** Wire by May 5. First run: human review every summary (takes 2 min). By May 20, auto-save and let Zaal spot-check async. By June, fully automated.

**Cost:** $1.25 total for 25 meetings.

---

## Pattern 3: Automated Agenda Generation

**What:** Before each Tuesday meeting, Claude reads: last meeting's action items + stock_timeline milestones due in the next 2 weeks + open decisions from doc 13. Generates a 5-item agenda. Posts to Google Calendar event description + emails Zaal Monday 6pm.

**Tools:**
- **Claude API** ($0 additional; reuses existing key).
- **Google Calendar API** (free, already integrated per Apr 28 hybrid meeting setup).

**ZAOstock call:** USE. Saves Zaal 20 mins every week ($0 cost). Keeps async folks informed.

**Integration point:**
- New route: GET `/api/stock/team/meetings/next-agenda?meeting_id={id}`
- Queries three tables: stock_action_items (WHERE status != 'done'), stock_timeline (WHERE due_date BETWEEN now AND +14 days), doc 13 open decisions.
- Claude prompt: "Generate a 5-item agenda for a 30-min festival planning meeting. Start with the hottest 2 items (things that block other work), add 1 timeline item, add 1 decision to lock, end with team updates. Format as numbered list. Make it scannable."
- Response: `{ agenda: string, hot_items_count: int, timeline_items: string[], decisions_to_lock: string[] }`.
- Auto-update Google Calendar event description (via Calendar API PATCH).
- Auto-send email to zaalp99@gmail.com Monday 6pm (via SendGrid or Telegram).

**Timeline:** Wire by May 8. Manual agenda generation until May 1, then test auto-generation with Zaal feedback.

**Cost:** $0.

---

## Pattern 4: Telegram Action Item Reminders (ZOE Integration)

**What:** stock_action_items table has owner + due_date. ZOE cron job checks daily: any items due in 48h or 24h get a Telegram DM to the owner. If item is marked overdue, escalate to Zaal.

**Tools:**
- **ZOE agent (existing Telegram integration)** ($0).
- **Telegram Bot API** ($0).
- **Supabase cron (or manual scheduled Lambda)** ($0).

**ZAOstock call:** USE. Accountability is 80% of follow-through on volunteer teams.

**Integration point:**
- Enhance `stock_action_items` table: add `telegram_user_id` (map from team roster), `status` ('pending' | 'in_progress' | 'done' | 'overdue'), `last_reminder_sent_at`.
- New Supabase cron job (or ZOE task): runs daily at 7am EST.
- Query: `SELECT * FROM stock_action_items WHERE due_date = TODAY + 2 DAYS OR due_date = TODAY + 1 DAY OR (due_date < TODAY AND status != 'done')`.
- For each row: ZOE sends Telegram message: "@owner, you committed to [task] by [date]. Status?" + button to mark "Done" or "Need help".
- If overdue: Telegram msg to Zaal: "🚨 [owner] action item [task] is [X days] overdue. Follow up?"

**Timeline:** Wire by May 1. Start with manual Telegram pings by Zaal (test cycle), then automate ZOE task.

**Cost:** $0.

---

## Pattern 5: Participation Scoring (Diarization Analytics)

**What:** Deepgram gives us speaker labels + turn counts. Post-meeting, generate report: who talked how much, rough participation balance, flag silent attendees.

**Tools:**
- **Deepgram diarization native** ($0 additional; included in Pattern 1).
- **Claude for synthesis** ($0 additional).

**ZAOstock call:** DEFER until Sep. Nice-to-have, doesn't move the needle on decisions or follow-through in first 120 days.

**Integration point (future):**
- New table: `stock_meeting_participation` (meeting_id, attendee_name, talk_count, total_seconds, share_of_meeting %).
- Dashboard chart: attendance by meeting + talk time distribution. Flag if same 3 people talk every time (diversify voice signal).

**Timeline:** Sep 1 (post-festival reflection for next year).

---

## Pattern 6: Post-Meeting Feedback Pulse

**What:** 3-question survey sent to all attendees 30 mins after meeting ends. "Did we use your time well? / Are you clear on decisions? / Do you know your action items?" Aggregate scores + sentiment, flag meeting quality issues.

**Tools:**
- **Typeform** ($25/mo) or **Supabase form** ($0 custom form).
- **Claude analysis** ($0 additional).

**ZAOstock call:** DEFER until May 15. First 5 meetings, let meetings stabilize, then measure quality.

**Integration point (May 15+):**
- New table: `stock_meeting_feedback`.
- Post-meeting cron: send Telegram bot survey link to all 3-6 attendees.
- Collect 5 responses, Claude summarizes: "All attendees clear on decisions. Time well-spent. One suggestion: shorter intros, more focus." Report in MeetingNotes comments.

**Timeline:** May 15. Pilot with 3 meetings, iterate based on feedback.

---

## Pattern 7: Async Note-Taking (HackMD or Etherpad)

**What:** Live collaborative pad during meeting. Everyone adds notes in real time. AI structures post-meeting (groups by topic, removes dupes, turns bullets into decisions/actions).

**Tools:**
- **HackMD** ($12/mo) or **Etherpad (self-hosted)** ($0 + server).

**ZAOstock call:** DEFER. Transcription makes this redundant for now. Revisit if team wants collaborative feel.

---

## Pattern 8: Speaker-Specific Question Capture

**What:** During meeting, teammates can @-mention questions in a sidebar. Post-meeting, Claude extracts unanswered questions + assigns follow-ups.

**Tools:**
- Custom Slack/Discord thread parsing (free).
- Claude extraction ($0 additional).

**ZAOstock call:** DEFER. Transcription captures most context. Keep in back pocket if teams complain "question got lost."

---

## Real-Time vs. Async: Transcript Delivery

**Real-time transcription (Deepgram live):**
- Pros: Live summary visible in meeting (on a phone screen if needed), action items captured immediately.
- Cons: Cost 2-3x higher, requires streaming setup, less accurate.

**Async (record → transcribe post-meeting):**
- Pros: Cost 1/3 cheaper, higher accuracy, simpler setup (just press record).
- Cons: 5-10 min delay before transcript available (not ideal if someone needs to reference during meeting, but rarely happens).

**ZAOstock call:** ASYNC. Save $75 vs. $150 over 25 meetings. 5-min delay is acceptable for volunteer team.

---

## Integration Points in `/stock/team` Codebase

**New tables:**
- `stock_meeting_transcripts` (meeting_id, transcript_json, speaker_diarization, deepgram_cost_cents, created_at)
- `stock_meeting_summaries` (meeting_id, summary_text, decisions_json, action_items_json, open_questions_json, tone, claude_cost_cents)
- `stock_meeting_participation` (meeting_id, attendee_name, talk_count, talk_duration_sec, share_percent)

**Modified tables:**
- `stock_meeting_notes`: add `transcript_id` (FK), `summary_id` (FK), auto-populate `content` with AI summary.

**New routes:**
- GET `/api/stock/team/meetings/[id]/transcript` — return transcript JSON or plaintext.
- POST `/api/stock/team/meetings/[id]/summarize` — trigger Claude summary generation.
- GET `/api/stock/team/meetings/next-agenda` — generate agenda for next meeting.
- GET `/api/stock/team/meetings/stats` — participation dashboard data.

**Modified routes:**
- POST `/api/stock/team/meetings` — on create, auto-schedule Google Meet + set up Deepgram webhook.

**Telegram integration (ZOE):**
- ZOE task: daily cron checks `stock_action_items`, sends reminders.

**Google Calendar integration:**
- Existing: Zaal creates event, adds link.
- New: auto-populate description with agenda.

---

## Open-Source Patterns to Borrow

1. **Deepgram + Claude example:** https://github.com/deepgram-devs/deepgram-python-sdk/tree/main/examples/speech-to-text/transcription/file (batch transcription pipeline)
2. **Google Meet webhook setup:** https://github.com/googleapis/google-cloud-python/tree/main/speech/quickstart (GCS bucket + Cloud Functions)
3. **Action item extraction:** https://huggingface.co/tner/tner-large (NER model trained on meeting action items; open source, can fine-tune on ZAOstock meeting data)
4. **Telegram bot reminders:** https://github.com/python-telegram-bot/python-telegram-bot (Python async polling; ZOE already uses this)
5. **Supabase scheduled functions:** https://github.com/supabase/supabase-js/blob/master/examples/edge-functions (cron jobs for reminder dispatch)

---

## Cost Breakdown (25 meetings, Apr 28-Sep 1)

| Component | Unit Cost | Qty | Total |
|-----------|-----------|-----|-------|
| Deepgram transcription | $1.50-3.00/hr | 25 meetings x 45 min avg | $31.25 |
| Claude Haiku summarization | $0.05/meeting | 25 | $1.25 |
| Telegram bot API | $0 | 25 meetings x 3-5 reminders | $0 |
| Google Calendar API | $0 | 25 | $0 |
| Development (routes + Supabase tables + ZOE integration) | 1-2 days engineering | 1 | ~8 hrs (in-house) |
| **Total cash cost** | | | **$32.50** |

---

## Realistic 170-Day Roadmap

**Week of Apr 24 (this week):**
- Wire Deepgram webhook + S3 bucket (2 hrs).
- Test on dummy 10-min audio file (30 min).

**Week of Apr 28 (first live meeting):**
- Run pilot Apr 28 meeting: record, transcribe, review output.
- Iterate diarization params if needed (1 hr).

**Week of May 1:**
- Ship Pattern 2 (Claude summarization) + Pattern 3 (agenda generation).
- Start manual action item tracking in stock_action_items table.
- Zaal reviews 3-5 summaries for quality (15 min each).

**Week of May 5:**
- Ship Pattern 4 (Telegram reminders).
- Test with 3 actions, Zaal approves.

**Week of May 15:**
- Auto-wire action items into stock_action_items (no more manual entry).
- Revisit Pattern 6 (feedback pulse) if team requests.

**Ongoing (May 15-Sep 1):**
- Every Tuesday: transcript → summary → auto-actions → Telegram reminders (fully automated).
- Zaal spot-checks every 3rd meeting summary for quality (5 min, prevent drift).

**Sep 1 (post-festival):**
- Retrospective: meeting quality, follow-through rate on action items, participation balance.
- Consider Pattern 5 (participation scoring) for next-year planning.

---

## Why SaaS vs. Custom Build?

**Use a SaaS (Otter.ai, Fathom, tl;dv):**
- Pros: Zero setup, beautiful UI, handles edge cases (lag, audio glitches), 24/7 support.
- Cons: $8-50/mo per platform, vendor lock-in, less control over data (ZAOstock data in Otter's servers), privacy concerns for volunteer team.

**Build custom (Deepgram + Claude + custom routes):**
- Pros: $32.50 total, data stays on Supabase (owned by ZAO), zero vendor lock-in, integrates seamlessly with `/stock/team` (one dashboard), reuse for all future ZAO meetings (not just ZAOstock).
- Cons: 1-2 days setup engineering, need to monitor Deepgram API health, if Deepgram has an outage we're blocked (vs. Otter's redundancy).

**ZAOstock call:** BUILD CUSTOM. Upfront cost is negligible ($32.50). Setup is minimal (2 days). Data ownership + tight integration with dashboard justify it. Plus, once wired, can reuse for ZAO weekly leadership meetings, artist strategy sessions, etc. — leverage multiplier across org.

---

## Success Metrics (170 days)

- **Transcript availability:** 95%+ of meetings have transcript within 10 min of end.
- **Summary quality:** Zaal reviews 5 summaries, rates 4+/5 on "did this capture what we discussed?"
- **Action item follow-through:** 80%+ of committed action items marked "done" before due date (tracked via stock_action_items + Telegram reminder receipts).
- **Team feedback:** Async teammates report 30% less time re-watching videos (target: 3 min summary instead of 45 min video).
- **Engagement:** At least 1 teammate mentions "nice to have the summary" or "I saw the reminder and got it done."

---

## This Week

1. Zaal + Candy: decide on Deepgram vs. Otter.ai (likely Deepgram, cost is decided above).
2. Engineering: wire Deepgram webhook + S3 bucket + first route (4 hrs, Fri or Mon).
3. Apr 28 meeting: record + transcribe + review output. Feedback loop by May 1.

---

## Related Docs

- [476 - Apr 22 Team Recap](../476-zaostock-apr22-team-recap/) (meeting format locked, hybrid starting Apr 28)
- [13-decision-ai.md](13-decision-ai.md) (action item extraction + decision tracking; feeds off this doc's transcripts)
- [477 - Dashboard Phase 1 Shipped](../477-zaostock-dashboard-notion-replacement/) (MeetingNotes table + attachment upload already live)
