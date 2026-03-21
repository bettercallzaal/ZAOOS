-- Security audit log table
-- Structured audit trail for admin actions (security audit finding #7)

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_fid INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON security_audit_log (actor_fid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON security_audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON security_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON security_audit_log (created_at DESC);

-- RLS: only service role can insert/read (server-side only)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role can access this table
