-- Track of the Day — daily community-nominated track highlight
-- Members nominate one track per day, vote on nominations, top pick wins

CREATE TABLE IF NOT EXISTS track_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_url TEXT NOT NULL,
  track_title TEXT,
  track_artist TEXT,
  track_type TEXT,  -- spotify, soundcloud, audius, etc.
  artwork_url TEXT,
  nominated_by_fid INTEGER NOT NULL,
  nominated_by_username TEXT,
  votes_count INTEGER DEFAULT 0,
  selected_date DATE UNIQUE,  -- the day it was Track of the Day (null if not yet selected)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS track_of_day_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES track_of_the_day(id) ON DELETE CASCADE,
  voter_fid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, voter_fid)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_totd_selected_date ON track_of_the_day(selected_date DESC);
CREATE INDEX IF NOT EXISTS idx_totd_created_at ON track_of_the_day(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_totd_nominated_by ON track_of_the_day(nominated_by_fid);
CREATE INDEX IF NOT EXISTS idx_totd_votes_count ON track_of_the_day(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_totd_votes_track ON track_of_day_votes(track_id);
CREATE INDEX IF NOT EXISTS idx_totd_votes_voter ON track_of_day_votes(voter_fid);

-- RLS
ALTER TABLE track_of_the_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_of_day_votes ENABLE ROW LEVEL SECURITY;

-- Policies: service role has full access; anon/authenticated can read
CREATE POLICY "Allow read access to track_of_the_day"
  ON track_of_the_day FOR SELECT
  USING (true);

CREATE POLICY "Allow read access to track_of_day_votes"
  ON track_of_day_votes FOR SELECT
  USING (true);
