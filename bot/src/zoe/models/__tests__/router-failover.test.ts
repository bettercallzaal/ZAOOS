// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasCapFallbackProvider,
  callCapFallback,
  routeAndCall,
} from '../router';

/**
 * Router FAILOVER coverage - the provider ladder that keeps the fleet running
 * when Claude is capped. The existing router.test.ts covers model SELECTION
 * (selectBestModel); this covers the CALL + fallback paths (routeAndCall,
 * callCapFallback, hasCapFallbackProvider), which had zero coverage.
 *
 * Network is stubbed via globalThis.fetch so the ladder is exercised for real
 * (openrouter fails -> grok succeeds) without hitting any provider.
 */

const KEYS = ['XAI_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'MODEL_ROUTING_ENABLED'];
const saved: Record<string, string | undefined> = {};
const realFetch = globalThis.fetch;

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

/** An OpenAI-shaped success body for the stubbed fetch. */
function okResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    }),
    text: async () => '',
  } as unknown as Response;
}

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  setEnv(saved);
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('hasCapFallbackProvider', () => {
  it('false when no non-Claude provider is configured', () => {
    expect(hasCapFallbackProvider()).toBe(false);
  });
  it.each(['OPENROUTER_API_KEY', 'XAI_API_KEY', 'OPENAI_API_KEY'])('true when %s is set', (k) => {
    setEnv({ [k]: 'x' });
    expect(hasCapFallbackProvider()).toBe(true);
  });
});

describe('callCapFallback', () => {
  it('throws a clear error when NO provider is configured', async () => {
    await expect(callCapFallback('sys', 'msg')).rejects.toThrow(/no cap-fallback provider configured/);
  });

  it('uses OpenRouter first when available', async () => {
    setEnv({ OPENROUTER_API_KEY: 'or', XAI_API_KEY: 'xai' });
    const fetchMock = vi.fn(async () => okResponse('from-openrouter'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result, provider } = await callCapFallback('sys', 'msg');
    expect(provider).toBe('openrouter');
    expect(result.text).toBe('from-openrouter');
    expect(fetchMock).toHaveBeenCalledTimes(1); // stopped at the first success
  });

  it('LADDER: falls through OpenRouter failure to Grok success', async () => {
    setEnv({ OPENROUTER_API_KEY: 'or', XAI_API_KEY: 'xai' });
    let call = 0;
    globalThis.fetch = vi.fn(async () => {
      call++;
      if (call === 1) throw new Error('openrouter down');
      return okResponse('from-grok');
    }) as unknown as typeof fetch;
    const { provider, result } = await callCapFallback('sys', 'msg');
    expect(provider).toBe('grok');
    expect(result.text).toBe('from-grok');
  });

  it('throws an aggregate error when EVERY provider fails', async () => {
    setEnv({ OPENROUTER_API_KEY: 'or', XAI_API_KEY: 'xai', OPENAI_API_KEY: 'oai' });
    globalThis.fetch = vi.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    await expect(callCapFallback('sys', 'msg')).rejects.toThrow(/all cap-fallback providers failed/);
  });
});

describe('routeAndCall', () => {
  it('returns an error placeholder when routing is DISABLED', async () => {
    setEnv({ MODEL_ROUTING_ENABLED: undefined });
    const { result, choice } = await routeAndCall('sys', 'msg');
    expect(result.isError).toBe(true);
    expect(choice.provider).toBe('claude');
  });

  it('fails over to Claude (throws) when Grok is chosen but XAI_API_KEY is missing', async () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1' });
    await expect(
      routeAndCall('sys', 'msg', { model: 'grok-4', provider: 'grok', rationale: 'x' }),
    ).rejects.toThrow(/Caller should fall back to Claude/);
  });

  it('fails over to Claude when GPT is chosen but OPENAI_API_KEY is missing', async () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1' });
    await expect(
      routeAndCall('sys', 'msg', { model: 'gpt-4o', provider: 'gpt', rationale: 'x' }),
    ).rejects.toThrow(/Caller should fall back to Claude/);
  });

  it('calls Grok and returns a rationale when the key IS present', async () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1', XAI_API_KEY: 'xai' });
    globalThis.fetch = vi.fn(async () => okResponse('grok-said-hi')) as unknown as typeof fetch;
    const { result, modelRationale, choice } = await routeAndCall('sys', 'msg', {
      model: 'grok-4',
      provider: 'grok',
      rationale: 'fast code',
    });
    expect(result.text).toBe('grok-said-hi');
    expect(result.isError).toBe(false);
    expect(choice.provider).toBe('grok');
    expect(modelRationale).toContain('GROK');
  });

  it('never routes the "claude" provider through this function', async () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1' });
    await expect(
      routeAndCall('sys', 'msg', { model: 'claude', provider: 'claude', rationale: 'x' }),
    ).rejects.toThrow(/fall back to Claude/);
  });
});
