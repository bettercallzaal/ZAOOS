// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetUserByFid = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({ getUserByFid: mockGetUserByFid }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 456, username: 'zabal' };
const MOCK_USER = {
  fid: 456,
  custody_address: '0xabc',
  verified_addresses: { eth_addresses: ['0xdef', '0xghi'] },
};

describe('GET /api/users/wallet', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found in Neynar', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetUserByFid.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns verified addresses and custody address on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetUserByFid.mockResolvedValue(MOCK_USER);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verifiedAddresses).toEqual(['0xdef', '0xghi']);
    expect(body.custodyAddress).toBe('0xabc');
  });

  it('returns 500 when getUserByFid throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetUserByFid.mockRejectedValue(new Error('Neynar API down'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
