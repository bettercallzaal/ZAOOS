/**
 * Ollama wrapper - low-cost local LLM for classification + low-stakes routing.
 *
 * VPS already runs Ollama on localhost:11434 with llama3.1:8b loaded (4.9GB).
 * Use this for tasks where Sonnet's quality is overkill and the task is
 * mechanical: inbox label classification, Bonfire entity-class proposal,
 * audit subagent first-pass.
 *
 * Do NOT use for: newsletter writing, brand-assistant outputs (Firefly /
 * YouTube / cast / thread), concierge replies to Zaal, research subagent
 * sourcing. Voice + correctness require Claude.
 *
 * No API key, no usage cost, runs locally on VPS. Falls back to Claude
 * automatically if Ollama is unreachable.
 *
 * Doc 612 §"Ollama is the unused local LLM" justifies the boundary.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';
// 90s default to absorb cold-start (first inference ~30s on 2-core CPU).
// Override with OLLAMA_TIMEOUT_MS env if you swap to a smaller model.
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 90_000;

export interface OllamaResult {
  text: string;
  model: string;
  durationMs: number;
}

interface OllamaChatResponse {
  message?: { content?: string };
  model?: string;
  total_duration?: number;
  error?: string;
}

/**
 * Single-shot chat with Ollama. Returns trimmed reply text.
 *
 * Throws on network error, non-2xx, or empty completion. Caller should
 * try/catch and fall back to Claude if Ollama is unreachable.
 */
export async function ollamaChat(
  userPrompt: string,
  systemPrompt?: string,
  opts?: { temperature?: number; maxTokens?: number; model?: string },
): Promise<OllamaResult> {
  const start = Date.now();
  const model = opts?.model ?? OLLAMA_MODEL;
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: opts?.temperature ?? 0.1,
          num_predict: opts?.maxTokens ?? 256,
        },
      }),
      signal: controller.signal,
    });

    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      throw new Error(`Ollama HTTP ${r.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await r.json()) as OllamaChatResponse;
    if (data.error) throw new Error(`Ollama error: ${data.error}`);

    const text = (data.message?.content ?? '').trim();
    if (!text) throw new Error('Ollama returned empty completion');

    return {
      text,
      model: data.model ?? model,
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Classify text into one of `labels`. Returns the label (lowercased) or
 * `fallback` if Ollama fails or returns an unrecognized label.
 *
 * System prompt enforces strict output format - just the label word, no
 * preamble. Temperature 0 for determinism.
 */
export async function ollamaClassify(
  text: string,
  labels: readonly string[],
  fallback: string,
): Promise<string> {
  if (labels.length === 0) return fallback;

  const labelList = labels.join(' / ');
  const system = `You are a strict label classifier. Read the text. Reply with EXACTLY ONE WORD from this list and nothing else: ${labelList}. No punctuation, no preamble, no explanation.`;
  const prompt = `Text:\n"""\n${text.slice(0, 2000)}\n"""\n\nLabel:`;

  try {
    const result = await ollamaChat(prompt, system, { temperature: 0, maxTokens: 6 });
    const cleaned = result.text.toLowerCase().replace(/[^a-z0-9_-]/g, ' ').trim().split(/\s+/)[0];
    if (cleaned && labels.includes(cleaned)) return cleaned;
    return fallback;
  } catch (err) {
    console.warn('[zoe/ollama] classify failed, using fallback:', err instanceof Error ? err.message : err);
    return fallback;
  }
}

/**
 * Health check - useful for /agents diagnostics. Returns true if Ollama is
 * reachable and the model is loaded.
 */
export async function ollamaHealth(): Promise<{ ok: boolean; model?: string; error?: string }> {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const data = (await r.json()) as { models?: Array<{ name: string }> };
    const models = data.models ?? [];
    const target = OLLAMA_MODEL;
    const found = models.find((m) => m.name === target || m.name.startsWith(target + ':'));
    if (!found) return { ok: false, error: `model ${target} not loaded; have: ${models.map((m) => m.name).join(', ')}` };
    return { ok: true, model: found.name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
