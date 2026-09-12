import { describe, it, expect, vi } from 'vitest';

// The priority-8 stall emit is the signal that has to survive the scheduler's
// early return, so the test asserts on the emit itself, not on a status string
// the scheduler never reads (vault, #3483 review).
const emits: Array<[string, string, number, string]> = [];
vi.mock('../mission-control', () => ({
  mcEmit: (topic: string, actor: string, severity: number, text: string) => {
    emits.push([topic, actor, severity, text]);
  },
}));
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeStack,
  stackHash,
  repoToTarget,
  pickNext,
  buildIssueText,
  runErrorRemediationTick,
  flushOutbox,
  describeOutbox,
  fileOutbox,
  type OutboxItem,
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
    outbox: memOutbox(),
    ...over,
  };
}

/** An in-memory outbox, and a look at what is still queued. */
function memOutbox(start: OutboxItem[] = []) {
  let items = [...start];
  return {
    load: vi.fn(async () => [...items]),
    save: vi.fn(async (pending: OutboxItem[]) => {
      items = [...pending];
    }),
    peek: () => items,
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

describe('the outbox: queue, mark, flush', () => {
  it('a report that throws leaves the row marked AND the message queued, never dropped', async () => {
    const outbox = memOutbox();
    const deps = baseDeps({
      outbox,
      report: vi.fn(async () => {
        throw new Error('telegram down');
      }),
    });
    const status = await runErrorRemediationTick(deps);
    expect(deps.markFixed).toHaveBeenCalledWith('err-1', expect.stringContaining('/pull/77'), 'run-1');
    expect(outbox.peek().map((i) => i.message)).toEqual([expect.stringContaining('PR #77')]);
    expect(status).toContain('report queued');
  });

  it('queues the report BEFORE marking, so a crash between the two keeps the message', async () => {
    const order: string[] = [];
    const outbox = memOutbox();
    const save = outbox.save;
    const deps = baseDeps({
      outbox: {
        load: outbox.load,
        save: vi.fn(async (p: OutboxItem[]) => {
          order.push('queue');
          await save(p);
        }),
      },
      markFixed: vi.fn(async () => {
        order.push('mark');
        throw new Error('db died right after the queue');
      }),
      report: vi.fn(async () => {
        order.push('report');
      }),
    });
    await expect(runErrorRemediationTick(deps)).rejects.toThrow('db died');
    expect(order).toEqual(['queue', 'mark']);
    expect(outbox.peek()).toHaveLength(1);
  });

  it('the next tick sends what is queued before claiming anything new', async () => {
    const outbox = memOutbox([{ at: 1, message: 'held report' }]);
    const deps = baseDeps({ outbox });
    const status = await runErrorRemediationTick(deps);
    expect(deps.report).toHaveBeenCalledWith('held report');
    expect(deps.claimError).toHaveBeenCalled();
    expect(outbox.peek()).toEqual([]);
    expect(status).toContain('fixed');
  });

  it('claims no new error while a report is still unsent, and says how stale', async () => {
    const outbox = memOutbox([{ at: Date.now() - 3 * 3600_000, message: 'held' }]);
    const deps = baseDeps({
      outbox,
      report: vi.fn(async () => {
        throw new Error('still down');
      }),
    });
    const status = await runErrorRemediationTick(deps);
    expect(deps.claimError).not.toHaveBeenCalled();
    expect(deps.dispatchFix).not.toHaveBeenCalled();
    expect(status).toMatch(/holding: 1 unsent, oldest 3h/);
  });

  it('an unwritable outbox falls back to send-first: a failed report leaves the row unmarked', async () => {
    const deps = baseDeps({
      outbox: {
        load: vi.fn(async () => []),
        save: vi.fn(async () => {
          throw new Error('disk full');
        }),
      },
      report: vi.fn(async () => {
        throw new Error('telegram down');
      }),
    });
    await expect(runErrorRemediationTick(deps)).rejects.toThrow('telegram down');
    expect(deps.markFixed).not.toHaveBeenCalled();
  });

  it('flushOutbox stops at the first failure and keeps the rest, oldest first', async () => {
    const outbox = memOutbox([
      { at: 1, message: 'one' },
      { at: 2, message: 'two' },
      { at: 3, message: 'three' },
    ]);
    let n = 0;
    const left = await flushOutbox({
      outbox,
      report: vi.fn(async () => {
        if (++n === 2) throw new Error('down mid-flush');
      }),
    });
    expect(left.map((i) => i.message)).toEqual(['two', 'three']);
    expect(outbox.peek().map((i) => i.message)).toEqual(['two', 'three']);
  });

  it('describeOutbox turns depth and age into one sentence', () => {
    const now = Date.now();
    expect(describeOutbox([], now)).toBe('outbox empty');
    expect(describeOutbox([{ at: now - 3 * 3600_000, message: 'a' }, { at: now, message: 'b' }], now))
      .toBe('2 unsent, oldest 3h');
    expect(describeOutbox([{ at: now - 90_000, message: 'a' }], now)).toBe('1 unsent, oldest 2m');
  });

  it('a held outbox raises the priority-8 stall from flushOutbox itself, not from a caller', async () => {
    // Regression, vault #3483 review: the emit used to sit in
    // runErrorRemediationTick, and the scheduler flushes first and RETURNS when
    // anything is held - so the only state that needed announcing reached
    // nothing but a console.error. Emitting from flushOutbox is what makes the
    // scheduler's path and the tick's path say the same thing.
    emits.length = 0;
    const kept: OutboxItem[] = [{ at: Date.now() - 90_000, message: 'undelivered report' }];
    const outbox = {
      load: async () => kept,
      save: async () => {},
    };
    const held = await flushOutbox({
      report: async () => {
        throw new Error('send budget blocked');
      },
      outbox,
    });
    expect(held).toHaveLength(1);
    const stalls = emits.filter((e) => e[2] === 8);
    expect(stalls).toHaveLength(1);
    expect(stalls[0][0]).toBe('error-remediation');
    expect(stalls[0][3]).toBe('reports undelivered: 1 unsent, oldest 2m');
  });

  it('a flush that clears the outbox raises nothing', async () => {
    emits.length = 0;
    const held = await flushOutbox({
      report: async () => {},
      outbox: { load: async () => [{ at: Date.now(), message: 'a' }], save: async () => {} },
    });
    expect(held).toEqual([]);
    expect(emits.filter((e) => e[2] === 8)).toHaveLength(0);
  });

  it('fileOutbox round-trips, treats a missing file as empty, and rethrows an unreadable one', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'zoe-outbox-'));
    const path = join(dir, 'nested', 'remediation-outbox.json');
    const box = fileOutbox(path);
    expect(await box.load()).toEqual([]); // missing file, not an error
    await box.save([{ at: 7, message: 'kept' }]);
    expect(await box.load()).toEqual([{ at: 7, message: 'kept' }]);
    await fs.writeFile(path, 'not json', 'utf8');
    await expect(box.load()).rejects.toThrow(); // unreadable is not empty
  });
});
