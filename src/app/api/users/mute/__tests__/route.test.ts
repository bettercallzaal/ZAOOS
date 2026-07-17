// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockMuteUser = vi.hoisted(() => vi.fn());
const mockUnmuteUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({
  muteUser: mockMuteUser,
  unmuteUser: mockUnmuteUser,
}));

import { DELETE, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1, signerUuid: 'signer-xyz' };

describe('POST /api/users/mute', () => {
  it('returns 401 when no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    const req = makePostRequest('/api/users/mute', { targetFid: 55 });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for a negative targetFid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/mute', { targetFid: -5 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true on valid mute', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockMuteUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/mute', { targetFid: 55 });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockMuteUser).toHaveBeenCalledWith('signer-xyz', 55);
  });

  it('returns 500 when muteUser throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockMuteUser.mockRejectedValue(new Error('Neynar down'));
    const req = makePostRequest('/api/users/mute', { targetFid: 55 });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/users/mute', () => {
  it('returns success:true on valid unmute', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockUnmuteUser.mockResolvedValue(undefined);
    const req = makePostRequest('/api/users/mute', { targetFid: 44 });
    const res = await DELETE(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
