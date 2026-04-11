-- Song likes / favorites table
-- Run against your Supabase project: supabase db execute < scripts/add-song-likes.sql

CREATE TABLE IF NOT EXISTS user_song_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid INTEGER NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_fid, song_id)
);
CREATE INDEX IF NOT EXISTS idx_user_song_likes_user ON user_song_likes(user_fid);
CREATE INDEX IF NOT EXISTS idx_user_song_likes_song ON user_song_likes(song_id);

ALTER TABLE user_song_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read likes" ON user_song_likes;
CREATE POLICY "Users can read likes" ON user_song_likes FOR SELECT USING (true);
