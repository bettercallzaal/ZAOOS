// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callCapFallback, capFallbackProviders, hasAnthropicCreditsRung, resetProviderHealth } from '../router';

/**
 * The Anthropic credits rung (research doc 2646). Flag-gated, own key variable,
 * first on the ladder when enabled. Network stubbed via globalThis.fetch, the
 * same seam router-failover.test.ts uses.
 */

const KEYS = [
  'ZOE_ANTHROPIC_API_RUNG',
  'ZOE_ANTHROPIC_CREDITS_KEY',
  'ZOE_ANTHROPIC_API_MODEL',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'SURPLUS_API_KEY',
  'XAI_API_KEY',
  'OPENAI_API_KEY',
  'OLLAMA_ENABLED',
];
const saved: Record<string, string | undefined> = {};
const realFetch = globalThis.fetch;

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function anthropicOk(blocks: Array<{ type: string; text?: string }>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ content: blocks, usage: { input_tokens: 7, output_tokens: 9 } }),
    text: async () => '',
  } as unknown as Response;
}

function openAiOk(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
    text: async () => '',
  } as unknown as Response;
}

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  for (const k of KEYS) delete process.env[k];
  resetProviderHealth();
});

afterEach(() => {
  setEnv(saved);
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('hasAnthropicCreditsRung', () => {
  it('is OFF by default, even with a credits key present', () => {
    setEnv({ ZOE_ANTHROPIC_CREDITS_KEY: 'k' });
    expect(hasAnthropicCreditsRung()).toBe(false);
  });

  it('is OFF when the flag is on but no credits key is set', () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1' });
    expect(hasAnthropicCreditsRung()).toBe(false);
  });

  it('never borrows ANTHROPIC_API_KEY, which would move claude CLI calls onto API billing', () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ANTHROPIC_API_KEY: 'cli-key' });
    expect(hasAnthropicCreditsRung()).toBe(false);
  });

  it('accepts only the literal "1"', () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: 'true', ZOE_ANTHROPIC_CREDITS_KEY: 'k' });
    expect(hasAnthropicCreditsRung()).toBe(false);
  });

  it('is ON with the flag and the key', () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k' });
    expect(hasAnthropicCreditsRung()).toBe(true);
  });
});

describe('ladder order', () => {
  it('puts anthropic-credits first when enabled', () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k', OPENROUTER_API_KEY: 'or' });
    expect(capFallbackProviders()).toEqual(['anthropic-credits', 'openrouter']);
  });

  it('leaves the ladder unchanged when disabled', () => {
    setEnv({ ZOE_ANTHROPIC_CREDITS_KEY: 'k', OPENROUTER_API_KEY: 'or' });
    expect(capFallbackProviders()).toEqual(['openrouter']);
  });
});

describe('callCapFallback through the credits rung', () => {
  it('sends a Messages API request with the credits key and Haiku 5.5 by default', async () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'credits-k' });
    const fetchMock = vi.fn(async () => anthropicOk([{ type: 'text', text: 'hi' }]));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result, provider } = await callCapFallback('sys', 'msg');

    expect(provider).toBe('anthropic-credits');
    expect(result.text).toBe('hi');
    expect(result.model).toBe('anthropic/claude-haiku-5-5');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('credits-k');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('claude-haiku-5-5');
    expect(body.system).toBe('sys');
    expect(body.messages).toEqual([{ role: 'user', content: 'msg' }]);
  });

  it('returns only text blocks when the reply opens with thinking', async () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k' });
    globalThis.fetch = vi.fn(async () =>
      anthropicOk([{ type: 'thinking' }, { type: 'text', text: 'answer' }]),
    ) as unknown as typeof fetch;
    const { result } = await callCapFallback('sys', 'msg');
    expect(result.text).toBe('answer');
  });

  it('honours ZOE_ANTHROPIC_API_MODEL', async () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k', ZOE_ANTHROPIC_API_MODEL: 'claude-sonnet-5-5' });
    const fetchMock = vi.fn(async () => anthropicOk([{ type: 'text', text: 'x' }]));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = await callCapFallback('sys', 'msg');
    expect(result.model).toBe('anthropic/claude-sonnet-5-5');
  });

  it('treats a 200 with no text as a failure and falls through to OpenRouter', async () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k', OPENROUTER_API_KEY: 'or' });
    let call = 0;
    globalThis.fetch = vi.fn(async () => {
      call++;
      return call === 1 ? anthropicOk([{ type: 'thinking' }]) : openAiOk('from-openrouter');
    }) as unknown as typeof fetch;
    const { result, provider } = await callCapFallback('sys', 'msg');
    expect(provider).toBe('openrouter');
    expect(result.text).toBe('from-openrouter');
  });

  it('falls through on an API error, e.g. credits exhausted', async () => {
    setEnv({ ZOE_ANTHROPIC_API_RUNG: '1', ZOE_ANTHROPIC_CREDITS_KEY: 'k', OPENROUTER_API_KEY: 'or' });
    let call = 0;
    globalThis.fetch = vi.fn(async () => {
      call++;
      if (call === 1) {
        return { ok: false, status: 400, text: async () => 'credit balance is too low', json: async () => ({}) } as unknown as Response;
      }
      return openAiOk('from-openrouter');
    }) as unknown as typeof fetch;
    const { provider } = await callCapFallback('sys', 'msg');
    expect(provider).toBe('openrouter');
  });
});
