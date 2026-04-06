-- Agent Events table for squad dashboard
CREATE TABLE IF NOT EXISTS agent_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    text NOT NULL,
  event_type    text NOT NULL,
  summary       text,
  payload       jsonb DEFAULT '{}',
  dispatched_by text,
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX idx_agent_events_agent_name ON agent_events(agent_name);
CREATE INDEX idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON agent_events(created_at DESC);
CREATE INDEX idx_agent_events_unnotified ON agent_events(notified_at) WHERE notified_at IS NULL;

-- RLS
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent events"
  ON agent_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert"
  ON agent_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update"
  ON agent_events FOR UPDATE
  USING (true);
