import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetUserByFid = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: (fid: number) => mockGetUserByFid(fid),
}));

import { GET } from '@/app/api/users/wallet/route';

describe('GET /api/users/wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no fid', async () => {
    mockGetSessionData.mockResolvedValue({});
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetUserByFid.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns wallet addresses when user found', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetUserByFid.mockResolvedValue({
      verified_addresses: { eth_addresses: ['0xabc', '0xdef'] },
      custody_address: '0xcustody',
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verifiedAddresses).toEqual(['0xabc', '0xdef']);
    expect(body.custodyAddress).toBe('0xcustody');
  });

  it('returns empty arrays when user has no addresses', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetUserByFid.mockResolvedValue({});
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verifiedAddresses).toEqual([]);
    expect(body.custodyAddress).toBeNull();
  });

  it('returns 500 when getUserByFid throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetUserByFid.mockRejectedValue(new Error('neynar down'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch wallet');
  });
});
