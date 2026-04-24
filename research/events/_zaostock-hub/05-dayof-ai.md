# 05 — Day-of Coordination + Incident Response

> **Status:** Research phase
> **Date:** 2026-04-22
> **Dimension:** Real-time ops + team sync + problem-solving on Oct 3
> **Payoff:** Avoid firefighting mode; triage issues in <2min; surface critical info to decision-makers without chaos
> **Core insight:** 5-8 people in command roles managing 20 volunteers + 10 artists + ~500-1000 attendees. Real-time comms, not post-event report.

---

## Pareto 80/20

20% of the work that delivers 80% of the value on festival day:

1. **Real-time voice logging** (volunteers narrate problems into a phone) - voice transcribed, auto-logged, no typing under pressure
2. **Incident triage dashboard** (AI reads the log stream, classifies severity, suggests owner/action)
3. **1-tap SMS alerts to command staff** (Zaal or duty manager sends `/alert all`, `/alert stage`, `/alert gates`, auto-broadcasts to specific volunteer groups)

Everything else in this doc is "nice to have" — these three unlock control + visibility with <$500 total spend.

---

## The problem we're solving

Oct 3, 9am: 50 volunteers on-site, no pre-event. 1pm: first artist on stage. 5pm: peak crowd. 9pm: cleanup.

Without AI assist:
- Zaal gets pinged on 15 different channels (Telegram, text, in-person shout)
- No record of what happened when; post-event debrief is anecdotes
- Incident takes 20min to triage because info is scattered
- Same problem happens twice because nobody remembered the fix
- Media capture goes to 3 different drives; photos get lost
- Stage transition overruns by 10min; sound engineer didn't know; timing cascades

With AI assist:
- All comms funnel through one voice log (Slack + SMS hybrid)
- AI reads the stream in real-time; surfaces critical issues (stage delay >5min, injury reported, sound problem) as alerts
- Zaal or duty manager confirms severity + action owner in Slack; one command flows to all relevant people via SMS
- Photos tagged and sortable in real-time; best 5 auto-selected for social
- Timeline recorded precisely; post-event review takes 30min, not 2 hours

---

## Dimension breakdown

### 1. Real-Time Voice Logging (Incident intake)

**What it does:**
Volunteers hold a radio/walkie-talkie-style app or phone line. They speak a 10-30 second incident or update. System transcribes it, appends to a central log, adds timestamp + speaker ID.

Example voice logs:
- "Vendor gate: two trucks backed up, ETA 15 min, can we delay artist load-in?"
- "Main stage: sound check overran by 8 minutes, artist 2 will start late"
- "Medical: minor scrape at merch booth, band-aid applied, attendee fine"

**Tools:**
- **Slack voice messages** (native, free) — volunteers join a Slack channel, send 10-sec voice DMs
- **Twilio voice + transcribe** ($0.0025/min + $0.05/transcription) — toll-free number, auto-transcribe via Twilio's AI, append to logs
- **Telegram bot** (free tier) — Zaal's preferred messenger; we already have ZOE running; add `/log` command to ZOE: record voice → transcribe via Deepgram API ($0.03/min, cheaper than Twilio)
- **Open-source Whisper** (free) — if we want fully on-device, OpenAI's Whisper runs on the Pi or VPS with <500ms latency

**Recommendation:** Start with Telegram + Deepgram. Zaal already uses Telegram daily, ZOE is there, Deepgram is cheaper than Twilio at scale. Voice message button → speak → logs auto-append to `/stock/team` activity feed.

**Integration point:** `/stock/team/logs` (new sub-dashboard, Phase 4 item from doc 477)
- Timeline view of all voice logs
- Filterable by person, type (vendor, stage, medical, crowd, weather)
- Search by keyword: "delayed", "injury", "weather", "sound"
- One-click context: attach photo, link to relevant ticket, add manual note

**Timeline:**
- **Week of May 5:** Deepgram API key + ZOE `/log` command
- **Week of June 9:** Test with Zaal's team in mock incident drills (2-3 dry runs)
- **Sept 1-3:** Final walkie-talkie protocol doc + volunteer training (15 min)

**Cost:** Deepgram $30 (1000 min at $0.03/min is $30; budget 500 min on festival day = $15)

---

### 2. Incident Triage + Auto-Actions

**What it does:**
All voice logs (+ manual Slack messages from command staff) feed into a Claude-powered triage agent. The agent:
1. Reads each log in real-time
2. Classifies by severity: [CRITICAL] (injury, stage failure, weather), [HIGH] (delays >5min, vendor issue), [MEDIUM] (minor delays, questions), [INFO] (status updates)
3. Suggests an owner based on the issue type and known roles
4. Proposes a 1-line action
5. Posts to `/stock/team/triage` channel in Slack as a card with [SEVERITY] tag, action, owner mention

Example:
```
[CRITICAL] Stage power cut — suggest: contact backup generator, page Candy + Zaal
Owner: @candy-stage
Action: Switch to backup gen (key under stage left)
```

**Tools:**
- **Claude API** (Prompt Caching) — feed the agent a roster of roles (Candy = stage, DCoop = music, Shawn = crowd/merch, Alex = gates, etc.) + their phone numbers. Cache the roster so each incident triage costs ~1000 tokens, not 3000
- **Slack SDK** — post the triage card to a dedicated channel; team responds in-thread ("actioned", "awaiting", "resolved")
- **Custom webhook** (100 lines Node.js) — listen for new logs in `/stock/team`, trigger the triage agent, post the card

**Severity thresholds (examples):**
- CRITICAL: injury/medical, stage power, artist no-show, weather >80% rain chance, crowd >150% capacity, sound loss >30 sec
- HIGH: stage delay >5 min, vendor ETA >30 min overdue, gate line >20 min, attendee missing person report
- MEDIUM: minor equipment fail (mic needs swap), scheduling shift <5 min, crowd control question
- INFO: status ("artist loaded in"), "stage clear for next act", "catering arrived"

**Integration point:** `/stock/team/triage` view (Phase 4, doc 477)
- Card wall: columns by severity
- Each card: log snippet, suggested owner, action, timestamp
- Click card to expand: full voice transcript, context (related tickets, photos)
- Bulk action: select 3 cards, mark "actioned", notify all owners

**Timeline:**
- **Week of May 12:** Claude Ops prompt + roster structure
- **Week of June 2:** Test triage loop (simulate 20 incident logs, validate classifications)
- **Sept 15:** Mock incident drills with Zaal + command staff (realistic scenarios)

**Cost:** Claude API ~$2 (assuming ~500 triage runs at ~1000 tokens each with cache, ~$0.003 per run)

---

### 3. SMS Alert Cascade

**What it does:**
Zaal or duty manager in the triage dashboard sees a card like "Stage: artist 2 delayed 8 min, may not start on time". They click "Alert" → system sends a **targeted SMS to specific groups**.

Example commands:
- `/alert all` → SMS to all 25 command+volunteer numbers: "ZAO Stock team: stage update — artist 2 delayed 5 min. Revised schedule in dashboard."
- `/alert stage` → SMS to stage team (Candy + tech): "Stage power test needed in 10 min."
- `/alert gates` → SMS to gate captains: "We're at 70% capacity. Gate 1 has 15-min line, consider valet lot."
- `/alert weather` → SMS to all: "Rain alert: 60% chance light rain 3-5pm. Tent ready under stage. No indoor pivot needed yet."

**Tools:**
- **Twilio Messaging API** ($0.01/SMS outbound; budget 100 messages on festival day = $1)
- **Slack slash command** — `/alert [group] [message]` in the triage channel; Zaal approves, system sends SMS
- **Role-based groups** (configured in `/stock/team/settings`):
  - @stage-crew: Candy, tech lead, sound engineer
  - @gates: Alex, 2 gate captains
  - @medical: on-site medic, Candy as backup
  - @merch: Shawn, 2 merch volunteers
  - @command: Zaal, Candy, DCoop
  - @all: everyone

**Integration point:** `/stock/team/triage` → "Alert" button on each card
- Pre-filled groups based on severity + issue type
- Zaal edits the message, confirms, sends
- SMS delivery logged in the triage card ("Alert sent to @stage-crew at 3:42pm")

**Timeline:**
- **Week of May 19:** Twilio integration + slash command
- **Week of June 9:** Dry-run with mock alerts to Zaal's phone
- **Sept 1:** Finalize groups + phone numbers

**Cost:** Twilio $1 (100 SMS × $0.01)

---

## Key Decisions

| Decision | USE | DEFER | SKIP | Notes |
|----------|-----|-------|------|-------|
| Voice logging (Telegram + Deepgram) | X | | | P0. Unlocks incident visibility. Low risk. |
| Incident triage (Claude API + Slack cards) | X | | | P0. Unlocks decision-making speed. |
| SMS alert cascade (Twilio) | X | | | P0. Unlocks command authority. 25 people need to know fast. |
| Stage timing visual countdown | | X | | P2. Nice but not critical. Zaal's team knows run-of-show. Build in Phase 5. |
| Weather alerts + contingency drafts | | X | | P2. OpenWeather data + Claude. Helpful if rain, but forecast Oct 3 may be clear. Revisit if weather forecast darkens in Sept. |
| Crowd counting (YOLO) | | | X | P3. Not needed Oct 3. Revisit year 2. |
| Photo capture + real-time AI review | | X | | P2. Huge UX win for social (doc 06). Depends on whether photographer is isolated or integrated into team. Build in Phase 5 + integrate with Phase 6. |
| Audio level monitoring | | | X | P3. Maine is quiet. Legal risk is low. Skippable. |
| Push notifications to volunteers | | X | | P2. PWA + OneSignal. Depends on team adoption of the tool. Test in Sept; defer build to June 9 if Sept adoption is low. |

---

## Reality check for our scale

Team size: 5-8 in command roles, 20 volunteers, ~10 artists, ~500-1000 attendees.

Triage agent answering "who owns this?" with 30+ people is realistic. The agent's rosters (Candy = stage, Alex = gates, etc.) + past logs from this doc's timeline (May onward) give the agent high-confidence context.

Voice logging for 20 people: realistic. A Telegram button in the ZOE bot = low friction. Expect 30-50 logs on festival day (1-2 per person per hour, mostly status updates).

SMS alerts to 8-10 decision-makers: realistic. Zaal making calls in real-time + system backing him up.

**Risk:** If Zaal is on-stage during an incident, who approves the alert? **Mitigation:** Duty manager system. Candy or DCoop gets secondary approval authority. Documented in Sept volunteer handbook.

---

## Cost summary

| Tool | Cost | Notes |
|------|------|-------|
| Deepgram transcription | $15-30 | 500-1000 min at $0.03/min; budget 30 incident logs + 20 practice |
| Claude API (triage) | $2 | ~500 triage runs at ~1000 tokens each, cached |
| Twilio SMS | $1-5 | 100-500 messages at $0.01 each |
| **Total** | **~$20-40** | | 

---

## Timeline to ship

| Week | Owner | Task | Blocking? |
|------|-------|------|-----------|
| May 5-11 | Zaal + eng | Deepgram API key, ZOE `/log` command | No |
| May 12-18 | Claude ops | Triage prompt + role rosters | No |
| May 19-25 | Zaal + eng | Twilio integration, Slack alerts | No |
| June 2-8 | Team | End-to-end test: voice → triage → SMS | No |
| Sept 15 | Team | Final dry-run with real roles + decisions | Yes |

---

## This week (week of Apr 22)

1. Zaal: confirm Deepgram budget + spin up API account
2. Eng: create ZOE `/log` command skeleton (webhook endpoint + Deepgram call)
3. Zaal: draft incident roster (name → role → phone) for first 10 people

---

## Sources

- Deepgram real-time speech API: https://developers.deepgram.com/docs/getting-started-with-real-time-transcription
- Twilio Messaging: https://www.twilio.com/docs/sms
- Claude Ops + prompt caching: https://anthropic.com/docs/build/caching
- Slack Workflows: https://slack.com/help/articles/17542172617107-Use-Slack-Workflows-to-connect-apps
- OneSignal Web Push: https://documentation.onesignal.com/docs/web-push-setup

---

## Related ZAOstock docs

- [477 — Dashboard Notion-Replacement](../477-zaostock-dashboard-notion-replacement/) — Phase 4 day-of UI
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/) — timing + artist schedule
- [06-social-ai.md](06-social-ai.md) — day-of social posting

*Incident response is about speed + context. This doc trades "glossy alerts" for "real-time signal".*
