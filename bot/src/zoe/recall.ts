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

/**
 * Future API call (placeholder).
 * Returns sdk_response when env has BONFIRE_API_KEY + BONFIRE_ID, else manual_relay_needed.
 */
export async function recallViaSdk(req: RecallRequest): Promise<RecallResult> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const bonfireId = process.env.BONFIRE_ID;
  const agentId = process.env.BONFIRE_AGENT_ID;
  const apiUrl = process.env.BONFIRE_API_URL ?? 'https://tnt-v2.api.bonfires.ai';

  if (!apiKey || !bonfireId) {
    return { kind: 'manual_relay_needed', query: req.query };
  }

  // Future implementation when key is provisioned (per doc 569 §9 SDK pattern):
  //
  //   const r = await fetch(`${apiUrl}/kg/search`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  //     body: JSON.stringify({ bonfire_id: bonfireId, agent_id: agentId, query: req.query, num_results: 5 }),
  //   });
  //   const data = await r.json();
  //   return { kind: 'sdk_response', query: req.query, text: data.results.map(formatResult).join('\n\n') };
  //
  // Intentionally not invoking the API until key is in env — to fail loudly
  // when called without proper config.

  console.warn('[zoe/recall] SDK path not yet implemented — falling back to manual relay');
  return { kind: 'manual_relay_needed', query: req.query };
}

/**
 * Single entry point ZOE concierge calls. Routes to SDK if configured,
 * else manual relay.
 */
export async function recall(req: RecallRequest): Promise<RecallResult> {
  return recallViaSdk(req);
}
