# 1567 — ZABAL S2 Participant Tracker: System Spec (Build Before Sep 1)

**Type:** SYSTEM-SPEC  
**Topic:** ZABAL  
**Status:** BUILD BY AUG 22 (cohort selection day) — Hurricane implements; ZOE reads from it daily. Without this tracker, ZOE cannot alert at-risk participants, trigger micro-grant eligibility, or run the Nov 20 Excellence Award vote.

---

## Why This Exists

ZABAL S2 runs Sep 1 – Nov 30 with 15–25 participants across 2 tracks (Builder + Musician). ZOE needs a data layer to:
1. Auto-alert Zaal when a participant misses 3 consecutive sessions
2. Confirm micro-grant eligibility on Nov 20 (doc 1555)
3. Generate weekly participation stats for ZOE's 7PM EOD report (doc 1499)
4. Feed the governance vote for Tier 3 Excellence Award

The tracker lives in Supabase (same DB as the ZAO cowork tracker). Hurricane creates the tables; ZOE reads/writes via the Supabase REST API.

---

## Supabase Schema

### Table: `zabal_s2_participants`

```sql
CREATE TABLE zabal_s2_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  track         text NOT NULL CHECK (track IN ('builder', 'musician')),
  x_handle      text,
  farcaster_fid text,
  telegram_handle text,
  audius_handle text,      -- musicians only
  github_handle text,      -- builders only
  phantom_wallet text,     -- for ZOR/ZAOstock governance + micro-grant payment
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'at_risk', 'withdrawn', 'graduated')),
  joined_at     timestamptz DEFAULT NOW(),
  s1_alumni     boolean DEFAULT false,
  zaostock_confirmed boolean DEFAULT false,  -- will they be at Oct 3
  notes         text
);
```

### Table: `zabal_s2_attendance`

```sql
CREATE TABLE zabal_s2_attendance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES zabal_s2_participants(id),
  session_date   date NOT NULL,
  session_number int NOT NULL,  -- 1-12 (12 weeks, Sep 1 – Nov 21)
  module         text,          -- 'Foundations', 'Creating', 'ZAOstock', 'Business', 'Final'
  attended       boolean NOT NULL DEFAULT false,
  late_join      boolean DEFAULT false,  -- joined >15 min after start
  notes          text,
  recorded_at    timestamptz DEFAULT NOW()
);
-- Unique constraint: one row per participant per session
CREATE UNIQUE INDEX attendance_unique ON zabal_s2_attendance(participant_id, session_date);
```

### Table: `zabal_s2_milestones`

```sql
CREATE TABLE zabal_s2_milestones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES zabal_s2_participants(id),
  milestone_type text NOT NULL CHECK (milestone_type IN (
    'ww_battle',       -- WaveWarZ battle completed (musicians, required)
    'zaoos_doc',       -- ZAOOS doc contributed (all participants)
    'artifact',        -- shipped artifact (builders, required)
    'arweave_upload',  -- track on Arweave (musicians, required)
    'zabal_games_submission', -- submission in ZABAL Games
    'coc_performance', -- performed at COC Concertz
    'zaostock_attend'  -- attended ZAOstock Oct 3
  )),
  verified_at    timestamptz DEFAULT NOW(),
  evidence_url   text,  -- GitHub PR / Arweave tx / WaveWarZ battle URL
  notes          text
);
```

---

## ZOE Read/Write Patterns

ZOE uses the Supabase REST API (same pattern as cowork tracker in doc 1499).

### Daily attendance check (ZOE, after each Thursday session):
```typescript
// ZOE: record attendance from Telegram session notes
const sessionDate = '2026-09-04'  // fill from session
const participantHandle = '@their_telegram'

// Look up participant by Telegram handle
const participant = await supabase
  .from('zabal_s2_participants')
  .select('id')
  .eq('telegram_handle', participantHandle)
  .single()

// Record attendance
await supabase.from('zabal_s2_attendance').upsert({
  participant_id: participant.data.id,
  session_date: sessionDate,
  session_number: 1,
  module: 'Foundations',
  attended: true
})
```

### At-risk check (ZOE, runs after each session):
```typescript
// Find participants who missed 3+ consecutive sessions
const { data: attendanceRecords } = await supabase
  .from('zabal_s2_attendance')
  .select('participant_id, session_number, attended')
  .order('session_number', { ascending: false })

// ZOE groups by participant_id, checks last 3 sessions
// If all 3 = false: mark status = 'at_risk', send Telegram DM
```

### Micro-grant eligibility check (ZOE, Nov 20):
```typescript
// Tier 1 Completion: ≥10 sessions + ≥1 artifact/battle + ≥1 ZAOOS doc
const { data: attended } = await supabase
  .from('zabal_s2_attendance')
  .select('participant_id', { count: 'exact' })
  .eq('attended', true)
  .gte('count', 10)

// ZOE generates eligibility report for Zaal to approve
```

---

## ZOE Weekly Participation Report

Every Monday (part of 2PM midday report — doc 1499):

```
ZABAL S2 Week [N] Status:
• Active participants: [N]/[total]
• Sessions held: [N]/12
• At-risk (missed 3+): [N] — names in DM
• Builder milestone hits this week: [N] (artifacts/docs)
• Musician milestone hits: [N] (battles/Arweave)
• ZAOstock confirmed: [N]/[total]
```

ZOE pulls all figures from Supabase. If Supabase is unreachable: send "[TRACKER UNAVAILABLE]" to Zaal, retry 7PM EOD.

---

## Micro-Grant Eligibility Rules (From Doc 1555)

ZOE checks each participant against these rules on Nov 20:

| Award Tier | Eligibility Query |
|---|---|
| Tier 1 Completion ($50) | ≥10 sessions attended + ≥1 artifact/battle milestone + ≥1 ZAOOS doc milestone |
| Tier 2 Contributor ($100) | Tier 1 criteria + ≥2 ZAOOS doc milestones |
| Tier 3 Excellence ($200) | Tier 2 criteria + nominated by Zaal + ZOR holder vote Nov 20 |
| Tier 4 People's Choice ($150) | Tier 1 criteria + highest cohort vote Nov 19 Telegram poll |

ZOE generates the eligibility report as a Markdown table, sends to Zaal via Telegram by Nov 20 10AM.

---

## Participant Status Lifecycle

```
application_received → accepted → active → [at_risk] → [graduated | withdrawn]
```

**Triggers:**
- `active → at_risk`: 3 consecutive missed sessions (ZOE auto-sets, Zaal notified)
- `at_risk → active`: participant attends next session (ZOE auto-resets)
- `at_risk → withdrawn`: participant missed 5+ sessions total (Zaal confirms)
- `active → graduated`: Nov 20 ceremony (Zaal sets manually; ZOE confirms milestones first)

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| After each Thursday session | Record attendance from Telegram session notes (semi-auto: ZOE reads headcount, Zaal confirms names) |
| After each session, if ≥3 missed | Flag at-risk participants to Zaal, send at-risk DM: "Hey [Name] — we noticed you've missed the last 3 ZABAL S2 sessions. Still in? Reply YES to stay active." |
| When participant adds WW battle URL in Telegram | ZOE adds milestone row (ww_battle type, URL = evidence) |
| When participant opens ZAOOS PR | ZOE adds milestone row (zaoos_doc type, GitHub PR URL) |
| Every Monday 2PM | Include ZABAL S2 status block in EOD midday report |
| Nov 19 | Run Telegram poll for People's Choice award |
| Nov 20 10AM | Generate full eligibility report for micro-grant awards |
| Nov 21 | ZOE posts graduation message for each graduated participant |

---

## Implementation Checklist (Hurricane)

**By Aug 22 (cohort selection day):**
- [ ] Create `zabal_s2_participants` table in Supabase
- [ ] Create `zabal_s2_attendance` table in Supabase
- [ ] Create `zabal_s2_milestones` table in Supabase
- [ ] Add Supabase URL + API key to ZOE env vars (same key as cowork tracker)
- [ ] Test: ZOE can INSERT a test participant and SELECT it back

**By Sep 1 (cohort start):**
- [ ] ZOE: add weekly attendance recording to Monday report protocol
- [ ] ZOE: add at-risk check (runs after each session; Telegram alert to Zaal)
- [ ] ZOE: add milestone detection from Telegram messages (WW battle URL pattern)
- [ ] Pre-populate table with accepted cohort (from ZABAL S2 application form — doc 1510)

**By Nov 20 (graduation):**
- [ ] ZOE: eligibility report query complete
- [ ] ZOE: Telegram poll for People's Choice triggered Nov 19
- [ ] Hurricane: verify USDC payment addresses from phantom_wallet column

---

## Related Docs

- 1555 — ZABAL S2 Micro-Grant Program Spec (micro-grant criteria → Supabase eligibility queries)
- 1528 — ZABAL S2 Workshop Calendar (session dates → attendance schema sessions 1–12)
- 1510 — ZABAL S2 Application Form Spec (accepted cohort → pre-populate participants table)
- 1499 — ZOE Daily Ops Report Spec (ZABAL S2 status block in Monday 2PM report)
- 1540 — Governance Session Archive Template (ZABAL participants who become ZOR holders → governance session attendance)
- 1440 — ZABAL S2 Weekly Curriculum (completion criteria → milestone types in tracker)
