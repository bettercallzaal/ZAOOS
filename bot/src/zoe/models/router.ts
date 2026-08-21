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

/**
 * Output-token cap for the fallback API providers (Grok/GPT/OpenRouter). The
 * Claude CLI path generates freely, but when Claude is weekly-capped the fleet
 * fails over here - and the old 4096 cap cut long replies (a detailed audit)
 * off mid-sentence with no chunk continuation (the ZONEXUS-audit bug, 2026-07-29).
 * 8192 is supported by all three providers (GPT-4o 16k, Grok large, deepseek 8k).
 * Tunable via ZOE_FALLBACK_MAX_TOKENS.
 */
const FALLBACK_MAX_TOKENS = Number(process.env.ZOE_FALLBACK_MAX_TOKENS) || 8192;

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

function hasOpenRouterApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
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
    max_tokens: FALLBACK_MAX_TOKENS,
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
    max_tokens: FALLBACK_MAX_TOKENS,
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
 * Call OpenRouter — OpenAI-compatible aggregator. Gives ZOE a cheap, always-on
 * non-Claude path (deepseek, gemini, llama, etc.), aligned with the fleet's
 * cheap-AI stack. This is the primary CAP FALLBACK provider: when the Claude CLI
 * is rate-limited or over its weekly cap, ZOE drops here instead of failing.
 */
/**
 * High-tier cross-family model for HIGH-STAKES escalations (e.g. a code-review
 * critic when we want the best non-Claude reviewer, not the cheap one). Chosen
 * from Aug-2026 community benchmarks: GPT-5.5 is the strongest NON-Claude agentic
 * coder (Gemini 3.1 Pro clearly trails on multi-file/tool-call work). Opus 4.8 is
 * the best coder overall but is Claude-family, so it's not the cross-family pick.
 * Override via OPENROUTER_HIGH_MODEL. See research doc 2217.
 */
export const OPENROUTER_HIGH_MODEL = process.env.OPENROUTER_HIGH_MODEL ?? 'openai/gpt-5.5';

async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  modelOverride?: string,
): Promise<ClaudeCliResult> {
  if (!hasOpenRouterApiKey()) {
    throw new Error('OPENROUTER_API_KEY not set');
  }

  const baseUrl = 'https://openrouter.ai/api/v1';
  // Default to a cheap, capable non-Anthropic model so a fallback never re-hits
  // the same Anthropic cap that triggered it. Override via OPENROUTER_MODEL, or
  // pass modelOverride for a high-stakes escalation (OPENROUTER_HIGH_MODEL).
  const model = modelOverride ?? process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';
  const apiKey = process.env.OPENROUTER_API_KEY;

  const request: OpenAiRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 1,
    max_tokens: FALLBACK_MAX_TOKENS,
  };

  const startMs = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ZOE-bot/1.0',
        'HTTP-Referer': 'https://thezao.com',
        'X-Title': 'ZOE',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices[0]?.message?.content ?? '';
    if (!text.trim()) {
      throw new Error('OpenRouter returned empty completion');
    }

    return {
      text,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      totalCostUsd: 0, // OpenRouter cost varies by model; not tracked precisely here
      model: `openrouter/${model}`,
      durationMs: Date.now() - startMs,
      numTurns: 1,
      isError: false,
      sessionId: `openrouter-${startMs}`,
    };
  } catch (error: unknown) {
    throw new Error(`OpenRouter call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Surplus Intelligence base URL. OpenAI-compatible: POST /chat/completions with
 * a bearer token, same request and response shape as OpenRouter, which is why
 * this rung is a near-copy rather than a new abstraction.
 *
 * SOURCED FROM THEIR DOCS PAGE VIA A SUMMARISING FETCH, not raw text, so treat
 * the constant as unverified until the first live call succeeds
 * (`research-grounding.md`). If it is wrong the call throws and the ladder falls
 * through to the next provider - the cost of being wrong here is one wasted
 * attempt, never a silent failure.
 */
const SURPLUS_DEFAULT_BASE = 'https://api.surplusintelligence.ai/v1';

export function hasSurplusApiKey(): boolean {
  return Boolean(process.env.SURPLUS_API_KEY?.trim());
}

async function callSurplus(
  systemPrompt: string,
  userMessage: string,
  modelOverride?: string,
): Promise<ClaudeCliResult> {
  if (!hasSurplusApiKey()) {
    throw new Error('SURPLUS_API_KEY not set');
  }

  const baseUrl = process.env.SURPLUS_BASE_URL?.trim() || SURPLUS_DEFAULT_BASE;
  // Surplus routes "one API key, every model - to the cheapest healthy seller",
  // so the model id is theirs to resolve. Left overridable because the catalogue
  // is a marketplace and will move.
  const model = modelOverride ?? process.env.SURPLUS_MODEL ?? 'auto';
  const apiKey = process.env.SURPLUS_API_KEY;

  const request: OpenAiRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 1,
    max_tokens: FALLBACK_MAX_TOKENS,
  };

  const startMs = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ZOE-bot/1.0',
        'X-Title': 'ZOE',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Surplus API error ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices[0]?.message?.content ?? '';
    // A 200 carrying an empty completion is a FAILED call, not an empty answer.
    // Treating it as success would hand the caller a blank reply and report it
    // as working (`liveness-probe-guard.md`, the companion clause).
    if (!text.trim()) {
      throw new Error('Surplus returned empty completion');
    }

    return {
      text,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      totalCostUsd: 0,
      model: `surplus/${model}`,
      durationMs: Date.now() - startMs,
      numTurns: 1,
      isError: false,
      sessionId: `surplus-${startMs}`,
    };
  } catch (error: unknown) {
    throw new Error(`Surplus call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * CAP FALLBACK: the Claude CLI is rate-limited or over its weekly cap, so run
 * this concierge turn on the best available non-Claude provider instead of
 * failing. Order: OpenRouter, then Surplus Intelligence, then Grok, then GPT.
 *
 * Surplus sits SECOND on purpose. On 2026-08-21 the entire fleet went silent -
 * 17 loops, zero output - because OpenRouter ran out of credits and the next
 * rung was Grok, which is neither cheap nor always configured. A cheap provider
 * needs a cheap provider behind it, or an outage at the top is an outage for
 * everything.
 * Throws only if NO non-Claude provider is configured (then the caller surfaces
 * the original Claude error).
 */
export function hasCapFallbackProvider(): boolean {
  return hasOpenRouterApiKey() || hasSurplusApiKey() || hasGrokApiKey() || hasGptApiKey();
}

export async function callCapFallback(
  systemPrompt: string,
  userMessage: string,
  opts?: { tier?: 'cheap' | 'high' },
): Promise<{ result: ClaudeCliResult; provider: string }> {
  // tier 'high' (default 'cheap'): route the OpenRouter attempt to the frontier
  // cross-family model (OPENROUTER_HIGH_MODEL) instead of the cheap default -
  // for high-stakes calls where we WANT the best non-Claude model, not the
  // cheapest. Grok/GPT direct paths are unchanged.
  const orModel = opts?.tier === 'high' ? OPENROUTER_HIGH_MODEL : undefined;
  const attempts: Array<{ name: string; fn: () => Promise<ClaudeCliResult> }> = [];
  if (hasOpenRouterApiKey()) attempts.push({ name: 'openrouter', fn: () => callOpenRouter(systemPrompt, userMessage, orModel) });
  if (hasSurplusApiKey()) attempts.push({ name: 'surplus', fn: () => callSurplus(systemPrompt, userMessage) });
  if (hasGrokApiKey()) attempts.push({ name: 'grok', fn: () => callGrok(systemPrompt, userMessage) });
  if (hasGptApiKey()) attempts.push({ name: 'gpt', fn: () => callGpt(systemPrompt, userMessage) });

  if (attempts.length === 0) {
    throw new Error('no cap-fallback provider configured (set OPENROUTER_API_KEY, SURPLUS_API_KEY, XAI_API_KEY, or OPENAI_API_KEY)');
  }

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const result = await attempt.fn();
      console.log('[zoe/models/router] cap-fallback succeeded via', attempt.name);
      return { result, provider: attempt.name };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[zoe/models/router] cap-fallback ${attempt.name} failed:`, msg);
      errors.push(`${attempt.name}: ${msg.slice(0, 80)}`);
    }
  }
  throw new Error(`all cap-fallback providers failed [${errors.join(' | ')}]`);
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
