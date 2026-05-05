/**
 * Bonfire bridge for ZOE.
 *
 * Today (no SDK key from Joshua.eth yet): manual relay pattern. ZOE returns
 * a structured "recall request" signal in its reply that asks Zaal to paste
 * a query into @zabal_bonfire DM and paste back the reply.
 *
 * When SDK lands: this module swaps to direct API calls without changing
 * concierge.ts callsite.
 *
 * When MCP server lands: Claude CLI invocation gets `mcp__bonfires__recall`
 * tool added, ZOE calls it natively, this module retires.
 */

export interface RecallRequest {
  query: string;
  reason: string;       // why ZOE needs the answer
  expected_kind: 'fact' | 'people' | 'event' | 'decision' | 'history' | 'mixed';
}

export interface RecallResult {
  kind: 'manual_relay_needed' | 'sdk_response' | 'mcp_response';
  query: string;
  text?: string;          // Bonfire reply text when sdk_response or mcp_response
  inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
}

/**
 * Today's behavior: format a "please relay to Bonfire" payload that ZOE can
 * include in its reply to Zaal. Returns a Telegram-ready Markdown string.
 */
export function formatManualRelay(req: RecallRequest): string {
  return [
    `_Need bonfire context for: ${req.reason}_`,
    '',
    'Paste into @zabal_bonfire DM:',
    '```',
    `RECALL: ${req.query}`,
    '```',
    '',
    'Then paste the reply back here. I will continue.',
  ].join('\n');
}

interface BonfireChatResponse {
  reply?: string;
  graph_action?: string;
  search_prompt?: string | null;
  [key: string]: unknown;
}

/**
 * Live Bonfire SDK call via POST /agents/{agent_id}/chat.
 *
 * Same interface @zabal_bonfire uses in Telegram - sends a message, gets back
 * a synthesized reply that knows about the bonfire's KG. No client-side
 * ranking - the agent decides what's relevant.
 *
 * Verified against tnt-v2.api.bonfires.ai OpenAPI spec May 2026. Earlier guess
 * (/kg/search per doc 569 §9) was wrong - that endpoint does not exist on the
 * tnt-v2 deployment. Schema source: GET /openapi.json on the same host.
 *
 * Required env: BONFIRE_API_KEY + BONFIRE_AGENT_ID. BONFIRE_ID is no longer
 * needed for this endpoint (agent ID resolves the bonfire scope).
 * BONFIRE_API_URL optional, defaults to tnt-v2 host.
 */
export async function recallViaSdk(req: RecallRequest): Promise<RecallResult> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const agentId = process.env.BONFIRE_AGENT_ID;
  const apiUrl = process.env.BONFIRE_API_URL ?? 'https://tnt-v2.api.bonfires.ai';

  if (!apiKey || !agentId) {
    return { kind: 'manual_relay_needed', query: req.query };
  }

  const body = {
    message: req.query,
    chat_history: [],
  };

  try {
    const r = await fetch(`${apiUrl}/agents/${agentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error(`[zoe/recall] Bonfire chat ${r.status}: ${errText.slice(0, 300)}`);
      return {
        kind: 'manual_relay_needed',
        query: req.query,
        text: `(Bonfire API error ${r.status}. Falling back to manual relay.)`,
      };
    }

    const data = (await r.json()) as BonfireChatResponse;
    const reply = (data.reply ?? '').toString().trim();
    if (!reply) {
      console.warn('[zoe/recall] empty Bonfire reply, raw:', JSON.stringify(data).slice(0, 400));
      return {
        kind: 'sdk_response',
        query: req.query,
        text: `(Bonfire returned empty reply for "${req.query}".)`,
      };
    }
    return { kind: 'sdk_response', query: req.query, text: reply };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/recall] SDK fetch threw:', msg);
    return {
      kind: 'manual_relay_needed',
      query: req.query,
      text: `(Bonfire SDK error: ${msg.slice(0, 200)}. Falling back to manual relay.)`,
    };
  }
}

/**
 * Single entry point ZOE concierge calls. Routes to SDK if configured,
 * else manual relay.
 */
export async function recall(req: RecallRequest): Promise<RecallResult> {
  return recallViaSdk(req);
}
