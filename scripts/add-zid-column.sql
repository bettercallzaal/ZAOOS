-- Add ZID (sequential membership number) to users table
-- ZID is admin-assigned. Lower number = earlier member = more OG.
--
-- ZID rules:
--   ZID 1–99:  Early testers & OGs who had ZAO tokens before March 2026
--   ZID 100+:  New members joining after launch
--
-- Assigned manually by admin via the admin panel "Assign ZID" button.

ALTER TABLE users ADD COLUMN IF NOT EXISTS zid INTEGER UNIQUE;

-- Sequence for assigning ZIDs atomically
-- Starts at 1 — admin manually assigns early testers first,
-- then bumps the sequence to 100 when ready for public.
CREATE SEQUENCE IF NOT EXISTS zid_seq START 1;

-- Function to atomically assign the next ZID to a user
CREATE OR REPLACE FUNCTION assign_next_zid(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  assigned_zid INTEGER;
BEGIN
  -- Only assign if user doesn't already have a ZID
  SELECT zid INTO assigned_zid FROM users WHERE id = target_user_id;
  IF assigned_zid IS NOT NULL THEN
    RETURN assigned_zid;
  END IF;

  -- Atomically get next value and assign
  assigned_zid := nextval('zid_seq');
  UPDATE users SET zid = assigned_zid WHERE id = target_user_id AND zid IS NULL;

  -- If another transaction beat us, return their ZID
  IF NOT FOUND THEN
    SELECT zid INTO assigned_zid FROM users WHERE id = target_user_id;
  END IF;

  RETURN assigned_zid;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════
-- AFTER assigning all early testers (ZIDs 1–99), run this
-- to make new members start at 100:
--
--   SELECT setval('zid_seq', 99);
--
-- The next "Assign ZID" click will give ZID 100.
-- ══════════════════════════════════════════════════════════════
