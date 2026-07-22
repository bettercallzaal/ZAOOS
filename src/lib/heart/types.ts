/**
 * Heart V1 Types: Lease Management Core
 *
 * Types for the operational-runtime lease layer.
 * Maps to agent_runs table structure for race-safe lease operations.
 */

import type { RunStatus } from '@/lib/agents/control-plane';

/**
 * AgentRunRow: Database row as returned by Supabase.
 * All fields are strings (TIMESTAMPTZ serialized as ISO8601, JSON as string).
 */
export interface AgentRunRow {
  id: string;
  task_id: string | null;
  assignment_id: string;
  objective: string;
  required_capabilities: string[];
  status: RunStatus;
  assigned_agent: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  retries: number;
  budget: Record<string, unknown> | null;
  approval_state: string;
  visibility: string;
  idempotency_key: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * LeaseAcquisitionResult: Outcome of attempting to acquire a lease.
 */
export interface LeaseAcquisitionResult {
  /** True if the lease was acquired, false if collision (another owner holds it) */
  acquired: boolean;
  /** The run, possibly updated with new lease info */
  run: AgentRunRow | null;
  /** Reason for failure (if acquired = false) */
  reason?: string;
}

/**
 * ExpiredLeaseRecoverySummary: Results from reclaimExpiredLeases.
 */
export interface ExpiredLeaseRecoverySummary {
  /** Number of runs that were reset to 'ready' */
  reclaimedCount: number;
  /** IDs of the runs that were reclaimed */
  reclaimedIds: string[];
  /** Any errors encountered during reclaim */
  errors: Array<{ runId: string; error: string }>;
}
