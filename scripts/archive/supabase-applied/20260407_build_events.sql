-- Build events for ZOE dashboard code ship flow
CREATE TABLE IF NOT EXISTS build_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,
  title         text,
  url           text,
  branch        text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_build_events_type ON build_events(event_type);
CREATE INDEX idx_build_events_created ON build_events(created_at DESC);

ALTER TABLE build_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read build events" ON build_events FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON build_events FOR INSERT WITH CHECK (true);

-- Add chain_id to agent_events for task chains
ALTER TABLE agent_events ADD COLUMN IF NOT EXISTS chain_id uuid;
CREATE INDEX IF NOT EXISTS idx_agent_events_chain ON agent_events(chain_id) WHERE chain_id IS NOT NULL;
