import { describe, it, expect, vi } from 'vitest';
import { Bloodstream, validateSpikeManifest, createHttpPollSpike, type Subscriber } from '../index';
import { verifyObservation } from '@/lib/eyes';

const NOW = '2026-07-24T00:00:00.000Z';
const noSleep = async () => {};
const ctx = { observerId: 'blood-1', config: {}, now: NOW };

function priceSpike(body: unknown, over: Partial<Parameters<typeof createHttpPollSpike>[0]> = {}) {
  return createHttpPollSpike({
    spikeId: 'coinbase-eth',
    endpoint: 'https://api.example/price',
    capabilities: ['market.price'],
    produces: ['market.price'],
    minIntervalMs: 10_000,
    fetchJson: async () => body,
    map: (b: any) => (b?.price ? [{ kind: 'market.price', subjectKey: 'eth-usd', payload: { price: b.price } }] : []),
    ...over,
  });
}

describe('validateSpikeManifest', () => {
  it('requires passive risk tier', () => {
    expect(() => validateSpikeManifest({ spikeId: 'x', version: '1', description: '', capabilities: [], produces: ['k'], strategy: 'poll', pollIntervalMs: 1000, requiredConfig: [], riskTier: 'active' as never })).toThrow(/passive/);
  });
  it('poll needs an interval', () => {
    expect(() => validateSpikeManifest({ spikeId: 'x', version: '1', description: '', capabilities: [], produces: ['k'], strategy: 'poll', requiredConfig: [], riskTier: 'passive' })).toThrow(/pollIntervalMs/);
  });
});

describe('http-poll vacuum spike', () => {
  it('ingests + normalizes to valid Observations', async () => {
    const s = priceSpike({ price: 3500 });
    const r = await s.ingest(ctx);
    expect(r.observations).toHaveLength(1);
    expect(r.observations[0].kind).toBe('market.price');
    expect(r.observations[0].provenance.method).toBe('poll');
    expect(verifyObservation(r.observations[0])).toBe(true);
  });
  it('emits nothing for an empty body', async () => {
    expect((await priceSpike({}).ingest(ctx)).observations).toHaveLength(0);
  });
});

describe('Bloodstream circulation', () => {
  it('registers spikes, refuses dup, lists', () => {
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(priceSpike({ price: 1 }));
    expect(b.listSpikes().map((m) => m.spikeId)).toEqual(['coinbase-eth']);
    expect(() => b.registerSpike(priceSpike({ price: 1 }))).toThrow(/already registered/);
  });

  it('circulates and DISTRIBUTES to subscribers of the matching kind only', async () => {
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(priceSpike({ price: 3500 }));
    const got: string[] = [];
    const other: string[] = [];
    b.subscribe({ id: 'memory', kinds: ['market.price'], deliver: (o) => { got.push(o.kind); } });
    b.subscribe({ id: 'weather-only', kinds: ['weather.current'], deliver: (o) => { other.push(o.kind); } });
    const res = await b.circulateSpike('coinbase-eth', ctx);
    expect(res.ok).toBe(true);
    expect(res.distributed).toBe(1);
    expect(got).toEqual(['market.price']);
    expect(other).toEqual([]); // kind filter respected
  });

  it('caches: the same observation within TTL is NOT re-distributed (the whole point)', async () => {
    const b = new Bloodstream({ sleep: noSleep, cacheTtlMs: 60_000 });
    b.registerSpike(priceSpike({ price: 3500 }, { minIntervalMs: 0 })); // no rate limit - isolate the cache path
    let delivered = 0;
    b.subscribe({ id: 's', kinds: [], deliver: () => { delivered++; } });
    await b.circulateSpike('coinbase-eth', ctx);
    // second identical circulation (same content) - a real feed re-serving the same value
    const second = await b.circulateSpike('coinbase-eth', { ...ctx, now: '2026-07-24T00:00:05.000Z' });
    expect(delivered).toBe(1);       // only distributed once
    expect(second.deduped).toBe(1);  // the repeat was cache-deduped
  });

  it('rate-limits: a poll within minIntervalMs is skipped', async () => {
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(priceSpike({ price: 3500 }));
    await b.circulateSpike('coinbase-eth', ctx);
    const soon = await b.circulateSpike('coinbase-eth', { ...ctx, now: '2026-07-24T00:00:02.000Z' }); // 2s < 10s
    expect(soon.skipped).toBe('rate-limited');
    expect(b.healthOf('coinbase-eth')?.rateLimited).toBe(1);
  });

  it('retries with backoff then succeeds', async () => {
    let calls = 0;
    const flaky = priceSpike({ price: 1 }, {
      fetchJson: async () => { calls++; if (calls < 3) throw new Error('503'); return { price: 42 }; },
    });
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(flaky);
    const res = await b.circulateSpike('coinbase-eth', ctx);
    expect(calls).toBe(3);       // failed twice, succeeded on the third
    expect(res.ok).toBe(true);
    expect(res.ingested).toBe(1);
  });

  it('isolates a spike that exhausts retries - records failure, never throws out', async () => {
    const dead = priceSpike({ price: 1 }, { fetchJson: async () => { throw new Error('down'); } });
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(dead);
    b.registerSpike(priceSpike({ price: 2 }, { spikeId: 'other', produces: ['market.price'] }));
    const results = await b.circulateAll(ctx);
    const deadRes = results.find((r) => r.spikeId === 'coinbase-eth')!;
    const otherRes = results.find((r) => r.spikeId === 'other')!;
    expect(deadRes.ok).toBe(false);
    expect(otherRes.ok).toBe(true); // sibling unaffected
    expect(b.healthOf('coinbase-eth')?.status).not.toBe('healthy');
  });

  it('applies enrichers before distribution', async () => {
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(priceSpike({ price: 3500 }));
    b.addEnricher({ id: 'tag', appliesTo: ['market.price'], enrich: (o) => ({ ...o, payload: { ...(o.payload as object), enriched: true } }) });
    let seen: any;
    b.subscribe({ id: 's', kinds: [], deliver: (o) => { seen = o.payload; } });
    await b.circulateSpike('coinbase-eth', ctx);
    expect(seen.enriched).toBe(true);
  });

  it('a throwing subscriber does not stop delivery to others', async () => {
    const b = new Bloodstream({ sleep: noSleep });
    b.registerSpike(priceSpike({ price: 3500 }));
    let good = 0;
    b.subscribe({ id: 'bad', kinds: [], deliver: () => { throw new Error('consumer boom'); } });
    b.subscribe({ id: 'good', kinds: [], deliver: () => { good++; } });
    await b.circulateSpike('coinbase-eth', ctx);
    expect(good).toBe(1);
    expect(b.getMetrics().deliveryErrors).toBe(1);
  });
});
