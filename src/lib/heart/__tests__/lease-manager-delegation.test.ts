import { describe, it, expect, beforeEach } from 'vitest';
import { acquireLease, reclaimExpiredLeases } from '../lease-manager';
import { MemoryLeaseStore } from '../../../../packages/heart-fleet/src/index';
import type { AgentRunRow } from '../types';

/**
 * Happy-path coverage for the shared-core delegation (doc 2149 Option A).
 * The pre-existing lease-manager tests only exercised input VALIDATION (the DB
 * path "fails in test env"); this suite injects a MemoryLeaseStore via the new
 * `opts.store` seam to prove the DELEGATED acquire + reclaim actually behave -
 * coverage the module never had - and that `maxRetries: Infinity` preserves the
 * historical no-quarantine behavior (no run ever goes to 'quarantined').
 */

const RUN_ID = '550e8400-e29b-41d4-a716-446655440000';
const T0 = new Date('2026-07-20T10:00:00.000Z');

function makeRow(over?: Partial<AgentRunRow>): Omit<AgentRunRow, 'created_at' | 'updated_at'> {
  return {
    id: RUN_ID, task_id: null, assignment_id: 'a', objective: 'o', required_capabilities: [],
    status: 'ready', assigned_agent: null, lease_owner: null, lease_expires_at: null, retries: 0,
    budget: null, approval_state: 'auto', visibility: 'team', idempotency_key: 'k', created_by: 't',
    ...over,
  };
}

let store: MemoryLeaseStore;

beforeEach(() => {
  store = new MemoryLeaseStore(T0);
});

describe('acquireLease (delegated)', () => {
  it('acquires a ready run and returns it leased', async () => {
    store.insert(makeRow());
    const res = await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    expect(res.acquired).toBe(true);
    expect(res.run?.status).toBe('leased');
    expect(res.run?.lease_owner).toBe('agent-1');
  });

  it('collides when the run is already leased and NOT expired', async () => {
    store.insert(makeRow());
    await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    const res = await acquireLease({ runId: RUN_ID, owner: 'agent-2', ttlSeconds: 60 }, { store });
    expect(res.acquired).toBe(false);
  });

  it('takes over an EXPIRED lease', async () => {
    store.insert(makeRow());
    await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    store.advance(61_000); // past the TTL
    const res = await acquireLease({ runId: RUN_ID, owner: 'agent-2', ttlSeconds: 60 }, { store });
    expect(res.acquired).toBe(true);
    expect(res.run?.lease_owner).toBe('agent-2');
  });

  it('returns a not-found reason for a missing run (no throw)', async () => {
    const res = await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    expect(res.acquired).toBe(false);
    expect(res.run).toBeNull();
  });
});

describe('reclaimExpiredLeases (delegated)', () => {
  it('resets an expired lease to ready and increments retries', async () => {
    store.insert(makeRow());
    await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    store.advance(61_000);
    const summary = await reclaimExpiredLeases({ store });
    expect(summary.reclaimedIds).toEqual([RUN_ID]);
    const row = await store.getRun(RUN_ID);
    expect(row?.status).toBe('ready');
    expect(row?.retries).toBe(1);
    expect(row?.lease_owner).toBeNull();
  });

  it('does NOT reclaim a live (unexpired) lease', async () => {
    store.insert(makeRow());
    await acquireLease({ runId: RUN_ID, owner: 'agent-1', ttlSeconds: 60 }, { store });
    store.advance(30_000); // still inside TTL
    const summary = await reclaimExpiredLeases({ store });
    expect(summary.reclaimedCount).toBe(0);
  });

  it('NEVER quarantines - preserves the historical no-ceiling behavior (maxRetries Infinity)', async () => {
    store.insert(makeRow());
    // Bounce the run through many acquire/expire/reclaim cycles - far past the
    // package's default retry ceiling of 5. With Infinity it must stay reclaimable.
    for (let i = 0; i < 8; i++) {
      await acquireLease({ runId: RUN_ID, owner: `agent-${i}`, ttlSeconds: 60 }, { store });
      store.advance(61_000);
      const summary = await reclaimExpiredLeases({ store });
      expect(summary.reclaimedIds).toEqual([RUN_ID]);
    }
    const row = await store.getRun(RUN_ID);
    expect(row?.status).toBe('ready'); // NOT 'quarantined'
    expect(row?.retries).toBe(8);
  });
});
