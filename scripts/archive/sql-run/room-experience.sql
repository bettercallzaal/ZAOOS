-- Room experience tables: hand raises + chat messages
-- Run against Supabase SQL editor

-- Hand raise queue
CREATE TABLE IF NOT EXISTS room_hand_raises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  fid integer NOT NULL,
  username text,
  pfp_url text,
  status text DEFAULT 'raised', -- raised, invited, dismissed, lowered
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, fid)
);

CREATE INDEX IF NOT EXISTS idx_room_hand_raises_room ON room_hand_raises(room_id, status);

-- Room text chat messages
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  fid integer NOT NULL,
  username text,
  pfp_url text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id, created_at);

-- Enable RLS
ALTER TABLE room_hand_raises ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow authenticated reads, server-side writes via service role
CREATE POLICY "Anyone can read hand raises" ON room_hand_raises FOR SELECT USING (true);
CREATE POLICY "Anyone can read room messages" ON room_messages FOR SELECT USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_hand_raises;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
