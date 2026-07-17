// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetUserByFid = vi.hoisted(() => vi.fn());
const mockCheckAllowlist = vi.hoisted(() => vi.fn());

vi.mock('@/lib/farcaster/neynar', () => ({ getUserByFid: mockGetUserByFid }));
vi.mock('@/lib/gates/allowlist', () => ({ checkAllowlist: mockCheckAllowlist }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_NEYNAR_USER = {
  fid: 123,
  username: 'zabal',
  display_name: 'ZAO AL',
  pfp_url: 'https://pfp.url/zabal.jpg',
  verified_addresses: { eth_addresses: [] },
};

describe('POST /api/miniapp/auth-context', () => {
  it('returns 400 for invalid (non-positive) fid', async () => {
    const req = makePostRequest('/api/miniapp/auth-context', { fid: 'bad' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the FID is not found in Neynar', async () => {
    mockGetUserByFid.mockResolvedValue(null);
    const req = makePostRequest('/api/miniapp/auth-context', { fid: 999 });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns allowlisted:false when neither FID nor wallet passes the gate', async () => {
    mockGetUserByFid.mockResolvedValue(MOCK_NEYNAR_USER);
    mockCheckAllowlist.mockResolvedValue({ allowed: false });
    const req = makePostRequest('/api/miniapp/auth-context', { fid: 123 });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.allowlisted).toBe(false);
    expect(body.username).toBe('zabal');
  });

  it('returns allowlisted:true when FID is in the allowlist', async () => {
    mockGetUserByFid.mockResolvedValue(MOCK_NEYNAR_USER);
    mockCheckAllowlist.mockResolvedValue({ allowed: true });
    const req = makePostRequest('/api/miniapp/auth-context', { fid: 123 });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.allowlisted).toBe(true);
    expect(body.fid).toBe(123);
  });
});
