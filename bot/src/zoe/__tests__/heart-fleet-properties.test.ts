import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HeartFleet,
  MemoryLeaseStore,
  MemoryEffectLedger,
  executeWithLease,
  guardIrreversible,
  deterministicResourceId,
  canonicalize,
  sha256Hex,
  type AgentRunRow,
  type FencingToken,
} from '../../../../packages/heart-fleet/src/index';

/**
 * heart-fleet - the 5 safety properties, proven deterministically on the
 * MemoryLeaseStore (same conditional-update contract the Supabase adapter
 * implements as single atomic SQL UPDATEs).
 *
 *  P1  two workers cannot run the same resource concurrently
 *  P2  a killed worker's resource is safely recovered
 *  P3  a stale worker cannot commit after losing ownership (fencing)
 *  P4  retries do not duplicate external actions (effect ledger)
 *  P5  receipts reconcile with final state
 *
 * Plus: the package's canonicalize copy is pinned to the same DreamNet
 * cross-runtime fixtures as the app + bot copies (drift = failure here).
 */

const T0 = new Date('2026-07-30T00:00:00.000Z');

function makeRun(id: string, idempotencyKey: string): Omit<AgentRunRow, 'created_at' | 'updated_at'> {
  return {
    id,
    task_id: null,
    assignment_id: `assign:${id}`,
    objective: 'property test',
    required_capabilities: [],
    status: 'ready',
    assigned_agent: null,
    lease_owner: null,
    lease_expires_at: null,
    retries: 0,
    budget: null,
    approval_state: 'auto',
    visibility: 'internal',
    idempotency_key: idempotencyKey,
    created_by: 'test',
  };
}

const RUN_ID = '00000000-0000-4000-8000-000000000001';

let store: MemoryLeaseStore;
let heart: HeartFleet;

beforeEach(() => {
  store = new MemoryLeaseStore(T0);
  heart = new HeartFleet({ store });
  store.insert(makeRun(RUN_ID, 'prop:run:1'));
});

describe('P1 - mutual exclusion: two workers cannot hold one resource', () => {
  it('concurrent acquires: exactly one wins', async () => {
    const [a, b] = await Promise.all([
      heart.acquire(RUN_ID, 'worker-A', 60),
      heart.acquire(RUN_ID, 'worker-B', 60),
    ]);
    const wins = [a, b].filter((r) => r.acquired);
    expect(wins).toHaveLength(1);
    expect(heart.metrics.acquireWins).toBe(1);
    expect(heart.metrics.acquireCollisions).toBe(1);
  });

  it('second executeWithLease skips with lease-held while first is live', async () => {
    const first = await heart.acquire(RUN_ID, 'worker-A', 60);
    expect(first.acquired).toBe(true);
    const outcome = await executeWithLease(heart, { runId: RUN_ID, owner: 'worker-B', ttlSeconds: 60 }, async () => 'B-ran');
    expect(outcome).toEqual({ ran: false, reason: 'lease-held' });
  });
});

describe('P2 - killed worker recovery', () => {
  it('expired lease is reclaimed to ready (retries+1) and re-acquirable', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    expect(a.acquired).toBe(true);
    // Worker A dies: no renew, no release. Clock passes the TTL.
    store.advance(61_000);
    const summary = await heart.reclaimExpired();
    expect(summary.reclaimedIds).toEqual([RUN_ID]);
    const recovered = await store.getRun(RUN_ID);
    expect(recovered?.status).toBe('ready');
    expect(recovered?.retries).toBe(1);
    expect(recovered?.lease_owner).toBeNull();
    const b = await heart.acquire(RUN_ID, 'worker-B', 60);
    expect(b.acquired).toBe(true);
  });

  it('a renewed (live) lease is NOT reclaimed', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    expect(a.acquired && a.fence).toBeTruthy();
    store.advance(30_000);
    const renewed = await heart.renew(a.fence as FencingToken, 60);
    expect(renewed).not.toBeNull();
    store.advance(45_000); // past original expiry, inside renewed TTL
    const summary = await heart.reclaimExpired();
    expect(summary.reclaimedCount).toBe(0);
  });

  it('retry ceiling: a bouncing run is quarantined, not re-readied forever', async () => {
    const bounded = new HeartFleet({ store, maxRetries: 2 });
    for (let i = 0; i < 3; i++) {
      const acq = await bounded.acquire(RUN_ID, `worker-${i}`, 60);
      expect(acq.acquired).toBe(true);
      store.advance(61_000);
      const summary = await bounded.reclaimExpired();
      if (i < 2) {
        expect(summary.reclaimedIds).toEqual([RUN_ID]);
      } else {
        expect(summary.quarantinedIds).toEqual([RUN_ID]);
      }
    }
    const final = await store.getRun(RUN_ID);
    expect(final?.status).toBe('quarantined');
    expect(bounded.metrics.quarantines).toBe(1);
    // Quarantined is not acquirable.
    const again = await bounded.acquire(RUN_ID, 'worker-X', 60);
    expect(again.acquired).toBe(false);
  });
});

describe('P3 - fencing: a stale worker cannot commit after losing ownership', () => {
  it('after reclaim + re-acquire, the old fence is dead everywhere', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    const fenceA = a.fence as FencingToken;
    store.advance(61_000);
    await heart.reclaimExpired();
    const b = await heart.acquire(RUN_ID, 'worker-B', 60);
    expect(b.acquired).toBe(true);

    // A comes back from the dead and tries everything:
    expect(await heart.verifyFence(fenceA)).toBe(false);
    expect(await heart.renew(fenceA, 60)).toBeNull();
    expect(await heart.release(fenceA, 'completed')).toBeNull();

    // The row still belongs to B.
    const row = await store.getRun(RUN_ID);
    expect(row?.lease_owner).toBe('worker-B');
    expect(row?.status).toBe('leased');
    expect(heart.metrics.fenceRejections).toBeGreaterThanOrEqual(1);
  });

  it('guardIrreversible NEVER fires the effect on a stale fence', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    const fenceA = a.fence as FencingToken;
    store.advance(61_000);
    await heart.reclaimExpired();
    await heart.acquire(RUN_ID, 'worker-B', 60);

    const ledger = new MemoryEffectLedger();
    let fired = 0;
    const outcome = await guardIrreversible(heart, fenceA, ledger, 'send:tg:123', async () => {
      fired++;
      return 'sent';
    });
    expect(outcome).toEqual({ committed: false, reason: 'fence-rejected' });
    expect(fired).toBe(0);
  });

  it('an expired-but-unreclaimed fence is also rejected (no zombie window)', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    const fenceA = a.fence as FencingToken;
    store.advance(61_000); // expired, reclaim has NOT run yet
    expect(await heart.verifyFence(fenceA)).toBe(false);
  });
});

describe('P4 - retries do not duplicate external actions', () => {
  it('effect commits exactly once across a crash-retry cycle', async () => {
    const ledger = new MemoryEffectLedger();
    let fired = 0;
    const effect = async () => {
      fired++;
      return 'external-done';
    };

    // Attempt 1: acquires, commits the effect, then CRASHES before release.
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    const g1 = await guardIrreversible(heart, a.fence as FencingToken, ledger, 'spend:invoice:42', effect);
    expect(g1.committed).toBe(true);
    store.advance(61_000);
    await heart.reclaimExpired();

    // Attempt 2 (retry on another worker): same effectKey -> deduped.
    const b = await heart.acquire(RUN_ID, 'worker-B', 60);
    const g2 = await guardIrreversible(heart, b.fence as FencingToken, ledger, 'spend:invoice:42', effect);
    expect(g2).toEqual({ committed: false, reason: 'already-committed' });
    expect(fired).toBe(1);
    expect(heart.metrics.effectCommits).toBe(1);
    expect(heart.metrics.effectDedupes).toBe(1);
  });

  it('distinct effect keys are independent', async () => {
    const ledger = new MemoryEffectLedger();
    let fired = 0;
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    const fence = a.fence as FencingToken;
    await guardIrreversible(heart, fence, ledger, 'effect:1', async () => fired++);
    await guardIrreversible(heart, fence, ledger, 'effect:2', async () => fired++);
    expect(fired).toBe(2);
  });
});

describe('P5 - receipt / final-state reconciliation', () => {
  it('a full lifecycle leaves receipts consistent with the final row', async () => {
    const outcome = await executeWithLease(heart, { runId: RUN_ID, owner: 'worker-A', ttlSeconds: 60 }, async () => 'done');
    expect(outcome.ran).toBe(true);

    const row = await store.getRun(RUN_ID);
    expect(row?.status).toBe('completed');

    const events = heart.receipts().filter((r) => r.runId === RUN_ID).map((r) => r.event);
    expect(events).toContain('acquired');
    expect(events).toContain('released');
    // Completed run: exactly one acquire and one release, no reclaim.
    expect(events.filter((e) => e === 'acquired')).toHaveLength(1);
    expect(events.filter((e) => e === 'released')).toHaveLength(1);
    expect(events).not.toContain('reclaimed');
    expect(heart.metrics.releases).toBe(1);
  });

  it('every receipt digest recomputes (tamper-evident)', async () => {
    await executeWithLease(heart, { runId: RUN_ID, owner: 'worker-A', ttlSeconds: 60 }, async () => 'x');
    for (const r of heart.receipts()) {
      const expected = `sha256:dreamnet-sorted-json:v0:${sha256Hex(
        canonicalize({ event: r.event, runId: r.runId, owner: r.owner, leaseExpiresAt: r.leaseExpiresAt, effectKey: r.effectKey }),
      )}`;
      expect(r.digest).toBe(expected);
    }
  });

  it('a crash-recovery lifecycle reconciles: acquired -> reclaimed -> acquired -> released', async () => {
    const a = await heart.acquire(RUN_ID, 'worker-A', 60);
    expect(a.acquired).toBe(true);
    store.advance(61_000);
    await heart.reclaimExpired();
    const b = await heart.acquire(RUN_ID, 'worker-B', 60);
    await heart.release(b.fence as FencingToken, 'completed');

    const events = heart.receipts().filter((r) => r.runId === RUN_ID).map((r) => r.event);
    expect(events).toEqual(['acquired', 'reclaimed', 'acquired', 'released']);
    const row = await store.getRun(RUN_ID);
    expect(row?.status).toBe('completed');
    expect(row?.retries).toBe(1); // exactly the one recovery
  });
});

describe('package canonicalize pinned to the DreamNet cross-runtime fixtures', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const vectors: { canonicalization: Array<{ name: string; input: unknown; dreamnetCanonicalJson: string; dreamnetSha256: string }> } =
    JSON.parse(
      readFileSync(
        join(here, '..', '..', '..', '..', 'src', 'lib', 'spore', '__tests__', 'fixtures', 'cross-runtime-vectors.json'),
        'utf8',
      ),
    );

  for (const v of vectors.canonicalization) {
    it(`byte-identical: ${v.name}`, () => {
      expect(canonicalize(v.input)).toBe(v.dreamnetCanonicalJson);
      expect(sha256Hex(canonicalize(v.input))).toBe(v.dreamnetSha256);
    });
  }

  it('deterministicResourceId is stable and input-order independent', () => {
    expect(deterministicResourceId('zoe.heart.canary', 'singleton')).toBe(
      deterministicResourceId('zoe.heart.canary', 'singleton'),
    );
    expect(deterministicResourceId('a', 'b')).not.toBe(deterministicResourceId('b', 'a'));
  });
});
