ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS ai_summary_generated_at timestamptz;
