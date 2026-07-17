// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockFollowUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({ followUser: mockFollowUser }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10, signerUuid: 'signer-abc' };

describe('POST /api/users/follow-batch', () => {
  it('returns 401 when no session or missing signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/users/follow-batch', { targetFids: [1, 2] });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty targetFids array', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/follow-batch', { targetFids: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns followed:0 when targetFids only contains self', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/follow-batch', { targetFids: [10] });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.followed).toBe(0);
  });

  it('follows multiple users and returns correct count', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFollowUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/follow-batch', { targetFids: [1, 2, 3] });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.followed).toBe(3);
    expect(body.failed).toBe(0);
  });

  it('reports failed count when followUser throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFollowUser.mockRejectedValue(new Error('Neynar error'));
    const req = makePostRequest('/api/users/follow-batch', { targetFids: [1, 2] });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.failed).toBeGreaterThan(0);
  });
});
