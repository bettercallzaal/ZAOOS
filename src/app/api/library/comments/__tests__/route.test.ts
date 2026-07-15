import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockModerate } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockModerate: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/moderation/moderate', () => ({
  moderateContent: (t: string) => mockModerate(t),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

/** FIFO chain: `.single()` and awaited `then` both draw from one result queue. */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'insert', 'update', 'eq', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('GET /api/library/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/library/comments', { entry_id: VALID_UUID }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when entry_id is missing', async () => {
    const res = await GET(makeGetRequest('/api/library/comments'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Valid entry_id required');
  });

  it('returns 400 when entry_id is not a UUID', async () => {
    const res = await GET(makeGetRequest('/api/library/comments', { entry_id: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('returns comments for a valid entry_id', async () => {
    const comments = [{ id: 'c1', body: 'hi' }];
    mockFrom.mockReturnValue(queuedChain([{ data: comments, error: null }]));
    const res = await GET(makeGetRequest('/api/library/comments', { entry_id: VALID_UUID }));
    expect(res.status).toBe(200);
    expect((await res.json()).comments).toEqual(comments);
  });

  it('coerces a null comment list to []', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: null }]));
    const res = await GET(makeGetRequest('/api/library/comments', { entry_id: VALID_UUID }));
    expect((await res.json()).comments).toEqual([]);
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));
    const res = await GET(makeGetRequest('/api/library/comments', { entry_id: VALID_UUID }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch comments');
  });
});

describe('POST /api/library/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockModerate.mockResolvedValue({ action: 'allow' });
  });

  const validBody = { entry_id: VALID_UUID, body: 'Great research!' };

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/library/comments', validBody));
    expect(res.status).toBe(401);
  });

  it('returns 403 when the session has no fid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));
    const res = await POST(makePostRequest('/api/library/comments', validBody));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Farcaster account required to comment');
  });

  it('returns 400 for an empty comment body', async () => {
    const res = await POST(
      makePostRequest('/api/library/comments', { entry_id: VALID_UUID, body: '' }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 for a non-UUID entry_id', async () => {
    const res = await POST(makePostRequest('/api/library/comments', { entry_id: 'x', body: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when moderation flags the comment', async () => {
    mockModerate.mockResolvedValue({ action: 'hide' });
    const res = await POST(makePostRequest('/api/library/comments', validBody));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Comment flagged by moderation');
  });

  it('inserts the comment and returns it on success', async () => {
    const comment = { id: 'c1', body: 'Great research!', fid: 123 };
    mockFrom.mockReturnValue(queuedChain([{ data: comment, error: null }, { count: 4 }, {}]));
    const res = await POST(makePostRequest('/api/library/comments', validBody));
    expect(res.status).toBe(200);
    expect((await res.json()).comment).toEqual(comment);
    expect(mockModerate).toHaveBeenCalledWith('Great research!');
  });

  it('returns 500 when the insert errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));
    const res = await POST(makePostRequest('/api/library/comments', validBody));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to post comment');
  });
});
