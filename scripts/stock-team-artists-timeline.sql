-- ZAOstock Artists Pipeline + Timeline - Wave 2 of Dashboard Expansion
-- Run in Supabase SQL Editor after stock-team-sponsors.sql

-- Artists table
CREATE TABLE IF NOT EXISTS stock_artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT DEFAULT '',
  city TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'contacted', 'interested', 'confirmed', 'declined', 'travel_booked')),
  socials TEXT DEFAULT '',
  travel_from TEXT DEFAULT '',
  needs_travel BOOLEAN DEFAULT true,
  set_time_minutes INT DEFAULT 25,
  set_order INT,
  fee NUMERIC(10,2) DEFAULT 0,
  rider TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  outreach_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_artists FOR ALL USING (true) WITH CHECK (true);

-- Timeline milestones table
CREATE TABLE IF NOT EXISTS stock_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  category TEXT DEFAULT 'general',
  owner_id UUID REFERENCES stock_team_members(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON stock_timeline FOR ALL USING (true) WITH CHECK (true);

-- Seed artists from team + COC Concertz pipeline + research
INSERT INTO stock_artists (name, genre, city, status, travel_from, needs_travel, notes) VALUES
  -- Team / ZAO artists (confirmed pipeline)
  ('AttaBotty', 'Electronic', 'Jacksonville FL', 'wishlist', 'Jacksonville, FL', true, 'ZAO co-founder, 20+ years production, NFTNYC/Art Basel veteran. Flute performance interest'),
  ('Hurric4n3Ike', 'Hip-hop / 432 Hz', 'Houston TX', 'wishlist', 'Houston, TX', true, 'ZAO #3, WaveWarZ founder, WavyWednesday 2+ years'),
  ('DCoop / Coop D''Ville', 'Hip-hop', 'DMV area', 'wishlist', 'Virginia', true, 'ZAOVille organizer, WaveWarZ active'),
  ('Tom Fellenz', 'Soundtrack / Guitar', '', 'wishlist', '', true, 'Advisory board, NFT Music Hall, 40+ musicians hosted'),
  -- COC Concertz pipeline (warm leads)
  ('Joseph Goats', 'Venezuelan singer-songwriter', 'Caracas, Venezuela', 'wishlist', 'Caracas', true, 'COC Concertz #4 performer. Giveth ecosystem, social impact angle'),
  ('Clejan', 'Trap Violin / Hip-hop', 'Los Angeles', 'wishlist', 'LA', true, 'Trap Violin, sold out NFT mints, high-energy performer'),
  ('Stilo World', 'DJ / Electronic', '', 'wishlist', '', true, '150+ consecutive weekly VR concerts. Potential DJ for transitions'),
  ('Duo Do Musica', 'Latin', '', 'wishlist', '', true, 'COC Concertz performer'),
  -- Local / via Steve Peer
  ('Steve Peer network', 'Various local', 'Ellsworth / Atlantic Canada', 'wishlist', 'Local', false, 'Via Steve Peer - 37 years Ellsworth, Celtic/Atlantic Canada acts')
ON CONFLICT DO NOTHING;

-- Seed timeline from timeline.md
INSERT INTO stock_timeline (title, due_date, category, description) VALUES
  -- April
  ('Confirm MCW 2026 dates with Cara Romano', '2026-04-30', 'venue', 'Heart of Ellsworth coordination'),
  ('Pitch Steve Peer on ZAOstock', '2026-04-30', 'partnerships', 'His bar (Black Moon) benefits directly from Parklet traffic'),
  ('Launch Giveth crowdfunding page', '2026-04-30', 'finance', 'Crypto crowdfunding primary'),
  ('Launch GoFundMe as secondary', '2026-04-30', 'finance', 'Traditional crowdfunding'),
  ('First virtual event (WaveWarZ or Spaces)', '2026-04-30', 'marketing', 'Build awareness'),
  ('Begin artist wishlist + travel confirmation', '2026-04-30', 'music', 'Who can come to Ellsworth'),
  -- May
  ('Call Wallace Events for tent quote', '2026-05-31', 'venue', '(207) 667-6000 - weather backup'),
  ('Contact sound vendors', '2026-05-31', 'venue', 'Maine Audio Visual or Greg Young - quotes $500-$1,100/day'),
  ('Confirm 5-6 artists minimum', '2026-05-31', 'music', 'Lock core lineup'),
  ('Second virtual event', '2026-05-31', 'marketing', 'COC Concertz or Spaces'),
  ('Begin local sponsor outreach', '2026-05-31', 'finance', 'Fogtown, Precipice, Atlantic Art Glass, Vinyl Vogue'),
  -- June
  ('Sound vendor booked', '2026-06-30', 'venue', 'Deposit paid'),
  ('Wallace Events tent reserved', '2026-06-30', 'venue', 'Weather backup'),
  ('Artist travel logistics started', '2026-06-30', 'music', 'Flights + lodging - $1,000-$3,200 flights budget'),
  ('Hotel group rates - October', '2026-06-30', 'logistics', '6-10 rooms, 2-3 nights - Hampton/Comfort/Colonial or Airbnb'),
  ('Third virtual event', '2026-06-30', 'marketing', ''),
  ('ZAO Cypher posted', '2026-06-30', 'marketing', 'Awareness build'),
  -- July
  ('ZAOstock page live on zaoos.com', '2026-07-31', 'marketing', 'Already live - confirm complete'),
  ('Co-present at Thursday Ellsworth Concert', '2026-07-31', 'partnerships', 'Parklet already hosts Thursday concerts'),
  ('Announce lineup on Farcaster / socials', '2026-07-31', 'marketing', 'Major push'),
  ('Local press outreach', '2026-07-31', 'marketing', 'Ellsworth American + BDN - 8 weeks out'),
  ('POAP / Magnetiq designs finalized', '2026-07-31', 'digital', 'Attendance collectibles'),
  ('Fourth virtual event', '2026-07-31', 'marketing', ''),
  ('Food vendor outreach', '2026-07-31', 'venue', 'Fogtown in-kind, food trucks no-fee'),
  -- August
  ('All artists confirmed with travel booked', '2026-08-31', 'music', 'Final lineup locked'),
  ('Volunteer recruitment (15-20)', '2026-08-31', 'ops', 'Via Heart of Ellsworth network'),
  ('Day-of schedule locked', '2026-08-31', 'ops', '12pm-6pm set times per run-of-show.md'),
  ('0xSplits wallets set up for artists', '2026-08-31', 'digital', 'Free, onchain auto-distribution'),
  ('Print materials ordered', '2026-08-31', 'design', 'Banners, signage, lineup cards - $200-$460'),
  ('Fifth virtual event', '2026-08-31', 'marketing', ''),
  -- September
  ('Lineup reveal event (virtual)', '2026-09-30', 'marketing', 'Farcaster Spaces'),
  ('Final venue walkthrough with HoE', '2026-09-30', 'venue', 'Cara Romano'),
  ('Weather backup confirmed', '2026-09-30', 'venue', 'Wallace Events tent on standby'),
  ('Volunteer orientation scheduled', '2026-09-30', 'ops', ''),
  ('Social media countdown begins', '2026-09-30', 'marketing', ''),
  ('Event liability insurance purchased', '2026-09-30', 'ops', 'The Event Helper - $150-$300'),
  ('Team lodging confirmed', '2026-09-30', 'logistics', ''),
  ('Equipment list finalized', '2026-09-30', 'venue', 'With sound vendor'),
  -- Show week
  ('Team arrives in Ellsworth', '2026-10-01', 'ops', 'Wednesday/Thursday'),
  ('Sound check + stage setup', '2026-10-02', 'ops', 'Friday or morning of Oct 3'),
  ('Volunteer orientation day-of', '2026-10-03', 'ops', '11:30 AM per run-of-show'),
  ('SHOWTIME: 12pm-6pm Parklet', '2026-10-03', 'event', 'Main event'),
  ('After-party at Black Moon', '2026-10-03', 'event', '6pm onwards'),
  -- Post
  ('Social content push', '2026-10-04', 'post', 'Photos, video, recap cast'),
  ('Thank-yous sent', '2026-10-05', 'post', 'HoE, artists, volunteers, sponsors'),
  ('Debrief with Steve Peer + Cara', '2026-10-10', 'post', 'Feedback for Year 2'),
  ('Revenue reconciliation', '2026-10-10', 'finance', 'Total in vs out'),
  ('Year 2 planning kickoff', '2026-10-17', 'strategy', '2027 festival')
ON CONFLICT DO NOTHING;
