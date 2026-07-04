/**
 * threads.ts — open-threads store (doc 796 Move 2, Layer A).
 *
 * The continuity layer. When Zaal says "I'll ship the onepager today," ZOE
 * opens a thread with due_at=tonight; a later reasoning tick (proactive.ts)
 * sees it past-due + unacked and surfaces "you said you'd ship the onepager
 * today — did it land?". Acks/snoozes/drops mutate thread state. This single
 * mechanism manufactures the "it's paying attention" feeling.
 *
 * TWO-LAYER MEMORY (Decision 4): this file is the HOT operational store — fast,
 * atomic, transactional. Status transitions / due-date math / nudge counters
 * live here, NOT in Bonfire (wrong shape for a knowledge graph). The durable,
 * cross-agent layer is Bonfire: on open/resolve/drop ZOE emits an episode via
 * thread-memory.ts and stamps the returned id onto `bonfireEpisodeId`, so
 * Hermes / Devz / future agents recall Zaal's commitments FROM the graph.
 * Continuity survives a wiped threads.json because Bonfire holds the history.
 *
 * Persistence + concurrency mirror approvals.ts exactly: an in-memory map that
 * is the source of truth for live behavior, a single serialized persist chain
 * to ~/.zao/zoe/threads.json, and pure helpers (isDue / nextEscalationAction)
 * with no IO so the escalation logic is unit-testable.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export type ThreadStatus = 'open' | 'snoozed' | 'done' | 'dropped';

export interface OpenThread {
  id: string;
  /** One-line, what Zaal committed to / the loop ZOE is tracking. */
  summary: string;
  /** Verbatim-ish snippet of the turn this was extracted from (provenance). */
  sourceTurn: string;
  createdAt: string; // ISO
  /** When it's "due", if Zaal gave a time. null = open-ended, never auto-nudged on a clock. */
  dueAt: string | null;
  status: ThreadStatus;
  lastNudgedAt: string | null;
  nudgeCount: number;
  /** How many times Zaal has pushed it off. Two flips escalation to a decision. */
  snoozeCount: number;
  /** While status==='snoozed', don't surface until this passes. */
  snoozeUntil: string | null;
  /** Bonfire episode id for the OPEN emit (Layer B linkage). null if emit failed/queued. */
  bonfireEpisodeId: string | null;
}

/** Input to open a new thread. Everything else is defaulted. */
export interface NewThreadInput {
  summary: string;
  sourceTurn: string;
  dueAt?: string | null;
}

/** The escalation move a tick should make for a thread, decided purely. */
export type EscalationAction =
  | { kind: 'none' }
  | { kind: 'nudge'; overdue: boolean }
  /** After two snoozes, stop re-pinging — make repetition a decision instead. */
  | { kind: 'decision' };

const THREADS_FILE = join(ZOE_PATHS.home, 'threads.json');

/** Two snoozes flips nudging into a reschedule/drop/breakdown decision (doc 796 Move 3). */
export const SNOOZE_FLIP_THRESHOLD = 2;

/** Base cooldown between nudges on the same thread. Shrinks as the due date nears. */
export const NUDGE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h
const NUDGE_COOLDOWN_NEAR_MS = 2 * 60 * 60 * 1000; // 2h once due is close/overdue
const DUE_SOON_WINDOW_MS = 2 * 60 * 60 * 1000; // "near" = within 2h of due

// In-memory store keyed by thread id. Mirror of disk (approvals.ts pattern).
const threadsById = new Map<string, OpenThread>();

// ---- pure helpers (no IO) ---------------------------------------------------

/** A thread whose due time has passed. Open-ended threads are never "due". */
export function isOverdue(t: OpenThread, now: number = Date.now()): boolean {
  if (!t.dueAt) return false;
  return Date.parse(t.dueAt) <= now;
}

/** A thread due within the next DUE_SOON_WINDOW (but not yet overdue). */
export function isDueSoon(t: OpenThread, now: number = Date.now()): boolean {
  if (!t.dueAt) return false;
  const due = Date.parse(t.dueAt);
  return due > now && due - now <= DUE_SOON_WINDOW_MS;
}

/** True while a snoozed thread is still resting. */
export function snoozeActive(t: OpenThread, now: number = Date.now()): boolean {
  return t.status === 'snoozed' && !!t.snoozeUntil && Date.parse(t.snoozeUntil) > now;
}

function nudgeCooldownFor(t: OpenThread, now: number): number {
  if (isOverdue(t, now) || isDueSoon(t, now)) return NUDGE_COOLDOWN_NEAR_MS;
  return NUDGE_COOLDOWN_MS;
}

/** True if enough time has passed since the last nudge to nudge again. */
export function nudgeCooldownElapsed(t: OpenThread, now: number = Date.now()): boolean {
  if (!t.lastNudgedAt) return true;
  return now - Date.parse(t.lastNudgedAt) >= nudgeCooldownFor(t, now);
}

/**
 * The pure escalation decision for one thread (doc 796 Move 3). No IO, takes an
 * explicit `now` so tests pin time.
 *
 * - resolved/dropped threads → none
 * - actively snoozed → none (resting); a lapsed snooze is treated as open
 * - two-or-more snoozes → decision (reschedule / drop / break it down)
 * - overdue or due-soon AND cooldown elapsed → nudge
 * - otherwise → none
 */
export function nextEscalationAction(t: OpenThread, now: number = Date.now()): EscalationAction {
  if (t.status === 'done' || t.status === 'dropped') return { kind: 'none' };
  if (snoozeActive(t, now)) return { kind: 'none' };

  if (t.snoozeCount >= SNOOZE_FLIP_THRESHOLD) return { kind: 'decision' };

  const overdue = isOverdue(t, now);
  if ((overdue || isDueSoon(t, now)) && nudgeCooldownElapsed(t, now)) {
    return { kind: 'nudge', overdue };
  }
  return { kind: 'none' };
}

export function newThreadId(now: number = Date.now()): string {
  const iso = new Date(now).toISOString().replace(/[:.]/g, '-');
  const rand = Math.random().toString(36).slice(2, 6);
  return `th-${iso}-${rand}`;
}

// ---- persistence (serialized, approvals.ts pattern) -------------------------

let persistChain: Promise<void> = Promise.resolve();

function persist(): Promise<void> {
  persistChain = persistChain.then(async () => {
    try {
      await fs.mkdir(ZOE_PATHS.home, { recursive: true });
      const arr = [...threadsById.values()];
      await fs.writeFile(THREADS_FILE, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      console.error('[zoe/threads] persist failed:', (err as Error).message);
    }
  });
  return persistChain;
}

/** Load persisted threads on boot. Best-effort; never throws. */
export async function loadThreads(): Promise<void> {
  try {
    const raw = await fs.readFile(THREADS_FILE, 'utf8');
    const arr = JSON.parse(raw) as OpenThread[];
    threadsById.clear();
    for (const t of arr) {
      if (t && typeof t.id === 'string') threadsById.set(t.id, t);
    }
  } catch {
    // no file yet / corrupt — start empty
  }
}

// ---- mutations --------------------------------------------------------------

/**
 * Open a new thread. Returns the created thread so the caller can emit it to
 * Bonfire (thread-memory.ts) and then stamp the episode id via setBonfireId.
 */
export async function addThread(input: NewThreadInput, now: number = Date.now()): Promise<OpenThread> {
  const t: OpenThread = {
    id: newThreadId(now),
    summary: input.summary.trim(),
    sourceTurn: input.sourceTurn.slice(0, 1200),
    createdAt: new Date(now).toISOString(),
    dueAt: input.dueAt ?? null,
    status: 'open',
    lastNudgedAt: null,
    nudgeCount: 0,
    snoozeCount: 0,
    snoozeUntil: null,
    bonfireEpisodeId: null,
  };
  threadsById.set(t.id, t);
  await persist();
  return t;
}

export function getThread(id: string): OpenThread | undefined {
  return threadsById.get(id);
}

/** All threads, or those matching a status filter. */
export function listThreads(status?: ThreadStatus): OpenThread[] {
  const all = [...threadsById.values()];
  return status ? all.filter((t) => t.status === status) : all;
}

/** Open threads that are NOT resting on a snooze — the proactive candidate pool. */
export function listLiveThreads(now: number = Date.now()): OpenThread[] {
  return [...threadsById.values()].filter(
    (t) => (t.status === 'open' || t.status === 'snoozed') && !snoozeActive(t, now),
  );
}

async function mutate(id: string, fn: (t: OpenThread) => void): Promise<OpenThread | undefined> {
  const t = threadsById.get(id);
  if (!t) return undefined;
  fn(t);
  await persist();
  return t;
}

/** Record that we just nudged this thread (advances cooldown + count). */
export function markNudged(id: string, now: number = Date.now()): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.lastNudgedAt = new Date(now).toISOString();
    t.nudgeCount += 1;
    // A lapsed snooze that we're nudging again returns to open.
    if (t.status === 'snoozed' && !snoozeActive(t, now)) {
      t.status = 'open';
      t.snoozeUntil = null;
    }
  });
}

/** Zaal pushed it off. Returns the thread (for a possible decision flip on the 2nd). */
export function snoozeThread(
  id: string,
  untilMs: number,
  now: number = Date.now(),
): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.status = 'snoozed';
    t.snoozeUntil = new Date(untilMs).toISOString();
    t.snoozeCount += 1;
    t.lastNudgedAt = new Date(now).toISOString();
  });
}

/** Resolve a thread ("done"). Caller emits a resolution episode to Bonfire. */
export function resolveThread(id: string): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.status = 'done';
  });
}

/** Drop a thread ("stop reminding me" / abandoned). Caller emits a drop episode. */
export function dropThread(id: string): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.status = 'dropped';
  });
}

/** Reschedule a thread to a new due date and clear any snooze. */
export function rescheduleThread(id: string, dueAt: string | null): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.dueAt = dueAt;
    t.status = 'open';
    t.snoozeUntil = null;
  });
}

/** Stamp the Bonfire episode id after a successful emit (Layer A↔B linkage). */
export function setBonfireId(id: string, episodeId: string): Promise<OpenThread | undefined> {
  return mutate(id, (t) => {
    t.bonfireEpisodeId = episodeId;
  });
}

/** Remove a phantom thread outright (LLM mis-extraction undo, doc 796 risk). */
export async function deleteThread(id: string): Promise<boolean> {
  const existed = threadsById.delete(id);
  if (existed) await persist();
  return existed;
}

/**
 * Short, prompt-ready summary of live threads for the <open_threads> memory
 * block, so the concierge can resolve/snooze/drop by id. Built by the caller
 * (index.ts) and injected into MemoryBlocks — keeps memory.ts free of a threads
 * import (avoids a circular dependency).
 */
export function renderOpenThreadsBlock(now: number = Date.now()): string {
  const live = listLiveThreads(now);
  if (live.length === 0) return '(no open threads)';
  return live
    .slice(0, 12)
    .map((t) => {
      const due = t.dueAt
        ? isOverdue(t, now)
          ? `due ${t.dueAt.slice(0, 16).replace('T', ' ')} (PAST DUE)`
          : `due ${t.dueAt.slice(0, 16).replace('T', ' ')}`
        : 'open-ended';
      return `${t.id} — ${t.summary} [${due}]`;
    })
    .join('\n');
}
