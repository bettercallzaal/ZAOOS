/**
 * heart-fleet lease core: acquire / renew / release / reclaim with fencing
 * tokens, retry ceilings, execution receipts, and contention metrics.
 *
 * Port of src/lib/heart/lease-manager.ts semantics onto the injected
 * LeaseStore contract. All mutations are conditional updates - no
 * read-then-write commits; collision detection is the null return.
 */
import { canonicalize, sha256Hex } from './canonical';
import {
  type AcquireResult,
  type AgentRunRow,
  type FencingToken,
  type HeartEvent,
  type HeartMetrics,
  type HeartReceipt,
  type LeaseStore,
  type ReceiptSink,
  type ReclaimSummary,
  type RunStatus,
  newMetrics,
} from './types';

export interface HeartOptions {
  store: LeaseStore;
  /** Receipt sink; defaults to in-memory (readable via receipts()). */
  onReceipt?: ReceiptSink;
  /** Reclaims beyond this retry count quarantine instead of re-readying. */
  maxRetries?: number;
}

const DEFAULT_MAX_RETRIES = 5;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export class HeartFleet {
  private readonly store: LeaseStore;
  private readonly maxRetries: number;
  private readonly sink: ReceiptSink;
  private readonly collected: HeartReceipt[] = [];
  readonly metrics: HeartMetrics = newMetrics();

  constructor(opts: HeartOptions) {
    this.store = opts.store;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.sink = opts.onReceipt ?? ((r) => this.collected.push(r));
  }

  /** In-memory receipts when no sink was injected. */
  receipts(): readonly HeartReceipt[] {
    return this.collected;
  }

  private emit(event: HeartEvent, runId: string, owner: string, leaseExpiresAt: string | null, effectKey: string | null = null): void {
    const at = this.store.now().toISOString();
    const receipt: HeartReceipt = Object.freeze({
      schemaVersion: 'zao.heart.receipt.v1',
      event,
      runId,
      owner,
      leaseExpiresAt,
      effectKey,
      at,
      digest: `sha256:dreamnet-sorted-json:v0:${sha256Hex(canonicalize({ event, runId, owner, leaseExpiresAt, effectKey }))}`,
    });
    try {
      this.sink(receipt);
    } catch {
      // A broken sink must never break the lease layer.
    }
  }

  isLeaseExpired(run: AgentRunRow, now: Date): boolean {
    if (!run.lease_expires_at) return true;
    return new Date(run.lease_expires_at) <= now;
  }

  canAcquire(run: AgentRunRow, now: Date): boolean {
    if (run.status === 'ready') return true;
    if ((run.status === 'leased' || run.status === 'running') && this.isLeaseExpired(run, now)) return true;
    return false;
  }

  /** Atomically claim a ready run or an expired lease. Returns a fencing token on win. */
  async acquire(runId: string, owner: string, ttlSeconds: number): Promise<AcquireResult> {
    if (!isNonEmptyString(runId) || !isNonEmptyString(owner) || !(Number.isInteger(ttlSeconds) && ttlSeconds > 0)) {
      return { acquired: false, run: null, reason: 'Invalid input' };
    }
    this.metrics.acquireAttempts++;
    const now = this.store.now();
    const leaseExpiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const run = await this.store.getRun(runId);
    if (!run) return { acquired: false, run: null, reason: 'Run not found' };
    if (!this.canAcquire(run, now)) {
      this.metrics.acquireCollisions++;
      return { acquired: false, run, reason: `Cannot acquire: status '${run.status}', lease not expired` };
    }

    const updates: Partial<AgentRunRow> = {
      lease_owner: owner,
      lease_expires_at: leaseExpiresAt,
      status: 'leased' as RunStatus,
      updated_at: now.toISOString(),
    };
    const updated =
      run.status === 'ready'
        ? await this.store.conditionalUpdate(runId, updates, { eq: { status: 'ready' } })
        : await this.store.conditionalUpdate(runId, updates, {
            // Expired-lease takeover: only if neither status nor expiry moved.
            eq: { status: run.status, lease_expires_at: run.lease_expires_at },
          });

    if (!updated) {
      this.metrics.acquireCollisions++;
      return { acquired: false, run, reason: 'Collision: another owner won the lease' };
    }
    this.metrics.acquireWins++;
    const fence: FencingToken = Object.freeze({ runId, owner, leaseExpiresAt });
    this.emit('acquired', runId, owner, leaseExpiresAt);
    return { acquired: true, run: updated, fence };
  }

  /**
   * Extend a held lease. Fenced: succeeds only if THIS token still matches the
   * row (owner AND exact expiry). Returns the RENEWED token or null.
   */
  async renew(fence: FencingToken, ttlSeconds: number): Promise<FencingToken | null> {
    const now = this.store.now();
    const leaseExpiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const updated = await this.store.conditionalUpdate(
      fence.runId,
      { lease_expires_at: leaseExpiresAt, updated_at: now.toISOString() },
      {
        eq: { lease_owner: fence.owner, lease_expires_at: fence.leaseExpiresAt },
        in: { status: ['leased', 'running'] },
      },
    );
    if (!updated) {
      this.metrics.renewFailures++;
      this.emit('fence_rejected', fence.runId, fence.owner, fence.leaseExpiresAt);
      return null;
    }
    this.metrics.renews++;
    this.emit('renewed', fence.runId, fence.owner, leaseExpiresAt);
    return Object.freeze({ runId: fence.runId, owner: fence.owner, leaseExpiresAt });
  }

  /** Release to a terminal status. Fenced on owner + exact expiry. */
  async release(fence: FencingToken, nextStatus: 'completed' | 'failed' | 'cancelled'): Promise<AgentRunRow | null> {
    const now = this.store.now();
    const updated = await this.store.conditionalUpdate(
      fence.runId,
      { lease_owner: null, lease_expires_at: null, status: nextStatus, updated_at: now.toISOString() },
      { eq: { lease_owner: fence.owner, lease_expires_at: fence.leaseExpiresAt } },
    );
    if (!updated) {
      this.metrics.releaseFailures++;
      this.emit('fence_rejected', fence.runId, fence.owner, fence.leaseExpiresAt);
      return null;
    }
    this.metrics.releases++;
    this.emit('released', fence.runId, fence.owner, null);
    return updated;
  }

  /**
   * Atomically re-verify a fence RIGHT NOW (conditional no-op update). True
   * only if this exact token still owns a live lease. The last check before
   * any irreversible side effect.
   */
  async verifyFence(fence: FencingToken): Promise<boolean> {
    const now = this.store.now();
    const updated = await this.store.conditionalUpdate(
      fence.runId,
      { updated_at: now.toISOString() },
      {
        eq: { lease_owner: fence.owner, lease_expires_at: fence.leaseExpiresAt },
        in: { status: ['leased', 'running'] },
      },
    );
    if (!updated || this.isLeaseExpired(updated, now)) {
      this.metrics.fenceRejections++;
      this.emit('fence_rejected', fence.runId, fence.owner, fence.leaseExpiresAt);
      return false;
    }
    this.metrics.fenceVerifications++;
    this.emit('fence_verified', fence.runId, fence.owner, fence.leaseExpiresAt);
    return true;
  }

  /**
   * Recovery: reset expired leases to 'ready' (incrementing retries), or
   * QUARANTINE runs that hit the retry ceiling - a poisoned run must not
   * bounce forever. Conditional on the exact expiry so a mid-scan renewal
   * is never clobbered.
   */
  async reclaimExpired(options?: { limit?: number }): Promise<ReclaimSummary> {
    const limit = options?.limit ?? 100;
    const now = this.store.now();
    const summary: ReclaimSummary = { reclaimedCount: 0, reclaimedIds: [], quarantinedIds: [], errors: [] };

    let expired: AgentRunRow[];
    try {
      expired = await this.store.findExpiredLeases(now.toISOString(), limit);
    } catch (error: unknown) {
      summary.errors.push({ runId: 'unknown', error: error instanceof Error ? error.message : String(error) });
      return summary;
    }

    for (const run of expired) {
      const hitCeiling = (run.retries ?? 0) + 1 > this.maxRetries;
      const updates: Partial<AgentRunRow> = hitCeiling
        ? { status: 'quarantined', lease_owner: null, lease_expires_at: null, retries: (run.retries ?? 0) + 1, updated_at: now.toISOString() }
        : { status: 'ready', lease_owner: null, lease_expires_at: null, retries: (run.retries ?? 0) + 1, updated_at: now.toISOString() };
      try {
        const updated = await this.store.conditionalUpdate(run.id, updates, {
          eq: { lease_expires_at: run.lease_expires_at },
        });
        if (!updated) {
          summary.errors.push({ runId: run.id, error: 'No rows updated (renewed mid-scan)' });
        } else if (hitCeiling) {
          summary.quarantinedIds.push(run.id);
          this.metrics.quarantines++;
          this.emit('quarantined', run.id, run.lease_owner ?? 'unknown', null);
        } else {
          summary.reclaimedIds.push(run.id);
          summary.reclaimedCount++;
          this.metrics.reclaims++;
          this.emit('reclaimed', run.id, run.lease_owner ?? 'unknown', null);
        }
      } catch (error: unknown) {
        summary.errors.push({ runId: run.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return summary;
  }
}
