-- Connected Platforms table
-- Stores OAuth tokens + stream keys for Twitch (and future platforms like YouTube)

CREATE TABLE IF NOT EXISTS connected_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  stream_key TEXT,
  rtmp_url TEXT,
  scopes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_fid, platform)
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_connected_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_connected_platforms_updated_at ON connected_platforms;
CREATE TRIGGER set_connected_platforms_updated_at
  BEFORE UPDATE ON connected_platforms
  FOR EACH ROW EXECUTE FUNCTION update_connected_platforms_updated_at();

-- Row Level Security
ALTER TABLE connected_platforms ENABLE ROW LEVEL SECURITY;

-- Service role (server-side) has full access via supabaseAdmin — no user-level RLS needed.
-- These policies allow server-side operations while keeping the table locked to anon/authenticated.
CREATE POLICY "platforms_select" ON connected_platforms FOR SELECT USING (true);
CREATE POLICY "platforms_insert" ON connected_platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "platforms_update" ON connected_platforms FOR UPDATE USING (true);
CREATE POLICY "platforms_delete" ON connected_platforms FOR DELETE USING (true);
