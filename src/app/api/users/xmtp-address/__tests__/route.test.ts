// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockEq = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq }),
    }),
  },
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 42 };
const VALID_ADDRESS = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

describe('POST /api/users/xmtp-address', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/users/xmtp-address', { xmtpAddress: VALID_ADDRESS });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid Ethereum address', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/xmtp-address', { xmtpAddress: 'not-an-address' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when Supabase update fails', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockEq.mockResolvedValue({ error: { message: 'DB error' } });
    const req = makePostRequest('/api/users/xmtp-address', { xmtpAddress: VALID_ADDRESS });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns ok:true on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockEq.mockResolvedValue({ error: null });
    const req = makePostRequest('/api/users/xmtp-address', { xmtpAddress: VALID_ADDRESS });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
