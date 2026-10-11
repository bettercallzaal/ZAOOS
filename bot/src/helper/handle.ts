/**
 * handle.ts - what the helper does with one incoming message, in the order
 * that matters: who is asking, is it a secret, is there budget, then the model.
 *
 * Everything it touches is passed in, so the tests can prove the two claims the
 * design rests on (doc 2661): a stranger, a pasted secret and an over-cap
 * question never reach the model, and every answer carries the footer.
 */
import Anthropic from '@anthropic-ai/sdk';

import { shouldSendOwnerOnlyLine, type OwnerOnlyState } from '../zoe/owner-only';
import { MAX_HISTORY, askModel, buildRequest, type MessagesClient } from './answer';
import {
  CAP_LINE,
  SECRET_LINE,
  capCheck,
  isAllowed,
  looksLikeSecret,
  refusalLine,
  withFooter,
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
  /** null when there is no readable state yet. */
  readCap(): Promise<CapState | null>;
  writeCap(state: CapState): Promise<void>;
  now(): Date;
  /** Once-an-hour limiter for the refusal line, so a stranger cannot make the bot spam. */
  refusals: OwnerOnlyState;
  /** Recent turns per user. Memory only; never written to disk. */
  history: Map<number, Anthropic.MessageParam[]>;
}

export interface Incoming {
  chatType: string;
  fromId: number | undefined;
  text: string;
}

export type Outcome =
  | { kind: 'ignored' }
  | { kind: 'refused'; reply: string | null }
  | { kind: 'start' | 'secret' | 'capped'; reply: string }
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
  if (!isAllowed(deps.allowed, fromId)) {
    const say = shouldSendOwnerOnlyLine(deps.refusals, fromId, deps.now().getTime());
    return { kind: 'refused', reply: say ? refusalLine(fromId) : null };
  }

  const text = msg.text.trim();
  if (!text) return { kind: 'ignored' };
  if (text === '/start') return { kind: 'start', reply: withFooter(START_LINE) };
  if (looksLikeSecret(text)) return { kind: 'secret', reply: SECRET_LINE };

  // Counted before the call, so a failing model cannot be retried for free.
  const check = capCheck(await deps.readCap(), deps.now(), deps.cap);
  if (!check.allowed) return { kind: 'capped', reply: CAP_LINE };
  await deps.writeCap(check.next);

  const turns = deps.history.get(fromId) ?? [];
  try {
    const res = await askModel(deps.client, buildRequest(deps.system, turns, text, deps.model));
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
      countToday: check.next.count,
    };
  } catch (error: unknown) {
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
