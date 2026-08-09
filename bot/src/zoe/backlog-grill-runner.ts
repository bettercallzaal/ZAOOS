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
  /**
   * taskId -> when we sent its card. Presence means "asked".
   *
   * `requeuedAt` marks one that was answered "work" or "skip" and is waiting to
   * come round again. It stays IN `asked` so it is not treated as never-asked -
   * see nextTask for why that distinction is the whole fix.
   */
  asked: Record<string, { at: string; title: string; requeuedAt?: string }>;
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

/**
 * How many cards are out and unanswered. This is the backpressure signal.
 *
 * A requeued task is not outstanding: Zaal already answered it once, and it is
 * parked at the back of the queue rather than sitting on his phone waiting. If
 * it counted, twenty skips would permanently pin the cap and the drip would
 * stop for good.
 */
export function outstandingCount(s: BacklogGrillState): number {
  return Object.keys(s.asked).filter((id) => !s.answered[id] && !s.asked[id].requeuedAt).length;
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
 * The next card: the oldest task never asked about, and only once those run
 * out, the task requeued longest ago.
 *
 * Oldest first on purpose: a 36-day-old task is the one most likely to be dead,
 * and clearing the tail is where the board actually shrinks.
 *
 * The two-tier order is what makes "it comes back at the END of the queue" true.
 * Cards go out oldest-first, so the card Zaal just skipped was by definition the
 * oldest unasked one - simply un-asking it put it straight back at the FRONT and
 * the next tick re-sent the same card, forever, and no other task could ever
 * surface behind it. A requeued task therefore keeps its `asked` mark and waits
 * behind every task that has not been seen at all.
 */
async function nextTask(
  s: BacklogGrillState,
  fetchImpl: typeof fetch,
): Promise<{ task: BoardTask; remaining: number; unasked: number } | null> {
  const c = cfg();
  if (!c) return null;
  const url =
    `${c.root}/rest/v1/tasks?status=eq.todo&archived_at=is.null` +
    `&select=id,legacy_id,title,created_at,notes&order=created_at.asc&limit=200`;
  const r = await fetchImpl(url, { headers: c.headers, cache: 'no-store' });
  if (!r.ok) return null;
  const rows = (await r.json()) as BoardTask[];
  const fresh = rows.filter((t) => !s.asked[t.id]);
  const requeued = rows
    .filter((t) => s.asked[t.id]?.requeuedAt && !s.answered[t.id])
    .sort((a, b) =>
      String(s.asked[a.id].requeuedAt).localeCompare(String(s.asked[b.id].requeuedAt)),
    );
  const queue = [...fresh, ...requeued];
  if (queue.length === 0) return null;
  return { task: queue[0], remaining: queue.length, unasked: fresh.length };
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

  // `unasked`, not `remaining`: a requeued task is already inside `asked`, so
  // counting the queue length here would count it twice in the "3/357" line.
  const total = Object.keys(state.asked).length + next.unasked;
  const index = Object.keys(state.asked).length + 1;
  const why = (next.task.notes || '').split('\n')[0];
  const text = renderCard(
    { title: next.task.title, createdAt: next.task.created_at, why },
    { index, total },
    now,
  );

  await deps.sendDM(text, verdictButtons(next.task.id));

  // Rewritten wholesale, which clears any `requeuedAt`: it has now come round
  // again, so it is an ordinary open card until it is answered a second time.
  state.asked[next.task.id] = { at: new Date(now).toISOString(), title: next.task.title };
  state.activeTaskId = next.task.id;
  state.lastSentMs = now;
  await writeState(state);
  return { sent: true, reason: 'sent', title: next.task.title };
}

/**
 * Apply an answer to a card.
 *
 * `raw` is whatever Zaal did - a tapped button's key, a bare "1", or a typed
 * sentence. parseVerdict owns the interpretation; this only performs it.
 *
 * `taskId` is the card the answer BELONGS to, and a tap always supplies it: up
 * to 20 cards sit unanswered at once by design, so "the card in play" is only
 * the right subject for a TYPED answer (a bare "1" with no card attached can
 * only mean the newest). A tap that fell back to activeTaskId would close
 * whichever task happened to be sent last, not the one under his thumb.
 */
export async function applyBacklogAnswer(
  raw: string,
  fetchImpl: typeof fetch = fetch,
  explicitTaskId?: string,
): Promise<{ ok: boolean; message: string }> {
  const c = cfg();
  if (!c) return { ok: false, message: 'tracker not configured' };
  const state = await readState();
  const taskId = explicitTaskId ?? state.activeTaskId;
  if (!taskId) return { ok: false, message: 'no card is open' };
  if (state.answered[taskId]) {
    return { ok: false, message: 'already answered that one' };
  }

  const v: Verdict | null = parseVerdict(raw);
  if (!v) return { ok: false, message: 'could not read that answer' };

  let message = '';
  if (v.closesTask) {
    const cur = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}&select=notes`, {
      headers: c.headers,
    });
    // Closing is a read-modify-write on a text column, and the PATCH below
    // REPLACES `notes` wholesale. If the read fails we do not know what was in
    // there, so writing anyway swaps the task's entire note history for one
    // grill line - silently, because the PATCH still succeeds and Zaal is told
    // "Closed." A 429 or a 5xx on the read is enough to do it.
    //
    // Fail closed instead: the card stays open and unanswered, so the next tap
    // (or a typed answer) retries it. A close that has to be repeated is much
    // cheaper than notes that cannot be recovered.
    if (!cur.ok) return { ok: false, message: `could not read that task (${cur.status}) - not closing` };
    const rows = (await cur.json()) as Array<{ notes?: string }>;
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
  // A requeued verdict forgets the `answered` mark - otherwise the guard above
  // would refuse the second card - but KEEPS the `asked` mark, stamped with
  // `requeuedAt`. Deleting `asked` outright made the task never-asked again, and
  // since cards go out oldest-first it was the oldest never-asked task, so the
  // next tick re-sent the very card he had just skipped and the queue never
  // moved past it. nextTask now sends requeued tasks only after the unseen ones.
  if (v.requeue) {
    state.asked[taskId] = {
      at: state.asked[taskId]?.at ?? new Date().toISOString(),
      title: state.asked[taskId]?.title ?? '',
      requeuedAt: new Date().toISOString(),
    };
    delete state.answered[taskId];
  }
  // Only the card in play stops being the card in play. Answering an older one
  // from the pile must not orphan the newest card's typed-answer path.
  if (state.activeTaskId === taskId) state.activeTaskId = null;
  await writeState(state);
  return { ok: true, message };
}
