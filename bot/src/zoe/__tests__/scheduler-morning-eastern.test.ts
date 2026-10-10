/**
 * The morning brief and the backlog batch run on Zaal's clock, not UTC.
 *
 * Until 2026-10-10 the brief was '0 9 * * *' in UTC: 05:00 Eastern in daylight
 * time, 04:00 after the clocks go back on 1 November 2026, which is inside the
 * quiet window (20:30 to 04:45). These read scheduler.ts as source, like
 * scheduler-cron-guards.test.ts, because importing the scheduler would start it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(__dirname, '..', 'scheduler.ts'), 'utf8');

/** The cron.schedule(...) call whose handler contains `marker`: its expression and its timezone option. */
function scheduleWith(marker: string): { expr: string; tz: string } {
  const at = SRC.indexOf(marker);
  if (at === -1) throw new Error(`marker not found: ${marker}`);
  const start = SRC.lastIndexOf('cron.schedule(', at);
  const expr = /cron\.schedule\(\s*(?:\/\/[^\n]*\n\s*)*['"]([^'"]+)['"]/.exec(SRC.slice(start));
  const tz = /\{ timezone: ([^}]+?) \}/.exec(SRC.slice(at));
  if (!expr || !tz) throw new Error(`could not read the schedule around: ${marker}`);
  return { expr: expr[1], tz: tz[1] };
}

/** Eastern wall-clock time of a UTC instant, as HH:MM. */
const eastern = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));

describe('the morning schedules are anchored to Eastern time', () => {
  it('the zone constant is America/New_York', () => {
    expect(SRC).toContain("export const MORNING_TZ = 'America/New_York';");
  });

  it('the morning brief fires at 05:00 in that zone', () => {
    expect(scheduleWith("claimFire('morning-brief')")).toEqual({ expr: '0 5 * * *', tz: 'MORNING_TZ' });
  });

  it('the backlog batch fires three minutes later, in the same zone', () => {
    expect(scheduleWith("claimFire('backlog-grill-batch')")).toEqual({ expr: '3 5 * * *', tz: 'MORNING_TZ' });
  });

  it('no schedule is left on the old UTC morning minute', () => {
    expect(SRC).not.toMatch(/cron\.schedule\(\s*(?:\/\/[^\n]*\n\s*)*['"][03] 9 \* \* \*['"]/);
  });

  it('red control on the reader: it tells a UTC schedule from an Eastern one', () => {
    // The answer loop is a UTC schedule; if the reader returned MORNING_TZ for
    // everything, the two assertions above would prove nothing.
    expect(scheduleWith('runAnswerLoopTick({').tz).toBe("'UTC'");
  });

  it('why it matters: the old UTC instant is 05:00 in October and 04:00 in November', () => {
    expect(eastern('2026-10-30T09:00:00Z')).toBe('05:00');
    expect(eastern('2026-11-02T09:00:00Z')).toBe('04:00'); // inside a window that ends 04:45
    expect(eastern('2026-11-02T10:00:00Z')).toBe('05:00'); // where an Eastern cron fires instead
  });

  it("node-cron's own matcher fires that expression at 05:00 Eastern on both sides of the change", () => {
    // The library's matcher, not a reimplementation: this is what decides when the brief runs.
    const TimeMatcher = createRequire(import.meta.url)('node-cron/src/time-matcher') as new (
      pattern: string,
      tz: string,
    ) => { match(d: Date): boolean };
    const brief = new TimeMatcher(scheduleWith("claimFire('morning-brief')").expr, 'America/New_York');
    expect(brief.match(new Date('2026-10-30T09:00:00Z'))).toBe(true); // 05:00 EDT
    expect(brief.match(new Date('2026-11-02T10:00:00Z'))).toBe(true); // 05:00 EST
    expect(brief.match(new Date('2026-11-02T09:00:00Z'))).toBe(false); // 04:00 EST: the old slot
    const old = new TimeMatcher('0 9 * * *', 'UTC');
    expect(old.match(new Date('2026-11-02T09:00:00Z'))).toBe(true); // red control: the old cron did fire at 04:00
  });
});
