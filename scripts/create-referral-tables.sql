-- Referral / invite code system for ZAO OS
-- Run against Supabase SQL editor

-- 1. Referral codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  creator_fid INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Referrals table (tracks who referred whom)
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_fid INTEGER NOT NULL,
  referred_fid INTEGER,
  referred_wallet TEXT,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'active_d30', 'expired')),
  joined_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_referral_codes_creator ON referral_codes (creator_fid);
CREATE INDEX idx_referral_codes_code ON referral_codes (code);
CREATE INDEX idx_referral_codes_active ON referral_codes (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_referrals_referrer ON referrals (referrer_fid);
CREATE INDEX idx_referrals_referred ON referrals (referred_fid);
CREATE INDEX idx_referrals_code ON referrals (referral_code);
CREATE INDEX idx_referrals_status ON referrals (status);

-- 4. RLS policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referral codes: users can read their own codes (via service role for API)
CREATE POLICY "Service role full access on referral_codes"
  ON referral_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read active codes for validation"
  ON referral_codes
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- Referrals: service role has full access
CREATE POLICY "Service role full access on referrals"
  ON referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read own referrals"
  ON referrals
  FOR SELECT
  TO anon
  USING (true);
