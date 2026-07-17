// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Intercepts both static and dynamic imports of @lens-chain/storage-client.
const mockUploadAsJson = vi.hoisted(() => vi.fn());
vi.mock('@lens-chain/storage-client', () => ({
  StorageClient: {
    create: vi.fn(() => ({ uploadAsJson: mockUploadAsJson })),
  },
}));

import { publishToLens } from '../lens';

const MOCK_CONTENT = {
  text: 'Hello from ZAO',
  images: [] as string[],
};

function stubFetch(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ json: async () => body }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('publishToLens', () => {
  it('returns postId and hey.xyz URL on a successful post', async () => {
    mockUploadAsJson.mockResolvedValue({ uri: 'lens://grove/test-content-uri' });
    stubFetch({ data: { post: { hash: '0xabc123def456' } } });

    const result = await publishToLens('access-tok', 'refresh-tok', MOCK_CONTENT);
    expect(result.postId).toBe('0xabc123def456');
    expect(result.postUrl).toContain('hey.xyz/posts/0xabc123def456');
  });

  it('overrides postUrl with the handle profile when handle is provided', async () => {
    mockUploadAsJson.mockResolvedValue({ uri: 'lens://grove/handle-test' });
    stubFetch({ data: { post: { hash: '0xdeadbeef' } } });

    const result = await publishToLens('access-tok', 'refresh-tok', MOCK_CONTENT, 'zabal.lens');
    expect(result.postUrl).toBe('https://hey.xyz/u/zabal');
  });

  it('throws when the post response contains a reason (not hash)', async () => {
    mockUploadAsJson.mockResolvedValue({ uri: 'lens://grove/fail-uri' });
    stubFetch({ data: { post: { reason: 'Insufficient balance' } } });

    await expect(publishToLens('access-tok', 'refresh-tok', MOCK_CONTENT)).rejects.toThrow(
      'Insufficient balance',
    );
  });

  it('throws when the GraphQL response contains errors', async () => {
    mockUploadAsJson.mockResolvedValue({ uri: 'lens://grove/graphql-error' });
    stubFetch({ errors: [{ message: 'Not authenticated' }, { message: 'Rate limit' }] });

    await expect(publishToLens('access-tok', 'refresh-tok', MOCK_CONTENT)).rejects.toThrow(
      'Not authenticated',
    );
  });

  it('retries with refreshed token on UNAUTHENTICATED error', async () => {
    mockUploadAsJson.mockResolvedValue({ uri: 'lens://grove/refresh-test' });

    const fetchMock = vi
      .fn()
      // 1st call: lensPost → UNAUTHENTICATED
      .mockResolvedValueOnce({ json: async () => ({ errors: [{ message: 'UNAUTHENTICATED' }] }) })
      // 2nd call: refreshToken mutation → new tokens
      .mockResolvedValueOnce({
        json: async () => ({
          data: { refresh: { accessToken: 'new-access', refreshToken: 'new-refresh' } },
        }),
      })
      // 3rd call: lensPost retry → success
      .mockResolvedValueOnce({ json: async () => ({ data: { post: { hash: '0xretried' } } }) });

    vi.stubGlobal('fetch', fetchMock);

    const result = await publishToLens('old-access', 'valid-refresh', MOCK_CONTENT);
    expect(result.postId).toBe('0xretried');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
