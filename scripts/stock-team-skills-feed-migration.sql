-- ============================================================================
-- ZAOstock Team - skills column (Pass C2)
-- ============================================================================
-- One free-text comma-separated list of skills/tags per teammate.
-- Examples: "video, sound, sponsorship", "music production, cypher host".
-- Used for filtering the directory + showing what each teammate offers.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stock_team_members'
  AND column_name = 'skills';
