/**
 * Stage 0 conformance + adversarial tests for the DreamNet tenant-organism layer.
 * Every "must fail closed" invariant from the spec has a negative test here.
 */

import { describe, it, expect } from 'vitest';
import { verifyEnvelopeWithTrust } from '@/lib/spore';
import {
  parseTenantManifest,
  isStage0StatusAllowed,
  checkNamespaceAccess,
  canonicalTenantPrefixes,
  evaluateExport,
  evaluateImport,
  sharedMemoryContentHash,
  guardApproval,
  guardStage0Constraints,
  canTransition,
  runTenantCanary,
  mintCanaryIdentity,
  buildCanaryTrustDeps,
  buildCanaryEnvelope,
  CANARY_SCHEMA,
  type CapabilityLeaseManifestV1,
  type SharedMemoryObjectV1,
} from '@/lib/dreamnet/tenant';
import { ZAAL_TENANT_MANIFEST, ZAAL_ALLOWED_PREFIXES, ZAAL_TENANT_ID } from '../../../../../tenants/zaal/profile';

describe('tenant manifest', () => {
  it('accepts the ZAO Stage 0 manifest', () => {
    expect(parseTenantManifest(ZAAL_TENANT_MANIFEST).ok).toBe(true);
  });
  it('rejects a manifest that surrenders sovereignty', () => {
    const bad = { ...ZAAL_TENANT_MANIFEST, sovereignty: { ...ZAAL_TENANT_MANIFEST.sovereignty, ownsMemory: false } };
    expect(parseTenantManifest(bad).ok).toBe(false);
  });
  it('blocks promotion past CANARY_APPROVED in Stage 0', () => {
    expect(isStage0StatusAllowed('CANARY_APPROVED')).toBe(true);
    expect(isStage0StatusAllowed('LIMITED_FEDERATION')).toBe(false);
    expect(isStage0StatusAllowed('VERIFIED_PARTNER')).toBe(false);
  });
});

describe('namespace isolation (adversarial)', () => {
  const prefixes = canonicalTenantPrefixes(ZAAL_TENANT_ID);
  it('allows a tenant-scoped subject', () => {
    expect(checkNamespaceAccess(`spore.${ZAAL_TENANT_ID}.canary.run1`, prefixes).allowed).toBe(true);
  });
  it('rejects wildcard', () => {
    expect(checkNamespaceAccess('spore.zaal.canary.*', prefixes).allowed).toBe(false);
  });
  it('rejects path traversal', () => {
    expect(checkNamespaceAccess('spore.zaal.canary/../admin', prefixes).allowed).toBe(false);
  });
  it('rejects percent-encoded escape', () => {
    expect(checkNamespaceAccess('spore.zaal.canary%2e%2e', prefixes).allowed).toBe(false);
  });
  it('rejects cross-tenant reference', () => {
    expect(checkNamespaceAccess('spore.othertenant.canary.x', prefixes).allowed).toBe(false);
  });
  it('rejects prefix-collision (spore.zaalX)', () => {
    expect(checkNamespaceAccess('spore.zaalEVIL.canary', prefixes).allowed).toBe(false);
  });
  it('rejects forbidden internal + wallet + admin roots', () => {
    expect(checkNamespaceAccess('dreamnet.internal.secrets', prefixes).allowed).toBe(false);
    expect(checkNamespaceAccess('wallets.zaal', prefixes).allowed).toBe(false);
    expect(checkNamespaceAccess('admin.control', prefixes).allowed).toBe(false);
    expect(checkNamespaceAccess('deployments.prod', prefixes).allowed).toBe(false);
  });
});

describe('memory export gate (fail closed)', () => {
  const base = { content: 'a clean public statement', audience: ['dreamnet'], purpose: 'share a finding' };
  it('never exports PRIVATE', () => {
    expect(evaluateExport({ ...base, memoryClass: 'PRIVATE' }).allowed).toBe(false);
  });
  it('never exports EPHEMERAL', () => {
    expect(evaluateExport({ ...base, memoryClass: 'EPHEMERAL' }).allowed).toBe(false);
  });
  it('blocks a secret in PARTNER_SHARED content', () => {
    // fake, assembled from fragments so no literal key prefix sits in source
    const fakeSecret = 'sk-' + 'ant-abcdefghijklmnopqrstuvwxyz123';
    const d = evaluateExport({ ...base, memoryClass: 'PARTNER_SHARED', content: `key ${fakeSecret}` });
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain('secret');
  });
  it('blocks PII (email) in exported content', () => {
    const d = evaluateExport({ ...base, memoryClass: 'PUBLIC', content: 'reach me at someone@example.com' });
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain('PII');
  });
  it('allows a clean PUBLIC export', () => {
    expect(evaluateExport({ ...base, memoryClass: 'PUBLIC' }).allowed).toBe(true);
  });
  it('requires a non-empty audience and purpose', () => {
    expect(evaluateExport({ ...base, memoryClass: 'PUBLIC', audience: [] }).allowed).toBe(false);
    expect(evaluateExport({ ...base, memoryClass: 'PUBLIC', purpose: '' }).allowed).toBe(false);
  });
});

describe('memory import verification (fail closed)', () => {
  const now = '2026-08-03T00:00:00.000Z';
  function obj(overrides: Partial<SharedMemoryObjectV1> = {}): unknown {
    const memoryId = 'm1';
    const body = { note: 'hello' };
    return {
      schemaVersion: 'shared-memory.v1',
      memoryId,
      tenantId: 'dreamnet',
      originOrganismId: 'dreamnet-core',
      memoryClass: 'PUBLIC',
      audience: ['zaal'],
      purpose: 'share',
      purposeLimitations: [],
      createdAt: now,
      expiresAt: '2026-08-04T00:00:00.000Z',
      ttlSeconds: 86400,
      provenance: { sourceType: 'note', sourceRefs: [], producerId: 'dn', proofDropRefs: [], receiptRefs: [] },
      integrity: { canonicalization: 'rfc8785', contentHash: sharedMemoryContentHash(memoryId, body), hashAlgorithm: 'sha256' },
      content: { mediaType: 'application/json', body },
      redactionPolicy: { policyId: 'p1', redactionsApplied: [], secretScanPassed: true, piiScanPassed: true },
      derivativeUse: { allowed: true, allowedPurposes: [], attributionRequired: true, redistributionAllowed: false },
      sourceVisibility: 'PUBLIC_SOURCE',
      revocationRef: 'rev.m1',
      ...overrides,
    };
  }
  it('accepts a valid object as IMPORTED_UNVERIFIED (never canonical)', () => {
    const d = evaluateImport(obj(), now);
    expect(d.accepted).toBe(true);
    expect(d.localStatus).toBe('IMPORTED_UNVERIFIED');
  });
  it('rejects an expired object', () => {
    expect(evaluateImport(obj({ expiresAt: '2026-08-02T00:00:00.000Z' }), now).accepted).toBe(false);
  });
  it('rejects an object that did not pass scans', () => {
    expect(
      evaluateImport(obj({ redactionPolicy: { policyId: 'p', redactionsApplied: [], secretScanPassed: false, piiScanPassed: true } }), now).accepted,
    ).toBe(false);
  });
  it('rejects a tampered content hash', () => {
    expect(evaluateImport(obj({ integrity: { canonicalization: 'rfc8785', contentHash: 'sha256:wrong', hashAlgorithm: 'sha256' } }), now).accepted).toBe(false);
  });
});

describe('capability lease invariants', () => {
  function lease(overrides: Partial<CapabilityLeaseManifestV1> = {}): CapabilityLeaseManifestV1 {
    return {
      schemaVersion: 'capability-lease.v1',
      leaseId: 'l1',
      tenantId: 'zaal',
      organismId: 'zao-organism',
      candidateAgentId: 'zol',
      capability: { capabilityId: 'read-research', capabilityVersion: '1', description: 'read', allowedActions: ['read'], blockedActions: ['write'] },
      scope: { resources: [], namespaces: [], audiences: [], networkDestinations: [] },
      constraints: { readOnly: true, maxCalls: 10, maxConcurrency: 1, maxDurationSeconds: 300, maxPayloadBytes: 1024, economicLimitUsd: 0, publicActionAllowed: false },
      approval: { approvalClass: 'canary', approvedBy: '', approvalReceiptRef: '' },
      lifecycle: { issuedAt: '', activatesAt: '', expiresAt: '', revokedAt: '', status: 'EVALUATED' },
      evidence: { prerequisiteClaimRefs: [], competencyRefs: [], issuanceReceiptRef: '', revocationReceiptRef: '', competencyProducerId: 'zol', competencyEvaluatorIds: ['dreamnet-university'] },
      ...overrides,
    };
  }
  it('forbids self-approval', () => {
    expect(guardApproval(lease(), 'zol').ok).toBe(false);
  });
  it('forbids self-certification (producer is sole evaluator)', () => {
    expect(guardApproval(lease({ evidence: { prerequisiteClaimRefs: [], competencyRefs: [], issuanceReceiptRef: '', revocationReceiptRef: '', competencyProducerId: 'zol', competencyEvaluatorIds: ['zol'] } }), 'dreamnet').ok).toBe(false);
  });
  it('allows an independent approver + evaluator', () => {
    expect(guardApproval(lease(), 'dreamnet-verifier').ok).toBe(true);
  });
  it('enforces Stage 0 read-only / $0 / no-public constraints', () => {
    expect(guardStage0Constraints(lease()).ok).toBe(true);
    expect(guardStage0Constraints(lease({ constraints: { ...lease().constraints, readOnly: false } })).ok).toBe(false);
    expect(guardStage0Constraints(lease({ constraints: { ...lease().constraints, economicLimitUsd: 5 } })).ok).toBe(false);
    expect(guardStage0Constraints(lease({ constraints: { ...lease().constraints, publicActionAllowed: true } })).ok).toBe(false);
  });
  it('enforces the lifecycle transition graph', () => {
    expect(canTransition('REQUESTED', 'EVALUATED')).toBe(true);
    expect(canTransition('REQUESTED', 'APPROVED')).toBe(false); // must be EVALUATED first
    expect(canTransition('COMPLETED', 'ACTIVE')).toBe(false); // terminal
  });
});

describe('read-only Spore canary (adversarial matrix via the real trust layer)', () => {
  const now = new Date().toISOString();
  it('flag off => does not run', async () => {
    const r = await runTenantCanary({ tenantId: ZAAL_TENANT_ID, allowedPrefixes: ZAAL_ALLOWED_PREFIXES, nowIso: now });
    expect(r.ran).toBe(false);
  });
  it('valid envelope => ACCEPTED', async () => {
    const r = await runTenantCanary({ tenantId: ZAAL_TENANT_ID, allowedPrefixes: ZAAL_ALLOWED_PREFIXES, nowIso: now, force: true });
    expect(r.ran).toBe(true);
    expect(r.accepted).toBe(true);
  });

  // Direct adversarial cases against verifyEnvelopeWithTrust.
  const audience = `spore.${ZAAL_TENANT_ID}.canary`;
  function setup(expiresAtIso?: string) {
    const id = mintCanaryIdentity(`${ZAAL_TENANT_ID}-canary`, `${ZAAL_TENANT_ID}-canary-k1`);
    const expires = expiresAtIso ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const deps = buildCanaryTrustDeps(id, now, new Date(Date.now() + 60 * 60 * 1000).toISOString());
    const env = buildCanaryEnvelope({ identity: id, tenantId: ZAAL_TENANT_ID, audience, nonce: 'n1', nowIso: now, expiresAtIso: expires });
    return { id, deps, env };
  }
  const deps = () => setup();

  it('wrong audience => REJECTED', async () => {
    const { deps: d, env } = setup();
    const a = await verifyEnvelopeWithTrust(env, { expectedAudience: 'spore.othertenant.canary', keyResolver: d.keyResolver, replayStore: d.replayStore, revocationResolver: d.revocationResolver, schemaRegistry: d.schemaRegistry });
    expect(a.status).not.toBe('ACCEPTED');
  });
  it('replay (same nonce twice) => second not ACCEPTED', async () => {
    const { deps: d, env } = setup();
    const opts = { expectedAudience: audience, keyResolver: d.keyResolver, replayStore: d.replayStore, revocationResolver: d.revocationResolver, schemaRegistry: d.schemaRegistry };
    const first = await verifyEnvelopeWithTrust(env, opts);
    expect(first.status).toBe('ACCEPTED');
    const second = await verifyEnvelopeWithTrust(env, opts);
    expect(second.status).not.toBe('ACCEPTED');
  });
  it('expired envelope => REJECTED', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { deps: d, env } = setup(past);
    const a = await verifyEnvelopeWithTrust(env, { expectedAudience: audience, keyResolver: d.keyResolver, replayStore: d.replayStore, revocationResolver: d.revocationResolver, schemaRegistry: d.schemaRegistry });
    expect(a.status).not.toBe('ACCEPTED');
  });
  it('revoked key => REJECTED', async () => {
    const { id, deps: d, env } = setup();
    d.revocationResolver.revoke(id.issuerId, id.keyId);
    const a = await verifyEnvelopeWithTrust(env, { expectedAudience: audience, keyResolver: d.keyResolver, replayStore: d.replayStore, revocationResolver: d.revocationResolver, schemaRegistry: d.schemaRegistry });
    expect(a.status).not.toBe('ACCEPTED');
  });
  it('altered payload => REJECTED', async () => {
    const { deps: d, env } = setup();
    const tampered = { ...env, subject: { tenantId: ZAAL_TENANT_ID, statement: 'TAMPERED', source: 'evil' } };
    const a = await verifyEnvelopeWithTrust(tampered, { expectedAudience: audience, keyResolver: d.keyResolver, replayStore: d.replayStore, revocationResolver: d.revocationResolver, schemaRegistry: d.schemaRegistry });
    expect(a.status).not.toBe('ACCEPTED');
  });
});
