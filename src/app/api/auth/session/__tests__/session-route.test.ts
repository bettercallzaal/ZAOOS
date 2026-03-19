import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

import { GET } from '@/app/api/auth/session/route';

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  it('returns authenticated user data when session exists', async () => {
    const sessionData = { fid: 12345, username: 'testuser', isAdmin: false };
    mockGetSessionData.mockResolvedValue(sessionData);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.fid).toBe(12345);
    expect(body.username).toBe('testuser');
  });

  it('includes all session fields in response', async () => {
    const sessionData = {
      fid: 999,
      username: 'admin',
      isAdmin: true,
      displayName: 'Admin User',
    };
    mockGetSessionData.mockResolvedValue(sessionData);
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      authenticated: true,
      fid: 999,
      username: 'admin',
      isAdmin: true,
      displayName: 'Admin User',
    });
  });
});
