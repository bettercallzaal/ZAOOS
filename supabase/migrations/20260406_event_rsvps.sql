-- Event RSVPs for festival pages (/stock, /festivals)
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_slug TEXT NOT NULL,
  fid BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, event_slug)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; authenticated users can insert
CREATE POLICY "event_rsvps_select" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "event_rsvps_insert" ON event_rsvps FOR INSERT WITH CHECK (true);
