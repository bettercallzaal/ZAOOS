-- Add xmtp_address column to users table
-- Stores the XMTP-derived address so other users can discover them via canMessage
-- Run this in the Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS xmtp_address TEXT;

CREATE INDEX IF NOT EXISTS idx_users_xmtp_address ON users(xmtp_address) WHERE xmtp_address IS NOT NULL;
