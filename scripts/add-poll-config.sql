-- Poll configuration table for admin-managed weekly poll choices
-- Run: psql $DATABASE_URL -f scripts/add-poll-config.sql

CREATE TABLE IF NOT EXISTS poll_config (
  id TEXT PRIMARY KEY DEFAULT 'weekly-priority',
  choices JSONB NOT NULL DEFAULT '[]',
  poll_title_template TEXT NOT NULL DEFAULT 'ZAO Weekly Priority Vote — Week of {date}',
  poll_body_template TEXT,
  voting_duration_days INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_fid INTEGER
);

ALTER TABLE poll_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read poll config" ON poll_config;
CREATE POLICY "Anyone can read poll config" ON poll_config FOR SELECT USING (true);
