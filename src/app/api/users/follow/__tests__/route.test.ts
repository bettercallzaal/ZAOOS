// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockFollowUser = vi.hoisted(() => vi.fn());
const mockUnfollowUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({
  followUser: mockFollowUser,
  unfollowUser: mockUnfollowUser,
}));

import { DELETE, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1, signerUuid: 'signer-uuid-abc' };

describe('POST /api/users/follow', () => {
  it('returns 401 when no signerUuid in session', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    const req = makePostRequest('/api/users/follow', { targetFid: 99 });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input (non-positive fid)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/follow', { targetFid: -1 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true on a valid follow', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFollowUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/follow', { targetFid: 99 });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockFollowUser).toHaveBeenCalledWith('signer-uuid-abc', [99]);
  });

  it('returns 500 when followUser throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFollowUser.mockRejectedValue(new Error('Neynar error'));
    const req = makePostRequest('/api/users/follow', { targetFid: 99 });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/users/follow', () => {
  it('returns success:true on a valid unfollow', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockUnfollowUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/follow', { targetFid: 77 });
    const res = await DELETE(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUnfollowUser).toHaveBeenCalledWith('signer-uuid-abc', [77]);
  });
});
