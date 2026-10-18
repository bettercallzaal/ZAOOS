import { describe, expect, it, vi } from 'vitest';
import {
  backgroundRecallMs,
  CARRY_TTL_MS,
  newRecallCarry,
  type RecallSearch,
  takeCarried,
  turnRecall,
} from '../recall-carry';

/** A search that answers after `ms`, with `text`. */
const after = (ms: number, text: string | undefined): RecallSearch => () =>
  new Promise((r) => setTimeout(() => r(text), ms));

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('backgroundRecallMs', () => {
  it.each([
    [undefined, 25_000],
    ['abc', 25_000],
    ['0', 25_000],
    ['-5', 25_000],
    ['Infinity', 25_000],
    ['1000', 5_000],
    ['20000', 20_000],
    ['99999999', 30_000],
  ])('%j -> %d', (raw, want) => {
    expect(backgroundRecallMs(raw)).toBe(want);
  });
});

describe('turnRecall', () => {
  it('a fast search is used in this turn', async () => {
    const carry = newRecallCarry();
    const r = await turnRecall(carry, 'c1', 'q', after(5, 'hit'), { turnMs: 50, backgroundMs: 1000 });
    expect(r).toEqual({ context: 'hit', outcome: 'now' });
    expect(carry.inFlight.size).toBe(0);
  });

  it('a slow search returns within the turn budget and is carried into the next turn, labelled', async () => {
    const carry = newRecallCarry();
    const started = Date.now();
    const r1 = await turnRecall(carry, 'c1', 'what is ZABAL Gamez?', after(60, 'ZABAL Gamez is...'), {
      turnMs: 10,
      backgroundMs: 1000,
    });
    expect(Date.now() - started).toBeLessThan(50);
    expect(r1).toEqual({ context: undefined, outcome: 'carried-later' });
    await new Promise((r) => setTimeout(r, 80));
    const r2 = await turnRecall(carry, 'c1', 'and season 1?', after(1, 'season hit'), { turnMs: 50, backgroundMs: 1000 });
    expect(r2.outcome).toBe('now');
    expect(r2.context).toBe(
      '(From a knowledge-graph search on an earlier message: "what is ZABAL Gamez?")\nZABAL Gamez is...\n\nseason hit',
    );
    // Used once only.
    expect(carry.carried.size).toBe(0);
  });

  it('the search gets the background budget, not the turn budget', async () => {
    const carry = newRecallCarry();
    const search = vi.fn<RecallSearch>(async () => 'x');
    await turnRecall(carry, 'c1', 'q', search, { turnMs: 3000, backgroundMs: 25_000 });
    expect(search).toHaveBeenCalledWith('q', 25_000);
  });

  it('one search per chat at a time; another chat is not blocked', async () => {
    const carry = newRecallCarry();
    const search = vi.fn<RecallSearch>(after(60, 'slow'));
    await turnRecall(carry, 'c1', 'q1', search, { turnMs: 5, backgroundMs: 1000 });
    const r = await turnRecall(carry, 'c1', 'q2', search, { turnMs: 5, backgroundMs: 1000 });
    expect(r.outcome).toBe('skipped-in-flight');
    expect(search).toHaveBeenCalledTimes(1);
    const other = await turnRecall(carry, 'c2', 'q3', after(1, 'other'), { turnMs: 50, backgroundMs: 1000 });
    expect(other.context).toBe('other');
  });

  it('an empty or failing search carries nothing and frees the chat', async () => {
    const carry = newRecallCarry();
    const failing: RecallSearch = () => new Promise((_, rej) => setTimeout(() => rej(new Error('boom')), 20));
    await turnRecall(carry, 'c1', 'q', failing, { turnMs: 5, backgroundMs: 1000 });
    await new Promise((r) => setTimeout(r, 40));
    await flush();
    expect(carry.carried.size).toBe(0);
    expect(carry.inFlight.size).toBe(0);
    const r = await turnRecall(carry, 'c1', 'q', after(1, undefined), { turnMs: 50, backgroundMs: 1000 });
    expect(r).toEqual({ context: undefined, outcome: 'empty' });
  });

  it('a stale carried result is dropped', () => {
    const carry = newRecallCarry();
    carry.carried.set('c1', { query: 'old', text: 'old hit', at: 0 });
    expect(takeCarried(carry, 'c1', CARRY_TTL_MS + 1)).toBeUndefined();
    expect(carry.carried.size).toBe(0);
  });

  it('a carried result never crosses chats', () => {
    const carry = newRecallCarry();
    carry.carried.set('c1', { query: 'q', text: 'hit', at: 0 });
    expect(takeCarried(carry, 'c2', 1)).toBeUndefined();
    expect(carry.carried.size).toBe(1);
  });
});
