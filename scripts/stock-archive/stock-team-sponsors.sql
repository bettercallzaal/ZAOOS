-- ZAOstock Sponsors CRM - Wave 1 of Dashboard Expansion
-- Run in Supabase SQL Editor after stock-team-setup.sql

-- Sponsors table
CREATE TABLE IF NOT EXISTS stock_sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('local', 'virtual', 'ecosystem')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'in_talks', 'committed', 'paid', 'declined')),
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  amount_committed NUMERIC(10,2) DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  why_them TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_sponsors FOR ALL USING (true) WITH CHECK (true);

-- Seed from outreach.md
INSERT INTO stock_sponsors (name, track, status, contact_name, contact_phone, why_them) VALUES
  -- Local
  ('Fogtown Brewing', 'local', 'lead', 'Jon Stein', '', 'Beer partner, 25 Pine St, existing music venue'),
  ('Precipice Coffee', 'local', 'lead', '', '', 'Coffee partner, saw 25% MCW boost'),
  ('Atlantic Art Glass', 'local', 'lead', 'Linda Perrin', '', 'Art partner, saw 300% MCW boost'),
  ('Franklin Savings Bank', 'local', 'lead', '', '', 'Already funds Heart of Ellsworth'),
  ('Bangor Savings Bank', 'local', 'lead', '', '', '$1,000 corporate giving, monthly review cycle - FIRST TARGET'),
  ('Maine Community Foundation', 'local', 'lead', '', '', 'Funded HoE Asset Mapping study'),
  ('Wallace Events', 'local', 'lead', '', '(207) 667-6000', 'Tent partner, in-kind sponsor potential'),
  ('Share Studios', 'local', 'lead', 'Stephanie Hare', '', 'Art/craft partner'),
  ('Vinyl Vogue', 'local', 'lead', 'Matt Manry', '', 'Record shop at Newberry Exchange, literally next to Parklet'),
  -- Virtual (Web3)
  ('Coinbase / Base', 'virtual', 'lead', '', '', 'AttaBotty on Base Onchain Registry, Onchain Summer grants ($2M)'),
  ('Audius', 'virtual', 'lead', '', '', 'Decentralized music streaming, ZAO already integrates'),
  ('Impact3', 'virtual', 'lead', 'Kyle Reidhead', '', 'Candy former employer, crypto marketing agency'),
  ('OnChain Records', 'virtual', 'lead', '', '', 'AttaBotty collaborator, 90% artist revenue'),
  ('One Love Art DAO', 'virtual', 'lead', 'Jenifer Pepen (SirenAi)', '', 'FailOften connection, 600+ artists globally'),
  ('Whop', 'virtual', 'lead', 'Craig Gonzalez', '', '$1.6B creator platform, Craig on advisory board'),
  ('Songjam', 'virtual', 'lead', 'Adam Place', '', 'Advisory board member, ZABAL leaderboard powers ZAO engagement'),
  -- Ecosystem
  ('Fractured Atlas', 'ecosystem', 'committed', '', '', 'Already our 501(c)(3) fiscal sponsor - covers all ZAO Festivals'),
  ('Heart of Ellsworth', 'ecosystem', 'committed', 'Cara Romano', '(207) 812-4164', 'Venue + MCW statewide promo - CONFIRMED');
