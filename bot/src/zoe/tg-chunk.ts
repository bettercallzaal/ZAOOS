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

/** Send a possibly-long message to a chat as one or more Telegram messages,
 *  prefixed "(n/m)" when split. Best-effort - a failed chunk does not abort the
 *  rest. `send` is bot.api.sendMessage (injected for testability). */
export async function sendChunkedToTelegram(
  send: (chatId: number, text: string) => Promise<unknown>,
  chatId: number,
  text: string,
): Promise<void> {
  const chunks = chunkForTelegram(text);
  for (let i = 0; i < chunks.length; i++) {
    const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : '';
    try {
      await send(chatId, prefix + chunks[i]);
    } catch {
      // one chunk failing must not drop the others
    }
  }
}
