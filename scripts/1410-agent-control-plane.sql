-- ============================================================================
-- Agent Control Plane: Machine Execution Layer for Two-Plane OS
-- ============================================================================
-- ADDITIVE MIGRATION: Creates agent_runs and receipts tables for the machine
-- execution plane of Brandon's two-plane agent OS.
--
-- This migration is SAFE: uses CREATE TABLE IF NOT EXISTS only. No alter to
-- existing tables. RLS matches repo convention (service-role-only writes).
--
-- APPLY ONLY VIA SUPABASE: Use the Supabase SQL editor or a managed branch.
-- DO NOT apply to production until Zaal approves.
-- Reviewed-by: Zaal (gated before apply)
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: agent_runs
-- ============================================================================
-- Tracks every autonomous agent assignment and its execution state.
-- Couples to public.tasks via task_id (not a foreign key - tasks is mutable).
-- Lease model: only one agent holds the lease at a time (lease_owner field).
--
-- Status lifecycle: queued -> routing -> running -> awaiting_approval ->
--   verifying -> done/failed/cancelled
--
-- Budget: JSON object with optional fields:
--   { computeLimit?: number, externalSpendLimit?: number, deadline?: ISO8601 }
--
-- Visibility: 'private' (team only), 'team' (team + observers), 'public' (all)
-- Approval state: 'auto' (no approval), 'pending', 'approved', 'rejected'
--
-- Idempotency key ensures same assignment (same task_id + objective + input digest)
-- never creates duplicate runs.
--
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the human board (not a hard FK - tasks.id may be soft-deleted)
  task_id TEXT NULL,

  -- Link to the assignment (not a hard FK - assignments may be external)
  assignment_id UUID NOT NULL UNIQUE,

  -- What work is being done (from the assignment)
  objective TEXT NOT NULL,

  -- Capabilities required (array of strings, e.g. ['read_farcaster', 'post_x'])
  required_capabilities TEXT[] NOT NULL DEFAULT '{}',

  -- Current state of execution
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'routing', 'running', 'awaiting_approval',
    'verifying', 'done', 'failed', 'cancelled'
  )),

  -- Which agent is assigned (agent identity, e.g. 'zol', 'zai', or a fid)
  assigned_agent TEXT NULL,

  -- Lease holder (which process/thread owns this run)
  lease_owner TEXT NULL,

  -- When the lease expires (for cleanup + collision detection)
  lease_expires_at TIMESTAMPTZ NULL,

  -- Retry count (for transient failures)
  retries INT NOT NULL DEFAULT 0,

  -- Budget constraints (JSON: {computeLimit, externalSpendLimit, deadline})
  budget JSONB NULL DEFAULT NULL,

  -- Approval state if this run needs human sign-off
  approval_state TEXT NOT NULL DEFAULT 'auto' CHECK (approval_state IN (
    'auto', 'pending', 'approved', 'rejected'
  )),

  -- Visibility: who can see this run
  visibility TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN (
    'private', 'team', 'public'
  )),

  -- Idempotency key: (task_id, objective, input_digest) -> unique run
  -- Prevents duplicate assignments if the same request is retried
  idempotency_key TEXT NOT NULL UNIQUE,

  -- Audit trail
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Future: external integration IDs (reserved for Brandon's Gateway)
  -- linear_issue_id TEXT NULL,  -- NOT USED per Zaal adjustment #2

  CONSTRAINT assignment_id_not_empty CHECK (assignment_id IS NOT NULL)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_runs_task_id ON agent_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_assignment_id ON agent_runs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_assigned_agent ON agent_runs(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_agent_runs_idempotency_key ON agent_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_agent_runs_lease_owner ON agent_runs(lease_owner);

-- ============================================================================
-- TABLE: receipts
-- ============================================================================
-- Proof of every action an agent takes (proof-drop alignment).
-- Not the full evidence blob (that's in external storage), but the INDEX
-- of actions for audit + replay.
--
-- Approval class: 'auto' (no approval needed), 'user_confirm' (needs user),
--   'external_spend' (financial action), 'on_chain' (blockchain action)
--
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which run produced this receipt
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,

  -- Identity of the agent that took the action
  agent_identity TEXT NOT NULL,

  -- Capability used (e.g. 'post_farcaster', 'post_x', 'read_onchain_state')
  capability TEXT NOT NULL,

  -- Specific tool invoked (e.g. 'neynar_api', 'x_api', 'wagmi')
  tool TEXT NOT NULL,

  -- The action taken (e.g. 'post_cast', 'get_token_holders')
  action TEXT NOT NULL,

  -- Digest of the input (SHA256 hash of request body, for deduplication)
  input_digest TEXT NULL,

  -- Type of result: 'success', 'error', 'pending_approval', 'rate_limited'
  result_type TEXT NOT NULL,

  -- Approval required: 'auto', 'user_confirm', 'external_spend', 'on_chain'
  -- Tells the auditor which receipts need review
  approval_class TEXT NOT NULL DEFAULT 'auto' CHECK (approval_class IN (
    'auto', 'user_confirm', 'external_spend', 'on_chain'
  )),

  -- URL to the evidence (external storage: S3, IPFS, etc.)
  evidence_url TEXT NULL,

  -- Timestamp when action was taken
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT run_id_not_empty CHECK (run_id IS NOT NULL)
);

-- Indexes for audit + replay
CREATE INDEX IF NOT EXISTS idx_receipts_run_id ON receipts(run_id);
CREATE INDEX IF NOT EXISTS idx_receipts_agent_identity ON receipts(agent_identity);
CREATE INDEX IF NOT EXISTS idx_receipts_capability ON receipts(capability);
CREATE INDEX IF NOT EXISTS idx_receipts_approval_class ON receipts(approval_class);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- ============================================================================
-- RLS POLICIES: Service-Role Write, Team-Scoped Read
-- ============================================================================
-- Pattern: service-role (getSupabaseAdmin) does all mutations; authenticated
-- clients may read team-internal runs (not public runs, not private ones they
-- don't own).
--
-- This matches the repo's RLS convention (see cowork-rls-hardening.sql).

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- agent_runs: Service role full access, authenticated role cannot write
CREATE POLICY "agent_runs_service_role_all" ON agent_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- receipts: Service role full access, authenticated role cannot write
CREATE POLICY "receipts_service_role_all" ON receipts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Future: Add authenticated SELECT policies if the app needs to query these
-- tables from the browser. For now, service-role-only keeps attack surface
-- minimal (matches cowork board model).

-- ============================================================================
-- COMMENTS: Structural documentation for future integrations
-- ============================================================================
COMMENT ON TABLE agent_runs IS 'Machine execution plane: tracks autonomous assignments and their state. Couples to public.tasks via task_id. Lease model: only one process holds lease at a time (collision detection via lease_owner + lease_expires_at).';
COMMENT ON TABLE receipts IS 'Audit trail for agent actions. Proof-drop alignment: not the full evidence, but the index of every action. Approval_class tells auditors which receipts need review (external_spend, on_chain, etc.).';
COMMENT ON COLUMN agent_runs.assignment_id IS 'Unique identifier for this assignment (UUID). Not the task_id - assignments may split from tasks or exist independently.';
COMMENT ON COLUMN agent_runs.idempotency_key IS 'Deduplication key: (task_id + objective + input_digest). Same request will not create duplicate runs.';
COMMENT ON COLUMN agent_runs.lease_owner IS 'Which process holds the lease. Only one process may execute this run. Collision detection via lease_expires_at.';
COMMENT ON COLUMN receipts.input_digest IS 'SHA256 of the request body (for deduplication). Pair with tool + action to detect retry storms.';
COMMENT ON COLUMN receipts.approval_class IS 'Which receipts need review: auto (none), user_confirm (user sign-off), external_spend (financial), on_chain (blockchain).';

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After applying this migration, verify via Supabase UI:
--
-- 1. agent_runs table exists with all columns
-- 2. receipts table exists with all columns
-- 3. Indexes are created (check Indexes tab in Supabase UI)
-- 4. RLS policies are active (check in RLS policy tab)
-- 5. Foreign key: receipts.run_id -> agent_runs.id is live
--
-- Then proceed to: apply TypeScript types, wire n8n bridge (spec in doc 1410)
