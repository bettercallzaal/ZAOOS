-- Cross-platform publishing migration for ZAO OS
-- Adds publishing preferences, platform credentials, and a publish log table.
-- Run via Supabase SQL Editor or psql.

-- 1. Publishing preferences + platform credentials on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS publishing_prefs JSONB
  DEFAULT '{"crossPostEnabled": false, "defaultPlatforms": ["farcaster"]}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_profile_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_posting_key_encrypted TEXT;

-- 2. Publish log table
CREATE TABLE IF NOT EXISTS publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL,
  fid INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('lens', 'bluesky', 'x', 'hive')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  platform_post_id TEXT,
  platform_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_publish_log_cast ON publish_log (cast_hash);
CREATE INDEX IF NOT EXISTS idx_publish_log_fid ON publish_log (fid);
CREATE INDEX IF NOT EXISTS idx_publish_log_failed ON publish_log (status) WHERE status = 'failed';

-- 4. Row-level security
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON publish_log FOR ALL USING (true) WITH CHECK (true);
