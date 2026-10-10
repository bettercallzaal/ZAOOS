import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory ~/.zao/zoe/grill_state.json (same shape as grill-blocked-send.test.ts).
import { homedir } from 'node:os';
import { join } from 'node:path';

const files = new Map<string, string>();
vi.mock('node:fs', () => ({
  promises: {
    readFile: async (p: string) => {
      const v = files.get(p);
      if (v === undefined) throw new Error('ENOENT');
      return v;
    },
    writeFile: async (p: string, data: string) => {
      files.set(p, data);
    },
    mkdir: async () => undefined,
  },
}));

import {
  DEFAULT_GRILL_EXPIRE_DAYS,
  expireStale,
  grillExpireDays,
  grillExpireEnabled,
  pickNext,
  recordAsk,
  surfaceGrill,
  type GrillItem,
  type GrillState,
} from '../grill';
import type { CockpitTask, ReviewPR } from '../../cockpit/types';

const DAY = 24 * 3600_000;
const NOW = Date.parse('2026-10-10T14:00:00Z');
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();
const MAX = 30 * DAY;

const st = (items: GrillState['items'], activeKey: string | null = null): GrillState => ({
  items,
  activeKey,
  lastAskedAt: null,
  recentAnswered: {},
});
const item = (key: string): GrillItem => ({ key, kind: 'decision', title: key, priority: 1 });

afterEach(() => vi.unstubAllEnvs());

describe('flag and cutoff', () => {
  it('is on only for the literal 1', () => {
    vi.stubEnv('ZOE_GRILL_EXPIRE', '1');
    expect(grillExpireEnabled()).toBe(true);
    vi.stubEnv('ZOE_GRILL_EXPIRE', 'true');
    expect(grillExpireEnabled()).toBe(false);
  });
  it('cutoff defaults to 30 days and ignores junk', () => {
    expect(DEFAULT_GRILL_EXPIRE_DAYS).toBe(30);
    expect(grillExpireDays({})).toBe(30);
    expect(grillExpireDays({ ZOE_GRILL_EXPIRE_DAYS: '14' })).toBe(14);
    expect(grillExpireDays({ ZOE_GRILL_EXPIRE_DAYS: '0' })).toBe(30);
    expect(grillExpireDays({ ZOE_GRILL_EXPIRE_DAYS: 'soon' })).toBe(30);
  });
});

describe('expireStale', () => {
  it("gone: an asked item no longer in the queue (PR closed, card done, event passed)", () => {
    const s = st({ gonePr: { askedAt: iso(2), status: 'asked' }, live: { askedAt: iso(2), status: 'asked' } });
    const r = expireStale(s, new Set(['live']), NOW, { queueComplete: true, maxAgeMs: MAX });
    expect(r).toEqual({ gone: 1, aged: 0 });
    expect(s.items.gonePr).toMatchObject({ status: 'expired', expiredReason: 'gone', askedAt: iso(2) });
    expect(s.items.live.status).toBe('asked');
  });

  it('age: still in the queue, first asked past the cutoff; re-asks do not reset the clock', () => {
    const s = st({
      old: { askedAt: iso(1), firstAskedAt: iso(40), status: 'asked', askCount: 4 },
      young: { askedAt: iso(1), firstAskedAt: iso(29), status: 'asked' },
    });
    const r = expireStale(s, new Set(['old', 'young']), NOW, { queueComplete: true, maxAgeMs: MAX });
    expect(r).toEqual({ gone: 0, aged: 1 });
    expect(s.items.old).toMatchObject({ status: 'expired', expiredReason: 'age', firstAskedAt: iso(40) });
    expect(s.items.young.status).toBe('asked');
  });

  it('an incomplete queue expires nothing as gone (a failed fetch is not a resolution)', () => {
    const s = st({ a: { askedAt: iso(2), status: 'asked' }, b: { askedAt: iso(50), status: 'asked' } });
    const r = expireStale(s, new Set(['b']), NOW, { queueComplete: false, maxAgeMs: MAX });
    expect(r).toEqual({ gone: 0, aged: 1 }); // b is in the queue and old: age still applies
    expect(s.items.a.status).toBe('asked');
  });

  it('never touches done, snoozed, or the active question', () => {
    const s = st(
      {
        done: { askedAt: iso(90), status: 'done', answer: 'a' },
        snz: { askedAt: iso(90), status: 'snoozed', snoozeUntil: iso(-1) },
        active: { askedAt: iso(90), status: 'asked' },
      },
      'active',
    );
    expect(expireStale(s, new Set(), NOW, { queueComplete: true, maxAgeMs: MAX })).toEqual({ gone: 0, aged: 0 });
    expect(Object.values(s.items).map((i) => i.status)).toEqual(['done', 'snoozed', 'asked']);
  });

  it('skipped items expire the same way', () => {
    const s = st({ sk: { askedAt: iso(3), status: 'skipped' } });
    expect(expireStale(s, new Set(), NOW, { queueComplete: true, maxAgeMs: MAX }).gone).toBe(1);
  });
});

describe('pickNext with expired items', () => {
  it('aged: never pushed, but offered when Zaal asks (/grill)', () => {
    const s = st({ a: { askedAt: iso(40), status: 'expired', expiredReason: 'age' } });
    expect(pickNext([item('a')], s, NOW)).toBeNull();
    expect(pickNext([item('a')], s, NOW, { includeAged: true })?.key).toBe('a');
  });
  it('gone, then back in the queue: asked again, with a fresh age and count', () => {
    const s = st({ a: { askedAt: iso(40), firstAskedAt: iso(60), askCount: 4, status: 'expired', expiredReason: 'gone' } });
    expect(pickNext([item('a')], s, NOW)?.key).toBe('a');
    recordAsk(s, item('a'), NOW);
    expect(s.items.a).toEqual({ askedAt: iso(0), status: 'asked', firstAskedAt: iso(0), askCount: 1 });
  });
  it('red control: an aged item re-asked on demand keeps its first-asked date', () => {
    const s = st({ a: { askedAt: iso(40), firstAskedAt: iso(60), askCount: 4, status: 'expired', expiredReason: 'age' } });
    recordAsk(s, item('a'), NOW);
    expect(s.items.a).toMatchObject({ firstAskedAt: iso(60), askCount: 5, status: 'asked' });
  });
});

describe('surfaceGrill', () => {
  const task = (id: string): CockpitTask =>
    ({ id, title: id, status: 'todo', priority: 'P0', legacy_id: id, next_owner: 'me', notes: null }) as CockpitTask;
  const pr = (url: string): ReviewPR => ({ repo: 'o/r', number: 1, title: url, url, draft: false, createdAt: null });
  const stored = (): GrillState => {
    const raw = [...files.entries()].find(([p]) => p.endsWith('grill_state.json'))?.[1];
    return JSON.parse(raw as string);
  };
  const seed = (s: GrillState) => files.set(join(homedir(), '.zao', 'zoe', 'grill_state.json'), JSON.stringify(s));

  beforeEach(() => files.clear());

  const base = {
    now: NOW,
    sendDM: async () => ({ message_id: 9 }),
    fetchEvents: async () => [],
  };

  it('flag on: a merged PR and a done card expire; the live card is asked', async () => {
    vi.stubEnv('ZOE_GRILL_EXPIRE', '1');
    seed(st({ 'https://gh/pr/1': { askedAt: iso(5), status: 'asked' }, doneCard: { askedAt: iso(5), status: 'asked' } }));
    const r = await surfaceGrill({ ...base, fetchTasks: async () => [task('live')], fetchPRs: async () => [] });
    expect(r.sent).toBe(true);
    const s = stored();
    expect(s.items['https://gh/pr/1']).toMatchObject({ status: 'expired', expiredReason: 'gone' });
    expect(s.items.doneCard).toMatchObject({ status: 'expired', expiredReason: 'gone' });
    expect(s.items.live.status).toBe('asked');
  });

  it('flag on, PR fetch FAILS: the PR ask is kept, not expired', async () => {
    vi.stubEnv('ZOE_GRILL_EXPIRE', '1');
    seed(st({ 'https://gh/pr/1': { askedAt: iso(5), status: 'asked' } }));
    await surfaceGrill({
      ...base,
      fetchTasks: async () => [task('live')],
      fetchPRs: async () => {
        throw new Error('gh down');
      },
    });
    expect(stored().items['https://gh/pr/1'].status).toBe('asked');
  });

  it('flag on, EMPTY task list: treated as a failed read, nothing expires as gone', async () => {
    vi.stubEnv('ZOE_GRILL_EXPIRE', '1');
    seed(st({ card: { askedAt: iso(5), status: 'asked' } }));
    await surfaceGrill({ ...base, fetchTasks: async () => [], fetchPRs: async () => [pr('https://gh/pr/2')] });
    expect(stored().items.card.status).toBe('asked');
  });

  it('red control: flag off, the same stale state is left exactly as it was', async () => {
    seed(st({ 'https://gh/pr/1': { askedAt: iso(50), status: 'asked' } }));
    await surfaceGrill({ ...base, fetchTasks: async () => [task('live')], fetchPRs: async () => [] });
    expect(stored().items['https://gh/pr/1']).toEqual({ askedAt: iso(50), status: 'asked' });
  });
});
