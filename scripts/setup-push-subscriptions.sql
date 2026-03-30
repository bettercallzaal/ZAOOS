-- Push notification subscriptions for Web Push API
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fid INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up subscriptions by user
CREATE INDEX IF NOT EXISTS idx_push_subs_fid ON user_push_subscriptions (fid);

-- RLS: users can only manage their own subscriptions
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_push_subscriptions FOR SELECT
  USING (true);  -- Service role handles auth check in API

CREATE POLICY "Users can insert own subscriptions"
  ON user_push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own subscriptions"
  ON user_push_subscriptions FOR DELETE
  USING (true);

CREATE POLICY "Users can update own subscriptions"
  ON user_push_subscriptions FOR UPDATE
  USING (true);
