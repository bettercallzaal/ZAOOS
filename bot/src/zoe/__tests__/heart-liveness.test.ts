import { describe, it, expect } from 'vitest';
import {
  LivenessReclaimer,
  isInstanceExpired,
  deadInstanceIds,
  runsLeasedToDeadInstances,
  type LivenessStore,
  type AgentInstanceRow,
  type AgentRunRow,
} from '../../../../packages/heart-fleet/src/index';

/**
 * Ported dead-instance liveness reclaim (doc 2149). Pure helpers + the
 * LivenessReclaimer over an in-memory LivenessStore. Proves: a stale-heartbeat
 * instance is declared dead and its leased runs reset to ready; a run re-leased
 * by a live worker mid-reclaim is NOT clobbered (conditional update).
 */

const NOW = new Date('2026-07-30T10:00:00.000Z');

function inst(id: string, secsAgo: number, status: AgentInstanceRow['status'] = 'alive'): AgentInstanceRow {
  return {
    instance_id: id,
    hostname: 'h',
    pid: 1,
    status,
    started_at: NOW.toISOString(),
    last_heartbeat: new Date(NOW.getTime() - secsAgo * 1000).toISOString(),
    metadata: null,
  };
}

function run(id: string, owner: string | null, status: AgentRunRow['status'] = 'leased'): AgentRunRow {
  return {
    id, task_id: null, assignment_id: 'a', objective: 'o', required_capabilities: [],
    status, assigned_agent: null, lease_owner: owner, lease_expires_at: NOW.toISOString(), retries: 0,
    budget: null, approval_state: 'auto', visibility: 'internal', idempotency_key: id, created_by: 't',
    created_at: NOW.toISOString(), updated_at: NOW.toISOString(),
  };
}

describe('pure liveness helpers', () => {
  it('isInstanceExpired: stale heartbeat or dead status', () => {
    expect(isInstanceExpired(inst('a', 200), NOW)).toBe(true); // 200s > 90s TTL
    expect(isInstanceExpired(inst('a', 10), NOW)).toBe(false);
    expect(isInstanceExpired(inst('a', 1, 'dead'), NOW)).toBe(true);
  });

  it('deadInstanceIds filters by TTL', () => {
    expect(deadInstanceIds([inst('a', 200), inst('b', 5), inst('c', 100)], NOW)).toEqual(['a', 'c']);
  });

  it('runsLeasedToDeadInstances: only leased/running owned by dead ids', () => {
    const runs = [run('1', 'a'), run('2', 'b'), run('3', 'a', 'completed'), run('4', null)];
    expect(runsLeasedToDeadInstances(runs, ['a']).map((r) => r.id)).toEqual(['1']);
  });
});

class MemLivenessStore implements LivenessStore {
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
    if (!r || r.lease_owner !== expectedOwner) return false; // conditional: still owned
    this.runs.set(runId, { ...r, status: 'ready', lease_owner: null, lease_expires_at: null, retries });
    return true;
  }
}

describe('LivenessReclaimer', () => {
  it('reclaims runs owned by a dead instance and marks it dead', async () => {
    const store = new MemLivenessStore();
    store.instances = [inst('dead-1', 200), inst('live-1', 5)];
    store.runs.set('r1', run('r1', 'dead-1'));
    store.runs.set('r2', run('r2', 'live-1'));
    const reclaimer = new LivenessReclaimer({ store });

    const summary = await reclaimer.reclaimDeadInstanceRuns();
    expect(summary.deadInstanceIds).toEqual(['dead-1']);
    expect(summary.reclaimedIds).toEqual(['r1']);
    expect(store.runs.get('r1')?.status).toBe('ready');
    expect(store.runs.get('r1')?.retries).toBe(1);
    expect(store.runs.get('r2')?.status).toBe('leased'); // live owner untouched
    expect(store.instances.find((i) => i.instance_id === 'dead-1')?.status).toBe('dead');
  });

  it('does not clobber a run re-leased by a live worker mid-reclaim', async () => {
    const store = new MemLivenessStore();
    store.instances = [inst('dead-1', 200)];
    store.runs.set('r1', run('r1', 'dead-1'));
    // Simulate: between the read and the write, a live worker re-leases r1.
    const original = store.reclaimRun.bind(store);
    store.reclaimRun = async (runId, expectedOwner, retries) => {
      const r = store.runs.get(runId);
      if (r) store.runs.set(runId, { ...r, lease_owner: 'live-2' }); // re-leased
      return original(runId, expectedOwner, retries);
    };
    const summary = await new LivenessReclaimer({ store }).reclaimDeadInstanceRuns();
    expect(summary.reclaimedIds).toEqual([]); // NOT reclaimed
    expect(store.runs.get('r1')?.lease_owner).toBe('live-2'); // live worker keeps it
  });

  it('no dead instances = zero work', async () => {
    const store = new MemLivenessStore();
    store.instances = [inst('live-1', 5)];
    const summary = await new LivenessReclaimer({ store }).reclaimDeadInstanceRuns();
    expect(summary.reclaimedCount).toBe(0);
    expect(summary.deadInstanceIds).toEqual([]);
  });
});
