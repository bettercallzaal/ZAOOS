/**
 * Heart V1: Operational Runtime Lease Core
 *
 * Public API for the Heart module.
 * - Lease management (acquire, renew, release)
 * - Expired lease recovery (reclaim dead-agent work)
 * - Pure helpers (isLeaseExpired, canAcquire)
 */

export { acquireLease, renewLease, releaseLease, reclaimExpiredLeases, isLeaseExpired, canAcquire } from './lease-manager';
export {
  registerInstance,
  heartbeat,
  drainInstance,
  reclaimDeadInstanceRuns,
  isInstanceExpired,
  deadInstanceIds,
  runsLeasedToDeadInstances,
  DEFAULT_LIVENESS_TTL_MS,
} from './liveness';
export type {
  AgentRunRow,
  LeaseAcquisitionResult,
  ExpiredLeaseRecoverySummary,
  AgentInstanceRow,
  InstanceStatus,
  DeadInstanceReclaimSummary,
} from './types';
