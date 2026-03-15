-- Add respect_wallet column to users table
-- Run this in the Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS respect_wallet TEXT;
