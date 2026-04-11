-- Fix proposal category mismatch
-- The DB constraint allowed 'music' and 'tech', but the Zod schema and UI
-- use 'community' and 'technical'. This aligns the DB to match.

-- Update any existing rows with old values first
UPDATE proposals SET category = 'technical' WHERE category = 'tech';
UPDATE proposals SET category = 'community' WHERE category = 'music';

-- Drop the old constraint and add the corrected one
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_category_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_category_check
  CHECK (category IN ('general', 'technical', 'community', 'governance', 'treasury'));
