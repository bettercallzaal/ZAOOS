// Shared types for the ZAO Estate Control Plane.
// See docs/superpowers/specs/2026-06-12-estate-control-plane-design.md

// 'crashed' (ZAO research doc 2478, inverted alarm #5): a check that THROWS is
// not the same as a check that RAN and found nothing — a crash is not
// evidence of health, it is an absence of measurement. It is scored above
// 'fail' in scoreAndSummarize so a thrown check trips the PR ratchet instead
// of contributing zero findings and scoring identically to a clean pass.
export type Severity = 'crashed' | 'fail' | 'warn' | 'info';
export type CheckStatus = 'ok' | 'warn' | 'fail' | 'crashed' | 'skipped';

export interface Finding {
  check: string;
  severity: Severity;
  title: string;
  detail: string;
  /** repo-relative path, when applicable */
  file?: string;
  /** true if a machine can mechanically correct this (e.g. a stale count) */
  fixable?: boolean;
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  findings: Finding[];
  /** optional raw counts the check measured (live vs documented, etc) */
  counts?: Record<string, number>;
  /** present when status === 'skipped' or the check threw */
  note?: string;
}

export interface Report {
  repo: string;
  generatedAt: string;
  healthScore: number;
  checks: CheckResult[];
  summary: { fail: number; warn: number; fixable: number; crashed: number };
}

export interface DocPointer {
  /** repo-relative path to a doc that claims counts */
  file: string;
  /** label -> regex (with one capture group for the number) that finds a claimed count */
  claims: Record<string, string>;
}

export interface GraduationEntry {
  name: string;
  /** repo-relative paths that MUST be gone after graduation */
  removedPaths: string[];
  /** optional redirect route that SHOULD exist */
  redirect?: string;
}

export interface EstateConfig {
  repoRoot: string;
  /** live-count sources (globs relative to repoRoot) */
  live: {
    apiRoutes: string;
    apiDomainsDir: string;
    components: string;
    hooks: string;
    libDomainsDir: string;
    researchDir: string;
  };
  /** docs that claim counts, and the regexes to read them */
  docPointers: DocPointer[];
  /** directories a doc project-map might claim; flagged if absent */
  phantomPathScan: { file: string }[];
  zombie: {
    denylist: { pattern: string; label: string; paths: string[] }[];
    graduation: GraduationEntry[];
  };
  quality: {
    apiDomainsDir: string;
    testDirName: string;
  };
  staleness: {
    /** research doc last-validated older than this (days) -> warn */
    maxDays: number;
    /** estate scan stamp older than this (days) -> warn */
    estateMaxDays: number;
    estateStampFile: string;
  };
  baseline: {
    /** known-deferred npm audit advisory ids/titles to ignore */
    auditAllowlist: string[];
    /** typecheck errors allowed (pre-existing debt); fail if exceeded */
    typecheckErrors: number;
    /** untested API domains allowed; warn count, never fails */
    untestedDomains: number;
    /** accepted total 'fail' findings (the ratchet). New debt above this blocks a PR. */
    ratchetMaxFails: number;
  };
}
