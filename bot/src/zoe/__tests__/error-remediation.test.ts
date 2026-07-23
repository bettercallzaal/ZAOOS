import { describe, it, expect, vi } from 'vitest';
import {
  normalizeStack,
  stackHash,
  repoToTarget,
  pickNext,
  buildIssueText,
  runErrorRemediationTick,
  type AppError,
  type RemediationDeps,
  type RemediationDispatchResult,
} from '../error-remediation';

function mkError(over: Partial<AppError> = {}): AppError {
  return {
    id: 'err-1',
    ref_code: '1463886943',
    repo: 'zaocowork',
    route: '/board',
    brand: 'ZAOstock',
    message: "Cannot read properties of undefined (reading 'length')",
    stack: 'at Board (/tmp/x/src/app/board/page.tsx:42:19)',
    stack_hash: 'abc',
    count: 3,
    status: 'new',
    ...over,
  };
}

describe('normalizeStack + stackHash', () => {
  it('strips line:col, hex ids, tmp paths, uuids so the same bug hashes stably', () => {
    const a = 'at Board (/tmp/clone-a/src/page.tsx:42:19) 0xAB12 550e8400-e29b-41d4-a716-446655440000';
    const b = 'at Board (/tmp/clone-b/src/page.tsx:99:3) 0xFF99 111e8400-e29b-41d4-a716-446655440999';
    expect(normalizeStack(a)).toBe(normalizeStack(b));
    expect(stackHash(a)).toBe(stackHash(b));
    expect(stackHash(a)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('different throws hash differently', () => {
    expect(stackHash('at A (x:1:1)')).not.toBe(stackHash('at B (y:1:1)'));
  });

  it('handles null/undefined stack', () => {
    expect(normalizeStack(null)).toBe('');
    expect(stackHash(undefined)).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('repoToTarget', () => {
  it('accepts supported targets', () => {
    expect(repoToTarget('zaoos')).toBe('zaoos');
    expect(repoToTarget('zaostock')).toBe('zaostock');
    expect(repoToTarget('zaocowork')).toBe('zaocowork');
  });
  it('rejects unknown repos', () => {
    expect(repoToTarget('some-random-repo')).toBeNull();
  });
});

describe('pickNext', () => {
  it('picks the highest-count NEW error', () => {
    const picked = pickNext([
      mkError({ id: 'a', count: 2 }),
      mkError({ id: 'b', count: 9 }),
      mkError({ id: 'c', count: 5 }),
    ]);
    expect(picked?.id).toBe('b');
  });
  it('ignores non-new statuses', () => {
    expect(pickNext([mkError({ status: 'fixing' }), mkError({ status: 'fixed' })])).toBeNull();
  });
  it('returns null on empty', () => {
    expect(pickNext([])).toBeNull();
  });
});

describe('buildIssueText', () => {
  it('includes ref, route, brand, message, and fix guidance', () => {
    const text = buildIssueText(mkError());
    expect(text).toContain('1463886943');
    expect(text).toContain('/board');
    expect(text).toContain('ZAOstock');
    expect(text).toContain('SMALLEST safe change');
    expect(text).not.toMatch(/\n{3,}/); // no triple blank lines
  });
});

function baseDeps(over: Partial<RemediationDeps> = {}): RemediationDeps {
  return {
    fetchNewErrors: vi.fn(async () => [mkError()]),
    claimError: vi.fn(async () => true),
    markFixed: vi.fn(async () => {}),
    markEscalated: vi.fn(async () => {}),
    dispatchFix: vi.fn(
      async (): Promise<RemediationDispatchResult> => ({
        kind: 'ready',
        prNumber: 77,
        prUrl: 'https://github.com/ZAODEVZ/ZAOcowork/pull/77',
        runId: 'run-1',
      }),
    ),
    report: vi.fn(async () => {}),
    ...over,
  };
}

describe('runErrorRemediationTick', () => {
  it('routes a new error to a fix and reports the PR (no question)', async () => {
    const deps = baseDeps();
    const status = await runErrorRemediationTick(deps);
    expect(deps.dispatchFix).toHaveBeenCalledWith(
      expect.objectContaining({ targetRepo: 'zaocowork' }),
    );
    expect(deps.markFixed).toHaveBeenCalledWith('err-1', expect.stringContaining('/pull/77'), 'run-1');
    expect(deps.report).toHaveBeenCalledWith(expect.stringContaining('PR #77'));
    expect(status).toContain('fixed');
  });

  it('does nothing when there are no new errors', async () => {
    const deps = baseDeps({ fetchNewErrors: vi.fn(async () => []) });
    expect(await runErrorRemediationTick(deps)).toBe('no new errors');
    expect(deps.dispatchFix).not.toHaveBeenCalled();
  });

  it('yields the row when it loses the claim race (no double-dispatch)', async () => {
    const deps = baseDeps({ claimError: vi.fn(async () => false) });
    await runErrorRemediationTick(deps);
    expect(deps.dispatchFix).not.toHaveBeenCalled();
    expect(deps.markFixed).not.toHaveBeenCalled();
  });

  it('escalates (not fixes) an unsupported repo', async () => {
    const deps = baseDeps({ fetchNewErrors: vi.fn(async () => [mkError({ repo: 'mystery' })]) });
    await runErrorRemediationTick(deps);
    expect(deps.dispatchFix).not.toHaveBeenCalled();
    expect(deps.markEscalated).toHaveBeenCalled();
    expect(deps.report).toHaveBeenCalledWith(expect.stringContaining('needs you'));
  });

  it('escalates when the pipeline cannot fix', async () => {
    const deps = baseDeps({
      dispatchFix: vi.fn(async (): Promise<RemediationDispatchResult> => ({
        kind: 'escalated',
        runId: 'run-2',
        reason: 'critic rejected 3x',
      })),
    });
    await runErrorRemediationTick(deps);
    expect(deps.markEscalated).toHaveBeenCalledWith('err-1', expect.stringContaining('critic rejected'));
    expect(deps.markFixed).not.toHaveBeenCalled();
  });

  it('escalates when dispatch throws (never crashes the tick)', async () => {
    const deps = baseDeps({
      dispatchFix: vi.fn(async () => {
        throw new Error('boom');
      }),
    });
    const status = await runErrorRemediationTick(deps);
    expect(status).toContain('escalated');
    expect(deps.markEscalated).toHaveBeenCalledWith('err-1', expect.stringContaining('boom'));
  });
});
