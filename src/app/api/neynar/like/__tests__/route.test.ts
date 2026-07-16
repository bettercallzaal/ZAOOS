import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch for Neynar API calls
global.fetch = vi.fn();

import { POST } from '../route';

describe('POST /api/neynar/like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ signerUuid: '550e8400-e29b-41d4-a716-446655440000' }),
    );
    process.env.NEYNAR_API_KEY = 'test-neynar-key';
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'abc123' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized — no signer' });
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));
    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'abc123' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized — no signer' });
  });

  it('returns 400 when castHash is missing', async () => {
    const res = await POST(makePostRequest('/api/neynar/like', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is empty', async () => {
    const res = await POST(makePostRequest('/api/neynar/like', { castHash: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is not a string', async () => {
    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 123 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('calls Neynar API with correct payload on success', async () => {
    const mockNeynarData = { id: 'like1' };
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockNeynarData), { status: 200 }),
    );

    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'hash0x123abc' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.result).toEqual(mockNeynarData);

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.neynar.com/v2/farcaster/reaction',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-neynar-key',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({
          signer_uuid: '550e8400-e29b-41d4-a716-446655440000',
          reaction_type: 'like',
          target: 'hash0x123abc',
        }),
      }),
    );
  });

  it('returns 500 when Neynar API returns an error response', async () => {
    const mockErrorResponse = { error: 'Invalid signer' };
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockErrorResponse), { status: 400 }),
    );

    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'hash0x123abc' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to like cast' });
  });

  it('returns 500 when Neynar API is unreachable', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'hash0x123abc' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });

  it('returns 500 when response body cannot be parsed', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('invalid json', { status: 200 }));

    const res = await POST(makePostRequest('/api/neynar/like', { castHash: 'hash0x123abc' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});
