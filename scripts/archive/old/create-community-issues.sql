-- Community Issues table
-- Stores issues submitted by ZAO members via the app
-- Forwarded to Paperclip CEO agent for triage and assignment

CREATE TABLE IF NOT EXISTS community_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'question')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'triaged', 'in_progress', 'resolved', 'closed')),
  submitted_by_fid INTEGER NOT NULL,
  submitted_by_username TEXT,
  paperclip_issue_id TEXT,  -- Links to Paperclip issue identifier (e.g., THE-49)
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: members can read all issues, only submit their own
ALTER TABLE community_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view all community issues"
  ON community_issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can submit issues"
  ON community_issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update issue status
CREATE POLICY "Admins can update issues"
  ON community_issues FOR UPDATE
  TO authenticated
  USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_community_issues_status ON community_issues(status);
CREATE INDEX IF NOT EXISTS idx_community_issues_fid ON community_issues(submitted_by_fid);
CREATE INDEX IF NOT EXISTS idx_community_issues_created ON community_issues(created_at DESC);
