// LLM personas. v1.5 = Minimax only. Add Claude in v1.6 when ANTHROPIC_API_KEY lands.

export type PersonaName = 'minimax';

export interface LLMReply {
  text: string;
  persona: PersonaName;
  tokens?: { input?: number; output?: number };
}

export async function askMinimax(
  prompt: string,
  system?: string,
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<LLMReply> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const apiUrl = process.env.MINIMAX_API_URL;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2';
  if (!apiKey || !apiUrl) throw new Error('MINIMAX_API_KEY or MINIMAX_API_URL not configured');

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Minimax HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('Minimax returned empty response');

  return {
    text,
    persona: 'minimax',
    tokens: {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    },
  };
}

export async function ask(prompt: string, system?: string, persona: PersonaName = 'minimax'): Promise<LLMReply> {
  if (persona === 'minimax') return askMinimax(prompt, system);
  throw new Error(`Unknown persona: ${persona}`);
}
