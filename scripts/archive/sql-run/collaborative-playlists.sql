-- Collaborative Playlists for ZAO OS
-- Run this migration against your Supabase database

-- 1. Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_url text,
  created_by_fid integer NOT NULL,
  is_collaborative boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Playlist tracks (stores full metadata so it works without songs table)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  song_url text NOT NULL,
  song_title text,
  song_artist text,
  song_artwork_url text,
  song_platform text,
  song_stream_url text,
  added_by_fid integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, song_url)
);

-- 3. Per-user votes on tracks
CREATE TABLE IF NOT EXISTS playlist_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_track_id uuid REFERENCES playlist_tracks(id) ON DELETE CASCADE,
  fid integer NOT NULL,
  vote smallint NOT NULL DEFAULT 1, -- 1 = upvote, -1 = downvote
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_track_id, fid)
);

-- 4. Playlist membership / roles
CREATE TABLE IF NOT EXISTS playlist_members (
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  fid integer NOT NULL,
  role text DEFAULT 'contributor', -- 'owner', 'contributor', 'viewer'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (playlist_id, fid)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_votes_track ON playlist_votes(playlist_track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_members_fid ON playlist_members(fid);
CREATE INDEX IF NOT EXISTS idx_playlists_collaborative ON playlists(is_collaborative, is_public);

-- RLS policies
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_members ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (API routes use supabaseAdmin)
CREATE POLICY "Service role full access" ON playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlist_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlist_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlist_members FOR ALL USING (true) WITH CHECK (true);
