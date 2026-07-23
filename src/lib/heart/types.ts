/**
 * Heart V1 Types: Lease Management Core
 *
 * Types for the operational-runtime lease layer.
 * Maps to agent_runs table structure for race-safe lease operations.
 */

/**
 * Agent run status: the complete lifecycle of a machine assignment.
 */
export type RunStatus =
  | 'created'
  | 'ready'
  | 'leased'
  | 'running'
  | 'waiting_approval'
  | 'blocked'
  | 'verifying'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'quarantined';

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

/**
 * Instance liveness status. An instance heartbeats while alive; when its
 * heartbeat goes stale it is declared dead and its leased runs are reclaimed
 * PROACTIVELY (without waiting for each run's lease TTL to expire).
 */
export type InstanceStatus = 'alive' | 'draining' | 'dead';

/**
 * AgentInstanceRow: a registered worker process. lease_owner on agent_runs
 * references instance_id here.
 */
export interface AgentInstanceRow {
  instance_id: string;
  hostname: string | null;
  pid: number | null;
  status: InstanceStatus;
  started_at: string;
  last_heartbeat: string;
  metadata: Record<string, unknown> | null;
}

/**
 * DeadInstanceReclaimSummary: results from reclaimDeadInstanceRuns.
 */
export interface DeadInstanceReclaimSummary {
  /** Instance ids that were declared dead this cycle. */
  deadInstanceIds: string[];
  /** Number of runs reset to 'ready' because their owner was dead. */
  reclaimedCount: number;
  /** IDs of the runs that were reclaimed. */
  reclaimedIds: string[];
  /** Any errors encountered. */
  errors: Array<{ id: string; error: string }>;
}
