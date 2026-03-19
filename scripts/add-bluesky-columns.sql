-- Add Bluesky account columns to users table
-- Stores the user's Bluesky DID and handle for cross-posting from their own account

ALTER TABLE users ADD COLUMN IF NOT EXISTS bluesky_did TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bluesky_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bluesky_app_password TEXT;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_users_bluesky_did ON users(bluesky_did) WHERE bluesky_did IS NOT NULL;
