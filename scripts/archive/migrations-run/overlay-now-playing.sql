-- overlay_now_playing: stores each user's current playing track for OBS overlays.
-- The public GET endpoint reads from this table (no auth required — fid acts as key).
-- The authenticated POST endpoint upserts rows here.

CREATE TABLE IF NOT EXISTS overlay_now_playing (
  fid          BIGINT PRIMARY KEY,
  track_name   TEXT NOT NULL,
  artist_name  TEXT NOT NULL,
  artwork_url  TEXT,
  platform     TEXT NOT NULL DEFAULT 'audio',
  position     INTEGER NOT NULL DEFAULT 0,
  duration     INTEGER NOT NULL DEFAULT 0,
  track_url    TEXT,
  is_playing   BOOLEAN NOT NULL DEFAULT false,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read (overlay pages have no auth)
ALTER TABLE overlay_now_playing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read overlay now playing"
  ON overlay_now_playing FOR SELECT
  USING (true);

CREATE POLICY "Service role can upsert overlay now playing"
  ON overlay_now_playing FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for quick lookup by fid (primary key already covers this)
-- Add index on updated_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_overlay_now_playing_updated
  ON overlay_now_playing (updated_at);
