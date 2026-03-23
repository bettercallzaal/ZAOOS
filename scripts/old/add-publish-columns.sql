-- Add governance-powered publishing columns to proposals table
-- Enables community-proposed content to auto-publish to @thezao when threshold met

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_text TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_type TEXT CHECK (publish_type IN ('announcement', 'message', 'highlight'));
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_image_url TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_cast_hash TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS respect_threshold INTEGER DEFAULT 1000;
