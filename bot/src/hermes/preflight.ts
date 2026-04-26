import { runCmd } from './git';
import { HERMES_FORBIDDEN_PATHS } from './types';

export interface PreFlightResult {
  ok: boolean;
  error?: string;
  durationMs: number;
  checks: {
    forbiddenPaths: 'pass' | 'fail';
    typecheck: 'pass' | 'fail' | 'skipped';
    lint: 'pass' | 'fail' | 'skipped';
    tests: 'pass' | 'fail' | 'skipped';
  };
}

/**
 * Run all CI-equivalent checks BEFORE Critic sees the diff. Catches the failure
 * mode where Coder writes locally-clean code but the workspace still fails CI
 * because of unrelated drift (e.g. PR #321: Hermes /healthcheck was clean, but
 * stock/* react/no-unescaped-entities errors blocked the merge).
 *
 * Auto-loops back to Coder on fail with the verbatim error as feedback.
 *
 * Cost: 0 tokens (all local). Time: ~10-15s typical, +30s if tests touched.
 *
 * Each check exits FAST on first failure - we don't run all checks for
 * fingerprinting; we want quickest possible loop-back to Coder.
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

  // Check 0: forbidden paths (cheapest, fail fast).
  // HERMES_FORBIDDEN_PATHS includes self-modification, secrets, hooks, lockfiles.
  for (const f of input.filesChanged) {
    if (HERMES_FORBIDDEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`))) {
      checks.forbiddenPaths = 'fail';
      return {
        ok: false,
        error: `Coder wrote forbidden path: ${f}. This is a safety violation; revert the file and try again.`,
        durationMs: Date.now() - start,
        checks,
      };
    }
  }

  // Check 1: TypeScript typecheck on root workspace.
  // Catches: any, missing returns, wrong types, broken imports.
  const tc = await runCmd('npm', ['run', '--silent', 'typecheck'], input.workTreePath);
  if (tc.exitCode !== 0) {
    checks.typecheck = 'fail';
    const out = (tc.stderr + '\n' + tc.stdout).slice(0, 1500);
    return {
      ok: false,
      error: `TypeScript errors block the merge. Fix these before retrying:\n\n${out}`,
      durationMs: Date.now() - start,
      checks,
    };
  }
  checks.typecheck = 'pass';

  // Check 2: Biome lint on root workspace.
  // Catches: react/no-unescaped-entities, no-html-link-for-pages, dangerouslySetInnerHTML, etc.
  // This is the exact check GitHub Actions runs in "Lint & Typecheck".
  const lint = await runCmd('npm', ['run', '--silent', 'lint:biome'], input.workTreePath);
  if (lint.exitCode !== 0) {
    checks.lint = 'fail';
    const out = (lint.stderr + '\n' + lint.stdout).slice(0, 1500);
    return {
      ok: false,
      error: `Lint errors block the merge. Fix these before retrying. Tip: try \`npx biome check --write\` to auto-fix style issues:\n\n${out}`,
      durationMs: Date.now() - start,
      checks,
    };
  }
  checks.lint = 'pass';

  // Check 3: Vitest, only if Coder modified test files.
  // Skipped otherwise so we don't pay 30-60s on every run.
  const touchedTests = input.filesChanged.some(
    (f) => f.includes('__tests__') || f.endsWith('.test.ts') || f.endsWith('.test.tsx'),
  );
  if (touchedTests) {
    const test = await runCmd(
      'npx',
      ['vitest', 'run', '--reporter=verbose', '--no-coverage'],
      input.workTreePath,
    );
    if (test.exitCode !== 0) {
      checks.tests = 'fail';
      const out = (test.stdout + '\n' + test.stderr).slice(-1500);
      return {
        ok: false,
        error: `Tests failed. Fix the failing tests OR fix the code that broke them:\n\n${out}`,
        durationMs: Date.now() - start,
        checks,
      };
    }
    checks.tests = 'pass';
  }

  return {
    ok: true,
    durationMs: Date.now() - start,
    checks,
  };
}
