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
 * Environment variables (set on VPS):
 * - ZAAL_TELEGRAM_ID: Zaal's personal DM chat id (existing)
 * - ZAALBOTS_GROUP_CHAT_ID: the ZAALBOTS group chat id (new)
 * - ZAALBOTS_STATUS_THREAD_ID: forum topic id within the group for status
 *   messages (new, optional - if group has forum topics)
 *
 * Fallback: if group chat id is unset, all messages fall back to Zaal's DM
 * so nothing breaks pre-config.
 */

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

export type MessageKind = 'question' | 'status';

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

  // Determine target chat id based on message kind
  const targetChatId = kind === 'question' ? deps.zaalId : (deps.groupId ?? deps.zaalId);

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
  const zaalIdRaw = process.env.ZAAL_TELEGRAM_ID;
  if (!zaalIdRaw) {
    throw new Error('Missing ZAAL_TELEGRAM_ID env var (required for ZOE)');
  }
  const zaalId = Number(zaalIdRaw);
  if (Number.isNaN(zaalId)) {
    throw new Error(`Invalid ZAAL_TELEGRAM_ID: ${zaalIdRaw} (must be a number)`);
  }

  // The rest of the bot (index.ts, scheduler.ts) reads the group id as
  // ZAAL_BOTZ_GROUP_ID; only this router looked for ZAALBOTS_GROUP_CHAT_ID,
  // which was never set. Result: groupId stayed undefined and EVERY status
  // message fell back to Zaal's DM instead of the group - the "ZOE spams my
  // DM" complaint. Read the canonical name, keep the old one as a fallback.
  const groupIdRaw = process.env.ZAAL_BOTZ_GROUP_ID ?? process.env.ZAALBOTS_GROUP_CHAT_ID;
  const groupId = groupIdRaw ? Number(groupIdRaw) : undefined;
  if (groupIdRaw && Number.isNaN(groupId)) {
    console.warn(`Invalid group id ${groupIdRaw} (ZAAL_BOTZ_GROUP_ID / ZAALBOTS_GROUP_CHAT_ID must be numeric, will be ignored)`);
  }

  const threadIdRaw = process.env.ZAALBOTS_STATUS_THREAD_ID;
  const threadId = threadIdRaw ? Number(threadIdRaw) : undefined;
  if (threadIdRaw && Number.isNaN(threadId)) {
    console.warn(`Invalid ZAALBOTS_STATUS_THREAD_ID: ${threadIdRaw} (must be a number, will be ignored)`);
  }

  return {
    sendMessage: sendMessageImpl,
    zaalId,
    groupId,
    groupThreadId: threadId,
  };
}
