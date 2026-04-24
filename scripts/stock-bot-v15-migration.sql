-- ZAOstock bot v1.5 migration: bot persona + group mode
-- Idempotent. Paste into Supabase SQL Editor.

BEGIN;

-- 1. Register the bot as a team member so it appears in the roster and can be referenced.
-- Name "ZAOstock Bot" is stable. We look it up by name at bot startup.
INSERT INTO stock_team_members (name, role, scope, active)
VALUES ('ZAOstock Bot', 'bot', '', true)
ON CONFLICT (name) DO UPDATE SET role = 'bot', active = true;

-- 2. Chat registry (forum supergroups + groups + DMs).
CREATE TABLE IF NOT EXISTS stock_bot_chats (
  chat_id BIGINT PRIMARY KEY,
  chat_type TEXT NOT NULL CHECK (chat_type IN ('private', 'group', 'supergroup', 'channel')),
  title TEXT DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'team' CHECK (mode IN ('team', 'devops', 'staging', 'private')),
  forum_enabled BOOLEAN DEFAULT false,
  post_digests BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Topic → scope map for forum supergroups (e.g. "Ops" thread -> ops scope).
CREATE TABLE IF NOT EXISTS stock_bot_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES stock_bot_chats(chat_id) ON DELETE CASCADE,
  thread_id INT NOT NULL,
  scope TEXT NOT NULL,
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chat_id, thread_id)
);
CREATE INDEX IF NOT EXISTS stock_bot_topics_chat_idx ON stock_bot_topics(chat_id);

-- 4. Noteworthy message log. Only flagged messages, never raw chat.
CREATE TABLE IF NOT EXISTS stock_bot_noteworthy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  thread_id INT,
  tg_user_id BIGINT,
  member_id UUID REFERENCES stock_team_members(id),
  tg_username TEXT DEFAULT '',
  text_excerpt TEXT NOT NULL,
  reason TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  tg_message_id BIGINT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_bot_noteworthy_recent_idx
  ON stock_bot_noteworthy(created_at DESC);

-- RLS
ALTER TABLE stock_bot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_bot_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_bot_noteworthy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON stock_bot_chats;
CREATE POLICY "Service role full access" ON stock_bot_chats FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_bot_topics;
CREATE POLICY "Service role full access" ON stock_bot_topics FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_bot_noteworthy;
CREATE POLICY "Service role full access" ON stock_bot_noteworthy FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- Verify
SELECT 'ZAOstock Bot row' as check, id, role, active FROM stock_team_members WHERE name = 'ZAOstock Bot';
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'stock_bot%' ORDER BY table_name;
