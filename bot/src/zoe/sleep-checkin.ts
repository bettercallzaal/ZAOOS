/**
 * sleep-checkin.ts - the morning sleep and energy check-in.
 *
 * Zaal, 2026-10-10 (seat grill item 88, board card 406): "one of the things
 * that can be biggest for me is sleep so next week that sth ehighes
 * tpriporiotiy over everyhtign 8 hours of sleep or as close ti it and
 * moinitoring enegy levels thorugh the week each day".
 *
 * One DM each morning with two button rows: hours slept (5 to 9) and energy
 * (1 to 5). One tap each, no typing. A second tap on either row changes that
 * day's value; it never adds a second entry.
 *
 * WHERE IT IS LOGGED, AND WHY NOT STRAIGHT INTO THE VAULT. The ruling says
 * "logged to the vault". ZOE runs on the VPS, whose vault checkout is a
 * READ-ONLY copy by rule (zaal-dotfiles vps/zao-vault-sync.sh: "NEVER reset,
 * stash, checkout or clean", fast-forward only) and was 2,834 commits behind
 * with a modified file on 2026-10-10. Nothing on the VPS can commit to the
 * vault, and a write into that tree would be the dirt the sync refuses on.
 * So, like terminal-answers.jsonl, the record waits where a Mac lane can read
 * it:
 *
 *   ~/.zao/zoe/sleep-log.json            the days, the source of truth
 *   ~/.zao/zoe/sleep-log-YYYY-MM.md      the exact lines for the vault file
 *                                        notes/sleep-log-YYYY-MM.md, rewritten
 *                                        whole on every tap
 *
 * Both are mode 600: this is health data. The markdown is regenerated from the
 * days each time, so it is idempotent by construction and the copy into the
 * vault is a plain file copy, owned by the habits lane.
 *
 * LINES
 *   2026-10-13 hours=7 energy=3
 *   2026-10-14 hours=8 energy=-          energy not tapped yet
 *   2026-10-18 week avg_hours=7.3 avg_energy=3.2 nights_7plus=4 days=7
 * The week line sits after its Sunday (weeks run Monday to Sunday) once that
 * Sunday has passed or has both values. Averages use the days that have the
 * value; `days` is how many days of the week have any entry. The target is 7
 * hours (Zaal, item 92: "Let's aim for 7"), ZOE_SLEEP_TARGET_HOURS to change.
 *
 * WHEN IT SENDS (items 91 and 93). He leaves the house at 5:20 on Monday,
 * Tuesday, Thursday and Friday, so the card goes at 04:45 Eastern on those
 * days and at 07:00 on the others. The times are a per-weekday table in
 * EASTERN time, ZOE_SLEEP_CHECKIN_TIMES, e.g. "mon=04:45,wed=07:00"; a day left
 * out keeps its default and "off" skips that day. A table in his own clock
 * needs no change when daylight time ends; a UTC cron would. A one-off, like
 * the Monday he has off, is set by editing that variable for the week.
 * The scheduler ticks every five minutes; the card goes once per day, at the
 * first tick at or after the day's time, and not at all after noon Eastern
 * (a "morning" card that arrives at 3 pm because the bot was down is noise).
 * A day whose time is set later than 11:00 gets one hour from that time.
 *
 * Off unless ZOE_SLEEP_CHECKIN=1.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { easternDay, wasSendBlocked } from './send-budget';

export function sleepCheckinEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_SLEEP_CHECKIN === '1';
}

export const HOURS = [5, 6, 7, 8, 9] as const;
export const ENERGY = [1, 2, 3, 4, 5] as const;
export const DEFAULT_TARGET_HOURS = 7;
export function targetHours(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.ZOE_SLEEP_TARGET_HOURS);
  return Number.isInteger(n) && n >= 5 && n <= 9 ? n : DEFAULT_TARGET_HOURS;
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayName = (typeof DAYS)[number];
/** Minutes after midnight Eastern, or null for a day with no card. */
export type SleepSchedule = Record<DayName, number | null>;

const EARLY = 4 * 60 + 45; // 04:45, before a 5:20 leave
const LATE = 7 * 60;
export const DEFAULT_SCHEDULE: SleepSchedule = { sun: LATE, mon: EARLY, tue: EARLY, wed: LATE, thu: EARLY, fri: EARLY, sat: LATE };
/** No card is sent after this, Eastern, or after one hour past the day's own
 *  time when that is later (a day configured for 13:00 sends until 14:00). */
export const LAST_SEND_MINUTE = 12 * 60;
export const MIN_WINDOW_MINUTES = 60;

/** Pure. The table from ZOE_SLEEP_CHECKIN_TIMES over the defaults. A part that
 *  does not parse is ignored and that day keeps its default: a typo must not
 *  silently cancel a day. */
export function sleepSchedule(env: NodeJS.ProcessEnv = process.env): SleepSchedule {
  const out: SleepSchedule = { ...DEFAULT_SCHEDULE };
  for (const part of (env.ZOE_SLEEP_CHECKIN_TIMES ?? '').split(',')) {
    const m = /^\s*(sun|mon|tue|wed|thu|fri|sat)\s*=\s*(off|(\d{1,2}):(\d{2}))\s*$/i.exec(part);
    if (!m) continue;
    const day = m[1].toLowerCase() as DayName;
    if (m[2].toLowerCase() === 'off') {
      out[day] = null;
      continue;
    }
    const h = Number(m[3]);
    const min = Number(m[4]);
    if (h > 23 || min > 59) continue;
    out[day] = h * 60 + min;
  }
  return out;
}

/** The Eastern weekday and minutes after midnight for an instant. */
export function easternClock(now: Date): { day: DayName; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: get('weekday').toLowerCase().slice(0, 3) as DayName, minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Pure. Is a card due now, given the day it was last sent for? */
export function checkinDue(now: Date, schedule: SleepSchedule, lastSentDate: string | null): boolean {
  if (lastSentDate === easternDay(now)) return false;
  const { day, minute } = easternClock(now);
  const at = schedule[day];
  if (at === null) return false;
  return minute >= at && minute <= Math.max(LAST_SEND_MINUTE, at + MIN_WINDOW_MINUTES);
}

export interface SleepDay {
  hours?: number;
  energy?: number;
  updatedAt: string;
}
export type SleepDays = Record<string, SleepDay>;

const zoeHome = (): string => process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
export const sleepStatePath = (): string => join(zoeHome(), 'sleep-log.json');
export const sleepMonthPath = (month: string): string => join(zoeHome(), `sleep-log-${month}.md`);

/** callback_data: "sl:h:7:2026-10-13" or "sl:e:3:2026-10-13". The date rides in
 *  the button, so a tap on Monday's card on Tuesday still edits Monday. */
export const SLEEP_CALLBACK = /^sl:(h|e):(\d):(\d{4}-\d{2}-\d{2})$/;

export interface SleepTap {
  field: 'hours' | 'energy';
  value: number;
  date: string;
}

/** Pure. null for anything that is not a valid tap, including an out-of-range value. */
export function parseSleepCallback(data: string): SleepTap | null {
  const m = SLEEP_CALLBACK.exec(data);
  if (!m) return null;
  const value = Number(m[2]);
  const field = m[1] === 'h' ? 'hours' : 'energy';
  const allowed: readonly number[] = field === 'hours' ? HOURS : ENERGY;
  if (!allowed.includes(value)) return null;
  // A real calendar date, not just the shape: 2026-13-45 matches the regex.
  const d = new Date(`${m[3]}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== m[3]) return null;
  return { field, value, date: m[3] };
}

type Button = { text: string; callback_data: string };

/** Pure. Two rows; the chosen value on each row is marked so a re-tap is visible. */
export function sleepKeyboard(date: string, day?: SleepDay): { inline_keyboard: Button[][] } {
  const mark = (n: number, chosen: number | undefined) => (n === chosen ? `[${n}]` : String(n));
  return {
    inline_keyboard: [
      HOURS.map((n) => ({ text: `${mark(n, day?.hours)}h`, callback_data: `sl:h:${n}:${date}` })),
      ENERGY.map((n) => ({ text: mark(n, day?.energy), callback_data: `sl:e:${n}:${date}` })),
    ],
  };
}

/** Pure. The card text, before and after taps. */
export function sleepCardText(date: string, day?: SleepDay): string {
  const lines = [
    `Sleep check-in - ${date}`,
    'Top row: hours slept last night. Bottom row: energy now, 1 low to 5 high.',
  ];
  if (day?.hours !== undefined || day?.energy !== undefined) {
    lines.push(`Logged: hours ${day.hours ?? '-'}, energy ${day.energy ?? '-'}. Tap again to change.`);
  }
  return lines.join('\n');
}

/** Pure. One day's vault line. */
export function dayLine(date: string, d: SleepDay): string {
  return `${date} hours=${d.hours ?? '-'} energy=${d.energy ?? '-'}`;
}

const addDays = (date: string, n: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** 0 = Sunday ... 6 = Saturday, for a YYYY-MM-DD date. */
const weekday = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

/** Pure. The week line for the Monday-to-Sunday week ending on `sunday`, or null with no entries. */
export function weekLine(days: SleepDays, sunday: string, target: number = targetHours()): string | null {
  const week = Array.from({ length: 7 }, (_, i) => days[addDays(sunday, i - 6)]).filter(
    (d): d is SleepDay => d !== undefined && (d.hours !== undefined || d.energy !== undefined),
  );
  if (!week.length) return null;
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-');
  const hours = week.flatMap((d) => (d.hours !== undefined ? [d.hours] : []));
  const energy = week.flatMap((d) => (d.energy !== undefined ? [d.energy] : []));
  return `${sunday} week avg_hours=${avg(hours)} avg_energy=${avg(energy)} nights_${target}plus=${hours.filter((h) => h >= target).length} days=${week.length}`;
}

/**
 * Pure. The whole file for one month (YYYY-MM): a day line per logged day in
 * date order, and a week line after each Sunday that is finished. A Sunday is
 * finished once `today` is past it, or once it holds both values.
 */
export function renderMonth(days: SleepDays, month: string, today: string): string {
  const out = [`# Sleep log ${month}`, '', `Target: ${targetHours()} hours a night. Written by ZOE; one line per day, a week line after each Sunday.`, ''];
  const dates = new Set(Object.keys(days).filter((d) => d.startsWith(`${month}-`)));
  // A week that ends on a Sunday in this month gets its line here even if the
  // Sunday itself has no entry.
  for (const d of Object.keys(days)) {
    const sunday = addDays(d, (7 - weekday(d)) % 7);
    if (sunday.startsWith(`${month}-`)) dates.add(sunday);
  }
  for (const date of [...dates].sort()) {
    const d = days[date];
    if (d && (d.hours !== undefined || d.energy !== undefined)) out.push(dayLine(date, d));
    if (weekday(date) === 0) {
      const done = today > date || (d?.hours !== undefined && d?.energy !== undefined);
      const w = done ? weekLine(days, date) : null;
      if (w) out.push(w);
    }
  }
  return `${out.join('\n')}\n`;
}

export async function readSleepDays(): Promise<SleepDays> {
  let raw: string;
  try {
    raw = await fs.readFile(sleepStatePath(), 'utf8');
  } catch (e) {
    // Only "not there yet" is an empty log. Anything else must not be read as
    // empty, or the next tap would write a one-day file over a month of data.
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return {};
    throw e;
  }
  const parsed = JSON.parse(raw) as { days?: SleepDays };
  return parsed.days ?? {};
}

/**
 * One writer at a time. Two taps a moment apart each read the days, change one
 * value and write the whole file; unserialised, the second write puts back the
 * first one's old value and a tap is lost. The queue also keeps two scheduler
 * ticks from both deciding the card is due. In-process is enough: one ZOE
 * process polls the bot token (one instance per resource).
 */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function writePrivate(path: string, body: string): Promise<void> {
  await fs.mkdir(zoeHome(), { recursive: true });
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, body, { mode: 0o600 });
  await fs.rename(tmp, path); // a crash mid-write leaves the old file, not half of a new one
}

/**
 * Record one tap. Edits that day's entry (never a second one), then rewrites
 * every month file from the days.
 */
export function recordSleepTap(tap: SleepTap, now: Date = new Date()): Promise<SleepDay> {
  return serial(async () => {
    const days = await readSleepDays();
    const day: SleepDay = { ...days[tap.date], [tap.field]: tap.value, updatedAt: now.toISOString() };
    days[tap.date] = day;
    await writePrivate(sleepStatePath(), `${JSON.stringify({ days }, null, 2)}\n`);
    await writeMonths(days, easternDay(now));
    return day;
  });
}

/** Rewrite every month file from the days. */
async function writeMonths(days: SleepDays, today: string): Promise<void> {
  // Every month that holds a day or a week line, not only the tapped one: a week
  // line appears when its Sunday passes, and the tap that reveals it is usually
  // Monday's, which can sit in the next month.
  const months = new Set<string>();
  for (const d of Object.keys(days)) {
    months.add(d.slice(0, 7));
    months.add(addDays(d, (7 - weekday(d)) % 7).slice(0, 7));
  }
  for (const m of months) await writePrivate(sleepMonthPath(m), renderMonth(days, m, today));
}

export type CheckinResult = 'off' | 'sent' | 'blocked' | 'not-due';

const sentStatePath = (): string => join(zoeHome(), 'sleep-checkin-sent.json');

async function lastSent(): Promise<string | null> {
  try {
    return (JSON.parse(await fs.readFile(sentStatePath(), 'utf8')) as { date?: string }).date ?? null;
  } catch {
    return null; // never sent, or unreadable: at worst one extra card, never a lost log
  }
}

/**
 * The scheduler's tick. Sends today's card once, at the first tick at or after
 * the day's time. The day is marked sent only after a send that was not
 * blocked, so a blocked card is retried on the next tick.
 */
export function runSleepCheckinTick(deps: {
  send: (text: string, keyboard: { inline_keyboard: Button[][] }) => Promise<unknown>;
  now?: Date;
}): Promise<CheckinResult> {
  if (!sleepCheckinEnabled()) return Promise.resolve('off');
  return serial(async () => {
    const now = deps.now ?? new Date();
    if (!checkinDue(now, sleepSchedule(), await lastSent())) return 'not-due';
    const r = await sendSleepCheckin({ send: deps.send, now });
    if (r !== 'sent') return r;
    await writePrivate(sentStatePath(), `${JSON.stringify({ date: easternDay(now) })}\n`);
    // A new day has started, so a week line may now be due: Monday's card is
    // what closes a week whose Sunday was never tapped. Best effort; the log
    // itself is untouched, and the next tap rewrites these files anyway.
    await readSleepDays()
      .then((days) => (Object.keys(days).length ? writeMonths(days, easternDay(now)) : undefined))
      .catch((e) => console.error('[zoe/sleep-checkin] could not refresh the month files:', (e as Error)?.message));
    return r;
  });
}

/** Send today's card. Today's values, if already tapped, show on it. */
export async function sendSleepCheckin(deps: {
  send: (text: string, keyboard: { inline_keyboard: Button[][] }) => Promise<unknown>;
  now?: Date;
}): Promise<CheckinResult> {
  if (!sleepCheckinEnabled()) return 'off';
  const today = easternDay(deps.now ?? new Date());
  const day = (await readSleepDays())[today];
  const sent = await deps.send(sleepCardText(today, day), sleepKeyboard(today, day));
  return wasSendBlocked(sent) ? 'blocked' : 'sent';
}
