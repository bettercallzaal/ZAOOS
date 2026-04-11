-- Add collaborative playlist support
-- Run: psql $DATABASE_URL -f scripts/add-collaborative-playlists.sql

ALTER TABLE playlists ADD COLUMN IF NOT EXISTS collaborative BOOLEAN DEFAULT false;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS max_contributors INTEGER DEFAULT 32;
