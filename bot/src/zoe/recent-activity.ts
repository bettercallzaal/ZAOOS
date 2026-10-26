/**
 * recent-activity.ts - /status: the most recent things ZOE did, short enough for a phone.
 *
 * Zaal, 2026-10-26: "can we upgrade zoe to have a /status command where it says
 * most recent things with zoe".
 *
 * WHERE THE LINES COME FROM (no new log file, only what ZOE already keeps)
 * -----------------------------------------------------------------------
 *   ran   - the last featureRan() call of each feature since boot (recentRuns).
 *           featureRan PRINTS once per process, but it is called on the success
 *           path of ~96 features, including the scheduled ticks, so the last call
 *           of each feature is the best "what ran, and when" ZOE has. Held in
 *           memory, one entry per feature, so a tick every minute cannot grow it.
 *           Lost on restart, and the header says since when.
 *   sent / held / dropped - send-budget-log.jsonl (written by send-budget.ts),
 *           which survives restarts. A held or dropped send is the closest thing
 *           ZOE has to a delivery error log.
 *   could not - capability-gaps.jsonl, the things she was asked and could not do.
 *
 * Not covered, said here so nobody reads /status as complete: errors thrown
 * inside a feature only reach journald. ZOE has no single error log.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SendLogRow } from './send-budget';
import { gapsPath } from './capability-gaps';
import { recentRuns, type FeatureRun } from './feature-ran';

/** Kill switch. /status is read-only and owner-only, so it is on unless set to 0. */
export function statusCommandEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_STATUS_COMMAND !== '0';
}

const BOOT_AT = new Date();

export interface GapLine {
  ts: string;
  want: string;
}

export interface StatusInput {
  now: Date;
  bootAt: Date;
  ran: FeatureRun[];
  sends: SendLogRow[];
  gaps: GapLine[];
  limit?: number;
}

interface Item {
  at: number;
  tag: string;
  text: string;
}

const TZ = 'America/New_York';

function clip(s: string, n: number): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n - 3)}...` : one;
}

function etDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

/** "14:05" today, "Sun 14:05" on an earlier day. Eastern, 24-hour. */
export function shortTime(d: Date, now: Date): string {
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  if (etDay(d) === etDay(now)) return hm;
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
  return `${wd} ${hm}`;
}

/** Pure: the /status text. Newest first, at most `limit` lines. */
export function renderStatus(input: StatusInput): string {
  const { now, bootAt, ran, sends, gaps } = input;
  const limit = input.limit ?? 10;
  const items: Item[] = [];

  for (const r of ran) {
    const times = r.count > 1 ? ` (x${r.count})` : '';
    items.push({ at: r.at.getTime(), tag: 'ran', text: `${r.feature}${r.detail ? `: ${r.detail}` : ''}${times}` });
  }
  for (const s of sends) {
    const at = Date.parse(s.at);
    if (!Number.isFinite(at)) continue;
    const tag = s.outcome === 'sent' ? 'sent' : s.outcome === 'deferred' ? 'held' : 'DROPPED';
    items.push({ at, tag, text: s.preview || s.cls });
  }
  for (const g of gaps) {
    const at = Date.parse(g.ts);
    if (!Number.isFinite(at)) continue;
    items.push({ at, tag: 'could not', text: g.want });
  }

  items.sort((a, b) => b.at - a.at);
  const top = items.slice(0, limit);

  const today = etDay(now);
  const todaySends = sends.filter((s) => Number.isFinite(Date.parse(s.at)) && etDay(new Date(s.at)) === today);
  const sent = todaySends.filter((s) => s.outcome === 'sent').length;
  const held = todaySends.filter((s) => s.outcome === 'deferred').length;
  const dropped = todaySends.filter((s) => s.outcome === 'dropped').length;

  const lines = [`ZOE status, up since ${shortTime(bootAt, now)} ET`];
  lines.push(`Today: ${sent} sent, ${held} held, ${dropped} dropped`);
  lines.push('');
  if (top.length === 0) {
    lines.push('Nothing recorded yet since the last start.');
  } else {
    for (const it of top) lines.push(`${shortTime(new Date(it.at), now)} ${it.tag} - ${clip(it.text, 70)}`);
  }
  return lines.join('\n');
}

export function statusKeyboard(): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  return { inline_keyboard: [[{ text: 'Refresh', callback_data: 'zst:refresh' }]] };
}

/** Last `n` rows of a JSONL file. A missing or unreadable file is an empty list. */
async function tailJsonl<T>(path: string, n: number): Promise<T[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    const out: T[] = [];
    for (const l of raw.split('\n').filter((x) => x.trim()).slice(-n)) {
      try {
        out.push(JSON.parse(l) as T);
      } catch {
        // one bad line does not hide the rest
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Same path send-budget.ts writes. Read here with a per-line parse, so one bad row cannot hide the rest. */
function sendLogPath(): string {
  return join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'send-budget-log.jsonl');
}

/** Gather from disk and memory, then render. */
export async function buildStatus(now: Date = new Date()): Promise<string> {
  const [sends, gaps] = await Promise.all([
    tailJsonl<SendLogRow>(sendLogPath(), 200),
    tailJsonl<GapLine>(gapsPath(), 50),
  ]);
  return renderStatus({ now, bootAt: BOOT_AT, ran: recentRuns(), sends, gaps });
}
