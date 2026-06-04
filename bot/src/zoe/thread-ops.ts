/**
 * thread-ops.ts — apply the concierge's thread_ops (doc 796 Move 2).
 *
 * Bridges the LLM's emitted ops to the hot store (threads.ts, Layer A) and the
 * Bonfire emit (thread-memory.ts, Layer B). Opening a thread also fires an
 * "open" episode to the graph so ZOE is a memory source for other agents.
 *
 * Kept separate from index.ts so the op application + due-date resolution is
 * unit-testable and the dispatch handler stays a thin caller.
 */

import {
  addThread,
  resolveThread,
  dropThread,
  snoozeThread,
  getThread,
  type OpenThread,
} from './threads';
import { emitThreadTransition } from './thread-memory';
import type { ThreadOp } from './types';

export interface ThreadOpsSummary {
  opened: number;
  resolved: number;
  snoozed: number;
  dropped: number;
  /** Threads opened this turn, so the caller can show "tracking: ..." + undo. */
  openedThreads: OpenThread[];
}

/**
 * Resolve a dueAt value to an ISO timestamp. Accepts a real ISO string
 * (returned as-is) or a small set of natural phrases relative to `now`. Unknown
 * phrases resolve to null (open-ended — tracked but never clock-nudged).
 */
export function resolveDueAt(value: string | null | undefined, now: number = Date.now()): string | null {
  if (!value) return null;
  const raw = value.trim();
  // Already an ISO-ish timestamp.
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}/.test(raw)) {
    return new Date(parsed).toISOString();
  }
  const lower = raw.toLowerCase();
  const d = new Date(now);
  const atHour = (base: Date, hour: number): string => {
    const x = new Date(base);
    x.setUTCHours(hour, 0, 0, 0);
    return x.toISOString();
  };
  // EOD anchors at 23:00 UTC (~7pm ET) — "today"/"tonight"/"eod".
  if (/(today|tonight|end of day|eod|by tonight)/.test(lower)) return atHour(d, 23);
  if (/tomorrow/.test(lower)) {
    const t = new Date(now + 24 * 3600_000);
    return atHour(t, 23);
  }
  if (/this week|by friday|eow|end of week/.test(lower)) {
    const t = new Date(now + 3 * 24 * 3600_000);
    return atHour(t, 23);
  }
  // "in N hours"
  const hourMatch = lower.match(/in\s+(\d{1,2})\s*h(?:ours?)?/);
  if (hourMatch) return new Date(now + Number(hourMatch[1]) * 3600_000).toISOString();
  return null;
}

/**
 * Apply a batch of thread_ops. Best-effort per op: a failing op is logged and
 * skipped, never throwing. Bonfire emits are fire-and-forget within each op
 * (the hot store is the source of truth; a down graph never blocks).
 */
export async function applyThreadOps(
  ops: ThreadOp[],
  now: number = Date.now(),
): Promise<ThreadOpsSummary> {
  const summary: ThreadOpsSummary = { opened: 0, resolved: 0, snoozed: 0, dropped: 0, openedThreads: [] };

  for (const op of ops) {
    try {
      if (op.op === 'open') {
        const thread = await addThread(
          { summary: op.summary, sourceTurn: op.summary, dueAt: resolveDueAt(op.dueAt, now) },
          now,
        );
        summary.opened += 1;
        summary.openedThreads.push(thread);
        // Layer B: emit to Bonfire (stamps bonfireEpisodeId on success).
        void emitThreadTransition(thread, 'open').catch(() => {});
      } else if (op.op === 'resolve') {
        const t = await resolveThread(op.id);
        if (t) {
          summary.resolved += 1;
          void emitThreadTransition(t, 'resolved').catch(() => {});
        }
      } else if (op.op === 'drop') {
        const t = await dropThread(op.id);
        if (t) {
          summary.dropped += 1;
          void emitThreadTransition(t, 'dropped').catch(() => {});
        }
      } else if (op.op === 'snooze') {
        const hours = op.untilHours ?? 24;
        const t = await snoozeThread(op.id, now + hours * 3600_000, now);
        if (t) summary.snoozed += 1;
      }
    } catch (err) {
      console.error('[zoe/thread-ops] op failed:', op.op, (err as Error).message);
    }
  }

  // Guard against a resolve/drop op referencing an unknown id (LLM hallucination).
  return summary;
}

/** One-line postscript for the DM so Zaal sees what ZOE is now tracking + how to undo. */
export function summarizeThreadOps(summary: ThreadOpsSummary): string {
  const parts: string[] = [];
  if (summary.opened > 0) {
    const ids = summary.openedThreads.map((t) => t.id).join(' ');
    parts.push(`Tracking ${summary.opened} new commitment${summary.opened === 1 ? '' : 's'} (reply "untrack ${ids}" to undo).`);
  }
  if (summary.resolved > 0) parts.push(`Closed ${summary.resolved}.`);
  if (summary.dropped > 0) parts.push(`Dropped ${summary.dropped}.`);
  if (summary.snoozed > 0) parts.push(`Snoozed ${summary.snoozed}.`);
  return parts.join(' ');
}

export { getThread };
