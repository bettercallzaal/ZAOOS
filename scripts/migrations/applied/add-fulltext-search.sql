-- Full-text search migration for ZAO OS
-- Adds tsvector columns + GIN indexes for unified search across all content types.
-- Run via Supabase SQL Editor or psql.

-- 1. Add tsvector columns (generated, auto-maintained)
ALTER TABLE channel_casts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(text, ''))) STORED;

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

ALTER TABLE song_submissions ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(note, ''))) STORED;

ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(biography, '') || ' ' || coalesce(category, ''))) STORED;

-- 2. GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS idx_channel_casts_search ON channel_casts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_proposals_search ON proposals USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_song_submissions_search ON song_submissions USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_community_profiles_search ON community_profiles USING GIN (search_vector);
