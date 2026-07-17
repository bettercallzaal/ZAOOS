// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockBlockUser = vi.hoisted(() => vi.fn());
const mockUnblockUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({
  blockUser: mockBlockUser,
  unblockUser: mockUnblockUser,
}));

import { DELETE, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1, signerUuid: 'signer-abc' };

describe('POST /api/users/block', () => {
  it('returns 401 when no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    const req = makePostRequest('/api/users/block', { targetFid: 99 });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/block', { targetFid: 'not-a-number' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true on valid block', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockBlockUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/block', { targetFid: 99 });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockBlockUser).toHaveBeenCalledWith('signer-abc', 99);
  });

  it('returns 500 when blockUser throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockBlockUser.mockRejectedValue(new Error('Neynar error'));
    const req = makePostRequest('/api/users/block', { targetFid: 99 });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/users/block', () => {
  it('returns success:true on valid unblock', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockUnblockUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/block', { targetFid: 77 });
    const res = await DELETE(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
