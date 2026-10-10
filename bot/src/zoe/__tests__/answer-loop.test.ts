// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

vi.mock('../memory', () => ({ pushRecent: vi.fn(async () => undefined) }));

import { readAnswers, recordAnswer } from '../answers';
import {
  answerLoopEnabled,
  formatOpenLoops,
  openLoops,
  recordOutcome,
  runAnswerLoopTick,
} from '../answer-loop';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-aloop-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  await fs.rm(tmp, { recursive: true, force: true });
});

const ans = (qid: string, ts: string, value = 'a') => ({ qid, value, sender: 'zaalbotz-btn', scope: '-100', ts });
const out = (qid: string, ts: string, text = 'merged') => ({ qid, text, by: 'seat', ts });

type Sent = { chat: string; text: string; replyTo?: number };
function sender(results: boolean[] = []) {
  const sent: Sent[] = [];
  const send = async (chat: string, text: string, replyTo?: number) => {
    sent.push({ chat, text, replyTo });
    return results.length ? (results.shift() as boolean) : true;
  };
  return { sent, send };
}

describe('flag', () => {
  it('is on only for the literal 1', () => {
    expect(answerLoopEnabled({ ZOE_ANSWER_LOOP: '1' })).toBe(true);
    expect(answerLoopEnabled({ ZOE_ANSWER_LOOP: 'true' })).toBe(false);
    expect(answerLoopEnabled({})).toBe(false);
  });
});

describe('recordAnswer keeps the question message id', () => {
  it('stores messageId when given', async () => {
    await recordAnswer('q1', 'yes', 'zaalbotz-btn', '-100', { messageId: 42 });
    expect((await readAnswers())[0].messageId).toBe(42);
  });
  it('red control: omits it when not given (old callers unchanged)', async () => {
    await recordAnswer('q1', 'yes', 'zaalbotz-btn', '-100');
    expect((await readAnswers())[0]).not.toHaveProperty('messageId');
  });
});

describe('recordOutcome', () => {
  it('refuses an empty qid or text', async () => {
    await expect(recordOutcome(' ', 'x', 'seat')).rejects.toThrow('empty qid');
    await expect(recordOutcome('q1', '  ', 'seat')).rejects.toThrow('empty text');
  });
  it('collapses whitespace and caps length', async () => {
    const r = await recordOutcome('q1', `merged\n  #3875 ${'x'.repeat(600)}`, 'seat');
    expect(r.text.startsWith('merged #3875')).toBe(true);
    expect(r.text.length).toBe(400);
  });
});

describe('openLoops', () => {
  const now = new Date('2026-10-10T20:00:00Z');
  it('lists an answer older than 6h with no outcome', () => {
    expect(openLoops([ans('q1', '2026-10-10T10:00:00Z')], [], now).map((a) => a.qid)).toEqual(['q1']);
  });
  it('an outcome after the answer closes it', () => {
    expect(openLoops([ans('q1', '2026-10-10T10:00:00Z')], [out('q1', '2026-10-10T11:00:00Z')], now)).toEqual([]);
  });
  it('an outcome from BEFORE a re-answer does not close the new answer', () => {
    const answers = [ans('q1', '2026-10-09T10:00:00Z'), ans('q1', '2026-10-10T10:00:00Z', 'b')];
    const open = openLoops(answers, [out('q1', '2026-10-09T11:00:00Z')], now);
    expect(open.map((a) => a.value)).toEqual(['b']);
  });
  it('too fresh (under 6h) and too old (over 7d) are not listed', () => {
    const answers = [ans('fresh', '2026-10-10T17:00:00Z'), ans('old', '2026-10-01T10:00:00Z')];
    expect(openLoops(answers, [], now)).toEqual([]);
  });
  it('formats with ages and caps the list at 10', () => {
    const many = Array.from({ length: 12 }, (_, i) => ans(`q${i}`, '2026-10-10T10:00:00Z'));
    const text = formatOpenLoops(many, now);
    expect(text).toContain('12 answers with nothing reported back yet');
    expect(text).toContain('- q0: a (10h ago)');
    expect(text).toContain('...and 2 more');
  });
});

describe('runAnswerLoopTick', () => {
  const morning = new Date('2026-10-10T08:00:00Z'); // before the stale hour

  it('replies under the question with what changed, once', async () => {
    await recordAnswer('q1', 'merge it', 'zaalbotz-btn', '-100', { messageId: 7 });
    await recordOutcome('q1', 'merged #3875', 'seat');
    const s = sender();
    expect((await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning })).reported).toBe(1);
    expect(s.sent[0]).toMatchObject({ chat: '-100', replyTo: 7 });
    expect(s.sent[0].text).toContain('Done (q1): merged #3875');
    expect(s.sent[0].text).toContain('You answered: merge it');
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning });
    expect(s.sent).toHaveLength(1);
  });

  it('an outcome replies under the answer it followed, not a later re-ask', async () => {
    const outcomes = join(tmp, 'answer-outcomes.jsonl');
    const answers = join(tmp, 'answers.jsonl');
    await fs.writeFile(
      answers,
      `${JSON.stringify({ ...ans('q1', '2026-10-10T01:00:00Z', 'first'), messageId: 1 })}\n` +
        `${JSON.stringify({ ...ans('q1', '2026-10-10T05:00:00Z', 'second'), messageId: 2 })}\n`,
    );
    await fs.writeFile(outcomes, `${JSON.stringify(out('q1', '2026-10-10T03:00:00Z', 'acted on first'))}\n`);
    const s = sender();
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning });
    expect(s.sent[0]).toMatchObject({ replyTo: 1 });
    expect(s.sent[0].text).toContain('You answered: first');
  });

  it('an outcome older than every answer goes to the default chat, unlinked', async () => {
    await fs.writeFile(join(tmp, 'answers.jsonl'), `${JSON.stringify({ ...ans('q1', '2026-10-10T05:00:00Z'), messageId: 2 })}\n`);
    await fs.writeFile(join(tmp, 'answer-outcomes.jsonl'), `${JSON.stringify(out('q1', '2026-10-10T03:00:00Z'))}\n`);
    const s = sender();
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning });
    expect(s.sent[0]).toMatchObject({ chat: '-999', replyTo: undefined });
  });

  it('a failed send is retried next tick, not marked reported', async () => {
    await recordOutcome('q1', 'merged', 'seat');
    const s = sender([false, true]);
    expect((await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning })).reported).toBe(0);
    expect((await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning })).reported).toBe(1);
    expect(s.sent).toHaveLength(2);
  });

  it('an outcome for an unknown qid goes to the default chat with no reply link', async () => {
    await recordOutcome('ghost', 'did a thing', 'seat');
    const s = sender();
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: morning });
    expect(s.sent[0]).toMatchObject({ chat: '-999', replyTo: undefined });
  });

  it('stale list runs once a day, only after the stale hour', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T01:00:00Z'));
    await recordAnswer('q1', 'yes', 'zaalbotz-btn', '-100');
    const s = sender();
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: new Date('2026-10-10T12:00:00Z') });
    expect(s.sent).toHaveLength(0); // before 13:00 UTC
    const r = await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: new Date('2026-10-10T14:00:00Z') });
    expect(r.staleListed).toBe(1);
    expect(s.sent[0].text).toContain('1 answer with nothing reported back yet');
    await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: new Date('2026-10-10T15:00:00Z') });
    expect(s.sent).toHaveLength(1);
  });

  it('red control: nothing answered, nothing reported, nothing sent', async () => {
    const s = sender();
    const r = await runAnswerLoopTick({ send: s.send, defaultChat: '-999', now: new Date('2026-10-10T14:00:00Z') });
    expect(r).toEqual({ reported: 0, staleListed: 0 });
    expect(s.sent).toEqual([]);
  });
});
