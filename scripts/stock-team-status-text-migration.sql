-- ============================================================================
-- ZAOstock Team - add status_text column
-- ============================================================================
-- One short line per teammate describing what they're working on right now.
-- Surfaces in the dashboard, on the public profile, and in the Team directory.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS status_text TEXT DEFAULT '';

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stock_team_members'
  AND column_name = 'status_text';
