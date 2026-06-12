#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckResult, EstateConfig, Report } from './types';
import { driftCheck } from './checks/drift';
import { zombieCheck } from './checks/zombie';
import { qualityCheck } from './checks/quality';
import { estateCheck } from './checks/estate';
import { renderDashboardHtml, renderDigest, renderPrComment } from './surfaces/render';

const __dirname = dirname(fileURLToPath(import.meta.url));

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function loadConfig(): Promise<EstateConfig> {
  const path = arg('config') ?? join(__dirname, 'config.json');
  const cfg = JSON.parse(await readFile(path, 'utf8')) as EstateConfig;
  // Resolve repoRoot: "." -> the repo containing this tool (two levels up).
  const envRoot = process.env.ESTATE_REPO_ROOT;
  const raw = arg('repo') ?? envRoot ?? cfg.repoRoot;
  cfg.repoRoot = raw === '.' ? resolve(__dirname, '../..') : isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  return cfg;
}

function scoreAndSummarize(checks: CheckResult[]): Pick<Report, 'healthScore' | 'summary'> {
  let penalty = 0;
  let fail = 0;
  let warn = 0;
  let fixable = 0;
  for (const c of checks) {
    for (const f of c.findings) {
      if (f.severity === 'fail') { penalty += 10; fail++; }
      else if (f.severity === 'warn') { penalty += 3; warn++; }
      if (f.fixable) fixable++;
    }
  }
  return { healthScore: Math.max(0, 100 - penalty), summary: { fail, warn, fixable } };
}

async function runOne(name: string, fn: () => Promise<CheckResult>): Promise<CheckResult> {
  try {
    return await fn();
  } catch (e) {
    return {
      id: name,
      status: 'skipped',
      findings: [],
      note: `check threw: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function main() {
  const cfg = await loadConfig();
  const runHeavy = has('heavy');

  // Isolated: one failing check never sinks the run.
  const checks = await Promise.all([
    runOne('drift', () => driftCheck(cfg)),
    runOne('zombie', () => zombieCheck(cfg)),
    runOne('quality', () => qualityCheck(cfg, { runHeavy })),
    runOne('estate', () => estateCheck(cfg)),
  ]);

  const { healthScore, summary } = scoreAndSummarize(checks);
  const report: Report = {
    repo: cfg.repoRoot,
    generatedAt: new Date().toISOString(),
    healthScore,
    checks,
    summary,
  };

  const out = arg('out') ?? join(__dirname, 'estate-report.json');
  await writeFile(out, JSON.stringify(report, null, 2));

  // Optional rendered surfaces (the GitHub Action passes these paths).
  const dash = arg('dashboard');
  if (dash) await writeFile(dash, renderDashboardHtml(report));
  const digestPath = arg('digest');
  if (digestPath) await writeFile(digestPath, renderDigest(report));
  const prComment = arg('pr-comment');
  if (prComment) {
    const baseFails = arg('baseline-fails');
    await writeFile(prComment, renderPrComment(report, baseFails != null ? Number(baseFails) : undefined));
  }

  // Human summary
  const icon = (s: string) => (s === 'ok' ? '[OK]' : s === 'warn' ? '[WARN]' : s === 'fail' ? '[FAIL]' : '[SKIP]');
  console.log(`\nZAO Estate Control Plane - health ${healthScore}/100`);
  console.log(`repo: ${cfg.repoRoot}`);
  console.log(`fails: ${summary.fail}  warns: ${summary.warn}  fixable: ${summary.fixable}\n`);
  for (const c of checks) {
    console.log(`${icon(c.status)} ${c.id}${c.note ? ` (${c.note})` : ''}`);
    for (const f of c.findings) {
      console.log(`    - [${f.severity}] ${f.title}${f.detail ? ` - ${f.detail}` : ''}`);
    }
  }
  console.log(`\nreport -> ${out}`);

  // Ratchet: fail CI only when fails exceed the accepted baseline (default 0).
  // Existing debt is allowed; NEW debt blocks the PR.
  if (has('ci')) {
    const maxFails = Number(arg('max-fails') ?? 0);
    if (summary.fail > maxFails) {
      console.error(`\nRATCHET BREACH: ${summary.fail} fails > baseline ${maxFails}`);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error('estate-control-plane fatal:', e);
  process.exit(2);
});
