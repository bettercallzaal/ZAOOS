-- Saved broadcast targets (stream keys for YouTube/Twitch/etc.)
CREATE TABLE IF NOT EXISTS broadcast_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitch', 'tiktok', 'facebook', 'kick', 'custom')),
  name TEXT NOT NULL,
  rtmp_url TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  provider TEXT DEFAULT 'direct' CHECK (provider IN ('direct', 'livepeer', 'restream')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE broadcast_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "targets_select" ON broadcast_targets FOR SELECT USING (true);
CREATE POLICY "targets_insert" ON broadcast_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "targets_update" ON broadcast_targets FOR UPDATE USING (true);
CREATE POLICY "targets_delete" ON broadcast_targets FOR DELETE USING (true);
