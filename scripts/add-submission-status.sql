-- Migration: Add approval queue to song_submissions
-- Run this against your Supabase database.

-- 1. Add status column with check constraint
ALTER TABLE song_submissions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Add reviewer columns
ALTER TABLE song_submissions
  ADD COLUMN IF NOT EXISTS reviewed_by_fid INTEGER;

ALTER TABLE song_submissions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 3. Index on status for fast filtered queries
CREATE INDEX IF NOT EXISTS idx_song_submissions_status
  ON song_submissions (status);

-- 4. Mark all existing submissions as approved so they stay visible
UPDATE song_submissions
  SET status = 'approved'
  WHERE status = 'pending' OR status IS NULL;
