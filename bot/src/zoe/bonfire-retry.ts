/**
 * bonfire-retry.ts - a retry queue for EVERY Bonfire write, not just thread emits.
 *
 * Zaal, 2026-08-09, deciding the P1 in issues/507: when Bonfire is down, BUILD
 * THE KV QUEUE - queue writes and replay on recovery, do not accept the loss.
 *
 * What was already true: thread-memory.ts had exactly this, working well, wired
 * to a scheduler tick. What was not: it only covered thread transitions. The
 * other writers dropped failures on the floor -
 *
 *   team-tracker.ts    a failed priorities mirror set `mirrored = false`, no retry
 *   afferent-digest.ts a failed promotion logged console.warn and moved on
 *
 * The second one is the reason this is a P1 rather than housekeeping: that path
 * promotes an APPROVED COMMUNITY SUBMISSION into the graph. A steward approves a
 * member's work, Bonfire happens to be unreachable, and the submission vanishes
 * into a warning nobody reads. The member is never told. That is silent data
 * loss with a person on the other end of it.
 *
 * So this generalises the queue rather than adding a second one: same on-disk
 * shape, same guards, same drain cadence, but keyed on an arbitrary sourceTag so
 * any caller can use it. thread-memory keeps its own typed wrapper on top.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';
import { remember, containsSecret, bonfireConfigured } from './recall';
import { containsPii, scanPii } from './pii';
import { featureRan } from './feature-ran';

/**
 * Resolved LAZILY, never at module load. This module is imported by
 * team-tracker and afferent-digest, which are imported by dozens of test files
 * that mock '../memory' without supplying ZOE_PATHS - reading ZOE_PATHS.home at
 * module scope crashed 27 test files on import before this was a function.
 * A module-scope side effect is a landmine for every future importer.
 */
function queueFile(): string {
  return join(ZOE_PATHS.home, 'bonfire-retry-queue.json');
}

/** Bounded so a long outage cannot grow the file without limit. Oldest drop first. */
export const MAX_QUEUE = 500;

/** Past this, a write is stale enough that replaying it is noise, not recovery. */
export const MAX_AGE_DAYS = 14;

export interface QueuedWrite {
  body: string;
  name: string;
  sourceTag: string;
  queuedAt: string;
  /** Attempts so far, so a permanently-failing item is visible rather than silent. */
  attempts?: number;
}

export interface FlushResult {
  sent: number;
  kept: number;
  /** Dropped because a guard now trips, or the item aged out. */
  dropped: number;
}

export async function loadQueue(path?: string): Promise<QueuedWrite[]> {
  try {
    const raw = await fs.readFile(path ?? queueFile(), 'utf8');
    const arr = JSON.parse(raw) as QueuedWrite[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return []; // absent or corrupt - an empty queue, never a crash
  }
}

export async function saveQueue(q: QueuedWrite[], path?: string): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  // slice(-MAX_QUEUE) keeps the NEWEST. During a long outage the oldest writes
  // are the ones most likely already superseded.
  await fs.writeFile(path ?? queueFile(), JSON.stringify(q.slice(-MAX_QUEUE), null, 2), 'utf8');
}

/**
 * Queue a failed Bonfire write.
 *
 * Only call this for a GENUINE send failure - network or HTTP. A guard skip
 * (secret, PII, empty, no-config) is terminal: re-sending it would trip the same
 * guard forever and the queue would never drain.
 */
export async function enqueueWrite(
  item: Omit<QueuedWrite, 'queuedAt' | 'attempts'>,
  path?: string,
): Promise<void> {
  const q = await loadQueue(path);
  q.push({ ...item, queuedAt: new Date().toISOString(), attempts: 0 });
  await saveQueue(q, path);
}

function agedOut(item: QueuedWrite, now: number): boolean {
  const t = Date.parse(item.queuedAt);
  if (Number.isNaN(t)) return false; // unparseable date: keep, do not silently discard
  return now - t > MAX_AGE_DAYS * 86_400_000;
}

/**
 * Replay queued writes. Call from a low-frequency scheduler tick.
 *
 * Re-scans every body before re-sending: content that trips a guard NOW is
 * dropped rather than retried, because the guards are the last line before a
 * secret or someone's phone number reaches a graph other agents can query.
 */
export async function flushQueue(path?: string, now: number = Date.now()): Promise<FlushResult> {
  if (!bonfireConfigured()) return { sent: 0, kept: 0, dropped: 0 };
  const q = await loadQueue(path);
  if (q.length === 0) return { sent: 0, kept: 0, dropped: 0 };

  const remaining: QueuedWrite[] = [];
  let sent = 0;
  let dropped = 0;

  for (const item of q) {
    if (agedOut(item, now)) {
      dropped += 1;
      console.warn(`[zoe/bonfire-retry] dropped after ${MAX_AGE_DAYS}d: ${item.name}`);
      continue;
    }
    if (containsSecret(item.body)) {
      dropped += 1;
      console.warn(`[zoe/bonfire-retry] dropped - secret-shaped string in ${item.name}`);
      continue;
    }
    if (containsPii(item.body)) {
      const kinds = [...new Set(scanPii(item.body).map((m) => m.kind))].join(',');
      dropped += 1;
      console.warn(`[zoe/bonfire-retry] dropped - PII (${kinds}) in ${item.name}`);
      continue;
    }

    const r = await remember({ body: item.body, name: item.name, sourceTag: item.sourceTag });
    if (r.ok) {
      sent += 1;
    } else if (r.skipped) {
      dropped += 1; // terminal - would fail identically forever
    } else {
      remaining.push({ ...item, attempts: (item.attempts ?? 0) + 1 });
    }
  }

  await saveQueue(remaining, path);

  // Say something when the queue is not draining. A queue that silently grows is
  // the same failure as no queue at all, just slower to notice.
  if (remaining.length > 0) {
    const stuck = remaining.filter((i) => (i.attempts ?? 0) >= 5).length;
    console.warn(
      `[zoe/bonfire-retry] ${remaining.length} still queued` +
        (stuck > 0 ? ` - ${stuck} have failed 5+ times, Bonfire may need a look` : ''),
    );
  }

  // Announce only when the queue actually moved. A flush that found nothing
  // to do has not run in any sense worth reporting, and claiming otherwise
  // would make the [zoe/ran] line mean 'the cron fired' rather than 'the
  // feature worked' - which is the exact confusion this whole mechanism exists
  // to remove.
  if (sent > 0 || dropped > 0) {
    featureRan('bonfire-retry', `sent ${sent}, dropped ${dropped}`);
  }

  return { sent, kept: remaining.length, dropped };
}
