import { describe, it, expect } from 'vitest';
import { Memory, WorkingMemory, EpisodicMemory } from '../index';
import type { Observation } from '@/lib/eyes';

function obs(over: Partial<Observation> = {}): Observation {
  return {
    schemaVersion: 'zao.observation.v1',
    observationId: 'o1',
    sensor: 'coinbase-eth-usd',
    observerId: 'blood-1',
    kind: 'market.price',
    subjectKey: 'eth-usd',
    observedAt: null,
    capturedAt: '2026-07-24T00:00:00.000Z',
    confidence: 1,
    provenance: { method: 'poll', endpoint: 'https://api.example/price' },
    contentHash: 'hash-3500',
    payload: { price: 3500 },
    evidence: [],
    health: { status: 'healthy', latencyMs: 10, errorRate: 0, lastOkAt: '2026-07-24T00:00:00.000Z', consecutiveFailures: 0 } as unknown as Observation['health'],
    ...over,
  };
}

describe('WorkingMemory', () => {
  it('dedups by contentHash (only the latest live entry per content)', () => {
    let t = 0;
    const wm = new WorkingMemory({ now: () => new Date(t).toISOString() });
    wm.store({ id: 'a', kind: 'market.price', subjectKey: 'eth-usd', contentHash: 'h1', observedAt: null, storedAt: new Date(t).toISOString(), source: 's', payload: { price: 1 } });
    t = 1000;
    wm.store({ id: 'b', kind: 'market.price', subjectKey: 'eth-usd', contentHash: 'h1', observedAt: null, storedAt: new Date(t).toISOString(), source: 's', payload: { price: 1 } });
    expect(wm.size()).toBe(1); // same hash, deduped
    expect(wm.recall({})[0].id).toBe('b'); // latest wins
  });

  it('expires items past the TTL', () => {
    let t = 0;
    const wm = new WorkingMemory({ ttlMs: 5000, now: () => new Date(t).toISOString() });
    wm.store({ id: 'a', kind: 'k', subjectKey: 's', contentHash: 'h1', observedAt: null, storedAt: new Date(t).toISOString(), source: 's', payload: {} });
    t = 6000; // past the 5s TTL
    expect(wm.recall({})).toHaveLength(0);
    expect(wm.size()).toBe(0);
  });

  it('evicts oldest past maxItems', () => {
    const wm = new WorkingMemory({ maxItems: 2, now: () => '2026-07-24T00:00:00.000Z' });
    for (const h of ['h1', 'h2', 'h3']) {
      wm.store({ id: h, kind: 'k', subjectKey: 's', contentHash: h, observedAt: null, storedAt: '2026-07-24T00:00:00.000Z', source: 's', payload: {} });
    }
    expect(wm.size()).toBe(2);
    expect(wm.health().note).toMatch(/evicted/);
  });
});

describe('EpisodicMemory', () => {
  it('appends every occurrence (no dedup) and recalls newest-first', () => {
    const em = new EpisodicMemory();
    em.store({ id: 'a', kind: 'market.price', subjectKey: 'eth-usd', contentHash: 'h1', observedAt: null, storedAt: '2026-07-24T00:00:00.000Z', source: 's', payload: { price: 1 } });
    em.store({ id: 'b', kind: 'market.price', subjectKey: 'eth-usd', contentHash: 'h1', observedAt: null, storedAt: '2026-07-24T00:00:01.000Z', source: 's', payload: { price: 1 } });
    expect(em.size()).toBe(2); // same hash, both kept - history
    expect(em.recall({}).map((r) => r.id)).toEqual(['b', 'a']); // newest-first
  });

  it('filters by kind and drops past cap', () => {
    const em = new EpisodicMemory({ maxItems: 2 });
    for (let i = 0; i < 3; i++) {
      em.store({ id: `x${i}`, kind: 'k', subjectKey: 's', contentHash: `h${i}`, observedAt: null, storedAt: '2026-07-24T00:00:00.000Z', source: 's', payload: {} });
    }
    expect(em.size()).toBe(2);
    expect(em.recall({ kind: 'nope' })).toHaveLength(0);
    expect(em.health().note).toMatch(/dropped/);
  });
});

describe('Memory organ', () => {
  it('records an Observation into working + episodic, and recalls it', () => {
    const mem = new Memory({ now: () => '2026-07-24T00:00:00.000Z' });
    mem.record(obs());
    expect(mem.total()).toBe(1);
    expect(mem.layerKinds()).toEqual(['working', 'episodic']);
    const working = mem.recall({ kind: 'market.price' }, 'working');
    expect(working).toHaveLength(1);
    expect(working[0].contentHash).toBe('hash-3500');
    expect(mem.recall({}, 'episodic')).toHaveLength(1);
  });

  it('working dedups repeats but episodic keeps the history', () => {
    const mem = new Memory({ now: () => '2026-07-24T00:00:00.000Z' });
    mem.record(obs({ observationId: 'o1' }));
    mem.record(obs({ observationId: 'o2' })); // same contentHash - a re-served value
    expect(mem.recall({}, 'working')).toHaveLength(1); // deduped
    expect(mem.recall({}, 'episodic')).toHaveLength(2); // both occurrences
    expect(mem.snapshot().status).toBe('healthy');
  });

  it('throws on an unknown layer', () => {
    const mem = new Memory();
    expect(() => mem.recall({}, 'vector')).toThrow(/no such layer/);
  });
});
