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

export type MessageKind = 'question' | 'status';

/** Maximum Telegram message length before chunking kicks in. */
const TG_MAX_LEN = 4000;

/**
 * Split text into chunks of at most maxLen characters, preferring newline
 * boundaries so markdown headers / bullet points stay intact.
 */
export function chunkText(text: string, maxLen = TG_MAX_LEN): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    const slice = remaining.slice(0, maxLen);
    const lastNl = slice.lastIndexOf('\n');
    const breakAt = lastNl > 0 ? lastNl + 1 : maxLen;
    chunks.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt);
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

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
  const markupOpts = opts.replyMarkup ? { reply_markup: opts.replyMarkup } : {};
  const hasMarkup = Object.keys(markupOpts).length > 0;
  const chunks = chunkText(text);

  // question -> always DM
  if (kind === 'question') {
    let result: any;
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      result = isLast && hasMarkup
        ? await deps.sendMessage(deps.zaalId, chunks[i], markupOpts)
        : await deps.sendMessage(deps.zaalId, chunks[i]);
    }
    return result;
  }

  // status -> group (if configured), else fallback to DM
  const groupId = deps.groupId;
  if (!groupId) {
    console.log(
      '[zoe/telegram-routing] ZAALBOTS_GROUP_CHAT_ID not set, routing status to DM (fallback)',
    );
    let result: any;
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      result = isLast && hasMarkup
        ? await deps.sendMessage(deps.zaalId, chunks[i], markupOpts)
        : await deps.sendMessage(deps.zaalId, chunks[i]);
    }
    return result;
  }

  let result: any;
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const messageOpts = {
      ...(deps.groupThreadId ? { message_thread_id: deps.groupThreadId } : {}),
      ...(isLast ? markupOpts : {}),
    };
    result = await deps.sendMessage(groupId, chunks[i], messageOpts);
  }
  return result;
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

  const groupIdRaw = process.env.ZAALBOTS_GROUP_CHAT_ID;
  const groupIdParsed = groupIdRaw ? Number(groupIdRaw) : undefined;
  const groupId = groupIdParsed !== undefined && Number.isNaN(groupIdParsed) ? undefined : groupIdParsed;
  if (groupIdRaw && Number.isNaN(groupIdParsed)) {
    console.warn(`Invalid ZAALBOTS_GROUP_CHAT_ID: ${groupIdRaw} (must be a number, will be ignored)`);
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
