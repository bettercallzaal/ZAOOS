// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockGetAccounts = vi.hoisted(() => vi.fn());
vi.mock('@/lib/publish/hive', () => ({
  getHiveClient: vi.fn(() => ({ database: { getAccounts: mockGetAccounts } })),
  encryptPostingKey: vi.fn().mockReturnValue('encrypted-posting-key'),
}));

const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { DELETE, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10 };
const VALID_BODY = { username: 'zabal', postingKey: 'STM5...' };

describe('POST /api/platforms/hive', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/platforms/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/platforms/hive', { username: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when Hive account not found on-chain', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetAccounts.mockResolvedValue([]);
    const req = makePostRequest('/api/platforms/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when Supabase update fails', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetAccounts.mockResolvedValue([{ name: 'zabal' }]);
    mockEq.mockResolvedValue({ error: { message: 'DB fail' } });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
    const req = makePostRequest('/api/platforms/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns success:true with username on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetAccounts.mockResolvedValue([{ name: 'zabal' }]);
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
    const req = makePostRequest('/api/platforms/hive', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.username).toBe('zabal');
  });
});

describe('DELETE /api/platforms/hive', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it('returns success:true when disconnected', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
    const res = await DELETE();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
