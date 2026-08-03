/**
 * Tenant conformance suite (spec section 15: "conformance-test suite").
 *
 * The reusable gate every organism must pass to onboard. It runs the Stage 0
 * invariants against a candidate tenant's manifest + allowed prefixes and returns
 * a structured pass/fail report. It contains NO organism-specific logic - the same
 * suite validates ZAO and any future tenant. Fails closed: any failed check fails
 * the whole suite.
 */

import { parseTenantManifest, isStage0StatusAllowed, type TenantOrganismManifestV1 } from './manifest';
import { checkNamespaceAccess, canonicalTenantPrefixes, FORBIDDEN_ROOTS } from './namespaces';
import { evaluateExport } from './memory';
import { runTenantCanary } from './canary';

export interface ConformanceCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ConformanceReport {
  readonly tenantId: string;
  readonly passed: boolean;
  readonly checks: ConformanceCheck[];
}

export interface ConformanceInput {
  readonly manifest: TenantOrganismManifestV1;
  readonly allowedPrefixes: readonly string[];
  readonly nowIso: string;
}

/**
 * Run the full Stage 0 conformance suite against a candidate tenant. Every check
 * must pass. A missing check is a FAIL, not a skip.
 */
export async function runTenantConformance(input: ConformanceInput): Promise<ConformanceReport> {
  const checks: ConformanceCheck[] = [];
  const tenantId = input.manifest.tenant.tenantId;

  // 1. Manifest is structurally valid + sovereign (sovereignty is a schema literal).
  const parsed = parseTenantManifest(input.manifest);
  checks.push({
    name: 'manifest-valid-and-sovereign',
    passed: parsed.ok,
    detail: parsed.ok ? 'manifest parses; all sovereignty flags true' : `invalid: ${(parsed.errors ?? []).join('; ')}`,
  });

  // 2. Status may not exceed CANARY_APPROVED in Stage 0.
  const statusOk = isStage0StatusAllowed(input.manifest.tenant.status);
  checks.push({
    name: 'status-within-stage0',
    passed: statusOk,
    detail: statusOk ? `status ${input.manifest.tenant.status} allowed` : `status ${input.manifest.tenant.status} exceeds CANARY_APPROVED`,
  });

  // 3. Allowed prefixes are the canonical, tenant-scoped set (no drift / no wildcards).
  const canonical = canonicalTenantPrefixes(tenantId);
  const prefixesMatch =
    input.allowedPrefixes.length === canonical.length && canonical.every((p) => input.allowedPrefixes.includes(p));
  checks.push({
    name: 'namespaces-canonical-and-scoped',
    passed: prefixesMatch,
    detail: prefixesMatch ? 'allowed prefixes are the canonical tenant-scoped set' : 'allowed prefixes drift from canonical',
  });

  // 4. A tenant-scoped subject is allowed; every forbidden root is rejected.
  const ownAllowed = checkNamespaceAccess(`spore.${tenantId}.canary.x`, input.allowedPrefixes).allowed;
  const allForbiddenRejected = FORBIDDEN_ROOTS.every((r) => !checkNamespaceAccess(r, input.allowedPrefixes).allowed);
  checks.push({
    name: 'namespace-isolation',
    passed: ownAllowed && allForbiddenRejected,
    detail: ownAllowed && allForbiddenRejected ? 'own namespace allowed; all forbidden roots rejected' : 'namespace isolation failed',
  });

  // 5. Export gate blocks a secret (fail-closed behavior is present).
  const secretBlocked = !evaluateExport({
    memoryClass: 'PARTNER_SHARED',
    // assembled so this source carries no literal secret prefix
    content: `key ${'sk-' + 'ant-abcdefghijklmnopqrstuvwxyz1234'}`,
    audience: ['dreamnet'],
    purpose: 'test',
  }).allowed;
  checks.push({
    name: 'export-gate-blocks-secret',
    passed: secretBlocked,
    detail: secretBlocked ? 'secret content is blocked from export' : 'export gate did NOT block a secret',
  });

  // 6. The read-only Spore canary round-trips to ACCEPTED (forced, since flag is off).
  const canary = await runTenantCanary({ tenantId, allowedPrefixes: input.allowedPrefixes, nowIso: input.nowIso, force: true });
  checks.push({
    name: 'readonly-canary-accepted',
    passed: canary.ran && canary.accepted,
    detail: canary.ran ? `canary ${canary.accepted ? 'ACCEPTED' : 'rejected'}: ${canary.reason}` : 'canary did not run',
  });

  return { tenantId, passed: checks.every((c) => c.passed), checks };
}
