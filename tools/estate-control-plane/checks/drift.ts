import { join } from 'node:path';
import type { CheckResult, EstateConfig, Finding } from '../types';
import {
  countFilesNamed,
  countResearchDocs,
  listDirs,
  pathExists,
  readFileSafe,
  walk,
} from '../fs-utils';

/** Live counts measured from the repo - the ground truth docs are compared against. */
export async function measureLiveCounts(cfg: EstateConfig): Promise<Record<string, number>> {
  const root = cfg.repoRoot;
  const [apiRoutes, components, hooks, researchDocs] = await Promise.all([
    countFilesNamed(join(root, 'src/app/api'), 'route.ts'),
    walk(join(root, 'src/components'), (_r, n) => n.endsWith('.tsx')).then((f) => f.length),
    walk(join(root, 'src/hooks'), (_r, n) => /\.tsx?$/.test(n) && !n.includes('.test.')).then((f) => f.length),
    countResearchDocs(join(root, cfg.live.researchDir)),
  ]);
  const apiDomains = (await listDirs(join(root, cfg.live.apiDomainsDir))).length;
  const libDomains = (await listDirs(join(root, cfg.live.libDomainsDir))).length;
  return { apiRoutes, apiDomains, components, hooks, libDomains, researchDocs };
}

function readClaim(text: string, regex: string): number | null {
  const m = text.match(new RegExp(regex));
  return m && m[1] ? Number(m[1]) : null;
}

/**
 * Phantom paths: directories claimed in a doc's PROJECT-MAP TABLE that don't
 * exist. Scoped to table rows whose first cell is a backticked path
 * (`| `contracts/` | ... |`) so prose mentions of dirs that live deeper in the
 * tree (e.g. `music/` meaning src/components/music/) don't false-positive.
 */
async function phantomPaths(root: string, docText: string): Promise<string[]> {
  const tokens = new Set<string>();
  for (const line of docText.split('\n')) {
    const m = line.match(/^\|\s*`([A-Za-z0-9_.-]+\/)`\s*\|/);
    if (m) tokens.add(m[1]);
  }
  const missing: string[] = [];
  for (const t of tokens) {
    if (!(await pathExists(join(root, t)))) missing.push(t);
  }
  return missing;
}

export async function driftCheck(cfg: EstateConfig): Promise<CheckResult> {
  const findings: Finding[] = [];
  const live = await measureLiveCounts(cfg);

  // 1. Documented counts vs live
  for (const ptr of cfg.docPointers) {
    const text = await readFileSafe(join(cfg.repoRoot, ptr.file));
    if (text == null) continue;
    for (const [key, regex] of Object.entries(ptr.claims)) {
      const claimed = readClaim(text, regex);
      const actual = live[key];
      if (claimed == null || actual == null) continue;
      if (claimed !== actual) {
        findings.push({
          check: 'drift',
          severity: 'fail',
          title: `${ptr.file}: ${key} count drift`,
          detail: `claims ${claimed}, repo has ${actual}`,
          file: ptr.file,
          fixable: true,
        });
      }
    }
  }

  // 2. Phantom paths (documented dirs that don't exist)
  for (const scan of cfg.phantomPathScan) {
    const text = await readFileSafe(join(cfg.repoRoot, scan.file));
    if (text == null) continue;
    for (const missing of await phantomPaths(cfg.repoRoot, text)) {
      findings.push({
        check: 'drift',
        severity: 'fail',
        title: `${scan.file}: phantom path \`${missing}\``,
        detail: `documented directory does not exist on disk`,
        file: scan.file,
        fixable: false,
      });
    }
  }

  // 3. Stale research docs (have a last-validated past the SLA)
  const stale = await countStaleDocs(join(cfg.repoRoot, cfg.live.researchDir), cfg.staleness.maxDays);
  if (stale.count > 0) {
    findings.push({
      check: 'drift',
      severity: 'warn',
      title: `${stale.count} research docs past last-validated SLA (${cfg.staleness.maxDays}d)`,
      detail: stale.examples.length ? `e.g. ${stale.examples.join(', ')}` : '',
      fixable: false,
    });
  }

  const fail = findings.some((f) => f.severity === 'fail');
  const warn = findings.some((f) => f.severity === 'warn');
  return {
    id: 'drift',
    status: fail ? 'fail' : warn ? 'warn' : 'ok',
    findings,
    counts: live,
  };
}

async function countStaleDocs(
  researchDir: string,
  maxDays: number,
): Promise<{ count: number; examples: string[] }> {
  const readmes = await walk(researchDir, (_r, n) => n === 'README.md');
  const nowMs = Date.now();
  let count = 0;
  const examples: string[] = [];
  for (const file of readmes) {
    const text = await readFileSafe(file);
    if (!text) continue;
    const m = text.match(/last-validated:\s*(\d{4})-(\d{2})-(\d{2})/);
    if (!m) continue;
    const ageDays = (nowMs - Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) / 86_400_000;
    if (ageDays > maxDays) {
      count++;
      if (examples.length < 5) {
        const slug = file.split('/').slice(-2, -1)[0];
        examples.push(slug ?? file);
      }
    }
  }
  return { count, examples };
}
