# Respect Database Design — Airtable Replacement

## Goal
Replace the Airtable-based respect tracking with a proper Supabase database that becomes the source of truth. Combined with on-chain balances for now, eventually transitions to being THE truth table.

## No Decay
Respect does not decay. It's earned through participation and stays.

## Data Model

### Table: `respect_members`
Source of truth for each member's respect totals.

```sql
CREATE TABLE respect_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wallet_address TEXT,
  fid BIGINT,

  -- Respect totals (computed from ledger, cached here)
  total_respect DECIMAL DEFAULT 0,
  fractal_respect DECIMAL DEFAULT 0,
  event_respect DECIMAL DEFAULT 0,
  hosting_respect DECIMAL DEFAULT 0,
  bonus_respect DECIMAL DEFAULT 0,

  -- On-chain (synced from Optimism)
  onchain_og DECIMAL DEFAULT 0,
  onchain_zor DECIMAL DEFAULT 0,

  -- Metadata
  first_respect_at TIMESTAMPTZ,        -- date they first earned respect
  fractal_count INTEGER DEFAULT 0,     -- how many fractals attended
  hosting_count INTEGER DEFAULT 0,     -- how many fractals hosted

  -- Tier (computed from total_respect)
  tier TEXT DEFAULT 'newcomer',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `fractal_sessions`
Each fractal call is a session with participants and scores.

```sql
CREATE TABLE fractal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  name TEXT,                           -- e.g., "ZAO Fractal #42"
  host_name TEXT,                      -- who hosted
  host_wallet TEXT,
  participant_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `fractal_scores`
Individual scores per member per fractal session.

```sql
CREATE TABLE fractal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fractal_sessions(id),
  member_name TEXT NOT NULL,
  wallet_address TEXT,
  score DECIMAL NOT NULL,              -- fractal ranking score (5, 10, 21, 34, 55, 110, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `respect_events`
Non-fractal respect events (contributions, festivals, bonuses).

```sql
CREATE TABLE respect_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  wallet_address TEXT,
  event_type TEXT NOT NULL,            -- 'contribution', 'festival', 'bonus', 'hosting', 'other'
  amount DECIMAL NOT NULL,
  description TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tier System
Computed from `total_respect`:
- **Legend**: 10,000+
- **Elder**: 2,000+
- **Curator**: 500+
- **Member**: 100+
- **Newcomer**: 0+

## API Endpoints
- `GET /api/respect/leaderboard` — ranked list with tiers (already exists, update to use new tables)
- `GET /api/respect/balance?fid=X` — individual member balance + tier + history
- `POST /api/respect/fractal` — admin: record a new fractal session with scores
- `POST /api/respect/event` — admin: record a non-fractal respect event
- `POST /api/respect/sync` — admin: sync on-chain balances

## Data Import
One-time migration from the Airtable data (130 members, 100+ sessions). Script to seed the database.
