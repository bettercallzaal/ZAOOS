// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { selectBestModel, shouldUseRouting } from '../router';

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

beforeEach(() => {
  // Start each test with no API keys and routing off
  setEnv({
    XAI_API_KEY: undefined,
    OPENAI_API_KEY: undefined,
    MODEL_ROUTING_ENABLED: undefined,
    GROK_MODEL_ID: undefined,
    GPT_MODEL_ID: undefined,
    ZOE_DEFAULT_MODEL: undefined,
  });
});

afterEach(() => vi.clearAllMocks());

// ── selectBestModel ───────────────────────────────────────────────────────────

describe('selectBestModel', () => {
  it('defaults to claude when no context flags and no API keys', () => {
    const result = selectBestModel('tell me about ZAO');
    expect(result.provider).toBe('claude');
  });

  it('picks grok for code task when XAI_API_KEY is set', () => {
    setEnv({ XAI_API_KEY: 'xai-test-key' });
    const result = selectBestModel('write a react component', { isCodeTask: true });
    expect(result.provider).toBe('grok');
    expect(result.rationale).toContain('Grok');
  });

  it('falls back to claude for code task when XAI_API_KEY is absent', () => {
    const result = selectBestModel('write a react component', { isCodeTask: true });
    expect(result.provider).toBe('claude');
  });

  it('routes strategy tasks to claude', () => {
    setEnv({ XAI_API_KEY: 'xai-key', OPENAI_API_KEY: 'oai-key' });
    const result = selectBestModel('design a DAO treasury strategy', { isStrategyTask: true });
    expect(result.provider).toBe('claude');
    expect(result.rationale).toContain('Claude');
  });

  it('routes messages containing "whitepaper" to claude', () => {
    const result = selectBestModel('draft a whitepaper for ZAO token utility');
    expect(result.provider).toBe('claude');
  });

  it('routes messages containing "architecture" to claude', () => {
    const result = selectBestModel('review the architecture decisions for the ZAO platform');
    expect(result.provider).toBe('claude');
  });

  it('routes long messages (> 500 chars) to claude', () => {
    const longMsg = 'a'.repeat(501);
    const result = selectBestModel(longMsg);
    expect(result.provider).toBe('claude');
  });

  it('picks grok for X-context messages when XAI_API_KEY is set', () => {
    setEnv({ XAI_API_KEY: 'xai-test-key' });
    const result = selectBestModel('check this x.com thread');
    expect(result.provider).toBe('grok');
    expect(result.rationale).toContain('Grok');
  });

  it('falls back to claude for X-context when XAI_API_KEY is absent', () => {
    const result = selectBestModel('check this x.com thread');
    expect(result.provider).toBe('claude');
  });

  it('picks grok for X-context flag even without "x.com" in text', () => {
    setEnv({ XAI_API_KEY: 'xai-key' });
    const result = selectBestModel('respond to a mention', { isXContext: true });
    expect(result.provider).toBe('grok');
  });

  it('uses GROK_MODEL_ID env var for the model name when routing to grok', () => {
    setEnv({ XAI_API_KEY: 'xai-key', GROK_MODEL_ID: 'grok-4-turbo' });
    const result = selectBestModel('fix this function', { isCodeTask: true });
    expect(result.model).toBe('grok-4-turbo');
  });

  it('uses ZOE_DEFAULT_MODEL env var when falling back to claude', () => {
    setEnv({ ZOE_DEFAULT_MODEL: 'claude-opus-4-7' });
    const result = selectBestModel('general question');
    expect(result.model).toBe('claude-opus-4-7');
  });
});

// ── shouldUseRouting ──────────────────────────────────────────────────────────

describe('shouldUseRouting', () => {
  it('returns false when routing is disabled', () => {
    setEnv({ XAI_API_KEY: 'xai-key', MODEL_ROUTING_ENABLED: undefined });
    expect(shouldUseRouting()).toBe(false);
  });

  it('returns false when routing is enabled but no alternative API keys', () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1' });
    expect(shouldUseRouting()).toBe(false);
  });

  it('returns true when routing is enabled and grok key is present', () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1', XAI_API_KEY: 'xai-key' });
    expect(shouldUseRouting()).toBe(true);
  });

  it('returns true when routing is enabled and openai key is present', () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1', OPENAI_API_KEY: 'oai-key' });
    expect(shouldUseRouting()).toBe(true);
  });

  it('ignores whitespace-only API keys', () => {
    setEnv({ MODEL_ROUTING_ENABLED: '1', XAI_API_KEY: '   ', OPENAI_API_KEY: '' });
    expect(shouldUseRouting()).toBe(false);
  });
});
