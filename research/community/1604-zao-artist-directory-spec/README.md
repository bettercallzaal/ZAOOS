# 1604 — ZAO Artist Directory: Spec & Maintenance Protocol

**Type:** SYSTEM-SPEC  
**Topic:** Community  
**Status:** ACTIVE — Hurricane builds the Supabase table; ZOE reads it for booking, press kits, and ZABAL recruitment. Zaal reviews the directory monthly. This is the canonical source of record for every artist who has ever participated in a ZAO event (WaveWarZ battle, COC Concertz, ZABAL cohort).

---

## Purpose

ZAO needs a single artist directory because the same person appears across multiple systems:
- **WaveWarZ** — Audius handle (used for battles, SOL payouts)
- **X** — different handle (used for promotion, ZOR holder lookup)
- **COC Concertz** — may use stage name ≠ Audius handle
- **ZABAL** — may use legal name

Without a canonical directory, ZOE sends booking DMs to the wrong handle, press kits list wrong artist names, and governance snapshots miss ZOR-holding artists.

**North Star alignment:** The artist directory is a core piece of ZAO IP — documented, citable, and growing. A published count of "N artists have earned SOL on-chain through ZAO" is a GEO + press hook.

---

## Supabase Table: `zao_artists`

**Build by:** Aug 22, 2026  
**Doc ref (patterns):** 1601 (ZOE Supabase Integration Patterns)

### Schema (SQL)

```sql
create table zao_artists (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  display_name text not null,                        -- stage name, how they appear in promotions
  legal_name text,                                   -- optional, for contracts/grants
  audius_handle text unique,                         -- WaveWarZ battles run on Audius
  x_handle text,                                     -- X/Twitter handle (no @ prefix)
  farcaster_handle text,
  telegram_handle text,
  email text,

  -- ZAO participation
  first_battle_date date,
  total_battles integer default 0,
  total_sol_earned numeric(10, 4) default 0,         -- sum of all WaveWarZ payouts (winner + loser-earns)
  wins integer default 0,
  losses integer default 0,

  -- Status flags
  is_zor_holder boolean default false,
  is_zabal_participant boolean default false,
  is_coc_performer boolean default false,
  zabal_cohort text,                                 -- 'S1', 'S2', etc.
  booking_status text check (booking_status in (
    'never_booked', 'outreach_sent', 'confirmed', 'performed', 'declined'
  )) default 'never_booked',

  -- Meta
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for lookups by handle
create index zao_artists_audius_handle_idx on zao_artists (audius_handle);
create index zao_artists_x_handle_idx on zao_artists (x_handle);
```

---

## Handle Mapping Note

Per the AUDIUS_MAP pattern established in prior ZAOOS docs: an artist's Audius handle is their WaveWarZ identity, but their X handle for promotion is often different. Both must be stored. ZOE's social posts use `x_handle`; WaveWarZ API calls use `audius_handle`.

---

## ZOE Read Patterns

### Get All Active Artists for Press Kit

```typescript
async function getArtistsForPressKit() {
  const { data, error } = await supabase
    .from('zao_artists')
    .select('display_name, x_handle, total_battles, total_sol_earned, is_zor_holder')
    .gt('total_battles', 0)
    .order('total_sol_earned', { ascending: false })

  if (error) throw error
  return data
}
```

### Get ZOR-Holding Artists (for Governance Posts)

```typescript
async function getZorHolderArtists() {
  const { data, error } = await supabase
    .from('zao_artists')
    .select('display_name, x_handle, audius_handle, total_battles, total_sol_earned')
    .eq('is_zor_holder', true)
    .order('total_sol_earned', { ascending: false })

  if (error) throw error
  return data
}
```

### Get Booking Pipeline (for ZAOstock / COC Recruitment)

```typescript
async function getBookingPipeline(minimumSol: number = 5) {
  const { data, error } = await supabase
    .from('zao_artists')
    .select('display_name, x_handle, audius_handle, total_sol_earned, wins, losses, booking_status, is_zor_holder')
    .gte('total_sol_earned', minimumSol)
    .in('booking_status', ['never_booked', 'outreach_sent'])
    .order('total_sol_earned', { ascending: false })

  if (error) throw error
  return data
}
```

### Get ZABAL S2 Recruitment Candidates

Criteria: ≥2 battles, not yet a ZABAL participant, not declined.

```typescript
async function getZabalS2Candidates() {
  const { data, error } = await supabase
    .from('zao_artists')
    .select('display_name, x_handle, telegram_handle, total_battles, total_sol_earned')
    .gte('total_battles', 2)
    .eq('is_zabal_participant', false)
    .neq('booking_status', 'declined')
    .order('total_battles', { ascending: false })

  if (error) throw error
  return data
}
```

---

## ZOE Write Patterns

### Sync Battle Stats from WaveWarZ API

Run weekly (Sunday midnight) to keep `total_battles`, `total_sol_earned`, `wins`, `losses` current.

```typescript
async function syncArtistStatsFromApi(audius_handle: string) {
  // Fetch from wavewarz.info/api/public/artist/:handle
  const response = await fetch(`https://wavewarz.info/api/public/artist/${audius_handle}`)
  const stats = await response.json()

  const { error } = await supabase
    .from('zao_artists')
    .update({
      total_battles: stats.totalBattles,
      total_sol_earned: stats.totalSolEarned,
      wins: stats.wins,
      losses: stats.losses,
      updated_at: new Date().toISOString()
    })
    .eq('audius_handle', audius_handle)

  if (error) throw error
}
```

### Update Booking Status

```typescript
async function updateBookingStatus(
  audius_handle: string,
  status: 'never_booked' | 'outreach_sent' | 'confirmed' | 'performed' | 'declined'
) {
  const { error } = await supabase
    .from('zao_artists')
    .update({ booking_status: status, updated_at: new Date().toISOString() })
    .eq('audius_handle', audius_handle)

  if (error) throw error
}
```

### Flag ZOR Holder Status

```typescript
async function markZorHolder(audius_handle: string, isHolder: boolean) {
  const { error } = await supabase
    .from('zao_artists')
    .update({ is_zor_holder: isHolder, updated_at: new Date().toISOString() })
    .eq('audius_handle', audius_handle)

  if (error) throw error
}
```

---

## ZOE Automated Reports

### Weekly Artist Summary (Sunday EOD)

```
ZAO Artist Directory — [date]

Total artists in directory: [N]
Artists with ≥1 battle: [N]
ZOR holder artists: [N]
ZABAL participants: [N]

Top 5 by SOL earned:
1. [display_name] — [X] SOL ([N] battles)
2. [display_name] — [X] SOL ([N] battles)
3. [display_name] — [X] SOL ([N] battles)
4. [display_name] — [X] SOL ([N] battles)
5. [display_name] — [X] SOL ([N] battles)

Booking pipeline (≥5 SOL, not yet booked): [N] artists
```

ZOE posts this to the ZAO ops Telegram channel (not the public channel).

### Citable Press Block (ZOE fills from directory)

```
As of [date], ZAO's WaveWarZ platform has paid out [total SOL] SOL 
to [N] unique artists across [total battles] battles.
[N] artists have earned SOL on-chain — including the loser-earns pool — 
across [N] MAIN events and [N] quick battles.

Top earner: [display_name] — [X] SOL across [N] battles.
```

ZOE keeps this block updated monthly; Zaal pastes it into press pitches and grants.

---

## ZAOstock Pipeline Integration

The ZAOstock artist booking pipeline (doc 1559) pulls directly from this directory. Priority criteria:
- `total_sol_earned` ≥ 30 SOL → Tier 1 headline candidate
- `total_sol_earned` 15-29 SOL → Tier 2 supporting candidate
- `total_sol_earned` 5-14 SOL → Tier 3 opener candidate

Current Tier 1 artists (as of Jul 2026, from doc 1559):
| Artist | SOL | Status |
|---|---|---|
| STILOWORLD | 41.6 | Priority — ZAOstock MAIN candidate |
| Geek Myth | 30.9 | Priority — ZAOstock MAIN candidate |
| Lui | 30.0 | ZAOstock consideration |
| Cannon Jones | 15.5 | Tier 2 supporting |

---

## Initial Population Protocol

Hurricane populates the initial directory from:

1. **WaveWarZ API** — `wavewarz.info/api/public/stats` → top artists endpoint for battle history
2. **Doc 1559** — ZAOstock pipeline tracker (4 Tier 1 artists + manual data)
3. **COC Concertz docs** — 1256 (COC series record), 1284/1458 (show briefs list performing artists)
4. **ZABAL S1 roster** — graduates from prior ZABAL cohort (doc 1543)
5. **ZOR holder list** — 157 holders as of Jul 2026 (cross-reference with Audius handles where possible)

**Handle disambiguation rule:** If an artist's Audius handle differs from their X handle, populate both columns. Reference the AUDIUS_MAP note at top of this doc and prior ZAOOS docs documenting specific mappings.

---

## Build Checklist

| Item | Owner | Deadline |
|---|---|---|
| Create `zao_artists` table in Supabase | Hurricane | Aug 22 |
| Populate initial rows from WaveWarZ API top artists | Hurricane | Aug 22 |
| Add ZABAL S1 participants (is_zabal_participant=true, zabal_cohort='S1') | Hurricane | Aug 22 |
| Add COC Concertz performers (is_coc_performer=true) | Hurricane | Aug 22 |
| Flag 157 ZOR holders where Audius handle is known | Hurricane | Aug 29 |
| ZOE weekly sync job running (Sunday midnight) | Hurricane | Sep 1 |
| ZOE Sunday EOD report posting to ops Telegram | Hurricane | Sep 1 |
| ZOE booking pipeline query wired to COC #9 outreach flow | Hurricane | Sep 15 |

---

## Related Docs

- 1601 — ZOE Supabase Integration Patterns (client setup + table patterns this doc follows)
- 1559 — COC Concertz Artist Management Guide (ZAOstock Tier 1/2/3 pipeline — feeds from this directory)
- 1543 — ZABAL S1 Mentor Roster (ZABAL S1 artist records for initial population)
- 1567 — ZABAL S2 Participant Tracker Spec (is_zabal_participant flag for S2 cohort)
- 1499 — ZOE Daily Operations Report Spec (Sunday EOD report context)
- 1388 — ZAO Platform Stats Reference (total SOL volume baseline for citable blocks)
