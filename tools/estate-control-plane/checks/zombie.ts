import { join, relative } from 'node:path';
import type { CheckResult, EstateConfig, Finding } from '../types';
import { pathExists, readFileSafe, walk } from '../fs-utils';

// Code only - decommissioned/half-built CODE is the concern. Doc/README mentions
// of a retired system are history, not zombies, so .md is excluded.
const TEXT_EXT = /\.(ts|tsx|js|jsx)$/;

/** Detect graduated/decommissioned code that should be gone, plus half-built markers. */
export async function zombieCheck(cfg: EstateConfig): Promise<CheckResult> {
  const findings: Finding[] = [];
  const root = cfg.repoRoot;

  // 1. Denylist patterns still present in code
  for (const entry of cfg.zombie.denylist) {
    const needle = entry.pattern.toLowerCase();
    let hits = 0;
    const examples: string[] = [];
    for (const p of entry.paths) {
      const files = await walk(join(root, p), (_r, n) => TEXT_EXT.test(n));
      for (const file of files) {
        const text = await readFileSafe(file);
        if (text && text.toLowerCase().includes(needle)) {
          hits++;
          if (examples.length < 5) examples.push(relative(root, file));
        }
      }
    }
    if (hits > 0) {
      findings.push({
        check: 'zombie',
        severity: 'warn',
        title: `${entry.label}: ${hits} file(s)`,
        detail: examples.join(', '),
        fixable: false,
      });
    }
  }

  // 2. Graduation ledger: graduated code must be gone; redirect should exist
  for (const grad of cfg.zombie.graduation) {
    for (const p of grad.removedPaths) {
      if (await pathExists(join(root, p))) {
        findings.push({
          check: 'zombie',
          severity: 'fail',
          title: `graduated '${grad.name}' code still present`,
          detail: `${p} should have been deleted on graduation`,
          file: p,
          fixable: false,
        });
      }
    }
    if (grad.redirect && !(await redirectExists(root, grad.redirect))) {
      findings.push({
        check: 'zombie',
        severity: 'warn',
        title: `graduated '${grad.name}' missing redirect`,
        detail: `expected a redirect for ${grad.redirect}`,
        fixable: false,
      });
    }
  }

  const fail = findings.some((f) => f.severity === 'fail');
  const warn = findings.some((f) => f.severity === 'warn');
  return { id: 'zombie', status: fail ? 'fail' : warn ? 'warn' : 'ok', findings };
}

async function redirectExists(root: string, route: string): Promise<boolean> {
  // Heuristic: a next.config redirect or a page that calls redirect() for the route.
  const cfgText = (await readFileSafe(join(root, 'next.config.ts'))) ?? (await readFileSafe(join(root, 'next.config.js')));
  if (cfgText && cfgText.includes(route)) return true;
  return false;
}
