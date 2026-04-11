-- NameStone ENS Subnames for ZAO Members
-- Run in Supabase SQL Editor

-- 1. Add zao_subname column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS zao_subname TEXT;

-- Index for fast lookup by subname
CREATE INDEX IF NOT EXISTS idx_users_zao_subname ON users (zao_subname) WHERE zao_subname IS NOT NULL;

-- 2. Create subname_requests table for member name change requests
CREATE TABLE IF NOT EXISTS subname_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  current_name TEXT,
  requested_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by INTEGER
);

-- Index for pending requests
CREATE INDEX IF NOT EXISTS idx_subname_requests_status ON subname_requests (status) WHERE status = 'pending';

-- RLS: members can read their own requests, admins can read all
ALTER TABLE subname_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subname requests"
  ON subname_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert subname requests"
  ON subname_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage all subname requests"
  ON subname_requests FOR ALL
  USING (true)
  WITH CHECK (true);
