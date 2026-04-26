-- ZAOstock bot group-mode migration
-- Idempotent. Paste into Supabase SQL Editor.

BEGIN;

-- Table: known Telegram chats (DMs + groups)
-- For groups, we store chat_id + metadata. For DMs nothing to add here.
CREATE TABLE IF NOT EXISTS stock_bot_chats (
  chat_id BIGINT PRIMARY KEY,
  chat_type TEXT NOT NULL CHECK (chat_type IN ('private', 'group', 'supergroup', 'channel')),
  title TEXT DEFAULT '',
  is_primary BOOLEAN DEFAULT false,
  forum_enabled BOOLEAN DEFAULT false,
  general_thread_id INT,
  metadata JSONB DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Only one primary group at a time (where scheduled digests post).
CREATE UNIQUE INDEX IF NOT EXISTS stock_bot_chats_only_one_primary
  ON stock_bot_chats(is_primary)
  WHERE is_primary = true;

-- Table: forum topics inside a supergroup (ops/music/design/finance/general)
-- Maps message_thread_id to a team scope.
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

-- Table: NOTEWORTHY group messages only.
-- We do NOT dump every message. Only ones the bot flagged as work-relevant.
-- Most of your chat stays private to Telegram.
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
CREATE INDEX IF NOT EXISTS stock_bot_noteworthy_unprocessed_idx
  ON stock_bot_noteworthy(processed) WHERE processed = false;

-- RLS (service role only; bot writes via service key)
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
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'stock_bot%' ORDER BY table_name;
