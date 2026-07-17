import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
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

import { GET } from '../route';

/**
 * A single chain object reused across every `.from()` call. Terminal awaits
 * (`then`) resolve to results in FIFO order, so a test queues one result per
 * DB round-trip the route makes (entries, then userVotes, then allVotes).
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'or', 'contains', 'order', 'range', 'eq', 'in']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('GET /api/library/entries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/library/entries'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns an empty entries list without querying votes', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res = await GET(makeGetRequest('/api/library/entries'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.entries).toEqual([]);
    expect(body.userVotes).toEqual({});
    expect(body.entryVoters).toEqual({});
    // Only the entries query runs when there are no entry ids.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('maps the current user vote and all voters per entry', async () => {
    const entries = [{ id: 'e1' }, { id: 'e2' }];
    const userVotes = [{ entry_id: 'e1', vote_type: 'up' }];
    const allVotes = [
      { entry_id: 'e1', fid: 123, vote_type: 'up' },
      { entry_id: 'e1', fid: 999, vote_type: 'down' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: entries, error: null },
        { data: userVotes, error: null },
        { data: allVotes, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/library/entries'));
    const body = await res.json();
    expect(body.entries).toEqual(entries);
    expect(body.userVotes).toEqual({ e1: 'up' });
    expect(body.entryVoters.e1).toHaveLength(2);
    expect(body.entryVoters.e1).toContainEqual({ fid: 999, vote_type: 'down' });
    expect(mockFrom).toHaveBeenCalledTimes(3);
  });

  it('sorts by upvote_count when sort=upvoted', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/entries', { sort: 'upvoted' }));
    expect(chain.order).toHaveBeenCalledWith('upvote_count', { ascending: false });
  });

  it('defaults to newest (created_at desc) sort', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/entries'));
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('applies a sanitized search filter', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/entries', { search: 'zao%,()' }));
    expect(chain.or).toHaveBeenCalledWith(
      'topic.ilike.%zao%,ai_summary.ilike.%zao%,note.ilike.%zao%',
    );
  });

  it('applies a tag contains filter', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/entries', { tag: 'Music' }));
    expect(chain.contains).toHaveBeenCalledWith('tags', ['Music']);
  });

  it('returns 500 when the entries query errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));
    const res = await GET(makeGetRequest('/api/library/entries'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch entries');
  });

  it('handles non-numeric limit gracefully by using default', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/library/entries', { limit: 'notanumber' }));
    expect(res.status).toBe(200);
    // Verify that range was called with default 50
    const rangeCalls = chain.range.mock.calls;
    expect(rangeCalls).toContainEqual([0, 49]); // default 50 means range(0, 49)
  });

  it('handles negative limit by using default', async () => {
    const chain = queuedChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/library/entries', { limit: '-5' }));
    expect(res.status).toBe(200);
    const rangeCalls = chain.range.mock.calls;
    expect(rangeCalls).toContainEqual([0, 49]); // default 50 means range(0, 49)
  });
});
