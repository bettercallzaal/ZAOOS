/**
 * @recall - query the Bonfire personal knowledge graph.
 *
 * Today (no BONFIRE_API_KEY): returns a manual-relay payload Zaal copies into
 * @zabal_bonfire DM, then pastes the reply back here for ZOE to use.
 *
 * Future: BONFIRE_API_KEY arrives via Bonfire dashboard, this handler swaps to
 * SDK call (see ../recall.ts placeholder + doc 547 §1).
 */
import type { Agent } from './index';
import { recall, formatManualRelay } from '../recall';

export const agent: Agent = {
  name: 'recall',
  description: 'Query Bonfire memory. Today: manual relay. Soon: SDK direct.',
  triggers: [
    /^@(?:recall|bonfire|memory)\s+(.+)/is,
    /^\/recall\s+(.+)/is,
  ],
  handle: async (match, _ctx): Promise<string> => {
    const query = match[1].trim();
    if (!query) return 'Usage: @recall <what you want to remember>';

    const result = await recall({
      query,
      reason: 'Zaal asked ZOE via Telegram',
      expected_kind: 'mixed',
    });

    if (result.kind === 'sdk_response' || result.kind === 'mcp_response') {
      return result.text ?? '(empty Bonfire response)';
    }

    // Manual relay path - return the copy-paste payload
    return formatManualRelay({
      query,
      reason: 'Zaal asked ZOE via Telegram',
      expected_kind: 'mixed',
    });
  },
};
