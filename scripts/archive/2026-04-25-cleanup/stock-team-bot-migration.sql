-- ZAOstock Team Bot migration
-- Paste into Supabase SQL Editor and run once.
-- Idempotent: safe to re-run.

BEGIN;

-- Allow linking a Telegram account to a teammate.
ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT;

-- Uniqueness guard (skip when NULL so unlinked members don't collide).
DROP INDEX IF EXISTS stock_team_members_telegram_id_unique;
CREATE UNIQUE INDEX stock_team_members_telegram_id_unique
  ON stock_team_members(telegram_id)
  WHERE telegram_id IS NOT NULL;

COMMIT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stock_team_members'
  AND column_name = 'telegram_id';
