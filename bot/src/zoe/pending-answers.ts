/**
 * pending-answers.ts - "the last thing ZOE asked in a chat," so Zaal can answer
 * it by just typing (no swipe, no button).
 *
 * The combo (Zaal 2026-07-29): the ZAAL BOTZ General surface is the gesture-free
 * ANSWER surface - a plain typed message there routes to the last relay/question
 * ZOE pushed. Normal chat lives in the DM and in group topics. So when ZOE pushes
 * a relay or a question to General, it ARMS the qid here; the General handler
 * TAKES it on the next plain message and routes it as "[answer:<qid>]".
 *
 * Separate from index.ts's `pendingTypeAnswers` (which is armed by a Reply-button
 * tap and consumed anywhere in the group). This one is armed automatically on push
 * and consumed only in General - that scoping is what keeps topic chat untouched.
 *
 * In-memory + last-write-wins ("answer the most recent thing"). Resets on bot
 * restart, which is fine: a dropped arm just means Zaal taps Reply or swipes, the
 * fallbacks that always work.
 */

const armed = new Map<number, string>(); // chatId -> qid

/** ZOE pushed something answerable to this chat; the next plain message answers it. */
export function armPendingAnswer(chatId: number, qid: string): void {
  armed.set(chatId, qid);
}

/** Consume the armed qid for this chat (returns + clears it), or undefined if none. */
export function takePendingAnswer(chatId: number): string | undefined {
  const qid = armed.get(chatId);
  if (qid !== undefined) armed.delete(chatId);
  return qid;
}

/** Read without consuming (for tests / diagnostics). */
export function peekPendingAnswer(chatId: number): string | undefined {
  return armed.get(chatId);
}

/** Clear a chat's armed answer without consuming a message (e.g. Zaal chatted instead). */
export function clearPendingAnswer(chatId: number): void {
  armed.delete(chatId);
}
