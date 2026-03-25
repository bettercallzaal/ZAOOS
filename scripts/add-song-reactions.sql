-- Song emoji reactions table
-- Run against your Supabase project: supabase db execute < scripts/add-song-reactions.sql

CREATE TABLE IF NOT EXISTS song_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid INTEGER NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('\xF0\x9F\x94\xA5', '\xE2\x9D\xA4\xEF\xB8\x8F', '\xF0\x9F\x8E\xB5', '\xF0\x9F\x92\x8E', '\xF0\x9F\x91\x8F', '\xF0\x9F\xA4\xAF')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_fid, song_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_song_reactions_song ON song_reactions(song_id);
CREATE INDEX IF NOT EXISTS idx_song_reactions_user ON song_reactions(user_fid);

ALTER TABLE song_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read reactions" ON song_reactions;
CREATE POLICY "Users can read reactions" ON song_reactions FOR SELECT USING (true);
