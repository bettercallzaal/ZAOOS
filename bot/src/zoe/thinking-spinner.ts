/**
 * Thinking spinner - a visible "ZOE is working" line inside the chat itself.
 *
 * Telegram's native 'typing' action shows only in the chat header and clears
 * after ~5s, so on a phone a 20s concierge turn reads as silence. On a turn
 * that runs past START_DELAY_MS this sends ONE placeholder ("thinking |"),
 * cycles | / - \ by editing that same message, and then either edits the
 * placeholder into the final answer or deletes it so the caller can send the
 * answer normally. The chat never fills with spinner messages.
 *
 * Idea from Tom Fellenz (ZAO member), 16 Oct 2026: "a spinning line while she
 * is thinking... /|\-/|\- etc".
 *
 * Gated by ZOE_THINKING_SPINNER=1 (default OFF). The native typing action keeps
 * running either way; this is additive.
 */

export const SPINNER_FRAMES = ['|', '/', '-', '\\'] as const;
/** A fast reply (most chat) never sees a placeholder at all. */
export const SPINNER_START_DELAY_MS = 1500;
/** Telegram rate-limits edits; never edit the placeholder faster than this. */
export const SPINNER_MIN_EDIT_MS = 1000;
/** Telegram's hard per-message text limit. Longer answers get a fresh send. */
export const TELEGRAM_TEXT_LIMIT = 4096;

export function thinkingSpinnerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_THINKING_SPINNER === '1';
}

export function spinnerFrame(label: string, tick: number): string {
  return `${label} ${SPINNER_FRAMES[tick % SPINNER_FRAMES.length]}`;
}

export interface SpinnerDeps {
  /** Send the placeholder; resolve its message id, or null if the send failed. */
  send: (text: string) => Promise<number | null>;
  edit: (messageId: number, text: string) => Promise<void>;
  remove: (messageId: number) => Promise<void>;
}

export interface SpinnerOptions {
  label?: string;
  startDelayMs?: number;
  /** Clamped up to SPINNER_MIN_EDIT_MS. */
  intervalMs?: number;
}

export interface ThinkingSpinner {
  /**
   * Turn the placeholder into the answer. Resolves true when the answer is now
   * on screen (the placeholder was edited into it); false when the caller must
   * send the answer itself (no placeholder yet, answer too long, or the edit
   * failed - in which case the placeholder has been removed).
   */
  deliver: (text: string) => Promise<boolean>;
  /** Stop cycling and remove the placeholder if it is still a spinner. Idempotent. */
  stop: () => Promise<void>;
}

/** A no-op spinner for when the flag is off: deliver always defers to the caller. */
export const NO_SPINNER: ThinkingSpinner = {
  deliver: async () => false,
  stop: async () => {},
};

export function startThinkingSpinner(deps: SpinnerDeps, opts: SpinnerOptions = {}): ThinkingSpinner {
  const label = opts.label ?? 'thinking';
  const startDelayMs = opts.startDelayMs ?? SPINNER_START_DELAY_MS;
  const intervalMs = Math.max(opts.intervalMs ?? SPINNER_MIN_EDIT_MS, SPINNER_MIN_EDIT_MS);

  let finished = false;
  let tick = 0;
  let messageId: number | null = null;
  let sending: Promise<void> | null = null;
  let editing: Promise<void> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;

  const clearTimers = (): void => {
    clearTimeout(startTimer);
    if (interval) clearInterval(interval);
    interval = null;
  };

  const startTimer = setTimeout(() => {
    if (finished) return;
    sending = deps
      .send(spinnerFrame(label, tick))
      .then((id) => {
        messageId = id;
        if (id === null || finished) return;
        interval = setInterval(() => {
          // Skip a tick while the previous edit is in flight, so a slow API can
          // never stack edits past the rate limit.
          if (finished || editing || messageId === null) return;
          tick += 1;
          editing = deps
            .edit(messageId, spinnerFrame(label, tick))
            .catch(() => {})
            .finally(() => {
              editing = null;
            });
        }, intervalMs);
      })
      .catch(() => {
        messageId = null;
      });
  }, startDelayMs);

  // Settle the placeholder: wait for any in-flight send/edit so a late frame
  // cannot overwrite the answer, and return the placeholder id (or null).
  const settle = async (): Promise<number | null> => {
    finished = true;
    clearTimers();
    if (sending) await sending;
    if (editing) await editing;
    return messageId;
  };

  let done: Promise<boolean> | null = null;

  return {
    deliver: (text: string) => {
      if (done) return done.then(() => false);
      done = (async () => {
        const id = await settle();
        if (id === null) return false;
        if (text.length > 0 && text.length <= TELEGRAM_TEXT_LIMIT) {
          try {
            await deps.edit(id, text);
            return true;
          } catch {
            // fall through: remove the spinner, caller sends the answer
          }
        }
        await deps.remove(id).catch(() => {});
        return false;
      })();
      return done;
    },
    stop: async () => {
      if (done) {
        await done;
        return;
      }
      done = (async () => {
        const id = await settle();
        if (id !== null) await deps.remove(id).catch(() => {});
        return false;
      })();
      await done;
    },
  };
}
