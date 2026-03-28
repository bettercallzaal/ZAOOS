CREATE TABLE IF NOT EXISTS space_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL,
  room_id UUID NOT NULL,
  room_name TEXT,
  room_type TEXT CHECK (room_type IN ('voice_channel', 'stage')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_space_sessions_fid ON space_sessions(fid);
CREATE INDEX IF NOT EXISTS idx_space_sessions_room ON space_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_space_sessions_joined ON space_sessions(joined_at DESC);

ALTER TABLE space_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "space_sessions_select" ON space_sessions FOR SELECT USING (true);
CREATE POLICY "space_sessions_insert" ON space_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "space_sessions_update" ON space_sessions FOR UPDATE USING (true);
