/**
 * Proactive nudge - surface stale captures and overdue tasks.
 *
 * Daily scheduled check that pings ZAAL BOTZ General when:
 * - Captures go 7+ days without shipping (collector's-fallacy flag)
 * - Tasks are overdue (due date < today, status not done/triage)
 *
 * Capped at 5 each (stale + overdue), short message, de-duped via
 * last-seen date so Zaal gets nudged at most once per day per issue type.
 * Best-effort: swallows errors, silent when nothing to nudge.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fetchCockpitTasks, isCapture, daysSince, CAPTURE_STALE_DAYS } from '../cockpit/adapters';
import type { CockpitTask } from '../cockpit/types';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const NUDGE_SEEN_PATH = join(ZOE_HOME, 'nudge-seen.json');

/** De-dupe record: when was the last nudge sent (ISO date YYYY-MM-DD). */
interface NudgeSeen {
  at: string;
}

/**
 * Load the last nudge date, or null if never nudged (first run).
 * Best-effort: returns null on read failure.
 */
async function lastNudgeDate(): Promise<string | null> {
  try {
    const data = (await fs.readFile(NUDGE_SEEN_PATH, 'utf8')) as string;
    const obj = JSON.parse(data) as NudgeSeen;
    return obj.at ?? null;
  } catch {
    return null;
  }
}

/**
 * Record that a nudge was sent today.
 * Best-effort: returns silently on write failure.
 */
async function setNudgeSent(date: string): Promise<void> {
  try {
    await fs.mkdir(ZOE_HOME, { recursive: true });
    await fs.writeFile(NUDGE_SEEN_PATH, JSON.stringify({ at: date }));
  } catch {
    // silent
  }
}

/**
 * Pure: compute nudge-worthy items from a task set.
 * Returns stale captures (7+ days, not done) and overdue tasks (due < today, not done).
 * Caps each list at 5.
 */
export function computeNudges(
  tasks: CockpitTask[],
  now: number,
): { staleCaptures: CockpitTask[]; overdue: CockpitTask[] } {
  const staleCaptures: CockpitTask[] = [];
  const overdue: CockpitTask[] = [];

  const todayIso = new Date(now).toISOString().slice(0, 10);

  for (const t of tasks) {
    // Skip done tasks.
    if (t.status === 'done') continue;

    // Stale capture: is a capture AND not done AND 7+ days old.
    if (isCapture(t) && daysSince(t.created_at, now) >= CAPTURE_STALE_DAYS) {
      staleCaptures.push(t);
    }

    // Overdue: has a due date, due is before today, not done, not triage.
    if (t.due && t.due < todayIso && t.status !== 'triage') {
      overdue.push(t);
    }
  }

  return {
    staleCaptures: staleCaptures.slice(0, 5),
    overdue: overdue.slice(0, 5),
  };
}

/**
 * Pure: format nudge message from computed nudges.
 * Returns null if nothing to nudge (empty list), a short message otherwise.
 * No emojis, no em-dashes. Spartan format per Zaal's voice.
 */
export function formatNudge(n: { staleCaptures: CockpitTask[]; overdue: CockpitTask[] }): string | null {
  if (n.staleCaptures.length === 0 && n.overdue.length === 0) {
    return null;
  }

  const lines: string[] = [];

  if (n.staleCaptures.length > 0) {
    const titles = n.staleCaptures.slice(0, 2).map((t) => `"${t.title.slice(0, 40)}"`).join(', ');
    const msg = `Nudge: ${n.staleCaptures.length} idea(s) captured 7+ days ago (ship or drop). E.g. ${titles}`;
    lines.push(msg);
  }

  if (n.overdue.length > 0) {
    const titles = n.overdue.slice(0, 2).map((t) => `"${t.title.slice(0, 40)}"`).join(', ');
    const msg = `Nudge: ${n.overdue.length} task(s) overdue. E.g. ${titles}`;
    lines.push(msg);
  }

  return lines.join('\n');
}

/**
 * Surface nudges if conditions are met (not nudged today, has nudges).
 * Fetches tasks, computes nudges, and if non-empty and we haven't nudged today,
 * posts and records. Best-effort: swallows errors, logs to console.
 *
 * postToGeneral: async function that sends a message to the general topic.
 * now: optional timestamp (defaults to Date.now()).
 */
export async function surfaceNudges(
  postToGeneral: (text: string) => Promise<unknown>,
  now?: number,
): Promise<void> {
  const timestamp = now ?? Date.now();
  const todayIso = new Date(timestamp).toISOString().slice(0, 10);

  try {
    // Check if already nudged today.
    const lastDate = await lastNudgeDate();
    if (lastDate === todayIso) {
      // Already nudged today - skip.
      return;
    }

    // Fetch tasks.
    const tasks = await fetchCockpitTasks();
    if (tasks.length === 0) {
      // No tasks - nothing to nudge.
      return;
    }

    // Compute nudges.
    const nudges = computeNudges(tasks, timestamp);

    // Format message.
    const message = formatNudge(nudges);
    if (!message) {
      // Nothing to nudge - skip.
      return;
    }

    // Post to general.
    await postToGeneral(message);

    // Record that we nudged today.
    await setNudgeSent(todayIso);

    console.log('[zoe/nudge] surfaced nudges to general');
  } catch (err) {
    console.warn('[zoe/nudge] surface failed (nbd):', err instanceof Error ? err.message : String(err));
  }
}
