// @vitest-environment node
/**
 * The night of 2026-10-08: the Grill posted 33 zao-ask button questions
 * (g1008-fin2 ... g1008-zipweight) into ZAAL BOTZ in about ten minutes. Every
 * answer path wrote one `[answer:<qid>] <value>` line into recent/<group>.json,
 * a ring buffer of RECENT_MAX = 8 turns, and both readers (detectNewAnswers in
 * the tick, zao-ask-check on the VPS) read only that file. So at most eight of
 * thirty-three answers could ever be read back.
 *
 * These tests use the real qids. The "ring buffer" case documents the loss on
 * the old path; the detectNewAnswers cases are RED without answers.ts and the
 * tick change (measured: 8 of 33 returned against origin/main's reader).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// memory.ts resolves ZOE_HOME at import time, so the env must be set before
// any import below is evaluated. vi.hoisted runs ahead of the hoisted imports.
const TEST_HOME = vi.hoisted(() => {
  const home = `${process.env.TMPDIR ?? '/tmp'}/zoe-answers-test-${process.pid}-${Date.now()}`;
  process.env.ZOE_HOME = home;
  return home;
});

import { answerText, answersPath, findAnswer, parseAnswerText, readAnswers, recordAnswer } from '../answers';
import { pushRecent, readRecent } from '../memory';
import { detectNewAnswers } from '../orchestrator-tick';

const GROUP = -1003813973176;
const SCOPE = String(GROUP);

// The 33 qids the Grill used on 2026-10-08, in the order they were posted.
const QIDS = [
  'g1008-fin2', 'g1008-fin3', 'g1008-fin4', 'g1008-fin5', 'g1008-fin6',
  'g1008-sec1', 'g1008-sec2', 'g1008-sec3', 'g1008-sec4', 'g1008-sec5',
  'g1008-ww1', 'g1008-ww2', 'g1008-ww3', 'g1008-med1', 'g1008-med2',
  'g1008-med3', 'g1008-med4', 'g1008-site1', 'g1008-site2', 'g1008-site3',
  'g1008-vault1', 'g1008-vault2', 'g1008-dot1', 'g1008-dot2', 'g1008-dot3',
  'g1008-skill1', 'g1008-skill2', 'g1008-res1', 'g1008-res2', 'g1008-part1',
  'g1008-part2', 'g1008-pers1', 'g1008-zipweight',
];

beforeAll(async () => {
  await fs.mkdir(TEST_HOME, { recursive: true });
});
afterAll(async () => {
  await fs.rm(TEST_HOME, { recursive: true, force: true });
});

describe('the old path: recent/ is a ring buffer, not a store', () => {
  it('keeps only the last 8 of 33 answers written through pushRecent alone', async () => {
    const scope = `${SCOPE}-old`;
    for (const qid of QIDS) {
      await pushRecent({ from: 'zaal', text: answerText(qid, 'a'), sender: 'zaalbotz-btn' }, scope);
    }
    const kept = (await readRecent(scope)).map((t) => parseAnswerText(t.text)?.qid);
    expect(kept).toHaveLength(8);
    expect(kept).toEqual(QIDS.slice(-8));
    expect(kept).not.toContain('g1008-fin2');
  });
});

describe('recordAnswer: every answer is findable by qid, however many came in', () => {
  it('stores all 33 and still writes the bridge line into recent/', async () => {
    for (const [i, qid] of QIDS.entries()) {
      await recordAnswer(qid, i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : 'c', 'zaalbotz-btn', SCOPE);
    }
    const all = await readAnswers();
    expect(all.filter((r) => r.scope === SCOPE)).toHaveLength(33);
    for (const qid of QIDS) {
      const rec = await findAnswer(qid);
      expect(rec?.qid).toBe(qid);
      expect(rec?.sender).toBe('zaalbotz-btn');
    }
    // The prompt window still gets the same line the readers grep for.
    const recent = await readRecent(SCOPE);
    expect(recent).toHaveLength(8);
    expect(recent[recent.length - 1].text).toBe(answerText('g1008-zipweight', 'c'));
    expect(answersPath()).toBe(join(TEST_HOME, 'answers.jsonl'));
  });

  it('stamps the ring-buffer line with the same ts as the index record', async () => {
    // Measured while building this: two clocks, one per store, produced a
    // duplicate in detectNewAnswers whenever the millisecond flipped between
    // the two writes (3 of 8 runs). One stamp, carried into both.
    const scope = `${SCOPE}-ts`;
    const rec = await recordAnswer('g1008-ts', 'a', 'zaalbotz-btn', scope);
    const recent = await readRecent(scope);
    expect(recent[recent.length - 1].ts).toBe(rec.ts);
  });

  it('findAnswer returns the newest answer when a question was answered twice', async () => {
    await recordAnswer('g1008-twice', 'a', 'zaalbotz-btn', SCOPE);
    await recordAnswer('g1008-twice', 'typed instead', 'zaalbotz-type', SCOPE);
    const rec = await findAnswer('g1008-twice');
    expect(rec?.value).toBe('typed instead');
    expect(rec?.sender).toBe('zaalbotz-type');
    expect(await findAnswer('g1008-never-asked')).toBeUndefined();
  });

  it('answerText and parseAnswerText round-trip the one bridge shape', () => {
    expect(answerText('g1008-fin2', 'a')).toBe('[answer:g1008-fin2] a');
    expect(parseAnswerText('[answer:g1008-fin2] a')).toEqual({ qid: 'g1008-fin2', value: 'a' });
    expect(parseAnswerText('hello')).toBeNull();
  });

  it('skips a torn last line instead of failing the whole read', async () => {
    await fs.appendFile(answersPath(), '{"qid":"g1008-torn","value":"x"', 'utf8');
    const all = await readAnswers({ qid: 'g1008-torn' });
    expect(all).toEqual([]);
    await fs.appendFile(answersPath(), '\n', 'utf8');
  });
});

describe('detectNewAnswers reads the durable index (RED without the fix)', () => {
  it('returns all 33 answers for the group after the ring buffer rolled over', async () => {
    const since = '2026-10-08T00:00:00Z';
    const found = await detectNewAnswers(since, GROUP);
    const qids = found.map((a) => a.qid);
    for (const qid of QIDS) expect(qids).toContain(qid);
    // Against origin/main's reader this is 8: only what recent/ still held.
    expect(qids.filter((q) => q.startsWith('g1008-')).length).toBeGreaterThanOrEqual(33);
  });

  it('does not report another group\'s answers, and respects lastSeenTs', async () => {
    const other = -5570098144;
    await recordAnswer('g1008-other', 'a', 'zaalbotz-btn', String(other));
    const mine = await detectNewAnswers('2026-10-08T00:00:00Z', GROUP);
    expect(mine.map((a) => a.qid)).not.toContain('g1008-other');
    const theirs = await detectNewAnswers('2026-10-08T00:00:00Z', other);
    expect(theirs.map((a) => a.qid)).toEqual(['g1008-other']);
    const future = await detectNewAnswers(new Date(Date.now() + 60_000).toISOString(), GROUP);
    expect(future).toEqual([]);
  });

  it('still reads a pre-upgrade answer that exists only in recent/, once', async () => {
    const legacyGroup = 424242;
    await pushRecent(
      { from: 'zaal', text: answerText('g1008-legacy', 'b'), sender: 'zaalbotz-btn' },
      String(legacyGroup),
    );
    const found = await detectNewAnswers('2026-10-08T00:00:00Z', legacyGroup);
    expect(found.map((a) => [a.qid, a.value])).toEqual([['g1008-legacy', 'b']]);
  });
});
