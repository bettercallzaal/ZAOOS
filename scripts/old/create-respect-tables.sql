-- ZAO OS Respect Tables
-- Stores all respect data: members, fractal sessions, scores, and events
-- Replaces Airtable as the source of truth for respect tracking
-- Run this in the Supabase SQL Editor

-- ============================================================
-- Table 1: respect_members
-- One row per member. Stores identity and aggregated totals.
-- ============================================================
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

-- Auto-update updated_at on respect_members
-- Reuses the update_updated_at() function from the users table if it exists,
-- otherwise creates it.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER respect_members_updated_at
  BEFORE UPDATE ON respect_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Table 2: fractal_sessions
-- One row per fractal call.
-- ============================================================
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

-- ============================================================
-- Table 3: fractal_scores
-- One row per member per fractal session. The raw score they earned.
-- ============================================================
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

-- ============================================================
-- Table 4: respect_events
-- Non-fractal respect: introductions, camera-on, articles, hosting, festivals, bonuses.
-- ============================================================
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
