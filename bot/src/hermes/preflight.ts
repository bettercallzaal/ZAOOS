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
    tests: 'pass' | 'fail' | 'skipped';
  };
}

/**
 * Pre-flight quality gate. Per doc 531 audit: SIMPLIFIED to typecheck + tests.
 *
 * Why no lint anymore: each "hardening" feature added to this gate has
 * introduced new failure modes (biome ignored bot/, biome heap OOM, scope
 * detection edge cases). 3 of last 4 escalations were lint-config issues.
 * Lint catches STYLE; CI catches it 30s after PR opens. Critic-on-CI-failure
 * loop (pr-watcher.ts) handles the feedback. Don't recreate CI.
 *
 * What we still gate on:
 *   - Forbidden paths (security, free)
 *   - TypeScript typecheck (catches real bugs - missing types, broken imports)
 *   - Tests (only if Coder touched test files)
 *
 * Scope-aware: bot-only diffs run only `cd bot && npm run typecheck` (~5s).
 * App-only diffs use NODE_OPTIONS heap=4GB to avoid OOM on 301-route tree.
 * Docs-only diffs (research/, *.md) skip everything.
 */
export async function runPreFlightGate(input: {
  workTreePath: string;
  filesChanged: string[];
}): Promise<PreFlightResult> {
  const start = Date.now();
  const checks: PreFlightResult['checks'] = {
    forbiddenPaths: 'pass',
    typecheck: 'skipped',
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

  // Docs-only? Skip everything.
  if (scope === 'docs-only') {
    return { ok: true, durationMs: Date.now() - start, scope, checks };
  }

  // Generous heap for app-side tsc (root has 301 routes + 279 components).
  const heapEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=4096`.trim(),
  };

  // Typecheck smallest scope possible.
  if (scope === 'bot-only' || scope === 'mixed') {
    const tc = await runCmd(
      'npm',
      ['run', '--silent', 'typecheck'],
      `${input.workTreePath}/bot`,
      heapEnv,
    );
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

  // Tests only if Coder touched test files.
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
    else app = true;
  }
  if (bot && app) return 'mixed';
  if (bot) return 'bot-only';
  if (app) return 'app-only';
  if (docs) return 'docs-only';
  return 'docs-only';
}
