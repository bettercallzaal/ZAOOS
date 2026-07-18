---
topic: zabal, agents
type: ops-guide
status: ACTIVATE SEP 1 — ZOE's standing instruction for running ZABAL S2 (Sep 1 – Nov 21, 2026). Read by ZOE before each session week. Supplement to curriculum (docs 1588, 1626) and tracker spec (doc 1567).
last-validated: 2026-07-18
related-docs: 1588-zabal-s2-curriculum-week-by-week, 1567-zabal-s2-participant-tracker-spec, 1528-zabal-s2-workshop-calendar, 1611-zabal-s2-intake-and-selection-spec, 1607-zol-zabal-channel-autopost-spec
action-owner: ZOE (all automation tasks); Zaal (session facilitation, final decisions)
---

# 1677 — ZABAL S2: ZOE Weekly Operations Guide (Sep 1 – Nov 21, 2026)

> **What this is:** ZOE's week-by-week instruction manual for ZABAL S2. The curriculum (doc 1588) tells Zaal WHAT to teach each session. This doc tells ZOE WHAT TO DO each week: Sunday reminders, Monday session support, post-session recap and Supabase write, at-risk checks, and milestone tracking.
>
> **Session schedule:** Every Monday at 2 PM EST. Sessions = 12 (Week 1-12). Graduation Nov 21 (Fri).
>
> **ZOE access needed:** Supabase (zabal_s2_participants, zabal_s2_attendance, zabal_s2_milestones tables), ZOE Telegram (@zaoclaw_bot), Neynar signer for /zabal casts.

---

## Standing Weekly Rhythm

Every week of ZABAL S2 (Weeks 1-12) follows this pattern. Exceptions are noted in the Week-by-Week section below.

### Sunday (Day Before Session)
**Time:** 5:00 PM EST

**ZOE action: Pre-session reminder**
1. Pull session number from week counter (Week 1 = Sep 1, Week 2 = Sep 8, etc.)
2. Look up this week's theme from doc 1588 (curriculum)
3. Send Telegram message to ZABAL S2 group chat:

```
ZABAL S2 Week [N] — Tomorrow 2 PM EST.

This week: [Session theme from doc 1588]
Deliverable: [Track A deliverable] / [Track B deliverable]

Join link: [Zoom/Juke/Telegram voice link — confirm with Zaal before Week 1]

See you tomorrow.
```

4. Post to Farcaster /zabal (via ZOL or ZOE Neynar signer):
```
ZABAL S2 Week [N] tomorrow.

[One sentence on this week's theme]

Track A (Musicians): [deliverable]
Track B (Builders): [deliverable]

Monday 2 PM EST. Join /zabal for updates.
```

### Monday (Session Day)
**Time:** 1:45 PM EST (15 minutes before)

**ZOE action: Session go-live post**
1. Post to ZABAL S2 Telegram group:
```
ZABAL S2 Week [N] starts in 15 minutes.
[Join link]
```

**Time:** During session (2:00–3:30 PM EST)
ZOE monitors Telegram for any technical issues but does NOT interrupt the session unless Zaal explicitly asks. ZOE does NOT post during the session — only before and after.

**Time:** 3:30 PM EST (session end, approximately)

**ZOE action: Attendance recording**
1. Zaal sends ZOE a list of attendees via Telegram (or ZOE reads from a shared doc)
   - Format Zaal uses: `@zaoclaw_bot attended: handle1, handle2, handle3`
   - If no message received within 30 minutes of session end, ZOE DMs Zaal: "Week [N] attendance not logged yet. Reply with attended list."
2. ZOE writes attendance to Supabase `zabal_s2_attendance` table:
   ```sql
   INSERT INTO zabal_s2_attendance (participant_id, session_date, session_number, module, attended)
   VALUES (...) ON CONFLICT (participant_id, session_number) DO UPDATE SET attended = EXCLUDED.attended
   ```
3. ZOE marks absent participants (those NOT in the attended list) with `attended = false`

**ZOE action: Session recap post (within 1 hour of session end)**
Post to Farcaster /zabal:
```
ZABAL S2 Week [N] done.

[N]/[Total] participants showed up.
This week: [one sentence on what was covered].
Deliverable: [what participants need to do this week].

Next week: [one sentence preview of Week N+1 from curriculum].
```

Post to ZABAL S2 Telegram:
```
Week [N] recap sent.

[Same content as Farcaster cast]

Questions? Reply here or DM @bettercallzaal.
```

### Tuesday (Day After Session)
**Time:** 9:00 AM EST

**ZOE action: At-risk check**
1. Query Supabase: participants with `attended = false` for the LAST 3 consecutive sessions
2. For each at-risk participant:
   a. Send Zaal a Telegram alert: `ZABAL S2 at-risk: [handle] has missed 3 sessions in a row (Weeks [N-2], [N-1], [N]). Recommend DM.`
   b. Prepare a draft DM for Zaal to review (not send automatically):
   ```
   Hey [name] — checking in. Missed the last 3 ZABAL S2 sessions.
   Still in? No pressure, but I want to make sure you have what you need.
   Can we find a time this week?
   — Zaal
   ```
3. ZOE DOES NOT send the at-risk DM without Zaal approval. Zaal sends or delegates.

### Thursday (Fractal Reminder)
**Time:** 5:00 PM EST

**ZOE action: Fractal session reminder (Weeks where Fractal intersects with ZABAL S2)**
For Weeks 5 and 10 (governance sessions), ZOE adds a ZABAL-specific note to the standard Fractal reminder:
```
[Standard Fractal Thursday reminder]

Note for ZABAL S2 participants: tonight's session is part of your Week [N] curriculum. Attendance counts toward your ZOR session record. Join the Fractal voice call by 7 PM ET.
```

### Friday (Milestone Check)
**Time:** 10:00 AM EST

**ZOE action: Milestone detection**
Scan Telegram and Farcaster for the past 7 days for milestone evidence:

1. **WaveWarZ battle URLs:** If a ZABAL S2 participant (Track A) shared a WaveWarZ battle URL in ZABAL S2 Telegram or /zabal, ZOE adds a record to `zabal_s2_milestones`:
   ```
   INSERT INTO zabal_s2_milestones (participant_id, type, evidence_url, milestone_date)
   VALUES ([participant_id], 'ww_battle', [url], NOW())
   ```
2. **ZAOOS PR links:** If a participant (Track B) shared a GitHub PR link to a ZAOOS PR, ZOE records it as type = `zaoos_doc`
3. **Arweave uploads:** If participant shared an Arweave tx hash, record as type = `arweave_upload`

ZOE does NOT verify the PR content — only that the link exists. Zaal or ZOE reviewer checks quality separately.

**ZOE action: Monday EOD report preview**
At 5:00 PM on Friday, ZOE sends Zaal a summary:
```
ZABAL S2 Week [N] summary:

Attendance: [N attended] / [Total] ([%])
At-risk: [N] participants flagged
Milestones this week:
  WW battles: [N]
  ZAOOS PRs: [N]
  Arweave uploads: [N]

Running totals:
  Sessions held: [N]/12
  Completion-eligible (≥8 sessions): [N] participants
```

---

## Week-by-Week Special Instructions

### Week 1 (Sep 1 or Sep 4 — confirm date with Zaal)
**First session — extra ZOE tasks:**
1. Before Sunday reminder: ZOE sends each accepted participant their individual welcome DM (template from doc 1611, if not already sent at acceptance)
2. After session: ZOE creates all participant rows in `zabal_s2_participants` if not already done during intake
3. Post to /zabal + /zao (bigger announcement, not just /zabal):
```
ZABAL Season 2 is now in session.

[N] builders and musicians. Sep 1 – Nov 21.
12 weeks. WaveWarZ battles. ZAOOS docs. ZAOstock.

Follow /zabal for weekly updates.
```

### Week 3 (Sep 15) — Africa Battle Week Pre-Brief
**Extra ZOE task (Sunday reminder supplement):**
Add to Sunday reminder:
```
Extra note: Africa Battle Week starts next week (Sep 22).
Track A participants: this is your biggest battle opportunity of the cohort.
Track B participants: consider documenting the Africa Battle Week in a ZAOOS research doc (counts toward your 2-doc requirement).
```

### Week 4 (Sep 22-26) — Africa Battle Week Live
**Daily ZOE posts to /zabal:**
Each battle day (Sep 22-26), ZOE posts to /zabal:
```
Africa Battle Week Day [N] — ZABAL S2 crossover.
[Battle link]
Track A participants: battle today counts.
Watch live on WaveWarZ.
```

Attendance for Week 4 session: confirm with Zaal whether there IS a regular Monday session during Africa Battle Week, or if Sep 22 replaces it with an Africa-focused session. Handle accordingly.

### Week 5 (Sep 29) — ZAOstock Debrief
**Post-session extra task:**
Post to /zabal a ZAOstock summary (pull numbers from ZOE's ZAOstock live-posting):
```
ZABAL S2 Week 5: ZAOstock debrief.

[N] S2 participants attended ZAOstock.
[N] WaveWarZ battles at the event.

The goal isn't just to attend — it's to bring what you saw back to ZABAL S2.
Week 6 kicks off the final stretch.
```

### Week 7 (Oct 13) — Mid-Season Review
**Extra ZOE tasks:**
1. Run the mid-season Supabase query for micro-grant eligibility check:
   ```sql
   SELECT p.name, p.track, 
     COUNT(CASE WHEN a.attended THEN 1 END) as sessions_attended,
     COUNT(CASE WHEN m.type = 'ww_battle' THEN 1 END) as battles,
     COUNT(CASE WHEN m.type = 'zaoos_doc' THEN 1 END) as docs
   FROM zabal_s2_participants p
   LEFT JOIN zabal_s2_attendance a ON p.id = a.participant_id
   LEFT JOIN zabal_s2_milestones m ON p.id = m.participant_id
   WHERE a.session_number <= 7
   GROUP BY p.id
   ```
2. Send Zaal the mid-season report: on-track count, at-risk count, milestone leaders
3. For any participant with < 4 sessions attended by Week 7: send Zaal a DM draft with subject "Mid-season check-in"

### Week 11 (Nov 9) — Portfolio Review
**Pre-session extra task:**
ZOE aggregates each participant's portfolio for Zaal to review:
```
ZABAL S2 Week 11 portfolio summary:

Track A (Musicians):
[Name 1]: [N] battles, [1/0] on-chain release, [1/0] ZOR vote
[Name 2]: ...

Track B (Builders):
[Name 1]: [N] ZAOOS PRs, [1/0] arweave upload, [1/0] WW API demo
...

Tier 1 eligible (≥8 sessions): [N]
Tier 2 eligible (+ ≥2 ZAOOS docs): [N]
Tier 3 nominees (manual pick): [suggest 3-5 names]
```

### Week 12 (Nov 17) — Graduation Prep
**ZOE tasks:**
1. People's Choice vote: create Telegram poll in ZABAL S2 group (Nov 17 9AM ET):
   ```
   ZABAL S2 People's Choice Award

   Vote for the participant who contributed most to the cohort.
   One vote per person. Closes Nov 19 9PM ET.
   
   [Participant 1]
   [Participant 2]
   [Participant 3]
   ...
   ```
2. Run final micro-grant eligibility query (same as Week 7 query, but sessions ≤ 12)
3. Send Zaal pre-graduation report by Nov 19 12PM ET

### Graduation (Nov 21, Friday)
**ZOE posts at graduation ceremony start:**
```
ZABAL S2 graduation — happening now.

[N] participants. 12 weeks.
[Total] WaveWarZ battles.
[Total] ZAOOS docs contributed.

Micro-grant recipients announced in 10 minutes.

This is what community-built music education looks like.
```

**ZOE posts after micro-grant announcements:**
```
ZABAL S2 micro-grant recipients:

Tier 1 ($50 USDC each): [list of names]
Tier 2 ($100 USDC each): [list of names]
Tier 3 ($200 USDC): [winner's name]
People's Choice ($150 USDC): [winner's name]

[Total] USDC distributed on Solana.

Thank you to every participant who showed up.
See you in Season 3.
```

---

## ZOE Telegram Commands (ZABAL S2 Group)

ZOE recognizes these commands from Zaal in the ZABAL S2 group:

| Command | What ZOE does |
|---------|--------------|
| `@zaoclaw_bot attended: [comma-separated handles]` | Record attendance for current week's session |
| `@zaoclaw_bot milestone: [handle] ww_battle [url]` | Record WaveWarZ battle for participant |
| `@zaoclaw_bot milestone: [handle] zaoos_doc [PR_url]` | Record ZAOOS doc PR for participant |
| `@zaoclaw_bot status` | ZOE replies with current week, total sessions held, at-risk count |
| `@zaoclaw_bot eligibility` | ZOE replies with micro-grant eligibility count for each tier |

---

## What ZOE Does NOT Do in ZABAL S2

- **Facilitate the session:** Zaal runs the session. ZOE only supports before/after.
- **Grade work quality:** ZOE records that a ZAOOS PR was submitted (the URL), not whether it's good. Zaal reviews quality.
- **Send at-risk DMs without approval:** ZOE prepares the message, Zaal sends.
- **Select micro-grant winners:** Tier 3 and People's Choice are Zaal + ZOR holder decisions. ZOE provides eligibility data, not the winner.
- **Accept new participants after Sep 15 (Week 3):** Late additions require Zaal decision.

---

## Escalation Triggers (ZOE DMs Zaal Immediately)

1. Attendance drops below 50% in any week (< half the cohort attended)
2. Any participant reaches 3 consecutive missed sessions (at-risk, not just count)
3. A participant reports a technical issue during the session via Telegram
4. A Track B participant submits a ZAOOS PR that gets rejected or conflicted on GitHub
5. Charity battle day (Sep 26) results are delayed (ZOE monitoring WW API for settlement)
6. A Supabase write fails (ZOE alerts Zaal + logs error to `~/.zao/zoe/errors.jsonl`)

---

## Sources

- `research/zabal/1588-zabal-s2-curriculum-week-by-week/` — weekly themes, deliverables, Zaal's facilitation plan
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase schema + ZOE data patterns
- `research/zabal/1528-zabal-s2-workshop-calendar/` — session dates + module structure
- `research/zabal/1611-zabal-s2-intake-and-selection-spec/` — accepted participant list source + welcome DM template
- `research/zabal/1555-zabal-s2-microgrant-program-spec/` — micro-grant eligibility rules + payout structure
- `research/farcaster/1607-zol-zabal-channel-autopost-spec/` — /zabal Farcaster post patterns
- `research/technology/1601-zoe-supabase-integration-patterns/` — Supabase write patterns ZOE uses
