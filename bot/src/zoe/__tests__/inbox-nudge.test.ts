import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ReviewPR } from '../../cockpit/types';
import {
  CLEAR_TEXT,
  DEFAULT_BACKOFF_H,
  DEFAULT_FROM,
  decide,
  easternDay,
  emptyState,
  formatPrList,
  formatTotals,
  mergeCommand,
  nudgeConfig,
  parsePrCallback,
  prCallback,
  readState,
  readTotals,
  runInboxNudgeTick,
  waitingPrs,
  type NudgeState,
} from '../inbox-nudge';

// Zaal, 2026-10-14, item 228: "it should daily give me my total grill and todo
// items and keep bugging me til nothings in my inbox"; "Push all PRs to this".

const cfg = { fromMinute: DEFAULT_FROM, backoffH: DEFAULT_BACKOFF_H };
// 2026-10-14 is in daylight time: Eastern = UTC-4. 09:15Z = 05:15 EDT.
const at = (hhmmEdt: string, day = '2026-10-14'): Date => {
  const [h, m] = hhmmEdt.split(':').map(Number);
  return new Date(Date.UTC(2026, 9, Number(day.slice(8)), h + 4, m));
};
const sent = (hhmm: string, total: number, day?: string) => ({ at: at(hhmm, day).toISOString(), total });

describe('decide - when the totals go out', () => {
  it('quiet window: nothing, whatever the count', () => {
    expect(decide(emptyState('2026-10-14'), at('03:00'), 9, cfg, true)).toEqual({ action: 'quiet' });
  });
  it('before 05:15 Eastern: nothing', () => {
    expect(decide(emptyState('2026-10-14'), at('05:00'), 9, cfg, false)).toEqual({ action: 'before-from' });
  });
  it('first tick at or after 05:15 with a count: the first send', () => {
    expect(decide(emptyState('2026-10-14'), at('05:15'), 9, cfg, false)).toEqual({ action: 'send', nth: 1 });
    expect(decide(emptyState('2026-10-14'), at('11:30'), 9, cfg, false)).toEqual({ action: 'send', nth: 1 });
  });
  it('the repeat waits 2h, then only if the total changed', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9)], clearSaidAt: null };
    expect(decide(s, at('06:45'), 7, cfg, false)).toMatchObject({ action: 'not-due' });
    expect(decide(s, at('07:15'), 9, cfg, false)).toEqual({ action: 'unchanged' });
    expect(decide(s, at('07:15'), 7, cfg, false)).toEqual({ action: 'send', nth: 2 });
  });
  it('then 4h, then 8h, then the day is exhausted (the 20:00 digest is next)', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9), sent('07:15', 7)], clearSaidAt: null };
    expect(decide(s, at('10:15'), 5, cfg, false)).toMatchObject({ action: 'not-due' });
    expect(decide(s, at('11:15'), 5, cfg, false)).toEqual({ action: 'send', nth: 3 });
    const s3: NudgeState = { ...s, sends: [...s.sends, sent('11:15', 5)] };
    expect(decide(s3, at('19:15'), 4, cfg, false)).toEqual({ action: 'send', nth: 4 });
    const s4: NudgeState = { ...s3, sends: [...s3.sends, sent('19:15', 4)] };
    expect(decide(s4, at('19:45'), 1, cfg, false)).toEqual({ action: 'exhausted' });
  });
  it('an unchanged count is never sent twice, even when due', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9)], clearSaidAt: null };
    expect(decide(s, at('12:00'), 9, cfg, false)).toEqual({ action: 'unchanged' });
  });
  it('zero: one clear line if something was sent today, then silence', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9)], clearSaidAt: null };
    expect(decide(s, at('09:00'), 0, cfg, false)).toEqual({ action: 'clear' });
    expect(decide({ ...s, clearSaidAt: at('09:00').toISOString() }, at('09:30'), 0, cfg, false)).toEqual({ action: 'silent' });
    expect(decide(emptyState('2026-10-14'), at('09:00'), 0, cfg, false)).toEqual({ action: 'silent' });
  });
  it('a partial read never clears and never counts as a change; the first send of the day still goes', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9)], clearSaidAt: null };
    expect(decide(s, at('09:00'), 0, cfg, false, true)).toEqual({ action: 'unread' });
    expect(decide(s, at('12:00'), 3, cfg, false, true)).toEqual({ action: 'unread' });
    expect(decide(emptyState('2026-10-14'), at('09:00'), 0, cfg, false, true)).toEqual({ action: 'unread' });
    expect(decide(emptyState('2026-10-14'), at('09:00'), 4, cfg, false, true)).toEqual({ action: 'send', nth: 1 });
  });
  it('a count that comes back after a clear is sent again on the ladder', () => {
    const s: NudgeState = { day: '2026-10-14', sends: [sent('05:15', 9)], clearSaidAt: at('09:00').toISOString() };
    expect(decide(s, at('12:00'), 3, cfg, false)).toEqual({ action: 'send', nth: 2 });
  });
});

describe('config and day', () => {
  it('defaults, and a bad value falls back instead of opening the day', () => {
    expect(nudgeConfig({})).toEqual({ fromMinute: 315, backoffH: [2, 4, 8] });
    expect(nudgeConfig({ ZOE_INBOX_NUDGE_FROM: '06:00', ZOE_INBOX_NUDGE_BACKOFF_H: '1,3' })).toEqual({ fromMinute: 360, backoffH: [1, 3] });
    expect(nudgeConfig({ ZOE_INBOX_NUDGE_FROM: 'noon', ZOE_INBOX_NUDGE_BACKOFF_H: 'x,-2' })).toEqual({ fromMinute: 315, backoffH: [2, 4, 8] });
  });
  it('the day is the Eastern calendar day', () => {
    expect(easternDay(new Date('2026-10-15T03:30:00Z'))).toBe('2026-10-14');
    expect(easternDay(new Date('2026-10-15T04:30:00Z'))).toBe('2026-10-15');
  });
});

const pr = (n: number, repo = 'bettercallzaal/ZAOOS', extra: Partial<ReviewPR> = {}): ReviewPR => ({
  repo,
  number: n,
  title: `PR ${n}`,
  url: `https://github.com/${repo}/pull/${n}`,
  draft: false,
  createdAt: '2026-10-10T12:00:00Z',
  ...extra,
});

describe('PRs on his hand', () => {
  it('hold and draft are not on his hand; rows without labels are', () => {
    const list = waitingPrs([pr(1), pr(2, 'ZAODEVZ/ZAOscout', { labels: ['hold'] }), pr(3, 'b/c', { draft: true }), pr(4, 'b/c', { labels: ['docs'] })]);
    expect(list.map((p) => p.number)).toEqual([1, 4]);
  });
  it('the merge line is the squash command, never run here', () => {
    expect(mergeCommand(pr(531, 'bettercallzaal/zaal-dotfiles'))).toBe('gh pr merge 531 -R bettercallzaal/zaal-dotfiles --squash --delete-branch');
  });
  it('a PR button round-trips through callback_data under 64 bytes, or gets no button', () => {
    const data = prCallback(pr(531, 'bettercallzaal/zaal-dotfiles'));
    expect(data).toBe('inb:cmd:bettercallzaal/zaal-dotfiles:531');
    expect(parsePrCallback(data as string)).toEqual({ repo: 'bettercallzaal/zaal-dotfiles', number: 531 });
    expect(prCallback(pr(1, `ZAODEVZ/${'x'.repeat(60)}`))).toBeNull();
    expect(parsePrCallback('inb:cmd:nope')).toBeNull();
    expect(parsePrCallback('q:abc:ZGVm')).toBeNull();
  });
  it('the list names repo, number, age and title, one button per PR', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const { text, buttons } = formatPrList([pr(531, 'bettercallzaal/zaal-dotfiles'), pr(7, 'ZAODEVZ/ZAOscout', { createdAt: null })], now);
    expect(text).toContain('bettercallzaal/zaal-dotfiles #531 (4d): PR 531');
    expect(text).toContain('ZAODEVZ/ZAOscout #7 (age ?): PR 7');
    expect(text).toContain('nothing merges by itself');
    expect(buttons.map((r) => r[0].text)).toEqual(['zaal-dotfiles #531: merge cmd', 'ZAOscout #7: merge cmd']);
  });
});

describe('the totals message', () => {
  it('carries each count, the failed sources, and only the buttons that have something behind them', () => {
    const t = { lanes: 118, page: 4, board: 6, prs: 2, total: 130, failed: ['board'], prList: [pr(1), pr(2)] };
    const { text, buttons } = formatTotals(t, 1, new Date());
    expect(text.split('\n')[0]).toBe('Waiting on you today: 130');
    expect(text).toContain('Lanes asking: 118');
    expect(text).toContain('PRs on your hand: 2');
    expect(text).toContain('Could not read: board (counted as 0)');
    expect(buttons.map((r) => r[0].data)).toEqual(['inb:next', 'inb:prs']);
    const again = formatTotals({ ...t, page: 0, prs: 0, failed: [] }, 3, new Date());
    expect(again.text.split('\n')[0]).toBe('Still waiting on you: 130 (update 3)');
    expect(again.buttons).toEqual([]);
  });
});

describe('runInboxNudgeTick - sources, state file, sends', () => {
  let home: string;
  const sends: { text: string; buttons: unknown[] }[] = [];
  const send = async (text: string, buttons: unknown[]) => {
    sends.push({ text, buttons });
  };
  const sources = (over: Partial<Record<'lanes' | 'page' | 'board' | 'prs', () => Promise<never>>> & { prs?: () => Promise<ReviewPR[]> } = {}) => ({
    lanes: async () => 3,
    page: async () => 2,
    board: async () => 1,
    prs: async () => [pr(1), pr(2, 'b/c', { labels: ['hold'] })],
    ...over,
  });
  beforeEach(async () => {
    home = await fs.mkdtemp(join(tmpdir(), 'inbn-'));
    process.env.ZOE_HOME = home;
    sends.length = 0;
  });
  afterEach(async () => {
    delete process.env.ZOE_HOME;
    await fs.rm(home, { recursive: true, force: true });
  });
  const env = { ZOE_INBOX_NUDGE: '1', ZOE_QUIET: '0' };

  it('flag off: nothing read, nothing sent', async () => {
    let reads = 0;
    const r = await runInboxNudgeTick({ send, env: {}, now: at('09:00'), sources: sources({ lanes: async () => { reads++; throw new Error('x'); } }) });
    expect(r).toBe('off');
    expect(reads).toBe(0);
    expect(sends).toEqual([]);
  });
  it('before 05:15 nothing is read either', async () => {
    let reads = 0;
    const r = await runInboxNudgeTick({ send, env, now: at('04:50'), sources: sources({ lanes: async () => { reads++; throw new Error('x'); } }) });
    expect(r).toBe('before-from');
    expect(reads).toBe(0);
  });
  it('first tick after 05:15: the totals go out (hold PR not counted) and the state records it', async () => {
    const r = await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources() });
    expect(r).toBe('send');
    expect(sends).toHaveLength(1);
    expect(sends[0].text).toContain('Waiting on you today: 7');
    expect(sends[0].text).toContain('PRs on your hand: 1');
    const s = await readState('2026-10-14');
    expect(s.sends).toHaveLength(1);
    expect(s.sends[0].total).toBe(7);
  });
  it('the next tick is not due; two hours on with the same count it is unchanged; with a new count it repeats', async () => {
    await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources() });
    expect(await runInboxNudgeTick({ send, env, now: at('06:00'), sources: sources() })).toBe('not-due');
    expect(await runInboxNudgeTick({ send, env, now: at('07:30'), sources: sources() })).toBe('unchanged');
    expect(await runInboxNudgeTick({ send, env, now: at('07:30'), sources: sources({ lanes: async () => 0 } as never) })).toBe('send');
    expect(sends).toHaveLength(2);
    expect(sends[1].text).toContain('Still waiting on you: 4 (update 2)');
  });
  it('a source that fails counts 0, is named, and does not stop the send', async () => {
    const r = await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources({ board: async () => { throw new Error('tracker down'); } }) });
    expect(r).toBe('send');
    expect(sends[0].text).toContain('Could not read: board (counted as 0)');
    expect(sends[0].text).toContain('Waiting on you today: 6');
  });
  it('every source down after the morning send: unread, nothing sent, the clear is not spent', async () => {
    await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources() });
    const down = async (): Promise<never> => {
      throw new Error('down');
    };
    const allDown = { lanes: down, page: down, board: down, prs: down };
    expect(await runInboxNudgeTick({ send, env, now: at('09:00'), sources: allDown })).toBe('unread');
    expect(sends).toHaveLength(1);
    const s = await readState('2026-10-14');
    expect(s.clearSaidAt).toBeNull();
    expect(s.sends).toHaveLength(1);
    // The next full read with a real zero still gets its clear.
    const zero = sources({ lanes: async () => 0, page: async () => 0, board: async () => 0, prs: async () => [] } as never);
    expect(await runInboxNudgeTick({ send, env, now: at('09:30'), sources: zero })).toBe('clear');
  });
  it('zero after a send: one clear line, then silence for the day', async () => {
    await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources() });
    const zero = sources({ lanes: async () => 0, page: async () => 0, board: async () => 0, prs: async () => [] } as never);
    expect(await runInboxNudgeTick({ send, env, now: at('09:00'), sources: zero })).toBe('clear');
    expect(sends[1]).toEqual({ text: CLEAR_TEXT, buttons: [] });
    expect(await runInboxNudgeTick({ send, env, now: at('09:30'), sources: zero })).toBe('silent');
    expect(sends).toHaveLength(2);
  });
  it('a new Eastern day starts a fresh state', async () => {
    await runInboxNudgeTick({ send, env, now: at('05:30'), sources: sources() });
    expect(await runInboxNudgeTick({ send, env, now: at('05:30', '2026-10-15'), sources: sources() })).toBe('send');
    expect(sends).toHaveLength(2);
    expect(sends[1].text).toContain('Waiting on you today: 7');
  });
  it('readTotals sums the four sources and keeps the PR list for the buttons', async () => {
    const t = await readTotals(sources());
    expect(t).toMatchObject({ lanes: 3, page: 2, board: 1, prs: 1, total: 7, failed: [] });
    expect(t.prList.map((p) => p.number)).toEqual([1]);
  });
});
