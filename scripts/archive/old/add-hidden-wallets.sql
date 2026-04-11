-- Add hidden_wallets column to users table
-- Stores an array of wallet type keys that should be hidden from profile
-- e.g. ["respect_wallet", "custody_address", "verified_addresses"]
-- Empty array (default) = all wallets visible

ALTER TABLE users
ADD COLUMN IF NOT EXISTS hidden_wallets JSONB DEFAULT '[]'::jsonb;
