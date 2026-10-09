/**
 * scripts/zoe/nightly-dates.mjs against the exact instants that failed.
 *
 * Card 9919, measured 2026-10-08 on gh: the ZOE nightly processing PRs are
 * opened at 03:07 to 03:14 UTC, which is 23:07 to 23:14 Eastern the evening
 * before, and every one named its files after the UTC date. #3750 (opened
 * 2026-10-06T03:08:58Z) added 2026-10-06-captures.md and 2026-10-07-briefing.md
 * for a run that happened on Monday 5 October in Maine. The inputs below are
 * the PRs' real createdAt values, not paraphrases (first-handler-wins rule 5).
 *
 * Red without the fix: labelling by the UTC date (toISOString().slice(0, 10),
 * which is what the host clock gives a cloud session) returns 2026-10-06 for
 * the #3750 instant. The control case asserts that, so the test cannot pass
 * against a helper that quietly falls back to UTC.
 */
import { describe, expect, it } from 'vitest';
import { nightlyDates } from '../zoe/nightly-dates.mjs';

const TZ = 'America/New_York';

describe('nightlyDates: the ZOE nightly run labels its files by the Eastern day', () => {
  it.each([
    // PR, createdAt (UTC), captures day, briefing day - the measured history
    ['#3750', '2026-10-06T03:08:58Z', '2026-10-05', '2026-10-06', 'Monday'],
    ['#3774', '2026-10-07T03:07:15Z', '2026-10-06', '2026-10-07', 'Tuesday'],
    ['#3798', '2026-10-08T03:14:09Z', '2026-10-07', '2026-10-08', 'Wednesday'],
    ['#3710', '2026-10-05T03:07:45Z', '2026-10-04', '2026-10-05', 'Sunday'],
    ['#3668', '2026-09-27T03:08:22Z', '2026-09-26', '2026-09-27', 'Saturday'],
  ])('%s opened %s: captures %s, briefing %s', (_pr, createdAt, captures, briefing, weekday) => {
    const r = nightlyDates(createdAt);
    expect(r.captures).toBe(captures);
    expect(r.briefing).toBe(briefing);
    expect(r.capturesWeekday).toBe(weekday);
    expect(r.tz).toBe(TZ);
  });

  it('control: the UTC date is what the live PRs used, and it is not the answer', () => {
    const utcDay = new Date('2026-10-06T03:08:58Z').toISOString().slice(0, 10);
    expect(utcDay).toBe('2026-10-06'); // what #3750 wrote
    expect(nightlyDates('2026-10-06T03:08:58Z').captures).not.toBe(utcDay);
  });

  it('a run after midnight Eastern still belongs to the evening before', () => {
    // 01:30 EDT on 7 Oct = 05:30Z; a late or re-run night must not jump a day.
    expect(nightlyDates('2026-10-07T05:30:00Z')).toMatchObject({
      captures: '2026-10-06',
      briefing: '2026-10-07',
    });
  });

  it('crosses a month boundary without calendar code of its own', () => {
    // 23:10 EDT on 31 Oct 2026 = 03:10Z on 1 Nov.
    expect(nightlyDates('2026-11-01T03:10:00Z')).toMatchObject({
      captures: '2026-10-31',
      briefing: '2026-11-01',
    });
  });

  it('handles the fall DST change: 23:10 EST on 1 Nov 2026 is 04:10Z on 2 Nov', () => {
    expect(nightlyDates('2026-11-02T04:10:00Z')).toMatchObject({
      captures: '2026-11-01',
      briefing: '2026-11-02',
    });
  });

  it('refuses a value that is not an instant instead of labelling a NaN date', () => {
    expect(() => nightlyDates('not a date')).toThrow(/not an instant/);
  });
});
