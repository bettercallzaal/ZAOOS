-- Song comments: timestamped comments on tracks (SoundCloud-style waveform comments)
-- Run with: psql $DATABASE_URL -f scripts/add-song-comments.sql

CREATE TABLE IF NOT EXISTS song_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_fid INTEGER NOT NULL,
  username TEXT NOT NULL,
  comment TEXT NOT NULL CHECK (char_length(comment) <= 280),
  timestamp_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_song_comments_song ON song_comments(song_id, timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_song_comments_user ON song_comments(user_fid);

ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read comments" ON song_comments;
CREATE POLICY "Users can read comments" ON song_comments FOR SELECT USING (true);
