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
 * A Supabase query chain that records the filter methods called on it and
 * resolves (when awaited) to `result`. Lets tests assert search/category
 * filters were applied without a live DB.
 */
function docsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'ilike', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  // The route awaits the chain directly (no .single()).
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/library/docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/library/docs'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns docs on success (empty list coerced to [])', async () => {
    mockFrom.mockReturnValue(docsChain({ data: null, error: null }));
    const res = await GET(makeGetRequest('/api/library/docs'));
    expect(res.status).toBe(200);
    expect((await res.json()).docs).toEqual([]);
  });

  it('returns docs when present', async () => {
    const docs = [{ id: 1, title: 'Doc One', category: 'infra' }];
    mockFrom.mockReturnValue(docsChain({ data: docs, error: null }));
    const res = await GET(makeGetRequest('/api/library/docs'));
    expect((await res.json()).docs).toEqual(docs);
  });

  it('applies an ilike title filter when search is provided', async () => {
    const chain = docsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/docs', { search: 'staking' }));
    expect(chain.ilike).toHaveBeenCalledWith('title', '%staking%');
  });

  it('strips PostgREST-unsafe characters from the search term', async () => {
    const chain = docsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/docs', { search: 'a%b,c()' }));
    expect(chain.ilike).toHaveBeenCalledWith('title', '%abc%');
  });

  it('does not filter when the sanitized search is empty', async () => {
    const chain = docsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/docs', { search: '%,()' }));
    expect(chain.ilike).not.toHaveBeenCalled();
  });

  it('applies a category equality filter when provided', async () => {
    const chain = docsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/library/docs', { category: 'music' }));
    expect(chain.eq).toHaveBeenCalledWith('category', 'music');
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(docsChain({ data: null, error: new Error('db down') }));
    const res = await GET(makeGetRequest('/api/library/docs'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch docs');
  });
});
