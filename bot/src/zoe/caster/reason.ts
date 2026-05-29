/**
 * Caster reasoning path (doc 761, Phase 2/4).
 *
 * This is the "sibling reasoning path" the build prompt calls the "openrouter case". ZOE's
 * concierge turns stay on Claude Max via callClaudeCli; the caster's one-shot cast drafting
 * runs through OpenRouter (user-selectable models) instead, because it is a stateless text
 * generation, not a tool-using concierge turn.
 *
 * OpenRouter is OpenAI-chat-compatible. The base URL is swappable to Router402 (x402 / USDC on
 * Base) later by setting OPENROUTER_BASE_URL - the request shape is unchanged (Phase 4).
 *
 * Env:
 *   OPENROUTER_API_KEY     required
 *   OPENROUTER_BASE_URL    default https://openrouter.ai/api/v1  (swap to Router402 later)
 *   OPENROUTER_MODEL       default anthropic/claude-sonnet-4.6  (user-selectable per doc 761)
 *   OPENROUTER_REFERER     optional HTTP-Referer header (OpenRouter attribution)
 */

const DEFAULT_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';

export interface DraftCastOpts {
  /** Agent persona / system prompt (from the agent registry persona_prompt). */
  persona: string;
  /** The trigger context the agent is reacting to (the cast text, thread, topic). */
  context: string;
  /** Optional model override (else OPENROUTER_MODEL env, else default). */
  model?: string;
  /** Hard cap on cast length; Farcaster casts max 320 bytes. */
  maxChars?: number;
}

export interface DraftResult {
  text: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export async function draftCast(opts: DraftCastOpts): Promise<DraftResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  const base = (process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
  const model = opts.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const maxChars = opts.maxChars ?? 320;

  const system = [
    opts.persona.trim(),
    '',
    `You are drafting a single Farcaster cast. Hard limit: ${maxChars} characters. ` +
      `Output ONLY the cast text - no preamble, no quotes, no markdown headers, no hashtags ` +
      `unless they are natural. One cast, ready to post.`,
  ].join('\n');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.OPENROUTER_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER;

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: opts.context },
      ],
      max_tokens: 400,
      temperature: 0.8,
    }),
  });

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };
  if (!res.ok || body.error) {
    throw new Error(`openrouter draft failed: ${res.status} ${body.error?.message ?? ''}`);
  }

  let text = (body.choices?.[0]?.message?.content ?? '').trim();
  // Strip wrapping quotes the model sometimes adds; enforce length.
  text = text.replace(/^["']|["']$/g, '').trim();
  if (text.length > maxChars) text = text.slice(0, maxChars).trimEnd();

  return {
    text,
    model,
    promptTokens: body.usage?.prompt_tokens ?? null,
    completionTokens: body.usage?.completion_tokens ?? null,
  };
}
