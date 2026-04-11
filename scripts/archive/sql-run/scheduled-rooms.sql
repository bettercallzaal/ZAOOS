-- Scheduled rooms: announce upcoming spaces with RSVP
CREATE TABLE IF NOT EXISTS scheduled_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_fid integer NOT NULL,
  host_name text,
  host_pfp text,
  scheduled_at timestamptz NOT NULL,
  category text DEFAULT 'general',
  theme text DEFAULT 'default',
  rsvp_count integer DEFAULT 0,
  state text DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  room_id uuid, -- links to rooms table when it goes live
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_rsvps (
  scheduled_room_id uuid REFERENCES scheduled_rooms(id) ON DELETE CASCADE,
  fid integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (scheduled_room_id, fid)
);

-- Add recording_url to rooms table for VOD links
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS recording_url text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_rooms_state ON scheduled_rooms(state);
CREATE INDEX IF NOT EXISTS idx_scheduled_rooms_scheduled_at ON scheduled_rooms(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_room_rsvps_fid ON room_rsvps(fid);
