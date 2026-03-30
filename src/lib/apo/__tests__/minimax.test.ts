import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.hoisted(() => vi.fn());

describe('callMinimax', () => {
  beforeEach(() => {
    vi.stubEnv('MINIMAX_API_KEY', 'test-key');
    vi.stubEnv('MINIMAX_API_URL', 'https://api.minimax.io/v1/chat/completions');
    vi.stubEnv('MINIMAX_MODEL', 'MiniMax-M2.7');
    global.fetch = mockFetch;
  });

  it('returns LLM response text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        choices: [{ message: { content: 'Hello world' } }],
      })),
    });

    const { callMinimax } = await import('../minimax');
    const result = await callMinimax('You are helpful', 'Say hello');
    expect(result).toBe('Hello world');
  });

  it('strips think tags from M2.7 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        choices: [{ message: { content: '<think>reasoning here</think>\nActual answer' } }],
      })),
    });

    const { callMinimax } = await import('../minimax');
    const result = await callMinimax('system', 'user');
    expect(result).toBe('Actual answer');
  });

  it('throws on missing API key', async () => {
    vi.stubEnv('MINIMAX_API_KEY', '');
    const { callMinimax } = await import('../minimax');
    await expect(callMinimax('s', 'u')).rejects.toThrow('MINIMAX_API_KEY');
  });
});
