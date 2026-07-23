-- ============================================================================
-- agent_instances: proactive liveness for the Heart (Brandon's next milestone)
-- ============================================================================
-- The recovery suite (doc 2027) recovers REACTIVELY - runs wait out their lease
-- TTL. This table adds PROACTIVE recovery: each worker registers an instance and
-- heartbeats; a stale heartbeat declares the instance dead and its leased runs
-- are reclaimed at once (reclaimDeadInstanceRuns in src/lib/heart/liveness.ts).
--
-- agent_runs.lease_owner references agent_instances.instance_id (logical, not a
-- hard FK - lease_owner predates this table and may hold legacy values).
--
-- SAFE: CREATE TABLE IF NOT EXISTS only. No alter to agent_runs.
-- APPLY ONLY VIA SUPABASE. DO NOT apply to production until Zaal approves.
-- Reviewed-by: Zaal (gated before apply)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS agent_instances (
  instance_id TEXT PRIMARY KEY,
  hostname TEXT,
  pid INTEGER,
  status TEXT NOT NULL DEFAULT 'alive'
    CHECK (status = ANY (ARRAY['alive','draining','dead'])),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- The reclaim scan: find non-dead instances ordered by heartbeat staleness.
CREATE INDEX IF NOT EXISTS agent_instances_status_heartbeat_idx
  ON agent_instances (status, last_heartbeat);

ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='agent_instances' AND policyname='agent_instances_service_role'
  ) THEN
    CREATE POLICY agent_instances_service_role ON agent_instances
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-APPLY (code, already merged): workers call registerInstance() at boot,
-- heartbeat() on a timer, and the Heart calls reclaimDeadInstanceRuns() on its
-- recovery tick. Until applied, those functions throw only if invoked - the
-- pure helpers (isInstanceExpired/deadInstanceIds/runsLeasedToDeadInstances)
-- need no table and are unit-tested.
-- ============================================================================
