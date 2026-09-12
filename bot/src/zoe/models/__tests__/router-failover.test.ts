// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasCapFallbackProvider,
  capFallbackProviders,
  callCapFallback,
  routeAndCall,
  OPENROUTER_HIGH_MODEL,
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

const KEYS = ['XAI_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'MODEL_ROUTING_ENABLED', 'OPENROUTER_MODEL', 'OPENROUTER_HIGH_MODEL', 'SURPLUS_API_KEY', 'SURPLUS_BASE_URL', 'SURPLUS_MODEL', 'OLLAMA_ENABLED', 'OLLAMA_URL', 'OLLAMA_MODEL'];
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

describe('callCapFallback tier routing (high-tier escalation, doc 2217)', () => {
  function bodyModelOf(fetchMock: ReturnType<typeof vi.fn>): string {
    const init = fetchMock.mock.calls[0][1] as { body: string };
    return (JSON.parse(init.body) as { model: string }).model;
  }

  it("default tier uses the cheap OpenRouter model (deepseek)", async () => {
    setEnv({ OPENROUTER_API_KEY: 'or' });
    const fetchMock = vi.fn(async () => okResponse('ok'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await callCapFallback('sys', 'msg');
    expect(bodyModelOf(fetchMock)).toBe('deepseek/deepseek-chat');
  });

  it("tier 'high' escalates to the frontier cross-family model (OPENROUTER_HIGH_MODEL)", async () => {
    setEnv({ OPENROUTER_API_KEY: 'or' });
    const fetchMock = vi.fn(async () => okResponse('ok'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await callCapFallback('sys', 'msg', { tier: 'high' });
    expect(bodyModelOf(fetchMock)).toBe(OPENROUTER_HIGH_MODEL);
    expect(OPENROUTER_HIGH_MODEL).toContain('gpt-5.5'); // evidence-based default
  });

  it('OPENROUTER_MODEL still overrides the cheap default', async () => {
    setEnv({ OPENROUTER_API_KEY: 'or', OPENROUTER_MODEL: 'meta-llama/llama-4' });
    const fetchMock = vi.fn(async () => okResponse('ok'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await callCapFallback('sys', 'msg');
    expect(bodyModelOf(fetchMock)).toBe('meta-llama/llama-4');
  });
});


/**
 * SURPLUS INTELLIGENCE - the second cheap rung, added 2026-08-21.
 *
 * The whole fleet went silent that morning - 17 loops, zero output - because
 * OpenRouter ran out of credits and the next rung was Grok, which is neither
 * cheap nor always configured. These tests pin the behaviour that prevents a
 * repeat: a cheap provider must have a cheap provider behind it.
 */
describe('surplus intelligence fallback rung', () => {
  it('counts as a cap-fallback provider on its own', () => {
    setEnv({ OPENROUTER_API_KEY: undefined, XAI_API_KEY: undefined, OPENAI_API_KEY: undefined, SURPLUS_API_KEY: 'sk-surplus-test' });
    expect(hasCapFallbackProvider()).toBe(true);
  });

  it('carries the call when OpenRouter is out of credits - the 2026-08-21 case', async () => {
    setEnv({ OPENROUTER_API_KEY: 'sk-or-test', SURPLUS_API_KEY: 'sk-surplus-test', XAI_API_KEY: undefined, OPENAI_API_KEY: undefined });
    const seen: string[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      seen.push(href);
      if (href.includes('openrouter.ai')) {
        // What a drained OpenRouter key actually returns.
        return { ok: false, status: 402, text: async () => 'insufficient credits', json: async () => ({}) } as unknown as Response;
      }
      return okResponse('answered by surplus') as unknown as Response;
    }) as typeof fetch;

    const { result, provider } = await callCapFallback('sys', 'hello');
    expect(provider).toBe('surplus');
    expect(result.text).toBe('answered by surplus');
    expect(result.model).toMatch(/^surplus\//);
    // Order matters: OpenRouter is still tried first, Surplus is the catch.
    expect(seen[0]).toContain('openrouter.ai');
    expect(seen[1]).toContain('surplusintelligence.ai');
  });

  it('is tried BEFORE grok, so an outage does not escalate to an expensive tier', async () => {
    setEnv({ OPENROUTER_API_KEY: undefined, SURPLUS_API_KEY: 'sk-surplus-test', XAI_API_KEY: 'xai-test', OPENAI_API_KEY: undefined });
    const seen: string[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      seen.push(String(url));
      return okResponse('ok') as unknown as Response;
    }) as typeof fetch;

    const { provider } = await callCapFallback('sys', 'hello');
    expect(provider).toBe('surplus');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('surplusintelligence.ai');
  });

  it('treats a 200 with an empty completion as a FAILURE, not an empty answer', async () => {
    setEnv({ OPENROUTER_API_KEY: undefined, SURPLUS_API_KEY: 'sk-surplus-test', XAI_API_KEY: undefined, OPENAI_API_KEY: undefined });
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '   ' } }], usage: {} }),
      text: async () => '',
    })) as unknown as typeof fetch;

    // Handing the caller a blank reply and calling it success is the silent
    // failure this guard exists to stop.
    await expect(callCapFallback('sys', 'hello')).rejects.toThrow(/empty completion/i);
  });

  it('honours SURPLUS_BASE_URL so the endpoint can be corrected without a deploy', async () => {
    setEnv({ OPENROUTER_API_KEY: undefined, SURPLUS_API_KEY: 'sk-surplus-test', SURPLUS_BASE_URL: 'https://example.test/v9', XAI_API_KEY: undefined, OPENAI_API_KEY: undefined });
    let called = '';
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      called = String(url);
      return okResponse('ok') as unknown as Response;
    }) as typeof fetch;

    await callCapFallback('sys', 'hello');
    expect(called).toBe('https://example.test/v9/chat/completions');
  });
});

describe('the local rung: Ollama, last and keyless', () => {
  it('counts as a fallback provider on its own, with no key anywhere', () => {
    expect(hasCapFallbackProvider()).toBe(false);
    setEnv({ OLLAMA_ENABLED: '1' });
    expect(hasCapFallbackProvider()).toBe(true);
    expect(capFallbackProviders()).toEqual(['ollama']);
  });

  it('is OFF unless OLLAMA_ENABLED is exactly 1, so no cap pays a localhost timeout', () => {
    setEnv({ OLLAMA_ENABLED: 'true' });
    expect(capFallbackProviders()).toEqual([]);
    setEnv({ OLLAMA_ENABLED: '0' });
    expect(capFallbackProviders()).toEqual([]);
  });

  it('sits LAST: it serves only when every paid rung has failed', async () => {
    setEnv({ OPENROUTER_API_KEY: 'or', OLLAMA_ENABLED: '1' });
    expect(capFallbackProviders()).toEqual(['openrouter', 'ollama']);
    const tried: string[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('openrouter.ai')) {
        tried.push('openrouter');
        return { ok: false, status: 402, text: async () => 'out of credits' } as unknown as Response;
      }
      tried.push('ollama');
      return okResponse('served locally');
    }) as unknown as typeof fetch;
    const { result, provider } = await callCapFallback('sys', 'user');
    expect(tried).toEqual(['openrouter', 'ollama']);
    expect(provider).toBe('ollama');
    expect(result.text).toBe('served locally');
    expect(result.totalCostUsd).toBe(0);
    expect(result.model).toBe('ollama/qwen3:4b-instruct');
  });

  it('a 200 with an empty completion is a FAILURE, not an empty answer', async () => {
    setEnv({ OLLAMA_ENABLED: '1' });
    globalThis.fetch = vi.fn(async () => okResponse('   ')) as unknown as typeof fetch;
    await expect(callCapFallback('sys', 'user')).rejects.toThrow(/empty completion/);
  });

  it('a model that is not pulled is a 404 whose message names the model', async () => {
    // Measured, not assumed. On 2026-09-11 the real servers were asked directly:
    // the Mac (llama3.2 present) answered 200 with content, and the VPS, which
    // has ollama running and NO model pulled, answered
    //   HTTP 404 {"error":{"message":"model 'qwen3:4b-instruct' not found",...}}
    // The comment in callOllama used to claim that case was a 200 with nothing.
    // It is not, and the rung has to fail loudly with the model name in it, or
    // a box one `ollama pull` short of working looks the same as a box that is
    // configured wrong.
    setEnv({ OLLAMA_ENABLED: '1' });
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => '{"error":{"message":"model \'qwen3:4b-instruct\' not found","type":"not_found_error"}}',
    })) as unknown as typeof fetch;
    await expect(callCapFallback('sys', 'user')).rejects.toThrow(/qwen3:4b-instruct.*not found/);
  });

  it('honours OLLAMA_URL and OLLAMA_MODEL so a remote box or a different model needs no deploy', async () => {
    setEnv({ OLLAMA_ENABLED: '1', OLLAMA_URL: 'http://100.72.152.63:11434', OLLAMA_MODEL: 'llama3.2' });
    let seen = '';
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      seen = String(url);
      return okResponse('remote answer');
    }) as unknown as typeof fetch;
    const { result } = await callCapFallback('sys', 'user');
    expect(seen).toBe('http://100.72.152.63:11434/v1/chat/completions');
    expect(result.model).toBe('ollama/llama3.2');
  });

  it('reports ladder DEPTH, because one rung is a second single point of failure', () => {
    setEnv({ OPENROUTER_API_KEY: 'or' });
    expect(capFallbackProviders()).toEqual(['openrouter']); // what the estate had on 2026-09-11
    setEnv({ OLLAMA_ENABLED: '1' });
    expect(capFallbackProviders()).toEqual(['openrouter', 'ollama']);
    setEnv({ XAI_API_KEY: 'x' });
    expect(capFallbackProviders()).toEqual(['openrouter', 'grok', 'ollama']);
  });
});
