-- Library Research Portal tables
-- Run in Supabase SQL editor

-- 1. Community submissions
CREATE TABLE IF NOT EXISTS research_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid int NOT NULL,
  url text,
  topic text NOT NULL,
  note text,
  tags text[] DEFAULT '{}',
  og_title text,
  og_description text,
  og_image text,
  ai_summary text,
  ai_status text NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'complete', 'failed')),
  upvote_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Upvotes (one per member per entry)
CREATE TABLE IF NOT EXISTS research_entry_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES research_entries(id) ON DELETE CASCADE,
  fid int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, fid)
);

-- 3. Comments
CREATE TABLE IF NOT EXISTS research_entry_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES research_entries(id) ON DELETE CASCADE,
  fid int NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Deep research index
CREATE TABLE IF NOT EXISTS research_docs (
  id int PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  path text NOT NULL,
  github_url text NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_entries_created_at ON research_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_entries_upvote_count ON research_entries(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_entry_votes_entry_id ON research_entry_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_research_entry_comments_entry_id ON research_entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_research_docs_category ON research_docs(category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_research_entries_updated_at'
  ) THEN
    CREATE TRIGGER update_research_entries_updated_at
      BEFORE UPDATE ON research_entries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- RLS
ALTER TABLE research_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_entry_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_entry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_docs ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user (service role bypasses RLS)
CREATE POLICY "read_research_entries" ON research_entries FOR SELECT USING (true);
CREATE POLICY "read_research_entry_votes" ON research_entry_votes FOR SELECT USING (true);
CREATE POLICY "read_research_entry_comments" ON research_entry_comments FOR SELECT USING (true);
CREATE POLICY "read_research_docs" ON research_docs FOR SELECT USING (true);
