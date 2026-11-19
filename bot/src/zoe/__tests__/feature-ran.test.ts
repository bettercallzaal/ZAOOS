import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  announcedFeatures,
  DETAIL_MAX,
  DETAIL_WITHHELD,
  featureRan,
  recentRuns,
  resetAnnouncedForTest,
  screenDetail,
} from '../feature-ran';

afterEach(() => {
  resetAnnouncedForTest();
  vi.restoreAllMocks();
});

describe('featureRan', () => {
  it('prints the first time a feature runs', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    featureRan('dm-build');
    expect(spy).toHaveBeenCalledWith('[zoe/ran] dm-build');
  });

  it('includes the detail when given', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    featureRan('dm-build', 'chat 123');
    expect(spy).toHaveBeenCalledWith('[zoe/ran] dm-build - chat 123');
  });

  // The whole point of once-per-process. tick-lock runs every tick; a line per
  // call would be thousands a day and become the noise nobody greps.
  it('stays silent on every later call, however many', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (let i = 0; i < 500; i += 1) featureRan('tick-lock', `call ${i}`);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('tracks each feature separately', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    featureRan('a');
    featureRan('b');
    featureRan('a');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(announcedFeatures()).toEqual(['a', 'b']);
  });

  it('uses a greppable prefix - one grep answers what is alive', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    featureRan('guardrails');
    expect((spy.mock.calls[0][0] as string).startsWith('[zoe/ran] ')).toBe(true);
  });

  // A closed pipe or a detached service must cost a log line, not the work.
  it('never throws when stdout is gone', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('stdout gone');
    });
    expect(() => featureRan('x')).not.toThrow();
  });
});

describe('screenDetail', () => {
  it('leaves a short plain detail alone', () => {
    expect(screenDetail('chat 123')).toBe('chat 123');
    expect(screenDetail('3 receipts')).toBe('3 receipts');
  });

  it('drops a missing or blank detail', () => {
    expect(screenDetail(undefined)).toBeUndefined();
    expect(screenDetail('   \n ')).toBeUndefined();
  });

  it.each([
    ['an Anthropic key', `task sk-ant-${'a'.repeat(30)}`],
    ['a GitHub token', `ghp_${'A'.repeat(36)}`],
    ['a Telegram bot token', `1234567890:${'b'.repeat(35)}`],
    ['a bare 64-hex key', 'f'.repeat(64)],
  ])('withholds the whole detail when it holds %s', (_name, text) => {
    expect(screenDetail(text)).toBe(DETAIL_WITHHELD);
  });

  it('shortens a home directory to ~', () => {
    expect(screenDetail('/home/zaal/zao-bot-live/x.md')).toBe('~/zao-bot-live/x.md');
    expect(screenDetail('/Users/someone/notes.md')).toBe('~/notes.md');
    expect(screenDetail('C:\\Users\\someone\\notes.md')).toBe('~\\notes.md');
  });

  it('collapses lines and clips a long detail', () => {
    const out = screenDetail(`first line\nsecond ${'x'.repeat(200)}`) ?? '';
    expect(out.includes('\n')).toBe(false);
    expect(out.length).toBe(DETAIL_MAX);
    expect(out.endsWith('...')).toBe(true);
  });
});

describe('featureRan screens the detail before logging or keeping it', () => {
  it('a key in a detail never reaches the log line or recentRuns', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const key = `sk-ant-${'z'.repeat(30)}`;
    featureRan('screen-test', `title with ${key}`);
    expect(String(spy.mock.calls[0][0])).not.toContain(key);
    expect(String(spy.mock.calls[0][0])).toContain(DETAIL_WITHHELD);
    const run = recentRuns().find((r) => r.feature === 'screen-test');
    expect(run?.detail).toBe(DETAIL_WITHHELD);
  });
});
