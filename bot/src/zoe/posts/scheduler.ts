// Post slate v1 - randomized scheduler.
// At UTC midnight (and on boot), re-rolls a fresh list of random post times for the
// remainder of today. Each time fires once: picks a category, drafts, DMs Zaal.
//
// v1 defaults:
//   - 7 pings/day target, distributed random across 5am-10pm America/New_York
//   - 20 min minimum gap between pings
//   - category weights: build=3, ecosystem=2, event=1, personal=1 (calibrate after week 1)
//   - empty drafts ("(skip)") are silently dropped, do not count against the day's quota
//
// No quiet hours per Zaal feedback (project memory: feedback_no_flow_state_gate).

import type { Bot } from 'grammy';
import cron from 'node-cron';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';
import { draftPost } from './drafters';
import {
  gatherBuildSignals,
  gatherEcosystemSignals,
  gatherEventSignals,
  gatherPersonalSignals,
} from './sources';
import type { PostCategory, PostSourceSnapshot } from './types';

const PINGS_PER_DAY_DEFAULT = 7;
const MIN_GAP_MINUTES = 20;
const WINDOW_START_HOUR_ET = 5;
const WINDOW_END_HOUR_ET = 22; // 10pm
const CATEGORY_WEIGHTS: Array<[PostCategory, number]> = [
  ['build', 3],
  ['ecosystem', 2],
  ['event', 1],
  ['personal', 1],
];

const POSTS_STATE_DIR = join(ZOE_PATHS.home, 'posts');
const SCHEDULE_FILE = join(POSTS_STATE_DIR, 'schedule.json');
const LOG_FILE = join(POSTS_STATE_DIR, 'log.jsonl');

interface ScheduleEntry {
  fireAt: string; // ISO
  fired: boolean;
}

interface DailySchedule {
  date: string; // YYYY-MM-DD (ET)
  entries: ScheduleEntry[];
}

function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function pickWeightedCategory(): PostCategory {
  const total = CATEGORY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let n = Math.random() * total;
  for (const [cat, w] of CATEGORY_WEIGHTS) {
    n -= w;
    if (n <= 0) return cat;
  }
  return CATEGORY_WEIGHTS[0][0];
}

function rollDailySchedule(date: string, pings: number): DailySchedule {
  // Build a list of candidate slot-minutes (one per minute in the window), shuffle, take N
  // with min-gap enforcement.
  const slotsPerDay = (WINDOW_END_HOUR_ET - WINDOW_START_HOUR_ET) * 60;
  const indices = Array.from({ length: slotsPerDay }, (_, i) => i);
  // Fisher-Yates
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const picked: number[] = [];
  for (const idx of indices) {
    if (picked.length === pings) break;
    if (picked.every((p) => Math.abs(p - idx) >= MIN_GAP_MINUTES)) {
      picked.push(idx);
    }
  }
  picked.sort((a, b) => a - b);

  const entries: ScheduleEntry[] = picked.map((minuteOffset) => {
    const hour = WINDOW_START_HOUR_ET + Math.floor(minuteOffset / 60);
    const minute = minuteOffset % 60;
    // Build an ISO timestamp at hour:minute ET for `date`.
    const local = new Date(`${date}T00:00:00-04:00`); // EDT default; cron tz handles DST elsewhere
    local.setHours(hour, minute, 0, 0);
    return { fireAt: local.toISOString(), fired: false };
  });

  return { date, entries };
}

async function loadOrRollSchedule(pings: number): Promise<DailySchedule> {
  const today = todayET();
  try {
    const raw = await fs.readFile(SCHEDULE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DailySchedule;
    if (parsed.date === today) return parsed;
  } catch {
    // missing file - normal first run
  }
  const fresh = rollDailySchedule(today, pings);
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  await fs.writeFile(SCHEDULE_FILE, JSON.stringify(fresh, null, 2), 'utf8');
  return fresh;
}

async function saveSchedule(schedule: DailySchedule): Promise<void> {
  await fs.writeFile(SCHEDULE_FILE, JSON.stringify(schedule, null, 2), 'utf8');
}

async function appendLog(line: Record<string, unknown>): Promise<void> {
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${JSON.stringify({ ts: new Date().toISOString(), ...line })}\n`, 'utf8');
}

async function gatherAll(repoDir: string): Promise<PostSourceSnapshot> {
  const [build, ecosystem, event, personal] = await Promise.all([
    gatherBuildSignals(repoDir),
    gatherEcosystemSignals(repoDir),
    gatherEventSignals(),
    gatherPersonalSignals(),
  ]);
  return { build, ecosystem, event, personal };
}

async function fireOneDraft(bot: Bot, zaalTgId: number, repoDir: string): Promise<void> {
  const category = pickWeightedCategory();
  const snapshot = await gatherAll(repoDir);
  let draft;
  try {
    draft = await draftPost(category, snapshot, { cwd: repoDir });
  } catch (err) {
    await appendLog({ event: 'draft-error', category, error: (err as Error).message });
    return;
  }
  if (!draft.text || /^\(skip\)/i.test(draft.text)) {
    await appendLog({ event: 'skip', category, reason: 'empty-or-skip-marker' });
    return;
  }
  const message = `Post draft (${category}):\n\n${draft.text}\n\n— copy + paste into Firefly when ready`;
  try {
    await bot.api.sendMessage(zaalTgId, message);
    await appendLog({ event: 'sent', category, charCount: draft.text.length });
  } catch (err) {
    await appendLog({ event: 'send-error', category, error: (err as Error).message });
  }
}

export interface PostsSchedulerOptions {
  bot: Bot;
  zaalTgId: number;
  repoDir: string;
  pingsPerDay?: number;
}

export function startPostsScheduler(opts: PostsSchedulerOptions): { stop: () => void } {
  const pings = opts.pingsPerDay ?? PINGS_PER_DAY_DEFAULT;

  // Re-roll the schedule at midnight America/New_York.
  const midnightTask = cron.schedule(
    '0 0 * * *',
    async () => {
      const today = todayET();
      const fresh = rollDailySchedule(today, pings);
      await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
      await saveSchedule(fresh);
      await appendLog({ event: 'rolled-schedule', date: today, entries: fresh.entries.length });
      console.log(`[zoe/posts] rolled schedule for ${today}: ${fresh.entries.length} pings`);
    },
    { timezone: 'America/New_York' },
  );

  // Tick every minute, fire any due entries.
  const tickTask = cron.schedule(
    '* * * * *',
    async () => {
      const schedule = await loadOrRollSchedule(pings);
      const now = Date.now();
      let changed = false;
      for (const entry of schedule.entries) {
        if (entry.fired) continue;
        if (new Date(entry.fireAt).getTime() <= now) {
          entry.fired = true;
          changed = true;
          fireOneDraft(opts.bot, opts.zaalTgId, opts.repoDir).catch((err) => {
            console.error('[zoe/posts] fire failed:', (err as Error).message);
          });
        }
      }
      if (changed) await saveSchedule(schedule);
    },
    { timezone: 'America/New_York' },
  );

  console.log(`[zoe/posts] scheduler started (target ${pings} pings/day, window ${WINDOW_START_HOUR_ET}am-${WINDOW_END_HOUR_ET - 12}pm ET)`);

  return {
    stop: () => {
      midnightTask.stop();
      tickTask.stop();
    },
  };
}
