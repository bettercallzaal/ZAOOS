/**
 * live-status.ts - one message that updates in place, instead of six new ones.
 *
 * FOUND BY READING THE TELEGRAM BOT API CHANGELOG (2026-08-07), which is the
 * cheapest way to answer "what are we missing" - it is the authoritative list of
 * what the platform can do, and the gap is whatever we never adopted.
 *
 * The gap it exposed was not a new API. ZOE only ever calls editMessageText from
 * inside a button callback (editing the message the tap came from); it has never
 * held a message id and updated it over time. So a single DM build emitted up to
 * six separate messages - start, coder done, critic pushback, retry, PR - which
 * on a phone is a screenful of near-identical blocks you have to scroll past to
 * find the one line that matters. Telegram has supported editing since forever;
 * we were just not using it.
 *
 * A build is ONE event. It should be ONE message that changes.
 *
 * ALSO NOTED, NOT YET BUILDABLE: Bot API 10.1 (2026-06-11) added Rich Messages
 * explicitly "allowing bots to ... stream AI-generated replies with seamless rich
 * formatting", including an InputRichBlockThinking block, and 10.2 (2026-07-14)
 * added Ephemeral Messages (group messages visible to one user). Those are the
 * real end state for an agent surface.
 *
 * CORRECTION (2026-08-07): an earlier version of this comment said the repo runs
 * grammy ^1.29.0. That is the RANGE in package.json, not what is installed - the
 * lockfile pins 1.42.0 and the live bot confirms 1.42.0. Read the lockfile, not
 * the range; a caret range tells you the floor, never the version.
 *
 * The conclusion survives the correction, for a different reason. grammy 1.42.0
 * ships @grammyjs/types 3.26.0 (2026-04-03), which predates both API releases -
 * verified by grepping the installed package for InputRichMessage, RichTextBold,
 * ephemeral_message_id, receiver_user_id and Community: zero occurrences of any
 * of them. So the types genuinely are absent; the version number was just wrong.
 *
 * THE REAL BLOCKER IS NOT THE VERSION. grammy 1.42.0 -> 1.45.1 is a minor bump
 * (same major, semver-safe at runtime), and 1.45.1 pulls @grammyjs/types 4.0.0,
 * released 2026-07-15 - one day after Bot API 10.2 - so it almost certainly
 * carries these types. But grammy's types DO NOT RESOLVE in this repo's tsconfig
 * at all: 21 files carry `TS2307: Cannot find module 'grammy'`, which is why
 * every ctx parameter is implicitly `any`. Upgrading into that would mean writing
 * Rich Message calls with no type checking whatsoever. Fix the type resolution
 * first, then upgrade, then build on it - in that order.
 *
 * DESIGN NOTES THAT MATTER IN PRACTICE
 *
 * - Telegram rejects an edit whose text is byte-identical ("message is not
 *   modified"). That is an error response, not a no-op, so identical renders are
 *   skipped before the call rather than after.
 * - Edits are rate-limited per chat. Updates are throttled, and the LAST state
 *   always lands - a dropped intermediate frame is invisible, a dropped final
 *   frame is a lie.
 * - If the message is gone (deleted, too old), fall back to sending a new one.
 *   Losing the thread of a running build is worse than an extra message.
 */

import { featureRan } from './feature-ran';

export interface LiveStatusDeps {
  send: (text: string, replyMarkup?: unknown) => Promise<number | null>;
  edit: (messageId: number, text: string, replyMarkup?: unknown) => Promise<void>;
  /** Injected so tests are deterministic and do not sleep. */
  now?: () => number;
}

/** Minimum gap between edits. Telegram tolerates roughly one edit per second per
 *  chat; 1200ms leaves headroom without feeling laggy. */
export const MIN_EDIT_INTERVAL_MS = 1200;

export class LiveStatus {
  private messageId: number | null = null;
  private lastText = '';
  private lastEditAt = 0;
  /** Set when a render was throttled, so flush() knows it owes an update. */
  private pending: { text: string; markup?: unknown } | null = null;
  private readonly now: () => number;

  constructor(private deps: LiveStatusDeps) {
    this.now = deps.now ?? (() => Date.now());
  }

  /**
   * Show `text`. Sends on the first call, edits after that.
   *
   * `force` bypasses the throttle - used for terminal states (the PR link, a
   * failure), because those must never be the frame that got dropped.
   */
  async render(text: string, markup?: unknown, force = false): Promise<void> {
    if (this.messageId === null) {
      const id = await this.deps.send(text, markup).catch(() => null);
      this.messageId = id;
      this.lastText = text;
      this.lastEditAt = this.now();
      return;
    }

    // Telegram treats an identical edit as an error, not a no-op.
    if (text === this.lastText) return;

    const since = this.now() - this.lastEditAt;
    if (!force && since < MIN_EDIT_INTERVAL_MS) {
      this.pending = { text, markup };
      return;
    }

    await this.write(text, markup);
  }

  /** Push any throttled update through. Call before finishing so the last
   *  intermediate state is not silently lost. */
  async flush(): Promise<void> {
    if (!this.pending) return;
    const { text, markup } = this.pending;
    this.pending = null;
    if (text === this.lastText) return;
    await this.write(text, markup);
  }

  private async write(text: string, markup?: unknown): Promise<void> {
    if (this.messageId === null) return;
    try {
      await this.deps.edit(this.messageId, text, markup);
      this.lastText = text;
      this.lastEditAt = this.now();
      this.pending = null;
    } catch {
      // The message is probably gone - deleted, or older than Telegram's edit
      // window. Losing the thread of a running build is worse than an extra
      // message, so start a new one and keep going.
      const id = await this.deps.send(text, markup).catch(() => null);
      this.messageId = id;
      this.lastText = text;
      this.lastEditAt = this.now();
      this.pending = null;
    }
  }

  /** The live message's id, once it exists. */
  get id(): number | null {
    return this.messageId;
  }
}

/**
 * Render a build's state as one block.
 *
 * The shape is deliberate: the CURRENT phase is the first line, because on a
 * phone that is often the only line visible in a notification. History goes
 * underneath, oldest first, so the message reads as a growing log rather than
 * something that reshuffles under you.
 */
export function renderBuildStatus(opts: {
  task: string;
  phase: string;
  history: string[];
  elapsedSec: number;
  done?: boolean;
}): string {
  featureRan('live-status');
  const { task, phase, history, elapsedSec, done } = opts;
  const elapsed = elapsedSec < 90 ? `${elapsedSec}s` : `${Math.round(elapsedSec / 60)}m`;
  const head = done ? phase : `${phase} - ${elapsed}`;
  const lines = [head, '', `"${task.slice(0, 140)}"`];
  if (history.length > 0) {
    lines.push('');
    // Keep the tail: on a long run the recent steps are what you want, and an
    // unbounded log would eventually blow Telegram's 4096-char message cap.
    lines.push(...history.slice(-6).map((h) => `- ${h}`));
  }
  return lines.join('\n');
}
