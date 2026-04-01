-- Stream.io audio rooms (for /spaces)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  host_username TEXT NOT NULL,
  host_pfp TEXT,
  stream_call_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'live' CHECK (state IN ('live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 100ms live audio rooms (for /social)
CREATE TABLE IF NOT EXISTS ms_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  room_id_100ms TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'ended')),
  settings JSONB DEFAULT '{}',
  pinned_links JSONB DEFAULT '[]',
  speakers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

ALTER TABLE ms_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_rooms_select" ON ms_rooms FOR SELECT USING (true);
CREATE POLICY "ms_rooms_insert" ON ms_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "ms_rooms_update" ON ms_rooms FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE ms_rooms;

-- Speaker requests for 100ms rooms
CREATE TABLE IF NOT EXISTS speaker_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES ms_rooms(id) ON DELETE CASCADE,
  requester_fid BIGINT NOT NULL,
  requester_name TEXT NOT NULL,
  peer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE speaker_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "speaker_requests_select" ON speaker_requests FOR SELECT USING (true);
CREATE POLICY "speaker_requests_insert" ON speaker_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "speaker_requests_update" ON speaker_requests FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE speaker_requests;

-- Audio room participation points
CREATE TABLE IF NOT EXISTS space_participant_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  username TEXT NOT NULL,
  room_id UUID NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('stream', '100ms')),
  points INTEGER DEFAULT 0,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE space_participant_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_select" ON space_participant_points FOR SELECT USING (true);
CREATE POLICY "points_insert" ON space_participant_points FOR INSERT WITH CHECK (true);

-- Phase 1: Voice channels + stages
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'stage' CHECK (room_type IN ('voice_channel', 'stage'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS persistent BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS layout_preference TEXT DEFAULT 'content-first' CHECK (layout_preference IN ('content-first', 'speakers-first'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stream' CHECK (provider IN ('stream', '100ms'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gate_config JSONB;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_rooms_slug ON rooms (slug) WHERE slug IS NOT NULL;

-- Atomic participant count functions (avoid read-then-write race conditions)
CREATE OR REPLACE FUNCTION increment_participant_count(room_id UUID)
RETURNS void AS $$
  UPDATE rooms SET participant_count = participant_count + 1 WHERE id = room_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrement_participant_count(room_id UUID)
RETURNS void AS $$
  UPDATE rooms SET participant_count = GREATEST(participant_count - 1, 0) WHERE id = room_id;
$$ LANGUAGE sql;

-- Enable realtime for song_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE song_requests;

-- Function to clean up orphaned sessions (call via cron or API)
CREATE OR REPLACE FUNCTION cleanup_orphaned_sessions()
RETURNS integer AS $$
DECLARE
  cleaned integer;
BEGIN
  UPDATE space_sessions
  SET left_at = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - joined_at))::integer
  WHERE left_at IS NULL
    AND joined_at < now() - INTERVAL '12 hours';
  GET DIAGNOSTICS cleaned = ROW_COUNT;
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql;
