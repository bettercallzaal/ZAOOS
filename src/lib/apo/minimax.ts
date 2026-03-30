/**
 * Thin Minimax LLM caller for APO engine.
 * Mirrors the pattern in src/lib/library/minimax.ts but returns raw string.
 */
export async function callMinimax(
  system: string,
  user: string,
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is required for APO optimization');
  }

  const endpoint =
    process.env.MINIMAX_API_URL ||
    'https://api.minimax.io/v1/chat/completions';
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.7';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Minimax API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = JSON.parse(text);
  let content: string =
    data?.choices?.[0]?.message?.content ?? data?.reply ?? '';

  // Strip <think> reasoning tags from M2.7
  content = content.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();

  if (!content) {
    throw new Error('Minimax returned empty response');
  }

  return content;
}
