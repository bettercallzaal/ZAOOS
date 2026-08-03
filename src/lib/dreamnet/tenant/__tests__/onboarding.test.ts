/**
 * Onboarding kit tests - proves the tenant-organism framework is a reusable
 * TEMPLATE: a second organism onboards from configuration alone, with no change
 * to the framework, and a non-conformant profile is refused (fail closed).
 */

import { describe, it, expect } from 'vitest';
import { onboardTenant, offboardTenant, runTenantConformance } from '@/lib/dreamnet/tenant';
import { ZAAL_TENANT_MANIFEST, ZAAL_ALLOWED_PREFIXES } from '../../../../../tenants/zaal/profile';
import { ACME_TENANT_MANIFEST, ACME_ALLOWED_PREFIXES, ACME_TENANT_ID } from '../../../../../tenants/acme/profile';

const NOW = new Date().toISOString();

describe('onboarding kit - reusable template', () => {
  it('ZAO (tenant #1) passes conformance', async () => {
    const r = await runTenantConformance({ manifest: ZAAL_TENANT_MANIFEST, allowedPrefixes: ZAAL_ALLOWED_PREFIXES, nowIso: NOW });
    expect(r.passed).toBe(true);
  });

  it('a SECOND organism onboards from config alone (no framework change)', async () => {
    const r = await onboardTenant({ manifest: ACME_TENANT_MANIFEST, allowedPrefixes: ACME_ALLOWED_PREFIXES }, NOW);
    expect(r.onboarded).toBe(true);
    expect(r.conformance.passed).toBe(true);
    expect(r.provisioned?.status).toBe('CANARY_APPROVED');
    // every conformance check passed
    expect(r.conformance.checks.every((c) => c.passed)).toBe(true);
  });

  it('the two tenants are namespace-isolated from each other', async () => {
    // Acme must NOT be able to reach ZAO-scoped namespaces and vice versa.
    const acme = await runTenantConformance({ manifest: ACME_TENANT_MANIFEST, allowedPrefixes: ACME_ALLOWED_PREFIXES, nowIso: NOW });
    expect(acme.passed).toBe(true);
    expect(ACME_ALLOWED_PREFIXES.some((p) => p.includes('zaal'))).toBe(false);
  });

  it('refuses a profile that surrenders sovereignty (fail closed)', async () => {
    const bad = { ...ACME_TENANT_MANIFEST, sovereignty: { ...ACME_TENANT_MANIFEST.sovereignty, ownsExecution: false } };
    const r = await onboardTenant({ manifest: bad as typeof ACME_TENANT_MANIFEST, allowedPrefixes: ACME_ALLOWED_PREFIXES }, NOW);
    expect(r.onboarded).toBe(false);
    expect(r.provisioned).toBeUndefined();
  });

  it('refuses a profile whose allowed prefixes drift from canonical', async () => {
    const r = await onboardTenant({ manifest: ACME_TENANT_MANIFEST, allowedPrefixes: ['spore.acme.canary'] }, NOW);
    expect(r.onboarded).toBe(false);
  });

  it('offboard produces a rollback record and preserves receipts', () => {
    const off = offboardTenant({ manifest: ACME_TENANT_MANIFEST, allowedPrefixes: ACME_ALLOWED_PREFIXES });
    expect(off.tenantId).toBe(ACME_TENANT_ID);
    expect(off.revokedNamespaces.length).toBeGreaterThan(0);
    expect(off.rollback.rollbackRef).toContain('rollback');
    expect(off.note).toContain('receipts preserved');
  });
});
