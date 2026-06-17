// Per-chat turn queue (doc 872 - live steering, "finish then apply").
//
// ZOE runs on grammY's default bot.start(), which processes updates
// SEQUENTIALLY: a long concierge turn (a multi-second Claude CLI call) blocks
// the whole bot's poll loop, and a follow-up message isn't even delivered until
// the current turn returns. That makes mid-task steering impossible and freezes
// every chat behind one slow turn.
//
// The fix is to run each turn off the poll loop (the .on handler enqueues and
// returns immediately, so grammY keeps polling) and serialize per chat here.
// Turns for the SAME chat run one-at-a-time in arrival order ("finish then
// apply"): if Zaal sends a new message mid-turn, it waits for the current turn
// to finish, then runs. Different chats are independent.

export type TurnFn = () => Promise<void>;

interface ChatQueue {
  /** resolves when the last-enqueued turn for this chat settles */
  tail: Promise<unknown>;
  /** turns queued or running for this chat (>=1 while active) */
  depth: number;
}

const queues = new Map<number, ChatQueue>();

/** Turns currently queued or running for a chat (0 if idle). */
export function pendingTurns(chatId: number): number {
  return queues.get(chatId)?.depth ?? 0;
}

/** Is a turn already running/queued for this chat? */
export function isChatBusy(chatId: number): boolean {
  return pendingTurns(chatId) > 0;
}

export interface EnqueueHooks {
  /**
   * Fired synchronously when a turn is enqueued BEHIND an in-flight turn for
   * the same chat (i.e. it will be deferred). Use it to ack "got it, I'll get
   * to this after the current one". Not fired for the first/only turn.
   */
  onDeferred?: () => void;
}

/**
 * Enqueue a turn for a chat. Returns a promise that resolves when THIS turn has
 * finished. Turns for the same chat run sequentially in call order; a turn is
 * never started until the previous one settles (success or failure).
 */
export function enqueueTurn(chatId: number, run: TurnFn, hooks?: EnqueueHooks): Promise<void> {
  const existing = queues.get(chatId);
  const wasBusy = (existing?.depth ?? 0) > 0;
  const q: ChatQueue = existing ?? { tail: Promise.resolve(), depth: 0 };
  q.depth += 1;
  queues.set(chatId, q);

  if (wasBusy) {
    try {
      hooks?.onDeferred?.();
    } catch {
      // never let an ack failure break the chain
    }
  }

  // Chain after the prior turn regardless of how it settled, so one failure
  // can't wedge the queue.
  const settled = q.tail.then(run, run).finally(() => {
    q.depth -= 1;
    if (q.depth <= 0 && queues.get(chatId) === q) {
      queues.delete(chatId);
    }
  });
  // The tail must never reject, or the next `.then(run, run)` would still run
  // (fine) but unhandled rejections would surface. Swallow here.
  q.tail = settled.catch(() => undefined);
  return settled;
}

/** Test/maintenance helper: drop all queue state. */
export function _resetTurnQueues(): void {
  queues.clear();
}
