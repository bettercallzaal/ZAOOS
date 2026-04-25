interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

export interface AnthropicCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export async function callAnthropic(opts: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<AnthropicCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured - Hermes pair requires Anthropic API access');
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic HTTP ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = data.content.map((c) => c.text ?? '').join('').trim();
  if (!text) throw new Error('Anthropic returned empty content');

  return {
    text,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    model: opts.model,
  };
}

export const HERMES_FIXER_MODEL = process.env.HERMES_FIXER_MODEL ?? 'claude-opus-4-7';
export const HERMES_CRITIC_MODEL = process.env.HERMES_CRITIC_MODEL ?? 'claude-sonnet-4-6';
