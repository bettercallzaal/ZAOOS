/**
 * Proof Drop tests - the core invariant is that evidence is mandatory + quotable,
 * so a claim with no quotable evidence fails, and tamper is caught. Plus the
 * federation round-trip through the real Spore trust layer.
 */

import { describe, it, expect } from 'vitest';
import {
  verifyEnvelopeWithTrust,
  InMemoryKeyResolver,
  InMemoryReplayStore,
  InMemoryRevocationResolver,
  InMemorySchemaRegistry,
} from '@/lib/spore';
import {
  createProofDrop,
  verifyProofDrop,
  proofDropToEnvelope,
  mintProofDropIdentity,
  type EvidenceItem,
} from '@/lib/dreamnet/proof-drop';

const NOW = '2026-08-03T00:00:00.000Z';
const goodEvidence: EvidenceItem[] = [
  { kind: 'file', ref: 'src/lib/spore/trust.ts:363', quote: 'Full envelope verification with trust layer.' },
];

function makeDrop() {
  return createProofDrop({
    proofDropId: 'pd-1',
    tenantId: 'zaal',
    claim: 'The Spore trust layer verifies envelopes fail-closed.',
    evidence: goodEvidence,
    producer: 'zoe',
    createdAt: NOW,
  });
}

describe('proof drop - evidence is mandatory (anti-fabrication as a type)', () => {
  it('creates + verifies a claim anchored to quotable evidence', () => {
    const pd = makeDrop();
    expect(verifyProofDrop(pd).valid).toBe(true);
  });
  it('refuses to create a claim with NO evidence', () => {
    expect(() =>
      createProofDrop({ proofDropId: 'x', tenantId: 'zaal', claim: 'unsupported claim', evidence: [], producer: 'zoe', createdAt: NOW }),
    ).toThrow(/at least one piece of quotable evidence/);
  });
  it('refuses evidence with a ref but no quote (a bare ref is not evidence)', () => {
    expect(() =>
      createProofDrop({
        proofDropId: 'x',
        tenantId: 'zaal',
        claim: 'claim',
        evidence: [{ kind: 'file', ref: 'a.ts:1', quote: '' }],
        producer: 'zoe',
        createdAt: NOW,
      }),
    ).toThrow(/no quote/);
  });
  it('verify() rejects an object whose evidence was emptied after the fact', () => {
    const pd = makeDrop();
    const tampered = { ...pd, evidence: [] };
    expect(verifyProofDrop(tampered).valid).toBe(false);
  });
  it('verify() rejects a tampered claim (hash mismatch)', () => {
    const pd = makeDrop();
    const tampered = { ...pd, claim: 'a DIFFERENT claim than what was anchored' };
    const r = verifyProofDrop(tampered);
    expect(r.valid).toBe(false);
    expect(r.reason).toContain('tamper');
  });
  it('verify() rejects tampered evidence (hash mismatch)', () => {
    const pd = makeDrop();
    const tampered = { ...pd, evidence: [{ kind: 'file' as const, ref: 'a.ts:1', quote: 'fabricated quote' }] };
    expect(verifyProofDrop(tampered).valid).toBe(false);
  });
});

describe('proof drop - federation through the Spore trust layer', () => {
  it('a valid drop federates as a signed envelope and verifies ACCEPTED', async () => {
    const pd = makeDrop();
    const id = mintProofDropIdentity('zaal-pd', 'zaal-pd-k1');
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const env = proofDropToEnvelope(pd, id, { nonce: 'pd-nonce-1', nowIso: new Date().toISOString(), expiresAtIso: expires });

    const keyResolver = new InMemoryKeyResolver();
    keyResolver.register({ id: id.issuerId, keyId: id.keyId, publicKey: id.publicKey, validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 3600_000).toISOString() });
    const schemaRegistry = new InMemorySchemaRegistry();
    schemaRegistry.register('proof-drop.v1', () => true);

    const a = await verifyEnvelopeWithTrust(env, {
      expectedAudience: 'proofdrops.zaal',
      keyResolver,
      replayStore: new InMemoryReplayStore(),
      revocationResolver: new InMemoryRevocationResolver(),
      schemaRegistry,
    });
    expect(a.status).toBe('ACCEPTED');
  });
  it('refuses to federate an INVALID (evidence-less) drop', () => {
    const pd = makeDrop();
    const bad = { ...pd, evidence: [] };
    const id = mintProofDropIdentity('zaal-pd', 'zaal-pd-k1');
    expect(() =>
      // @ts-expect-error - deliberately passing an invalid drop
      proofDropToEnvelope(bad, id, { nonce: 'n', nowIso: NOW, expiresAtIso: NOW }),
    ).toThrow(/cannot federate an invalid proof drop/);
  });
});
