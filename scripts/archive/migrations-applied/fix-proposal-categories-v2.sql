-- Fix proposal category constraint to include wavewarz and social
-- Run in Supabase SQL Editor

-- Drop the old constraint (may be named different things depending on which migration ran)
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_category_check;

-- Add updated constraint with all 7 categories
ALTER TABLE proposals ADD CONSTRAINT proposals_category_check
  CHECK (category IN ('general', 'technical', 'community', 'governance', 'treasury', 'wavewarz', 'social'));
