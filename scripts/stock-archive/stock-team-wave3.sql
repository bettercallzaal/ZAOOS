-- ZAOstock Wave 3: Volunteers + Budget + Meeting Notes
-- Run in Supabase SQL Editor after stock-team-artists-timeline.sql

-- Volunteers
CREATE TABLE IF NOT EXISTS stock_volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'unassigned' CHECK (role IN ('setup', 'checkin', 'water', 'safety', 'teardown', 'floater', 'content', 'unassigned')),
  shift TEXT DEFAULT 'allday' CHECK (shift IN ('early', 'block1', 'block2', 'teardown', 'allday')),
  confirmed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  recruited_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stock_volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_volunteers FOR ALL USING (true) WITH CHECK (true);

-- Budget entries
CREATE TABLE IF NOT EXISTS stock_budget_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'projected' CHECK (status IN ('projected', 'committed', 'actual')),
  date DATE,
  related_sponsor_id UUID REFERENCES stock_sponsors(id),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stock_budget_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_budget_entries FOR ALL USING (true) WITH CHECK (true);

-- Meeting notes
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
ALTER TABLE stock_meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_meeting_notes FOR ALL USING (true) WITH CHECK (true);

-- Seed budget from budget.md (projected)
INSERT INTO stock_budget_entries (type, category, description, amount, status) VALUES
  -- Income targets
  ('income', 'crowdfunding', 'Giveth crypto crowdfunding target', 3500, 'projected'),
  ('income', 'crowdfunding', 'GoFundMe traditional crowdfunding target', 3500, 'projected'),
  ('income', 'crowdfunding', 'Mirror onchain post target', 1000, 'projected'),
  ('income', 'sponsorship', 'Local Ellsworth sponsorships target', 3500, 'projected'),
  ('income', 'sponsorship', 'Web3 brand sponsorships target', 3500, 'projected'),
  ('income', 'door', 'Door / tips day-of', 750, 'projected'),
  -- Expenses
  ('expense', 'travel', 'Artist flights (5-8 x $200-$400)', 5000, 'projected'),
  ('expense', 'lodging', 'Team Airbnb/hotels 2-3 nights', 4000, 'projected'),
  ('expense', 'sound', 'PA rental + operator', 3000, 'projected'),
  ('expense', 'tent', 'Wallace Events tent (weather backup)', 2000, 'projected'),
  ('expense', 'artist_fees', 'Per diem + meals for artists', 2000, 'projected'),
  ('expense', 'marketing', 'Print materials + signage', 1000, 'projected'),
  ('expense', 'venue', 'Parklet rental (may be free via HoE)', 1000, 'projected'),
  ('expense', 'insurance', 'Event liability insurance', 300, 'projected'),
  ('expense', 'contingency', 'Unexpected costs buffer', 1000, 'projected')
ON CONFLICT DO NOTHING;

-- Seed meeting notes from existing standup recaps
INSERT INTO stock_meeting_notes (meeting_date, title, attendees, notes) VALUES
  ('2026-04-14', 'Kickoff Standup', ARRAY['Zaal','DCoop','Candy','Shawn','FailOften'],
   '4 teams confirmed (Operations/Finance/Design/Music). Advisory board established. Venue keeping Parklet through Oct 3 weekend at no cost. Bangor Savings Bank identified as first sponsor target.'),
  ('2026-04-16', 'DaNici Design Meeting', ARRAY['Zaal','DaNici'],
   'ZAOstock brand confirmed (one word, lowercase s). Design team workflow: Thu brainstorm, Mon updates, Tue report. T-shirt designs coming before next standup. Cipher update from Anna incoming.')
ON CONFLICT DO NOTHING;
