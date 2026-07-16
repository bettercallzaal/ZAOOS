import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFetch } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
global.fetch = mockFetch;

import { POST } from '../route';

describe('POST /api/neynar/recast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to authenticated session with signerUuid
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ signerUuid: '550e8400-e29b-41d4-a716-446655440000' }),
    );
    // Default Neynar API key
    process.env.NEYNAR_API_KEY = 'test-key-12345';
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'abc123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized — no signer');
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));
    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'abc123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized — no signer');
  });

  it('returns 400 for missing castHash', async () => {
    const res = await POST(makePostRequest('/api/neynar/recast', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for empty castHash string', async () => {
    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-string castHash', async () => {
    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 12345 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('successfully recasts when Neynar API returns ok', async () => {
    const neynarResponse = { success: true, hash: 'recast-hash-123' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => neynarResponse,
    });

    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'cast-abc123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result).toEqual(neynarResponse);

    // Verify fetch was called with correct params
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.neynar.com/v2/farcaster/reaction',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-key-12345',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({
          signer_uuid: '550e8400-e29b-41d4-a716-446655440000',
          reaction_type: 'recast',
          target: 'cast-abc123',
        }),
      }),
    );
  });

  it('returns 500 when Neynar API returns not ok', async () => {
    const errorResponse = { error: 'Invalid cast hash' };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'bad-hash' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to recast');
  });

  it('returns 500 when fetch throws an error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'cast-abc123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when response.json() throws', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const res = await POST(makePostRequest('/api/neynar/recast', { castHash: 'cast-abc123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('ignores extra fields in request body', async () => {
    const neynarResponse = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => neynarResponse,
    });

    const res = await POST(
      makePostRequest('/api/neynar/recast', {
        castHash: 'cast-abc123',
        extraField: 'ignored',
        anotherExtra: 12345,
      }),
    );
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
