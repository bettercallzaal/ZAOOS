-- Live fractal session tracking (real-time from bot webhook)
CREATE TABLE IF NOT EXISTS fractal_live_sessions (
  thread_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  facilitator_discord_id TEXT,
  participant_discord_ids TEXT[],
  current_level INTEGER DEFAULT 6,
  last_vote JSONB,
  last_winner JSONB,
  results JSONB,
  total_rounds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook event log for audit trail
CREATE TABLE IF NOT EXISTS fractal_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  thread_id TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent events
CREATE INDEX IF NOT EXISTS idx_webhook_log_received ON fractal_webhook_log(received_at DESC);

-- Auto-cleanup old webhook logs after 30 days
SELECT cron.schedule('cleanup-webhook-logs', '0 3 * * *',
  $$DELETE FROM fractal_webhook_log WHERE received_at < NOW() - INTERVAL '30 days'$$);

-- Enable Realtime on live sessions for push updates to frontend
ALTER PUBLICATION supabase_realtime ADD TABLE fractal_live_sessions;
