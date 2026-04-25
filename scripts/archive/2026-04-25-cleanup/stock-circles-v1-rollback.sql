-- ============================================================================
-- ZAOstock Circles v1 Rollback
-- ============================================================================
-- Safe rollback if circles migration needs revert. Drops only new tables.
-- Legacy stock_team_members.role + scope columns remain intact.
--
-- Idempotent. Safe to re-run. Paste into Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- Drop new tables in reverse dependency order
DROP TABLE IF EXISTS stock_qa_log CASCADE;
DROP TABLE IF EXISTS stock_buddy_pairings CASCADE;
DROP TABLE IF EXISTS stock_respect_events CASCADE;
DROP TABLE IF EXISTS stock_proposal_objections CASCADE;
DROP TABLE IF EXISTS stock_proposals CASCADE;
DROP TABLE IF EXISTS stock_circle_members CASCADE;
DROP TABLE IF EXISTS stock_circles CASCADE;

COMMIT;

-- Verify: expect 14 original stock_* tables remain
SELECT table_name FROM information_schema.tables
  WHERE table_name LIKE 'stock\_%' ESCAPE '\'
  ORDER BY table_name;
