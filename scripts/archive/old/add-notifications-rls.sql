-- Enable RLS on notifications table (defense-in-depth)
-- All notification queries currently go through supabaseAdmin (service role),
-- which bypasses RLS. These policies protect against direct anon-key access.
--
-- Columns: id, recipient_fid, type, title, body, href, actor_fid,
--          actor_display_name, actor_pfp_url, metadata, read, created_at

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running this script
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role inserts notifications" ON notifications;

-- SELECT: users can only read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT
  USING (recipient_fid = current_setting('app.current_fid', true)::bigint);

-- UPDATE: users can only update their own notifications (e.g. marking as read)
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE
  USING (recipient_fid = current_setting('app.current_fid', true)::bigint)
  WITH CHECK (recipient_fid = current_setting('app.current_fid', true)::bigint);

-- INSERT: only the service role can create notifications.
-- The service role bypasses RLS entirely, so this policy is a safeguard
-- that blocks inserts from the anon key while documenting intent.
CREATE POLICY "Service role inserts notifications" ON notifications
  FOR INSERT
  WITH CHECK (false);

-- DELETE: no one can delete via anon key
CREATE POLICY "No deletes via anon key" ON notifications
  FOR DELETE
  USING (false);

-- Note: supabaseAdmin (service_role) bypasses all RLS policies,
-- so server-side notification creation and cleanup continue to work.
