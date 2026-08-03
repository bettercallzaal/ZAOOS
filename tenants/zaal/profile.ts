/**
 * ZAO tenant profile - the ZAO-specific CONFIGURATION for the generic
 * tenant-organism framework (spec section 15: reusability). The framework in
 * `src/lib/dreamnet/tenant/` contains no hard ZAO dependency; a future organism
 * onboards by replacing this profile and its identity, not by forking the gateway.
 *
 * This is a CANARY profile: status CANARY_APPROVED at most, sandbox environment,
 * read-only, $0, flag-gated. It does not deploy anything.
 */

import { canonicalTenantPrefixes } from '@/lib/dreamnet/tenant';
import type { TenantOrganismManifestV1 } from '@/lib/dreamnet/tenant';

export const ZAAL_TENANT_ID = 'zaal';

/**
 * ZAO's Stage 0 manifest. Sovereignty flags are all true (ZAO owns its identity,
 * memory, scheduling, execution, recovery, storage, and economic authority). The
 * status may not exceed CANARY_APPROVED in this iteration.
 */
export const ZAAL_TENANT_MANIFEST: TenantOrganismManifestV1 = {
  schemaVersion: 'tenant-organism.v1',
  tenant: {
    tenantId: ZAAL_TENANT_ID,
    organismId: 'zao-organism',
    displayName: 'The ZAO',
    operatorId: 'bettercallzaal',
    federationNodeId: 'dreamnet-federation-gateway',
    environment: 'sandbox',
    status: 'CANARY_APPROVED',
  },
  identity: {
    publicKeyId: 'zaal-canary-k1',
    supportedSignatureAlgorithms: ['Ed25519'],
    allowedEnvelopeSchemas: ['dreamnet.tenant.canary.v1', 'shared-memory.v1', 'capability-lease.v1'],
    allowedAudiences: [`spore.${ZAAL_TENANT_ID}.canary`, `memory.shared.${ZAAL_TENANT_ID}`],
    keyExpiry: 'rotated-per-canary-run',
    revocationRef: `revocation.${ZAAL_TENANT_ID}`,
  },
  sovereignty: {
    ownsIdentity: true,
    ownsMemory: true,
    ownsScheduling: true,
    ownsExecution: true,
    ownsRecovery: true,
    ownsStorage: true,
    ownsEconomicAuthority: true,
  },
  namespaces: {
    inbound: `spore.${ZAAL_TENANT_ID}.canary`,
    outbound: `proofdrops.${ZAAL_TENANT_ID}`,
    receipts: `receipts.${ZAAL_TENANT_ID}`,
    claims: `claims.${ZAAL_TENANT_ID}`,
    memory: `memory.shared.${ZAAL_TENANT_ID}`,
    artifacts: `artifacts/tenants/${ZAAL_TENANT_ID}`,
    telemetry: `telemetry.${ZAAL_TENANT_ID}`,
  },
  limits: {
    requestsPerMinute: 30,
    maxPayloadBytes: 262144,
    maxConcurrentAssignments: 1,
    maxLeaseDurationSeconds: 300,
    maxArtifactRetentionDays: 30,
  },
  operatorControls: {
    pauseRef: `operator.pause.${ZAAL_TENANT_ID}`,
    revokeRef: `operator.revoke.${ZAAL_TENANT_ID}`,
    rollbackRef: `operator.rollback.${ZAAL_TENANT_ID}`,
  },
};

/** ZAO's canonical allowed namespace prefixes (tenant-scoped). */
export const ZAAL_ALLOWED_PREFIXES: string[] = canonicalTenantPrefixes(ZAAL_TENANT_ID);
