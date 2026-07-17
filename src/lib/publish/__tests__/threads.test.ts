// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mock env before module imports
// ---------------------------------------------------------------------------

const mockEnv = vi.hoisted(() => ({
  THREADS_ACCESS_TOKEN: 'token123' as string | undefined,
  THREADS_USER_ID: 'user456' as string | undefined,
}));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

import { isThreadsConfigured, publishToThreads, refreshThreadsToken } from '../threads';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContent(
  overrides: Partial<{ text: string; images: string[]; embeds: string[] }> = {},
) {
  return {
    text: 'Hello Threads',
    images: [],
    embeds: [],
    castHash: '0xabc',
    castUrl: 'https://warpcast.com/~/123',
    attribution: 'via ZAO OS',
    ...overrides,
  };
}

function mockTwoStepFetch(containerId = 'container-123', postId = 'post-456') {
  (fetch as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: containerId }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: postId }),
    });
}

function getCallUrl(callIndex: number): string {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  return calls[callIndex][0] as string;
}

function getCallBody(callIndex: number): URLSearchParams {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  return calls[callIndex][1].body as URLSearchParams;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  mockEnv.THREADS_ACCESS_TOKEN = 'token123';
  mockEnv.THREADS_USER_ID = 'user456';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// isThreadsConfigured
// ---------------------------------------------------------------------------

describe('isThreadsConfigured', () => {
  it('returns true when both token and userId are set', () => {
    mockEnv.THREADS_ACCESS_TOKEN = 'token123';
    mockEnv.THREADS_USER_ID = 'user456';
    expect(isThreadsConfigured()).toBe(true);
  });

  it('returns false when either token or userId is missing', () => {
    mockEnv.THREADS_ACCESS_TOKEN = undefined;
    mockEnv.THREADS_USER_ID = 'user456';
    expect(isThreadsConfigured()).toBe(false);

    mockEnv.THREADS_ACCESS_TOKEN = 'token123';
    mockEnv.THREADS_USER_ID = undefined;
    expect(isThreadsConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// publishToThreads
// ---------------------------------------------------------------------------

describe('publishToThreads', () => {
  it('throws "Threads not configured" when token is missing', async () => {
    mockEnv.THREADS_ACCESS_TOKEN = undefined;
    await expect(publishToThreads(makeContent())).rejects.toThrow('Threads not configured');
  });

  it('throws "Threads not configured" when userId is missing', async () => {
    mockEnv.THREADS_USER_ID = undefined;
    await expect(publishToThreads(makeContent())).rejects.toThrow('Threads not configured');
  });

  it('Step 1: POSTs to /{THREADS_USER_ID}/threads endpoint', async () => {
    mockTwoStepFetch();
    await publishToThreads(makeContent());
    const url = getCallUrl(0);
    expect(url).toContain('/user456/threads');
  });

  it('text-only post: sends media_type=TEXT in container params', async () => {
    mockTwoStepFetch();
    await publishToThreads(makeContent({ images: [] }));
    const body = getCallBody(0);
    expect(body.get('media_type')).toBe('TEXT');
    expect(body.get('image_url')).toBeNull();
  });

  it('image post: sends media_type=IMAGE and image_url in container params', async () => {
    mockTwoStepFetch();
    const imageUrl = 'https://example.com/photo.jpg';
    await publishToThreads(makeContent({ images: [imageUrl] }));
    const body = getCallBody(0);
    expect(body.get('media_type')).toBe('IMAGE');
    expect(body.get('image_url')).toBe(imageUrl);
  });

  it('Step 2: POSTs to /{THREADS_USER_ID}/threads_publish with creation_id=container-123', async () => {
    mockTwoStepFetch('container-123', 'post-456');
    await publishToThreads(makeContent());
    const url = getCallUrl(1);
    expect(url).toContain('/user456/threads_publish');
    const body = getCallBody(1);
    expect(body.get('creation_id')).toBe('container-123');
  });

  it('returns { postId, postUrl } with correct values', async () => {
    mockTwoStepFetch('container-123', 'post-456');
    const result = await publishToThreads(makeContent());
    expect(result.postId).toBe('post-456');
    expect(result.postUrl).toBe('https://www.threads.net/@thezao/post/post-456');
  });

  it('throws with error message when container creation fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'Invalid token' } }),
    });
    await expect(publishToThreads(makeContent())).rejects.toThrow('Invalid token');
  });

  it('throws when publish step returns non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'container-123' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });
    await expect(publishToThreads(makeContent())).rejects.toThrow('Threads publish failed');
  });
});

// ---------------------------------------------------------------------------
// refreshThreadsToken
// ---------------------------------------------------------------------------

describe('refreshThreadsToken', () => {
  it('returns data.access_token from the refresh response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access_token: 'new-token-xyz', expires_in: 5183944 }),
    });
    const token = await refreshThreadsToken();
    expect(token).toBe('new-token-xyz');
  });

  it('throws "Threads token refresh failed" on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Expired token' } }),
    });
    await expect(refreshThreadsToken()).rejects.toThrow('Threads token refresh failed');
  });
});
