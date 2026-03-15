-- ZAO OS Users Table
-- Proper user profiles keyed on primary wallet address with optional FID link
-- Run this in the Supabase SQL Editor

-- Users table — the source of truth for ZAO OS profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  primary_wallet TEXT NOT NULL UNIQUE,          -- lowercase 0x address, login identity
  fid BIGINT UNIQUE,                            -- Farcaster ID (null = wallet-only / beta user)
  username TEXT,                                 -- Farcaster username or custom
  display_name TEXT,                             -- Display name
  pfp_url TEXT,                                  -- Profile picture URL
  bio TEXT,                                      -- Short bio

  -- Wallet addresses (one user can have multiple)
  custody_address TEXT,                          -- Farcaster custody wallet
  verified_addresses JSONB DEFAULT '[]'::jsonb,  -- Additional verified wallets
  ens_name TEXT,                                 -- Primary ENS name

  -- ZAO-specific
  role TEXT DEFAULT 'beta' CHECK (role IN ('beta', 'member', 'admin')),
  -- beta = wallet-only, limited features
  -- member = FID linked, full features
  -- admin = full access + admin panel
  real_name TEXT,                                -- Real name (admin-set)
  ign TEXT,                                      -- In-game name
  notes TEXT,                                    -- Admin notes

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Signer
  signer_uuid TEXT                               -- Neynar managed signer UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_primary_wallet ON users(primary_wallet);
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid) WHERE fid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

-- Enable RLS (service_role bypasses)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
