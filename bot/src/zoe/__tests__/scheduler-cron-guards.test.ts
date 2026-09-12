/**
 * A SUB-DAILY CRON MUST NOT BE GUARDED BY claimFire.
 *
 * claimFire builds its sentinel path from the UTC DATE and writes it with
 * flag 'wx', so it returns true exactly ONCE PER UTC DAY per trigger. That is
 * correct for the daily jobs it was written for. Put it in front of a
 * `*\/10 * * * *` schedule and the 00:0x tick claims the day, every tick after
 * it returns early, and the job runs once - while the cron fires 144 times and
 * every log line says it did.
 *
 * That is the failure this file exists to catch, and it is invisible from the
 * outside: no error, no exception, a healthy-looking schedule, and a number
 * that stays up to 24 hours stale. It was live on this branch's own reconcile
 * cron - a cron whose entire purpose was removing a 24-hour lag - and the
 * comment above it said "10 minutes, not 1" while the guard made it daily.
 *
 * The right primitive for a repeating job is withTickLock: per-RUN mutual
 * exclusion, a staleness timeout, and a release in `finally`. Never two at
 * once, always the next one.
 *
 * WHY THIS IS A SOURCE-LEVEL TEST AND NOT A BEHAVIOURAL ONE. registerCrons wires
 * node-cron schedules at boot; there is no scheduler test harness in this repo
 * and building one to assert a guard choice would be a larger change than the
 * fix. This reads the source instead. It is cruder than a behavioural test and
 * it is honest about being so - but it goes RED against the exact broken
 * version, which is the only property that makes a control worth having.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(__dirname, '..', 'scheduler.ts'), 'utf8');

/** A cron expression that fires more than once a day. */
function isSubDaily(expr: string): boolean {
  const [min = '', hour = ''] = expr.trim().split(/\s+/);
  // '*/10 * * * *' and '0 * * * *' repeat; '3 9 * * *' does not.
  return min.includes('/') || min === '*' || hour.includes('/') || hour === '*';
}

/** Every cron.schedule('<expr>', ...) in the file, with the body that follows. */
function schedules(): { expr: string; body: string }[] {
  const out: { expr: string; body: string }[] = [];
  const re = /cron\.schedule\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(SRC)) !== null) {
    // Up to the next cron.schedule, or 4000 chars - enough to cover a handler.
    const rest = SRC.slice(m.index + m[0].length);
    const next = rest.search(/cron\.schedule\(/);
    out.push({ expr: m[1], body: next === -1 ? rest.slice(0, 4000) : rest.slice(0, next) });
  }
  return out;
}

describe('scheduler cron guards', () => {
  it('finds the schedules at all (the test is worthless if the regex misses)', () => {
    const all = schedules();
    expect(all.length).toBeGreaterThan(3);
    expect(all.some((s) => isSubDaily(s.expr))).toBe(true);
    expect(all.some((s) => !isSubDaily(s.expr))).toBe(true);
  });

  it('no sub-daily cron is guarded by claimFire', () => {
    const offenders = schedules()
      .filter((s) => isSubDaily(s.expr))
      .filter((s) => /claimFire\s*\(/.test(s.body))
      .map((s) => s.expr);
    expect(offenders).toEqual([]);
  });

  it('claimFire is still used by at least one daily cron - this is not a ban', () => {
    // If claimFire ever stops being used entirely, the rule above has quietly
    // become vacuous and should be deleted rather than left looking protective.
    const daily = schedules().filter((s) => !isSubDaily(s.expr));
    expect(daily.some((s) => /claimFire\s*\(/.test(s.body))).toBe(true);
  });
});
