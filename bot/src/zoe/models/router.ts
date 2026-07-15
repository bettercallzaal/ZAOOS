/**
 * ZOE multi-model router — dispatch concierge tasks to Claude, Grok (xAI), or GPT (OpenAI).
 *
 * When MODEL_ROUTING_ENABLED=1, the router selects the best model for each task based on
 * heuristics and the task type. Each model call is wrapped to return a ClaudeCliResult-compatible
 * response. Gracefully falls back to Claude if a model's API key is missing.
 *
 * Routing rationale (doc 1113):
 *  - Claude (via CLI): deep agentic orchestration, multi-step careful reasoning
 *  - Grok (xAI): fast code gen, quick iteration, X-native context awareness
 *  - GPT (OpenAI): broad structured reasoning, ecosystem analysis tasks
 *
 * Zaal sees the model choice + rationale in the concierge reply.
 */

import type { ClaudeCliResult } from '../../hermes/claude-cli';

export interface ModelChoice {
  model: string;
  provider: 'claude' | 'grok' | 'gpt';
  rationale: string;
}

/**
 * Routing heuristic: given a message and context, pick the best model.
 * Returns the model ID + provider + one-line rationale for Zaal.
 */
export function selectBestModel(message: string, context?: { isCodeTask?: boolean; isStrategyTask?: boolean; isXContext?: boolean }): ModelChoice {
  const len = message.length;
  const lower = message.toLowerCase();

  // Task-specific routing
  if (context?.isCodeTask) {
    // Fast code generation - Grok excels
    if (hasGrokApiKey()) {
      return {
        model: process.env.GROK_MODEL_ID ?? 'grok-4',
        provider: 'grok',
        rationale: 'fast code generation (Grok)',
      };
    }
  }

  if (context?.isStrategyTask || lower.includes('whitepaper') || lower.includes('architecture') || len > 500) {
    // Deep reasoning - Claude is best
    return {
      model: process.env.ZOE_DEFAULT_MODEL ?? 'sonnet',
      provider: 'claude',
      rationale: 'deep strategic reasoning (Claude)',
    };
  }

  if (context?.isXContext || lower.includes('x.com') || lower.includes('twitter') || lower.includes('@')) {
    // X-native tasks - Grok understands X's culture/APIs
    if (hasGrokApiKey()) {
      return {
        model: process.env.GROK_MODEL_ID ?? 'grok-4',
        provider: 'grok',
        rationale: 'X-native awareness (Grok)',
      };
    }
  }

  // Fallback to Claude
  return {
    model: process.env.ZOE_DEFAULT_MODEL ?? 'sonnet',
    provider: 'claude',
    rationale: 'default reasoning engine (Claude)',
  };
}

/**
 * Environment key checks.
 */
function hasGrokApiKey(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

function hasGptApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function hasClaudeApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Generic OpenAI-compatible chat completion request.
 */
interface OpenAiRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

interface OpenAiResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Call Grok API (xAI) — OpenAI-compatible chat endpoint.
 */
async function callGrok(systemPrompt: string, userMessage: string): Promise<ClaudeCliResult> {
  if (!hasGrokApiKey()) {
    throw new Error('GROK_MODEL_ID or XAI_API_KEY not set');
  }

  const baseUrl = 'https://api.x.ai/v1';
  const model = process.env.GROK_MODEL_ID ?? 'grok-4';
  const apiKey = process.env.XAI_API_KEY;

  const request: OpenAiRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 1,
    max_tokens: 4096,
  };

  const startMs = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ZOE-bot/1.0',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices[0]?.message?.content ?? '';
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;

    // Grok pricing: roughly $3-5 per 1M input, $15 per 1M output (estimate)
    const inputCost = (inputTokens / 1_000_000) * 4;
    const outputCost = (outputTokens / 1_000_000) * 15;

    return {
      text,
      inputTokens,
      outputTokens,
      totalCostUsd: inputCost + outputCost,
      model,
      durationMs: Date.now() - startMs,
      numTurns: 1,
      isError: false,
      sessionId: `grok-${Date.now()}`,
    };
  } catch (error: unknown) {
    throw new Error(`Grok call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call GPT API (OpenAI) — standard OpenAI chat endpoint.
 */
async function callGpt(systemPrompt: string, userMessage: string): Promise<ClaudeCliResult> {
  if (!hasGptApiKey()) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const baseUrl = 'https://api.openai.com/v1';
  const model = process.env.GPT_MODEL_ID ?? 'gpt-4o';
  const apiKey = process.env.OPENAI_API_KEY;

  const request: OpenAiRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 1,
    max_tokens: 4096,
  };

  const startMs = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ZOE-bot/1.0',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices[0]?.message?.content ?? '';
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;

    // GPT-4o pricing: $2.50 per 1M input, $10 per 1M output
    const inputCost = (inputTokens / 1_000_000) * 2.5;
    const outputCost = (outputTokens / 1_000_000) * 10;

    return {
      text,
      inputTokens,
      outputTokens,
      totalCostUsd: inputCost + outputCost,
      model,
      durationMs: Date.now() - startMs,
      numTurns: 1,
      isError: false,
      sessionId: `gpt-${Date.now()}`,
    };
  } catch (error: unknown) {
    throw new Error(`GPT call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Route a concierge call to the best available model.
 *
 * When routing is enabled, selects a model based on the message + context.
 * Falls back gracefully to Claude if the chosen model's API key is missing.
 *
 * Returns a ClaudeCliResult-compatible response with model choice + rationale.
 */
export async function routeAndCall(
  systemPrompt: string,
  userMessage: string,
  choice?: ModelChoice,
): Promise<{ result: ClaudeCliResult; choice: ModelChoice; modelRationale: string }> {
  const enabled = process.env.MODEL_ROUTING_ENABLED === '1';

  if (!enabled) {
    // Routing disabled - return a placeholder indicating Claude was used
    return {
      result: {
        text: 'ERROR: routing returned placeholder - concierge should not use this path',
        inputTokens: 0,
        outputTokens: 0,
        totalCostUsd: 0,
        model: 'claude-default',
        durationMs: 0,
        numTurns: 0,
        isError: true,
        sessionId: 'placeholder',
      },
      choice: { model: 'claude', provider: 'claude', rationale: 'routing disabled' },
      modelRationale: 'routing disabled - using Claude CLI',
    };
  }

  const selectedChoice = choice ?? selectBestModel(userMessage);
  let result: ClaudeCliResult;

  try {
    if (selectedChoice.provider === 'grok') {
      if (!hasGrokApiKey()) {
        console.warn('[zoe/models/router] Grok chosen but XAI_API_KEY missing, falling back to Claude');
        // Fallback: don't actually call, just signal to use Claude
        throw new Error('XAI_API_KEY missing');
      }
      result = await callGrok(systemPrompt, userMessage);
    } else if (selectedChoice.provider === 'gpt') {
      if (!hasGptApiKey()) {
        console.warn('[zoe/models/router] GPT chosen but OPENAI_API_KEY missing, falling back to Claude');
        throw new Error('OPENAI_API_KEY missing');
      }
      result = await callGpt(systemPrompt, userMessage);
    } else {
      // Claude (default) - caller will use Claude CLI, not this function
      throw new Error('Claude routing should not call this function');
    }

    const rationale = `I used ${selectedChoice.provider.toUpperCase()} for this because: ${selectedChoice.rationale}`;

    return {
      result,
      choice: selectedChoice,
      modelRationale: rationale,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[zoe/models/router] model call failed:', msg, 'falling back to Claude');

    // Fallback to Claude - signal that we should use the Claude CLI path
    throw new Error(`Model routing failed (${selectedChoice.provider}): ${msg}. Caller should fall back to Claude.`);
  }
}

/**
 * Determine if routing should be attempted for a given call.
 * Returns true only if both routing is enabled AND at least one alternative API key is present.
 */
export function shouldUseRouting(): boolean {
  const enabled = process.env.MODEL_ROUTING_ENABLED === '1';
  const hasAlternative = hasGrokApiKey() || hasGptApiKey();
  return enabled && hasAlternative;
}
