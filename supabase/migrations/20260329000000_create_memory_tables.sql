-- Hindsight Memory System - Supabase Schema
-- These tables complement Hindsight (which stores its own data in its PostgreSQL instance)

-- Taste profiles synthesized from weekly reflect()
CREATE TABLE IF NOT EXISTS taste_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL REFERENCES members(fid) ON DELETE CASCADE,
  reflection_text TEXT NOT NULL,
  reflected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_fid, reflected_at)
);

-- Index for fast lookup of latest profile
CREATE INDEX IF NOT EXISTS idx_taste_profiles_user_fid ON taste_profiles(user_fid);
CREATE INDEX IF NOT EXISTS idx_taste_profiles_reflected_at ON taste_profiles(reflected_at DESC);

-- Memory event log (mirror of Hindsight, for Supabase querying/analytics)
-- Hindsight is the source of truth; this is optional denormalization
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL REFERENCES members(fid) ON DELETE CASCADE,
  event_type TEXT NOT NULL,           -- cast | track_share | respect | room_participation | profile_update
  event_data JSONB NOT NULL,          -- full typed event payload
  hindsight_synced_at TIMESTAMPTZ,     -- null = pending sync
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_events_user_fid ON memory_events(user_fid);
CREATE INDEX IF NOT EXISTS idx_memory_events_type ON memory_events(event_type);
CREATE INDEX IF NOT EXISTS idx_memory_events_created ON memory_events(created_at DESC);

-- Row Level Security
ALTER TABLE taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own taste profile
CREATE POLICY IF NOT EXISTS taste_profiles_select_own
  ON taste_profiles FOR SELECT
  USING ((auth.jwt() ->> 'fid')::BIGINT = user_fid);

-- Only service role can insert taste profiles (cron job)
CREATE POLICY IF NOT EXISTS taste_profiles_insert_service
  ON taste_profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users can only read their own memory events
CREATE POLICY IF NOT EXISTS memory_events_select_own
  ON memory_events FOR SELECT
  USING ((auth.jwt() ->> 'fid')::BIGINT = user_fid);

-- Service role can insert memory events
CREATE POLICY IF NOT EXISTS memory_events_insert_service
  ON memory_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
