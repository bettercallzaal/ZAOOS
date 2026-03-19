import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockIsWearerOfHat = vi.hoisted(() => vi.fn());
const mockGetWornHats = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/hats/client', () => ({
  isWearerOfHat: (...args: unknown[]) => mockIsWearerOfHat(...args),
  getWornHats: (...args: unknown[]) => mockGetWornHats(...args),
}));

import { GET } from '@/app/api/hats/check/route';

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/hats/check');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe('GET /api/hats/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeRequest({ wallet: '0x1234567890abcdef1234567890abcdef12345678' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid wallet address', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    const res = await GET(makeRequest({ wallet: 'not-a-wallet' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for missing wallet parameter', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('checks a specific hat when hatId is provided', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    mockIsWearerOfHat.mockResolvedValue(true);

    const wallet = '0x1234567890abcdef1234567890abcdef12345678';
    const res = await GET(makeRequest({ wallet, hatId: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet).toBe(wallet);
    expect(body.isWearer).toBe(true);
    expect(mockIsWearerOfHat).toHaveBeenCalled();
  });

  it('returns all worn roles when no hatId is provided', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    mockGetWornHats.mockResolvedValue([BigInt(100), BigInt(200)]);

    const wallet = '0x1234567890abcdef1234567890abcdef12345678';
    const res = await GET(makeRequest({ wallet }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet).toBe(wallet);
    expect(body.roles).toBeInstanceOf(Array);
    expect(mockGetWornHats).toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    mockGetWornHats.mockRejectedValue(new Error('RPC error'));

    const wallet = '0x1234567890abcdef1234567890abcdef12345678';
    const res = await GET(makeRequest({ wallet }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to check hat status');
  });
});
