/**
 * tg-chunk.ts - split + send long text to Telegram in <=4096-char messages.
 *
 * Telegram hard-rejects (or truncates) any single message over 4096 chars. Long
 * bot output - repo-improver/site audits especially - was sent via a raw
 * bot.api.sendMessage and got cut off mid-sentence (the ZONEXUS / The-ZAO audits,
 * 2026-07-29). Raising the LLM output cap made it WORSE (longer text -> hit the
 * Telegram limit harder). The real fix is chunking the SEND. Shared so any
 * autonomous-notify path can use it, not just the concierge reply.
 */

// 3900 leaves headroom under 4096 for the "(n/m) " prefix + markdown.
const TELEGRAM_MAX = 3900;

/** Split into Telegram-sized chunks, preferring paragraph -> line -> word
 *  boundaries; hard-cuts only if no boundary is found in the back half. Pure. */
export function chunkForTelegram(text: string, max = TELEGRAM_MAX): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

export interface SendChunkedOpts {
  /** Options attached to EVERY chunk (e.g. message_thread_id). */
  baseOpts?: Record<string, unknown>;
  /** Inline keyboard attached to exactly one chunk. */
  replyMarkup?: unknown;
  /** Which chunk carries replyMarkup. Default 'first' (matches the router);
   *  use 'last' when a reply/keyboard must be at the bottom (drafts, relays). */
  markupOn?: 'first' | 'last';
}

/** What a chunked send actually delivered. `result` is what
 *  `sendChunkedToTelegram` returns; the counts are what it cannot express. */
export interface ChunkedSendReport {
  /** Last successful send, preferring the chunk that carried the markup. */
  result: unknown;
  /** Chunks the text was split into. */
  total: number;
  /** Chunks whose send resolved. */
  sent: number;
  /** Chunks whose send threw. `sent + failed === total`. */
  failed: number;
}

/**
 * Send chunked, and report how much of it actually left.
 *
 * `sendChunkedToTelegram` returns the last successful send, which answers
 * "did ANY chunk arrive" and cannot answer "did ALL of them". Those differ:
 * chunk 1 succeeding and chunk 2 throwing returns a truthy message while half
 * the text is gone, so a caller that records durable state on a truthy result -
 * clearing a queue, marking a row pushed - loses the rest permanently, with the
 * run logged as a success. Any caller whose success branch is destructive must
 * gate on `failed === 0`, not on the return value.
 *
 * A chunk blocked by the send budget RESOLVES rather than throwing, so it counts
 * as `sent` here; use `wasSendBlocked(report.result)` for that case, as before.
 */
export async function sendChunkedDetailed(
  send: (chatId: number, text: string, opts?: Record<string, unknown>) => Promise<unknown>,
  chatId: number,
  text: string,
  opts?: SendChunkedOpts,
): Promise<ChunkedSendReport> {
  const chunks = chunkForTelegram(text);
  const markupOn = opts?.markupOn ?? 'first';
  let last: unknown = null;
  let markupResult: unknown = null;
  let failed = 0;
  for (let i = 0; i < chunks.length; i++) {
    const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : '';
    const carriesMarkup =
      opts?.replyMarkup !== undefined &&
      (markupOn === 'first' ? i === 0 : i === chunks.length - 1);
    const sendOpts: Record<string, unknown> = { ...(opts?.baseOpts ?? {}) };
    if (carriesMarkup) sendOpts.reply_markup = opts?.replyMarkup;
    try {
      // Arity preserved for plain sends - some grammy call sites (and their
      // tests) treat a trailing undefined options arg as a different call.
      last = Object.keys(sendOpts).length
        ? await send(chatId, prefix + chunks[i], sendOpts)
        : await send(chatId, prefix + chunks[i]);
      if (carriesMarkup) markupResult = last;
    } catch (err) {
      // One chunk failing must not drop the others - but it must not be silent
      // either. This was the only record that part of a message never left, and
      // there wasn't one (silent-failure-guard.md rule 6: a soft-fail is loud).
      failed += 1;
      console.warn(
        `[zoe/tg-chunk] chunk ${i + 1}/${chunks.length} to chat ${chatId} failed:`,
        (err as Error).message,
      );
    }
  }
  // Context-arming callers need the message that carries the keyboard.
  return { result: markupResult ?? last, total: chunks.length, sent: chunks.length - failed, failed };
}

/** Send a possibly-long message to a chat as one or more Telegram messages,
 *  prefixed "(n/m)" when split. Best-effort - a failed chunk does not abort the
 *  rest. `send` is bot.api.sendMessage (injected for testability).
 *  Returns the result of the last SUCCESSFUL send (null if every chunk failed) -
 *  callers that arm reply-context need the message that carries the keyboard,
 *  so pair `markupOn: 'last'` with the returned message.
 *  A truthy return does NOT mean every chunk arrived; a caller that acts
 *  destructively on success wants `sendChunkedDetailed` and `failed === 0`. */
export async function sendChunkedToTelegram(
  send: (chatId: number, text: string, opts?: Record<string, unknown>) => Promise<unknown>,
  chatId: number,
  text: string,
  opts?: SendChunkedOpts,
): Promise<unknown> {
  return (await sendChunkedDetailed(send, chatId, text, opts)).result;
}
