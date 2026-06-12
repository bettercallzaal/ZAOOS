import { execSync } from 'node:child_process';
import { join } from 'node:path';
import type { CheckResult, EstateConfig, Finding } from '../types';
import { listDirs, pathExists } from '../fs-utils';

/** Count API domains with no __tests__ dir anywhere beneath them. */
export async function countUntestedDomains(
  apiDir: string,
  testDirName: string,
): Promise<{ untested: string[]; total: number }> {
  const domains = await listDirs(apiDir);
  const untested: string[] = [];
  for (const d of domains) {
    const hasTests = await hasDirNamed(join(apiDir, d), testDirName);
    if (!hasTests) untested.push(d);
  }
  return { untested, total: domains.length };
}

async function hasDirNamed(root: string, name: string): Promise<boolean> {
  // BFS for a directory called `name`
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    const subs = await listDirs(dir);
    if (subs.includes(name)) return true;
    for (const s of subs) {
      if (s === 'node_modules') continue;
      stack.push(join(dir, s));
    }
  }
  return false;
}

function tryExec(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e: unknown) {
    // Many of these tools exit non-zero with the payload on stdout (npm audit, tsc).
    const out = (e as { stdout?: string }).stdout;
    return typeof out === 'string' ? out : null;
  }
}

function auditCounts(json: string, allowlist: string[]): { criticalHigh: number; flagged: string[] } {
  let parsed: { vulnerabilities?: Record<string, { severity: string; via?: unknown[] }> };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { criticalHigh: 0, flagged: [] };
  }
  const flagged: string[] = [];
  const allow = new Set(allowlist.map((a) => a.toLowerCase()));
  for (const [pkg, v] of Object.entries(parsed.vulnerabilities ?? {})) {
    if ((v.severity === 'critical' || v.severity === 'high') && !allow.has(pkg.toLowerCase())) {
      flagged.push(`${pkg} (${v.severity})`);
    }
  }
  return { criticalHigh: flagged.length, flagged };
}

export async function qualityCheck(cfg: EstateConfig, opts: { runHeavy?: boolean } = {}): Promise<CheckResult> {
  const findings: Finding[] = [];
  const root = cfg.repoRoot;
  const counts: Record<string, number> = {};

  // 1. Untested API domains (always; pure fs)
  const apiDir = join(root, cfg.quality.apiDomainsDir);
  if (await pathExists(apiDir)) {
    const { untested, total } = await countUntestedDomains(apiDir, cfg.quality.testDirName);
    counts.untestedDomains = untested.length;
    counts.totalDomains = total;
    if (untested.length > cfg.baseline.untestedDomains) {
      findings.push({
        check: 'quality',
        severity: 'warn',
        title: `untested API domains rose to ${untested.length} (baseline ${cfg.baseline.untestedDomains})`,
        detail: `new untested: budget exceeded`,
        fixable: false,
      });
    }
  }

  // 2 + 3. npm audit + typecheck (heavy; only when node_modules present and opted in)
  const heavy = opts.runHeavy && (await pathExists(join(root, 'node_modules')));
  if (heavy) {
    const auditJson = tryExec('npm audit --json', root);
    if (auditJson) {
      const { criticalHigh, flagged } = auditCounts(auditJson, cfg.baseline.auditAllowlist);
      counts.nonAllowlistedCriticalHigh = criticalHigh;
      if (criticalHigh > 0) {
        findings.push({
          check: 'quality',
          severity: 'fail',
          title: `${criticalHigh} non-allowlisted critical/high npm advisories`,
          detail: flagged.slice(0, 8).join(', '),
          fixable: false,
        });
      }
    }
    const tsc = tryExec('npx tsc --noEmit', root);
    if (tsc != null) {
      const errors = (tsc.match(/error TS\d+/g) ?? []).length;
      counts.typecheckErrors = errors;
      if (errors > cfg.baseline.typecheckErrors) {
        findings.push({
          check: 'quality',
          severity: 'fail',
          title: `typecheck errors rose to ${errors} (baseline ${cfg.baseline.typecheckErrors})`,
          detail: 'new type errors introduced',
          fixable: false,
        });
      }
    }
  }

  const fail = findings.some((f) => f.severity === 'fail');
  const warn = findings.some((f) => f.severity === 'warn');
  return { id: 'quality', status: fail ? 'fail' : warn ? 'warn' : 'ok', findings, counts };
}
