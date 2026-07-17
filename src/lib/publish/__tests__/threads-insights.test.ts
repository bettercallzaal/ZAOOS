// @vitest-environment node

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({ THREADS_ACCESS_TOKEN: 'test-token' as string | undefined }));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

import { fetchThreadsInsights } from '../threads-insights';

function mockFetch(status: number, body: unknown) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function makeBody(metrics: Partial<Record<string, number>>) {
  return {
    data: Object.entries(metrics).map(([name, value]) => ({
      name,
      values: [{ value }],
    })),
  };
}

describe('fetchThreadsInsights', () => {
  beforeEach(() => {
    mockEnv.THREADS_ACCESS_TOKEN = 'test-token';
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 1. Throws when THREADS_ACCESS_TOKEN is undefined
  it('throws when THREADS_ACCESS_TOKEN is undefined', async () => {
    mockEnv.THREADS_ACCESS_TOKEN = undefined;

    await expect(fetchThreadsInsights('thread-abc')).rejects.toThrow(
      'missing THREADS_ACCESS_TOKEN',
    );
  });

  // 2. All 5 metrics populated correctly from API response
  it('returns all 5 metrics correctly from a full API response', async () => {
    mockFetch(200, makeBody({ views: 100, likes: 50, replies: 10, reposts: 5, quotes: 2 }));

    const result = await fetchThreadsInsights('thread-full');

    expect(result).toEqual({
      views: 100,
      likes: 50,
      replies: 10,
      reposts: 5,
      quotes: 2,
    });
  });

  // 3. Partial metrics: only some fields present → missing ones remain 0
  it('returns 0 for metrics absent from the API response', async () => {
    mockFetch(200, makeBody({ views: 999, likes: 7 }));

    const result = await fetchThreadsInsights('thread-partial');

    expect(result).toEqual({
      views: 999,
      likes: 7,
      replies: 0,
      reposts: 0,
      quotes: 0,
    });
  });

  // 4. Empty data array → all zeros returned
  it('returns all-zero metrics when data array is empty', async () => {
    mockFetch(200, { data: [] });

    const result = await fetchThreadsInsights('thread-empty');

    expect(result).toEqual({ views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 });
  });

  // 5. Unknown metric name in response data → ignored
  it('ignores unknown metric names from the API response', async () => {
    mockFetch(200, makeBody({ views: 10, unknown_metric: 99 }));

    const result = await fetchThreadsInsights('thread-unknown');

    expect(result).toEqual({ views: 10, likes: 0, replies: 0, reposts: 0, quotes: 0 });
    expect(result).not.toHaveProperty('unknown_metric');
  });

  // 6. API error (HTTP 401) with JSON error body → returns zeroed metrics
  it('returns zeroed metrics on a 401 error with JSON error body', async () => {
    mockFetch(401, { error: { message: 'permission denied' } });

    const result = await fetchThreadsInsights('thread-401');

    expect(result).toEqual({ views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 });
  });

  // 7. API error where json() throws → returns zeroed metrics
  it('returns zeroed metrics when the error response json() throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    const result = await fetchThreadsInsights('thread-bad-json');

    expect(result).toEqual({ views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 });
  });

  // 8. values[0] missing/undefined on a metric → defaults to 0
  it('defaults to 0 when values array is empty for a metric', async () => {
    mockFetch(200, {
      data: [
        { name: 'views', values: [] },
        { name: 'likes', values: [{ value: 3 }] },
      ],
    });

    const result = await fetchThreadsInsights('thread-missing-values');

    expect(result.views).toBe(0);
    expect(result.likes).toBe(3);
  });

  // 9. Access token is included in the request URL query string
  it('includes access_token in the fetch URL query string', async () => {
    mockFetch(200, { data: [] });

    await fetchThreadsInsights('thread-token-check');

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('access_token=test-token');
  });

  // 10. Thread ID is correctly embedded in the URL path
  it('embeds the thread ID in the fetch URL path', async () => {
    mockFetch(200, { data: [] });

    const threadId = 'my-thread-id-xyz';
    await fetchThreadsInsights(threadId);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain(`/${threadId}/insights`);
  });
});
