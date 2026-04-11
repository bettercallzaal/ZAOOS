-- Add scheduling fields to fishbowl rooms
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS auto_activate boolean NOT NULL DEFAULT false;

-- Update state check to include 'scheduled'
ALTER TABLE fishbowl_rooms DROP CONSTRAINT IF EXISTS fishbowl_rooms_state_check;
ALTER TABLE fishbowl_rooms ADD CONSTRAINT fishbowl_rooms_state_check
  CHECK (state IN ('scheduled', 'active', 'paused', 'ended'));

CREATE INDEX IF NOT EXISTS idx_fishbowl_rooms_scheduled ON fishbowl_rooms (scheduled_at) WHERE state = 'scheduled';
