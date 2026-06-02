import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
  // Real behavior: strip the server-only signerUuid before responding.
  toPublicSession: (s: Record<string, unknown>) => ({ ...s, signerUuid: null }),
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

  it('includes session fields in response', async () => {
    const sessionData = {
      fid: 999,
      username: 'admin',
      isAdmin: true,
      displayName: 'Admin User',
      hasSigner: true,
    };
    mockGetSessionData.mockResolvedValue(sessionData);
    const res = await GET();
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.fid).toBe(999);
    expect(body.isAdmin).toBe(true);
    expect(body.hasSigner).toBe(true);
  });

  it('never ships the signerUuid posting credential to the client (A1)', async () => {
    mockGetSessionData.mockResolvedValue({
      fid: 999,
      username: 'admin',
      isAdmin: false,
      signerUuid: 'secret-signer-uuid',
      hasSigner: true,
    });
    const res = await GET();
    const body = await res.json();
    expect(body.signerUuid).toBeNull();
    expect(JSON.stringify(body)).not.toContain('secret-signer-uuid');
    expect(body.hasSigner).toBe(true);
  });
});
