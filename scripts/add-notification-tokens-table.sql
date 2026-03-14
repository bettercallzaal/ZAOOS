-- Notification tokens for Farcaster miniapp push notifications
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_enabled ON notification_tokens(enabled) WHERE enabled = TRUE;

ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
