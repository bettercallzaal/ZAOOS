/**
 * Cross-bot relay for ZOE (Phase 2 of Bonfire integration).
 *
 * When ZOE emits a bot_relay_op in her reply, this module:
 *   - Resolves the target group title to a chat_id via groups.json
 *   - Sends bot.api.sendMessage(chat_id, `${tag_bot} ${message}`)
 *   - v1: fire-and-forget. ZOE confirms in DM that the message was sent.
 *   - v2 (next): wait for reply from tag_bot, capture, summarize, send back to Zaal's DM.
 *
 * Per locked Q1=GATEWAY: this is one of the dispatch surfaces ZOE owns.
 * Per locked Q3: any external-facing send is implicitly approved by Zaal's DM having
 * authored the goal that produced the relay_op. No additional y/n gate.
 */

import { readGroups, type GroupConfig } from './groups';
import type { BotRelayOp } from './types';

export interface RelayResult {
  op: BotRelayOp;
  status: 'sent' | 'group-not-registered' | 'send-failed';
  resolved_chat_id?: number;
  error?: string;
}

/**
 * Resolve a relay op to a target chat id. Pure (doc 770 MED). Uses an EXACT
 * case-insensitive title match, not a substring — `"ZAO"` must not silently
 * resolve to `"ZAO Devz"` / `"ZAO Civilization"` and post to the wrong group.
 */
export function resolveRelayChatId(groups: GroupConfig[], op: BotRelayOp): number | undefined {
  if (op.to_chat_id) return op.to_chat_id;
  if (!op.to_group) return undefined;
  const wanted = op.to_group.trim().toLowerCase();
  const target = groups.find((g) => (g.chat_title ?? '').trim().toLowerCase() === wanted);
  return target?.chat_id;
}

export async function runBotRelayOps(
  sendMessage: (chatId: number, text: string) => Promise<unknown>,
  ops: BotRelayOp[],
): Promise<RelayResult[]> {
  if (ops.length === 0) return [];
  const groups = await readGroups();
  const results: RelayResult[] = [];

  for (const op of ops) {
    const chatId = resolveRelayChatId(groups, op);
    if (!chatId) {
      results.push({ op, status: 'group-not-registered' });
      continue;
    }
    const text = `${op.tag_bot} ${op.message}`.trim();
    try {
      await sendMessage(chatId, text);
      results.push({ op, status: 'sent', resolved_chat_id: chatId });
    } catch (err) {
      results.push({
        op,
        status: 'send-failed',
        resolved_chat_id: chatId,
        error: (err as Error).message,
      });
    }
  }
  return results;
}

/**
 * Build a one-line summary of relay results to send back to Zaal's DM as a
 * postscript on ZOE's reply.
 */
export function summarizeRelayResults(results: RelayResult[]): string {
  if (results.length === 0) return '';
  const lines: string[] = [];
  for (const r of results) {
    const tag = r.op.tag_bot;
    const group = r.op.to_group ?? `chat ${r.op.to_chat_id}`;
    if (r.status === 'sent') {
      lines.push(`Sent ${tag} in ${group}. Watch for reply.`);
    } else if (r.status === 'group-not-registered') {
      lines.push(
        `Could not relay to ${group} — group not registered in ZOE's groups.json. Run /zg enable mention in that group from Zaal first.`,
      );
    } else {
      lines.push(`Send to ${group} failed: ${r.error ?? 'unknown error'}`);
    }
  }
  return lines.join('\n');
}
