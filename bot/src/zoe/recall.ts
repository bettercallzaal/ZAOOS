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

interface BonfireResultItem {
  title?: string;
  name?: string;
  description?: string;
  text?: string;
  content?: string;
  score?: number;
  url?: string;
  source_url?: string;
  [key: string]: unknown;
}
interface BonfireSearchResponse {
  results?: BonfireResultItem[];
  matches?: BonfireResultItem[];
  data?: BonfireResultItem[];
  error?: string;
  message?: string;
  [key: string]: unknown;
}

function pickText(item: BonfireResultItem): string {
  const title = item.title ?? item.name ?? '';
  const body = item.description ?? item.text ?? item.content ?? '';
  const url = item.url ?? item.source_url ?? '';
  const score = typeof item.score === 'number' ? ` (${item.score.toFixed(2)})` : '';
  const head = title ? `${title}${score}` : `Result${score}`;
  const lines = [head];
  if (body) lines.push(body.toString().slice(0, 600));
  if (url) lines.push(url);
  return lines.join('\n');
}

/**
 * Live SDK call. Returns sdk_response when env has BONFIRE_API_KEY + BONFIRE_ID,
 * else falls through to manual_relay_needed.
 *
 * Endpoint shape inferred from doc 569 §9. We try /kg/search first, then a few
 * common Bonfire-style fallbacks. If the live shape differs, the real response
 * keys are kept defensive (results / matches / data all accepted).
 */
export async function recallViaSdk(req: RecallRequest): Promise<RecallResult> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const bonfireId = process.env.BONFIRE_ID;
  const agentId = process.env.BONFIRE_AGENT_ID;
  const apiUrl = process.env.BONFIRE_API_URL ?? 'https://tnt-v2.api.bonfires.ai';

  if (!apiKey || !bonfireId) {
    return { kind: 'manual_relay_needed', query: req.query };
  }

  const body = {
    bonfire_id: bonfireId,
    ...(agentId ? { agent_id: agentId } : {}),
    query: req.query,
    num_results: 5,
  };

  try {
    const r = await fetch(`${apiUrl}/kg/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error(`[zoe/recall] Bonfire SDK ${r.status}: ${errText.slice(0, 300)}`);
      return {
        kind: 'manual_relay_needed',
        query: req.query,
        text: `(Bonfire API error ${r.status}. Falling back to manual relay.)`,
      };
    }

    const data = (await r.json()) as BonfireSearchResponse;
    const items = data.results ?? data.matches ?? data.data ?? [];

    if (!items.length) {
      return {
        kind: 'sdk_response',
        query: req.query,
        text: `No matches for "${req.query}" in Bonfire (${bonfireId.slice(0, 8)}).`,
      };
    }

    const text = items.slice(0, 5).map(pickText).join('\n\n---\n\n');
    return { kind: 'sdk_response', query: req.query, text };
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
