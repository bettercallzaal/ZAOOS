import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

global.fetch = mockFetch;

import { POST } from '../route';

describe('POST /api/neynar/follow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ signerUuid: 'test-signer-uuid' }),
    );
    process.env.NEYNAR_API_KEY = 'test-neynar-key';
  });

  afterEach(() => {
    delete process.env.NEYNAR_API_KEY;
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));
    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for missing targetFid', async () => {
    const res = await POST(makePostRequest('/api/neynar/follow', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for non-positive targetFid', async () => {
    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: -1 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-integer targetFid', async () => {
    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 3.14 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for zero targetFid', async () => {
    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 0 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('successfully follows a user when Neynar returns 2xx', async () => {
    const neynarResponse = { result: { success: true } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => neynarResponse,
    });

    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result).toEqual(neynarResponse);

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://api.neynar.com/v2/farcaster/user/follow');
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers['content-type']).toBe('application/json');
    expect(callArgs[1].headers['x-api-key']).toBe('test-neynar-key');
    expect(callArgs[1].body).toBe(
      JSON.stringify({
        signer_uuid: 'test-signer-uuid',
        target_fids: [456],
      }),
    );
  });

  it('returns 500 when Neynar returns non-2xx status', async () => {
    const errorResponse = { error: 'User not found' };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => errorResponse,
    });

    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to follow user');
  });

  it('returns 500 when Neynar API call throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when response.json() throws', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const res = await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('sends correct signer_uuid and target_fids to Neynar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: {} }),
    });

    await POST(makePostRequest('/api/neynar/follow', { targetFid: 789 }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          signer_uuid: 'test-signer-uuid',
          target_fids: [789],
        }),
      }),
    );
  });

  it('respects NEYNAR_API_KEY from environment', async () => {
    const originalKey = process.env.NEYNAR_API_KEY;
    process.env.NEYNAR_API_KEY = 'test-neynar-key-123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: {} }),
    });

    await POST(makePostRequest('/api/neynar/follow', { targetFid: 456 }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-neynar-key-123',
        }),
      }),
    );

    process.env.NEYNAR_API_KEY = originalKey;
  });
});
