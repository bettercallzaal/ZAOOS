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
let docResult: { ok: boolean; num?: number; prUrl?: string; error?: string } = { ok: true, num: 9999, prUrl: 'http://pr/1' };

vi.mock('../dispatch', () => ({
  dispatchPlan: vi.fn(async ({ hooks }: { hooks?: { onSubtaskDone?: (st: unknown, r: unknown) => Promise<void> } }) => {
    if (dispatchThrows) throw new Error('dispatch exploded');
    await hooks?.onSubtaskDone?.(
      { worker: 'research-worker' },
      { status: 'completed', output: researchOutput },
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
