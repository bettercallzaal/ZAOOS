-- Stock Team Dashboard tables
-- 3 tables: team members, goals, todos

CREATE TABLE IF NOT EXISTS stock_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tbd' CHECK (status IN ('locked', 'wip', 'tbd')),
  details TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('venue', 'funding', 'artists', 'production', 'logistics', 'marketing', 'general')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO stock_goals (title, status, details, category, sort_order) VALUES
  ('Date confirmed', 'locked', 'October 3, 2026', 'venue', 1),
  ('Official status', 'locked', 'Part of Art of Ellsworth: Maine Craft Weekend (9th annual, statewide promo)', 'venue', 2),
  ('Venue', 'wip', 'Franklin Street Parklet, rented from Heart of Ellsworth', 'venue', 3),
  ('Weather backup', 'tbd', 'Wallace Events tent rental - not yet contacted', 'logistics', 4),
  ('Steve Peer', 'tbd', 'Local music anchor (37 years in Ellsworth, 430 house concerts) - not yet pitched for co-curation', 'artists', 5),
  ('Funding path', 'tbd', 'New Media Commons / Fractured Atlas 501c3 fiscal sponsorship. Tax-deductible donations. Need to identify specific grant/sponsor targets.', 'funding', 6),
  ('Budget', 'tbd', 'Goal $25K, minimum viable $5K. No money committed yet.', 'funding', 7),
  ('Sound / PA vendor', 'tbd', 'Need local Ellsworth/Bangor vendor. No quotes yet.', 'production', 8),
  ('Contracts', 'tbd', 'Team member agreements - need to define what these look like.', 'logistics', 9),
  ('Local sponsor list', 'tbd', '10-20 businesses in Ellsworth + Bangor area to approach.', 'funding', 10),
  ('Press', 'wip', 'Connection at Ellsworth American (local newspaper).', 'marketing', 11);

ALTER TABLE stock_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON stock_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_todos FOR ALL USING (true) WITH CHECK (true);
