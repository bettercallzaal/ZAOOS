/**
 * Tenant onboarding kit (spec section 15 + "Why this matters": provision a second
 * organism from configuration alone).
 *
 * A new organism onboards by providing a tenant profile (manifest + allowed
 * prefixes) - NO gateway fork, no framework change. `onboardTenant` runs the
 * conformance suite and, only if it passes, returns the provisioned namespace map
 * and an ACTIVE-but-CANARY tenant record. `offboardTenant` produces the rollback /
 * revocation record. Both fail closed.
 */

import { canonicalTenantPrefixes } from './namespaces';
import { runTenantConformance, type ConformanceReport } from './conformance';
import type { TenantOrganismManifestV1, NamespaceMap } from './manifest';

export interface TenantProfile {
  readonly manifest: TenantOrganismManifestV1;
  readonly allowedPrefixes: readonly string[];
}

export interface OnboardResult {
  readonly onboarded: boolean;
  readonly tenantId: string;
  readonly reason: string;
  readonly conformance: ConformanceReport;
  readonly provisioned?: {
    readonly namespaces: NamespaceMap;
    readonly allowedPrefixes: readonly string[];
    readonly status: 'CANARY_APPROVED';
  };
}

/**
 * Onboard a tenant from its profile alone. Runs conformance; provisions ONLY on a
 * full pass. A tenant that fails any conformance check is refused (fail-closed) -
 * nothing is provisioned.
 */
export async function onboardTenant(profile: TenantProfile, nowIso: string): Promise<OnboardResult> {
  const tenantId = profile.manifest.tenant.tenantId;
  const conformance = await runTenantConformance({
    manifest: profile.manifest,
    allowedPrefixes: profile.allowedPrefixes,
    nowIso,
  });

  if (!conformance.passed) {
    const failed = conformance.checks.filter((c) => !c.passed).map((c) => c.name);
    return { onboarded: false, tenantId, reason: `conformance failed: ${failed.join(', ')}`, conformance };
  }

  return {
    onboarded: true,
    tenantId,
    reason: 'conformance passed; provisioned as CANARY_APPROVED',
    conformance,
    provisioned: {
      namespaces: profile.manifest.namespaces,
      allowedPrefixes: profile.allowedPrefixes,
      status: 'CANARY_APPROVED',
    },
  };
}

export interface OffboardResult {
  readonly tenantId: string;
  readonly revokedNamespaces: string[];
  readonly rollback: {
    readonly pauseRef: string;
    readonly revokeRef: string;
    readonly rollbackRef: string;
  };
  readonly note: string;
}

/**
 * Offboard a tenant: produce the revocation + rollback record (spec section 14/16).
 * This revokes the tenant's namespaces and surfaces the operator control refs -
 * it does NOT erase receipts (terminal receipts are preserved).
 */
export function offboardTenant(profile: TenantProfile): OffboardResult {
  const tenantId = profile.manifest.tenant.tenantId;
  return {
    tenantId,
    revokedNamespaces: canonicalTenantPrefixes(tenantId),
    rollback: {
      pauseRef: profile.manifest.operatorControls.pauseRef,
      revokeRef: profile.manifest.operatorControls.revokeRef,
      rollbackRef: profile.manifest.operatorControls.rollbackRef,
    },
    note: 'namespaces revoked; receipts preserved (never erased); rollback refs surfaced for the operator',
  };
}
