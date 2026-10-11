/**
 * answer.ts - the one model call the helper makes. A single Messages request:
 * the handoff files as the system prompt, the last few turns, the question.
 *
 * There is no `tools` field and nothing here can add one. A model with no
 * tools cannot be talked into using one, which is the whole safety case for
 * letting someone outside The ZAO talk to it (doc 2661).
 */
import type Anthropic from '@anthropic-ai/sdk';

/**
 * The smallest current model. This job is reading three short files back to
 * one person, and at the default cap the largest model costs about forty times
 * as much a month. HELPER_MODEL overrides it.
 */
export const DEFAULT_MODEL = 'claude-haiku-5-5';

/** Turns kept per chat, in memory only, so "what next?" has something to follow. */
export const MAX_HISTORY = 6;

export const REFUSED_LINE = 'I cannot help with that one. That is a question for Zaal.';
export const NO_ANSWER_LINE = 'I did not get an answer that time. Ask me again in a moment.';
const CUT_SHORT = '\n\n(That was cut short. Ask me to continue.)';

/**
 * Phone-length answers. Telegram caps a message at 4096 characters, and the
 * model's own reasoning shares this budget, so this is well above one message.
 */
const MAX_TOKENS = 4000;

/** The part of the SDK client this module needs, so a test can pass a stub. */
export interface MessagesClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
}

export function buildRequest(
  system: string,
  history: readonly Anthropic.MessageParam[],
  question: string,
  model: string,
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: MAX_TOKENS,
    // Stable prefix, so repeat questions can read it from the cache.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [...history.slice(-MAX_HISTORY), { role: 'user', content: question }],
    output_config: { effort: 'low' },
  };
}

export interface HelperAnswer {
  text: string;
  /** False when the model declined or returned nothing; such a turn is not remembered. */
  answered: boolean;
  inputTokens: number;
  outputTokens: number;
}

export async function askModel(
  client: MessagesClient,
  params: Anthropic.MessageCreateParamsNonStreaming,
): Promise<HelperAnswer> {
  const res = await client.messages.create(params);
  const usage = {
    inputTokens:
      res.usage.input_tokens +
      (res.usage.cache_read_input_tokens ?? 0) +
      (res.usage.cache_creation_input_tokens ?? 0),
    outputTokens: res.usage.output_tokens,
  };
  if (res.stop_reason === 'refusal') return { text: REFUSED_LINE, answered: false, ...usage };

  let text = '';
  for (const block of res.content) {
    if (block.type === 'text') text += block.text;
  }
  text = text.trim();
  if (!text) return { text: NO_ANSWER_LINE, answered: false, ...usage };
  if (res.stop_reason === 'max_tokens') text += CUT_SHORT;
  return { text, answered: true, ...usage };
}
