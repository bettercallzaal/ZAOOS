# 1625 — ZAO Supabase Schema Reference (Jul 2026)

**Type:** SYSTEM-REFERENCE  
**Topic:** Infrastructure  
**Status:** ACTIVE — Canonical reference for ZAO's Supabase database schema as of Jul 2026. Hurricane builds tables per this spec; ZOE reads/writes to them. Tables prefixed `zao_` are owned by ZAO OS; tables prefixed `ww_` are WaveWarZ-specific; tables prefixed `zabal_` are ZABAL cohort-specific. Update this doc before making schema changes.

---

## Database Overview

**Supabase project:** ZAO OS (main project)  
**Auth:** Supabase service key for server-side operations (ZOE, Hurricane). Row-level security (RLS) enabled on user-facing tables.

---

## Table 1: `zao_artists`

**Purpose:** Canonical registry of every artist who has participated in any ZAO event (WaveWarZ battles, COC Concertz shows, ZABAL cohorts).  
**Build:** Hurricane builds Aug 22. Initial population from WW API.  
**Spec doc:** 1604 (ZAO Artist Directory Spec)

```sql
CREATE TABLE zao_artists (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name     text NOT NULL,
  audius_handle    text UNIQUE,           -- Audius URL slug (NOT display name)
  x_handle         text,                 -- X/Twitter handle (without @)
  total_battles    integer DEFAULT 0,
  total_sol_earned numeric(18,9) DEFAULT 0,
  wins             integer DEFAULT 0,
  losses           integer DEFAULT 0,
  is_zor_holder    boolean DEFAULT false,
  is_zabal_participant boolean DEFAULT false,
  is_zabal_s2      boolean DEFAULT false,
  booking_status   text DEFAULT 'none',  -- 'none' | 'pipeline' | 'confirmed' | 'complete'
  zabal_cohort     text,                 -- 'S1' | 'S2' | null
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

**Key ZOE read patterns:**

```typescript
// For press kit: artists with ≥1 battle
const { data } = await supabase.from('zao_artists').select('*').gt('total_battles', 0).order('total_sol_earned', { ascending: false })

// For ZAOstock booking pipeline: earned ≥15 SOL
const { data } = await supabase.from('zao_artists').select('*').gte('total_sol_earned', 15).order('total_sol_earned', { ascending: false })

// For ZABAL S2 candidates: battles ≥10 + not already S2
const { data } = await supabase.from('zao_artists').select('*').gte('total_battles', 10).eq('is_zabal_s2', false)
```

**ZOR holder field:** Hurricane updates `is_zor_holder` weekly by checking the ZOR ERC-1155 contract (0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c) via Alchemy or Helius.

**Handle note:** `audius_handle` ≠ `x_handle` for many artists. Both are required separately. Do not assume they're the same.

---

## Table 2: `zaostock_2026_attendees`

**Purpose:** Tracks everyone who RSVPs to ZAOstock Oct 3 via Eventbrite. Used for ZOE pre-event welcome sequence and post-event follow-up.  
**Spec doc:** 1585 (Attendee Pre-Event Welcome Pack)

```sql
CREATE TABLE zaostock_2026_attendees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eventbrite_id    text UNIQUE NOT NULL,
  name             text,
  email            text,
  ticket_type      text,                 -- 'general' | 'vip' | 'artist' | 'volunteer'
  telegram_handle  text,
  is_zabal         boolean DEFAULT false, -- is a ZABAL participant
  is_zabal_s2      boolean DEFAULT false,
  is_zor_holder    boolean DEFAULT false,
  attended         boolean DEFAULT false,
  wave_balance_at_checkin numeric(18,9), -- SOL in Phantom at time of check-in (if captured)
  welcome_sent_at  timestamptz,          -- T-14 day welcome DM/email sent
  day_of_sent_at   timestamptz,          -- Oct 3 8AM reminder sent
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

**Eventbrite webhook:** Hurricane wires `POST /api/webhooks/eventbrite-attendee` → inserts row → ZOE welcome sequence fires. Build target: Aug 15.

---

## Table 3: `zabal_s2_participants`

**Purpose:** Confirmed ZABAL S2 cohort participants. Source of truth for session attendance, Respect distribution, and ZABAL marketplace graduation.  
**Spec doc:** 1611 (ZABAL S2 Intake and Selection Spec)

```sql
CREATE TABLE zabal_s2_participants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name     text NOT NULL,
  x_handle         text,
  telegram_handle  text,
  email            text,
  track            text NOT NULL,         -- 'artist' | 'builder'
  africa_based     boolean DEFAULT false,
  is_zor_holder    boolean DEFAULT false,
  total_battles    integer DEFAULT 0,     -- WW battles at time of application
  sessions_attended integer DEFAULT 0,   -- updated weekly by ZOE
  sessions_total   integer DEFAULT 12,   -- S2 = 12 sessions
  completion_pct   numeric(5,2) GENERATED ALWAYS AS (CAST(sessions_attended AS numeric) / sessions_total * 100) STORED,
  respect_earned   numeric(18,9) DEFAULT 0,
  status           text DEFAULT 'active', -- 'active' | 'graduated' | 'dropped'
  artist_id        uuid REFERENCES zao_artists(id),
  accepted_at      timestamptz,
  graduated_at     timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

**ZOE weekly update:** After each session, ZOE increments `sessions_attended` for participants who attended. On graduation (Nov 21), ZOE sets `status = 'graduated'` and `graduated_at = now()`.

---

## Table 4: `ww_battles_cache`

**Purpose:** Local cache of WaveWarZ battle data from the public API. ZOE reads this before hitting the live API; Hurricane refreshes it on a schedule.

```sql
CREATE TABLE ww_battles_cache (
  battle_id        text PRIMARY KEY,      -- WaveWarZ internal battle ID
  battle_type      text,                  -- 'quick' | 'main' | 'charity'
  artist_a_handle  text,                  -- Audius handle
  artist_b_handle  text,
  winner_handle    text,
  loser_handle     text,
  artist_a_payout  numeric(18,9),
  artist_b_payout  numeric(18,9),
  total_volume_sol numeric(18,9),
  settled_at       timestamptz,
  tx_hash          text,                  -- Solana tx hash for settlement
  is_charity       boolean DEFAULT false,
  charity_name     text,
  charity_payout   numeric(18,9),
  created_at       timestamptz DEFAULT now()
);
```

**ZOE read pattern:** When posting a battle result, ZOE pulls from `ww_battles_cache` first. If the battle isn't cached (very recent), ZOE calls the live API directly.

**Hurricane refresh:** `ww_battles_cache` is refreshed from the WW API every hour via a Hurricane cron.

---

## Table 5: `zoe_alert_log`

**Purpose:** Tracks which ZOE alerts have been sent, preventing duplicate sends for cron-triggered alerts.

```sql
CREATE TABLE zoe_alert_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key        text UNIQUE NOT NULL,  -- e.g. 'fa-apply-jul22' | 'fisher-aug15'
  description      text,
  sent_at          timestamptz DEFAULT now(),
  channel          text,                  -- 'telegram' | 'x' | 'farcaster' | 'email'
  recipient        text                   -- 'zaal' | 'community' | etc.
);
```

**ZOE pattern:** Before sending any cron-triggered alert, ZOE checks `zoe_alert_log` for the `alert_key`. If it exists, skip. If not, send and insert.

---

## Table 6: `assistant_queries`

**Purpose:** Audit log for ZAO AI assistant queries (doc 1600 spec — "chat with ZAO" widget on zaoos.com).

```sql
CREATE TABLE assistant_queries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash       text UNIQUE,           -- SHA-256 of query for dedup
  query_text       text NOT NULL,
  response_text    text,
  context_source   text,                  -- 'bonfire' | 'static' | 'api'
  tokens_used      integer,
  created_at       timestamptz DEFAULT now()
);
```

---

## ZOE Supabase Access Patterns

All ZOE Supabase calls use the service key (bypasses RLS) and follow this pattern:

```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// Standard upsert pattern
const { error } = await supabase
  .from('zao_artists')
  .upsert({ audius_handle: handle, ...fields }, { onConflict: 'audius_handle' })

if (error) {
  // ZOE logs to Telegram: "Supabase error: [table] [error.message]"
  await notifyZaal(`Supabase error in zao_artists: ${error.message}`)
}
```

---

## Hurricane Migration Protocol

When Hurricane adds or modifies a table:
1. Write a `migrations/YYYYMMDD-description.sql` file in the relevant repo
2. PR to main with `[migration]` in title
3. Zaal approves → Hurricane runs `supabase db push` or applies via Supabase dashboard
4. Hurricane notifies via Telegram: "Migration applied: [description]. Tables affected: [list]."

**Never drop columns in production without a migration plan** — ZOE or Hurricane may be reading that column.

---

## Related Docs

- 1604 — ZAO Artist Directory Spec (`zao_artists` detailed spec + ZOE usage patterns)
- 1585 — ZAOstock Attendee Pre-Event Welcome Pack (`zaostock_2026_attendees` trigger flows)
- 1611 — ZABAL S2 Intake and Selection Spec (`zabal_s2_participants` write patterns)
- 1601 — ZAO OS Supabase Patterns (prior patterns doc — this doc extends it for Jul 2026 tables)
- 1615 — ZOE Architecture and Handoff Spec (full env var list + ZOE Supabase access)
- 1624 — ZAO Agent Fleet Reference (which agent reads/writes which table)
