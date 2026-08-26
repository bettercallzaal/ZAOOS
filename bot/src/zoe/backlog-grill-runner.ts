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
import { featureRan } from './feature-ran';
import {
  classifyReconcile,
  TERMINAL_VERDICT_RE,
  BATCH_DEFAULT,
  dailyBatchSize,
  DRIP_DEFAULT,
  extractPrRef,
  parseVerdict,
  renderCard,
  shouldSendNext,
  verdictButtons,
  verdictNote,
  type DripConfig,
  type Verdict,
} from './backlog-grill';
import { appendGrillQueue, type GrillQueueCard } from './grill-queue';
// IMPORTED, never copied. There is exactly one re-ask ladder and grill.ts owns
// it. The last time this policy got a second implementation - the status line's
// inline copy of outstandingCount - the copy silently drifted from the original
// and painted a jam over a healthy grill. Import it or leave it alone.
import { askCooldownMs } from './grill';

const STATE_PATH = join(homedir(), '.zao/zoe/backlog-grill-state.json');

export interface BacklogGrillState {
  /**
   * taskId -> when we sent its card. Presence means "asked".
   *
   * `requeuedAt` marks one that was answered "work" or "skip" and is waiting to
   * come round again. It stays IN `asked` so it is not treated as never-asked -
   * see nextTask for why that distinction is the whole fix.
   *
   * `at` moves on every send, so it answers "how long since the last card" and
   * nothing else. `firstAskedAt` is stamped once and never overwritten, because
   * the ladder needs "how long has this gone unanswered" - the same split
   * grill.ts documents on GrillItemState. A record written before this field
   * existed falls back to `at`, which for a card that has never been re-sent is
   * the same instant.
   *
   * `messageId` tracks the Telegram message ID so we can pin/unpin the oldest
   * unanswered card (added 2026-08-17).
   */
  asked: Record<string, { at: string; title: string; requeuedAt?: string; firstAskedAt?: string; messageId?: number }>;
  /** taskId -> the verdict, once answered. */
  answered: Record<string, { at: string; verdict: string; note?: string }>;
  /** The card a bare "1" answers - the most recent one sent. */
  activeTaskId: string | null;
  lastSentMs: number | null;
  /** The message ID of the currently pinned oldest-unanswered card, so we only
   * re-pin when the oldest changes. */
  pinnedOldestMessageId?: number | null;
}

/**
 * A FUNCTION, not a shared const.
 *
 * This was `const EMPTY = { asked: {}, ... }` and both returns below spread it.
 * A spread is shallow, so every empty read handed back the SAME `asked` and
 * `answered` objects, and the first `state.asked[id] = ...` mutated the
 * module-level literal for the life of the process. Every later read that fell
 * to the empty path inherited whatever had accumulated in it.
 *
 * Mostly invisible in production, because the state file almost always exists
 * and the mutated copy gets written straight back out. It bites exactly when
 * it hurts: if the file is missing, unreadable, or corrupt mid-run, the
 * "fresh" state is not fresh - it carries stale `asked` entries that suppress
 * cards as already-sent and stale `answered` entries that suppress them for
 * good, on the one code path whose whole job is to start clean.
 *
 * Caught 2026-08-26 by the daily-batch tests, where each test started with the
 * previous test's cards already asked despite a cleared filesystem.
 */
function empty(): BacklogGrillState {
  return { asked: {}, answered: {}, activeTaskId: null, lastSentMs: null };
}

export async function readState(): Promise<BacklogGrillState> {
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(STATE_PATH, 'utf8')) };
  } catch {
    return empty();
  }
}

export async function writeState(s: BacklogGrillState): Promise<void> {
  await fs.mkdir(join(homedir(), '.zao/zoe'), { recursive: true }).catch(() => {});
  await fs.writeFile(STATE_PATH, JSON.stringify(s, null, 2), { mode: 0o600 });
}

/**
 * How many cards are IN FRONT OF HIM right now. This is the backpressure signal.
 *
 * Three things do not count, all for the same reason - none of them is sitting
 * on his phone waiting for a thumb:
 *
 *  - answered: he dealt with it.
 *  - requeued: he answered it once and it is parked at the back of the queue.
 *    If it counted, twenty skips would permanently pin the cap.
 *  - older than `capWindowMs`: sent days ago and long since scrolled past.
 *
 * That last one is the 2026-08-09 jam. Twenty cards sent over two days pinned
 * the cap at 20 and the drip stopped for five days, because the only thing that
 * could lower the count was Zaal answering cards he could no longer find. A
 * backpressure signal that cannot fall on its own is not backpressure, it is a
 * latch - and `grill JAMMED 20/20` printed unchanged on every lane until nobody
 * read it.
 *
 * Aging out of the CAP is not aging out of the QUEUE. The card stays in `asked`
 * forever and comes back through nextTask's re-ask tier, sooner the older it
 * gets. Nothing here deletes anything.
 */
export function outstandingCount(
  s: BacklogGrillState,
  now = Date.now(),
  capWindowMs = DRIP_DEFAULT.capWindowMs,
): number {
  return Object.keys(s.asked).filter((id) => {
    if (s.answered[id] || s.asked[id].requeuedAt) return false;
    const sentAt = Date.parse(s.asked[id].at);
    // An undateable `at` counts. We cannot prove the card has gone quiet, and
    // between flooding him and holding a slot, holding the slot is the safe
    // error.
    if (!Number.isFinite(sentAt)) return true;
    return now - sentAt < capWindowMs;
  }).length;
}

interface BoardTask {
  id: string;
  title: string;
  created_at?: string;
  notes?: string;
  legacy_id?: string;
  metadata?: Record<string, unknown> | null;
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
 * The tiered order is what makes "it comes back at the END of the queue" true.
 * Cards go out oldest-first, so the card Zaal just skipped was by definition the
 * oldest unasked one - simply un-asking it put it straight back at the FRONT and
 * the next tick re-sent the same card, forever, and no other task could ever
 * surface behind it. A requeued task therefore keeps its `asked` mark and waits
 * behind every task that has not been seen at all.
 *
 * TIER 3, THE RE-ASK (2026-08-14). An asked-but-unanswered card used to match
 * neither tier: `fresh` excludes it (it is in `asked`) and `requeued` excludes
 * it (no `requeuedAt`). So it was sent exactly ONCE, ever. Scroll past it and it
 * was gone - while still holding a cap slot forever. Twenty of those is what
 * froze the drip for five days.
 *
 * Eligibility is grill.ts's ladder, imported unchanged: 3h fresh, 2h after a
 * day, 1.5h after three, 45m after a week. Age is measured from `firstAskedAt`,
 * so a card nags HARDER the longer it has gone unanswered rather than expiring.
 *
 * It sits LAST on purpose. The 324 tasks that have never been seen once are the
 * pile Zaal actually wants moving, and a re-ask tier in front of them would
 * recreate the starvation this whole change exists to undo - just with a
 * different set of twenty at the front.
 */
const BOARD_PAGE = 500;
const BOARD_MAX_PAGES = 20;

/**
 * THE FETCH WINDOW (2026-08-24). Every tier above sorts the rows this returns,
 * so a truncated fetch starves the queue in a way no tier can see or undo.
 *
 * It fetched `limit=200` ordered oldest-first. Measured against the live board
 * the same day: 385 open cards, 191 of the oldest 200 already asked. So `fresh`
 * was nearly empty while 185 cards sat OUTSIDE the window - not grilled slowly,
 * never grilled at all. The oldest 200 were a closed set that only shrank when
 * Zaal answered one, and the newest card could not surface until 185 older ones
 * were cleared.
 *
 * Paged rather than raised to a bigger constant: a bigger number is the same bug
 * with a later trigger date. A short page ends the loop, so the window is the
 * board. The page ceiling exists only to bound a runaway and SAYS SO when hit -
 * it never silently returns a partial board.
 *
 * Fails CLOSED. A failed page returns null and the tick simply skips, because
 * grilling off a half-read board reintroduces exactly this starvation.
 */
async function fetchTodoRows(
  c: { root: string; headers: Record<string, string> },
  fetchImpl: typeof fetch,
): Promise<BoardTask[] | null> {
  const out: BoardTask[] = [];
  for (let page = 0; page < BOARD_MAX_PAGES; page++) {
    const url =
      `${c.root}/rest/v1/tasks?status=eq.todo&archived_at=is.null` +
      `&select=id,legacy_id,title,created_at,notes,metadata&order=created_at.asc` +
      `&limit=${BOARD_PAGE}&offset=${page * BOARD_PAGE}`;
    const r = await fetchImpl(url, { headers: c.headers, cache: 'no-store' });
    if (!r.ok) return null;
    const rows = (await r.json()) as BoardTask[];
    out.push(...rows);
    if (rows.length < BOARD_PAGE) return out;
  }
  console.error(
    `[grill] board exceeds ${BOARD_MAX_PAGES * BOARD_PAGE} open cards - tail not scanned`,
  );
  return out;
}

async function nextTask(
  s: BacklogGrillState,
  fetchImpl: typeof fetch,
  now: number,
): Promise<{ task: BoardTask; remaining: number; unasked: number } | null> {
  const c = cfg();
  if (!c) return null;
  const rows = await fetchTodoRows(c, fetchImpl);
  if (!rows) return null;
  // A never-asked task whose notes already carry a terminal grill verdict was
  // ruled on from the other end - sending it a phone card would be the exact
  // both-ends dupe this card exists to kill (6b6875d1). It still shows up here
  // if the verdict line is ever removed, so nothing is permanently hidden.
  const fresh = rows.filter((t) => !s.asked[t.id] && !TERMINAL_VERDICT_RE.test(t.notes || ''));
  const requeued = rows
    .filter((t) => s.asked[t.id]?.requeuedAt && !s.answered[t.id])
    .sort((a, b) =>
      String(s.asked[a.id].requeuedAt).localeCompare(String(s.asked[b.id].requeuedAt)),
    );
  const reask = rows
    .filter((t) => {
      const a = s.asked[t.id];
      if (!a || a.requeuedAt || s.answered[t.id]) return false;
      const sentAt = Date.parse(a.at);
      if (!Number.isFinite(sentAt)) return false;
      const firstAt = Date.parse(a.firstAskedAt ?? a.at);
      const age = now - (Number.isFinite(firstAt) ? firstAt : sentAt);
      return now - sentAt >= askCooldownMs(age);
    })
    // Longest since its last card goes first, so the ladder's "nag the old ones
    // harder" survives contact with a tier that holds more than one card.
    .sort((a, b) => Date.parse(s.asked[a.id].at) - Date.parse(s.asked[b.id].at));
  const queue = [...fresh, ...requeued, ...reask];
  if (queue.length === 0) return null;
  return { task: queue[0], remaining: queue.length, unasked: fresh.length };
}

/**
 * The prep-done stamp a lane wrote with `zao-tracker ready`, or null.
 *
 * Keyed on `prep_done_at`, NOT on the presence of a PR link: prep can finish
 * without a PR (a draft written, a person emailed, a number measured), and
 * requiring the link would leave those cards asking "work on it?" - the exact
 * bug. A stamp carrying neither note nor PR still changes the question, which
 * is the part that was wrong.
 */
function readyStamp(task: BoardTask): { pr?: string; note?: string } | null {
  const md = task.metadata;
  if (!md || typeof md !== 'object') return null;
  if (!md.prep_done_at) return null;
  const pr = typeof md.pr === 'string' ? md.pr : undefined;
  const note = typeof md.prep_note === 'string' ? md.prep_note : undefined;
  return { pr, note };
}

export interface GrillTickDeps {
  sendDM: (text: string, buttons: { text: string; data: string }[][]) => Promise<{ message_id: number }>;
  pinMessage?: (messageId: number) => Promise<unknown>;
  unpinMessage?: (messageId: number) => Promise<unknown>;
  /** Zaal's local hour, 0-23 - cards never go out at night. */
  localHour: number;
  now?: number;
  fetchImpl?: typeof fetch;
  /**
   * Which gate to run. Defaults to the drip. The daily batch passes
   * BATCH_DEFAULT, which drops the spacing and the hour window - see the
   * comment on BATCH_DEFAULT for why both had to go and why the cap did not.
   */
  cfg?: DripConfig;
}

/**
 * Find the oldest unanswered card's taskId. Returns null if no unanswered cards.
 * (2026-08-17) Used to maintain pin invariant: the oldest open card is always pinned.
 */
function getOldestUnansweredTaskId(s: BacklogGrillState): string | null {
  const unanswered = Object.entries(s.asked)
    .filter(([taskId]) => !s.answered[taskId])
    .map(([taskId, item]) => ({ taskId, at: Date.parse(item.at) }))
    .sort((a, b) => a.at - b.at);
  return unanswered.length > 0 ? unanswered[0].taskId : null;
}

/**
 * Reconcile the state file with the board (grill unification, card 6b6875d1).
 *
 * Zaal grills from both ends: this drip AND terminal sessions that close tasks
 * or stamp verdict lines directly into notes. Without reconcile the state file
 * keeps counting those as "in front of him" - 23 stale entries were
 * hand-reconciled on 2026-08-19 and the count could never reach zero on its
 * own (noisy-signal-guard: a number that cannot fall is a latch, not a signal).
 *
 * Every unanswered asked-entry (requeued ones included - a terminal close ends
 * a parked card too) is checked against the board in chunks:
 *  - task closed / archived / deleted -> answered {verdict: 'board-closed'}
 *  - still todo but notes carry a terminal verdict -> {verdict: 'verdict-synced'}
 *
 * A failed chunk fetch marks NOTHING from that chunk - a card we could not
 * check is a card we cannot prove is dealt with, and between over-counting and
 * silently dropping a live card, over-counting is the safe error (same call as
 * outstandingCount's undateable-`at` case). Mutates `state`; the caller writes.
 */
export async function reconcileBacklogState(
  state: BacklogGrillState,
  fetchImpl: typeof fetch,
  now: number,
): Promise<{ boardClosed: number; verdictSynced: number }> {
  const c = cfg();
  const result = { boardClosed: 0, verdictSynced: 0 };
  if (!c) return result;
  const pending = Object.keys(state.asked).filter((id) => !state.answered[id]);
  if (pending.length === 0) return result;

  const at = new Date(now).toISOString();
  const CHUNK = 50;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const ids = pending.slice(i, i + CHUNK);
    const url =
      `${c.root}/rest/v1/tasks?id=in.(${ids.join(',')})` +
      `&select=id,status,archived_at,notes`;
    let rows: Array<{ id: string; status?: string; archived_at?: string | null; notes?: string | null }>;
    try {
      const r = await fetchImpl(url, { headers: c.headers, cache: 'no-store' });
      if (!r.ok) continue;
      rows = await r.json();
    } catch {
      continue;
    }
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const id of ids) {
      const verdict = classifyReconcile(byId.get(id));
      if (!verdict) continue;
      state.answered[id] = { at, verdict };
      // A parked (requeued) card that the board settled is settled - clear the
      // park mark so applyBacklogAnswer's requeue bookkeeping never revives it.
      if (state.asked[id]?.requeuedAt) delete state.asked[id].requeuedAt;
      if (state.activeTaskId === id) state.activeTaskId = null;
      if (verdict === 'board-closed') result.boardClosed++;
      else result.verdictSynced++;
    }
  }
  return result;
}

/**
 * One tick. Sends at most ONE card, or nothing.
 *
 * Returns what it did so the scheduler can log it - a silent tick that did
 * nothing is indistinguishable from a broken one otherwise.
 */
export async function runBacklogGrillTick(
  deps: GrillTickDeps,
): Promise<{ sent: boolean; reason: string; title?: string; card?: GrillQueueCard }> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now();
  // `gateCfg`, not `cfg`: cfg() is already the tracker's credentials in this
  // file and shadowing it here silently turned the guard below into a call on
  // a config object.
  const gateCfg = deps.cfg ?? DRIP_DEFAULT;
  if (!cfg()) return { sent: false, reason: 'tracker not configured' };

  const state = await readState();
  // Reconcile BEFORE the gate: outstandingCount must reflect what would
  // actually still be sent, or a terminal sweep leaves the drip jammed on
  // cards the board already closed.
  const rec = await reconcileBacklogState(state, fetchImpl, now);
  if (rec.boardClosed || rec.verdictSynced) {
    await writeState(state);
    console.log(
      `[zoe/backlog-grill] reconciled: ${rec.boardClosed} board-closed, ${rec.verdictSynced} verdict-synced`,
    );
  }
  const next = await nextTask(state, fetchImpl, now);
  if (!next) return { sent: false, reason: 'nothing left to ask about' };

  const gate = shouldSendNext({
    nowMs: now,
    localHour: deps.localHour,
    lastSentMs: state.lastSentMs,
    outstanding: outstandingCount(state, now, gateCfg.capWindowMs),
    remainingInQueue: next.remaining,
    cfg: gateCfg,
  });
  if (!gate.send) return { sent: false, reason: gate.reason };

  // `unasked`, not `remaining`: a requeued task is already inside `asked`, so
  // counting the queue length here would count it twice in the "3/357" line.
  const total = Object.keys(state.asked).length + next.unasked;
  const index = Object.keys(state.asked).length + 1;
  const why = (next.task.notes || '').split('\n')[0];
  const text = renderCard(
    {
      title: next.task.title,
      createdAt: next.task.created_at,
      why,
      pr: extractPrRef(next.task.notes),
      ready: readyStamp(next.task),
    },
    { index, total },
    now,
  );

  const sent = await deps.sendDM(text, verdictButtons(next.task.id));
  const messageId = sent.message_id;

  // Rewritten wholesale, which clears any `requeuedAt`: it has now come round
  // again, so it is an ordinary open card until it is answered a second time.
  // `firstAskedAt` is the one thing carried across, because it is what makes an
  // old card nag harder - reset it on every re-send and the ladder would read
  // every card as brand new and never climb.
  const prior = state.asked[next.task.id];
  const sentAt = new Date(now).toISOString();
  state.asked[next.task.id] = {
    at: sentAt,
    title: next.task.title,
    firstAskedAt: prior?.firstAskedAt ?? prior?.at ?? sentAt,
    messageId,
  };
  state.activeTaskId = next.task.id;
  state.lastSentMs = now;

  // Pin the oldest unanswered card (if pinning is available and oldest changed).
  // Only re-pin when the identity changes, never on every send, to avoid churn.
  const oldestTaskId = getOldestUnansweredTaskId(state);
  if (oldestTaskId && deps.pinMessage) {
    const oldestCard = state.asked[oldestTaskId];
    if (oldestCard?.messageId && state.pinnedOldestMessageId !== oldestCard.messageId) {
      // Unpin the previous pin if it exists and is different
      if (state.pinnedOldestMessageId && deps.unpinMessage) {
        await deps.unpinMessage(state.pinnedOldestMessageId).catch(() => {});
      }
      // Pin the new oldest card
      await deps.pinMessage(oldestCard.messageId).catch(() => {});
      state.pinnedOldestMessageId = oldestCard.messageId;
    }
  }

  await writeState(state);
  // Only the SENT path. A tick that declined to send has not run in any sense
  // worth reporting, and saying otherwise makes the line mean 'the cron fired'.
  featureRan('backlog-grill', next.task.title.slice(0, 60));
  return {
    sent: true,
    reason: 'sent',
    title: next.task.title,
    // Returned, not re-fetched: the batch writes the same cards to
    // GRILL-QUEUE.md that it just sent to Telegram, and a second board query
    // could disagree with the first.
    card: {
      taskId: next.task.id,
      title: next.task.title,
      why: why || undefined,
      createdAt: next.task.created_at,
    },
  };
}

/**
 * ONE DAILY BATCH. Replaces the every-two-minutes drip.
 *
 * The drip sent ~190 cards a day from 2026-08-24 and recorded zero answers on
 * the 25th and the 26th while doing it. Zaal, 2026-08-26: one batch a day at
 * his wake time, and every card into the grill lane rather than only Telegram.
 *
 * Sends up to `size` cards back to back, stopping the moment the gate says no -
 * the cap and an empty queue both still stop it, only the clock no longer
 * does. Then appends the whole batch to GRILL-QUEUE.md in one section, so the
 * grill lane can clear the reversible ones under Zaal's standing rule while
 * the same cards sit in his DM for the ones only he can answer.
 *
 * The queue append is best-effort and happens AFTER the sends. A vault that is
 * missing (the VPS has none) or unwritable must not cost him the digest, and
 * the result says which of the two destinations actually took the cards so the
 * caller can log it instead of assuming both worked.
 */
export async function runBacklogGrillBatch(
  deps: GrillTickDeps & { size?: number },
): Promise<{ sent: number; reason: string; queued: string; titles: string[] }> {
  const size = deps.size ?? dailyBatchSize();
  const cards: GrillQueueCard[] = [];
  let reason = 'batch complete';

  for (let i = 0; i < size; i++) {
    const r = await runBacklogGrillTick({ ...deps, cfg: deps.cfg ?? BATCH_DEFAULT });
    if (!r.sent) {
      // The gate's own words. "12 sent, then 200 already unanswered" and
      // "12 sent, then the queue ran dry" are different mornings and the log
      // has to be able to tell them apart.
      reason = cards.length ? `stopped after ${cards.length}: ${r.reason}` : r.reason;
      break;
    }
    if (r.card) cards.push(r.card);
  }

  const q = await appendGrillQueue(cards, { now: deps.now });
  return {
    sent: cards.length,
    reason,
    queued: `${q.wrote}:${q.count}${q.wrote === 'spool' ? ` (${q.path})` : ''}`,
    titles: cards.map((c) => c.title),
  };
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
  pinMessage?: (messageId: number) => Promise<unknown>,
  unpinMessage?: (messageId: number) => Promise<unknown>,
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
    // Feature 2: "Work on it" visible effect - set status to in_progress
    const taskRead = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}&select=title,metadata`, {
      headers: c.headers,
    });
    if (taskRead.ok) {
      const rows = (await taskRead.json()) as Array<{ title?: string; metadata?: Record<string, unknown> }>;
      const task = rows[0];
      const route = task?.metadata?.route as string | undefined;

      // Set status to in_progress
      await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}`, {
        method: 'PATCH',
        headers: { ...c.headers, Prefer: 'return=minimal', 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      }).catch(() => {});

      // Build response message with task title and route meaning
      const routeMeaning =
        route === 'agent'
          ? 'flagged for the fleet - a lane picks it up from the in_progress queue'
          : route === 'prep'
            ? 'marked in progress on your board - the prep side lands with your next fleet dispatch'
            : route === 'human'
              ? 'marked in progress - waiting for you to work on it'
              : 'marked in progress';

      message = v.note
        ? `On it: ${v.note.slice(0, 60)}. ${routeMeaning}`
        : `Working on: ${task?.title ? task.title.slice(0, 50) : 'the task'}. ${routeMeaning}`;
    } else {
      message = v.note ? `On it: ${v.note.slice(0, 80)}` : 'On it - it comes back at the end for confirmation.';
    }
  } else if (v.key === 'skip') {
    message = 'Skipped - it returns later.';
  } else if (v.key === 'park') {
    // Park (card 1b7fe7c9): the task stays OPEN on the board - only a resurface
    // note is appended. Same read-modify-write + fail-closed guard as the close
    // path: notes are replaced wholesale by PATCH, so writing over a failed
    // read would destroy the task's note history.
    const cur = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}&select=notes`, {
      headers: c.headers,
    });
    if (!cur.ok) return { ok: false, message: `could not read that task (${cur.status}) - not parking` };
    const rows = (await cur.json()) as Array<{ notes?: string }>;
    const notes = `${(rows[0]?.notes || '').trim()}\n\n${verdictNote(v, new Date().toISOString().slice(0, 10))}`.trim();
    const patch = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: { ...c.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ notes }),
    });
    if (!patch.ok) return { ok: false, message: `park failed (${patch.status})` };
    message = 'Parked - stays on the board, resurfaces later.';
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
      firstAskedAt: state.asked[taskId]?.firstAskedAt ?? state.asked[taskId]?.at,
      requeuedAt: new Date().toISOString(),
    };
    delete state.answered[taskId];
  }
  // Only the card in play stops being the card in play. Answering an older one
  // from the pile must not orphan the newest card's typed-answer path.
  if (state.activeTaskId === taskId) state.activeTaskId = null;

  // Update pin after answer: if oldest unanswered card changed, repin
  // (2026-08-17). Only re-pin when the identity changes to avoid churn.
  const newOldestTaskId = getOldestUnansweredTaskId(state);
  if (newOldestTaskId && pinMessage) {
    const newOldestCard = state.asked[newOldestTaskId];
    if (newOldestCard?.messageId && state.pinnedOldestMessageId !== newOldestCard.messageId) {
      // Unpin the previous one if it exists and is different
      if (state.pinnedOldestMessageId && unpinMessage) {
        await unpinMessage(state.pinnedOldestMessageId).catch(() => {});
      }
      // Pin the new oldest card
      await pinMessage(newOldestCard.messageId).catch(() => {});
      state.pinnedOldestMessageId = newOldestCard.messageId;
    }
  } else if (!newOldestTaskId && state.pinnedOldestMessageId && unpinMessage) {
    // All cards answered - unpin the last one
    await unpinMessage(state.pinnedOldestMessageId).catch(() => {});
    state.pinnedOldestMessageId = null;
  }

  await writeState(state);
  return { ok: true, message };
}
