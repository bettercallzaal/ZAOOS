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

// Mock fetch at global scope
global.fetch = vi.fn();

import { DELETE, POST } from '../route';

/**
 * Build a chain that supports upsert→await and update→eq→await.
 * The chain is thenable so it resolves when awaited directly.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['upsert', 'update', 'eq', 'from'];
  for (const m of chainable) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/auth/listenbrainz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'test' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when token is missing', async () => {
    const res = await POST(makePostRequest('/api/auth/listenbrainz', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Token required');
  });

  it('returns 400 when token is empty string', async () => {
    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Token required');
  });

  it('validates token against ListenBrainz API', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ valid: true, user_name: 'alice' })),
    );

    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'test_token' }));

    expect(global.fetch).toHaveBeenCalledWith('https://api.listenbrainz.org/1/validate-token', {
      headers: { Authorization: 'Token test_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.username).toBe('alice');
  });

  it('returns 400 when ListenBrainz token is invalid', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ valid: false })),
    );

    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'bad_token' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid ListenBrainz token');
  });

  it('stores valid token in user_settings via upsert', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ valid: true, user_name: 'alice' })),
    );

    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'test_token' }));

    expect(res.status).toBe(200);
    expect(chain.upsert).toHaveBeenCalledWith(
      { fid: 123, listenbrainz_token: 'test_token' },
      { onConflict: 'fid' },
    );
  });

  it('returns 500 when supabase upsert throws', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('db error');
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ valid: true, user_name: 'alice' })),
    );

    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'test_token' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to save token');
  });

  it('returns 500 when fetch throws', async () => {
    mockFrom.mockReturnValue(makeChain({ error: null }));
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));

    const res = await POST(makePostRequest('/api/auth/listenbrainz', { token: 'test_token' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to save token');
  });
});

describe('DELETE /api/auth/listenbrainz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await DELETE();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('clears listenbrainz_token on success', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(chain.update).toHaveBeenCalledWith({ listenbrainz_token: null });
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('returns 500 when supabase update throws', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('db error');
    });

    const res = await DELETE();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to disconnect');
  });
});
