-- Add social media columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS x_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS audius_handle TEXT;
