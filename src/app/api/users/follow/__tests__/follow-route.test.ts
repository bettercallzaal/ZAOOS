import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockFollowUser = vi.hoisted(() => vi.fn());
const mockUnfollowUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  followUser: (...args: unknown[]) => mockFollowUser(...args),
  unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
}));

import { POST, DELETE } from '@/app/api/users/follow/route';

const API_PATH = '/api/users/follow';

function postRequest(body: unknown) {
  return makeRequest(API_PATH, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function deleteRequest(body: unknown) {
  return makeRequest(API_PATH, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}

describe('POST /api/users/follow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(postRequest({ targetFid: 456 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Signer required');
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
    const res = await POST(postRequest({ targetFid: 456 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Signer required');
  });

  it('returns 400 for invalid body — missing targetFid', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for invalid body — targetFid not a positive int', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    const res = await POST(postRequest({ targetFid: -5 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid body — targetFid is a string', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    const res = await POST(postRequest({ targetFid: 'not-a-number' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid body — targetFid is a float', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    const res = await POST(postRequest({ targetFid: 3.14 }));
    expect(res.status).toBe(400);
  });

  it('calls followUser and returns success', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    mockFollowUser.mockResolvedValue(undefined);
    const res = await POST(postRequest({ targetFid: 456 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockFollowUser).toHaveBeenCalledWith('signer-abc', [456]);
  });

  it('returns 500 when followUser throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    mockFollowUser.mockRejectedValue(new Error('neynar down'));
    const res = await POST(postRequest({ targetFid: 456 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to follow');
  });
});

describe('DELETE /api/users/follow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await DELETE(deleteRequest({ targetFid: 456 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Signer required');
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
    const res = await DELETE(deleteRequest({ targetFid: 456 }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    const res = await DELETE(deleteRequest({ targetFid: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('calls unfollowUser and returns success', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    mockUnfollowUser.mockResolvedValue(undefined);
    const res = await DELETE(deleteRequest({ targetFid: 789 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUnfollowUser).toHaveBeenCalledWith('signer-abc', [789]);
  });

  it('returns 500 when unfollowUser throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, signerUuid: 'signer-abc' });
    mockUnfollowUser.mockRejectedValue(new Error('neynar down'));
    const res = await DELETE(deleteRequest({ targetFid: 789 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to unfollow');
  });
});
