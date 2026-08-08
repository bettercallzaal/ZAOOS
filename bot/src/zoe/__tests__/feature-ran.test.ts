import { afterEach, describe, expect, it, vi } from 'vitest';
import { announcedFeatures, featureRan, resetAnnouncedForTest } from '../feature-ran';

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
