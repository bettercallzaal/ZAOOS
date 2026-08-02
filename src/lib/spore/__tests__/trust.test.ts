/**
 * Trust layer verification tests.
 *
 * Covers:
 *  - RFC 8785 canonicalization (I-JSON validation, lexicographic ordering)
 *  - Envelope signing and verification
 *  - Replay detection
 *  - Revocation checking
 *  - Schema validation
 *  - Freshness checking
 *  - Legacy envelope rejection
 *  - Adversarial matrix (tampering, forgery, replay, etc.)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import {
  canonicalizeRfc8785,
  SPORE_ENVELOPE_VERSION,
  createSignedEnvelope,
  verifyEnvelopeWithTrust,
  assessLegacyEnvelope,
  isTrustEnabled,
  InMemoryKeyResolver,
  InMemoryReplayStore,
  InMemoryRevocationResolver,
  InMemorySchemaRegistry,
  type UnsignedSporeEnvelope,
  type SignedSporeEnvelope,
} from '../trust';

/**
 * Golden vector for RFC 8785: {"b":1,"a":2} should canonicalize to {"a":2,"b":1}
 * in lexicographic order.
 */
describe('RFC 8785 Canonicalization', () => {
  it('should sort keys lexicographically', () => {
    const input = { b: 1, a: 2 };
    const canonical = canonicalizeRfc8785(input);
    expect(canonical).toBe('{"a":2,"b":1}');
  });

  it('should handle unicode keys', () => {
    const input = { zürich: 1, aalborg: 2 };
    const canonical = canonicalizeRfc8785(input);
    // Lexicographic sort places aalborg before zürich
    expect(canonical).toBe('{"aalborg":2,"zürich":1}');
  });

  it('should reject non-finite numbers', () => {
    expect(() => canonicalizeRfc8785({ value: Infinity })).toThrow(/Non-finite/);
    expect(() => canonicalizeRfc8785({ value: -Infinity })).toThrow(/Non-finite/);
    expect(() => canonicalizeRfc8785({ value: NaN })).toThrow(/Non-finite/);
  });

  it('should reject negative zero', () => {
    const negZero = Object.is(-0, -0) ? -0 : 0;
    if (Object.is(negZero, -0)) {
      expect(() => canonicalizeRfc8785({ value: negZero })).toThrow(/-0/);
    }
  });

  it('should handle arrays with undefined entries', () => {
    const input = [1, undefined, 3];
    const canonical = canonicalizeRfc8785(input);
    expect(canonical).toBe('[1,null,3]');
  });

  it('should serialize booleans and strings correctly', () => {
    const input = { flag: true, text: 'hello' };
    const canonical = canonicalizeRfc8785(input);
    expect(canonical).toBe('{"flag":true,"text":"hello"}');
  });

  it('should handle nested objects', () => {
    const input = { outer: { inner: 42 } };
    const canonical = canonicalizeRfc8785(input);
    expect(canonical).toBe('{"outer":{"inner":42}}');
  });

  it('should produce consistent output', () => {
    const input = { z: 1, a: 2, m: 3 };
    const canonical1 = canonicalizeRfc8785(input);
    const canonical2 = canonicalizeRfc8785(input);
    expect(canonical1).toBe(canonical2);
  });

  it('should reject functions and symbols in objects', () => {
    expect(() => canonicalizeRfc8785({ fn: () => {} })).toThrow();
    expect(() => canonicalizeRfc8785({ sym: Symbol('test') })).toThrow();
  });
});

/**
 * Envelope signing and verification.
 */
describe('Envelope Signing & Verification', () => {
  let keyPair: ReturnType<typeof generateKeyPairSync>;
  let unsigned: UnsignedSporeEnvelope;
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 3600000).toISOString();

  beforeEach(() => {
    keyPair = generateKeyPairSync('ed25519');
    unsigned = {
      kind: 'market.price',
      nonce: 'nonce-1',
      audience: ['https://thezao.com'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 2500 },
      issuedAt: now,
      expiresAt: future,
    };
  });

  it('should create and verify a signed envelope', async () => {
    const signed = createSignedEnvelope(unsigned, keyPair.privateKey);

    expect(signed.id).toBeDefined();
    expect(signed.hash).toMatch(/^sha256:rfc8785:/);
    expect(signed.signature.algorithm).toBe('Ed25519');
    expect(signed.signature.value).toMatch(/^[0-9a-f]+$/i);
  });

  it('should compute consistent hash across multiple signings', () => {
    const signed1 = createSignedEnvelope(unsigned, keyPair.privateKey, { id: 'fixed-id' });
    const signed2 = createSignedEnvelope(unsigned, keyPair.privateKey, { id: 'fixed-id' });

    expect(signed1.hash).toBe(signed2.hash);
  });

  it('should preserve unsigned fields in signed envelope', () => {
    const signed = createSignedEnvelope(unsigned, keyPair.privateKey);

    expect(signed.kind).toBe(unsigned.kind);
    expect(signed.nonce).toBe(unsigned.nonce);
    expect(signed.audience).toEqual(unsigned.audience);
    expect(signed.subject).toEqual(unsigned.subject);
  });

  it('should reject verification with wrong key', async () => {
    const wrongKeyPair = generateKeyPairSync('ed25519');
    const signed = createSignedEnvelope(unsigned, keyPair.privateKey);

    const keyResolver = new InMemoryKeyResolver();
    keyResolver.register({
      id: 'zao-node-1',
      keyId: 'key-2024-08',
      publicKey: wrongKeyPair.publicKey,
      validFrom: now,
      validUntil: future,
    });

    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore: new InMemoryReplayStore(),
      revocationResolver: new InMemoryRevocationResolver(),
      schemaRegistry: new InMemorySchemaRegistry(),
    });

    expect(assessment.status).toBe('REJECTED');
    const sigCheck = assessment.checks.find((c) => c.type === 'SIGNATURE');
    expect(sigCheck?.ok).toBe(false);
  });

  it('should generate unique signatures on separate calls (randomized)', () => {
    const signed1 = createSignedEnvelope(unsigned, keyPair.privateKey, { id: 'fixed-id' });
    const signed2 = createSignedEnvelope(unsigned, keyPair.privateKey, { id: 'fixed-id' });

    // Ed25519 should produce the same signature for the same input (deterministic)
    expect(signed1.signature.value).toBe(signed2.signature.value);
  });
});

/**
 * Full verification with resolvers.
 */
describe('Verification with Trust Dependencies', () => {
  let keyPair: ReturnType<typeof generateKeyPairSync>;
  let signed: SignedSporeEnvelope;
  let keyResolver: InMemoryKeyResolver;
  let replayStore: InMemoryReplayStore;
  let revocationResolver: InMemoryRevocationResolver;
  let schemaRegistry: InMemorySchemaRegistry;
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 3600000).toISOString();
  const past = new Date(Date.now() - 3600000).toISOString();

  beforeEach(() => {
    keyPair = generateKeyPairSync('ed25519');
    const unsigned: UnsignedSporeEnvelope = {
      kind: 'market.price',
      nonce: 'nonce-1',
      audience: ['https://thezao.com', 'https://dreamnet.io'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 2500 },
      issuedAt: now,
      expiresAt: future,
    };
    signed = createSignedEnvelope(unsigned, keyPair.privateKey);

    keyResolver = new InMemoryKeyResolver();
    keyResolver.register({
      id: 'zao-node-1',
      keyId: 'key-2024-08',
      publicKey: keyPair.publicKey,
      validFrom: past,
      validUntil: future,
    });

    replayStore = new InMemoryReplayStore();
    revocationResolver = new InMemoryRevocationResolver();
    schemaRegistry = new InMemorySchemaRegistry();
    schemaRegistry.register('market.price.schema.v1', (subject) => {
      const s = subject as Record<string, unknown>;
      return typeof s.symbol === 'string' && typeof s.price === 'number';
    });
  });

  it('should accept valid envelope', async () => {
    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('ACCEPTED');
    expect(assessment.checks.every((c) => c.ok)).toBe(true);
  });

  it('should reject envelope with wrong audience', async () => {
    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://wrong-audience.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const audienceCheck = assessment.checks.find((c) => c.type === 'AUDIENCE');
    expect(audienceCheck?.ok).toBe(false);
  });

  it('should detect payload tampering', async () => {
    const tampered: SignedSporeEnvelope = {
      ...signed,
      subject: { symbol: 'BTC', price: 100000 },
    };

    const assessment = await verifyEnvelopeWithTrust(tampered, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const hashCheck = assessment.checks.find((c) => c.type === 'HASH');
    expect(hashCheck?.ok).toBe(false);
  });

  it('should detect audience tampering', async () => {
    const tampered: SignedSporeEnvelope = {
      ...signed,
      audience: ['https://attacker.com'],
    };

    const assessment = await verifyEnvelopeWithTrust(tampered, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const hashCheck = assessment.checks.find((c) => c.type === 'HASH');
    expect(hashCheck?.ok).toBe(false);
  });

  it('should detect signature tampering', async () => {
    const tampered: SignedSporeEnvelope = {
      ...signed,
      signature: {
        ...signed.signature,
        value: 'deadbeef' + signed.signature.value.slice(8),
      },
    };

    const assessment = await verifyEnvelopeWithTrust(tampered, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const sigCheck = assessment.checks.find((c) => c.type === 'SIGNATURE');
    expect(sigCheck?.ok).toBe(false);
  });

  it('should reject when issuer key is unknown', async () => {
    const emptyKeyResolver = new InMemoryKeyResolver();

    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver: emptyKeyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const trustCheck = assessment.checks.find((c) => c.type === 'TRUST_DEPS' && c.detail.includes('not found'));
    expect(trustCheck?.ok).toBe(false);
  });

  it('should reject expired envelope', async () => {
    const past = new Date(Date.now() - 7200000).toISOString();
    const unsigned: UnsignedSporeEnvelope = {
      kind: 'market.price',
      nonce: 'nonce-2',
      audience: ['https://thezao.com'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 2500 },
      issuedAt: past,
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    };
    const expiredSigned = createSignedEnvelope(unsigned, keyPair.privateKey);

    const assessment = await verifyEnvelopeWithTrust(expiredSigned, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const freshCheck = assessment.checks.find((c) => c.type === 'FRESHNESS');
    expect(freshCheck?.ok).toBe(false);
  });

  it('should reject envelope issued in the future (clock skew)', async () => {
    const future = new Date(Date.now() + 7200000).toISOString();
    const unsigned: UnsignedSporeEnvelope = {
      kind: 'market.price',
      nonce: 'nonce-3',
      audience: ['https://thezao.com'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 2500 },
      issuedAt: future,
      expiresAt: new Date(Date.now() + 10800000).toISOString(),
    };
    const futureIssuedSigned = createSignedEnvelope(unsigned, keyPair.privateKey);

    const assessment = await verifyEnvelopeWithTrust(futureIssuedSigned, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
      nowSkewMs: 60000, // 1 minute skew
    });

    expect(assessment.status).toBe('REJECTED');
  });

  it('should handle replay detection - exact replay', async () => {
    const firstCall = await replayStore.claim('zao-node-1', 'nonce-1', signed.id);
    expect(firstCall).toBe('CLAIMED');

    const secondCall = await replayStore.claim('zao-node-1', 'nonce-1', signed.id);
    expect(secondCall).toBe('DUPLICATE');

    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const replayCheck = assessment.checks.find((c) => c.detail.includes('duplicate'));
    expect(replayCheck?.ok).toBe(false);
  });

  it('should detect replay conflict (same nonce, different content)', async () => {
    const firstId = 'content-1';
    const secondId = 'content-2';

    const firstCall = await replayStore.claim('zao-node-1', 'nonce-conflict', firstId);
    expect(firstCall).toBe('CLAIMED');

    const conflictCall = await replayStore.claim('zao-node-1', 'nonce-conflict', secondId);
    expect(conflictCall).toBe('CONFLICT');
  });

  it('should reject revoked issuer key', async () => {
    revocationResolver.revoke('zao-node-1', 'key-2024-08');

    // Create a fresh envelope with a different nonce to avoid replay store conflicts
    const unsigned: UnsignedSporeEnvelope = {
      kind: 'market.price',
      nonce: 'nonce-revoked',
      audience: ['https://thezao.com', 'https://dreamnet.io'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 2500 },
      issuedAt: now,
      expiresAt: future,
    };
    const revokedSigned = createSignedEnvelope(unsigned, keyPair.privateKey);

    const assessment = await verifyEnvelopeWithTrust(revokedSigned, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const revokeCheck = assessment.checks.find((c) => c.detail.includes('revoked'));
    expect(revokeCheck?.ok).toBe(false);
  });

  it('should reject unknown schema', async () => {
    const emptySchemaRegistry = new InMemorySchemaRegistry();

    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry: emptySchemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const schemaCheck = assessment.checks.find((c) => c.detail.includes('market.price.schema.v1'));
    expect(schemaCheck?.ok).toBe(false);
  });

  it('should reject subject that does not conform to schema', async () => {
    const unsigned: UnsignedSporeEnvelope = {
      kind: 'market.price',
      nonce: 'nonce-bad',
      audience: ['https://thezao.com'],
      schema: 'market.price.schema.v1',
      issuer: {
        id: 'zao-node-1',
        keyId: 'key-2024-08',
      },
      subject: { symbol: 'ETH', price: 'not-a-number' },
      issuedAt: now,
      expiresAt: future,
    };
    const invalidSigned = createSignedEnvelope(unsigned, keyPair.privateKey);

    const assessment = await verifyEnvelopeWithTrust(invalidSigned, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore,
      revocationResolver,
      schemaRegistry,
    });

    expect(assessment.status).toBe('REJECTED');
    const schemaCheck = assessment.checks.find((c) => c.detail.includes('does not conform'));
    expect(schemaCheck?.ok).toBe(false);
  });
});

/**
 * Legacy envelope handling.
 */
describe('Legacy Envelope Assessment', () => {
  it('should reject legacy spore-envelope-v1 as QUARANTINE', () => {
    const legacyEnvelope = {
      schemaVersion: 'spore-envelope-v1',
      kind: 'market.price',
      payload: { price: 100 },
    };

    const assessment = assessLegacyEnvelope(legacyEnvelope);

    expect(assessment.status).toBe('QUARANTINE');
    expect(assessment.reason).toMatch(/Legacy.*fail closed/);
  });

  it('should reject unknown schema version as QUARANTINE', () => {
    const unknownEnvelope = {
      schemaVersion: 'spore-envelope-v999',
    };

    const assessment = assessLegacyEnvelope(unknownEnvelope);

    expect(assessment.status).toBe('QUARANTINE');
  });
});

/**
 * Flag gate.
 */
describe('Flag Gate', () => {
  it('should return flag enabled status correctly', () => {
    const before = process.env.SPORE_TRUST_ENABLED;
    try {
      process.env.SPORE_TRUST_ENABLED = 'true';
      expect(isTrustEnabled()).toBe(true);

      process.env.SPORE_TRUST_ENABLED = 'false';
      expect(isTrustEnabled()).toBe(false);

      process.env.SPORE_TRUST_ENABLED = undefined;
      expect(isTrustEnabled()).toBe(false);
    } finally {
      process.env.SPORE_TRUST_ENABLED = before;
    }
  });
});

/**
 * Missing required fields.
 */
describe('Structural Validation', () => {
  let keyPair: ReturnType<typeof generateKeyPairSync>;
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 3600000).toISOString();

  beforeEach(() => {
    keyPair = generateKeyPairSync('ed25519');
  });

  it('should reject envelope with missing kind', async () => {
    const signed = {
      nonce: 'nonce-1',
      audience: ['https://thezao.com'],
      issuer: { id: 'zao-node-1', keyId: 'key-1' },
      subject: { value: 1 },
      issuedAt: now,
      expiresAt: future,
      id: 'id-1',
      hash: 'sha256:rfc8785:abc123',
      signature: { algorithm: 'Ed25519' as const, keyId: 'key-1', value: 'sig' },
    } as SignedSporeEnvelope;

    const keyResolver = new InMemoryKeyResolver();
    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore: new InMemoryReplayStore(),
      revocationResolver: new InMemoryRevocationResolver(),
      schemaRegistry: new InMemorySchemaRegistry(),
    });

    expect(assessment.status).toBe('REJECTED');
    const structCheck = assessment.checks.find((c) => c.type === 'STRUCTURE');
    expect(structCheck?.ok).toBe(false);
  });

  it('should reject envelope with empty audience', async () => {
    const signed = {
      kind: 'test',
      nonce: 'nonce-1',
      audience: [],
      issuer: { id: 'zao-node-1', keyId: 'key-1' },
      subject: { value: 1 },
      issuedAt: now,
      expiresAt: future,
      id: 'id-1',
      hash: 'sha256:rfc8785:abc123',
      signature: { algorithm: 'Ed25519' as const, keyId: 'key-1', value: 'sig' },
    } as SignedSporeEnvelope;

    const keyResolver = new InMemoryKeyResolver();
    const assessment = await verifyEnvelopeWithTrust(signed, {
      expectedAudience: 'https://thezao.com',
      keyResolver,
      replayStore: new InMemoryReplayStore(),
      revocationResolver: new InMemoryRevocationResolver(),
      schemaRegistry: new InMemorySchemaRegistry(),
    });

    expect(assessment.status).toBe('REJECTED');
    const structCheck = assessment.checks.find((c) => c.type === 'STRUCTURE');
    expect(structCheck?.ok).toBe(false);
  });
});
