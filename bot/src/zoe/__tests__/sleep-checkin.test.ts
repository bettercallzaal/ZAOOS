// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkinDue,
  dayLine,
  DEFAULT_SCHEDULE,
  easternClock,
  runSleepCheckinTick,
  sleepSchedule,
  targetHours,
  parseSleepCallback,
  readSleepDays,
  recordSleepTap,
  renderMonth,
  sendSleepCheckin,
  sleepCardText,
  sleepCheckinEnabled,
  sleepKeyboard,
  sleepMonthPath,
  sleepStatePath,
  SLEEP_CALLBACK,
  weekLine,
  type SleepDays,
} from '../sleep-checkin';

let home: string;
beforeEach(async () => {
  home = await fs.mkdtemp(join(tmpdir(), 'zoe-sleep-'));
  vi.stubEnv('ZOE_HOME', home);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(home, { recursive: true, force: true });
});

// A week LINE, not the word: the file's header sentence says "a week line".
const WEEK_LINE = /^\d{4}-\d{2}-\d{2} week /m;
const at = (iso: string) => new Date(iso);
const d = (hours?: number, energy?: number) => ({ hours, energy, updatedAt: 'x' });
// Mon 2026-10-12 ... Sun 2026-10-18.
const WEEK: SleepDays = {
  '2026-10-12': d(7, 3),
  '2026-10-13': d(8, 4),
  '2026-10-14': d(6, 2),
  '2026-10-15': d(8, 4),
  '2026-10-16': d(9, 5),
  '2026-10-17': d(7, 3),
  '2026-10-18': d(8, 4),
};

describe('flag', () => {
  it('is on only for the literal 1', () => {
    expect(sleepCheckinEnabled({ ZOE_SLEEP_CHECKIN: '1' })).toBe(true);
    expect(sleepCheckinEnabled({ ZOE_SLEEP_CHECKIN: 'on' })).toBe(false);
    expect(sleepCheckinEnabled({})).toBe(false);
  });
});

describe('parseSleepCallback', () => {
  it('reads an hours tap and an energy tap', () => {
    expect(parseSleepCallback('sl:h:7:2026-10-13')).toEqual({ field: 'hours', value: 7, date: '2026-10-13' });
    expect(parseSleepCallback('sl:e:3:2026-10-13')).toEqual({ field: 'energy', value: 3, date: '2026-10-13' });
  });
  it.each([
    ['sl:h:4:2026-10-13', 'hours below the buttons'],
    ['sl:h:1:2026-10-13', 'an energy value on the hours row'],
    ['sl:e:6:2026-10-13', 'energy above 5'],
    ['sl:e:0:2026-10-13', 'energy zero'],
    ['sl:h:7:2026-13-45', 'a date that is not a calendar date'],
    ['sl:h:7:2026-02-30', '30 February'],
    ['sl:x:7:2026-10-13', 'an unknown field'],
    ['grill:done', 'another handler\'s data'],
    ['sl:h:7:2026-10-13:extra', 'trailing data'],
  ])('rejects %s (%s)', (data) => {
    expect(parseSleepCallback(data)).toBeNull();
  });
  it('every button on the card parses back to its own value, and fits 64 bytes', () => {
    for (const row of sleepKeyboard('2026-10-13').inline_keyboard) {
      for (const b of row) {
        expect(SLEEP_CALLBACK.test(b.callback_data)).toBe(true);
        expect(parseSleepCallback(b.callback_data)).not.toBeNull();
        expect(Buffer.byteLength(b.callback_data)).toBeLessThanOrEqual(64);
      }
    }
  });
});

describe('the card', () => {
  it('two rows: five hours buttons, five energy buttons', () => {
    const k = sleepKeyboard('2026-10-13').inline_keyboard;
    expect(k.map((r) => r.map((b) => b.text))).toEqual([
      ['5h', '6h', '7h', '8h', '9h'],
      ['1', '2', '3', '4', '5'],
    ]);
  });
  it('marks the chosen value on each row and says what is logged', () => {
    const k = sleepKeyboard('2026-10-13', d(8, 2)).inline_keyboard;
    expect(k[0].map((b) => b.text)).toEqual(['5h', '6h', '7h', '[8]h', '9h']);
    expect(k[1].map((b) => b.text)).toEqual(['1', '[2]', '3', '4', '5']);
    expect(sleepCardText('2026-10-13', d(8, undefined))).toContain('Logged: hours 8, energy -.');
  });
  it('red control: before any tap the card claims nothing is logged', () => {
    expect(sleepCardText('2026-10-13')).not.toContain('Logged');
  });
});

describe('lines', () => {
  it('a day line, with a dash for the value not tapped yet', () => {
    expect(dayLine('2026-10-13', d(7, 3))).toBe('2026-10-13 hours=7 energy=3');
    expect(dayLine('2026-10-14', d(8, undefined))).toBe('2026-10-14 hours=8 energy=-');
  });
  it('the week line: averages, nights at the 7-hour target or more, days logged', () => {
    // hours 7,8,6,8,9,7,8 = 53/7 = 7.57; energy 3,4,2,4,5,3,4 = 25/7 = 3.57; six nights at 7+
    expect(weekLine(WEEK, '2026-10-18')).toBe('2026-10-18 week avg_hours=7.6 avg_energy=3.6 nights_7plus=6 days=7');
  });
  it('the target is 7 by default and the line names the target it counted against', () => {
    expect(targetHours({})).toBe(7);
    expect(targetHours({ ZOE_SLEEP_TARGET_HOURS: '8' })).toBe(8);
    expect(targetHours({ ZOE_SLEEP_TARGET_HOURS: '12' })).toBe(7);
    expect(weekLine(WEEK, '2026-10-18', 8)).toContain('nights_8plus=4');
  });
  it('averages use only the days that have the value', () => {
    const days: SleepDays = { '2026-10-12': d(6, undefined), '2026-10-13': d(8, 4) };
    expect(weekLine(days, '2026-10-18')).toBe('2026-10-18 week avg_hours=7.0 avg_energy=4.0 nights_7plus=1 days=2');
  });
  it('a week with no entries has no week line', () => {
    expect(weekLine({}, '2026-10-18')).toBeNull();
  });
});

describe('renderMonth', () => {
  it('day lines in date order, the week line after Sunday', () => {
    const lines = renderMonth(WEEK, '2026-10', '2026-10-18').trim().split('\n').slice(4);
    expect(lines).toHaveLength(8);
    expect(lines[0]).toBe('2026-10-12 hours=7 energy=3');
    expect(lines[6]).toBe('2026-10-18 hours=8 energy=4');
    expect(lines[7]).toMatch(/^2026-10-18 week /);
  });
  it('no week line while Sunday is today and only half tapped', () => {
    const days = { ...WEEK, '2026-10-18': d(8, undefined) };
    expect(renderMonth(days, '2026-10', '2026-10-18')).not.toMatch(WEEK_LINE);
  });
  it('the week line appears once Sunday has passed, even if Sunday was never tapped', () => {
    const { '2026-10-18': _drop, ...sixDays } = WEEK;
    const out = renderMonth(sixDays, '2026-10', '2026-10-19');
    expect(out).toContain('2026-10-18 week ');
    expect(out).toContain('days=6');
  });
  it('a week that ends in the next month puts its line in that month', () => {
    // Mon 2026-10-26 ... Sun 2026-11-01.
    const days: SleepDays = { '2026-10-30': d(8, 4) };
    expect(renderMonth(days, '2026-10', '2026-11-02')).not.toMatch(WEEK_LINE);
    expect(renderMonth(days, '2026-11', '2026-11-02')).toContain('2026-11-01 week avg_hours=8.0');
  });
  it('only that month\'s days', () => {
    const days: SleepDays = { '2026-09-30': d(7, 3), '2026-10-01': d(8, 4) };
    const out = renderMonth(days, '2026-10', '2026-10-02');
    expect(out).toContain('2026-10-01 hours=8');
    expect(out).not.toContain('2026-09-30');
  });
});

describe('recordSleepTap', () => {
  const NOW = at('2026-10-13T10:05:00Z'); // 06:05 Eastern, Tue 13 Oct
  const month = () => fs.readFile(sleepMonthPath('2026-10'), 'utf8');

  it('two taps make ONE line for the day', async () => {
    await recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW);
    expect(await month()).toContain('2026-10-13 hours=7 energy=-');
    await recordSleepTap({ field: 'energy', value: 3, date: '2026-10-13' }, NOW);
    const lines = (await month()).split('\n').filter((l) => l.startsWith('2026-10-13'));
    expect(lines).toEqual(['2026-10-13 hours=7 energy=3']);
  });

  it('a second tap on the same row edits the line, never adds one', async () => {
    await recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW);
    await recordSleepTap({ field: 'energy', value: 3, date: '2026-10-13' }, NOW);
    await recordSleepTap({ field: 'hours', value: 8, date: '2026-10-13' }, NOW);
    const lines = (await month()).split('\n').filter((l) => l.startsWith('2026-10-13'));
    expect(lines).toEqual(['2026-10-13 hours=8 energy=3']);
    expect(Object.keys(await readSleepDays())).toEqual(['2026-10-13']);
  });

  it('an hours tap and an energy tap at the same instant both land', async () => {
    await Promise.all([
      recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW),
      recordSleepTap({ field: 'energy', value: 3, date: '2026-10-13' }, NOW),
      recordSleepTap({ field: 'hours', value: 8, date: '2026-10-14' }, NOW),
    ]);
    const m = await month();
    expect(m).toContain('2026-10-13 hours=7 energy=3');
    expect(m).toContain('2026-10-14 hours=8 energy=-');
  });

  it('a failed tap does not jam the queue for the next one', async () => {
    await fs.mkdir(sleepStatePath());
    await expect(recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW)).rejects.toThrow();
    await fs.rmdir(sleepStatePath());
    await expect(recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW)).resolves.toMatchObject({ hours: 7 });
  });

  it('a tap on yesterday\'s card edits yesterday, not today', async () => {
    await recordSleepTap({ field: 'hours', value: 6, date: '2026-10-12' }, NOW);
    expect(await month()).toContain('2026-10-12 hours=6 energy=-');
    expect(await month()).not.toContain('2026-10-13');
  });

  it('both files are private (mode 600): this is health data', async () => {
    await recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW);
    expect((await fs.stat(sleepStatePath())).mode & 0o777).toBe(0o600);
    expect((await fs.stat(sleepMonthPath('2026-10'))).mode & 0o777).toBe(0o600);
  });

  it('Monday\'s tap reveals last week\'s line, in the month its Sunday falls in', async () => {
    await recordSleepTap({ field: 'hours', value: 8, date: '2026-10-30' }, at('2026-10-30T10:00:00Z'));
    await expect(fs.readFile(sleepMonthPath('2026-11'), 'utf8')).resolves.not.toMatch(WEEK_LINE);
    await recordSleepTap({ field: 'hours', value: 7, date: '2026-11-02' }, at('2026-11-02T11:00:00Z'));
    expect(await fs.readFile(sleepMonthPath('2026-11'), 'utf8')).toContain('2026-11-01 week avg_hours=8.0');
  });

  it('a state file that cannot be READ (not merely absent) stops the tap', async () => {
    // A directory where the file should be: readFile fails with EISDIR, not ENOENT.
    await fs.mkdir(sleepStatePath());
    await expect(readSleepDays()).rejects.toThrow();
    await expect(recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW)).rejects.toThrow();
  });

  it('a state file that cannot be parsed stops the tap; it is never overwritten as empty', async () => {
    await fs.writeFile(sleepStatePath(), '{"days": {"2026-10-01": {"hours": 8', 'utf8');
    await expect(recordSleepTap({ field: 'hours', value: 7, date: '2026-10-13' }, NOW)).rejects.toThrow();
    expect(await fs.readFile(sleepStatePath(), 'utf8')).toContain('2026-10-01');
  });
});

describe('sendSleepCheckin', () => {
  const NOW = at('2026-10-13T10:00:00Z');
  const sender = (result: unknown = { message_id: 5 }) => {
    const sent: Array<{ text: string; rows: string[][] }> = [];
    return {
      sent,
      send: async (text: string, k: { inline_keyboard: Array<Array<{ text: string }>> }) => {
        sent.push({ text, rows: k.inline_keyboard.map((r) => r.map((b) => b.text)) });
        return result;
      },
    };
  };

  it('red control: flag off, nothing is sent and no file is created', async () => {
    const s = sender();
    expect(await sendSleepCheckin({ send: s.send, now: NOW })).toBe('off');
    expect(s.sent).toEqual([]);
    expect(await fs.readdir(home)).toEqual([]);
  });

  it('flag on: one card for the Eastern date, two rows', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    const s = sender();
    expect(await sendSleepCheckin({ send: s.send, now: NOW })).toBe('sent');
    expect(s.sent).toHaveLength(1);
    expect(s.sent[0].text).toContain('Sleep check-in - 2026-10-13');
    expect(s.sent[0].rows).toHaveLength(2);
  });

  it('the Eastern date, not the UTC one: 02:00 UTC is still the day before', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    const s = sender();
    await sendSleepCheckin({ send: s.send, now: at('2026-10-14T02:00:00Z') });
    expect(s.sent[0].text).toContain('2026-10-13');
  });

  it('a card sent after a tap shows what is already logged', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    await recordSleepTap({ field: 'hours', value: 8, date: '2026-10-13' }, NOW);
    const s = sender();
    await sendSleepCheckin({ send: s.send, now: NOW });
    expect(s.sent[0].rows[0]).toContain('[8]h');
  });

  it('a budget-blocked send is reported as blocked, not sent', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    const s = sender({ message_id: 0, zoeSendBudget: 'dropped' });
    expect(await sendSleepCheckin({ send: s.send, now: NOW })).toBe('blocked');
  });
});

describe('the send-time table (Eastern)', () => {
  it('defaults: 04:45 on the 5:20 days, 07:00 on the others', () => {
    expect(DEFAULT_SCHEDULE).toEqual({ sun: 420, mon: 285, tue: 285, wed: 420, thu: 285, fri: 285, sat: 420 });
    expect(sleepSchedule({})).toEqual(DEFAULT_SCHEDULE);
  });
  it('an override changes only the days it names; off skips a day', () => {
    const t = sleepSchedule({ ZOE_SLEEP_CHECKIN_TIMES: 'mon=07:30, WED = off' });
    expect(t.mon).toBe(450);
    expect(t.wed).toBeNull();
    expect(t.tue).toBe(285);
  });
  it('a part that does not parse keeps that day at its default, never cancels it', () => {
    expect(sleepSchedule({ ZOE_SLEEP_CHECKIN_TIMES: 'mon=25:00,tue=soon,xyz=04:00,thu' })).toEqual(DEFAULT_SCHEDULE);
  });
  it('reads the Eastern clock, across the end of daylight time on 1 Nov 2026', () => {
    // Fri 30 Oct, EDT (UTC-4): 08:45 UTC is 04:45.
    expect(easternClock(at('2026-10-30T08:45:00Z'))).toEqual({ day: 'fri', minute: 285 });
    // Mon 2 Nov, EST (UTC-5): 04:45 is now 09:45 UTC.
    expect(easternClock(at('2026-11-02T09:45:00Z'))).toEqual({ day: 'mon', minute: 285 });
    expect(easternClock(at('2026-11-02T08:45:00Z'))).toEqual({ day: 'mon', minute: 225 });
  });
});

describe('checkinDue', () => {
  const T = DEFAULT_SCHEDULE;
  it('not before the time, due from it', () => {
    expect(checkinDue(at('2026-10-13T08:44:00Z'), T, null)).toBe(false); // Tue 04:44
    expect(checkinDue(at('2026-10-13T08:45:00Z'), T, null)).toBe(true); // Tue 04:45
    expect(checkinDue(at('2026-10-13T08:50:00Z'), T, null)).toBe(true);
  });
  it('once a day', () => {
    expect(checkinDue(at('2026-10-13T08:50:00Z'), T, '2026-10-13')).toBe(false);
    expect(checkinDue(at('2026-10-13T08:50:00Z'), T, '2026-10-12')).toBe(true);
  });
  it('a later day sends later', () => {
    expect(checkinDue(at('2026-10-14T09:00:00Z'), T, null)).toBe(false); // Wed 05:00
    expect(checkinDue(at('2026-10-14T11:00:00Z'), T, null)).toBe(true); // Wed 07:00
  });
  it('not after noon Eastern: a morning card at 3 pm is noise', () => {
    expect(checkinDue(at('2026-10-13T16:00:00Z'), T, null)).toBe(true); // Tue 12:00
    expect(checkinDue(at('2026-10-13T16:05:00Z'), T, null)).toBe(false); // Tue 12:05
  });
  it('a day configured after noon gets one hour from its own time, no more', () => {
    const late = { ...T, tue: 780 }; // 13:00
    expect(checkinDue(at('2026-10-13T16:59:00Z'), late, null)).toBe(false); // 12:59
    expect(checkinDue(at('2026-10-13T17:00:00Z'), late, null)).toBe(true); // 13:00
    expect(checkinDue(at('2026-10-13T18:00:00Z'), late, null)).toBe(true); // 14:00
    expect(checkinDue(at('2026-10-13T18:05:00Z'), late, null)).toBe(false); // 14:05
  });
  it('a day set to off never sends', () => {
    expect(checkinDue(at('2026-10-13T08:50:00Z'), { ...T, tue: null }, null)).toBe(false);
  });
  it('the same wall-clock time is due before and after the clocks change', () => {
    expect(checkinDue(at('2026-10-30T08:45:00Z'), T, null)).toBe(true); // Fri 04:45 EDT
    expect(checkinDue(at('2026-11-02T08:45:00Z'), T, null)).toBe(false); // Mon 03:45 EST
    expect(checkinDue(at('2026-11-02T09:45:00Z'), T, null)).toBe(true); // Mon 04:45 EST
  });
});

describe('runSleepCheckinTick', () => {
  const card = () => {
    const sent: string[] = [];
    return { sent, send: async (text: string) => (sent.push(text), { message_id: 1 }) };
  };
  it('red control: flag off, no send and no file', async () => {
    const c = card();
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T08:50:00Z') })).toBe('off');
    expect(c.sent).toEqual([]);
    expect(await fs.readdir(home)).toEqual([]);
  });
  it('sends once at the first due tick, then stays quiet all day', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    const c = card();
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T08:40:00Z') })).toBe('not-due');
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T08:45:00Z') })).toBe('sent');
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T08:50:00Z') })).toBe('not-due');
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T15:00:00Z') })).toBe('not-due');
    expect(c.sent).toHaveLength(1);
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-14T11:00:00Z') })).toBe('sent');
  });
  it('a blocked card is retried on the next tick, not marked sent', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    let n = 0;
    const send = async () => (++n === 1 ? { message_id: 0, zoeSendBudget: 'dropped' } : { message_id: 2 });
    expect(await runSleepCheckinTick({ send, now: at('2026-10-13T08:45:00Z') })).toBe('blocked');
    expect(await runSleepCheckinTick({ send, now: at('2026-10-13T08:50:00Z') })).toBe('sent');
  });
  it('two ticks at the same moment send ONE card', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    const c = card();
    const now = at('2026-10-13T08:45:00Z');
    const r = await Promise.all([runSleepCheckinTick({ send: c.send, now }), runSleepCheckinTick({ send: c.send, now })]);
    expect(r.sort()).toEqual(['not-due', 'sent']);
    expect(c.sent).toHaveLength(1);
  });
  it("Monday's card closes a week whose Sunday was never tapped", async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    await recordSleepTap({ field: 'hours', value: 7, date: '2026-10-17' }, at('2026-10-17T11:00:00Z')); // Sat
    expect(await fs.readFile(sleepMonthPath('2026-10'), 'utf8')).not.toMatch(WEEK_LINE);
    const c = card();
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-19T08:45:00Z') })).toBe('sent'); // Mon
    expect(await fs.readFile(sleepMonthPath('2026-10'), 'utf8')).toContain('2026-10-18 week avg_hours=7.0');
  });
  it('the override table is honoured', async () => {
    vi.stubEnv('ZOE_SLEEP_CHECKIN', '1');
    vi.stubEnv('ZOE_SLEEP_CHECKIN_TIMES', 'tue=off');
    const c = card();
    expect(await runSleepCheckinTick({ send: c.send, now: at('2026-10-13T08:50:00Z') })).toBe('not-due');
  });
});

describe('routing: the tap handler sits above the generic callback router', () => {
  it('SLEEP_CALLBACK is registered before the first callback_query:data handler', () => {
    const src = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'index.ts'), 'utf8');
    const mine = src.indexOf('bot.callbackQuery(SLEEP_CALLBACK');
    const generic = src.indexOf("bot.on('callback_query:data'");
    expect(mine).toBeGreaterThan(-1);
    expect(generic).toBeGreaterThan(-1);
    expect(mine).toBeLessThan(generic);
  });
  it('no other handler reads the sl: prefix', () => {
    const src = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'index.ts'), 'utf8');
    // A handler-shaped read: startsWith('sl:'), or a regex anchored at ^sl:.
    expect(src.match(/startsWith\(['"`]sl:|\/\^sl:/g) ?? []).toHaveLength(0);
  });
});
