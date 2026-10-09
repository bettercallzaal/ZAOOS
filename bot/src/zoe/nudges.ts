/**
 * Forward nudges - surfaces the real next move from ZOE's task queue.
 *
 * Replaces the old rotating-tips pool. Per doc 648 (Ryan Kagy sync): a
 * generic "keep being productive" cron does not work - it treats the
 * agent and the user like task-runners. A nudge has to name the actual
 * next thing. This reads tasks.json, rotates through the open queue, and
 * sends one concrete next move.
 *
 * Pulled by scheduler.ts. Toggle with "stop nudges" / "start nudges"
 * (also accepts the legacy "stop tips" phrasing for muscle memory).
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS, readTasks } from './memory';

const POINTER_FILE = join(ZOE_PATHS.home, 'nudge-pointer.txt');
const NUDGES_DISABLED_FILE = join(ZOE_PATHS.home, 'nudges-disabled.flag');
const LEGACY_TIPS_DISABLED_FILE = join(ZOE_PATHS.home, 'tips-disabled.flag');

function priorityRank(p: string): number {
  return p === 'high' ? 0 : p === 'med' ? 1 : 2;
}

/**
 * Build the next forward nudge: highest-priority open task first, rotating
 * through the open queue via a pointer so it is not the same task every
 * hour. Returns null when the queue is empty - the caller skips sending,
 * because an empty ping is worse than no ping.
 */
export async function nextNudge(): Promise<string | null> {
  const n = await nextNudgeDetailed();
  return n ? n.text : null;
}

export interface NudgeDetail {
  text: string;
  taskId: string;
  priority: 'high' | 'med' | 'low';
}

/**
 * The nudge plus the task it names, so the caller can attach per-task buttons.
 * `highOnly` (ZOE_ATTENTION): only high-priority tasks may interrupt; med and
 * low wait for Zaal to open his queue. Snoozed tasks are skipped either way
 * (an empty snooze file skips nothing, so flag-off behaviour is unchanged).
 */
export async function nextNudgeDetailed(
  opts: { highOnly?: boolean; now?: number } = {},
): Promise<NudgeDetail | null> {
  const now = opts.now ?? Date.now();
  const snoozed = await readSnoozes();
  const tasks = await readTasks();
  const open = tasks
    .filter((t) => t.status === 'pending' || t.status === 'in_progress')
    .filter((t) => !opts.highOnly || t.priority === 'high')
    .filter((t) => !(snoozed[t.id] && Date.parse(snoozed[t.id]) > now))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  if (open.length === 0) return null;

  let idx = 0;
  try {
    const raw = await fs.readFile(POINTER_FILE, 'utf8');
    idx = (parseInt(raw.trim(), 10) || 0) % open.length;
  } catch {
    idx = 0;
  }
  const task = open[idx];
  const next = (idx + 1) % open.length;
  try {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.writeFile(POINTER_FILE, String(next), 'utf8');
  } catch {
    // pointer write failed; nudge still goes out, just may repeat next hour
  }

  const firstLine = task.description.split('\n')[0].slice(0, 180).trim();
  const text = [
    `Next move - [${task.priority}] ${task.title}`,
    firstLine ? firstLine : '',
    ``,
    `${open.length} open in your queue. Reply with progress, ask me to break this down, or "stop nudges" to pause.`,
  ]
    .filter((line) => line !== '')
    .join('\n');
  return { text, taskId: task.id, priority: task.priority };
}

// ---------------------------------------------------------------------------
// Per-task snooze (pattern from elizaOS plugin-assistant followUp.ts, MIT:
// snooze is recorded state, not a re-send). The nudge:later / nudge:shelve
// buttons carry the task id; the handler in index.ts calls snoozeTask.
// ---------------------------------------------------------------------------

const SNOOZE_FILE = join(ZOE_PATHS.home, 'nudge-snooze.json');
export const SNOOZE_LATER_MS = 4 * 60 * 60 * 1000;
export const SNOOZE_SHELVE_MS = 7 * 24 * 60 * 60 * 1000;

async function readSnoozes(): Promise<Record<string, string>> {
  try {
    const parsed = JSON.parse(await fs.readFile(SNOOZE_FILE, 'utf8')) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Snooze one task's nudges until now + ms. Expired entries are pruned on write. */
export async function snoozeTask(taskId: string, ms: number, now: number = Date.now()): Promise<void> {
  const current = await readSnoozes();
  const kept: Record<string, string> = {};
  for (const [id, until] of Object.entries(current)) {
    if (Date.parse(until) > now) kept[id] = until;
  }
  kept[taskId] = new Date(now + ms).toISOString();
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(SNOOZE_FILE, JSON.stringify(kept, null, 2), 'utf8');
}

/**
 * Buttons for a task nudge. Telegram caps callback_data at 64 bytes; a task id
 * too long to fit gets the id-less buttons, which snooze the whole stream as
 * the handler always did.
 */
export function nudgeKeyboard(taskId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
} {
  const withId = (a: string) => {
    const d = `nudge:${a}:${taskId}`;
    return Buffer.byteLength(d, 'utf8') <= 64 ? d : `nudge:${a}`;
  };
  return {
    inline_keyboard: [
      [
        { text: 'Doing it', callback_data: withId('now') },
        { text: 'Later (4h)', callback_data: withId('later') },
        { text: 'Shelve (7d)', callback_data: withId('shelve') },
      ],
    ],
  };
}

export async function nudgesEnabled(): Promise<boolean> {
  for (const flag of [NUDGES_DISABLED_FILE, LEGACY_TIPS_DISABLED_FILE]) {
    try {
      await fs.access(flag);
      return false;
    } catch {
      // flag absent, keep checking
    }
  }
  return true;
}

export async function disableNudges(): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(NUDGES_DISABLED_FILE, new Date().toISOString(), 'utf8');
}

export async function enableNudges(): Promise<void> {
  for (const flag of [NUDGES_DISABLED_FILE, LEGACY_TIPS_DISABLED_FILE]) {
    try {
      await fs.unlink(flag);
    } catch {
      // already absent
    }
  }
}

// doc 796: the task-queue nudge is now folded into the reasoning-tick gate
// (scheduler.ts) as one candidate among many, rather than its own hourly cron.
// To keep it occasional (the gate fires at :30 every hour), it carries its own
// cooldown: a nudge candidate is only offered once the cooldown since the last
// one actually SENT has elapsed.
const NUDGE_LAST_SENT_FILE = join(ZOE_PATHS.home, 'nudge-last-sent.txt');
export const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4h between task nudges

/** True if enough time has passed since the last task-nudge was sent. */
export async function nudgeCooldownElapsed(now: number = Date.now()): Promise<boolean> {
  try {
    const raw = (await fs.readFile(NUDGE_LAST_SENT_FILE, 'utf8')).trim();
    const last = Date.parse(raw);
    if (Number.isNaN(last)) return true;
    return now - last >= NUDGE_COOLDOWN_MS;
  } catch {
    return true; // never sent
  }
}

/** Record that a task-nudge just went out (starts the cooldown). */
export async function markNudgeSent(now: number = Date.now()): Promise<void> {
  try {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.writeFile(NUDGE_LAST_SENT_FILE, new Date(now).toISOString(), 'utf8');
  } catch {
    // best-effort
  }
}

/** The callback pattern the nudge buttons use; index.ts registers it. */
export const NUDGE_CALLBACK = /^nudge:(now|later|shelve)(?::(.+))?$/;

/**
 * What a nudge button does, separated from index.ts so it can be tested
 * without importing the bot entrypoint (agent-loops rule 21). Returns the
 * text for answerCallbackQuery. With a task id, Later and Shelve snooze THAT
 * task (4h / 7d). Without one (older buttons), they snooze the whole stream
 * for the cooldown window, as the handler always did. Never throws.
 */
export async function applyNudgeAction(
  action: string,
  taskId?: string,
  now: number = Date.now(),
): Promise<string> {
  if (taskId && (action === 'later' || action === 'shelve')) {
    try {
      await snoozeTask(taskId, action === 'later' ? SNOOZE_LATER_MS : SNOOZE_SHELVE_MS, now);
      return action === 'later' ? 'Snoozed 4h.' : 'Shelved for 7 days.';
    } catch (e) {
      console.error('[zoe/nudges] task snooze failed:', e);
      return 'Could not snooze - it may nudge again.';
    }
  }
  if (action === 'later' || action === 'shelve') {
    try {
      await markNudgeSent(now);
    } catch (e) {
      console.error('[zoe/nudges] nudge snooze failed:', e);
    }
  }
  const acted: Record<string, string> = { now: 'On it.', later: 'Snoozed for now.', shelve: 'Shelved for now.' };
  return acted[action] ?? 'Got it.';
}
