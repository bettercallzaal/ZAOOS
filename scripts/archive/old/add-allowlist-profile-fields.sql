-- Add profile + wallet fields to allowlist for richer member management
-- Run this in the Supabase SQL Editor

ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS pfp_url TEXT;
ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS custody_address TEXT;
ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS verified_addresses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS ens_name TEXT;
ALTER TABLE allowlist ADD COLUMN IF NOT EXISTS username TEXT;
