/**
 * backlog-grill-runner.ts - the IO half of the backlog grill.
 *
 * backlog-grill.ts is pure: it decides what a card looks like, how to read an
 * answer, and whether another card is due. This file does the talking - reads
 * the board, sends the card, records the verdict - and holds no policy of its
 * own.
 *
 * WHAT THIS IS FOR
 * Zaal, after clearing 24 board tasks in a terminal grill:
 *   "start to slow grill me using telegram which is asking me a bunch of
 *    questions each 2 mins adding a new one and ill just come though and go
 *    though the whole queu just like today and knock them out with pressing
 *    1,2,3,4,5 or typing in a reply"
 *
 * The board is at ~357 open. Nobody reads a 357-item list. Two cards at a time,
 * five fixed answers, swept whenever he has a minute - that is the shape that
 * actually moved 24 tasks in one sitting.
 *
 * WHY A SEPARATE STATE FILE FROM grill.ts
 * grill.ts surfaces need-you decisions and PRs one at a time, and blocks until
 * each is answered. This one deliberately does NOT block: cards pile up (capped)
 * because the pile IS the queue Zaal sweeps. Sharing state would make each
 * fight the other's cursor.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  DRIP_DEFAULT,
  parseVerdict,
  renderCard,
  shouldSendNext,
  verdictButtons,
  verdictNote,
  type Verdict,
} from './backlog-grill';

const STATE_PATH = join(homedir(), '.zao/zoe/backlog-grill-state.json');

export interface BacklogGrillState {
  /** taskId -> when we sent its card. Presence means "asked". */
  asked: Record<string, { at: string; title: string }>;
  /** taskId -> the verdict, once answered. */
  answered: Record<string, { at: string; verdict: string; note?: string }>;
  /** The card a bare "1" answers - the most recent one sent. */
  activeTaskId: string | null;
  lastSentMs: number | null;
}

const EMPTY: BacklogGrillState = { asked: {}, answered: {}, activeTaskId: null, lastSentMs: null };

export async function readState(): Promise<BacklogGrillState> {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(STATE_PATH, 'utf8')) };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeState(s: BacklogGrillState): Promise<void> {
  await fs.mkdir(join(homedir(), '.zao/zoe'), { recursive: true }).catch(() => {});
  await fs.writeFile(STATE_PATH, JSON.stringify(s, null, 2), { mode: 0o600 });
}

/** How many cards are out and unanswered. This is the backpressure signal. */
export function outstandingCount(s: BacklogGrillState): number {
  return Object.keys(s.asked).filter((id) => !s.answered[id]).length;
}

interface BoardTask {
  id: string;
  title: string;
  created_at?: string;
  notes?: string;
  legacy_id?: string;
}

function cfg(): { root: string; headers: Record<string, string> } | null {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return null;
  return {
    root: base.replace(/\/$/, ''),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  };
}

/**
 * The oldest open task not yet asked about.
 *
 * Oldest first on purpose: a 36-day-old task is the one most likely to be dead,
 * and clearing the tail is where the board actually shrinks.
 */
async function nextTask(
  s: BacklogGrillState,
  fetchImpl: typeof fetch,
): Promise<{ task: BoardTask; remaining: number } | null> {
  const c = cfg();
  if (!c) return null;
  const url =
    `${c.root}/rest/v1/tasks?status=eq.todo&archived_at=is.null` +
    `&select=id,legacy_id,title,created_at,notes&order=created_at.asc&limit=200`;
  const r = await fetchImpl(url, { headers: c.headers, cache: 'no-store' });
  if (!r.ok) return null;
  const rows = (await r.json()) as BoardTask[];
  const fresh = rows.filter((t) => !s.asked[t.id]);
  if (fresh.length === 0) return null;
  return { task: fresh[0], remaining: fresh.length };
}

export interface GrillTickDeps {
  sendDM: (text: string, buttons: { text: string; data: string }[][]) => Promise<unknown>;
  /** Zaal's local hour, 0-23 - cards never go out at night. */
  localHour: number;
  now?: number;
  fetchImpl?: typeof fetch;
}

/**
 * One tick. Sends at most ONE card, or nothing.
 *
 * Returns what it did so the scheduler can log it - a silent tick that did
 * nothing is indistinguishable from a broken one otherwise.
 */
export async function runBacklogGrillTick(
  deps: GrillTickDeps,
): Promise<{ sent: boolean; reason: string; title?: string }> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now();
  if (!cfg()) return { sent: false, reason: 'tracker not configured' };

  const state = await readState();
  const next = await nextTask(state, fetchImpl);
  if (!next) return { sent: false, reason: 'nothing left to ask about' };

  const gate = shouldSendNext({
    nowMs: now,
    localHour: deps.localHour,
    lastSentMs: state.lastSentMs,
    outstanding: outstandingCount(state),
    remainingInQueue: next.remaining,
    cfg: DRIP_DEFAULT,
  });
  if (!gate.send) return { sent: false, reason: gate.reason };

  const total = Object.keys(state.asked).length + next.remaining;
  const index = Object.keys(state.asked).length + 1;
  const why = (next.task.notes || '').split('\n')[0];
  const text = renderCard(
    { title: next.task.title, createdAt: next.task.created_at, why },
    { index, total },
    now,
  );

  await deps.sendDM(text, verdictButtons());

  state.asked[next.task.id] = { at: new Date(now).toISOString(), title: next.task.title };
  state.activeTaskId = next.task.id;
  state.lastSentMs = now;
  await writeState(state);
  return { sent: true, reason: 'sent', title: next.task.title };
}

/**
 * Apply an answer to the card currently in play.
 *
 * `raw` is whatever Zaal did - a tapped button's key, a bare "1", or a typed
 * sentence. parseVerdict owns the interpretation; this only performs it.
 */
export async function applyBacklogAnswer(
  raw: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; message: string }> {
  const c = cfg();
  if (!c) return { ok: false, message: 'tracker not configured' };
  const state = await readState();
  const taskId = state.activeTaskId;
  if (!taskId) return { ok: false, message: 'no card is open' };

  const v: Verdict | null = parseVerdict(raw);
  if (!v) return { ok: false, message: 'could not read that answer' };

  let message = '';
  if (v.closesTask) {
    const cur = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}&select=notes`, {
      headers: c.headers,
    });
    const rows = cur.ok ? ((await cur.json()) as Array<{ notes?: string }>) : [];
    const notes = `${(rows[0]?.notes || '').trim()}\n\n${verdictNote(v, new Date().toISOString().slice(0, 10))}`.trim();
    // 'done', never 'completed' - tasks.status has a CHECK constraint that 400s
    // on anything else, and the rejection reads as "nothing to close".
    const patch = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: { ...c.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'done', notes }),
    });
    if (!patch.ok) return { ok: false, message: `close failed (${patch.status})` };
    message = v.key === 'done' ? 'Closed.' : 'Dropped.';
  } else if (v.key === 'work') {
    message = v.note ? `On it: ${v.note.slice(0, 80)}` : 'On it - it comes back at the end for confirmation.';
  } else if (v.key === 'skip') {
    message = 'Skipped - it returns later.';
  } else {
    message = 'Kept open.';
  }

  state.answered[taskId] = {
    at: new Date().toISOString(),
    verdict: v.key,
    note: v.note,
  };
  // Requeued verdicts forget the "asked" mark so the task comes round again.
  if (v.requeue) delete state.asked[taskId];
  state.activeTaskId = null;
  await writeState(state);
  return { ok: true, message };
}
