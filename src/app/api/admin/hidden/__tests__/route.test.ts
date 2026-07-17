// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockMaybeSingleOrSingle = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => mockMaybeSingleOrSingle()),
    }),
  },
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_ADMIN_SESSION = { fid: 1, isAdmin: true };
const MOCK_USER_SESSION = { fid: 2, isAdmin: false };

describe('GET /api/admin/hidden', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_USER_SESSION);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 200 with messages when admin', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_ADMIN_SESSION);
    const mockMessages = [{ id: 1, content: 'hidden msg', hidden_at: '2026-01-01' }];
    mockMaybeSingleOrSingle.mockResolvedValue({ data: mockMessages, error: null });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_ADMIN_SESSION);
    mockMaybeSingleOrSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
