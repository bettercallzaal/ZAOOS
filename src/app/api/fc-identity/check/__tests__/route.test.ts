// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockCheckGatingEligibility = vi.hoisted(() => vi.fn());
const mockGetFcQualityScoreByFid = vi.hoisted(() => vi.fn());

vi.mock('@/lib/fc-identity', () => ({
  checkGatingEligibility: mockCheckGatingEligibility,
  getFcQualityScoreByFid: mockGetFcQualityScoreByFid,
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const VALID_ADDRESS = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

describe('GET /api/fc-identity/check', () => {
  it('returns 400 when neither address nor fid is provided', async () => {
    const req = makeGetRequest('/api/fc-identity/check');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns address-type result with stringified score', async () => {
    mockCheckGatingEligibility.mockResolvedValue({
      eligible: true,
      fid: 123,
      score: BigInt(75),
    });
    const req = makeGetRequest('/api/fc-identity/check', { address: VALID_ADDRESS });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.type).toBe('address');
    expect(body.eligible).toBe(true);
    expect(body.score).toBe('75'); // BigInt serialized to string
  });

  it('returns fid-type result with eligible based on minScore', async () => {
    mockGetFcQualityScoreByFid.mockResolvedValue(BigInt(50));
    const req = makeGetRequest('/api/fc-identity/check', { fid: '456', minScore: '40' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.type).toBe('fid');
    expect(body.fid).toBe(456);
    expect(body.score).toBe('50');
    expect(body.eligible).toBe(true);
  });

  it('returns 502 when chain read throws', async () => {
    mockCheckGatingEligibility.mockRejectedValue(new Error('RPC timeout'));
    const req = makeGetRequest('/api/fc-identity/check', { address: VALID_ADDRESS });
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
