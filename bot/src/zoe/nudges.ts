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
  const tasks = await readTasks();
  const open = tasks
    .filter((t) => t.status === 'pending' || t.status === 'in_progress')
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
  return [
    `Next move - [${task.priority}] ${task.title}`,
    firstLine ? firstLine : '',
    ``,
    `${open.length} open in your queue. Reply with progress, ask me to break this down, or "stop nudges" to pause.`,
  ]
    .filter((line) => line !== '')
    .join('\n');
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
