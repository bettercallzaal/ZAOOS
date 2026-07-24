import { describe, it, expect } from 'vitest';
import {
  ListenerRegistry,
  validateListenerManifest,
  createWebhookListener,
  type Listener,
  type EventEnvelope,
} from '../index';
import { verifyObservation, clusterForConsensus } from '@/lib/eyes';

const NOW = '2026-07-24T00:00:00.000Z';
const CTX = { observerId: 'ear-1', now: NOW };

function ghWebhook(): Listener {
  return createWebhookListener({
    listenerId: 'github-webhook',
    produces: ['github.pr.event'],
    extract: (raw: any) => {
      if (!raw?.pull_request) return [];
      return [{ kind: 'github.pr.event', subjectKey: `pr:${raw.pull_request.number}`, payload: { action: raw.action, title: raw.pull_request.title }, confidence: 0.98 }];
    },
  });
}
function evt(raw: unknown, deliveryId?: string): EventEnvelope {
  return { source: 'github', receivedAt: NOW, raw, deliveryId };
}

describe('validateListenerManifest', () => {
  it('rejects a non-passive listener - Ears must be receive-only', () => {
    expect(() => validateListenerManifest({ listenerId: 'x', version: '1', description: '', transport: 'webhook', produces: ['k'], requiredConfig: [], riskTier: 'active' as never })).toThrow(/passive/);
  });
  it('rejects a bad transport', () => {
    expect(() => validateListenerManifest({ listenerId: 'x', version: '1', description: '', transport: 'carrier-pigeon' as never, produces: ['k'], requiredConfig: [], riskTier: 'passive' })).toThrow(/transport/);
  });
});

describe('webhook listener normalizes to the shared Observation contract', () => {
  it('turns a PR webhook into a valid Observation', () => {
    const l = ghWebhook();
    const obs = l.onEvent(evt({ action: 'opened', pull_request: { number: 42, title: 'Add eyes' } }), CTX);
    expect(obs).toHaveLength(1);
    expect(obs[0].kind).toBe('github.pr.event');
    expect(obs[0].subjectKey).toBe('pr:42');
    expect(obs[0].provenance.method).toBe('subscribe');
    expect(verifyObservation(obs[0])).toBe(true); // it IS a real Observation - Eyes/Ears interchangeable
  });
  it('emits nothing for an irrelevant payload', () => {
    expect(ghWebhook().onEvent(evt({ ping: true }), CTX)).toHaveLength(0);
  });
  it('is passive by manifest', () => {
    expect(ghWebhook().manifest.riskTier).toBe('passive');
  });
});

describe('ListenerRegistry - dedup, backpressure, isolation', () => {
  it('registers, lists, refuses duplicate, hot-swaps', () => {
    const r = new ListenerRegistry();
    r.register(ghWebhook());
    expect(r.list().map((m) => m.listenerId)).toEqual(['github-webhook']);
    expect(() => r.register(ghWebhook())).toThrow(/already registered/);
    r.replace(createWebhookListener({ listenerId: 'github-webhook', produces: ['github.issue.event'], extract: () => [] }));
    expect(r.get('github-webhook')?.manifest.produces).toEqual(['github.issue.event']);
  });

  it('ingests an event and returns the fresh observation', () => {
    const r = new ListenerRegistry();
    r.register(ghWebhook());
    const res = r.ingest('github-webhook', evt({ action: 'opened', pull_request: { number: 1, title: 't' } }), CTX);
    expect(res.ok).toBe(true);
    expect(res.observations).toHaveLength(1);
    expect(r.healthOf('github-webhook')?.connection).toBe('connected');
  });

  it('DEDUPS at-least-once redelivery by delivery id', () => {
    const r = new ListenerRegistry();
    r.register(ghWebhook());
    const e = evt({ action: 'opened', pull_request: { number: 5, title: 't' } }, 'delivery-abc');
    const first = r.ingest('github-webhook', e, CTX);
    const second = r.ingest('github-webhook', e, CTX); // same delivery id
    expect(first.observations).toHaveLength(1);
    expect(second.observations).toHaveLength(0);
    expect(second.deduped).toBe(1);
  });

  it('DEDUPS redelivery with a NEW delivery id by contentHash', () => {
    const r = new ListenerRegistry();
    r.register(ghWebhook());
    const raw = { action: 'opened', pull_request: { number: 9, title: 't' } };
    const first = r.ingest('github-webhook', evt(raw, 'd1'), CTX);
    const second = r.ingest('github-webhook', evt(raw, 'd2'), CTX); // different delivery, same content
    expect(first.observations).toHaveLength(1);
    expect(second.observations).toHaveLength(0); // caught by contentHash
    expect(second.deduped).toBe(1);
  });

  it('backpressure: replay buffer is bounded (drop-oldest)', () => {
    const r = new ListenerRegistry({ replayBufferSize: 3 });
    r.register(ghWebhook());
    for (let i = 0; i < 6; i++) r.ingest('github-webhook', evt({ action: 'opened', pull_request: { number: i, title: 't' } }), CTX);
    expect(r.replayBuffer().length).toBe(3); // capped
    expect(r.healthOf('github-webhook')?.lag).toBe(3);
  });

  it('isolates a throwing listener - records error, never throws out', () => {
    const r = new ListenerRegistry();
    const boom = createWebhookListener({ listenerId: 'boom', produces: ['k'], extract: () => { throw new Error('bad payload'); } });
    r.register(boom);
    r.register(ghWebhook());
    const bad = r.ingest('boom', evt({}), CTX);
    const good = r.ingest('github-webhook', evt({ action: 'opened', pull_request: { number: 1, title: 't' } }), CTX);
    expect(bad.ok).toBe(false);
    expect(bad.error).toContain('bad payload');
    expect(good.ok).toBe(true); // sibling unaffected
    expect(r.healthOf('boom')?.totalErrors).toBe(1);
  });

  it('tracks reconnects', () => {
    const r = new ListenerRegistry();
    r.register(ghWebhook());
    r.markDropped('github-webhook');
    expect(r.healthOf('github-webhook')?.connection).toBe('dropped');
    r.markReconnect('github-webhook');
    expect(r.healthOf('github-webhook')?.connection).toBe('connected');
    expect(r.healthOf('github-webhook')?.reconnects).toBe(1);
  });
});

describe('Ears + Eyes interoperate', () => {
  it('an Ear observation clusters with an Eye observation of the same subject', () => {
    // Ear hears a PR event; an Eye (elsewhere) saw the same PR with the same payload.
    const l = ghWebhook();
    const earObs = l.onEvent(evt({ action: 'opened', pull_request: { number: 7, title: 'same' } }), { observerId: 'ear-1', now: NOW });
    // Build an equivalent Eye-style observation via the same kind/subject/payload:
    const eyeObs = { ...earObs[0], observerId: 'eye-9', sensor: 'github-poller' };
    const clusters = clusterForConsensus([earObs[0], eyeObs as any]);
    // Same subject + payload -> one shared contentHash cluster with two observers.
    expect(clusters['pr:7'][0].observerIds.sort()).toEqual(['ear-1', 'eye-9']);
  });
});
