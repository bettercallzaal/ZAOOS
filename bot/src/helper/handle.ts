/**
 * handle.ts - what the helper does with one incoming message, in the order
 * that matters: who is asking, is it too long, is it a secret, is he asking
 * too fast, is there budget, then the model.
 *
 * Everything it touches is passed in, so the tests can prove the claims the
 * design rests on (doc 2661): a stranger, a pasted secret, a burst, an
 * over-cap question and a cap that cannot be read never reach the model, and
 * every answer carries the footer.
 */
import Anthropic from '@anthropic-ai/sdk';

import { shouldSendOwnerOnlyLine, type OwnerOnlyState } from '../zoe/owner-only';
import { MAX_HISTORY, askModel, buildRequest, type MessagesClient } from './answer';
import {
  CAP_LINE,
  CAP_UNREADABLE_LINE,
  MAX_QUESTION_CHARS,
  OUTGOING_SECRET_LINE,
  SECRET_LINE,
  SLOW_LINE,
  TOO_LONG_LINE,
  capCheck,
  isAllowed,
  looksLikeSecret,
  rateCheck,
  refusalLine,
  withFooter,
  type CapRead,
  type CapState,
} from './gate';

export const START_LINE =
  'I can answer questions about changing and publishing the North Creek website. Ask away.';
export const BUSY_LINE = 'The service I use is busy. Try again in a minute.';
export const ERROR_LINE = 'Something went wrong on my side. Try again, or ask Zaal.';

export interface HelperDeps {
  allowed: readonly number[];
  system: string;
  model: string;
  cap: number;
  client: MessagesClient;
  /** null = no state file yet. 'unreadable' = a file that cannot be trusted. May throw. */
  readCap(): Promise<CapRead>;
  /** May throw; a count that cannot be saved is a question that is not asked. */
  writeCap(state: CapState): Promise<void>;
  now(): Date;
  /** Once-an-hour limiter for the refusal line, so a stranger cannot make the bot spam. */
  refusals: OwnerOnlyState;
  /** Recent turns per user. Memory only; never written to disk. */
  history: Map<number, Anthropic.MessageParam[]>;
  /** Recent question times per user, for the burst limit. Memory only. */
  recent: Map<number, number[]>;
}

export interface Incoming {
  chatType: string;
  fromId: number | undefined;
  text: string;
}

export type Outcome =
  | { kind: 'ignored' }
  | { kind: 'refused'; reply: string | null }
  | { kind: 'start' | 'too-long' | 'secret' | 'slowed' | 'capped' | 'cap-unreadable'; reply: string }
  | { kind: 'failed'; reply: string; what: string }
  | {
      kind: 'answered' | 'declined';
      reply: string;
      inputTokens: number;
      outputTokens: number;
      countToday: number;
    };

export async function handleMessage(deps: HelperDeps, msg: Incoming): Promise<Outcome> {
  if (msg.chatType !== 'private') return { kind: 'ignored' };

  const fromId = msg.fromId;
  if (fromId === undefined) return { kind: 'ignored' };
  const nowMs = deps.now().getTime();
  if (!isAllowed(deps.allowed, fromId)) {
    const say = shouldSendOwnerOnlyLine(deps.refusals, fromId, nowMs);
    return { kind: 'refused', reply: say ? withFooter(refusalLine(fromId)) : null };
  }

  const text = msg.text.trim();
  if (!text) return { kind: 'ignored' };
  if (text === '/start') return { kind: 'start', reply: withFooter(START_LINE) };
  if (text.length > MAX_QUESTION_CHARS) return { kind: 'too-long', reply: withFooter(TOO_LONG_LINE) };
  if (looksLikeSecret(text)) return { kind: 'secret', reply: withFooter(SECRET_LINE) };

  const rate = rateCheck(deps.recent.get(fromId) ?? [], nowMs);
  deps.recent.set(fromId, rate.stamps);
  if (!rate.allowed) return { kind: 'slowed', reply: withFooter(SLOW_LINE) };

  // Counted before the call, so a failing model cannot be retried for free.
  // A cap that cannot be read or saved answers nobody: it never counts from zero.
  let countToday: number;
  try {
    const check = capCheck(await deps.readCap(), deps.now(), deps.cap);
    if (!check.allowed) {
      return check.reason === 'capped'
        ? { kind: 'capped', reply: withFooter(CAP_LINE) }
        : { kind: 'cap-unreadable', reply: withFooter(CAP_UNREADABLE_LINE) };
    }
    await deps.writeCap(check.next);
    countToday = check.next.count;
  } catch {
    return { kind: 'cap-unreadable', reply: withFooter(CAP_UNREADABLE_LINE) };
  }

  const turns = deps.history.get(fromId) ?? [];
  try {
    const res = await askModel(deps.client, buildRequest(deps.system, turns, text, deps.model));
    // The same check on the way out. The model holds no secrets, so this should
    // never fire; if it does, the text is not sent and not remembered.
    if (looksLikeSecret(res.text)) {
      res.text = OUTGOING_SECRET_LINE;
      res.answered = false;
    }
    if (res.answered) {
      const next = [
        ...turns,
        { role: 'user', content: text } as const,
        { role: 'assistant', content: res.text } as const,
      ];
      deps.history.set(fromId, next.slice(-MAX_HISTORY));
    }
    return {
      kind: res.answered ? 'answered' : 'declined',
      reply: withFooter(res.text),
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
      countToday,
    };
  } catch (error: unknown) {
    // One fixed line to the user, the error class to the log. No retry here:
    // the SDK already retried, and the question has been counted.
    if (error instanceof Anthropic.RateLimitError) {
      return { kind: 'failed', reply: withFooter(BUSY_LINE), what: 'rate limited' };
    }
    const what =
      error instanceof Anthropic.APIError
        ? `API ${error.status ?? 'error'}`
        : error instanceof Error
          ? error.name
          : 'unknown';
    return { kind: 'failed', reply: withFooter(ERROR_LINE), what };
  }
}

/**
 * The one line written to the journal for a message, or null for none.
 * It carries the sender's numeric id, sizes and counts. It never carries what
 * he typed or what the model said, and this function is not given either.
 */
export function logLine(out: Outcome, fromId: number | undefined, chars: number, cap: number): string | null {
  switch (out.kind) {
    case 'ignored':
      return null;
    case 'refused':
      // Logged once an hour with the line itself: the id is how Zaal adds him.
      return out.reply ? `[helper] refused user ${fromId}` : null;
    case 'answered':
    case 'declined':
      return (
        `[helper] ${out.kind} user ${fromId}: ${chars} chars in, ` +
        `${out.inputTokens} + ${out.outputTokens} tokens, ${out.countToday} of ${cap} today`
      );
    case 'failed':
      return `[helper] model call failed for user ${fromId}: ${out.what}`;
    default:
      return `[helper] ${out.kind} user ${fromId}`;
  }
}
