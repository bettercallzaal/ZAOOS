import { describe, it, expect, vi } from 'vitest';
import {
  parseVerifyVerdict,
  shouldRetry,
  augmentGoalForRetry,
  verifyReplanResearch,
  type VerifyVerdict,
} from '../verify-replan';

describe('parseVerifyVerdict', () => {
  it('parses a valid verdict (even with surrounding prose)', () => {
    const raw = 'Here is my grade:\n{"status":"incomplete","score":0.4,"missing":["pricing","risks"],"recommendation":"retry"}\nThanks';
    expect(parseVerifyVerdict(raw)).toEqual({
      status: 'incomplete',
      score: 0.4,
      missing: ['pricing', 'risks'],
      recommendation: 'retry',
    });
  });
  it('fails OPEN to accept on garbage / no JSON', () => {
    expect(parseVerifyVerdict('the model refused')).toEqual({
      status: 'complete',
      score: 1,
      missing: [],
      recommendation: 'accept',
    });
  });
  it('clamps bad fields to safe defaults', () => {
    const v = parseVerifyVerdict('{"status":"weird","score":5,"missing":"nope","recommendation":"bogus"}');
    expect(v.status).toBe('complete');
    expect(v.score).toBe(1);
    expect(v.missing).toEqual([]);
    expect(v.recommendation).toBe('accept');
  });
});

describe('shouldRetry', () => {
  const v = (o: Partial<VerifyVerdict>): VerifyVerdict => ({ status: 'incomplete', score: 0.4, missing: [], recommendation: 'retry', ...o });
  it('retries when recommended, under threshold, with budget', () => {
    expect(shouldRetry(v({}), 0, 2)).toBe(true);
  });
  it('does not retry when accepted, or over score, or out of budget', () => {
    expect(shouldRetry(v({ recommendation: 'accept' }), 0, 2)).toBe(false);
    expect(shouldRetry(v({ score: 0.9 }), 0, 2)).toBe(false);
    expect(shouldRetry(v({}), 2, 2)).toBe(false);
  });
});

describe('augmentGoalForRetry', () => {
  it('appends missing aspects, no-op when empty', () => {
    expect(augmentGoalForRetry('research X', ['a', 'b'])).toContain('MUST additionally cover: a; b');
    expect(augmentGoalForRetry('research X', [])).toBe('research X');
  });
});

describe('verifyReplanResearch', () => {
  it('accepts immediately - never re-researches when the verdict is accept', async () => {
    const research = vi.fn(async () => 'should not be called');
    const judge = vi.fn(async () => '{"status":"complete","score":0.95,"missing":[],"recommendation":"accept"}');
    const res = await verifyReplanResearch('goal', 'first output', { research, judge });
    expect(res.retries).toBe(0);
    expect(res.output).toBe('first output');
    expect(research).not.toHaveBeenCalled();
  });

  it('retries on incomplete, re-researches with missing fed back, then accepts', async () => {
    const research = vi.fn(async (g: string) => `deeper output covering ${g.includes('pricing') ? 'pricing now' : 'nothing'}`);
    const judge = vi
      .fn()
      .mockResolvedValueOnce('{"status":"incomplete","score":0.3,"missing":["pricing"],"recommendation":"retry"}')
      .mockResolvedValueOnce('{"status":"complete","score":0.9,"missing":[],"recommendation":"accept"}');
    const res = await verifyReplanResearch('research X', 'thin first pass', { research, judge });
    expect(res.retries).toBe(1);
    expect(research).toHaveBeenCalledTimes(1);
    expect(research.mock.calls[0][0]).toContain('pricing'); // missing was fed back
    expect(res.output).toContain('pricing now');
  });

  it('is bounded by maxRetries and keeps the best output', async () => {
    const research = vi.fn(async () => 'still incomplete');
    const judge = vi.fn(async () => '{"status":"incomplete","score":0.2,"missing":["x"],"recommendation":"retry"}');
    const res = await verifyReplanResearch('g', 'first', { research, judge, maxRetries: 2 });
    expect(res.retries).toBe(2);
    expect(research).toHaveBeenCalledTimes(2);
  });

  it('fails open (accepts) when the judge throws', async () => {
    const research = vi.fn();
    const judge = vi.fn(async () => { throw new Error('cli down'); });
    const res = await verifyReplanResearch('g', 'first', { research, judge });
    expect(res.retries).toBe(0);
    expect(res.output).toBe('first');
    expect(research).not.toHaveBeenCalled();
  });
});
