// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  MAX_GRADES_PER_TICK,
  MAX_READS_PER_TICK,
  autoOfferEnabled,
  autoOfferIntervalMs,
  autoOfferRepos,
  listOpenPrs,
  runAutoOfferTick,
  type AutoOfferDeps,
  type OpenPr,
} from '../final-review/auto-offer';
import type { CardView, ReviewOutcome } from '../final-review/flow';
import { startAutoOffer } from '../final-review/wire';

const SHA = (n: number): string => n.toString(16).padStart(40, 'a');
const VIEW = { text: 'card', buttons: [] } as unknown as CardView;

function deps(over: Partial<AutoOfferDeps> & { prs?: Record<string, OpenPr[] | null>; outcomes?: Record<number, ReviewOutcome> }): AutoOfferDeps & { sent: CardView[]; reviews: number[] } {
  const sent: CardView[] = [];
  const reviews: number[] = [];
  return {
    repos: ['o/r'],
    list: async (repo) => (over.prs && repo in over.prs ? over.prs[repo] : []),
    review: async (_repo, n) => {
      reviews.push(n);
      return over.outcomes?.[n] ?? { kind: 'no-card', reason: 'gates', stage: 'gates' };
    },
    send: async (v) => {
      sent.push(v);
    },
    settled: new Set<string>(),
    log: () => {},
    ...over,
    sent,
    reviews,
  };
}

describe('flags', () => {
  it.each([
    [{}, false],
    [{ ZOE_FINAL_REVIEW: '1' }, false],
    [{ ZOE_FINAL_REVIEW_AUTO: '1' }, false],
    [{ ZOE_FINAL_REVIEW: '1', ZOE_FINAL_REVIEW_AUTO: '1' }, true],
    [{ ZOE_FINAL_REVIEW: 'true', ZOE_FINAL_REVIEW_AUTO: '1' }, false],
  ])('%j -> %s', (env, expected) => {
    expect(autoOfferEnabled(env as NodeJS.ProcessEnv)).toBe(expected);
  });

  it('repos: unset is none, invalid entries dropped', () => {
    expect(autoOfferRepos({})).toEqual([]);
    expect(autoOfferRepos({ ZOE_FINAL_REVIEW_REPOS: 'a/b, nope, ,c/d' })).toEqual(['a/b', 'c/d']);
  });

  it.each([
    [undefined, 30],
    ['abc', 30],
    ['1', 10],
    ['45', 45],
    ['999', 120],
  ])('interval %s -> %s min', (v, min) => {
    expect(autoOfferIntervalMs({ ZOE_FINAL_REVIEW_AUTO_MIN: v } as NodeJS.ProcessEnv)).toBe(min * 60_000);
  });
});

describe('listOpenPrs', () => {
  it('keeps open, unheld, non-draft PRs with a full sha', async () => {
    const stdout = JSON.stringify([
      { number: 1, headRefOid: SHA(1), isDraft: false, labels: [] },
      { number: 2, headRefOid: SHA(2), isDraft: false, labels: [{ name: 'hold' }] },
      { number: 3, headRefOid: SHA(3), isDraft: true, labels: [] },
      { number: 4, headRefOid: 'short', isDraft: false, labels: [] },
      { number: 5, headRefOid: SHA(5), isDraft: false, labels: [{ name: 'HOLD' }] },
    ]);
    const out = await listOpenPrs('o/r', async () => ({ code: 0, stdout }));
    expect(out).toEqual([{ number: 1, headSha: SHA(1) }]);
  });

  it('a gh failure is null, not an empty list', async () => {
    expect(await listOpenPrs('o/r', async () => ({ code: 1, stdout: '' }))).toBeNull();
    expect(await listOpenPrs('o/r', async () => ({ code: 0, stdout: 'not json' }))).toBeNull();
  });
});

describe('runAutoOfferTick', () => {
  const card: ReviewOutcome = { kind: 'card', view: VIEW, comment: '', superseded: [] };

  it('sends a card once, and never reviews that head again', async () => {
    const d = deps({ prs: { 'o/r': [{ number: 7, headSha: SHA(7) }] }, outcomes: { 7: card } });
    const r1 = await runAutoOfferTick(d);
    const r2 = await runAutoOfferTick(d);
    expect(r1.carded).toBe(1);
    expect(r2.reviewed).toBe(0);
    expect(d.sent).toHaveLength(1);
  });

  it('a head that failed the grade is not graded again', async () => {
    const d = deps({ prs: { 'o/r': [{ number: 8, headSha: SHA(8) }] }, outcomes: { 8: { kind: 'no-card', reason: 'low', stage: 'graded' } } });
    await runAutoOfferTick(d);
    await runAutoOfferTick(d);
    expect(d.reviews).toEqual([8]);
  });

  it('a head stopped at the gates is read again next tick (CI running, no verdict yet)', async () => {
    const d = deps({ prs: { 'o/r': [{ number: 9, headSha: SHA(9) }] } });
    await runAutoOfferTick(d);
    await runAutoOfferTick(d);
    expect(d.reviews).toEqual([9, 9]);
    expect(d.sent).toHaveLength(0);
  });

  it('a new head on the same PR is reviewed', async () => {
    const prs: Record<string, OpenPr[]> = { 'o/r': [{ number: 10, headSha: SHA(10) }] };
    const d = deps({ prs, outcomes: { 10: { kind: 'no-card', reason: 'low', stage: 'graded' } } });
    await runAutoOfferTick(d);
    prs['o/r'] = [{ number: 10, headSha: SHA(11) }];
    await runAutoOfferTick(d);
    expect(d.reviews).toEqual([10, 10]);
  });

  it('stops at the grade cap', async () => {
    const prs = Array.from({ length: 10 }, (_, i) => ({ number: 100 + i, headSha: SHA(100 + i) }));
    const outcomes = Object.fromEntries(prs.map((p) => [p.number, { kind: 'no-card', reason: 'low', stage: 'graded' } as ReviewOutcome]));
    const d = deps({ prs: { 'o/r': prs }, outcomes });
    const r = await runAutoOfferTick(d);
    expect(r.graded).toBe(MAX_GRADES_PER_TICK);
  });

  it('stops at the read cap', async () => {
    const prs = Array.from({ length: MAX_READS_PER_TICK + 5 }, (_, i) => ({ number: 200 + i, headSha: SHA(200 + i) }));
    const d = deps({ prs: { 'o/r': prs } });
    const r = await runAutoOfferTick(d);
    expect(r.reviewed).toBe(MAX_READS_PER_TICK);
  });

  it('a repo that cannot be listed is reported and the next repo still runs', async () => {
    const d = deps({ repos: ['bad/x', 'o/r'], prs: { 'bad/x': null, 'o/r': [{ number: 12, headSha: SHA(12) }] } });
    const r = await runAutoOfferTick(d);
    expect(r.listFailures).toEqual(['bad/x']);
    expect(d.reviews).toEqual([12]);
  });
});

describe('startAutoOffer', () => {
  const flowDeps = {} as never;
  const send = vi.fn(async () => {});

  it('schedules nothing with the flags off', () => {
    expect(startAutoOffer(flowDeps, send, {})).toBeNull();
    expect(startAutoOffer(flowDeps, send, { ZOE_FINAL_REVIEW: '1' })).toBeNull();
  });

  it('schedules nothing when no repo is configured', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(startAutoOffer(flowDeps, send, { ZOE_FINAL_REVIEW: '1', ZOE_FINAL_REVIEW_AUTO: '1' })).toBeNull();
    err.mockRestore();
  });

  it('schedules a timer with both flags and a repo', () => {
    const t = startAutoOffer(flowDeps, send, { ZOE_FINAL_REVIEW: '1', ZOE_FINAL_REVIEW_AUTO: '1', ZOE_FINAL_REVIEW_REPOS: 'o/r' });
    expect(t).not.toBeNull();
    clearInterval(t as ReturnType<typeof setInterval>);
  });
});
