-- ZAO Stock Team Dashboard - Tables + Seed Data
-- Run in Supabase SQL Editor

-- 1. Team Members (with password auth)
CREATE TABLE IF NOT EXISTS stock_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',  -- 'lead', '2nd', 'member'
  scope TEXT NOT NULL DEFAULT 'ops',    -- 'ops', 'finance', 'design', 'music'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Goals (high-level milestones)
CREATE TABLE IF NOT EXISTS stock_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tbd' CHECK (status IN ('locked', 'wip', 'tbd')),
  details TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Todos (task items assigned to members)
CREATE TABLE IF NOT EXISTS stock_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  created_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE stock_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_todos ENABLE ROW LEVEL SECURITY;

-- Policies: service role can do everything (API routes use service role)
CREATE POLICY "Service role full access" ON stock_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_todos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Generate password hashes using Node.js:
--   const { scryptSync, randomBytes } = require('crypto');
--   const salt = randomBytes(16).toString('hex');
--   const hash = scryptSync('your-password', salt, 64).toString('hex');
--   console.log(salt + ':' + hash);
--
-- For now, insert members WITHOUT passwords - generate hashes with the script below.
-- After running the script, UPDATE the password_hash column.

-- Team Members (passwords set separately)
INSERT INTO stock_team_members (name, role, scope) VALUES
  ('Zaal', 'lead', 'ops'),
  ('Candy', '2nd', 'ops'),
  ('FailOften', 'member', 'ops'),
  ('Hurric4n3Ike', 'member', 'ops'),
  ('Swarthy Hatter', 'member', 'ops'),
  ('DaNici', 'lead', 'design'),
  ('Shawn', 'member', 'design'),
  ('DCoop', '2nd', 'music'),
  ('AttaBotty', 'member', 'music'),
  ('Tyler Stambaugh', 'member', 'finance'),
  ('Ohnahji B', 'member', 'finance'),
  ('DFresh', 'member', 'finance'),
  ('Craig G', 'member', 'finance'),
  ('Maceo', 'member', 'finance')
ON CONFLICT (name) DO NOTHING;

-- Goals (April milestones)
INSERT INTO stock_goals (title, status, category, sort_order) VALUES
  ('Team structure defined + roles assigned', 'wip', 'organization', 1),
  ('First sponsor secured (Bangor Savings Bank)', 'tbd', 'finance', 2),
  ('Crowdfunding launched (Giveth + GoFundMe)', 'tbd', 'finance', 3),
  ('Brand kit + merch design complete', 'tbd', 'design', 4),
  ('Steve Peer pitched', 'tbd', 'partnerships', 5),
  ('MCW 2026 dates confirmed with Cara Romano', 'tbd', 'venue', 6),
  ('First virtual event (WaveWarZ or Spaces)', 'tbd', 'music', 7),
  ('Artist wishlist started', 'tbd', 'music', 8);

-- Todos (seeded from April 14 kickoff meeting)
-- Note: owner_id references need to be set after member insert.
-- This uses a CTE to look up member IDs by name.

WITH m AS (
  SELECT id, name FROM stock_team_members
)
INSERT INTO stock_todos (title, status, owner_id, created_by) VALUES
  -- High priority this week
  ('Define what each team is responsible for (scope doc)', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Create task list with team assignments', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Discuss Fractured Atlas wording for sponsors', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Bangor Savings Bank - prepare $1,000 sponsor application', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Reply to Heart of Ellsworth - schedule in-person meeting', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Change Discord standup to open stage format', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Start posting on ZAO Festivals X account', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  -- Design
  ('Design simple ZAO Stock t-shirt for print-on-demand', 'todo', (SELECT id FROM m WHERE name='Shawn'), (SELECT id FROM m WHERE name='Zaal')),
  ('Brand kit for ZAO Festivals', 'todo', (SELECT id FROM m WHERE name='Candy'), (SELECT id FROM m WHERE name='Zaal')),
  -- Music
  ('Create ZAOVille logo concepts + melded logo', 'todo', (SELECT id FROM m WHERE name='DCoop'), (SELECT id FROM m WHERE name='Zaal')),
  -- Ops
  ('Create markdown context files for FailOften and Shawn AIs', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Brainstorm AI-to-AI communication for team coordination', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Improve past events data on /stock website', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  -- Everyone
  ('Send bio, links, IRL photo, team preference to Zaal', 'todo', NULL, (SELECT id FROM m WHERE name='Zaal')),
  -- April goals
  ('Confirm MCW 2026 dates with Cara Romano', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Pitch Steve Peer on ZAO Stock', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Launch Giveth crowdfunding page', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Launch GoFundMe', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('First virtual event (WaveWarZ or Spaces)', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal')),
  ('Begin artist wishlist - confirm who can travel', 'todo', (SELECT id FROM m WHERE name='Zaal'), (SELECT id FROM m WHERE name='Zaal'));
