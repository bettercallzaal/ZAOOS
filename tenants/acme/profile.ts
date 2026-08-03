/**
 * Example SECOND tenant organism - proves the tenant-organism framework is a
 * reusable template, not a one-off ZAO integration (spec "Why this matters":
 * "provision a second organism from configuration alone").
 *
 * This organism onboards purely by providing this config file - no change to the
 * framework in `src/lib/dreamnet/tenant/`. Swap the id + identity and a third
 * organism onboards the same way.
 */

import { canonicalTenantPrefixes } from '@/lib/dreamnet/tenant';
import type { TenantOrganismManifestV1 } from '@/lib/dreamnet/tenant';

export const ACME_TENANT_ID = 'acme';

export const ACME_TENANT_MANIFEST: TenantOrganismManifestV1 = {
  schemaVersion: 'tenant-organism.v1',
  tenant: {
    tenantId: ACME_TENANT_ID,
    organismId: 'acme-organism',
    displayName: 'Acme Organism (example second tenant)',
    operatorId: 'acme-operator',
    federationNodeId: 'dreamnet-federation-gateway',
    environment: 'sandbox',
    status: 'CANARY_APPROVED',
  },
  identity: {
    publicKeyId: 'acme-canary-k1',
    supportedSignatureAlgorithms: ['Ed25519'],
    allowedEnvelopeSchemas: ['dreamnet.tenant.canary.v1', 'shared-memory.v1', 'capability-lease.v1'],
    allowedAudiences: [`spore.${ACME_TENANT_ID}.canary`, `memory.shared.${ACME_TENANT_ID}`],
    keyExpiry: 'rotated-per-canary-run',
    revocationRef: `revocation.${ACME_TENANT_ID}`,
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
    inbound: `spore.${ACME_TENANT_ID}.canary`,
    outbound: `proofdrops.${ACME_TENANT_ID}`,
    receipts: `receipts.${ACME_TENANT_ID}`,
    claims: `claims.${ACME_TENANT_ID}`,
    memory: `memory.shared.${ACME_TENANT_ID}`,
    artifacts: `artifacts/tenants/${ACME_TENANT_ID}`,
    telemetry: `telemetry.${ACME_TENANT_ID}`,
  },
  limits: {
    requestsPerMinute: 30,
    maxPayloadBytes: 262144,
    maxConcurrentAssignments: 1,
    maxLeaseDurationSeconds: 300,
    maxArtifactRetentionDays: 30,
  },
  operatorControls: {
    pauseRef: `operator.pause.${ACME_TENANT_ID}`,
    revokeRef: `operator.revoke.${ACME_TENANT_ID}`,
    rollbackRef: `operator.rollback.${ACME_TENANT_ID}`,
  },
};

export const ACME_ALLOWED_PREFIXES: string[] = canonicalTenantPrefixes(ACME_TENANT_ID);
