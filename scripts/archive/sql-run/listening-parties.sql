-- Listening Parties table
-- Scheduled events where members listen together with synced playback

CREATE TABLE IF NOT EXISTS listening_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_fid integer NOT NULL,
  host_name text,
  track_urls text[] NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  started_at timestamptz,
  state text DEFAULT 'scheduled', -- scheduled, live, ended
  current_track_index integer DEFAULT 0,
  current_position_ms integer DEFAULT 0,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listening_parties_state ON listening_parties(state);
CREATE INDEX IF NOT EXISTS idx_listening_parties_scheduled ON listening_parties(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_listening_parties_host ON listening_parties(host_fid);

ALTER TABLE listening_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read parties" ON listening_parties;
CREATE POLICY "Anyone can read parties" ON listening_parties FOR SELECT USING (true);
