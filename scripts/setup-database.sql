-- ZAO OS Database Schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard → SQL Editor)

-- Allowlisted users who can access ZAO OS
CREATE TABLE IF NOT EXISTS allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT UNIQUE,
  wallet_address TEXT UNIQUE,
  real_name TEXT,
  ign TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- User sessions (for tracking, not primary auth - iron-session handles that)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL,
  username TEXT,
  display_name TEXT,
  pfp_url TEXT,
  custody_address TEXT,
  signer_uuid TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Soft-deleted messages (admin can hide messages from ZAO OS view)
CREATE TABLE IF NOT EXISTS hidden_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT UNIQUE NOT NULL,
  hidden_by_fid BIGINT NOT NULL,
  reason TEXT,
  hidden_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowlist_fid ON allowlist(fid) WHERE fid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_allowlist_wallet ON allowlist(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hidden_messages_hash ON hidden_messages(cast_hash);

-- Enable RLS
ALTER TABLE allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies (service_role bypasses these, so server-side queries work)
-- No public access policies needed since all access is through service_role
