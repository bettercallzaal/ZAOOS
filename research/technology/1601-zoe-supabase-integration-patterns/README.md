# 1601 — ZOE Supabase Integration Patterns (Hurricane Handoff)

**Type:** TECHNICAL-REFERENCE  
**Topic:** Technology  
**Status:** ACTIVE — Hurricane implements these tables; ZOE reads/writes them. This doc is the canonical TypeScript pattern reference for all new Supabase tables added in Jul 2026 (ZABAL S2 tracking, ZAOstock attendees). Build all tables by Aug 22 (before ZABAL S2 starts Sep 1).

---

## Supabase Setup Reference

**Project:** ZAO Supabase (Hurricane manages credentials)  
**Client pattern:** `@supabase/supabase-js` v2  
**Environment variables:**
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[service-role-key]  # ZOE uses service key (no RLS bypass needed)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]  # For public-facing reads
```

**Supabase client initialization (ZOE server-side):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
```

---

## Table 1: `zabal_s2_participants`

**Doc ref:** 1567 (ZABAL S2 Participant Tracker Spec)  
**Build by:** Aug 22, 2026

### Schema (SQL)

```sql
create table zabal_s2_participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  track text check (track in ('artist', 'builder')) not null,
  x_handle text,
  farcaster_handle text,
  telegram_handle text,
  phantom_wallet text,
  status text check (status in ('active', 'at_risk', 'withdrawn', 'graduated')) default 'active',
  enrolled_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### ZOE Read Pattern: Get All Active Participants

```typescript
async function getActiveParticipants() {
  const { data, error } = await supabase
    .from('zabal_s2_participants')
    .select('*')
    .eq('status', 'active')
    .order('name')
  
  if (error) throw error
  return data
}
```

### ZOE Write Pattern: Update Participant Status

```typescript
async function markAtRisk(participantId: string) {
  const { error } = await supabase
    .from('zabal_s2_participants')
    .update({ 
      status: 'at_risk',
      updated_at: new Date().toISOString()
    })
    .eq('id', participantId)
  
  if (error) throw error
}
```

---

## Table 2: `zabal_s2_attendance`

**Doc ref:** 1567  
**Build by:** Aug 22, 2026

### Schema (SQL)

```sql
create table zabal_s2_attendance (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references zabal_s2_participants(id) on delete cascade,
  session_date date not null,
  session_number integer not null check (session_number between 1 and 12),
  module text not null,
  attended boolean default false,
  recorded_at timestamp with time zone default now(),
  unique(participant_id, session_number)
);
```

### ZOE Write Pattern: Record Attendance After Session

```typescript
async function recordAttendance(
  sessionNumber: number,
  sessionDate: string,
  moduleName: string,
  attendeeIds: string[]
) {
  const allParticipants = await getActiveParticipants()
  
  const rows = allParticipants.map(p => ({
    participant_id: p.id,
    session_date: sessionDate,
    session_number: sessionNumber,
    module: moduleName,
    attended: attendeeIds.includes(p.id)
  }))
  
  const { error } = await supabase
    .from('zabal_s2_attendance')
    .upsert(rows, { onConflict: 'participant_id,session_number' })
  
  if (error) throw error
}
```

### ZOE Read Pattern: Check At-Risk (3 Consecutive Misses)

```typescript
async function getAtRiskParticipants(): Promise<string[]> {
  // Get last 3 session records per participant
  const { data, error } = await supabase
    .from('zabal_s2_attendance')
    .select('participant_id, session_number, attended')
    .order('session_number', { ascending: false })
  
  if (error) throw error
  
  // Group by participant, check last 3 sessions
  const byParticipant = new Map<string, boolean[]>()
  
  for (const row of data ?? []) {
    const existing = byParticipant.get(row.participant_id) ?? []
    if (existing.length < 3) {
      byParticipant.set(row.participant_id, [...existing, row.attended])
    }
  }
  
  const atRisk: string[] = []
  for (const [participantId, attendances] of byParticipant.entries()) {
    if (attendances.length === 3 && attendances.every(a => !a)) {
      atRisk.push(participantId)
    }
  }
  
  return atRisk
}
```

### ZOE Pattern: Full At-Risk Check + Alert Flow

```typescript
async function runAtRiskCheck() {
  const atRiskIds = await getAtRiskParticipants()
  
  if (atRiskIds.length === 0) return
  
  // Get participant details
  const { data: participants } = await supabase
    .from('zabal_s2_participants')
    .select('id, name, telegram_handle, status')
    .in('id', atRiskIds)
    .eq('status', 'active')  // Don't re-flag already flagged participants
  
  for (const p of participants ?? []) {
    // Update status to at_risk
    await markAtRisk(p.id)
    
    // Alert Zaal via Telegram
    await sendTelegramMessage(
      ZAAL_TELEGRAM_ID,
      `⚠️ ZABAL S2 at-risk: ${p.name} has missed 3 consecutive sessions.` +
      (p.telegram_handle ? ` @${p.telegram_handle}` : '')
    )
    
    // DM participant if Telegram handle available
    if (p.telegram_handle) {
      await sendTelegramMessage(
        p.telegram_handle,
        `Hey ${p.name} — we've noticed you've missed the last 3 ZABAL S2 sessions. ` +
        `We don't want to lose you. Can you join Monday's session? ` +
        `If you need to defer to a future cohort, just let us know.`
      )
    }
  }
}
```

---

## Table 3: `zabal_s2_milestones`

**Doc ref:** 1567  
**Build by:** Aug 22, 2026

### Schema (SQL)

```sql
create table zabal_s2_milestones (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references zabal_s2_participants(id) on delete cascade,
  milestone_type text check (
    milestone_type in (
      'ww_battle',
      'zaoos_doc',
      'artifact',
      'arweave_upload',
      'coc_performance',
      'zaostock_attend'
    )
  ) not null,
  evidence_url text,
  verified_at timestamp with time zone default now(),
  notes text
);
```

### ZOE Write Pattern: Log Milestone

```typescript
async function logMilestone(
  participantId: string,
  milestoneType: string,
  evidenceUrl?: string,
  notes?: string
) {
  const { error } = await supabase
    .from('zabal_s2_milestones')
    .insert({
      participant_id: participantId,
      milestone_type: milestoneType,
      evidence_url: evidenceUrl,
      notes
    })
  
  if (error) throw error
}
```

### ZOE Read Pattern: Micro-Grant Eligibility Check (Nov 20)

```typescript
interface EligibilityResult {
  participantId: string
  name: string
  tier: 1 | 2 | 3 | null
  sessionCount: number
  hasArtifactOrBattle: boolean
  zaoosDocs: number
  zorVote: boolean
}

async function checkMicrograntEligibility(): Promise<EligibilityResult[]> {
  const participants = await getActiveParticipants()
  const results: EligibilityResult[] = []
  
  for (const p of participants) {
    // Count sessions attended
    const { count: sessionCount } = await supabase
      .from('zabal_s2_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', p.id)
      .eq('attended', true)
    
    // Check milestones
    const { data: milestones } = await supabase
      .from('zabal_s2_milestones')
      .select('milestone_type')
      .eq('participant_id', p.id)
    
    const milestoneTypes = milestones?.map(m => m.milestone_type) ?? []
    const zaoosDocs = milestoneTypes.filter(t => t === 'zaoos_doc').length
    const hasArtifactOrBattle = milestoneTypes.some(
      t => t === 'artifact' || t === 'ww_battle'
    )
    const zorVote = milestoneTypes.includes('zor_governance_vote')
    
    // Determine tier
    let tier: 1 | 2 | 3 | null = null
    const sessions = sessionCount ?? 0
    
    if (sessions >= 10 && hasArtifactOrBattle && zaoosDocs >= 1) {
      tier = 1
      if (zaoosDocs >= 2) {
        tier = 2
        if (zorVote) tier = 3
      }
    }
    
    results.push({
      participantId: p.id,
      name: p.name,
      tier,
      sessionCount: sessions,
      hasArtifactOrBattle,
      zaoosDocs,
      zorVote
    })
  }
  
  return results.sort((a, b) => (b.tier ?? 0) - (a.tier ?? 0))
}
```

---

## Table 4: `zaostock_2026_attendees`

**Doc ref:** 1585 (ZAOstock Attendee Pre-Event Welcome Pack)  
**Build by:** Aug 15, 2026 (Eventbrite webhook needed before RSVPs come in)

### Schema (SQL)

```sql
create table zaostock_2026_attendees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  ticket_type text check (ticket_type in ('ga', 'supporter', 'vip')) default 'ga',
  telegram_handle text,
  is_zabal_s2 boolean default false,
  is_zor_holder boolean default false,
  attended boolean default false,
  rsvp_date timestamp with time zone,
  created_at timestamp with time zone default now()
);
```

### ZOE Pattern: Add Attendee from Eventbrite Webhook

```typescript
async function addAttendeeFromEventbrite(webhookPayload: {
  name: string
  email: string
  ticket_class_name: string
  order_date: string
}) {
  const ticketType = webhookPayload.ticket_class_name.toLowerCase().includes('supporter')
    ? 'supporter'
    : webhookPayload.ticket_class_name.toLowerCase().includes('vip')
    ? 'vip'
    : 'ga'
  
  const { error } = await supabase
    .from('zaostock_2026_attendees')
    .upsert({
      name: webhookPayload.name,
      email: webhookPayload.email,
      ticket_type: ticketType,
      rsvp_date: webhookPayload.order_date
    }, { onConflict: 'email' })
  
  if (error) throw error
  
  // Trigger RSVP confirmation message (doc 1585 Message 1)
  await sendRsvpConfirmation(webhookPayload.email, webhookPayload.name)
}
```

### ZOE Pattern: Cross-Reference ZABAL S2 Participants

```typescript
async function markZabalS2Attendees() {
  const zabalParticipants = await getActiveParticipants()
  const emails = zabalParticipants.map(p => p.email)
  
  const { error } = await supabase
    .from('zaostock_2026_attendees')
    .update({ is_zabal_s2: true })
    .in('email', emails)
  
  if (error) throw error
}
```

### ZOE Pattern: Send Scheduled Message to All Attendees

```typescript
async function sendToAllAttendees(
  messageType: 'logistics' | 'ww_primer' | 'day_of' | 'post_event',
  messageContent: string
) {
  const { data: attendees, error } = await supabase
    .from('zaostock_2026_attendees')
    .select('name, email, telegram_handle, is_zabal_s2, is_zor_holder')
  
  if (error) throw error
  
  for (const attendee of attendees ?? []) {
    // Send via Telegram if handle available
    if (attendee.telegram_handle) {
      const personalizedMessage = messageContent.replace('[First Name]', 
        attendee.name.split(' ')[0])
      await sendTelegramMessage(attendee.telegram_handle, personalizedMessage)
    }
    
    // Always send via email (Eventbrite email blast is fallback)
    // Note: Eventbrite bulk email is manual — ZOE queues these for Zaal to trigger
    await queueEmailBlast(attendee.email, attendee.name, messageContent)
  }
}
```

---

## Hurricane Build Checklist

### By Aug 15

- [ ] `zaostock_2026_attendees` table created in Supabase
- [ ] Eventbrite webhook configured to POST to `/api/webhooks/eventbrite-rsvp`
- [ ] Webhook handler calls `addAttendeeFromEventbrite()` + triggers RSVP confirmation (doc 1585 Message 1)
- [ ] ZOE read access to `zaostock_2026_attendees` table confirmed

### By Aug 22

- [ ] `zabal_s2_participants` table created in Supabase
- [ ] `zabal_s2_attendance` table created in Supabase
- [ ] `zabal_s2_milestones` table created in Supabase
- [ ] ZOE `recordAttendance()` function tested with dry-run on 2 fake participants
- [ ] ZOE `getAtRiskParticipants()` function tested

### By Sep 1

- [ ] ZOE attendance recording enabled for ZABAL S2 Monday sessions
- [ ] ZOE at-risk check running weekly (every Thursday morning)
- [ ] `markZabalS2Attendees()` cross-reference job running daily

### By Nov 20

- [ ] `checkMicrograntEligibility()` function returns correct Tier 1/2/3 for test data
- [ ] Run eligibility report for all ZABAL S2 participants → report to Zaal

---

## ZOE Monday ZABAL S2 Status Block (From EOD Report)

ZOE generates this block every Monday 2PM using the Supabase tables:

```typescript
async function getZabalS2StatusBlock(): Promise<string> {
  const participants = await getActiveParticipants()
  const atRiskIds = await getAtRiskParticipants()
  
  // Count active sessions held so far
  const { count: totalSessions } = await supabase
    .from('zabal_s2_attendance')
    .select('session_number', { count: 'exact', head: true })
    .eq('attended', true)
  
  // Count milestones hit
  const { count: totalMilestones } = await supabase
    .from('zabal_s2_milestones')
    .select('*', { count: 'exact', head: true })
  
  // Count ZAOstock confirmations
  const { count: zabalZaostock } = await supabase
    .from('zaostock_2026_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('is_zabal_s2', true)
  
  return `
ZABAL S2 Status — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

Active participants: ${participants.length}
Sessions this week: [fill from attendance log]
At-risk (3 consecutive misses): ${atRiskIds.length}
Milestones logged: ${totalMilestones ?? 0}
ZAOstock confirmations: ${zabalZaostock ?? 0}
`
}
```

---

## Related Docs

- 1567 — ZABAL S2 Participant Tracker Spec (schema design + ZOE access patterns)
- 1585 — ZAOstock Attendee Pre-Event Welcome Pack (zaostock_2026_attendees table + message sequences)
- 1588 — ZABAL S2 Curriculum (Monday session topics that ZOE records attendance for)
- 1555 — ZABAL S2 Micro-Grant Program Spec (eligibility queries this doc implements)
- 1499 — ZOE Daily Operations Report Spec (ZABAL S2 status block in Monday 2PM report)
- 1544 — ZOE Telegram Bot Ops Guide (sendTelegramMessage() pattern referenced above)
