import { describe, it, expect } from 'vitest';
import { reclaimDeadInstanceRuns } from '../liveness';
import type { LivenessStore, AgentInstanceRow } from '../../../../packages/heart-fleet/src/index';
import type { AgentRunRow } from '../types';

/**
 * Happy-path coverage for the delegated reclaimDeadInstanceRuns (doc 2149).
 * The pre-existing liveness tests cover the pure helpers; the DB reclaim path
 * had none. This injects a fake LivenessStore via the new `opts.store` seam to
 * prove the delegation behaves: a dead instance's leased runs are reset, a live
 * instance's runs are untouched.
 */

const NOW = new Date('2026-07-30T10:00:00.000Z');

class FakeStore implements LivenessStore {
  instances: AgentInstanceRow[] = [];
  runs = new Map<string, AgentRunRow>();
  now() { return NOW; }
  async liveInstances() { return this.instances.filter((i) => i.status !== 'dead'); }
  async markInstancesDead(ids: string[]) {
    for (const i of this.instances) if (ids.includes(i.instance_id)) i.status = 'dead';
  }
  async runsOwnedBy(owners: string[], limit: number) {
    return [...this.runs.values()]
      .filter((r) => r.lease_owner !== null && owners.includes(r.lease_owner) && ['leased', 'running'].includes(r.status))
      .slice(0, limit);
  }
  async reclaimRun(runId: string, expectedOwner: string, retries: number) {
    const r = this.runs.get(runId);
    if (!r || r.lease_owner !== expectedOwner) return false;
    this.runs.set(runId, { ...r, status: 'ready', lease_owner: null, lease_expires_at: null, retries });
    return true;
  }
}

function inst(id: string, secsAgo: number): AgentInstanceRow {
  return { instance_id: id, hostname: 'h', pid: 1, status: 'alive', started_at: NOW.toISOString(), last_heartbeat: new Date(NOW.getTime() - secsAgo * 1000).toISOString(), metadata: null };
}
function run(id: string, owner: string): AgentRunRow {
  return { id, task_id: null, assignment_id: 'a', objective: 'o', required_capabilities: [], status: 'leased', assigned_agent: null, lease_owner: owner, lease_expires_at: NOW.toISOString(), retries: 0, budget: null, approval_state: 'auto', visibility: 'team', idempotency_key: id, created_by: 't', created_at: NOW.toISOString(), updated_at: NOW.toISOString() };
}

describe('reclaimDeadInstanceRuns (delegated)', () => {
  it('resets runs owned by a dead instance, leaves live-owned runs alone', async () => {
    const store = new FakeStore();
    store.instances = [inst('dead-1', 200), inst('live-1', 5)]; // 200s > 90s TTL
    store.runs.set('r1', run('r1', 'dead-1'));
    store.runs.set('r2', run('r2', 'live-1'));

    const summary = await reclaimDeadInstanceRuns({ store });
    expect(summary.deadInstanceIds).toEqual(['dead-1']);
    expect(summary.reclaimedIds).toEqual(['r1']);
    expect(summary.reclaimedCount).toBe(1);
    expect(store.runs.get('r1')?.status).toBe('ready');
    expect(store.runs.get('r1')?.retries).toBe(1);
    expect(store.runs.get('r2')?.status).toBe('leased');
  });

  it('no dead instances = zero work', async () => {
    const store = new FakeStore();
    store.instances = [inst('live-1', 5)];
    const summary = await reclaimDeadInstanceRuns({ store });
    expect(summary.reclaimedCount).toBe(0);
    expect(summary.deadInstanceIds).toEqual([]);
  });
});
