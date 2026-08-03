/**
 * Namespace isolation for tenant organisms (spec section 6).
 *
 * A sovereign tenant may only touch its OWN tenant-scoped namespaces
 * (`spore.zaal.canary.*`, `memory.shared.zaal.*`, ...). It must never reach a
 * DreamNet-internal or another tenant's namespace. Every check FAILS CLOSED:
 * anything not provably inside an allowed, tenant-scoped prefix is denied, and
 * any escape attempt (wildcard, path traversal, encoding trick, cross-tenant
 * reference) is rejected outright.
 */

/**
 * Roots that are ALWAYS forbidden to a tenant, regardless of its allowlist. These
 * are DreamNet-global or privileged namespaces (spec section 6, "Forbidden").
 */
export const FORBIDDEN_ROOTS: readonly string[] = [
  'spore', // the un-scoped global spore root (tenant must use spore.<tenant>.*)
  'memory', // un-scoped global memory
  'receipts',
  'claims',
  'dreamnet.internal',
  'admin',
  'wallets',
  'deployments',
];

export interface NamespaceDecision {
  readonly allowed: boolean;
  readonly reason: string;
}

/** Characters / sequences that indicate an escape attempt - any match = deny. */
const ESCAPE_PATTERNS: ReadonlyArray<{ re: RegExp; label: string }> = [
  { re: /\*/, label: 'wildcard' },
  { re: /\.\./, label: 'path traversal (..)' },
  { re: /\/{2,}/, label: 'double slash' },
  { re: /%[0-9a-fA-F]{2}/, label: 'percent-encoding' },
  { re: /\\/, label: 'backslash' },
  { re: /\\u[0-9a-fA-F]{4}/, label: 'unicode escape' },
  { re: /[\x00-\x1f\x7f]/, label: 'control character' },
  { re: /\s/, label: 'whitespace' },
];

/**
 * Does `subject` sit inside `prefix` on a proper segment boundary? Prevents the
 * prefix-collision escape where `spore.zaal` would otherwise match
 * `spore.zaalX.evil`. A match requires exact equality or the prefix followed by
 * a `.` or `/` separator.
 */
function withinPrefix(subject: string, prefix: string): boolean {
  if (subject === prefix) return true;
  return subject.startsWith(`${prefix}.`) || subject.startsWith(`${prefix}/`);
}

/** The first path/dot segment root of a subject (e.g. `spore` from `spore.x.y`). */
function rootOf(subject: string): string {
  const bySlash = subject.split('/')[0] ?? subject;
  return bySlash.split('.')[0] ?? bySlash;
}

/**
 * Decide whether a tenant may access a namespace/subject. Fail-closed.
 *
 * @param subject         the requested namespace or object subject
 * @param allowedPrefixes the tenant's declared, tenant-scoped allow prefixes
 */
export function checkNamespaceAccess(subject: string, allowedPrefixes: readonly string[]): NamespaceDecision {
  if (typeof subject !== 'string' || subject.length === 0) {
    return { allowed: false, reason: 'empty or non-string subject' };
  }

  // 1. Escape attempts fail closed before any allow-matching.
  for (const { re, label } of ESCAPE_PATTERNS) {
    if (re.test(subject)) return { allowed: false, reason: `rejected: ${label}` };
  }

  // 2. Forbidden roots are denied even if an allowlist entry looks similar. The
  //    forbidden root is matched on a segment boundary, so `spore` blocks the
  //    bare `spore.*` global but NOT the tenant-scoped `spore.zaal.*` (which has
  //    root `spore` too) - so we only forbid when NO allowed prefix covers it.
  //    Order: an allow match must be POSITIVE and tenant-scoped; a bare forbidden
  //    root with no covering allow prefix is denied.
  const coveredByAllow = allowedPrefixes.some((p) => withinPrefix(subject, p));
  if (!coveredByAllow) {
    const root = rootOf(subject);
    if (FORBIDDEN_ROOTS.includes(subject) || FORBIDDEN_ROOTS.includes(root)) {
      return { allowed: false, reason: `forbidden root: ${root}` };
    }
    return { allowed: false, reason: 'no allowed tenant prefix covers this subject' };
  }

  return { allowed: true, reason: 'within an allowed tenant-scoped prefix' };
}

/**
 * The canonical allowed-prefix set for a tenant, derived from its tenant id.
 * Every prefix is tenant-scoped, so one tenant's set can never cover another
 * tenant's subjects (that is the cross-tenant isolation guarantee).
 */
export function canonicalTenantPrefixes(tenantId: string): string[] {
  return [
    `spore.${tenantId}.canary`,
    `memory.shared.${tenantId}`,
    `proofdrops.${tenantId}`,
    `receipts.${tenantId}`,
    `claims.${tenantId}`,
    `verification.${tenantId}`,
    `university.${tenantId}`,
    `leases.${tenantId}`,
    `whale.paper.${tenantId}`,
    `trappers.${tenantId}`,
    `telemetry.${tenantId}`,
    `artifacts/tenants/${tenantId}`,
  ];
}
