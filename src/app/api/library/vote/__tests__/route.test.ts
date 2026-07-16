import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/**
 * FIFO chain shared across every `.from()` call. The vote route makes several
 * round-trips per request (existence lookup, the mutation, up-count, down-count,
 * denormalized update) — a test queues one result per trip in call order.
 * `.maybeSingle()` and awaited `then` both draw from the same queue.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'insert', 'update', 'delete', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('POST /api/library/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'up' }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when the session has no fid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'up' }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Farcaster account required to vote');
  });

  it('returns 400 for an invalid vote_type', async () => {
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'sideways' }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 for a non-UUID entry_id', async () => {
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: 'nope', vote_type: 'up' }),
    );
    expect(res.status).toBe(400);
  });

  it('adds a new vote when none exists', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null, error: null }, // existence lookup: no prior vote
        { error: null }, // insert
        { count: 3 }, // up count
        { count: 1 }, // down count
        {}, // denormalized update
      ]),
    );
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'up' }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      action: 'added',
      vote_type: 'up',
      upvote_count: 3,
      downvote_count: 1,
    });
  });

  it('removes the vote when the same type is submitted again', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { id: 'v1', vote_type: 'up' }, error: null },
        { error: null }, // delete
        { count: 2 },
        { count: 0 },
        {},
      ]),
    );
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'up' }),
    );
    const body = await res.json();
    expect(body.action).toBe('removed');
    expect(body.vote_type).toBeNull();
    expect(body.upvote_count).toBe(2);
  });

  it('changes the vote when a different type is submitted', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { id: 'v1', vote_type: 'up' }, error: null },
        { error: null }, // update
        { count: 0 },
        { count: 5 },
        {},
      ]),
    );
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'down' }),
    );
    const body = await res.json();
    expect(body.action).toBe('changed');
    expect(body.vote_type).toBe('down');
    expect(body.downvote_count).toBe(5);
  });

  it('returns 500 when the existence lookup errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));
    const res = await POST(
      makePostRequest('/api/library/vote', { entry_id: VALID_UUID, vote_type: 'up' }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to process vote');
  });
});
