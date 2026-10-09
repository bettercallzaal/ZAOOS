#!/usr/bin/env node
// scripts/zoe/nightly-dates.mjs - the two dates the ZOE nightly processing run
// must put in its file names, computed in Zaal's time zone, never the host's.
//
// Card 9919, measured 2026-10-08 on gh: every nightly PR (#3668, #3705, #3710,
// #3750, #3774, #3798) was opened between 03:07 and 03:14 UTC, which is 23:07
// to 23:14 Eastern the evening before, and named its captures file after the
// UTC date and its briefing after the UTC date plus one. #3750 (opened
// 2026-10-06T03:08:58Z, 23:08 EDT on Monday 5 October) added
// docs/daily/2026-10-06-captures.md and 2026-10-07-briefing.md: the captures
// file was dated a day that had not started in Maine, and the briefing was two
// days ahead. The run is a cloud scheduled session, so the host clock is UTC
// and the prompt had no date rule. This script is the date rule.
//
// Usage:
//   node scripts/zoe/nightly-dates.mjs            # for now
//   node scripts/zoe/nightly-dates.mjs <ISO-8601> # for a given instant
// Prints one JSON object: {"captures":"YYYY-MM-DD","briefing":"YYYY-MM-DD",
// "capturesWeekday":"Monday","briefingWeekday":"Tuesday","tz":"America/New_York"}
//
// Rule: captures carry the Eastern calendar day the run belongs to; briefing,
// newsletter and tasks carry the next Eastern day. A run before 06:00 Eastern
// still belongs to the evening before, so a late or re-run night does not jump
// a day.

const TZ = 'America/New_York';

function easternParts(instant, tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const out = {};
  for (const p of fmt.formatToParts(instant)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour) % 24,
  };
}

function ymd(y, m, d) {
  // Date.UTC normalises day overflow and underflow, so d+1 and d-1 cross month
  // and year boundaries correctly without any calendar code here.
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

function weekdayOf(isoDate) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

export function nightlyDates(instant = new Date(), tz = TZ) {
  const when = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(when.getTime())) throw new Error(`nightly-dates: not an instant: ${instant}`);
  const e = easternParts(when, tz);
  // Before 06:00 local the run belongs to the evening before.
  const dayShift = e.hour < 6 ? -1 : 0;
  const captures = ymd(e.year, e.month, e.day + dayShift);
  const briefing = ymd(e.year, e.month, e.day + dayShift + 1);
  return {
    captures,
    briefing,
    capturesWeekday: weekdayOf(captures),
    briefingWeekday: weekdayOf(briefing),
    tz,
  };
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  const arg = process.argv[2];
  const result = nightlyDates(arg ? new Date(arg) : new Date());
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
