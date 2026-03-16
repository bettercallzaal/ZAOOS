-- In-app notifications table
-- Stores notifications for the notification feed (bell icon)
-- Separate from push notification tokens (notification_tokens table)

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_fid INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'proposal', 'vote', 'comment', 'member', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/chat',
  actor_fid INTEGER,
  actor_display_name TEXT,
  actor_pfp_url TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_fid, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

-- Auto-cleanup: delete notifications older than 30 days
-- Run via Supabase cron or pg_cron:
-- SELECT cron.schedule('cleanup-notifications', '0 3 * * *', $$DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'$$);
