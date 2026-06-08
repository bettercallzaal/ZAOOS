-- Spaces RLS hardening
--
-- All Spaces writes go through server routes using the Supabase SERVICE ROLE,
-- which bypasses RLS entirely. No browser/anon client ever inserts or updates
-- these tables (the browser only SELECTs for listings + realtime subscriptions).
-- So the permissive `WITH CHECK (true)` write policies shipped in
-- scripts/archive/setup-rooms-tables.sql + space-sessions.sql are unnecessary
-- attack surface — an anon key could write directly. This drops the anon write
-- policies and keeps public SELECT (needed for /spaces listings + realtime).
--
-- Safe to run once in production. Idempotent (DROP ... IF EXISTS).

-- ms_rooms: keep public SELECT; remove anon INSERT/UPDATE (service role only).
DROP POLICY IF EXISTS "ms_rooms_insert" ON ms_rooms;
DROP POLICY IF EXISTS "ms_rooms_update" ON ms_rooms;

-- speaker_requests: keep public SELECT (realtime hand-raise/approval updates);
-- remove anon INSERT/UPDATE (hand-raise + moderation go through the stage route).
DROP POLICY IF EXISTS "speaker_requests_insert" ON speaker_requests;
DROP POLICY IF EXISTS "speaker_requests_update" ON speaker_requests;

-- space_sessions: keep public SELECT (the leaderboard reads it); remove anon
-- INSERT (sessions are written by /api/spaces/session via the service role).
DROP POLICY IF EXISTS "space_sessions_insert" ON space_sessions;

-- space_participant_points: unused by application code today. If the table
-- exists, lock down anon writes too (service role still bypasses RLS).
DROP POLICY IF EXISTS "points_insert" ON space_participant_points;

-- Verify afterwards:
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE tablename IN ('ms_rooms','speaker_requests','space_sessions','space_participant_points')
--   ORDER BY tablename, cmd;
