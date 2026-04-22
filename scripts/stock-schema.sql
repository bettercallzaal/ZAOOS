-- ============================================================================
-- ZAOstock Schema - Canonical
-- ============================================================================
-- One idempotent script. Safe to re-run. Paste into Supabase SQL Editor.
--
-- Covers all ZAOstock tables + policies. No seed data (that lives in
-- stock-team-apr21-recap.sql for latest meeting + todos).
--
-- Historical migrations: scripts/stock-archive/
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS stock_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member',
  scope TEXT NOT NULL DEFAULT 'ops',
  bio TEXT DEFAULT '',
  links TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS links TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS stock_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tbd' CHECK (status IN ('locked','wip','tbd')),
  details TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  created_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  track TEXT NOT NULL DEFAULT 'local' CHECK (track IN ('local','virtual','ecosystem')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead','contacted','in_talks','committed','paid','declined')),
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  amount_committed NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  why_them TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT DEFAULT '',
  city TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist','contacted','interested','confirmed','declined','travel_booked')),
  socials TEXT DEFAULT '',
  travel_from TEXT DEFAULT '',
  needs_travel BOOLEAN DEFAULT false,
  set_time_minutes INT DEFAULT 20,
  set_order INT,
  fee NUMERIC DEFAULT 0,
  rider TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  outreach_by UUID REFERENCES stock_team_members(id),
  day_of_start_time TIME,
  day_of_duration_min INT,
  cypher_interested BOOLEAN DEFAULT false,
  cypher_role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  social_post_url TEXT DEFAULT '',
  claim_token TEXT,
  points_earned INT DEFAULT 0,
  volunteer_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_artists
  ADD COLUMN IF NOT EXISTS day_of_start_time TIME,
  ADD COLUMN IF NOT EXISTS day_of_duration_min INT,
  ADD COLUMN IF NOT EXISTS cypher_interested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cypher_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_post_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS claim_token TEXT,
  ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volunteer_eligible BOOLEAN DEFAULT false;

UPDATE stock_artists
  SET claim_token = substr(md5(random()::text || id::text || now()::text), 1, 16)
  WHERE claim_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stock_artists_claim_token_idx
  ON stock_artists(claim_token)
  WHERE claim_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS stock_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','blocked')),
  category TEXT DEFAULT 'general',
  owner_id UUID REFERENCES stock_team_members(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'unassigned' CHECK (role IN ('setup','checkin','water','safety','teardown','floater','content','unassigned')),
  shift TEXT DEFAULT 'allday' CHECK (shift IN ('early','block1','block2','teardown','allday')),
  confirmed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  recruited_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_budget_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'projected' CHECK (status IN ('projected','committed','actual')),
  date DATE,
  notes TEXT DEFAULT '',
  related_sponsor_id UUID REFERENCES stock_sponsors(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_meeting_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  title TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  action_items TEXT DEFAULT '',
  created_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  suggestion TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','actioned','wontfix','archived')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE stock_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON stock_team_members;
CREATE POLICY "Service role full access" ON stock_team_members FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_goals;
CREATE POLICY "Service role full access" ON stock_goals FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_todos;
CREATE POLICY "Service role full access" ON stock_todos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_sponsors;
CREATE POLICY "Service role full access" ON stock_sponsors FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_artists;
CREATE POLICY "Service role full access" ON stock_artists FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_timeline;
CREATE POLICY "Service role full access" ON stock_timeline FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_volunteers;
CREATE POLICY "Service role full access" ON stock_volunteers FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_budget_entries;
CREATE POLICY "Service role full access" ON stock_budget_entries FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_meeting_notes;
CREATE POLICY "Service role full access" ON stock_meeting_notes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_suggestions;
CREATE POLICY "Service role full access" ON stock_suggestions FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- Verify: expect 10 tables
SELECT table_name FROM information_schema.tables
  WHERE table_name LIKE 'stock\_%' ESCAPE '\'
  ORDER BY table_name;

-- Verify: expect 3 cols (bio, links, photo_url) on stock_team_members
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'stock_team_members'
  AND column_name IN ('bio','links','photo_url')
  ORDER BY column_name;
