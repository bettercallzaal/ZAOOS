-- Unified Member CRM — Add columns to users table
-- Run in Supabase SQL Editor

-- Member tier: respect_holder = governance rights, community = view only
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_tier TEXT DEFAULT 'community'
  CHECK (member_tier IN ('community', 'respect_holder'));

-- Link to respect_members for quick joins
ALTER TABLE users ADD COLUMN IF NOT EXISTS respect_member_id UUID;

-- Link to community_profiles (artist directory)
ALTER TABLE users ADD COLUMN IF NOT EXISTS community_profile_id UUID;

-- Discord ID for fractal session mapping
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- User-chosen preferred wallet for display
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_wallet TEXT;

-- Admin/self-assigned tags for segmentation
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Last activity timestamp (updated on any action)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_member_tier ON users (member_tier);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users (discord_id);
CREATE INDEX IF NOT EXISTS idx_users_tags ON users USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users (last_active_at DESC NULLS LAST);

-- Auto-set member_tier based on existing respect data:
-- Anyone with on-chain OG or ZOR tokens is a respect_holder
UPDATE users u
SET member_tier = 'respect_holder'
FROM respect_members rm
WHERE (u.fid IS NOT NULL AND rm.fid = u.fid)
   OR (u.primary_wallet IS NOT NULL AND rm.wallet_address = LOWER(u.primary_wallet))
AND (rm.onchain_og > 0 OR rm.onchain_zor > 0 OR rm.total_respect > 0);

-- Link respect_member_id where we can match on FID or wallet
UPDATE users u
SET respect_member_id = rm.id
FROM respect_members rm
WHERE (u.fid IS NOT NULL AND rm.fid = u.fid)
   OR (u.primary_wallet IS NOT NULL AND rm.wallet_address = LOWER(u.primary_wallet));

-- Link community_profile_id where FID matches
UPDATE users u
SET community_profile_id = cp.id
FROM community_profiles cp
WHERE u.fid IS NOT NULL AND cp.fid = u.fid;
