-- Add messaging_prefs JSONB column to users table
-- Defaults: { "autoJoinGroup": true, "allowNonZaoDms": false }
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS messaging_prefs jsonb DEFAULT '{"autoJoinGroup": true, "allowNonZaoDms": false}'::jsonb;
