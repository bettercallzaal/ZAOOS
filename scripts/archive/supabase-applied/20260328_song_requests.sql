-- Song requests for DJ mode in Spaces
CREATE TABLE IF NOT EXISTS song_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  requester_fid integer NOT NULL,
  requester_name text,
  song_url text NOT NULL,
  song_title text,
  song_artist text,
  song_artwork text,
  status text DEFAULT 'pending', -- pending, accepted, rejected, played
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_song_requests_room ON song_requests(room_id, status);
