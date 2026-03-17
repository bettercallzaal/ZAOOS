# Respect Database Design — Airtable Replacement

## Goal
Replace the Airtable with Supabase tables that store all respect data. Combined with on-chain reads for now. Eventually becomes the source of truth.

## No computed fields, no tiers, no decay. Just the data.

---

## Tables

### `respect_members`
One row per member. Stores their identity and aggregated totals.

```sql
CREATE TABLE IF NOT EXISTS respect_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wallet_address TEXT,
  fid BIGINT,

  -- Totals (sum from fractal_scores + respect_events)
  total_respect DECIMAL DEFAULT 0,
  fractal_respect DECIMAL DEFAULT 0,
  event_respect DECIMAL DEFAULT 0,
  hosting_respect DECIMAL DEFAULT 0,
  bonus_respect DECIMAL DEFAULT 0,

  -- On-chain balances (synced from Optimism)
  onchain_og DECIMAL DEFAULT 0,       -- ERC-20 OG Respect (0x34cE...6957)
  onchain_zor DECIMAL DEFAULT 0,      -- ERC-1155 ZOR (0x9885...445c)

  -- Dates
  first_respect_at DATE,              -- when they first earned any respect

  -- Counts
  fractal_count INTEGER DEFAULT 0,    -- how many fractals attended
  hosting_count INTEGER DEFAULT 0,    -- how many fractals hosted

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respect_members_wallet ON respect_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_respect_members_fid ON respect_members(fid) WHERE fid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_respect_members_total ON respect_members(total_respect DESC);
ALTER TABLE respect_members ENABLE ROW LEVEL SECURITY;
```

### `fractal_sessions`
One row per fractal call.

```sql
CREATE TABLE IF NOT EXISTS fractal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  name TEXT,                           -- "ZAO Fractal #42"
  host_name TEXT,
  host_wallet TEXT,
  scoring_era TEXT DEFAULT '2x',       -- '1x' (5,8,13,21,34,55) or '2x' (10,16,26,42,68,110)
  participant_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fractal_sessions_date ON fractal_sessions(session_date DESC);
ALTER TABLE fractal_sessions ENABLE ROW LEVEL SECURITY;
```

### `fractal_scores`
One row per member per fractal session. The raw score they earned.

```sql
CREATE TABLE IF NOT EXISTS fractal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fractal_sessions(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  wallet_address TEXT,
  rank INTEGER,                        -- 1-6 (1 = top)
  score DECIMAL NOT NULL,              -- the raw number (10, 16, 26, 42, 68, or 110)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fractal_scores_session ON fractal_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_fractal_scores_wallet ON fractal_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_fractal_scores_member ON fractal_scores(member_name);
ALTER TABLE fractal_scores ENABLE ROW LEVEL SECURITY;
```

### `respect_events`
Non-fractal respect: introductions, camera-on, articles, hosting, festivals, bonuses.

```sql
CREATE TABLE IF NOT EXISTS respect_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  wallet_address TEXT,
  event_type TEXT NOT NULL,            -- 'introduction', 'camera', 'article', 'hosting', 'festival', 'bonus', 'listing', 'other'
  amount DECIMAL NOT NULL,
  description TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respect_events_wallet ON respect_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_respect_events_type ON respect_events(event_type);
CREATE INDEX IF NOT EXISTS idx_respect_events_member ON respect_events(member_name);
ALTER TABLE respect_events ENABLE ROW LEVEL SECURITY;
```

## Data Sources

| Column in Airtable | Maps to |
|---|---|
| Name | `respect_members.name` |
| Wallet | `respect_members.wallet_address` |
| Total Respect | `respect_members.total_respect` |
| On-chain Balance | `respect_members.onchain_og` (synced from 0x34cE...6957) |
| Fractal Respect (S. column) | `respect_members.fractal_respect` (sum of fractal_scores) |
| Events/Contributions column | `respect_members.event_respect` (sum of events with type contribution/camera/article) |
| Hosting column | `respect_members.hosting_respect` (sum of events with type hosting) |
| Bonus/Festival column | `respect_members.bonus_respect` (sum of events with type bonus/festival) |
| Per-session columns | Individual rows in `fractal_scores` |

## Scoring Eras

| Era | Rank 1 | Rank 2 | Rank 3 | Rank 4 | Rank 5 | Rank 6 |
|-----|--------|--------|--------|--------|--------|--------|
| 1x (early) | 55 | 34 | 21 | 13 | 8 | 5 |
| 2x (current) | 110 | 68 | 42 | 26 | 16 | 10 |

## On-Chain Sync

Read-only. Pulls balances from Optimism and stores in `respect_members`:
- OG Respect: ERC-20 at `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` — `balanceOf(wallet)`
- ZOR: ERC-1155 at `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` — `balanceOf(wallet, 0)`

## API Endpoints

- `GET /api/respect/leaderboard` — all members sorted by total_respect
- `GET /api/respect/member?wallet=X` — single member with their fractal history
- `POST /api/respect/fractal` — admin: record a fractal session with scores
- `POST /api/respect/event` — admin: record a non-fractal respect event
- `POST /api/respect/sync` — admin: sync on-chain balances to respect_members
