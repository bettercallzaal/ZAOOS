// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GRADES_PER_DAY,
  MAX_GRADES_PER_TICK,
  MAX_READS_PER_TICK,
  SETTLED_KEEP,
  type AutoOfferState,
  autoOfferDailyMax,
  autoOfferEnabled,
  autoOfferIntervalMs,
  autoOfferRepos,
  listOpenPrs,
  parseAutoOfferState,
  recordTick,
  runAutoOfferTick,
  type AutoOfferDeps,
  type OpenPr,
} from '../final-review/auto-offer';
import type { CardView, ReviewOutcome } from '../final-review/flow';
import { type AutoOfferIo, makeAutoOfferTick, startAutoOffer } from '../final-review/wire';

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

describe('per-day cap and restart persistence', () => {
  const graded: ReviewOutcome = { kind: 'no-card', reason: 'low', stage: 'graded' };

  it('autoOfferDailyMax defaults and clamps', () => {
    expect(autoOfferDailyMax({})).toBe(DEFAULT_GRADES_PER_DAY);
    expect(autoOfferDailyMax({ ZOE_FINAL_REVIEW_AUTO_DAY_MAX: 'junk' } as NodeJS.ProcessEnv)).toBe(DEFAULT_GRADES_PER_DAY);
    expect(autoOfferDailyMax({ ZOE_FINAL_REVIEW_AUTO_DAY_MAX: '0.2' } as NodeJS.ProcessEnv)).toBe(1);
    expect(autoOfferDailyMax({ ZOE_FINAL_REVIEW_AUTO_DAY_MAX: '500' } as NodeJS.ProcessEnv)).toBe(48);
  });

  it('parseAutoOfferState: junk is a fresh day; another day keeps settled and resets the count', () => {
    expect(parseAutoOfferState(null, '2026-11-08')).toEqual({ day: '2026-11-08', gradedToday: 0, settled: [] });
    expect(parseAutoOfferState('x', '2026-11-08').gradedToday).toBe(0);
    const saved = { day: '2026-11-08', gradedToday: 5, settled: ['a', 7, 'b'] };
    expect(parseAutoOfferState(saved, '2026-11-08')).toEqual({ day: '2026-11-08', gradedToday: 5, settled: ['a', 'b'] });
    expect(parseAutoOfferState(saved, '2026-11-09')).toEqual({ day: '2026-11-09', gradedToday: 0, settled: ['a', 'b'] });
  });

  it('recordTick keeps only the newest SETTLED_KEEP keys', () => {
    const keys = Array.from({ length: SETTLED_KEEP + 3 }, (_, i) => `k${i}`);
    const st = recordTick({ day: 'd', gradedToday: 1, settled: [] }, 'd', 2, keys);
    expect(st.gradedToday).toBe(3);
    expect(st.settled).toHaveLength(SETTLED_KEEP);
    expect(st.settled[0]).toBe('k3');
  });

  it('runAutoOfferTick with maxGrades 0 lists nothing', async () => {
    const list = vi.fn(async () => [{ number: 1, headSha: SHA(1) }]);
    const d = deps({ list, maxGrades: 0 });
    const r = await runAutoOfferTick(d);
    expect(list).not.toHaveBeenCalled();
    expect(r.reviewed).toBe(0);
  });

  function memIo(initial: unknown = null): AutoOfferIo & { saved: AutoOfferState[] } {
    let cur = initial;
    const saved: AutoOfferState[] = [];
    return {
      load: () => cur,
      save: (st) => {
        cur = JSON.parse(JSON.stringify(st));
        saved.push(st);
      },
      saved,
    };
  }

  function tickWith(io: AutoOfferIo, day: { v: string }, dailyMax: number, reviews: number[], list?: () => Promise<OpenPr[]>) {
    let next = 1000;
    const logs: string[] = [];
    const tick = makeAutoOfferTick({
      repos: ['o/r'],
      // a fresh PR head every tick unless a fixed list is given
      list: list ?? (async () => Array.from({ length: 3 }, () => ({ number: next, headSha: SHA(next++) }))),
      review: async (_r, n) => {
        reviews.push(n);
        return graded;
      },
      send: async () => {},
      dailyMax,
      io,
      now: () => new Date(`${day.v}T12:00:00Z`),
      log: (l) => logs.push(l),
    });
    return { tick, logs };
  }

  it('stops grading at the daily cap, reads nothing more that day, logs once, and resumes the next UTC day', async () => {
    const io = memIo();
    const day = { v: '2026-11-08' };
    const reviews: number[] = [];
    const { tick, logs } = tickWith(io, day, 4, reviews);
    expect((await tick())?.graded).toBe(3);
    expect((await tick())?.graded).toBe(1);
    expect(await tick()).toBeNull();
    expect(await tick()).toBeNull();
    expect(reviews).toHaveLength(4);
    expect(logs.filter((l) => l.includes('daily grade cap'))).toHaveLength(1);
    day.v = '2026-11-09';
    expect((await tick())?.graded).toBe(3);
  });

  it('a restart keeps the day count and does not re-grade a settled head', async () => {
    const io = memIo();
    const day = { v: '2026-11-08' };
    const fixed = async () => [{ number: 5, headSha: SHA(5) }];
    const first: number[] = [];
    await tickWith(io, day, 4, first, fixed).tick();
    expect(first).toEqual([5]);
    expect(io.saved.at(-1)?.gradedToday).toBe(1);

    // a new process: same saved state, fresh in-memory tick
    const second: number[] = [];
    const r = await tickWith(io, day, 4, second, fixed).tick();
    expect(second).toEqual([]);
    expect(r?.reviewed).toBe(0);

    const third: number[] = [];
    const { tick } = tickWith(io, day, 1, third);
    expect(await tick()).toBeNull(); // 1 graded today already, cap 1
    expect(third).toEqual([]);
  });
});
