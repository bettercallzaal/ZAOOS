-- Add publish tracking columns to proposals for all platforms
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_x_url TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_fc_error TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_bsky_error TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS publish_x_error TEXT;
