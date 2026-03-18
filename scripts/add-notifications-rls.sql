-- Enable RLS on notifications table (defense-in-depth)
-- All notification queries currently go through supabaseAdmin (service role),
-- which bypasses RLS. This protects against direct anon-key access.

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (recipient_fid = current_setting('app.current_fid', true)::bigint);

-- No explicit INSERT/UPDATE/DELETE policies needed:
-- Server-side notification creation uses service_role which bypasses RLS.
