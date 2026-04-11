-- Song submissions table for community music curation
CREATE TABLE IF NOT EXISTS song_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  note TEXT,
  track_type TEXT NOT NULL,  -- spotify, soundcloud, youtube, audius, soundxyz, audio
  channel TEXT NOT NULL DEFAULT 'zao',
  submitted_by_fid BIGINT NOT NULL,
  submitted_by_username TEXT NOT NULL,
  submitted_by_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_song_submissions_channel ON song_submissions(channel, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_song_submissions_url_channel ON song_submissions(url, channel);

-- Enable RLS
ALTER TABLE song_submissions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by our API)
CREATE POLICY "Service role full access" ON song_submissions
  FOR ALL USING (true) WITH CHECK (true);
