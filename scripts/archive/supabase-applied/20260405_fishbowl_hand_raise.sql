ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS hand_raises jsonb NOT NULL DEFAULT '[]';
