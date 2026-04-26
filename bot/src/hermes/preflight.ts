import { runCmd } from './git';
import { HERMES_FORBIDDEN_PATHS } from './types';

export interface PreFlightResult {
  ok: boolean;
  error?: string;
  durationMs: number;
  scope: 'bot-only' | 'app-only' | 'mixed' | 'docs-only';
  checks: {
    forbiddenPaths: 'pass' | 'fail';
    typecheck: 'pass' | 'fail' | 'skipped';
    lint: 'pass' | 'fail' | 'skipped';
    tests: 'pass' | 'fail' | 'skipped';
  };
}

/**
 * Pre-flight quality gate. Runs CI-equivalent checks BEFORE Critic sees diff.
 *
 * Scope detection: ZAO OS root is huge (301 API routes + 279 components) so
 * `tsc --noEmit` on the whole tree OOMs at default 2GB heap. We scope checks
 * to the smallest project that contains all changed files:
 *   - Only bot/* changed -> `cd bot && npm run typecheck` + biome on bot/
 *   - Only src/* changed -> root typecheck (with NODE_OPTIONS=4GB)
 *   - Mixed -> both
 *   - Only docs/research changed -> skip type/lint entirely
 *
 * Auto-loops back to Coder on fail. Cost: 0 tokens. Time: 5-30s typical.
 */
export async function runPreFlightGate(input: {
  workTreePath: string;
  filesChanged: string[];
}): Promise<PreFlightResult> {
  const start = Date.now();
  const checks: PreFlightResult['checks'] = {
    forbiddenPaths: 'pass',
    typecheck: 'skipped',
    lint: 'skipped',
    tests: 'skipped',
  };
  const scope = detectScope(input.filesChanged);

  // Check 0: forbidden paths (cheapest, fail fast).
  for (const f of input.filesChanged) {
    if (HERMES_FORBIDDEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`))) {
      checks.forbiddenPaths = 'fail';
      return {
        ok: false,
        error: `Coder wrote forbidden path: ${f}. Revert the file and try again.`,
        durationMs: Date.now() - start,
        scope,
        checks,
      };
    }
  }

  // Docs-only? Skip type/lint - nothing they'd catch.
  if (scope === 'docs-only') {
    return { ok: true, durationMs: Date.now() - start, scope, checks };
  }

  // Generous heap for tsc on root workspace (default 2GB OOMs on 301 routes).
  const heapEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=4096`.trim(),
  };

  // Bot-side typecheck (small, fast). Run when scope is bot-only or mixed.
  if (scope === 'bot-only' || scope === 'mixed') {
    const tc = await runCmd('npm', ['run', '--silent', 'typecheck'], `${input.workTreePath}/bot`, heapEnv);
    if (tc.exitCode !== 0) {
      checks.typecheck = 'fail';
      const out = (tc.stdout + '\n' + tc.stderr).slice(0, 1500);
      return {
        ok: false,
        error: `Bot typecheck failed. Fix these before retrying:\n\n${out}`,
        durationMs: Date.now() - start,
        scope,
        checks,
      };
    }
  }

  // App-side typecheck (heavy). Run when scope is app-only or mixed.
  if (scope === 'app-only' || scope === 'mixed') {
    const tc = await runCmd('npm', ['run', '--silent', 'typecheck'], input.workTreePath, heapEnv);
    if (tc.exitCode !== 0) {
      checks.typecheck = 'fail';
      const out = (tc.stdout + '\n' + tc.stderr).slice(0, 1500);
      return {
        ok: false,
        error: `App typecheck failed. Fix these before retrying:\n\n${out}`,
        durationMs: Date.now() - start,
        scope,
        checks,
      };
    }
  }
  checks.typecheck = 'pass';

  // Biome lint - scope to changed paths only (root command lints everything,
  // can over-report on unrelated drift like PR #321).
  const lintTargets = lintScopeFor(scope, input.filesChanged);
  if (lintTargets.length > 0) {
    const lint = await runCmd('npx', ['biome', 'check', ...lintTargets], input.workTreePath, heapEnv);
    if (lint.exitCode !== 0) {
      checks.lint = 'fail';
      const out = (lint.stdout + '\n' + lint.stderr).slice(0, 1500);
      return {
        ok: false,
        error: `Lint errors block the merge. Fix these before retrying. Tip: \`npx biome check --write ${lintTargets.join(' ')}\` auto-fixes style:\n\n${out}`,
        durationMs: Date.now() - start,
        scope,
        checks,
      };
    }
    checks.lint = 'pass';
  }

  // Tests, only if Coder modified test files.
  const touchedTests = input.filesChanged.some(
    (f) => f.includes('__tests__') || f.endsWith('.test.ts') || f.endsWith('.test.tsx'),
  );
  if (touchedTests) {
    const test = await runCmd(
      'npx',
      ['vitest', 'run', '--reporter=verbose', '--no-coverage'],
      input.workTreePath,
      heapEnv,
    );
    if (test.exitCode !== 0) {
      checks.tests = 'fail';
      const out = (test.stdout + '\n' + test.stderr).slice(-1500);
      return {
        ok: false,
        error: `Tests failed. Fix the failing tests OR the code that broke them:\n\n${out}`,
        durationMs: Date.now() - start,
        scope,
        checks,
      };
    }
    checks.tests = 'pass';
  }

  return { ok: true, durationMs: Date.now() - start, scope, checks };
}

function detectScope(files: string[]): PreFlightResult['scope'] {
  let bot = false;
  let app = false;
  let docs = false;
  for (const f of files) {
    if (f.startsWith('bot/')) bot = true;
    else if (
      f.startsWith('src/') ||
      f.startsWith('contracts/') ||
      f.startsWith('scripts/') ||
      f === 'community.config.ts' ||
      f === 'next.config.ts'
    )
      app = true;
    else if (f.startsWith('research/') || f.startsWith('docs/') || f.endsWith('.md')) docs = true;
    else app = true; // unknown -> treat as app to be safe
  }
  if (bot && app) return 'mixed';
  if (bot) return 'bot-only';
  if (app) return 'app-only';
  if (docs) return 'docs-only';
  return 'docs-only';
}

function lintScopeFor(scope: PreFlightResult['scope'], filesChanged: string[]): string[] {
  if (scope === 'bot-only') return ['bot/'];
  if (scope === 'app-only' || scope === 'mixed') {
    // Lint only top-level dirs containing changed files (avoids OOM on full repo).
    const dirs = new Set<string>();
    for (const f of filesChanged) {
      const top = f.split('/')[0];
      if (top && !top.endsWith('.md')) dirs.add(`${top}/`);
    }
    return Array.from(dirs);
  }
  return [];
}
