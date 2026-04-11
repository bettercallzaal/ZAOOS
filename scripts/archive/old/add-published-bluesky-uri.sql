-- Add Bluesky published URI column to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_bluesky_uri TEXT;
