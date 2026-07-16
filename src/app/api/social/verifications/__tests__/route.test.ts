import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetVerifications } = vi.hoisted(() => ({
  mockGetVerifications: vi.fn(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getAccountVerifications: (fid: number) => mockGetVerifications(fid),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/social/verifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVerifications.mockResolvedValue({ verified_addresses: ['0xabc'] });
  });

  it('returns 400 when fid is missing', async () => {
    const res = await GET(makeGetRequest('/api/social/verifications'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid fid');
  });

  it('returns 400 when fid is not a positive integer', async () => {
    const res = await GET(makeGetRequest('/api/social/verifications', { fid: '-3' }));
    expect(res.status).toBe(400);
  });

  it('coerces a numeric-string fid and returns verifications', async () => {
    const res = await GET(makeGetRequest('/api/social/verifications', { fid: '123' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified_addresses: ['0xabc'] });
    expect(mockGetVerifications).toHaveBeenCalledWith(123);
  });

  it('is intentionally public — succeeds with no session (see route doc comment)', async () => {
    // This route has no session guard by design (public Farcaster data, public
    // member-profile page). This test locks that in so a future guard-sweep does
    // not "fix" it into a 401 and break logged-out profile viewing.
    const res = await GET(makeGetRequest('/api/social/verifications', { fid: '123' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 when the neynar lookup throws', async () => {
    mockGetVerifications.mockRejectedValue(new Error('neynar down'));
    const res = await GET(makeGetRequest('/api/social/verifications', { fid: '123' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch verifications');
  });
});
