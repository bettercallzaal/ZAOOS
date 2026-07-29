/**
 * executeWithLease - the connective tissue that wires the Heart into the
 * execution path. Before this, the Heart's lease-manager governed nothing that
 * actually runs (nothing outside src/lib/heart called acquireLease).
 *
 * Given a run identity, it acquires a lease (fencing: if another owner holds it,
 * the work is SKIPPED, not double-run), runs the work while renewing the lease
 * on a heartbeat, and releases it on completion/failure. The recovery cron
 * reclaims the lease if the process dies mid-run.
 *
 * This is the one-instance-per-resource guarantee made real. Flag-guarded at the
 * call sites (default off) so it can be enabled deliberately and rolled back
 * instantly.
 */
import { acquireLease, renewLease, releaseLease } from './lease-manager';

export interface LeaseGuardOpts {
  /** UUID of the agent_runs row that represents this resource (per-resource for a mutex). */
  runId: string;
  /** This instance's identity (hostname/process id). */
  owner: string;
  /** Lease TTL in seconds. */
  ttlSeconds: number;
  /** How often to renew (ms). Default: ttl/2, min 1s. */
  renewEveryMs?: number;
}

export type LeaseGuardOutcome<T> =
  | { ran: true; result: T }
  | { ran: false; reason: 'lease-held' | 'lease-error' };

/**
 * Run `work` only if we can acquire the lease. Fencing + heartbeat + release.
 * Never throws for lease reasons; rethrows an error thrown BY `work` (after
 * releasing with nextStatus 'failed').
 */
export async function executeWithLease<T>(
  opts: LeaseGuardOpts,
  work: () => Promise<T>,
): Promise<LeaseGuardOutcome<T>> {
  const acq = await acquireLease({ runId: opts.runId, owner: opts.owner, ttlSeconds: opts.ttlSeconds });
  if (!acq || acq.acquired !== true) {
    // run === null means acquireLease could not even find/parse the run (a real
    // error); otherwise another owner holds the lease (a normal collision -> skip).
    const reason = acq && acq.run === null ? 'lease-error' : 'lease-held';
    return { ran: false, reason };
  }

  const renewMs = opts.renewEveryMs ?? Math.max(1000, Math.floor((opts.ttlSeconds * 1000) / 2));
  const heartbeat = setInterval(() => {
    void renewLease({ runId: opts.runId, owner: opts.owner, ttlSeconds: opts.ttlSeconds }).catch(() => {});
  }, renewMs);
  if (typeof heartbeat === 'object' && 'unref' in heartbeat) (heartbeat as { unref: () => void }).unref();

  let ok = false;
  try {
    const result = await work();
    ok = true;
    return { ran: true, result };
  } finally {
    clearInterval(heartbeat);
    await releaseLease({ runId: opts.runId, owner: opts.owner, nextStatus: ok ? 'completed' : 'failed' }).catch(() => {});
  }
}
