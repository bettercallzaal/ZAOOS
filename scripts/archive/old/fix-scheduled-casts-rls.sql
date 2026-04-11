-- Fix scheduled_casts RLS: restrict all operations to the row owner's FID.
-- The previous policies used `using (true)` / `with check (true)`, allowing any
-- authenticated user to read and modify ANY scheduled cast — a privacy leak and
-- impersonation risk.
--
-- Service role (used by ZAO OS server-side API routes) bypasses RLS entirely,
-- so these tighter policies only affect direct client access.
--
-- Run against Supabase: psql or Dashboard SQL Editor.
-- ============================================================================

BEGIN;

-- 1. Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can see their own scheduled casts"   ON scheduled_casts;
DROP POLICY IF EXISTS "Users can insert their own scheduled casts" ON scheduled_casts;
DROP POLICY IF EXISTS "Users can update their own scheduled casts" ON scheduled_casts;
DROP POLICY IF EXISTS "Users can delete their own scheduled casts" ON scheduled_casts;

-- 2. Create restrictive policies scoped to the authenticated user's FID.
--    auth.uid()::text is compared against the fid column cast to text so that
--    Supabase JWT sub (UUID string) can be matched. If your JWT stores fid as a
--    custom claim, adjust to: (auth.jwt() ->> 'fid')::integer = fid

-- SELECT: users can only read their own scheduled casts
CREATE POLICY "Users can select own scheduled casts"
  ON scheduled_casts FOR SELECT
  USING ( fid = (current_setting('request.jwt.claims', true)::json ->> 'fid')::integer );

-- INSERT: users can only create casts under their own FID
CREATE POLICY "Users can insert own scheduled casts"
  ON scheduled_casts FOR INSERT
  WITH CHECK ( fid = (current_setting('request.jwt.claims', true)::json ->> 'fid')::integer );

-- UPDATE: users can only modify their own scheduled casts
CREATE POLICY "Users can update own scheduled casts"
  ON scheduled_casts FOR UPDATE
  USING ( fid = (current_setting('request.jwt.claims', true)::json ->> 'fid')::integer )
  WITH CHECK ( fid = (current_setting('request.jwt.claims', true)::json ->> 'fid')::integer );

-- DELETE: users can only cancel/remove their own scheduled casts
CREATE POLICY "Users can delete own scheduled casts"
  ON scheduled_casts FOR DELETE
  USING ( fid = (current_setting('request.jwt.claims', true)::json ->> 'fid')::integer );

COMMIT;
