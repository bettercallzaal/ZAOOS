-- Add X/Twitter publish tracking columns to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_x_url TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_x_error TEXT;
