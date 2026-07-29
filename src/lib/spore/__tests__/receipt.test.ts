import { describe, it, expect } from 'vitest';
import { createObservation } from '@/lib/eyes';
import { observationToSpore } from '../spore';
import {
  sporeToReceipt, observationToReceipt, verifyReceipt, computeReceiptDigest, RECEIPT_SCHEMA,
} from '../receipt';

const ISSUER = 'zao-organism-1';
function obs() {
  return createObservation(
    { sensor: 'coinbase-eth-usd', kind: 'market.price', subjectKey: 'eth-usd',
      payload: { pair: 'ETH-USD', price: 1877.69 }, confidence: 1,
      provenance: { method: 'poll', endpoint: 'https://api.coinbase.com/v2/prices/ETH-USD/spot' } },
    { observerId: 'blood-1', now: '2026-07-24T00:00:00.000Z' },
  );
}

describe('Phase 2 - portable receipt.v1', () => {
  it('mints a receipt with schema, UUID id, digest, and provenance', () => {
    const r = observationToReceipt(obs(), ISSUER, { now: '2026-07-24T00:00:00.000Z' });
    expect(r.schemaVersion).toBe(RECEIPT_SCHEMA);
    expect(r.receiptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.digest).toMatch(/^sha256:dreamnet-sorted-json:v0:[0-9a-f]{64}$/);
    expect(r.provenance.method).toBe('poll');
    expect(r.verificationStatus).toBe('unverified');
  });

  it('is replay-safe: same content -> new id, but IDENTICAL deterministic digest', () => {
    const spore = observationToSpore(obs());
    const a = sporeToReceipt(spore, ISSUER, { now: '2026-01-01T00:00:00.000Z' });
    const b = sporeToReceipt(spore, ISSUER, { now: '2026-12-31T00:00:00.000Z' });
    expect(a.receiptId).not.toBe(b.receiptId);      // unique per receipt
    expect(a.digest).toBe(b.digest);                 // deterministic over content+issuer, not id/time
    expect(a.digest).toBe(computeReceiptDigest(spore, ISSUER));
  });

  it('is immutable (frozen)', () => {
    const r = sporeToReceipt(observationToSpore(obs()), ISSUER);
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => { (r as { issuer: string }).issuer = 'evil'; }).toThrow();
  });

  it('verifies a valid receipt with protocol only', () => {
    expect(verifyReceipt(sporeToReceipt(observationToSpore(obs()), ISSUER))).toBe(true);
  });

  it('rejects a tampered payload (contentHash no longer covers content)', () => {
    const r = sporeToReceipt(observationToSpore(obs()), ISSUER);
    const tampered = { ...r, spore: { ...r.spore, payload: { pair: 'ETH-USD', price: 999999 } } };
    expect(verifyReceipt(tampered)).toBe(false);
  });

  it('rejects a tampered digest', () => {
    const r = sporeToReceipt(observationToSpore(obs()), ISSUER);
    const tampered = { ...r, digest: 'sha256:dreamnet-sorted-json:v0:' + '0'.repeat(64) };
    expect(verifyReceipt(tampered)).toBe(false);
  });

  it('rejects a different issuer (digest bound to issuer)', () => {
    const spore = observationToSpore(obs());
    const r = sporeToReceipt(spore, ISSUER);
    expect(verifyReceipt({ ...r, issuer: 'someone-else' })).toBe(false);
  });
});
