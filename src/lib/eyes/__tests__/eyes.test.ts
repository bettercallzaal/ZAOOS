import { describe, it, expect } from 'vitest';
import {
  createObservation,
  observationContentHash,
  verifyObservation,
  clusterForConsensus,
  SensorRegistry,
  validateManifest,
  createFilesystemSensor,
  type Observation,
  type Sensor,
  type SensorHealthSnapshot,
  type DirEntry,
} from '../index';

const HEALTH: SensorHealthSnapshot = { status: 'healthy', latencyMs: 3, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 };
const CTX = { observerId: 'eye-1', now: '2026-07-24T00:00:00.000Z' };

function mkObs(over: Partial<Parameters<typeof createObservation>[0]> = {}) {
  return createObservation(
    { sensor: 's', kind: 'github.pr', subjectKey: 'pr:42', payload: { title: 'x' }, confidence: 0.9, provenance: { method: 'api' }, health: HEALTH, ...over },
    CTX,
  );
}

describe('createObservation + content hash', () => {
  it('stamps all required fields', () => {
    const o = mkObs();
    expect(o.schemaVersion).toBe('zao.observation.v1');
    expect(o.observationId).toMatch(/[0-9a-f-]{36}/);
    expect(o.sensor).toBe('s');
    expect(o.observerId).toBe('eye-1');
    expect(o.capturedAt).toBe(CTX.now);
    expect(o.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(o.evidence).toEqual([]);
  });

  it('clamps confidence to [0,1] - it is a self-report, not a truth claim', () => {
    expect(mkObs({ confidence: 5 }).confidence).toBe(1);
    expect(mkObs({ confidence: -2 }).confidence).toBe(0);
  });

  it('content hash is over WHAT was seen, not capture metadata - two Eyes hash identically', () => {
    const eye1 = createObservation({ sensor: 's', kind: 'github.pr', subjectKey: 'pr:42', payload: { title: 'x' }, confidence: 0.9, provenance: { method: 'api' }, health: HEALTH }, { observerId: 'eye-1', now: '2026-07-24T00:00:00.000Z' });
    const eye2 = createObservation({ sensor: 's', kind: 'github.pr', subjectKey: 'pr:42', payload: { title: 'x' }, confidence: 0.4, provenance: { method: 'scrape' }, health: HEALTH }, { observerId: 'eye-2', now: '2026-07-24T09:59:00.000Z' });
    expect(eye1.contentHash).toBe(eye2.contentHash); // same subject+payload -> same hash despite different observer/time/confidence
    expect(eye1.observationId).not.toBe(eye2.observationId);
  });

  it('different payload -> different hash', () => {
    expect(mkObs({ payload: { title: 'a' } }).contentHash).not.toBe(mkObs({ payload: { title: 'b' } }).contentHash);
  });

  it('verifyObservation catches tampering', () => {
    const o = mkObs();
    expect(verifyObservation(o)).toBe(true);
    expect(verifyObservation({ ...o, payload: { title: 'tampered' } })).toBe(false);
  });
});

describe('clusterForConsensus - clusters, never decides', () => {
  it('groups matching reports of the same subject and counts distinct Eyes', () => {
    const obs: Observation[] = [
      mkObs({ payload: { title: 'x' } }), // eye-1
      createObservation({ sensor: 's', kind: 'github.pr', subjectKey: 'pr:42', payload: { title: 'x' }, confidence: 0.5, provenance: { method: 'api' }, health: HEALTH }, { observerId: 'eye-2', now: CTX.now }),
      createObservation({ sensor: 's', kind: 'github.pr', subjectKey: 'pr:42', payload: { title: 'DIFFERENT' }, confidence: 0.5, provenance: { method: 'api' }, health: HEALTH }, { observerId: 'eye-3', now: CTX.now }),
    ];
    const c = clusterForConsensus(obs);
    expect(c['pr:42']).toHaveLength(2); // two distinct content hashes
    expect(c['pr:42'][0].count).toBe(2); // the agreed one, most-reported first
    expect(c['pr:42'][0].observerIds.sort()).toEqual(['eye-1', 'eye-2']);
    // clusterForConsensus does NOT pick a winner - it just reports the clusters.
  });
});

describe('SensorRegistry', () => {
  function fakeSensor(id: string, obsKind = 'test.kind'): Sensor {
    return {
      manifest: { sensorId: id, version: '1.0.0', description: 'fake', strategy: 'on_demand', produces: [obsKind], requiredConfig: [], riskTier: 'passive' },
      async observe(ctx) {
        return { observations: [createObservation({ sensor: id, kind: obsKind, subjectKey: 'k', payload: { v: 1 }, confidence: 1, provenance: { method: 'api' }, health: HEALTH }, { observerId: ctx.observerId, now: ctx.now })], cursor: 'c1' };
      },
      health() { return { sensorId: id, status: 'healthy', latencyMs: 0, errorRate: 0, lastOkAt: null, consecutiveFailures: 0, totalObservations: 0, totalErrors: 0 }; },
    };
  }

  it('rejects a non-passive manifest - Eyes must be read-only', () => {
    expect(() => validateManifest({ sensorId: 'x', version: '1', description: '', strategy: 'poll', pollIntervalMs: 1000, produces: ['k'], requiredConfig: [], riskTier: 'active' as never })).toThrow(/passive/);
  });

  it('rejects poll strategy without an interval', () => {
    expect(() => validateManifest({ sensorId: 'x', version: '1', description: '', strategy: 'poll', produces: ['k'], requiredConfig: [], riskTier: 'passive' })).toThrow(/pollIntervalMs/);
  });

  it('registers, lists, and refuses duplicate registration', () => {
    const r = new SensorRegistry();
    r.register(fakeSensor('a'));
    expect(r.list().map((m) => m.sensorId)).toEqual(['a']);
    expect(() => r.register(fakeSensor('a'))).toThrow(/already registered/);
  });

  it('hot-swaps a live sensor via replace', () => {
    const r = new SensorRegistry();
    r.register(fakeSensor('a', 'old.kind'));
    r.replace(fakeSensor('a', 'new.kind'));
    expect(r.get('a')?.manifest.produces).toEqual(['new.kind']);
  });

  it('unregister removes it', () => {
    const r = new SensorRegistry();
    r.register(fakeSensor('a'));
    expect(r.unregister('a')).toBe(true);
    expect(r.list()).toHaveLength(0);
  });

  it('runOnce runs a sensor, records health, and threads the cursor', async () => {
    const r = new SensorRegistry();
    r.register(fakeSensor('a'));
    const res = await r.runOnce('a', { observerId: 'eye-1', now: CTX.now });
    expect(res.ok).toBe(true);
    expect(res.observations).toHaveLength(1);
    expect(res.cursor).toBe('c1');
    expect(r.healthOf('a')?.totalObservations).toBe(1);
    expect(r.healthOf('a')?.status).toBe('healthy');
  });

  it('isolates a failing sensor - it goes degraded/failing but never throws or stops others', async () => {
    const r = new SensorRegistry();
    const boom: Sensor = {
      manifest: { sensorId: 'boom', version: '1', description: '', strategy: 'on_demand', produces: ['k'], requiredConfig: [], riskTier: 'passive' },
      async observe() { throw new Error('sensor exploded'); },
      health() { return { sensorId: 'boom', status: 'failing', latencyMs: 0, errorRate: 1, lastOkAt: null, consecutiveFailures: 9, totalObservations: 0, totalErrors: 9 }; },
    };
    r.register(boom);
    r.register(fakeSensor('good'));
    const results = await r.runAll({ observerId: 'eye-1', now: CTX.now });
    const boomRes = results.find((x) => x.sensorId === 'boom')!;
    const goodRes = results.find((x) => x.sensorId === 'good')!;
    expect(boomRes.ok).toBe(false);
    expect(boomRes.error).toContain('exploded');
    expect(goodRes.ok).toBe(true); // the good sensor still ran
  });

  it('escalates status to failing after repeated failures', async () => {
    const r = new SensorRegistry();
    const boom: Sensor = {
      manifest: { sensorId: 'boom', version: '1', description: '', strategy: 'on_demand', produces: ['k'], requiredConfig: [], riskTier: 'passive' },
      async observe() { throw new Error('x'); },
      health() { return { sensorId: 'boom', status: 'failing', latencyMs: 0, errorRate: 1, lastOkAt: null, consecutiveFailures: 0, totalObservations: 0, totalErrors: 0 }; },
    };
    r.register(boom);
    for (let i = 0; i < 5; i++) await r.runOnce('boom', { observerId: 'e', now: CTX.now });
    expect(r.healthOf('boom')?.status).toBe('failing');
    expect(r.healthOf('boom')?.errorRate).toBeGreaterThan(0);
  });
});

describe('filesystem sensor (reference Eye) - observe-only, cursor-diffed', () => {
  const files: DirEntry[] = [
    { path: '/w/a.txt', size: 10, mtimeMs: 1000 },
    { path: '/w/b.txt', size: 20, mtimeMs: 2000 },
  ];
  function sensorOver(entries: DirEntry[]) {
    return createFilesystemSensor({ watchPath: '/w', readDir: async () => entries });
  }

  it('emits an fs.change observation per file on first cycle (all new)', async () => {
    const s = sensorOver(files);
    const r = await s.observe({ observerId: 'eye-1', config: {}, now: CTX.now });
    expect(r.observations).toHaveLength(2);
    expect(r.observations[0].kind).toBe('fs.change');
    expect(r.observations[0].payload).toMatchObject({ change: 'added' });
    expect(r.cursor).toBeTruthy();
  });

  it('emits nothing when nothing changed (cursor diff)', async () => {
    const s = sensorOver(files);
    const first = await s.observe({ observerId: 'eye-1', config: {}, now: CTX.now });
    const second = await s.observe({ observerId: 'eye-1', config: {}, now: CTX.now, cursor: first.cursor });
    expect(second.observations).toHaveLength(0);
  });

  it('emits a modified observation when a file changes', async () => {
    const s = sensorOver(files);
    const first = await s.observe({ observerId: 'eye-1', config: {}, now: CTX.now });
    const changed = [{ path: '/w/a.txt', size: 99, mtimeMs: 5000 }, files[1]];
    const s2 = createFilesystemSensor({ watchPath: '/w', readDir: async () => changed });
    const second = await s2.observe({ observerId: 'eye-1', config: {}, now: CTX.now, cursor: first.cursor });
    expect(second.observations).toHaveLength(1);
    expect(second.observations[0].payload).toMatchObject({ change: 'modified', path: '/w/a.txt' });
  });

  it('its observations verify + are passive by manifest', async () => {
    const s = sensorOver(files);
    expect(s.manifest.riskTier).toBe('passive');
    const r = await s.observe({ observerId: 'eye-1', config: {}, now: CTX.now });
    expect(verifyObservation(r.observations[0])).toBe(true);
  });
});
