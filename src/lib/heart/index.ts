/**
 * Heart V1: Operational Runtime Lease Core
 *
 * Public API for the Heart module.
 * - Lease management (acquire, renew, release)
 * - Expired lease recovery (reclaim dead-agent work)
 * - Pure helpers (isLeaseExpired, canAcquire)
 */

export { acquireLease, renewLease, releaseLease, reclaimExpiredLeases, isLeaseExpired, canAcquire } from './lease-manager';
export type { AgentRunRow, LeaseAcquisitionResult, ExpiredLeaseRecoverySummary } from './types';
