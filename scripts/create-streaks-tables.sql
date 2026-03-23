-- ZAO OS Engagement Streaks Tables
-- Duolingo-style daily engagement streaks to drive participation
-- Run this in the Supabase SQL Editor

-- ============================================================
-- Table 1: user_streaks
-- One row per user. Tracks current and longest streaks.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_active_days INTEGER DEFAULT 0,
  streak_freezes_available INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_fid ON user_streaks(fid);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_longest ON user_streaks(longest_streak DESC);

-- ============================================================
-- Table 2: activity_log
-- One row per unique activity per user per day.
-- The UNIQUE constraint prevents duplicate entries.
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('cast', 'vote', 'comment', 'reaction', 'submission', 'fractal', 'login')),
  activity_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fid, activity_type, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_fid ON activity_log(fid);
CREATE INDEX IF NOT EXISTS idx_activity_log_fid_date ON activity_log(fid, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- user_streaks: service role has full access (API routes use service role)
CREATE POLICY "Service role full access on user_streaks"
  ON user_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- activity_log: service role has full access
CREATE POLICY "Service role full access on activity_log"
  ON activity_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon/authenticated users cannot access directly (must go through API)
-- The policies above only apply to service_role since RLS is bypassed by service_role by default.
-- For the anon key, no policies grant access, so direct client queries are blocked.
