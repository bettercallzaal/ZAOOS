-- WaveWarZ Artist Stats (synced nightly from Intelligence dashboard)
CREATE TABLE IF NOT EXISTS wavewarz_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  solana_wallet TEXT NOT NULL UNIQUE,
  battles_count INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_volume_sol NUMERIC NOT NULL DEFAULT 0,
  career_earnings_sol NUMERIC NOT NULL DEFAULT 0,
  biggest_win_sol NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_battle TIMESTAMPTZ,
  last_battle_id TEXT,
  zao_fid INTEGER,
  farcaster_username TEXT,
  spotlight_tier TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_wins ON wavewarz_artists(wins DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_volume ON wavewarz_artists(total_volume_sol DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_wallet ON wavewarz_artists(solana_wallet);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_fid ON wavewarz_artists(zao_fid) WHERE zao_fid IS NOT NULL;

-- WaveWarZ Battle Log (raw battle results)
CREATE TABLE IF NOT EXISTS wavewarz_battle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id TEXT NOT NULL UNIQUE,
  artist_a TEXT NOT NULL,
  artist_b TEXT NOT NULL,
  song_a TEXT,
  song_b TEXT,
  winner TEXT,
  winner_margin TEXT,
  volume_sol NUMERIC NOT NULL DEFAULT 0,
  battle_type TEXT,
  settled_at TIMESTAMPTZ,
  proposal_id UUID,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavewarz_battles_settled ON wavewarz_battle_log(settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_battles_id ON wavewarz_battle_log(battle_id);

-- Enable RLS
ALTER TABLE wavewarz_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wavewarz_battle_log ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "wavewarz_artists_read" ON wavewarz_artists FOR SELECT TO authenticated USING (true);
CREATE POLICY "wavewarz_battle_log_read" ON wavewarz_battle_log FOR SELECT TO authenticated USING (true);
