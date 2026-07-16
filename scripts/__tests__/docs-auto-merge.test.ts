import { describe, expect, it } from 'vitest';
import { classifyPr, isAutoMergeable, type PrGate } from '../docs-auto-merge';

// ============================================================================
// classifyPr tests
// ============================================================================

describe('classifyPr', () => {
  // Empty list => code (fail safe)
  it('returns code for empty file list', () => {
    expect(classifyPr([])).toBe('code');
  });

  // Docs-only cases
  describe('docs-only classification', () => {
    it('classifies research/* files as docs-only', () => {
      expect(classifyPr(['research/foo/README.md'])).toBe('docs-only');
      expect(
        classifyPr(['research/agents/001-thing/index.md', 'research/deep/nested/doc.md']),
      ).toBe('docs-only');
    });

    it('classifies root-level .md files as docs-only', () => {
      expect(classifyPr(['README.md'])).toBe('docs-only');
      expect(classifyPr(['CHANGELOG.md', 'AUTHORS.md'])).toBe('docs-only');
    });

    it('classifies mix of research/* and *.md as docs-only', () => {
      expect(classifyPr(['research/x/README.md', 'DOCS.md'])).toBe('docs-only');
    });

    it('classifies research/ files without .md extension as docs-only', () => {
      expect(classifyPr(['research/foo/bar', 'research/baz'])).toBe('docs-only');
    });
  });

  // Test-only cases
  describe('test-only classification', () => {
    it('classifies /__tests__/ paths as test-only', () => {
      expect(classifyPr(['src/lib/__tests__/util.test.ts'])).toBe('test-only');
      expect(classifyPr(['src/app/api/__tests__/route.test.ts'])).toBe('test-only');
    });

    it('classifies .test.ts and .test.tsx as test-only', () => {
      expect(classifyPr(['src/foo.test.ts'])).toBe('test-only');
      expect(classifyPr(['src/foo.test.tsx'])).toBe('test-only');
    });

    it('classifies multiple test files as test-only', () => {
      expect(classifyPr(['src/a.test.ts', 'src/b/__tests__/util.ts', 'src/c.test.tsx'])).toBe(
        'test-only',
      );
    });
  });

  // Code classification
  describe('code classification', () => {
    it('returns code for single source file', () => {
      expect(classifyPr(['src/app/api/foo/route.ts'])).toBe('code');
      expect(classifyPr(['src/components/Button.tsx'])).toBe('code');
      expect(classifyPr(['src/lib/util.ts'])).toBe('code');
    });

    it('returns code for mixed docs and code', () => {
      expect(classifyPr(['research/foo.md', 'src/app/api/route.ts'])).toBe('code');
      expect(classifyPr(['README.md', 'src/components/Button.tsx'])).toBe('code');
    });

    it('returns code for mixed docs and tests', () => {
      expect(classifyPr(['research/foo.md', 'src/lib/__tests__/util.test.ts'])).toBe('code');
      expect(classifyPr(['README.md', 'src/foo.test.ts'])).toBe('code');
    });

    it('returns code for mixed code and tests', () => {
      expect(classifyPr(['src/app/api/route.ts', 'src/lib/__tests__/util.test.ts'])).toBe('code');
    });

    it('returns code for all three categories mixed', () => {
      expect(
        classifyPr([
          'research/doc.md',
          'src/components/Button.tsx',
          'src/lib/__tests__/util.test.ts',
        ]),
      ).toBe('code');
    });

    it('returns code for non-.md markdown-like files', () => {
      expect(classifyPr(['something.txt', 'README'])).toBe('code');
    });
  });
});

// ============================================================================
// isAutoMergeable tests
// ============================================================================

describe('isAutoMergeable', () => {
  // Helper: build a minimal gate
  const makeGate = (overrides?: Partial<PrGate>): PrGate => ({
    mergeStateStatus: 'CLEAN',
    checks: [],
    ...overrides,
  });

  // Helper: build a check
  const makeCheck = (
    name: string,
    conclusion: string | null,
    status: string | null = 'COMPLETED',
  ) => ({
    name,
    status,
    conclusion,
  });

  // test-only and code always return not ok
  describe('out-of-charter rejections', () => {
    it('rejects test-only PRs', () => {
      const result = isAutoMergeable('test-only', makeGate());
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('test-only');
    });

    it('rejects code PRs', () => {
      const result = isAutoMergeable('code', makeGate());
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('code');
    });
  });

  // docs-only: gate checks
  describe('docs-only gate validation', () => {
    it('requires mergeStateStatus to be CLEAN', () => {
      const result = isAutoMergeable('docs-only', makeGate({ mergeStateStatus: 'UNSTABLE' }));
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('UNSTABLE');
    });

    it('accepts CLEAN mergeStateStatus', () => {
      const result = isAutoMergeable('docs-only', makeGate());
      expect(result.ok).toBe(true);
    });

    it('accepts empty check list when mergeStateStatus is CLEAN', () => {
      const result = isAutoMergeable('docs-only', makeGate({ checks: [] }));
      expect(result.ok).toBe(true);
    });
  });

  // docs-only: correctness checks
  describe('docs-only correctness check validation', () => {
    it('passes all correctness checks SUCCESS', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SUCCESS'),
            makeCheck('Build', 'SUCCESS'),
            makeCheck('guardrail', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
      expect(result.reason).toContain('green');
    });

    it('passes all correctness checks SKIPPED', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SKIPPED'),
            makeCheck('Test', 'SKIPPED'),
            makeCheck('Build', 'SKIPPED'),
            makeCheck('guardrail', 'SKIPPED'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
    });

    it('passes with mixed SUCCESS/SKIPPED correctness checks', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SKIPPED'),
            makeCheck('Build', 'SUCCESS'),
            makeCheck('guardrail', 'SKIPPED'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
    });

    it('rejects correctness check with FAILURE', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'FAILURE'),
            makeCheck('Build', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Test=FAILURE');
    });

    it('rejects correctness check with NEUTRAL', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [makeCheck('Lint & Typecheck', 'SUCCESS'), makeCheck('Build', 'NEUTRAL')],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('NEUTRAL');
    });

    it('rejects correctness check with null conclusion', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [makeCheck('Lint & Typecheck', 'SUCCESS'), makeCheck('Test', null)],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Test=null');
    });
  });

  // docs-only: ignores deploy checks
  describe('docs-only ignores Vercel/deploy checks', () => {
    it('ignores Vercel check status', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SUCCESS'),
            makeCheck('Vercel', 'FAILURE'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
    });

    it('ignores Vercel Preview Comments status', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Vercel Preview Comments', 'NEUTRAL'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
    });

    it('fails if a correctness check fails, even with Vercel passing', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'FAILURE'),
            makeCheck('Vercel', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Test');
    });
  });

  // Real-world scenarios
  describe('real-world scenarios', () => {
    it('accepts a docs-only PR with full green status', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          mergeStateStatus: 'CLEAN',
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SKIPPED'),
            makeCheck('Build', 'SUCCESS'),
            makeCheck('guardrail', 'SUCCESS'),
            makeCheck('Vercel', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(true);
    });

    it('rejects a docs-only PR with merge conflict', () => {
      const result = isAutoMergeable(
        'docs-only',
        makeGate({
          mergeStateStatus: 'DIRTY',
          checks: [makeCheck('Lint & Typecheck', 'SUCCESS'), makeCheck('Test', 'SUCCESS')],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('DIRTY');
    });

    it('rejects a test-only PR with full green status (out of charter)', () => {
      const result = isAutoMergeable(
        'test-only',
        makeGate({
          mergeStateStatus: 'CLEAN',
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SUCCESS'),
            makeCheck('Build', 'SUCCESS'),
            makeCheck('guardrail', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('test-only');
    });

    it('rejects a code PR with full green status (out of charter)', () => {
      const result = isAutoMergeable(
        'code',
        makeGate({
          mergeStateStatus: 'CLEAN',
          checks: [
            makeCheck('Lint & Typecheck', 'SUCCESS'),
            makeCheck('Test', 'SUCCESS'),
            makeCheck('Build', 'SUCCESS'),
          ],
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('code');
    });
  });
});
