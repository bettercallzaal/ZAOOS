-- ============================================================================
-- ZAOstock Cowork Tracker RLS Hardening
-- ============================================================================
-- SECURITY EXPOSURE FIX (verified 2026-07-12)
--
-- 13 tables currently have overly permissive RLS policies allowing any
-- authenticated Supabase token to read AND write ALL rows:
-- activity_log, artists, budget_entries, circle_members, circles,
-- contact_log, goals, meeting_notes, sponsors, suggestions, tasks (stock_todos),
-- team_members, volunteers
--
-- Policy pattern: <table>_authenticated_all with cmd=ALL, role=authenticated,
-- USING(true), WITH CHECK(true)
--
-- Net effect: any holder of an authenticated token can read/write every row
-- with no ownership or access control scoping.
--
-- RISK: If the app uses service role (supabaseAdmin) for all writes, the
-- authenticated ALL policies are unnecessary attack surface. An anon key or
-- compromised frontend code could write directly. If the app relies on RLS
-- for access control, the policies are missing ownership scoping entirely.
--
-- FIX: This script handles TWO cases explicitly. READ BOTH before applying.
--
-- CASE A (Per-User Auth): If each team member authenticates as their own
-- Supabase auth user and ownership columns exist (e.g. owner_id, created_by,
-- user_id), scope write policies by = auth.uid() and keep team-wide reads.
-- Columns to verify before applying: see VERIFY COLUMN NAMES section below.
--
-- CASE B (Shared/Service Pattern): If the app uses supabaseAdmin (service
-- role) for all mutations, remove the permissive authenticated ALL policies
-- and grant the client only what it truly needs (read-only for listings,
-- or nothing - writes via service role on the server).
--
-- INSTRUCTIONS:
-- 1. This script WILL NOT RUN without explicit opt-in. See guard below.
-- 2. Determine your case (A or B) by reviewing src/lib/auth/* and
--    src/app/api routes that access these tables.
-- 3. Uncomment ONLY the case block you need (A or B).
-- 4. Read the VERIFY COLUMN NAMES section for your case.
-- 5. Update column names if they differ from defaults (e.g. user_id vs owner_id).
-- 6. Test on a Supabase branch/staging database FIRST.
-- 7. Verify the app still works after applying (reads/writes as intended).
-- 8. Only then apply to production in a low-usage window.
--
-- DO NOT RUN THIS SCRIPT BLIND. Set APPLY=1 after reviewing.
-- ============================================================================

-- ============================================================================
-- GUARD: This script will NOT RUN unless a reviewer sets APPLY=1
-- ============================================================================
DO $$
BEGIN
  IF current_setting('app.apply_rls_hardening', true) IS NULL OR
     current_setting('app.apply_rls_hardening', true) != '1' THEN
    RAISE EXCEPTION 'RLS hardening guard active. Review both cases A and B above, then set app.apply_rls_hardening=1 before applying.';
  END IF;
END $$;

BEGIN;

-- ============================================================================
-- CASE A: Per-User Auth with Ownership Scoping
-- ============================================================================
-- Uncomment this section ONLY if:
-- - Each team member authenticates as a Supabase auth user
-- - Tables have ownership columns (owner_id, created_by, user_id, etc.)
-- - You want to scope writes by owner = auth.uid()
--
-- VERIFY COLUMN NAMES before uncommenting:
-- - stock_todos / tasks: owner_id (FK to team_members.id)
--   ISSUE: auth.uid() is a Supabase auth UUID, team_members.id is a different
--   UUID system. You may need a user_mapping table (auth.uid() -> team_members.id)
--   or a different scoping strategy. Verify this before applying.
--
-- - stock_sponsors: owner_id
-- - stock_artists: outreach_by
-- - stock_volunteers: recruited_by
-- - stock_meeting_notes: created_by
-- - stock_budget_entries: no ownership column (shared team write)
-- - stock_activity_log: actor_id (read-only for team)
-- - stock_contact_log: contacted_by
-- - stock_goals: no ownership column (shared team write)
-- - stock_suggestions: no ownership column (allow anon submit + team review)
-- - circle_members: no direct ownership (circles are team-shared)
-- - circles: no direct ownership (circles are team-shared)
--
-- NOTE: This case requires careful column naming review. If column names
-- differ, update the policy USING/WITH CHECK clauses below.
--
-- UNCOMMENTING CASE A DISABLED FOR THIS DRAFT:
-- The auth model does not appear to use Supabase auth UIDs in the codebase.
-- See src/lib/auth/stock-team-session.ts (iron-session, not Supabase auth).
-- Uncomment only if you change to Supabase auth with proper user_mapping.

-- -- Case A: Drop all authenticated ALL policies
-- DROP POLICY IF EXISTS "activity_log_authenticated_all" ON activity_log;
-- DROP POLICY IF EXISTS "artists_authenticated_all" ON artists;
-- DROP POLICY IF EXISTS "budget_entries_authenticated_all" ON budget_entries;
-- DROP POLICY IF EXISTS "circle_members_authenticated_all" ON circle_members;
-- DROP POLICY IF EXISTS "circles_authenticated_all" ON circles;
-- DROP POLICY IF EXISTS "contact_log_authenticated_all" ON contact_log;
-- DROP POLICY IF EXISTS "goals_authenticated_all" ON goals;
-- DROP POLICY IF EXISTS "meeting_notes_authenticated_all" ON meeting_notes;
-- DROP POLICY IF EXISTS "sponsors_authenticated_all" ON sponsors;
-- DROP POLICY IF EXISTS "suggestions_authenticated_all" ON suggestions;
-- DROP POLICY IF EXISTS "tasks_authenticated_all" ON tasks;
-- DROP POLICY IF EXISTS "team_members_authenticated_all" ON team_members;
-- DROP POLICY IF EXISTS "volunteers_authenticated_all" ON volunteers;
--
-- -- Case A: Scoped write policies (example: stock_todos/tasks)
-- -- VERIFY: owner_id exists and equals the user's team_members.id (via mapping)
-- CREATE POLICY "todos_owner_write" ON stock_todos
--   FOR UPDATE
--   USING (owner_id = (SELECT id FROM stock_team_members WHERE auth_uid = auth.uid()))
--   WITH CHECK (owner_id = (SELECT id FROM stock_team_members WHERE auth_uid = auth.uid()));
--
-- -- Case A: Shared team SELECT (reads are team-wide, but writes are scoped)
-- CREATE POLICY "todos_team_read" ON stock_todos
--   FOR SELECT
--   USING (EXISTS (
--     SELECT 1 FROM stock_team_members tm
--     WHERE tm.auth_uid = auth.uid() AND tm.active = true
--   ));

-- ============================================================================
-- CASE B: Service-Role-Only (Shared/Server-Side Auth)
-- ============================================================================
-- Uncomment this section ONLY if:
-- - The app uses getSupabaseAdmin() / supabaseAdmin (service role) for all mutations
-- - The client (browser) has NO direct write access to these tables
-- - The cowork app talks to the server via API routes + iron-session
--
-- This is the current app architecture (verified in src/lib/auth/stock-team-session.ts
-- and src/lib/stock/*.ts which all use getSupabaseAdmin()).
--
-- FIX: Remove overly permissive authenticated ALL policies. Keep reads as needed.
--
-- CASE B: Drop all overly permissive authenticated ALL policies
DROP POLICY IF EXISTS "activity_log_authenticated_all" ON activity_log;
DROP POLICY IF EXISTS "artists_authenticated_all" ON artists;
DROP POLICY IF EXISTS "budget_entries_authenticated_all" ON budget_entries;
DROP POLICY IF EXISTS "circle_members_authenticated_all" ON circle_members;
DROP POLICY IF EXISTS "circles_authenticated_all" ON circles;
DROP POLICY IF EXISTS "contact_log_authenticated_all" ON contact_log;
DROP POLICY IF EXISTS "goals_authenticated_all" ON goals;
DROP POLICY IF EXISTS "meeting_notes_authenticated_all" ON meeting_notes;
DROP POLICY IF EXISTS "sponsors_authenticated_all" ON sponsors;
DROP POLICY IF EXISTS "suggestions_authenticated_all" ON suggestions;
DROP POLICY IF EXISTS "tasks_authenticated_all" ON tasks;
DROP POLICY IF EXISTS "team_members_authenticated_all" ON team_members;
DROP POLICY IF EXISTS "volunteers_authenticated_all" ON volunteers;

-- CASE B: If client-side reads are needed (e.g. public listings), add scoped policies
-- For now, keep policies minimal. If the frontend needs to read these tables,
-- add authenticated SELECT policies here. Example:
--
-- CREATE POLICY "artists_team_read" ON artists
--   FOR SELECT
--   USING (true);  -- Only if reads are truly team-internal
--
-- Do NOT use USING(true) for writes — that's the original exposure.
-- If you need authenticated reads, be explicit about the intent.

-- ============================================================================
-- Secondary: Review and Fix Other Security Issues
-- ============================================================================

-- 1. SECURITY DEFINER function `rls_auto_enable` - check execution privileges
--    Recommended: Review what this function does and if anon/authenticated should execute it
--    Command to find: SELECT p.proname, p.prosecdef FROM pg_proc p WHERE p.proname = 'rls_auto_enable';

-- 2. Functions with mutable search_path - potential for unintended table access
--    Command to find: SELECT proname, prosecdef FROM pg_proc WHERE provolatility != 'i' AND prosecdef = true;

-- ============================================================================
-- Verification: Policies after hardening
-- ============================================================================
SELECT
  table_name,
  policy_name,
  action,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE table_name IN (
  'activity_log', 'artists', 'budget_entries', 'circle_members', 'circles',
  'contact_log', 'goals', 'meeting_notes', 'sponsors', 'suggestions',
  'tasks', 'team_members', 'volunteers'
)
ORDER BY table_name, action, policy_name;

-- Expected result: NO rows with action='ALL' and roles='authenticated' and qual='true'
-- (The hardening has removed those.) Remaining policies should be:
-- - Service role full access (if kept) or
-- - Scoped authenticated SELECT (if reads are needed)

COMMIT;

-- ============================================================================
-- ROLLBACK: If you need to undo this hardening
-- ============================================================================
-- This rollback restores the original permissive policies (NOT recommended for production).
-- Only use this for testing/reverting in non-production.
--
-- DO NOT UNCOMMENT THIS UNLESS YOU EXPLICITLY NEED TO ROLLBACK.
--
-- BEGIN;
--
-- DROP POLICY IF EXISTS "todos_owner_write" ON stock_todos;
-- DROP POLICY IF EXISTS "todos_team_read" ON stock_todos;
-- -- ... repeat for other tables ...
--
-- -- Restore original permissive policies (CASE A/B both used these originally)
-- CREATE POLICY "activity_log_authenticated_all" ON activity_log
--   FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "artists_authenticated_all" ON artists
--   FOR ALL USING (true) WITH CHECK (true);
-- -- ... repeat for other tables ...
--
-- COMMIT;
--
-- Note: If you used CASE A scoped policies, you'll need to drop those first,
-- then re-create the original permissive ones above. The rollback pattern is:
-- 1. DROP POLICY IF EXISTS the new scoped policy
-- 2. CREATE POLICY the original permissive policy
