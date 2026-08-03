/**
 * The read-only Spore federation canary (spec section 9).
 *
 * Proves ONE bounded round trip: a tenant-scoped, signed Spore envelope is
 * produced, sent through the (in-memory) trust layer, and independently verified
 * -> ACCEPTED. It reuses the existing `verifyEnvelopeWithTrust` trust layer, so
 * the adversarial matrix (replay, wrong audience, expired, revoked, altered,
 * unknown schema) is exercised by the same code that guards real envelopes.
 *
 * Read-only + side-effect-free: no wallet, no network, no DB, no public post, no
 * deploy. All resolvers are in-memory. Flag-gated OFF (DREAMNET_TENANT_CANARY_ENABLED).
 */

import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import {
  createSignedEnvelope,
  verifyEnvelopeWithTrust,
  InMemoryKeyResolver,
  InMemoryReplayStore,
  InMemoryRevocationResolver,
  InMemorySchemaRegistry,
  type UnsignedSporeEnvelope,
  type SignedSporeEnvelope,
  type EnvelopeAssessment,
} from '@/lib/spore';
import { isTenantCanaryEnabled } from './flags';
import { checkNamespaceAccess } from './namespaces';

/** The schema the canary envelope declares. */
export const CANARY_SCHEMA = 'dreamnet.tenant.canary.v1';

export interface CanaryIdentity {
  readonly issuerId: string;
  readonly keyId: string;
  readonly privateKey: KeyObject;
  readonly publicKey: KeyObject;
}

/** Mint a fresh, dedicated Ed25519 signing identity for the canary. */
export function mintCanaryIdentity(issuerId: string, keyId: string): CanaryIdentity {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { issuerId, keyId, privateKey, publicKey };
}

export interface CanaryTrustDeps {
  readonly keyResolver: InMemoryKeyResolver;
  readonly replayStore: InMemoryReplayStore;
  readonly revocationResolver: InMemoryRevocationResolver;
  readonly schemaRegistry: InMemorySchemaRegistry;
}

/**
 * Build the in-memory trust dependencies with the canary identity registered and
 * its schema accepted. This is the "federation gateway" surface for the canary,
 * isolated to this run.
 */
export function buildCanaryTrustDeps(id: CanaryIdentity, nowIso: string, validUntilIso: string): CanaryTrustDeps {
  const keyResolver = new InMemoryKeyResolver();
  keyResolver.register({
    id: id.issuerId,
    keyId: id.keyId,
    publicKey: id.publicKey,
    validFrom: nowIso,
    validUntil: validUntilIso,
  });
  const schemaRegistry = new InMemorySchemaRegistry();
  // Only the canary schema validates; every other schema fails closed.
  schemaRegistry.register(CANARY_SCHEMA, () => true);
  return {
    keyResolver,
    replayStore: new InMemoryReplayStore(),
    revocationResolver: new InMemoryRevocationResolver(),
    schemaRegistry,
  };
}

export interface BuildEnvelopeOpts {
  readonly identity: CanaryIdentity;
  readonly tenantId: string;
  readonly audience: string;
  readonly nonce: string;
  readonly nowIso: string;
  readonly expiresAtIso: string;
}

/**
 * Build a valid, tenant-scoped, signed canary envelope. Its subject is a public,
 * deterministic value (read-only) - no private data crosses.
 */
export function buildCanaryEnvelope(opts: BuildEnvelopeOpts): SignedSporeEnvelope {
  const unsigned: UnsignedSporeEnvelope = {
    kind: CANARY_SCHEMA,
    nonce: opts.nonce,
    audience: [opts.audience],
    schema: CANARY_SCHEMA,
    issuer: { id: opts.identity.issuerId, keyId: opts.identity.keyId },
    subject: { tenantId: opts.tenantId, statement: 'read-only tenant canary', source: 'public-deterministic' },
    issuedAt: opts.nowIso,
    expiresAt: opts.expiresAtIso,
    privacyClass: 'PUBLIC',
  };
  return createSignedEnvelope(unsigned, opts.identity.privateKey);
}

export interface CanaryResult {
  readonly ran: boolean;
  readonly accepted: boolean;
  readonly reason: string;
  readonly assessment?: EnvelopeAssessment;
  readonly namespaceOk?: boolean;
}

export interface RunCanaryOpts {
  readonly tenantId: string;
  readonly allowedPrefixes: readonly string[];
  readonly nowIso: string;
  /** Force-run even when the flag is off (tests). Never set in production paths. */
  readonly force?: boolean;
}

/**
 * Run the read-only canary happy path: mint identity -> build tenant-scoped signed
 * envelope -> verify through the trust layer -> ACCEPTED, and confirm the envelope
 * subject lives in an allowed tenant namespace. Returns without running (ran:false)
 * when the flag is off - the default in every non-test path.
 */
export async function runTenantCanary(opts: RunCanaryOpts): Promise<CanaryResult> {
  if (!opts.force && !isTenantCanaryEnabled()) {
    return { ran: false, accepted: false, reason: 'canary flag off (default) - not run' };
  }

  const audience = `spore.${opts.tenantId}.canary`;
  const nsCheck = checkNamespaceAccess(audience, opts.allowedPrefixes);
  if (!nsCheck.allowed) {
    return { ran: true, accepted: false, reason: `namespace rejected: ${nsCheck.reason}`, namespaceOk: false };
  }

  const now = new Date(opts.nowIso);
  const expires = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // short expiry
  const id = mintCanaryIdentity(`${opts.tenantId}-canary`, `${opts.tenantId}-canary-k1`);
  const deps = buildCanaryTrustDeps(id, opts.nowIso, expires);
  const envelope = buildCanaryEnvelope({
    identity: id,
    tenantId: opts.tenantId,
    audience,
    nonce: `${opts.tenantId}-canary-nonce-1`,
    nowIso: opts.nowIso,
    expiresAtIso: expires,
  });

  const assessment = await verifyEnvelopeWithTrust(envelope, {
    expectedAudience: audience,
    keyResolver: deps.keyResolver,
    replayStore: deps.replayStore,
    revocationResolver: deps.revocationResolver,
    schemaRegistry: deps.schemaRegistry,
  });

  return {
    ran: true,
    accepted: assessment.status === 'ACCEPTED',
    reason: assessment.reason,
    assessment,
    namespaceOk: true,
  };
}
