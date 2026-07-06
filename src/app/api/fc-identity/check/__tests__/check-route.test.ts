import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckGating, mockScoreByFid } = vi.hoisted(() => ({
  mockCheckGating: vi.fn(),
  mockScoreByFid: vi.fn(),
}));

vi.mock('@/lib/fc-identity', () => ({
  checkGatingEligibility: (...a: unknown[]) => mockCheckGating(...a),
  getFcQualityScoreByFid: (...a: unknown[]) => mockScoreByFid(...a),
}));

import { GET } from '@/app/api/fc-identity/check/route';

const VALID_ADDR = '0x1234567890abcdef1234567890abcdef12345678';
const req = (q = '') => new NextRequest(`http://localhost:3000/api/fc-identity/check${q}`);

describe('GET /api/fc-identity/check', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400 when neither address nor fid is provided', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('address or fid required');
  });

  it('400 on a malformed address', async () => {
    const res = await GET(req('?address=0xnothex'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid address');
  });

  it('checks eligibility by address', async () => {
    mockCheckGating.mockResolvedValue({ eligible: true, score: 5n, fid: 100 });
    const res = await GET(req(`?address=${VALID_ADDR}&minScore=3`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe('address');
    expect(body.eligible).toBe(true);
    expect(body.score).toBe('5');
    expect(mockCheckGating).toHaveBeenCalledWith(VALID_ADDR, 3);
  });

  it('checks eligibility by fid', async () => {
    mockScoreByFid.mockResolvedValue(10n);
    const res = await GET(req('?fid=42&minScore=5'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe('fid');
    expect(body.fid).toBe(42);
    expect(body.score).toBe('10');
    expect(body.eligible).toBe(true);
  });

  it('502 with no leaked error details when the chain read throws', async () => {
    mockCheckGating.mockRejectedValue(new Error('RPC timeout at 0xdeadbeef internal'));
    const res = await GET(req(`?address=${VALID_ADDR}`));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Chain read failed');
    expect(body.details).toBeUndefined(); // internal error string must not reach the client
  });
});
