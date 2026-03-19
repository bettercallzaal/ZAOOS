-- Bluesky Feed Generator + Labeler tables
-- Run this in Supabase SQL editor

-- Members tracked for the ZAO Music feed
CREATE TABLE IF NOT EXISTS bluesky_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  added_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts indexed for the feed
CREATE TABLE IF NOT EXISTS bluesky_feed_posts (
  uri TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text_preview TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bluesky_feed_posts_indexed ON bluesky_feed_posts(indexed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bluesky_feed_posts_did ON bluesky_feed_posts(did);
CREATE INDEX IF NOT EXISTS idx_bluesky_members_handle ON bluesky_members(handle);

-- RLS
ALTER TABLE bluesky_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bluesky_feed_posts ENABLE ROW LEVEL SECURITY;

-- Clean up old posts (keep 30 days)
-- Run as a pg_cron job: SELECT cron.schedule('cleanup-bluesky-feed', '0 3 * * *', $$DELETE FROM bluesky_feed_posts WHERE indexed_at < NOW() - INTERVAL '30 days'$$);
