-- Add vote_type to research_entry_votes and downvote_count to research_entries
-- Run in Supabase SQL editor

-- Add vote_type column (default 'up' for existing votes)
ALTER TABLE research_entry_votes ADD COLUMN IF NOT EXISTS vote_type text NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down'));

-- Add downvote_count to research_entries
ALTER TABLE research_entries ADD COLUMN IF NOT EXISTS downvote_count int NOT NULL DEFAULT 0;

-- Drop the old unique constraint and create a new one (entry_id, fid) stays the same
-- One vote per user per entry — they pick up or down
