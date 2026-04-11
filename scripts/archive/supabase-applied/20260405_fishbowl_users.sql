CREATE TABLE IF NOT EXISTS fishbowl_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id text UNIQUE NOT NULL,
  fid integer,
  username text,
  display_name text,
  pfp_url text,
  wallet_address text,
  email text,
  login_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fishbowl_users_privy ON fishbowl_users (privy_id);
CREATE INDEX IF NOT EXISTS idx_fishbowl_users_fid ON fishbowl_users (fid);
CREATE INDEX IF NOT EXISTS idx_fishbowl_users_wallet ON fishbowl_users (wallet_address);

ALTER TABLE fishbowl_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fishbowl users" ON fishbowl_users FOR SELECT USING (true);
CREATE POLICY "System can insert fishbowl users" ON fishbowl_users FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update fishbowl users" ON fishbowl_users FOR UPDATE USING (true);
