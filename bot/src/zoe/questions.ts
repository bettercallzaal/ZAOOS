/**
 * questions.ts - one-question-at-a-time buttons for the orchestrator loop.
 *
 * An open Claude Code session (the conductor) posts a single question to the
 * ZAAL BOTZ Claude Code topic with tappable answer buttons + a "Type my own"
 * button (freetext) + optional multi-choice. Zaal taps or types; the answer is
 * logged to recent/ so the session reads it via the inbox bridge and posts the
 * next question. Pure helpers so they unit-test without grammy.
 *
 * callback_data is "q:<qid>:<base64url(value)>" - base64 so an option's text
 * can't collide with the ':' delimiter. Telegram caps callback_data at 64 bytes,
 * so keep qids short and option labels concise (use "Type my own" for anything long).
 */

/** A tapped answer: the question id + the decoded value ('__type__' = freetext). */
export interface ParsedQuestion {
  qid: string;
  value: string;
  isType: boolean;
}

export const TYPE_SENTINEL = '__type__';

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url');
}

/** Build the callback_data for one answer. */
export function encodeQuestion(qid: string, value: string): string {
  return `q:${qid}:${b64urlEncode(value)}`;
}

/** Inline keyboard: one button per option (one per row for tap-safety on mobile),
 *  then a "Type my own" freetext button unless suppressed. */
export function questionKeyboard(
  qid: string,
  options: string[],
  includeType = true,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const rows = options.map((o) => [{ text: o, callback_data: encodeQuestion(qid, o) }]);
  if (includeType) {
    rows.push([{ text: 'Type my own', callback_data: encodeQuestion(qid, TYPE_SENTINEL) }]);
  }
  return { inline_keyboard: rows };
}

/** Parse a "q:<qid>:<b64>" callback, or null if it is not a question callback. */
export function parseQuestionCallback(data: string): ParsedQuestion | null {
  if (!data.startsWith('q:')) return null;
  const rest = data.slice(2);
  const sep = rest.indexOf(':');
  if (sep < 0) return null;
  const qid = rest.slice(0, sep);
  if (!qid) return null;
  let value: string;
  try {
    value = Buffer.from(rest.slice(sep + 1), 'base64url').toString('utf8');
  } catch {
    return null;
  }
  return { qid, value, isType: value === TYPE_SENTINEL };
}
