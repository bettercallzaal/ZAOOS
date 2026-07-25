import { describe, it, expect } from 'vitest';
import { sporeContentHash, verifySpore, observationToSpore, SPORE_HASH_ALG } from '../index';
import { createObservation } from '@/lib/eyes';

describe('spore content hash', () => {
  it('stamps the dreamnet-sorted-json:v0 alg tag as a prefix', () => {
    const h = sporeContentHash({ kind: 'market.price', subjectKey: 'eth-usd', payload: { price: 1877.69 } });
    expect(h.startsWith(`${SPORE_HASH_ALG}:`)).toBe(true);
    expect(h).toMatch(/^sha256:dreamnet-sorted-json:v0:[0-9a-f]{64}$/);
  });

  it('is stable across key order (sorted-json canonicalization)', () => {
    const a = sporeContentHash({ kind: 'market.price', subjectKey: 'eth-usd', payload: { price: 1, currency: 'USD' } });
    const b = sporeContentHash({ kind: 'market.price', subjectKey: 'eth-usd', payload: { currency: 'USD', price: 1 } });
    expect(a).toBe(b); // same content, different key order -> same hash
  });

  it('changes when the content changes', () => {
    const a = sporeContentHash({ kind: 'market.price', subjectKey: 'eth-usd', payload: { price: 1 } });
    const b = sporeContentHash({ kind: 'market.price', subjectKey: 'eth-usd', payload: { price: 2 } });
    expect(a).not.toBe(b);
  });
});

describe('observationToSpore', () => {
  it('re-expresses a ZAO Observation as a verifiable Spore', () => {
    const obs = createObservation({
      sensor: 'coinbase-eth-usd',
      kind: 'market.price',
      subjectKey: 'eth-usd',
      payload: { pair: 'ETH-USD', price: 1877.69 },
      confidence: 1,
      provenance: { method: 'poll', endpoint: 'https://api.coinbase.com/v2/prices/ETH-USD/spot' },
    }, { observerId: 'blood-1', now: '2026-07-24T00:00:00.000Z' });
    const spore = observationToSpore(obs);
    expect(spore.schemaVersion).toBe('dreamnet.spore.v0');
    expect(spore.subjectKey).toBe('eth-usd');
    expect(spore.source).toBe('coinbase-eth-usd');
    expect(verifySpore(spore)).toBe(true);
  });

  it('two observations of the same content produce the same spore hash (reconcilable)', () => {
    const mk = (sensor: string) => createObservation({
      sensor, kind: 'market.price', subjectKey: 'eth-usd',
      payload: { price: 1877.69 }, confidence: 1, provenance: { method: 'poll' },
    }, { observerId: 'x', now: '2026-07-24T00:00:00.000Z' });
    const s1 = observationToSpore(mk('eye-a'));
    const s2 = observationToSpore(mk('eye-b'));
    expect(s1.contentHash).toBe(s2.contentHash); // different sensors, same content -> same hash
  });

  it('rejects a tampered spore', () => {
    const obs = createObservation({ sensor: 's', kind: 'k', subjectKey: 'j', payload: { v: 1 }, confidence: 1, provenance: { method: 'poll' } }, { observerId: 'x', now: '2026-07-24T00:00:00.000Z' });
    const spore = observationToSpore(obs);
    expect(verifySpore({ ...spore, payload: { v: 999 } })).toBe(false);
  });
});
