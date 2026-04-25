-- ============================================================================
-- audit_log + triggers - "git for the database" lite
-- ============================================================================
-- Captures every INSERT/UPDATE/DELETE on critical ZAOstock tables.
-- Stores old + new row state as JSONB. Native Postgres, no external infra.
-- Idempotent. Paste into Supabase SQL Editor.
--
-- Read history of one row:
--   SELECT changed_at, op, changed_fields, actor_id
--   FROM audit_log
--   WHERE table_name = 'stock_sponsors' AND row_id = '<uuid>'
--   ORDER BY changed_at DESC;
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  actor_id UUID,
  actor_role TEXT,
  app_context JSONB DEFAULT '{}',
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_table_row_idx ON audit_log(table_name, row_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_id, changed_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx ON audit_log(changed_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON audit_log;
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Trigger function - one fn, runs for any audited table
-- ============================================================================
-- Reads optional session vars set by application code:
--   SET LOCAL app.actor_id = '<uuid>';     -- the team member id
--   SET LOCAL app.actor_role = 'bot';       -- 'bot' | 'dashboard' | 'admin'
--   SET LOCAL app.context = '{...}'::jsonb; -- any extra metadata

CREATE OR REPLACE FUNCTION audit_log_capture()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_actor_role TEXT;
  v_context JSONB;
  v_changed_fields TEXT[];
  v_row_id TEXT;
BEGIN
  -- best-effort actor capture from session vars (silent on failure)
  BEGIN v_actor_id := nullif(current_setting('app.actor_id', true), '')::uuid; EXCEPTION WHEN others THEN v_actor_id := NULL; END;
  BEGIN v_actor_role := nullif(current_setting('app.actor_role', true), ''); EXCEPTION WHEN others THEN v_actor_role := NULL; END;
  BEGIN v_context := nullif(current_setting('app.context', true), '')::jsonb; EXCEPTION WHEN others THEN v_context := '{}'::jsonb; END;

  -- pick the row id - assumes 'id' column on audited tables
  IF TG_OP = 'DELETE' THEN
    v_row_id := (to_jsonb(OLD)->>'id');
  ELSE
    v_row_id := (to_jsonb(NEW)->>'id');
  END IF;

  -- compute changed fields on UPDATE only
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key;
  END IF;

  INSERT INTO audit_log (
    table_name, row_id, op, old_data, new_data,
    changed_fields, actor_id, actor_role, app_context
  ) VALUES (
    TG_TABLE_NAME,
    v_row_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_changed_fields,
    v_actor_id,
    v_actor_role,
    coalesce(v_context, '{}'::jsonb)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Attach triggers to critical ZAOstock tables
-- ============================================================================
-- Order tables by criticality (lose-this-and-it-hurts).

DO $$
DECLARE
  t TEXT;
  audited TEXT[] := ARRAY[
    'stock_team_members',
    'stock_sponsors',
    'stock_artists',
    'stock_onepagers',
    'stock_circles',
    'stock_circle_members',
    'stock_milestones',
    'stock_budget',
    'stock_volunteers',
    'stock_proposals'
  ];
BEGIN
  FOREACH t IN ARRAY audited LOOP
    -- only attach if the table exists (handles fresh DBs where some tables not yet migrated)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_capture_%I ON %I', t, t);
      EXECUTE format('CREATE TRIGGER audit_capture_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_log_capture()', t, t);
      RAISE NOTICE 'Attached audit trigger to %', t;
    ELSE
      RAISE NOTICE 'Skipping % - table does not exist yet', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Retention: keep 365 days of audit history. Cleanup runs as a scheduled job.
-- ============================================================================
-- To run weekly (via Supabase pg_cron or manual call), add:
--   SELECT cron.schedule('audit-log-cleanup', '0 3 * * 0',
--     $$DELETE FROM audit_log WHERE changed_at < now() - interval '365 days'$$);
-- pg_cron requires Supabase Database extensions panel - enable if needed.

CREATE OR REPLACE FUNCTION audit_log_cleanup(retention_days INT DEFAULT 365)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM audit_log WHERE changed_at < now() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- Verify
-- ============================================================================
SELECT
  'TRIGGERS ATTACHED' AS check,
  event_object_table AS table_name,
  trigger_name
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_capture_%'
ORDER BY event_object_table;

SELECT 'AUDIT TABLE READY' AS check, COUNT(*) AS existing_rows FROM audit_log;
