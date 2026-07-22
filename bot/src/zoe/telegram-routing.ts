/**
 * telegram-routing.ts - centralized routing rule for ZOE Telegram messages.
 *
 * THE RULE (Zaal 2026-07-15): ZOE should DM Zaal ONLY for QUESTIONS
 * that need his answer/decision. EVERYTHING ELSE (status updates,
 * comment-acks, digests, morning brief, PR-landed pings, board changes,
 * general info) goes to the ZAALBOTS GROUP, not a DM.
 *
 * This centralizes the decision: sendToZaal(text, {kind}) routes based
 * on kind. All message sends flow through this helper.
 *
 * Environment: all config comes from the canonical env module (./env), which
 * resolves each value from its canonical name AND known aliases so the
 * env-drift bug (router reading a different name than the deploy env sets)
 * cannot recur. Group id -> ZAAL_BOTZ_GROUP_ID, thread -> ZAAL_BOTZ_RESEARCH_THREAD,
 * DM -> ZAAL_TELEGRAM_ID.
 *
 * Fallback: if group id is unset, messages fall back to Zaal's DM so nothing
 * breaks pre-config.
 */

import { ZAAL_DM_ID, ZAAL_BOTZ_GROUP_ID, ZAAL_BOTZ_RESEARCH_THREAD } from './env';

const TELEGRAM_MAX = 3900;

/**
 * Split a long string into Telegram-sized chunks, preferring paragraph then
 * line then word boundaries. Falls back to a hard cut only if no boundary is
 * found in the back half of the window.
 */
function chunkLongMessage(text: string, max = TELEGRAM_MAX): string[] {
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

export type MessageKind = 'question' | 'status' | 'whisper';

export interface SendToZaalOptions {
  kind?: MessageKind; // defaults to 'status'
  /**
   * Inline keyboard to attach (Telegram reply_markup). Used by the morning
   * brief to surface tap-to-veto buttons. Passed through to sendMessage.
   */
  replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
}

export interface TelegramRoutingDeps {
  sendMessage: (chatId: number, text: string, opts?: any) => Promise<any>;
  zaalId: number;
  groupId?: number;
  groupThreadId?: number; // for forum topics within the group
}

/**
 * Route a message to either Zaal's DM (questions) or the ZAALBOTS group (status).
 * Centralizes ALL message routing so the decision is in one place.
 *
 * Messages are automatically chunked if they exceed Telegram's 4096 char limit.
 * reply_markup is applied only to the first chunk.
 *
 * kind='question': DM Zaal directly (personal chat). These need his answer/decision.
 * kind='whisper':  DM Zaal directly, but no answer required - a private
 *   notification (approval prompts, private alerts). Keeps it out of the group
 *   so the ZAALBOTS group stays status-only; only Zaal sees it.
 * kind='status': ZAALBOTS group (+ thread if configured). Informational.
 *
 * Fallback: if groupId is not set, all messages go to Zaal's DM to avoid
 * silent drops before config is complete.
 */
export async function sendToZaal(
  deps: TelegramRoutingDeps,
  text: string,
  opts: SendToZaalOptions = {},
): Promise<any> {
  const kind = opts.kind ?? 'status';
  const chunks = chunkLongMessage(text);

  // Determine target chat id based on message kind. Questions AND whispers both
  // go to Zaal's DM (questions need a reply, whispers are private notifications);
  // only status goes to the group.
  const targetChatId =
    kind === 'question' || kind === 'whisper' ? deps.zaalId : (deps.groupId ?? deps.zaalId);

  // For status messages, also use group thread id if configured
  const messageOpts = (chatId: number) => {
    const opts: any = {};
    if (chatId === deps.groupId && deps.groupThreadId) {
      opts.message_thread_id = deps.groupThreadId;
    }
    return opts;
  };

  // Send each chunk; apply reply_markup only to the first
  for (let i = 0; i < chunks.length; i++) {
    const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : '';
    const chunkText = prefix + chunks[i];
    const chunkOpts = messageOpts(targetChatId);
    if (i === 0 && opts.replyMarkup) {
      chunkOpts.reply_markup = opts.replyMarkup;
    }
    // eslint-disable-next-line no-await-in-loop
    await deps.sendMessage(targetChatId, chunkText, chunkOpts);
  }

  // Return the result of the last message for consistency
  return undefined;
}

/**
 * Construct routing dependencies from environment + bot instance.
 * Reads: ZAAL_TELEGRAM_ID, ZAALBOTS_GROUP_CHAT_ID, ZAALBOTS_STATUS_THREAD_ID.
 *
 * Throws if ZAAL_TELEGRAM_ID is missing (fatal config error).
 * Returns deps ready to pass to sendToZaal().
 */
export function constructRoutingDeps(sendMessageImpl: TelegramRoutingDeps['sendMessage']): TelegramRoutingDeps {
  // All three values now come from the canonical env module (env.ts), which
  // resolves each from its canonical name AND its known aliases. This is what
  // stopped the env-drift bug: the router used to read ZAALBOTS_GROUP_CHAT_ID /
  // ZAALBOTS_STATUS_THREAD_ID while the deploy env set ZAAL_BOTZ_GROUP_ID /
  // ZAAL_BOTZ_RESEARCH_THREAD, so groupId + threadId came back undefined and
  // every status message silently fell back to Zaal's DM.
  const zaalId = ZAAL_DM_ID;
  if (zaalId === undefined) {
    throw new Error('Missing ZAAL_TELEGRAM_ID env var (required for ZOE)');
  }

  return {
    sendMessage: sendMessageImpl,
    zaalId,
    groupId: ZAAL_BOTZ_GROUP_ID,
    groupThreadId: ZAAL_BOTZ_RESEARCH_THREAD,
  };
}
