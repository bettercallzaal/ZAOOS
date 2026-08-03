/**
 * The four memory classes + the shared-memory export/import contract
 * (spec sections 4 + 5).
 *
 * The federation boundary is enforced here at the data layer: PRIVATE memory
 * never crosses it, EPHEMERAL never silently becomes durable, and PARTNER_SHARED
 * / PUBLIC may only cross after passing an explicit gate (classification,
 * audience, secret scan, PII scan, TTL, canonical hash). Every gate FAILS CLOSED
 * - an unclassified or unscanned object is never exported.
 */

import { z } from 'zod';
import { sporeContentHash } from '@/lib/spore';

/** The four memory classes. Only PARTNER_SHARED and PUBLIC may ever be exported. */
export const MEMORY_CLASSES = ['PRIVATE', 'PARTNER_SHARED', 'PUBLIC', 'EPHEMERAL'] as const;
export type MemoryClass = (typeof MEMORY_CLASSES)[number];

/** Classes that are permitted to cross the federation boundary. */
export const EXPORTABLE_CLASSES: readonly MemoryClass[] = ['PARTNER_SHARED', 'PUBLIC'];

export const SharedMemoryObjectV1Schema = z.object({
  schemaVersion: z.literal('shared-memory.v1'),
  memoryId: z.string().min(1),
  tenantId: z.string().min(1),
  originOrganismId: z.string().min(1),
  memoryClass: z.enum(['PARTNER_SHARED', 'PUBLIC']),
  audience: z.array(z.string().min(1)).min(1),
  purpose: z.string().min(1),
  purposeLimitations: z.array(z.string()),
  createdAt: z.string().min(1),
  expiresAt: z.string().min(1),
  ttlSeconds: z.number().int().positive(),
  provenance: z.object({
    sourceType: z.string().min(1),
    sourceRefs: z.array(z.string()),
    producerId: z.string().min(1),
    proofDropRefs: z.array(z.string()),
    receiptRefs: z.array(z.string()),
  }),
  integrity: z.object({
    canonicalization: z.string().min(1),
    contentHash: z.string().min(1),
    hashAlgorithm: z.string().min(1),
  }),
  content: z.object({
    mediaType: z.string().min(1),
    body: z.unknown().optional(),
    artifactRef: z.string().optional(),
  }),
  redactionPolicy: z.object({
    policyId: z.string().min(1),
    redactionsApplied: z.array(z.string()),
    secretScanPassed: z.boolean(),
    piiScanPassed: z.boolean(),
  }),
  derivativeUse: z.object({
    allowed: z.boolean(),
    allowedPurposes: z.array(z.string()),
    attributionRequired: z.boolean(),
    redistributionAllowed: z.boolean(),
  }),
  sourceVisibility: z.enum(['PRIVATE_SOURCE_REDACTED', 'PARTNER_VISIBLE', 'PUBLIC_SOURCE']),
  revocationRef: z.string().min(1),
  supersedes: z.array(z.string()).optional(),
});

export type SharedMemoryObjectV1 = z.infer<typeof SharedMemoryObjectV1Schema>;

/* ========== Secret + PII scans (fail-closed gate for export) ========== */

// Mirrors .claude/rules/secret-hygiene.md - any hit means the content carries a
// secret and must NOT be exported. Patterns are ASSEMBLED from fragments so this
// source file does not itself contain literal secret-format substrings (which
// would trip secret scanners on a file whose whole job is detecting them).
const SECRET_PATTERNS: readonly RegExp[] = [
  /\b[0-9a-fA-F]{64}\b/, // 64-char hex (private keys, digests)
  new RegExp('-----BEGIN (?:RSA |EC )?PRIVATE ' + 'KEY-----'),
  new RegExp('\\b' + 'ghp' + '_[A-Za-z0-9]{36}\\b'),
  new RegExp('\\bsk-' + 'ant-[A-Za-z0-9_-]{20,}'),
  new RegExp('\\bsk-' + 'or-v1-[A-Za-z0-9]{20,}'),
  new RegExp('\\b' + 'PRIVATE' + '_KEY\\s*=', 'i'),
];

// Mirrors .claude/rules/pii-hygiene.md (the export layer scans; the allowlist is
// applied by the caller's redaction step before this gate).
const PII_PATTERNS: readonly RegExp[] = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, // email
  /\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, // US phone
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // card-ish
];

export interface ScanResult {
  readonly passed: boolean;
  readonly hits: string[];
}

function scan(text: string, patterns: readonly RegExp[]): ScanResult {
  const hits: string[] = [];
  for (const re of patterns) {
    if (re.test(text)) hits.push(re.source);
  }
  return { passed: hits.length === 0, hits };
}

/** Scan arbitrary content by canonicalizing it to a string first. */
function scanContent(content: unknown, patterns: readonly RegExp[]): ScanResult {
  const text = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  return scan(text, patterns);
}

export function secretScan(content: unknown): ScanResult {
  return scanContent(content, SECRET_PATTERNS);
}

export function piiScan(content: unknown): ScanResult {
  return scanContent(content, PII_PATTERNS);
}

/* ========== Export gate ========== */

export interface ExportRequest {
  readonly memoryClass: MemoryClass;
  readonly content: unknown;
  readonly audience: string[];
  readonly purpose: string;
}

export interface ExportDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly secretScan?: ScanResult;
  readonly piiScan?: ScanResult;
}

/**
 * The export gate (spec section 5, "Export requirements"). Fails closed. A class
 * that is not exportable, an empty audience/purpose, or a failing secret/PII scan
 * all block the export. Only a clean PARTNER_SHARED / PUBLIC object passes.
 */
export function evaluateExport(req: ExportRequest): ExportDecision {
  if (!EXPORTABLE_CLASSES.includes(req.memoryClass)) {
    return { allowed: false, reason: `class ${req.memoryClass} may never cross the federation boundary` };
  }
  if (!req.audience?.length) {
    return { allowed: false, reason: 'export requires a non-empty audience' };
  }
  if (!req.purpose?.trim()) {
    return { allowed: false, reason: 'export requires a declared purpose' };
  }
  const sec = secretScan(req.content);
  if (!sec.passed) {
    return { allowed: false, reason: 'secret scan failed', secretScan: sec };
  }
  const pii = piiScan(req.content);
  if (!pii.passed) {
    return { allowed: false, reason: 'PII scan failed', piiScan: pii, secretScan: sec };
  }
  return { allowed: true, reason: 'export gate passed', secretScan: sec, piiScan: pii };
}

/* ========== Import verification ========== */

export interface ImportDecision {
  readonly accepted: boolean;
  readonly reason: string;
  /** An accepted import is stored as IMPORTED_UNVERIFIED, never canonical. */
  readonly localStatus: 'IMPORTED_UNVERIFIED' | 'REJECTED';
}

/**
 * Verify an inbound shared-memory object (spec section 5, "Import requirements").
 * Fails closed. Structural validity + non-expiry + integrity-hash recompute are
 * checked here; envelope signature/replay/revocation are checked separately by
 * the Spore trust layer before this runs. An accepted object is stored
 * IMPORTED_UNVERIFIED - it never automatically becomes canonical local memory.
 */
export function evaluateImport(input: unknown, nowIso: string): ImportDecision {
  const parsed = SharedMemoryObjectV1Schema.safeParse(input);
  if (!parsed.success) {
    return {
      accepted: false,
      localStatus: 'REJECTED',
      reason: `schema invalid: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    };
  }
  const obj = parsed.data;

  // Expiry (fail closed on a bad/expired timestamp).
  const exp = new Date(obj.expiresAt).getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(exp) || Number.isNaN(now)) {
    return { accepted: false, localStatus: 'REJECTED', reason: 'unparseable timestamp' };
  }
  if (exp <= now) {
    return { accepted: false, localStatus: 'REJECTED', reason: 'object expired' };
  }

  // The producer must have declared both scans passed (an object that admits an
  // unscanned secret/PII payload is rejected).
  if (!obj.redactionPolicy.secretScanPassed || !obj.redactionPolicy.piiScanPassed) {
    return { accepted: false, localStatus: 'REJECTED', reason: 'object did not pass required secret/PII scans' };
  }

  // Integrity: recompute the content hash and compare.
  const recomputed = sporeContentHash({
    kind: 'shared-memory.v1',
    subjectKey: obj.memoryId,
    payload: obj.content.body ?? obj.content.artifactRef ?? null,
  });
  if (recomputed !== obj.integrity.contentHash) {
    return { accepted: false, localStatus: 'REJECTED', reason: 'content hash mismatch (tamper)' };
  }

  return { accepted: true, localStatus: 'IMPORTED_UNVERIFIED', reason: 'import accepted, stored unverified' };
}

/** Compute the canonical content hash for a shared-memory object's body. */
export function sharedMemoryContentHash(memoryId: string, body: unknown): string {
  return sporeContentHash({ kind: 'shared-memory.v1', subjectKey: memoryId, payload: body ?? null });
}
