-- Additional enrichment columns for users table
-- Run in Supabase SQL Editor

-- Farcaster banner image (cover photo fallback)
ALTER TABLE users ADD COLUMN IF NOT EXISTS farcaster_banner_url TEXT;

-- Personal website URL (from Farcaster profile)
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Farcaster registration date
ALTER TABLE users ADD COLUMN IF NOT EXISTS farcaster_registered_at TIMESTAMPTZ;

-- Location (city, state, country from Farcaster)
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;

-- Neynar trust score (0-1, canonical field)
ALTER TABLE users ADD COLUMN IF NOT EXISTS neynar_score REAL;

-- GitHub handle (already added previously but ensure it exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_handle TEXT;
