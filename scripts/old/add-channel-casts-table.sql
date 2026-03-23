-- ZAO OS: Channel casts cache table
-- Run in Supabase SQL Editor AFTER setup-database.sql
--
-- Purpose: Neynar webhooks push new casts here so clients read from our DB
-- instead of polling Neynar. Eliminates /v2/farcaster/feed/channels credits.

CREATE TABLE IF NOT EXISTS channel_casts (
  hash             TEXT PRIMARY KEY,
  channel_id       TEXT NOT NULL,
  fid              BIGINT NOT NULL,
  author_username  TEXT NOT NULL DEFAULT '',
  author_display   TEXT NOT NULL DEFAULT '',
  author_pfp       TEXT NOT NULL DEFAULT '',
  text             TEXT NOT NULL DEFAULT '',
  timestamp        TIMESTAMPTZ NOT NULL,
  embeds           JSONB NOT NULL DEFAULT '[]',
  reactions        JSONB NOT NULL DEFAULT '{"likes_count":0,"recasts_count":0,"likes":[],"recasts":[]}',
  replies_count    INTEGER NOT NULL DEFAULT 0,
  parent_hash      TEXT,
  inserted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Fast reads for the chat feed
CREATE INDEX IF NOT EXISTS idx_channel_casts_channel_ts
  ON channel_casts (channel_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_channel_casts_parent
  ON channel_casts (parent_hash) WHERE parent_hash IS NOT NULL;

-- RLS: service_role only (all access is via server-side routes)
ALTER TABLE channel_casts ENABLE ROW LEVEL SECURITY;
