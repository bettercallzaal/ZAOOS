/**
 * DreamNet Spore federation - Trust layer (flag-gated).
 *
 * Extends the hash-only Spore (Phase 0-2) to the trust-enabled envelope (Phase 3+)
 * per DreamNet SDK bb5d79a. The upgrade is ADDITIVE and FLAG-GATED behind
 * process.env.SPORE_TRUST_ENABLED=true (default OFF). The current hash-only
 * path remains the default; this module is not imported by any live route unless
 * the flag is explicitly set.
 *
 * Design:
 * - RFC 8785 (JCS) strict canonicalization separate from ZAO's existing canonicalize.
 * - Ed25519 signing via node:crypto (no keypair at module load - test only).
 * - UnsignedSporeEnvelope + SignedSporeEnvelope types match SDK contract.
 * - In-memory resolvers (IssuerKeyResolver, ReplayStore, RevocationResolver,
 *   SchemaRegistry) prove the architecture; production wires real resolvers.
 * - assessLegacyEnvelope() rejects legacy 'spore-envelope-v1' shape as QUARANTINE.
 * - verifyEnvelopeWithTrust() full orchestrator - checks all deps, fails closed.
 */

import { createHash, sign as cryptoSign, verify as cryptoVerify, generateKeyPairSync } from 'node:crypto';
import type { KeyObject } from 'node:crypto';

/* ========== RFC 8785 (JCS) Canonicalization ========== */

/**
 * Validate that a value is I-JSON (RFC 8259 + finite-only numbers).
 * Throws on non-finite numbers, -0, sparse arrays, or non-JSON-serializable types.
 * Undefined is allowed in arrays (will be serialized as null) but not as object values.
 */
function validateIJson(value: unknown): void {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new Error(`RFC 8785 Error: Non-finite or -0 number ${value} not allowed in I-JSON`);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item !== undefined) {
        validateIJson(item);
      }
    }
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value)) {
      validateIJson(v);
    }
    return;
  }
  throw new Error(`RFC 8785 Error: Unsupported value type ${typeof value}`);
}

/**
 * Implement RFC 8785 (JSON Canonicalization Scheme) to produce a canonical form.
 * This differs from ZAO's existing canonicalize in strict I-JSON validation and
 * formal compliance. Used for all trust-layer hashing.
 *
 * Key differences from ZAO's canonicalize:
 *  - Strict I-JSON: rejects -0, non-finite
 *  - Ignores `toJSON` (same as ZAO)
 *  - Lexicographic key order (same as ZAO)
 *  - Arrays in order (same as ZAO)
 *  - Undefined array entries -> null (same as ZAO)
 */
export function canonicalizeRfc8785(value: unknown): string {
  // Don't validate undefined at the top level - it will be handled by array/object processing
  if (value !== undefined) {
    validateIJson(value);
  }

  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? 'null' : canonicalizeRfc8785(item))).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keyValues = Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function' && typeof obj[k] !== 'symbol')
      .map((k) => `${JSON.stringify(k)}:${canonicalizeRfc8785(obj[k])}`);
    return `{${keyValues.join(',')}}`;
  }
  throw new Error('RFC 8785 Error: Unreachable');
}

/**
 * SHA256 hash of a string (as bytes).
 */
function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Domain-separated hash per DreamNet contract:
 * sha256 over `${SPORE_ENVELOPE_VERSION}:${kind}\0${RFC8785(unsigned)}`
 */
function domainSeparatedHash(kind: string, unsigned: unknown): string {
  const VERSION = 'spore-envelope.v1';
  const canonical = canonicalizeRfc8785(unsigned);
  const domain = `${VERSION}:${kind}`;
  const input = domain + '\0' + canonical;
  return sha256Hex(input);
}

/* ========== Type Definitions ========== */

export const SPORE_ENVELOPE_VERSION = 'spore-envelope.v1' as const;
export type SporeEnvelopeVersion = typeof SPORE_ENVELOPE_VERSION;

export interface UnsignedSporeEnvelope {
  readonly kind: string;
  readonly nonce: string;
  readonly audience: string[]; // Required, non-empty
  readonly schema?: string;
  readonly issuer: {
    readonly id: string;
    readonly keyId: string;
  };
  readonly subject: unknown;
  readonly issuedAt: string; // ISO timestamp
  readonly expiresAt: string; // ISO timestamp
  readonly policyRef?: string;
  readonly privacyClass?: string;
  readonly parents?: string[];
  readonly dependencies?: string[];
}

export interface SignedSporeEnvelope extends UnsignedSporeEnvelope {
  readonly id: string; // UUID or deterministic id
  readonly hash: string; // sha256:rfc8785 hash
  readonly signature: {
    readonly algorithm: 'Ed25519';
    readonly keyId: string;
    readonly value: string; // hex-encoded signature
  };
}

export type AssessmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'QUARANTINE';

export interface EnvelopeAssessment {
  readonly status: AssessmentStatus;
  readonly contentId: string;
  readonly reason: string;
  readonly checks: Array<{
    readonly type: 'STRUCTURE' | 'HASH' | 'SIGNATURE' | 'FRESHNESS' | 'AUDIENCE' | 'TRUST_DEPS';
    readonly ok: boolean;
    readonly detail: string;
  }>;
}

/* ========== Resolvers (in-memory stubs) ========== */

export interface IssuerKey {
  readonly id: string;
  readonly keyId: string;
  readonly publicKey: KeyObject;
  readonly validFrom: string; // ISO
  readonly validUntil: string; // ISO
  readonly revokedAt?: string; // ISO, if revoked
}

export interface IssuerKeyResolver {
  resolve(issuerId: string, keyId: string): Promise<IssuerKey | null>;
}

export interface ReplayStoreEntry {
  readonly scope: string; // e.g., issuerId
  readonly nonce: string;
  readonly status: 'CLAIMED' | 'DUPLICATE' | 'CONFLICT';
  readonly claimedAt: string; // ISO
  readonly contentId?: string;
}

export interface ReplayStore {
  claim(scope: string, nonce: string, contentId: string): Promise<'CLAIMED' | 'DUPLICATE' | 'CONFLICT'>;
  lookup(scope: string, nonce: string): Promise<ReplayStoreEntry | null>;
}

export interface RevocationResolver {
  isRevoked(issuerId: string, keyId: string): Promise<boolean>;
}

export interface SchemaRegistry {
  validate(schema: string, subject: unknown): Promise<boolean>;
}

/**
 * In-memory IssuerKeyResolver for testing.
 * In production, this would fetch from a key server or distributed ledger.
 */
export class InMemoryKeyResolver implements IssuerKeyResolver {
  private keys: Map<string, IssuerKey> = new Map();

  register(key: IssuerKey): void {
    this.keys.set(`${key.id}#${key.keyId}`, key);
  }

  async resolve(issuerId: string, keyId: string): Promise<IssuerKey | null> {
    return this.keys.get(`${issuerId}#${keyId}`) ?? null;
  }
}

/**
 * In-memory ReplayStore for testing.
 * In production, this would use a distributed ledger or database with TTL.
 */
export class InMemoryReplayStore implements ReplayStore {
  private store: Map<string, ReplayStoreEntry> = new Map();

  async claim(scope: string, nonce: string, contentId: string): Promise<'CLAIMED' | 'DUPLICATE' | 'CONFLICT'> {
    const key = `${scope}:${nonce}`;
    const existing = this.store.get(key);

    if (!existing) {
      this.store.set(key, {
        scope,
        nonce,
        status: 'CLAIMED',
        claimedAt: new Date().toISOString(),
        contentId,
      });
      return 'CLAIMED';
    }

    if (existing.contentId === contentId) {
      return 'DUPLICATE';
    }
    return 'CONFLICT';
  }

  async lookup(scope: string, nonce: string): Promise<ReplayStoreEntry | null> {
    return this.store.get(`${scope}:${nonce}`) ?? null;
  }
}

/**
 * In-memory RevocationResolver for testing.
 */
export class InMemoryRevocationResolver implements RevocationResolver {
  private revoked: Set<string> = new Set();

  revoke(issuerId: string, keyId: string): void {
    this.revoked.add(`${issuerId}#${keyId}`);
  }

  async isRevoked(issuerId: string, keyId: string): Promise<boolean> {
    return this.revoked.has(`${issuerId}#${keyId}`);
  }
}

/**
 * In-memory SchemaRegistry for testing.
 */
export class InMemorySchemaRegistry implements SchemaRegistry {
  private schemas: Map<string, (subject: unknown) => boolean> = new Map();

  register(schema: string, validator: (subject: unknown) => boolean): void {
    this.schemas.set(schema, validator);
  }

  async validate(schema: string, subject: unknown): Promise<boolean> {
    const validator = this.schemas.get(schema);
    if (!validator) {
      // Unknown schema fails closed
      return false;
    }
    return validator(subject);
  }
}

/* ========== Signing & Verification ========== */

/**
 * Create a signed envelope from an unsigned one.
 * Requires a private key in Ed25519 format (typically from generateKeyPairSync).
 */
export function createSignedEnvelope(
  unsigned: UnsignedSporeEnvelope,
  privateKey: KeyObject,
  opts?: { id?: string; now?: string },
): SignedSporeEnvelope {
  const hash = domainSeparatedHash(unsigned.kind, unsigned);
  const id = opts?.id ?? `${unsigned.issuer.id}#${unsigned.nonce}`;

  // Ed25519 signature over the hash value (as bytes).
  // Use null algorithm because Ed25519 in node:crypto signs the message directly.
  const signatureBytes = cryptoSign(
    null,
    Buffer.from(hash, 'hex'),
    privateKey,
  );
  const signatureHex = signatureBytes.toString('hex');

  return {
    ...unsigned,
    id,
    hash: `sha256:rfc8785:${hash}`,
    signature: {
      algorithm: 'Ed25519',
      keyId: unsigned.issuer.keyId,
      value: signatureHex,
    },
  };
}

/**
 * Verify the signature on a signed envelope.
 * Returns true if the signature is valid; false otherwise.
 */
function verifySignature(signed: SignedSporeEnvelope, publicKey: KeyObject): boolean {
  // Extract bare hex from the hash (format: sha256:rfc8785:<hex>)
  const hashMatch = signed.hash.match(/^sha256:rfc8785:([0-9a-f]+)$/i);
  if (!hashMatch) return false;

  const signatureBytes = Buffer.from(signed.signature.value, 'hex');
  return cryptoVerify(
    null,
    Buffer.from(hashMatch[1], 'hex'),
    publicKey,
    signatureBytes,
  );
}

/* ========== Assessment & Verification ========== */

/**
 * Assess a legacy envelope (the old 'spore-envelope-v1' format).
 * Always returns QUARANTINE, as legacy is not trust-enabled.
 */
export function assessLegacyEnvelope(envelope: { schemaVersion?: unknown }): EnvelopeAssessment {
  return {
    status: 'QUARANTINE',
    contentId: '',
    reason: 'Legacy spore-envelope-v1 format not compatible with trust layer (fail closed)',
    checks: [
      {
        type: 'STRUCTURE',
        ok: false,
        detail: 'Schema version is the legacy v1 (not spore-envelope.v1 trust format)',
      },
    ],
  };
}

export interface VerifyEnvelopeWithTrustOpts {
  expectedAudience: string;
  keyResolver: IssuerKeyResolver;
  replayStore: ReplayStore;
  revocationResolver: RevocationResolver;
  schemaRegistry: SchemaRegistry;
  nowSkewMs?: number; // Clock skew tolerance in ms (default 300000 = 5 min)
}

/**
 * Full envelope verification with trust layer.
 * Checks: structure, contentId/hash recompute, signature, freshness, audience,
 * and all trust dependencies (issuer key validity, replay, revocation, schema).
 * Fails closed on any step.
 */
export async function verifyEnvelopeWithTrust(
  envelope: SignedSporeEnvelope,
  opts: VerifyEnvelopeWithTrustOpts,
): Promise<EnvelopeAssessment> {
  const checks: EnvelopeAssessment['checks'] = [];
  const skew = opts.nowSkewMs ?? 300000;
  const now = new Date();

  // 1. Structure check
  if (envelope.kind === undefined || envelope.nonce === undefined || !envelope.audience?.length) {
    checks.push({
      type: 'STRUCTURE',
      ok: false,
      detail: 'Missing required fields: kind, nonce, or audience',
    });
    return {
      status: 'REJECTED',
      contentId: '',
      reason: 'Envelope structure invalid',
      checks,
    };
  }

  // 2. Hash/contentId check
  // Build unsigned envelope without undefined fields for hashing
  const unsignedForHash: Record<string, unknown> = {
    kind: envelope.kind,
    nonce: envelope.nonce,
    audience: envelope.audience,
    issuer: envelope.issuer,
    subject: envelope.subject,
    issuedAt: envelope.issuedAt,
    expiresAt: envelope.expiresAt,
  };
  if (envelope.schema !== undefined) unsignedForHash.schema = envelope.schema;
  if (envelope.policyRef !== undefined) unsignedForHash.policyRef = envelope.policyRef;
  if (envelope.privacyClass !== undefined) unsignedForHash.privacyClass = envelope.privacyClass;
  if (envelope.parents !== undefined) unsignedForHash.parents = envelope.parents;
  if (envelope.dependencies !== undefined) unsignedForHash.dependencies = envelope.dependencies;

  const expectedHash = domainSeparatedHash(envelope.kind, unsignedForHash);
  const hashOk = envelope.hash === `sha256:rfc8785:${expectedHash}`;
  checks.push({
    type: 'HASH',
    ok: hashOk,
    detail: hashOk ? 'Content hash recomputes correctly' : 'Content hash mismatch (tamper)',
  });

  // 3. Audience check
  const audienceOk = envelope.audience.includes(opts.expectedAudience);
  checks.push({
    type: 'AUDIENCE',
    ok: audienceOk,
    detail: audienceOk
      ? `Audience includes ${opts.expectedAudience}`
      : `Audience does not include ${opts.expectedAudience}`,
  });

  // 4. Issuer key resolution
  const issuerKey = await opts.keyResolver.resolve(envelope.issuer.id, envelope.issuer.keyId);
  const keyResolvedOk = issuerKey !== null;
  checks.push({
    type: 'TRUST_DEPS',
    ok: keyResolvedOk,
    detail: keyResolvedOk
      ? `Issuer key resolved: ${envelope.issuer.id}#${envelope.issuer.keyId}`
      : `Issuer key not found: ${envelope.issuer.id}#${envelope.issuer.keyId}`,
  });

  // 5. Signature verification (requires key)
  let sigOk = false;
  if (keyResolvedOk && issuerKey) {
    sigOk = verifySignature(envelope, issuerKey.publicKey);
  }
  checks.push({
    type: 'SIGNATURE',
    ok: sigOk,
    detail: sigOk ? 'Signature valid' : 'Signature invalid or key not available',
  });

  // 6. Freshness check (issuedAt, expiresAt)
  const issuedDate = new Date(envelope.issuedAt);
  const expiredDate = new Date(envelope.expiresAt);
  const freshOk =
    now.getTime() >= issuedDate.getTime() - skew &&
    now.getTime() < expiredDate.getTime() + skew &&
    expiredDate.getTime() > issuedDate.getTime();
  checks.push({
    type: 'FRESHNESS',
    ok: freshOk,
    detail: freshOk
      ? `Envelope is fresh (issued ${envelope.issuedAt}, expires ${envelope.expiresAt})`
      : `Envelope is stale or timestamps invalid`,
  });

  // 7. Key validity window
  let keyValidOk = false;
  if (issuerKey) {
    const keyFrom = new Date(issuerKey.validFrom);
    const keyUntil = new Date(issuerKey.validUntil);
    keyValidOk =
      now.getTime() >= keyFrom.getTime() - skew &&
      now.getTime() < keyUntil.getTime() + skew &&
      !issuerKey.revokedAt;
  }
  checks.push({
    type: 'TRUST_DEPS',
    ok: keyValidOk,
    detail: keyValidOk ? 'Issuer key validity window is valid' : 'Issuer key is expired or has revokedAt timestamp',
  });

  // 8. Revocation check
  const revokedOk = keyResolvedOk && !(await opts.revocationResolver.isRevoked(envelope.issuer.id, envelope.issuer.keyId));
  checks.push({
    type: 'TRUST_DEPS',
    ok: revokedOk,
    detail: revokedOk ? 'Issuer key is not revoked' : 'Issuer key is revoked',
  });

  // 9. Replay detection
  const replayResult = await opts.replayStore.claim(envelope.issuer.id, envelope.nonce, envelope.id);
  const replayOk = replayResult === 'CLAIMED';
  checks.push({
    type: 'TRUST_DEPS',
    ok: replayOk,
    detail:
      replayResult === 'CLAIMED'
        ? 'Nonce is fresh'
        : replayResult === 'DUPLICATE'
          ? 'Nonce is duplicate (same content, same issuer)'
          : 'Nonce conflict (same nonce, different content)',
  });

  // 10. Schema validation (if schema is specified)
  let schemaOk = true;
  if (envelope.schema) {
    schemaOk = await opts.schemaRegistry.validate(envelope.schema, envelope.subject);
    checks.push({
      type: 'TRUST_DEPS',
      ok: schemaOk,
      detail: schemaOk
        ? `Subject conforms to schema: ${envelope.schema}`
        : `Subject does not conform to schema: ${envelope.schema}`,
    });
  } else {
    checks.push({
      type: 'TRUST_DEPS',
      ok: true,
      detail: 'No schema specified',
    });
  }

  // Determine overall status
  const allOk = checks.every((c) => c.ok);
  return {
    status: allOk ? 'ACCEPTED' : 'REJECTED',
    contentId: envelope.id,
    reason: allOk
      ? 'All verification checks passed'
      : `Verification failed: ${checks.filter((c) => !c.ok).map((c) => c.detail).join('; ')}`,
    checks,
  };
}

/* ========== Flag Gate ========== */

/**
 * Returns true if trust layer is enabled.
 */
export function isTrustEnabled(): boolean {
  return process.env.SPORE_TRUST_ENABLED === 'true';
}
