/**
 * DreamNet tenant-organism layer - public surface (spec: Tenant-Organism Template v1).
 *
 * A reusable, generic framework for an independently-operated organism to join the
 * DreamNet federation as a sovereign TENANT: shared protocols + selected
 * capabilities, but separate sovereignty and private state. No hard ZAO-specific
 * logic lives here (spec section 15) - the ZAO config is a tenant profile
 * (`tenants/zaal/`). Everything is flag-gated OFF and side-effect-free (Stage 0).
 */

export {
  isTenantLayerEnabled,
  isTenantCanaryEnabled,
} from './flags';

export {
  TENANT_STATUSES,
  STAGE0_MAX_STATUS,
  TenantOrganismManifestV1Schema,
  parseTenantManifest,
  isStage0StatusAllowed,
} from './manifest';
export type {
  TenantStatus,
  TenantOrganismManifestV1,
  NamespaceMap,
  Sovereignty,
  ManifestParseResult,
} from './manifest';

export {
  FORBIDDEN_ROOTS,
  checkNamespaceAccess,
  canonicalTenantPrefixes,
} from './namespaces';
export type { NamespaceDecision } from './namespaces';

export {
  MEMORY_CLASSES,
  EXPORTABLE_CLASSES,
  SharedMemoryObjectV1Schema,
  secretScan,
  piiScan,
  evaluateExport,
  evaluateImport,
  sharedMemoryContentHash,
} from './memory';
export type {
  MemoryClass,
  SharedMemoryObjectV1,
  ScanResult,
  ExportRequest,
  ExportDecision,
  ImportDecision,
} from './memory';

export {
  LEASE_STATES,
  CapabilityLeaseManifestV1Schema,
  canTransition,
  guardApproval,
  guardStage0Constraints,
} from './capability-lease';
export type { LeaseState, CapabilityLeaseManifestV1, LeaseGuardResult } from './capability-lease';

export {
  ZAO_STAGE0_BOUNDARY_MATRIX,
  forbiddenResources,
  boundaryMatrixMarkdown,
} from './boundary-matrix';
export type { Access, BoundaryRow } from './boundary-matrix';

export {
  CANARY_SCHEMA,
  mintCanaryIdentity,
  buildCanaryTrustDeps,
  buildCanaryEnvelope,
  runTenantCanary,
} from './canary';
export type { CanaryIdentity, CanaryTrustDeps, BuildEnvelopeOpts, CanaryResult, RunCanaryOpts } from './canary';

export { runTenantConformance } from './conformance';
export type { ConformanceCheck, ConformanceReport, ConformanceInput } from './conformance';

export { onboardTenant, offboardTenant } from './onboarding';
export type { TenantProfile, OnboardResult, OffboardResult } from './onboarding';
