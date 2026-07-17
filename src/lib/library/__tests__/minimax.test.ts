// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({
  MINIMAX_API_KEY: 'test-key' as string | undefined,
  MINIMAX_API_URL: undefined as string | undefined,
  MINIMAX_MODEL: undefined as string | undefined,
}));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

import { generateResearchSummary } from '../minimax';

function mockFetch(ok: boolean, status: number, body: unknown) {
  const bodyStr = JSON.stringify(body);
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(bodyStr),
    json: () => Promise.resolve(body),
  });
}

function successBody(summary: string) {
  return { choices: [{ message: { content: summary } }] };
}

describe('generateResearchSummary', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockEnv.MINIMAX_API_KEY = 'test-key';
    mockEnv.MINIMAX_API_URL = undefined;
    mockEnv.MINIMAX_MODEL = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns { summary: null, error: "Minimax not configured" } when MINIMAX_API_KEY is undefined', async () => {
    mockEnv.MINIMAX_API_KEY = undefined;
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax not configured' });
  });

  it('returns { summary, error: null } from choices[0].message.content on success', async () => {
    mockFetch(true, 200, successBody('This is a summary.'));
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: 'This is a summary.', error: null });
  });

  it('falls back to data.reply when choices is absent', async () => {
    mockFetch(true, 200, { reply: 'Reply summary.' });
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: 'Reply summary.', error: null });
  });

  it('returns { summary: null, error: "No summary in Minimax response" } when both choices and reply absent', async () => {
    mockFetch(true, 200, {});
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'No summary in Minimax response' });
  });

  it('returns { summary: null, error: "Minimax API error: 500" } on HTTP 500', async () => {
    mockFetch(false, 500, { message: 'Internal Server Error' });
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax API error: 500' });
  });

  it('returns { summary: null, error: "Minimax: quota exceeded" } when base_resp.status_code !== 0', async () => {
    mockFetch(true, 200, { base_resp: { status_code: 1000, status_msg: 'quota exceeded' } });
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax: quota exceeded' });
  });

  it('returns { summary: null, error: "Minimax: model not found" } when data.error.message is set', async () => {
    mockFetch(true, 200, { error: { message: 'model not found', type: 'invalid_request_error' } });
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax: model not found' });
  });

  it('returns { summary: null, error: "Minimax request failed" } when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax request failed' });
  });

  it('strips <think>...</think> tags from summary before returning', async () => {
    mockFetch(true, 200, successBody('<think>internal reasoning here</think>\nActual summary text.'));
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: 'Actual summary text.', error: null });
  });

  it('returns { summary: null, error: "Minimax returned only reasoning tokens" } when summary is only <think> content', async () => {
    mockFetch(true, 200, successBody('<think>only reasoning, no real answer</think>'));
    const result = await generateResearchSummary('some content');
    expect(result).toEqual({ summary: null, error: 'Minimax returned only reasoning tokens' });
  });

  it('uses MINIMAX_API_URL as endpoint when set', async () => {
    mockEnv.MINIMAX_API_URL = 'https://custom.api.example.com/v1/chat/completions';
    mockFetch(true, 200, successBody('ok'));
    await generateResearchSummary('some content');
    expect(fetch).toHaveBeenCalledWith(
      'https://custom.api.example.com/v1/chat/completions',
      expect.any(Object),
    );
  });

  it('uses MINIMAX_MODEL in request body when set', async () => {
    mockEnv.MINIMAX_MODEL = 'MiniMax-CustomModel';
    mockFetch(true, 200, successBody('ok'));
    await generateResearchSummary('some content');
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('MiniMax-CustomModel');
  });
});
