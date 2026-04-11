-- Moderation log table for AI-powered content moderation
-- Tracks Perspective API results and admin review decisions.

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL,
  fid INTEGER NOT NULL,
  text_preview TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  categories TEXT[] DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  action TEXT DEFAULT 'allow' CHECK (action IN ('allow', 'flag', 'hide', 'override')),
  reviewed_by_fid INTEGER,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON moderation_log (action);
CREATE INDEX IF NOT EXISTS idx_moderation_log_flagged ON moderation_log (flagged) WHERE flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_moderation_log_cast_hash ON moderation_log (cast_hash);
CREATE INDEX IF NOT EXISTS idx_moderation_log_pending_review
  ON moderation_log (created_at DESC)
  WHERE action = 'flag' AND reviewed_at IS NULL;

-- Row Level Security
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Only service role (server-side) can insert/update
CREATE POLICY moderation_log_service_insert ON moderation_log
  FOR INSERT TO service_role
  WITH CHECK (TRUE);

CREATE POLICY moderation_log_service_update ON moderation_log
  FOR UPDATE TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY moderation_log_service_select ON moderation_log
  FOR SELECT TO service_role
  USING (TRUE);

-- Anon/authenticated users cannot access moderation logs directly
-- (admin access goes through server-side API routes using service_role)
