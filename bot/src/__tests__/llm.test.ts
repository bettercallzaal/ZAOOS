// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.hoisted(() => vi.fn());

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  delete process.env.MINIMAX_API_KEY;
  delete process.env.MINIMAX_API_URL;
  delete process.env.MINIMAX_MODEL;
});

import { ask, askMinimax } from '../llm';

function stubFetch(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  });
  vi.stubGlobal('fetch', mockFetch);
}

function setEnv() {
  process.env.MINIMAX_API_KEY = 'test-key';
  process.env.MINIMAX_API_URL = 'https://api.minimax.test/v1/chat';
}

const OK_RESPONSE = {
  choices: [{ message: { content: 'ZAO is the future.' } }],
  usage: { prompt_tokens: 10, completion_tokens: 5 },
};

// ── askMinimax ────────────────────────────────────────────────────────────────

describe('askMinimax', () => {
  it('throws when MINIMAX_API_KEY or MINIMAX_API_URL is not configured', async () => {
    await expect(askMinimax('hello')).rejects.toThrow('not configured');
  });

  it('posts to the Minimax API and returns a structured LLMReply', async () => {
    setEnv();
    stubFetch(OK_RESPONSE);
    const reply = await askMinimax('What is ZAO?');
    expect(reply.text).toBe('ZAO is the future.');
    expect(reply.persona).toBe('minimax');
    expect(reply.tokens?.input).toBe(10);
    expect(reply.tokens?.output).toBe(5);
  });

  it('includes a system message in the request when provided', async () => {
    setEnv();
    stubFetch(OK_RESPONSE);
    await askMinimax('question', 'You are ZOE.');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.messages[0]).toMatchObject({ role: 'system', content: 'You are ZOE.' });
  });

  it('uses MINIMAX_MODEL env var when set', async () => {
    setEnv();
    process.env.MINIMAX_MODEL = 'MiniMax-Custom';
    stubFetch(OK_RESPONSE);
    await askMinimax('hi');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model).toBe('MiniMax-Custom');
  });

  it('throws on non-ok HTTP status', async () => {
    setEnv();
    stubFetch({ error: 'bad' }, false, 400);
    await expect(askMinimax('hello')).rejects.toThrow('Minimax HTTP 400');
  });

  it('throws when API returns empty content', async () => {
    setEnv();
    stubFetch({ choices: [{ message: { content: '' } }] });
    await expect(askMinimax('hello')).rejects.toThrow('empty response');
  });
});

// ── ask ───────────────────────────────────────────────────────────────────────

describe('ask', () => {
  it('delegates to askMinimax for the minimax persona', async () => {
    setEnv();
    stubFetch(OK_RESPONSE);
    const reply = await ask('hello', undefined, 'minimax');
    expect(reply.persona).toBe('minimax');
  });

  it('throws for an unknown persona', async () => {
    // @ts-expect-error testing unknown persona
    await expect(ask('hello', undefined, 'unknown')).rejects.toThrow('Unknown persona');
  });
});
