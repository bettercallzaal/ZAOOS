-- Music Library & Playlisting System
-- Run in Supabase SQL Editor after existing setup scripts.

-- ─── Songs table (single source of truth for all music) ─────────────

CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN (
    'spotify', 'soundcloud', 'youtube', 'audius', 'soundxyz',
    'applemusic', 'tidal', 'bandcamp', 'audio'
  )),
  title TEXT NOT NULL DEFAULT 'Untitled',
  artist TEXT,
  artwork_url TEXT,
  stream_url TEXT,
  duration INTEGER DEFAULT 0,
  submitted_by_fid INTEGER,
  source TEXT NOT NULL DEFAULT 'chat' CHECK (source IN (
    'chat', 'submission', 'radio', 'manual', 'totd'
  )),
  tags TEXT[] DEFAULT '{}',
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_platform ON songs (platform);
CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs (play_count DESC);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_submitted_by ON songs (submitted_by_fid);

-- Full-text search
ALTER TABLE songs ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(artist, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_songs_search ON songs USING GIN (search_vector);

-- RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
CREATE POLICY "Authenticated users can read songs" ON songs FOR SELECT USING (true);

-- ─── Playlists ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_fid INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN (
    'personal', 'community', 'totd_archive', 'auto'
  )),
  artwork_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_type ON playlists (type);
CREATE INDEX IF NOT EXISTS idx_playlists_created_by ON playlists (created_by_fid);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read public and community playlists" ON playlists;
CREATE POLICY "Users can read public and community playlists" ON playlists
  FOR SELECT USING (is_public = true OR type IN ('community', 'totd_archive', 'auto'));

-- ─── Playlist tracks (join table) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_by_fid INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (playlist_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks (playlist_id, position);

ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read playlist tracks" ON playlist_tracks;
CREATE POLICY "Users can read playlist tracks" ON playlist_tracks FOR SELECT USING (true);

-- ─── Seed: TOTD Archive playlist ────────────────────────────────────

INSERT INTO playlists (id, name, description, created_by_fid, type, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Track of the Day Archive',
  'Every Track of the Day winner',
  0, 'totd_archive', true
) ON CONFLICT (id) DO NOTHING;
