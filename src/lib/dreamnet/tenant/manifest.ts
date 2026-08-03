/**
 * TenantOrganismManifestV1 - the versioned identity + sovereignty declaration for
 * an external organism joining the DreamNet federation as a sovereign tenant
 * (spec section 2).
 *
 * The manifest is the authoritative statement of what the tenant owns (identity,
 * memory, scheduling, execution, recovery, storage, economic authority) and what
 * it may reach through the federation gateway. It is data, validated with Zod and
 * fail-closed - an unparseable manifest is never treated as a partial success.
 */

import { z } from 'zod';

/**
 * Promotion ladder. A tenant starts UNVERIFIED_CANDIDATE and may advance only by
 * external approval. Stage 0 (this iteration) may not promote beyond
 * CANARY_APPROVED (spec section 2, acceptance criteria).
 */
export const TENANT_STATUSES = [
  'UNVERIFIED_CANDIDATE',
  'CANARY_APPROVED',
  'LIMITED_FEDERATION',
  'VERIFIED_PARTNER',
] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/** The highest status Stage 0 is permitted to reach. */
export const STAGE0_MAX_STATUS: TenantStatus = 'CANARY_APPROVED';

const NamespaceMapSchema = z.object({
  inbound: z.string().min(1),
  outbound: z.string().min(1),
  receipts: z.string().min(1),
  claims: z.string().min(1),
  memory: z.string().min(1),
  artifacts: z.string().min(1),
  telemetry: z.string().min(1),
});
export type NamespaceMap = z.infer<typeof NamespaceMapSchema>;

const SovereigntySchema = z.object({
  ownsIdentity: z.literal(true),
  ownsMemory: z.literal(true),
  ownsScheduling: z.literal(true),
  ownsExecution: z.literal(true),
  ownsRecovery: z.literal(true),
  ownsStorage: z.literal(true),
  ownsEconomicAuthority: z.literal(true),
});
export type Sovereignty = z.infer<typeof SovereigntySchema>;

export const TenantOrganismManifestV1Schema = z.object({
  schemaVersion: z.literal('tenant-organism.v1'),
  tenant: z.object({
    tenantId: z.string().min(1),
    organismId: z.string().min(1),
    displayName: z.string().min(1),
    operatorId: z.string().min(1),
    federationNodeId: z.string().min(1),
    environment: z.enum(['local', 'test', 'preview', 'sandbox']),
    status: z.enum(TENANT_STATUSES),
  }),
  identity: z.object({
    publicKeyId: z.string().min(1),
    supportedSignatureAlgorithms: z.array(z.string().min(1)).min(1),
    allowedEnvelopeSchemas: z.array(z.string().min(1)).min(1),
    allowedAudiences: z.array(z.string().min(1)).min(1),
    keyExpiry: z.string().min(1),
    revocationRef: z.string().min(1),
  }),
  // Sovereignty is non-negotiable: every ownership flag must be true. A manifest
  // that surrenders any of these is not a sovereign tenant and fails validation.
  sovereignty: SovereigntySchema,
  namespaces: NamespaceMapSchema,
  limits: z.object({
    requestsPerMinute: z.number().int().positive(),
    maxPayloadBytes: z.number().int().positive(),
    maxConcurrentAssignments: z.number().int().positive(),
    maxLeaseDurationSeconds: z.number().int().positive(),
    maxArtifactRetentionDays: z.number().int().positive(),
  }),
  operatorControls: z.object({
    pauseRef: z.string().min(1),
    revokeRef: z.string().min(1),
    rollbackRef: z.string().min(1),
  }),
});

export type TenantOrganismManifestV1 = z.infer<typeof TenantOrganismManifestV1Schema>;

export interface ManifestParseResult {
  readonly ok: boolean;
  readonly manifest?: TenantOrganismManifestV1;
  readonly errors?: string[];
}

/**
 * Parse + validate a manifest, fail-closed. Returns structured errors rather than
 * throwing, so callers can surface a rejection without a partial object.
 */
export function parseTenantManifest(input: unknown): ManifestParseResult {
  const result = TenantOrganismManifestV1Schema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }
  return { ok: true, manifest: result.data };
}

/**
 * Guard: is the requested status transition allowed in Stage 0? Stage 0 may not
 * promote past CANARY_APPROVED. Any higher target is rejected (fail-closed).
 */
export function isStage0StatusAllowed(status: TenantStatus): boolean {
  const rank = TENANT_STATUSES.indexOf(status);
  const maxRank = TENANT_STATUSES.indexOf(STAGE0_MAX_STATUS);
  return rank >= 0 && rank <= maxRank;
}
