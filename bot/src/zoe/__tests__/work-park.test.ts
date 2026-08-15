/**
 * Failed work must survive the tick that failed it.
 *
 * Every test here names a way work used to vanish. The sharpest is the
 * empty-output case: `reportFor` sits INSIDE `if (firstOutput.trim())`, so a
 * research pass that returned nothing sent no message anywhere, deleted the
 * item, charged it against the daily cap, and emitted a receipt saying
 * `resultType: 'success'`. Silent, and recorded as a success.
 *
 * See doc 2272 for the spec and doc 2271 for the Peter comparison it came from.
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const receipts: Array<Record<string, unknown>> = [];
const reported: string[] = [];
let researchOutput = '';
let dispatchThrows = false;
let workerStatus: 'completed' | 'failed' | 'needs-revision' = 'completed';
let workerError: string | undefined;
let docResult: { ok: boolean; num?: number; prUrl?: string; error?: string } = { ok: true, num: 9999, prUrl: 'http://pr/1' };

vi.mock('../dispatch', () => ({
  dispatchPlan: vi.fn(async ({ hooks }: { hooks?: { onSubtaskDone?: (st: unknown, r: unknown) => Promise<void> } }) => {
    if (dispatchThrows) throw new Error('dispatch exploded');
    await hooks?.onSubtaskDone?.(
      { worker: 'research-worker' },
      { status: workerStatus, output: researchOutput, error: workerError },
    );
  }),
}));
vi.mock('../research-doc', () => ({ commitResearchDoc: vi.fn(async () => docResult) }));
vi.mock('../receipts', () => ({
  emitReceipt: vi.fn(async (r: Record<string, unknown>) => {
    receipts.push(r);
    return true;
  }),
}));
vi.mock('../verify-replan', () => ({
  verifyReplanResearch: vi.fn(async (_goal: string, output: string) => ({ output, retries: 0 })),
}));
vi.mock('../../hermes/claude-cli', () => ({ callClaudeCli: vi.fn(async () => ({ text: 'ACCEPT' })) }));

const { enqueueWork, runWorkTick, queueDepth, resumeParkedWork } = await import('../work-loop');
const { parkedWork, foldRecords } = await import('../work-park');

const deps = {
  sendToZaal: async (t: string) => {
    reported.push(t);
    return true;
  },
  zaalTgId: 1,
  repoDir: '/tmp',
  currentDate: '2026-08-13',
};

describe('work-park', () => {
  let home: string;

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), 'zoe-park-'));
    process.env.ZOE_HOME = home;
    receipts.length = 0;
    reported.length = 0;
    researchOutput = '';
    dispatchThrows = false;
    workerStatus = 'completed';
    workerError = undefined;
    docResult = { ok: true, num: 9999, prUrl: 'http://pr/1' };
  });
  afterEach(async () => {
    delete process.env.ZOE_HOME;
    await rm(home, { recursive: true, force: true });
  });

  it('THE SILENT PATH: empty research output parks, reports, and is NOT a success receipt', async () => {
    await enqueueWork('a topic that yields nothing');
    researchOutput = '';

    await runWorkTick(deps);

    // it left the active queue - that part was always correct
    expect(await queueDepth()).toBe(0);

    // ...but it is no longer gone
    const parked = await parkedWork();
    expect(parked).toHaveLength(1);
    expect(parked[0].reason).toBe('empty-output');
    expect(parked[0].stage).toBe('research');
    expect(parked[0].item?.input).toBe('a topic that yields nothing');

    // it now says something. previously: nothing at all.
    expect(reported.join(' ')).toContain('no research output');

    // and the receipt tells the truth. previously: resultType 'success'.
    expect(receipts).toHaveLength(1);
    expect(receipts[0].resultType).toBe('error');
    expect(receipts[0].inputDigest).toBeTruthy();
  });

  it('a thrown tick parks the item instead of deleting it', async () => {
    // The path doc 2271 named: the error was reported to Telegram, truncated to
    // 120 chars, and the item was gone. The Telegram line scrolls away; the
    // receipt carried no item id. Nothing could answer "what happened to it?".
    await enqueueWork('a topic that explodes');
    dispatchThrows = true;

    await runWorkTick(deps);

    expect(await queueDepth()).toBe(0); // still dequeued - that was always right
    const parked = await parkedWork();
    expect(parked).toHaveLength(1);
    expect(parked[0].reason).toBe('error');
    expect(parked[0].error).toContain('dispatch exploded'); // untruncated
    expect(parked[0].item?.input).toBe('a topic that explodes');
    expect(receipts[0].resultType).toBe('error');
    expect(receipts[0].inputDigest).toBeTruthy(); // WHICH topic, not just "a tick"
  });

  it('a FAILED worker parks with its real reason, not "empty-output"', async () => {
    // 16 of 20 research runs on 2026-08-14 failed with a real reason -
    // rate_limit, timeout, unclassified - and every one would have been filed as
    // 'empty-output', a category that describes the symptom and hides the cause.
    await enqueueWork('a topic the CLI rate-limits');
    researchOutput = '';
    workerStatus = 'failed';
    workerError = 'claude CLI exited 1 [rate_limit: rate-limited/overloaded]';

    await runWorkTick(deps);

    const parked = await parkedWork();
    expect(parked).toHaveLength(1);
    expect(parked[0].reason).toBe('error');
    expect(parked[0].reason).not.toBe('empty-output');
    expect(parked[0].error).toContain('rate_limit');
    expect(reported.join(' ')).toContain('rate_limit');
  });

  it('a genuinely empty result is still "empty-output" - the two stay distinct', async () => {
    await enqueueWork('a topic that returns nothing at all');
    researchOutput = '';
    workerStatus = 'completed'; // succeeded, produced nothing

    await runWorkTick(deps);

    const parked = await parkedWork();
    expect(parked[0].reason).toBe('empty-output');
    expect(parked[0].error).toBeUndefined();
  });

  it('needs-revision output is USED, not thrown away', async () => {
    // workers.ts sets `status: passed ? 'completed' : 'needs-revision'`, so a
    // needs-revision result is the full research - the critic flagged it, the
    // worker still produced it. Two such runs cost $0.93 and $0.97 on
    // 2026-08-14 and were discarded, then reported as empty. verify-replan is
    // the layer meant to judge them, and it never ran because out stayed ''.
    await enqueueWork('a topic the critic is unhappy with');
    researchOutput = 'real findings the critic flagged but which exist';
    workerStatus = 'needs-revision';

    await runWorkTick(deps);

    expect(await parkedWork()).toHaveLength(0); // committed, not parked
    expect(receipts[0].resultType).toBe('success');
    expect(reported.join(' ')).toContain('doc');
  });

  it('a successful tick still reports success and parks nothing', async () => {
    await enqueueWork('a topic that works');
    researchOutput = 'real findings, long enough to matter';

    await runWorkTick(deps);

    expect(await queueDepth()).toBe(0);
    expect(await parkedWork()).toHaveLength(0);
    expect(receipts[0].resultType).toBe('success');
  });

  it('research that succeeded but failed to COMMIT keeps its output', async () => {
    await enqueueWork('a topic whose doc will not land');
    researchOutput = 'findings worth keeping';
    docResult = { ok: false, error: 'git push rejected' };

    await runWorkTick(deps);

    const parked = await parkedWork();
    expect(parked).toHaveLength(1);
    expect(parked[0].reason).toBe('doc-failed');
    expect(parked[0].output).toBe('findings worth keeping');
    expect(receipts[0].resultType).toBe('error');
  });

  it('resume puts it back exactly once, and never twice', async () => {
    await enqueueWork('parked then resumed');
    researchOutput = '';
    await runWorkTick(deps);
    expect(await queueDepth()).toBe(0);

    const id = (await parkedWork())[0].id;
    const first = await resumeParkedWork(id, 'try it with the other source');
    expect(first?.input).toBe('parked then resumed');
    expect(await queueDepth()).toBe(1);

    // a second resume of the same id must not duplicate the work
    const second = await resumeParkedWork(id);
    expect(second).toBeNull();
    expect(await queueDepth()).toBe(1);

    // and it is no longer listed as blocked
    expect(await parkedWork()).toHaveLength(0);
  });

  it('the park file survives a corrupt line rather than losing every record', async () => {
    await enqueueWork('one');
    researchOutput = '';
    await runWorkTick(deps);

    const path = join(home, 'work-parked.jsonl');
    const good = await readFile(path, 'utf8');
    await (await import('node:fs/promises')).writeFile(path, `${good}{ not json\n`, 'utf8');

    // throwing here would lose the whole file - the exact failure this prevents
    expect(await parkedWork()).toHaveLength(1);
  });
});

describe('the interactive path has the same discard bug, asserted against source', () => {
  // index.ts cannot be imported (agent-loops rule 21 - its top level boots a
  // live poller), so this reads it as text. The bug was ONE SHAPE in TWO
  // PLACES: work-loop.ts:210 and index.ts:3143 both gated a research commit on
  // status === 'completed', discarding a critic-flagged result that cost real
  // money. Fixing one and not the other would have left the interactive path
  // - the one Zaal actually types into - still throwing work away.
  it('index.ts does not gate the research commit on completed alone', () => {
    const src = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/research-worker' && res\.status === 'completed' && res\.output/);
    expect(src).toContain("res.status === 'completed' || res.status === 'needs-revision'");
  });
});

describe('the fold, which is where a naive implementation loses the payload', () => {
  it('a later status-only append does NOT shed the item', () => {
    // Peter retired latest-record-wins for exactly this: under it, appending
    // {id, status} drops the `item` a resume needs, and the record becomes
    // unusable while still looking present.
    const folded = foldRecords([
      { id: 'wk-1', status: 'blocked', item: { id: 'wk-1', kind: 'research', input: 'keep me', addedTs: 'x' } },
      { id: 'wk-1', status: 'open' },
    ]);
    const rec = folded.get('wk-1');
    expect(rec?.status).toBe('open');
    expect(rec?.item?.input).toBe('keep me');
  });

  it('a later field overwrites', () => {
    const folded = foldRecords([
      { id: 'wk-2', status: 'blocked', error: 'first' },
      { id: 'wk-2', status: 'blocked', error: 'second' },
    ]);
    expect(folded.get('wk-2')?.error).toBe('second');
  });

  it('an explicit null clears', () => {
    const folded = foldRecords([
      { id: 'wk-3', status: 'blocked', error: 'transient' },
      { id: 'wk-3', status: 'blocked', error: null as unknown as string },
    ]);
    expect(folded.get('wk-3')?.error).toBeUndefined();
  });

  it('records for different ids do not bleed into each other', () => {
    const folded = foldRecords([
      { id: 'a', status: 'blocked', error: 'ea' },
      { id: 'b', status: 'blocked' },
    ]);
    expect(folded.get('b')?.error).toBeUndefined();
  });
});

describe('nothing resumes parked work on its own', () => {
  it('runWorkTick never calls resumeWork or resumeParkedWork', () => {
    // Asserted against SOURCE, not behaviour, because "nothing auto-resumes" is
    // a property that only ever fails silently - a tick that quietly re-queued a
    // deterministic failure would burn DAILY_CAP every day and look normal.
    const src = readFileSync(fileURLToPath(new URL('../work-loop.ts', import.meta.url)), 'utf8');
    const tickStart = src.indexOf('export async function runWorkTick');
    const tickEnd = src.indexOf('export async function resumeParkedWork');
    expect(tickStart, 'runWorkTick not found - update this test deliberately').toBeGreaterThan(-1);
    expect(tickEnd, 'resumeParkedWork not found').toBeGreaterThan(tickStart);

    const tickBody = src.slice(tickStart, tickEnd);
    expect(tickBody).not.toMatch(/\bresumeWork\s*\(/);
    expect(tickBody).not.toMatch(/\bresumeParkedWork\s*\(/);
  });
});
