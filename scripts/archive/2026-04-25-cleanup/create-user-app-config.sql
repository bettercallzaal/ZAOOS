-- ZAO OS: User App Configuration
-- Stores each user's shell preference, pinned apps, widgets, and hidden apps.

CREATE TABLE IF NOT EXISTS user_app_config (
  user_id UUID PRIMARY KEY,
  shell TEXT DEFAULT 'phone',
  pinned_apps TEXT[] DEFAULT '{"chat","messages","music"}',
  startup_apps TEXT[] DEFAULT '{}',
  widget_layout JSONB DEFAULT '[]'::jsonb,
  hidden_apps TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only read/write their own config
ALTER TABLE user_app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own config"
  ON user_app_config FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own config"
  ON user_app_config FOR ALL
  USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_app_config_user_id ON user_app_config(user_id);
