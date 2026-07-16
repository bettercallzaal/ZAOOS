import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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

import { GET, POST } from '../route';

/**
 * Chain whose chainable methods are inspectable spies. `.maybeSingle()` and an
 * awaited `then` both resolve to `result`, so a single chain serves both the GET
 * (select→maybeSingle) and POST (update→eq→await) call shapes.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'update', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/members/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when the user row is not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('User not found');
  });

  it('returns the profile fields on success', async () => {
    const user = { bio: 'gm', location: 'Base', tags: ['dev'] };
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(user);
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db down') }));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to load profile');
  });
});

describe('POST /api/members/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/members/me', { bio: 'hi' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid website_url', async () => {
    const res = await POST(makePostRequest('/api/members/me', { website_url: 'not-a-url' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 for a malformed preferred_wallet', async () => {
    const res = await POST(makePostRequest('/api/members/me', { preferred_wallet: '0xnope' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no updatable fields are supplied', async () => {
    const res = await POST(makePostRequest('/api/members/me', {}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('No fields to update');
  });

  it('updates only the supplied fields and reports which changed', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(makePostRequest('/api/members/me', { bio: 'gm', tags: ['dev'] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, updated: ['bio', 'tags'] });
    expect(chain.update).toHaveBeenCalledWith({ bio: 'gm', tags: ['dev'] });
  });

  it('coerces empty strings to null', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(makePostRequest('/api/members/me', { bio: '', website_url: '' }));
    expect(chain.update).toHaveBeenCalledWith({ bio: null, website_url: null });
  });

  it('scopes the update to the session fid and active users', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(makePostRequest('/api/members/me', { bio: 'gm' }));
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('returns 500 when the update errors', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('db down') }));
    const res = await POST(makePostRequest('/api/members/me', { bio: 'gm' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to update profile');
  });
});
