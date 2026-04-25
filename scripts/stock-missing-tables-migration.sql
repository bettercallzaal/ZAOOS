-- ============================================================================
-- Create 4 missing tables the bot + dashboard rely on
-- ============================================================================
-- Found via REST probe (2026-04-25):
--   stock_activity_log → 404 (every /do action expects this)
--   stock_milestones   → 404 (digest reads, /do add_milestone writes)
--   stock_rsvps        → 404 (dashboard RSVPs tab + form)
--   stock_budget       → 404 (dashboard Budget tab)
--
-- Schema copied from scripts/stock-schema.sql. Idempotent.
-- Paste into Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. stock_activity_log - audit / attribution trail for every action
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES stock_team_members(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_activity_entity_idx
  ON stock_activity_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_activity_actor_idx
  ON stock_activity_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_activity_recent_idx
  ON stock_activity_log(created_at DESC);

ALTER TABLE stock_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_activity_log;
CREATE POLICY "Service role full access" ON stock_activity_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. stock_milestones - festival timeline + due-date tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','blocked')),
  category TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_milestones_due_idx ON stock_milestones(due_date);
CREATE INDEX IF NOT EXISTS stock_milestones_status_idx ON stock_milestones(status);

ALTER TABLE stock_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_milestones;
CREATE POLICY "Service role full access" ON stock_milestones FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. stock_rsvps - audience RSVP capture from public form
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_rsvps_email_idx ON stock_rsvps(email);
CREATE INDEX IF NOT EXISTS stock_rsvps_recent_idx ON stock_rsvps(created_at DESC);

ALTER TABLE stock_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_rsvps;
CREATE POLICY "Service role full access" ON stock_rsvps FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4b. stock_contact_log - per-touchpoint history for sponsors + artists
-- (added 2026-04-25 after /do log_contact failed in prod with this table missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_contact_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sponsor','artist')),
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','call','sms','dm_farcaster','dm_x','dm_tg','in_person','other')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  summary TEXT NOT NULL,
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contacted_by UUID NOT NULL REFERENCES stock_team_members(id),
  next_action TEXT DEFAULT '',
  next_action_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_contact_log_entity_idx
  ON stock_contact_log(entity_type, entity_id, contacted_at DESC);

ALTER TABLE stock_contact_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_contact_log;
CREATE POLICY "Service role full access" ON stock_contact_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. stock_budget - festival income + expense tracker
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT DEFAULT '',
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'projected' CHECK (status IN ('projected','committed','actual')),
  date DATE,
  notes TEXT DEFAULT '',
  related_sponsor_id UUID REFERENCES stock_sponsors(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_budget_type_idx ON stock_budget(type);
CREATE INDEX IF NOT EXISTS stock_budget_date_idx ON stock_budget(date);

ALTER TABLE stock_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_budget;
CREATE POLICY "Service role full access" ON stock_budget FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- Verify
SELECT
  'stock_activity_log' AS table_name, COUNT(*) AS rows FROM stock_activity_log
UNION ALL SELECT 'stock_milestones', COUNT(*) FROM stock_milestones
UNION ALL SELECT 'stock_rsvps', COUNT(*) FROM stock_rsvps
UNION ALL SELECT 'stock_budget', COUNT(*) FROM stock_budget;
